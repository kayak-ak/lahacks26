"""Generate a PDF patient summary from Supabase data.

Called by the AI agent when a nurse requests a summary for a patient by name.
Usage: generate_patient_summary("James Nguyen")
Returns: dict with pdf_path and patient info, or error dict.
"""

import os
import sys
from datetime import datetime

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from db import supabase
from fpdf import FPDF

OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "summaries")


class PatientSummaryPDF(FPDF):
    def header(self):
        self.set_font("Helvetica", "B", 14)
        self.cell(0, 10, "NurseFlow AI - Patient Summary", align="C", new_x="LMARGIN", new_y="NEXT")
        self.ln(2)

    def footer(self):
        self.set_y(-15)
        self.set_font("Helvetica", "I", 8)
        self.cell(0, 10, f"Generated {datetime.now().strftime('%Y-%m-%d %H:%M')}  |  Page {self.page_no()}", align="C")

    def section_title(self, title: str):
        self.set_font("Helvetica", "B", 11)
        self.set_fill_color(230, 240, 250)
        self.cell(0, 8, f"  {title}", fill=True, new_x="LMARGIN", new_y="NEXT")
        self.ln(2)

    def info_row(self, label: str, value: str):
        self.set_font("Helvetica", "B", 10)
        self.cell(50, 7, label)
        self.set_font("Helvetica", "", 10)
        self.cell(0, 7, str(value), new_x="LMARGIN", new_y="NEXT")


def _fetch_patient(name: str) -> dict | None:
    result = supabase.table("patients").select("*").eq("name", name).execute()
    return result.data[0] if result.data else None


def _fetch_room(room_id: str) -> dict | None:
    result = supabase.table("rooms").select("*").eq("id", room_id).execute()
    return result.data[0] if result.data else None


def _fetch_rounding_logs(room_id: str, limit: int = 10) -> list[dict]:
    result = (
        supabase.table("rounding_logs")
        .select("*")
        .eq("room_id", room_id)
        .order("entered_at", desc=True)
        .limit(limit)
        .execute()
    )
    return result.data if result.data else []


def _fetch_alerts(room_id: str, limit: int = 10) -> list[dict]:
    result = (
        supabase.table("alerts")
        .select("*")
        .eq("room_id", room_id)
        .order("created_at", desc=True)
        .limit(limit)
        .execute()
    )
    return result.data if result.data else []


def _fetch_family_contacts(patient_id: str) -> list[dict]:
    result = (
        supabase.table("family_contacts")
        .select("*")
        .eq("patient_id", patient_id)
        .execute()
    )
    return result.data if result.data else []


def generate_patient_summary(name: str) -> dict:
    """Look up a patient by name and produce a PDF summary.

    Returns dict with keys:
        - pdf_path: absolute path to the generated PDF
        - patient_name: the patient name used
        - room_number: room number string (or 'N/A')
    On error, returns dict with 'error' key.
    """
    patient = _fetch_patient(name)
    if not patient:
        return {"error": f"Patient '{name}' not found."}

    patient_id = patient["id"]
    room_id = patient.get("room_id")

    room = _fetch_room(room_id) if room_id else None
    room_number = room.get("number", "N/A") if room else "N/A"
    room_status = room.get("status", "N/A") if room else "N/A"
    last_rounded = room.get("last_rounded_at", "N/A") if room else "N/A"
    last_sanitized = room.get("last_sanitized_at", "N/A") if room else "N/A"

    rounding_logs = _fetch_rounding_logs(room_id) if room_id else []
    alerts = _fetch_alerts(room_id) if room_id else []
    family_contacts = _fetch_family_contacts(patient_id)

    # Build PDF
    pdf = PatientSummaryPDF()
    pdf.add_page()
    pdf.set_auto_page_break(auto=True, margin=20)

    # Patient Info
    pdf.section_title("Patient Information")
    pdf.info_row("Name:", patient.get("name", ""))
    pdf.info_row("Patient ID:", patient.get("id", ""))
    pdf.info_row("Acuity Level:", str(patient.get("acuity_level", "N/A")))
    pdf.info_row("Admitted At:", str(patient.get("admitted_at", "N/A")))
    pdf.info_row("Family Phone:", str(patient.get("family_phone", "N/A")))
    pdf.ln(4)

    # Room Info
    pdf.section_title("Room Status")
    pdf.info_row("Room Number:", str(room_number))
    pdf.info_row("Room Status:", str(room_status))
    pdf.info_row("Last Rounded:", str(last_rounded))
    pdf.info_row("Last Sanitized:", str(last_sanitized))
    pdf.ln(4)

    # Family Contacts
    pdf.section_title("Family Contacts")
    if family_contacts:
        for fc in family_contacts:
            pdf.info_row("Name:", fc.get("name", ""))
            pdf.info_row("Phone:", fc.get("phone", ""))
            pdf.info_row("Preferred Channel:", fc.get("preferred_channel", ""))
            pdf.ln(2)
    else:
        pdf.set_font("Helvetica", "", 10)
        pdf.cell(0, 7, "No family contacts on file.", new_x="LMARGIN", new_y="NEXT")
    pdf.ln(4)

    # Recent Rounding Logs
    pdf.section_title("Recent Rounding Logs")
    if rounding_logs:
        pdf.set_font("Helvetica", "B", 9)
        pdf.cell(45, 6, "Entered At", border=1)
        pdf.cell(25, 6, "Duration(s)", border=1)
        pdf.cell(25, 6, "Sanitized", border=1)
        pdf.cell(0, 6, "Nurse ID", border=1, new_x="LMARGIN", new_y="NEXT")
        pdf.set_font("Helvetica", "", 9)
        for log in rounding_logs:
            pdf.cell(45, 6, str(log.get("entered_at", ""))[:19], border=1)
            pdf.cell(25, 6, str(log.get("duration_sec", "")), border=1)
            pdf.cell(25, 6, "Yes" if log.get("sanitized") else "No", border=1)
            pdf.cell(0, 6, str(log.get("nurse_id", ""))[:8], border=1, new_x="LMARGIN", new_y="NEXT")
    else:
        pdf.set_font("Helvetica", "", 10)
        pdf.cell(0, 7, "No rounding logs found.", new_x="LMARGIN", new_y="NEXT")
    pdf.ln(4)

    # Active Alerts
    pdf.section_title("Active Alerts")
    if alerts:
        pdf.set_font("Helvetica", "B", 9)
        pdf.cell(35, 6, "Type", border=1)
        pdf.cell(25, 6, "Priority", border=1)
        pdf.cell(55, 6, "Message", border=1)
        pdf.cell(35, 6, "Created", border=1)
        pdf.cell(0, 6, "Resolved", border=1, new_x="LMARGIN", new_y="NEXT")
        pdf.set_font("Helvetica", "", 9)
        for alert in alerts:
            pdf.cell(35, 6, str(alert.get("type", ""))[:18], border=1)
            pdf.cell(25, 6, str(alert.get("priority", "")), border=1)
            pdf.cell(55, 6, str(alert.get("message", ""))[:30], border=1)
            pdf.cell(35, 6, str(alert.get("created_at", ""))[:19], border=1)
            resolved = str(alert.get("resolved_at", ""))[:19] or "Open"
            pdf.cell(0, 6, resolved, border=1, new_x="LMARGIN", new_y="NEXT")
    else:
        pdf.set_font("Helvetica", "", 10)
        pdf.cell(0, 7, "No active alerts.", new_x="LMARGIN", new_y="NEXT")

    # Save
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    safe_name = name.replace(" ", "_").lower()
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"summary_{safe_name}_{timestamp}.pdf"
    pdf_path = os.path.abspath(os.path.join(OUTPUT_DIR, filename))
    pdf.output(pdf_path)

    return {
        "pdf_path": pdf_path,
        "patient_name": patient.get("name", name),
        "room_number": str(room_number),
    }


if __name__ == "__main__":
    import json
    if len(sys.argv) < 2:
        print("Usage: python generate_patient_summary.py <patient_name>")
        sys.exit(1)
    result = generate_patient_summary(sys.argv[1])
    print(json.dumps(result, indent=2, default=str))
