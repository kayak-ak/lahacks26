import sys
import os
import re

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from db import supabase

_UUID_RE = re.compile(
    r"^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$", re.IGNORECASE
)


def _is_uuid(value: str) -> bool:
    return bool(_UUID_RE.match(value))


def _resolve_room_id(room_id_or_number: str) -> str | None:
    if _is_uuid(room_id_or_number):
        return room_id_or_number
    result = (
        supabase.table("rooms").select("id").eq("number", room_id_or_number).execute()
    )
    if result.data:
        return result.data[0]["id"]
    return None


# ---------------------------------------------------------------------------
# Read: Patient queries
# ---------------------------------------------------------------------------


def query_patient(patient_id: str) -> dict | None:
    result = supabase.table("patients").select("*").eq("id", patient_id).execute()
    if result.data:
        return result.data[0]
    return None


def query_patient_by_name(name: str) -> dict | None:
    result = supabase.table("patients").select("*").eq("name", name).execute()
    if result.data:
        return result.data[0]
    return None


def query_patient_by_room(room_id: str) -> dict | None:
    result = supabase.table("patients").select("*").eq("room_id", room_id).execute()
    if result.data:
        return result.data[0]
    return None


# ---------------------------------------------------------------------------
# Read: Room queries
# ---------------------------------------------------------------------------


def query_room(room_id: str) -> dict | None:
    result = supabase.table("rooms").select("*").eq("id", room_id).execute()
    if result.data:
        return result.data[0]
    return None


def query_room_by_number(number: str) -> dict | None:
    result = supabase.table("rooms").select("*").eq("number", number).execute()
    if result.data:
        return result.data[0]
    return None


def list_rooms() -> list[dict]:
    result = supabase.table("rooms").select("*").execute()
    return result.data if result.data else []


# ---------------------------------------------------------------------------
# Read: Vitals queries
# ---------------------------------------------------------------------------


def get_latest_vitals(patient_id: str) -> dict | None:
    result = (
        supabase.table("vitals")
        .select("*")
        .eq("patient_id", patient_id)
        .order("recorded_at", desc=True)
        .limit(1)
        .execute()
    )
    if result.data:
        return result.data[0]
    return None


def get_vitals_history(patient_id: str, limit: int = 10) -> list[dict]:
    result = (
        supabase.table("vitals")
        .select("*")
        .eq("patient_id", patient_id)
        .order("recorded_at", desc=True)
        .limit(limit)
        .execute()
    )
    return result.data if result.data else []


def get_vitals_by_patient_name(name: str) -> dict | None:
    patient = query_patient_by_name(name)
    if not patient:
        return None
    vitals = get_latest_vitals(patient["id"])
    return {
        "patient": patient,
        "vitals": vitals,
    }


def get_vitals_by_room(room_id_or_number: str) -> dict | None:
    room_id = _resolve_room_id(room_id_or_number)
    if not room_id:
        return None
    room = query_room(room_id)
    if not room:
        return None
    patient = query_patient_by_room(room_id)
    vitals = None
    if patient:
        vitals = get_latest_vitals(patient["id"])
    return {
        "room": room,
        "patient": patient,
        "vitals": vitals,
    }


# ---------------------------------------------------------------------------
# Read: Dashboard overview
# ---------------------------------------------------------------------------


def get_rooms_overview() -> list[dict]:
    rooms_result = supabase.table("rooms").select("*").order("number").execute()
    if not rooms_result.data:
        return []

    patients_result = supabase.table("patients").select("*").execute()
    patients_by_room: dict[str, dict] = {}
    for p in patients_result.data or []:
        if p.get("room_id"):
            patients_by_room[p["room_id"]] = p

    patient_ids = [p["id"] for p in patients_result.data or []]
    vitals_result = (
        supabase.table("vitals")
        .select("*")
        .in_("patient_id", patient_ids)
        .order("recorded_at", desc=True)
        .execute()
        if patient_ids
        else None
    )

    latest_vitals_by_patient: dict[str, dict] = {}
    if vitals_result and vitals_result.data:
        for v in vitals_result.data:
            pid = v["patient_id"]
            if pid not in latest_vitals_by_patient:
                latest_vitals_by_patient[pid] = v

    nurse_statuses_result = (
        supabase.table("nurse_statuses")
        .select("*, nurses(name, role), rooms(number), patients(name)")
        .execute()
    )
    nurse_by_room: dict[str, dict] = {}
    for ns in nurse_statuses_result.data or []:
        if ns.get("current_room_id"):
            nurse_info: dict = {
                "nurse_id": ns["nurse_id"],
                "nurse_status": ns["status"],
            }
            nurse_data = ns.get("nurses")
            if nurse_data:
                nurse_info["nurse_name"] = nurse_data.get("name")
                nurse_info["nurse_role"] = nurse_data.get("role")
            nurse_by_room[ns["current_room_id"]] = nurse_info

    overview = []
    for room in rooms_result.data:
        patient = patients_by_room.get(room["id"])
        entry: dict = {
            "room_id": room["id"],
            "room_number": room["number"],
            "room_type": room.get("room_type", "patient"),
            "room_status": room["status"],
            "patient": None,
            "vitals": None,
            "nurse": None,
        }
        if patient:
            entry["patient"] = {
                "id": patient["id"],
                "name": patient["name"],
                "age": patient.get("age"),
                "reason": patient.get("reason"),
                "acuity_level": patient.get("acuity_level"),
            }
            vitals = latest_vitals_by_patient.get(patient["id"])
            if vitals:
                entry["vitals"] = {
                    "heart_rate": vitals.get("heart_rate"),
                    "bp_systolic": vitals.get("bp_systolic"),
                    "bp_diastolic": vitals.get("bp_diastolic"),
                    "temperature_f": vitals.get("temperature_f"),
                    "oxygen_saturation": vitals.get("oxygen_saturation"),
                    "recorded_at": vitals.get("recorded_at"),
                }
        nurse = nurse_by_room.get(room["id"])
        if nurse:
            entry["nurse"] = nurse
        overview.append(entry)

    return overview


# ---------------------------------------------------------------------------
# Read: Shift & nurse queries
# ---------------------------------------------------------------------------


def query_shifts_by_date(date: str) -> list[dict]:
    result = supabase.table("shifts").select("*, nurses(*)").eq("date", date).execute()
    return result.data if result.data else []


def find_available_nurses(date: str, role: str | None = None) -> list[dict]:
    shift_nurses = (
        supabase.table("shifts").select("nurse_id").eq("date", date).execute()
    )
    scheduled_ids = (
        [s["nurse_id"] for s in shift_nurses.data] if shift_nurses.data else []
    )

    query = supabase.table("nurses").select("*")
    if role:
        query = query.eq("role", role)
    all_nurses = query.execute()

    if not all_nurses.data:
        return []

    available = [n for n in all_nurses.data if n["id"] not in scheduled_ids]
    return available


def get_nurse_availability() -> list[dict]:
    result = (
        supabase.table("nurse_statuses")
        .select("*, nurses(*, shifts(*)), rooms(*), patients(*)")
        .execute()
    )
    if not result.data:
        return []

    enriched = []
    for row in result.data:
        entry = {
            "nurse_id": row["nurse_id"],
            "status": row["status"],
            "current_room_id": row.get("current_room_id"),
            "current_patient_id": row.get("current_patient_id"),
            "updated_at": row.get("updated_at"),
        }
        nurse = row.get("nurses")
        if nurse:
            entry["nurse_name"] = nurse.get("name")
            entry["nurse_role"] = nurse.get("role")
            entry["nurse_phone"] = nurse.get("phone")

        room = row.get("rooms")
        if room:
            entry["room_number"] = room.get("number")
            entry["room_type"] = room.get("room_type")

        patient = row.get("patients")
        if patient:
            entry["patient_name"] = patient.get("name")
            entry["acuity_level"] = patient.get("acuity_level")

        enriched.append(entry)

    return enriched


# ---------------------------------------------------------------------------
# Write: Alerts
# ---------------------------------------------------------------------------


def create_alert(alert_type: str, room_id: str, priority: str, message: str) -> dict:
    result = (
        supabase.table("alerts")
        .insert(
            {
                "type": alert_type,
                "room_id": room_id,
                "priority": priority,
                "message": message,
            }
        )
        .execute()
    )
    return result.data[0] if result.data else {}


# ---------------------------------------------------------------------------
# Write: Nurse status & shifts
# ---------------------------------------------------------------------------


def update_nurse_status(
    nurse_id: str,
    status: str,
    current_room_id: str | None = None,
    current_patient_id: str | None = None,
) -> dict | None:
    existing = (
        supabase.table("nurse_statuses").select("id").eq("nurse_id", nurse_id).execute()
    )

    update_data = {
        "status": status,
        "current_room_id": current_room_id,
        "current_patient_id": current_patient_id,
    }

    if current_room_id is None:
        update_data["current_room_id"] = None
    if current_patient_id is None:
        update_data["current_patient_id"] = None

    if existing.data:
        result = (
            supabase.table("nurse_statuses")
            .update(update_data)
            .eq("nurse_id", nurse_id)
            .execute()
        )
    else:
        update_data["nurse_id"] = nurse_id
        result = supabase.table("nurse_statuses").insert(update_data).execute()

    if result.data:
        return result.data[0]
    return None


def update_shift_status(shift_id: str, status: str) -> dict | None:
    result = (
        supabase.table("shifts").update({"status": status}).eq("id", shift_id).execute()
    )
    if result.data:
        return result.data[0]
    return None


# ---------------------------------------------------------------------------
# Write: Patient admit & discharge
# ---------------------------------------------------------------------------


def admit_patient(
    room_id_or_number: str,
    name: str,
    age: int,
    reason: str,
    acuity_level: int = 1,
    family_phone: str | None = None,
) -> dict | None:
    room_id = _resolve_room_id(room_id_or_number)
    if not room_id:
        return {"error": f"Room '{room_id_or_number}' not found"}

    room = query_room(room_id)
    if room and room.get("status") == "occupied":
        return {"error": f"Room {room['number']} is already occupied"}

    patient_data: dict = {
        "name": name,
        "room_id": room_id,
        "acuity_level": acuity_level,
        "age": age,
        "reason": reason,
    }
    if family_phone:
        patient_data["family_phone"] = family_phone

    result = supabase.table("patients").insert(patient_data).execute()
    if not result.data:
        return None

    supabase.table("rooms").update({"status": "occupied"}).eq("id", room_id).execute()

    return result.data[0]


def discharge_patient(patient_id: str) -> dict | None:
    patient = query_patient(patient_id)
    if not patient:
        return {"error": f"Patient {patient_id} not found"}

    if patient.get("room_id"):
        supabase.table("rooms").update({"status": "needs_cleaning"}).eq(
            "id", patient["room_id"]
        ).execute()

    result = (
        supabase.table("patients")
        .update({"room_id": None})
        .eq("id", patient_id)
        .execute()
    )
    if result.data:
        return result.data[0]
    return None


# ---------------------------------------------------------------------------
# Write: Record vitals
# ---------------------------------------------------------------------------


def record_vitals(
    patient_id: str,
    heart_rate: int | None = None,
    bp_systolic: int | None = None,
    bp_diastolic: int | None = None,
    temperature_f: float | None = None,
    oxygen_saturation: int | None = None,
) -> dict | None:
    patient = query_patient(patient_id)
    if not patient:
        return {"error": f"Patient {patient_id} not found"}

    vitals_data: dict = {"patient_id": patient_id}
    if heart_rate is not None:
        vitals_data["heart_rate"] = heart_rate
    if bp_systolic is not None:
        vitals_data["bp_systolic"] = bp_systolic
    if bp_diastolic is not None:
        vitals_data["bp_diastolic"] = bp_diastolic
    if temperature_f is not None:
        vitals_data["temperature_f"] = temperature_f
    if oxygen_saturation is not None:
        vitals_data["oxygen_saturation"] = oxygen_saturation

    result = supabase.table("vitals").insert(vitals_data).execute()
    if result.data:
        return result.data[0]
    return None


# ---------------------------------------------------------------------------
# Utility: Events logging
# ---------------------------------------------------------------------------


def log_event(event_type: str, payload: dict) -> dict:
    result = (
        supabase.table("events")
        .insert({"type": event_type, "payload": payload})
        .execute()
    )
    return result.data[0] if result.data else {}
