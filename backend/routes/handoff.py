import logging

from flask import Blueprint, jsonify, request
from datetime import date as date_type
from db import supabase

logger = logging.getLogger(__name__)

handoff_bp = Blueprint("handoff", __name__)

# TODO: Remove mock data after database has been fully implemented
MOCK_HANDOFF = {
    "shifts": [
        {
            "id": "shift-1",
            "nurse": {"id": "n1", "name": "Sarah Chen", "role": "head_nurse", "phone": "+15551001"},
            "time_slot": "07:00-15:00",
            "status": "confirmed",
            "patients": [
                {
                    "patient": {"id": "p1", "name": "James Wilson", "acuity_level": 3, "family_phone": "+15552001"},
                    "room": {"id": "r1", "number": "101", "status": "occupied"},
                    "vitals": {"heartRate": "76 bpm", "bloodPressure": "118/78 mmHg", "temperature": "98.4\u00b0F", "oxygen": "98%"},
                    "rounding_logs": [
                        {"entered_at": "2026-04-25T14:00:00Z", "sanitized": True, "duration_sec": 420, "notes": "Patient resting comfortably. Pain level 2/10."},
                        {"entered_at": "2026-04-25T13:00:00Z", "sanitized": True, "duration_sec": 300, "notes": "Administered medication. Vitals stable."},
                        {"entered_at": "2026-04-25T12:00:00Z", "sanitized": True, "duration_sec": 360, "notes": "Lunch served. Patient ate 75% of meal."},
                    ],
                    "alerts": [],
                    "tasks": ["Follow-up labs at 16:00", "Family update call pending"],
                },
                {
                    "patient": {"id": "p2", "name": "Maria Garcia", "acuity_level": 2, "family_phone": "+15552002"},
                    "room": {"id": "r2", "number": "102", "status": "occupied"},
                    "vitals": {"heartRate": "82 bpm", "bloodPressure": "121/80 mmHg", "temperature": "98.8\u00b0F", "oxygen": "97%"},
                    "rounding_logs": [
                        {"entered_at": "2026-04-25T14:15:00Z", "sanitized": True, "duration_sec": 480, "notes": "Wound dressing changed. Healing well."},
                        {"entered_at": "2026-04-25T13:10:00Z", "sanitized": True, "duration_sec": 240, "notes": "Physical therapy session completed."},
                    ],
                    "alerts": [],
                    "tasks": ["Discharge paperwork review", "Medication reconciliation"],
                },
            ],
        },
        {
            "id": "shift-2",
            "nurse": {"id": "n2", "name": "Marcus Johnson", "role": "nurse", "phone": "+15551002"},
            "time_slot": "07:00-15:00",
            "status": "confirmed",
            "patients": [
                {
                    "patient": {"id": "p3", "name": "Robert Thompson", "acuity_level": 4, "family_phone": "+15552003"},
                    "room": {"id": "r4", "number": "104", "status": "occupied"},
                    "vitals": {"heartRate": "115 bpm", "bloodPressure": "145/95 mmHg", "temperature": "101.2\u00b0F", "oxygen": "92%"},
                    "rounding_logs": [
                        {"entered_at": "2026-04-25T14:30:00Z", "sanitized": True, "duration_sec": 600, "notes": "Elevated HR and temp. Notified physician. Awaiting orders."},
                        {"entered_at": "2026-04-25T13:30:00Z", "sanitized": True, "duration_sec": 540, "notes": "Blood cultures drawn. IV antibiotics started."},
                    ],
                    "alerts": [
                        {"type": "vitals_warning", "priority": "high", "message": "Heart rate elevated >110 bpm for 2 hours", "created_at": "2026-04-25T14:00:00Z"},
                        {"type": "temperature", "priority": "medium", "message": "Temperature 101.2\u00b0F \u2014 monitor for sepsis protocol", "created_at": "2026-04-25T13:45:00Z"},
                    ],
                    "tasks": ["Repeat vitals q30min", "Physician callback pending", "Blood culture results due"],
                },
                {
                    "patient": {"id": "p4", "name": "Linda Patel", "acuity_level": 1, "family_phone": "+15552004"},
                    "room": {"id": "r5", "number": "201", "status": "occupied"},
                    "vitals": {"heartRate": "72 bpm", "bloodPressure": "116/74 mmHg", "temperature": "98.3\u00b0F", "oxygen": "99%"},
                    "rounding_logs": [
                        {"entered_at": "2026-04-25T14:10:00Z", "sanitized": True, "duration_sec": 300, "notes": "Patient ambulating independently. Ready for discharge assessment."},
                    ],
                    "alerts": [],
                    "tasks": ["Discharge assessment at 16:00", "Transport arranged for 17:00"],
                },
            ],
        },
    ]
}


@handoff_bp.route("/handoff", methods=["GET"])
def get_handoff():
    target_date = request.args.get("date", str(date_type.today()))

    try:
        shifts_result = supabase.table("shifts").select("*, nurses(*)").eq("date", target_date).execute()
        if shifts_result.data and len(shifts_result.data) > 0:
            handoff_data = {"shifts": []}
            for shift in shifts_result.data:
                nurse = shift.get("nurses", {})
                nurse_id = shift.get("nurse_id")

                status_result = supabase.table("nurse_statuses").select("*, patients(*), rooms(*)").eq("nurse_id", nurse_id).execute()

                patients_list = []
                if status_result.data:
                    room_ids = [ns.get("current_room_id") for ns in status_result.data if ns.get("current_room_id")]

                    rounding_by_room: dict = {}
                    alerts_by_room: dict = {}
                    if room_ids:
                        rounding_result = supabase.table("rounding_logs").select("*").in_("room_id", room_ids).order("entered_at", desc=True).execute()
                        for log in (rounding_result.data or []):
                            rid = log.get("room_id")
                            rounding_by_room.setdefault(rid, []).append(log)

                        alerts_result = supabase.table("alerts").select("*").in_("room_id", room_ids).is_("resolved_at", "null").order("created_at", desc=True).execute()
                        for alert in (alerts_result.data or []):
                            rid = alert.get("room_id")
                            alerts_by_room.setdefault(rid, []).append(alert)

                    for ns in status_result.data:
                        patient = ns.get("patients")
                        room = ns.get("rooms")
                        if not patient:
                            continue

                        room_id = ns.get("current_room_id")
                        rounding_logs = rounding_by_room.get(room_id, [])[:3]
                        alerts = alerts_by_room.get(room_id, [])

                        patients_list.append({
                            "patient": patient,
                            "room": room or {},
                            "vitals": {},
                            "rounding_logs": rounding_logs,
                            "alerts": alerts,
                            "tasks": [],
                        })

                handoff_data["shifts"].append({
                    "id": shift.get("id"),
                    "nurse": nurse,
                    "time_slot": shift.get("time_slot"),
                    "status": shift.get("status"),
                    "patients": patients_list,
                })

            if handoff_data["shifts"]:
                return jsonify(handoff_data)
    except Exception:
        logger.exception("Failed to fetch handoff data from Supabase (date=%s)", target_date)

    # TODO: Remove fallback to mock data once Supabase is reliably seeded
    return jsonify(MOCK_HANDOFF)


@handoff_bp.route("/handoff/accept", methods=["POST"])
def accept_handoff():
    data = request.get_json(force=True)
    shift_id = data.get("shift_id")
    nurse_id = data.get("nurse_id")

    if not shift_id or not nurse_id:
        return jsonify({"error": "shift_id and nurse_id are required"}), 400

    try:
        result = supabase.table("shifts").update({"status": "handed_off"}).eq("id", shift_id).execute()
        from agent.tools.supabase_tools import log_event
        log_event("handoff_accepted", {"shift_id": shift_id, "nurse_id": nurse_id})
        return jsonify({"status": "accepted", "shift": result.data[0] if result.data else {}})
    except Exception:
        logger.exception("Failed to accept handoff (shift_id=%s, nurse_id=%s)", shift_id, nurse_id)
        # TODO: Remove mock response once Supabase is reliably connected
        return jsonify({"status": "accepted", "shift_id": shift_id, "mock": True})
