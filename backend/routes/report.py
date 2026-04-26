import io
import json
import logging
import os
from datetime import datetime

from flask import Blueprint, request, jsonify, send_file
from pypdf import PdfReader, PdfWriter
from db import supabase
from integrations.openai_client import get_openai_client

logger = logging.getLogger(__name__)
report_bp = Blueprint("report", __name__)

# Path to the fillable template PDF
# Resolve relative to this file: backend/routes/report.py -> ../../frontend/public/template.pdf
TEMPLATE_PATH = os.path.join(
    os.path.dirname(__file__), "..", "..", "frontend", "public", "template.pdf"
)

SYSTEM_PROMPT = """You are a clinical documentation AI for NurseFlow.
You will receive:
1. A list of fillable PDF form field names from a nurse handoff report template.
2. Patient information (name, age, room, acuity, reason for admission).
3. A list of events from the patient's record during a specific time period.
4. The patient's latest vitals (if available).

Your job: produce a JSON object where each key is one of the PDF form field names and the value is the text that should be filled into that field. The content must be clinically useful for an incoming nurse doing a shift handoff.

Rules:
- Only use the exact field names provided. Do not invent new keys.
- If a field doesn't apply or you have no data for it, set its value to "N/A".
- Keep text concise but clinically complete. Summarize events chronologically.
- Focus on: current status, key events, medication changes, vitals trends, alerts, pending tasks, and family communication.
- For any "summary" or "notes" fields, write a brief narrative a nurse can quickly scan.
- Return ONLY valid JSON. No markdown, no explanation outside the JSON.
"""


@report_bp.route("/report/generate", methods=["POST"])
def generate_report():
    data = request.get_json(force=True)
    patient_id = data.get("patient_id")
    from_date = data.get("from_date")
    to_date = data.get("to_date")

    if not patient_id or not from_date or not to_date:
        return jsonify({"error": "patient_id, from_date, and to_date are required"}), 400

    if not os.path.exists(TEMPLATE_PATH):
        return jsonify({"error": "template.pdf not found"}), 500

    try:
        # --- 1. Read the fillable PDF and extract form field names ---
        reader = PdfReader(TEMPLATE_PATH)
        fields = reader.get_fields() or {}
        field_names = list(fields.keys())

        if not field_names:
            return jsonify({"error": "No fillable form fields found in template.pdf"}), 500

        # --- 2. Fetch patient info ---
        patient_result = supabase.table("patients").select("*, rooms(*)").eq("id", patient_id).execute()
        patient = patient_result.data[0] if patient_result.data else None
        if not patient:
            return jsonify({"error": "Patient not found"}), 404

        # --- 3. Fetch events for this patient in the time range ---
        events_result = (
            supabase.table("events")
            .select("*")
            .gte("created_at", from_date)
            .lte("created_at", to_date)
            .order("created_at", desc=False)
            .execute()
        )
        # Filter to events that reference this patient in their payload
        patient_events = []
        for evt in (events_result.data or []):
            payload = evt.get("payload") or {}
            if isinstance(payload, str):
                payload = json.loads(payload)
            if payload.get("patient_id") == patient_id:
                patient_events.append(evt)

        # --- 4. Fetch latest vitals ---
        vitals_result = (
            supabase.table("vitals")
            .select("*")
            .eq("patient_id", patient_id)
            .order("recorded_at", desc=True)
            .limit(5)
            .execute()
        )
        vitals = vitals_result.data or []

        # --- 5. Build context for OpenAI ---
        room_data = patient.get("rooms") or {}
        context = {
            "pdf_field_names": field_names,
            "patient": {
                "name": patient.get("name"),
                "age": patient.get("age"),
                "acuity_level": patient.get("acuity_level"),
                "reason": patient.get("reason"),
                "room_number": room_data.get("number"),
                "admitted_at": patient.get("admitted_at"),
                "family_phone": patient.get("family_phone"),
            },
            "report_period": {"from": from_date, "to": to_date},
            "events": [
                {"type": e.get("type"), "payload": e.get("payload"), "created_at": e.get("created_at")}
                for e in patient_events
            ],
            "latest_vitals": vitals,
        }

        # --- 6. Call OpenAI ---
        client = get_openai_client()
        response = client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": json.dumps(context, default=str)},
            ],
            response_format={"type": "json_object"},
        )

        ai_text = response.choices[0].message.content or "{}"
        try:
            field_values = json.loads(ai_text)
        except json.JSONDecodeError:
            return jsonify({"error": "OpenAI returned invalid JSON"}), 500

        # --- 7. Fill the PDF ---
        writer = PdfWriter()
        writer.append(reader)

        # Fill form fields on all pages
        for page_num in range(len(writer.pages)):
            writer.update_page_form_field_values(
                writer.pages[page_num],
                field_values,
                auto_regenerate=False,
            )

        buf = io.BytesIO()
        writer.write(buf)
        buf.seek(0)

        # --- 8. Log the report generation event ---
        supabase.table("events").insert({
            "type": "report_generated",
            "payload": {
                "patient_id": patient_id,
                "patient_name": patient.get("name"),
                "from_date": from_date,
                "to_date": to_date,
            },
        }).execute()

        safe_name = (patient.get("name") or "unknown").replace(" ", "_")
        timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M")

        return send_file(
            buf,
            mimetype="application/pdf",
            as_attachment=True,
            download_name=f"patient_report_{safe_name}_{timestamp}.pdf",
        )

    except Exception as e:
        logger.exception("Failed to generate report")
        return jsonify({"error": str(e)}), 500
