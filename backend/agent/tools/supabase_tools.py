import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from db import supabase


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


def query_room(room_id: str) -> dict | None:
    result = supabase.table("rooms").select("*").eq("id", room_id).execute()
    if result.data:
        return result.data[0]
    return None


def list_rooms() -> list[dict]:
    result = supabase.table("rooms").select("*").execute()
    return result.data if result.data else []


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


def update_shift_status(shift_id: str, status: str) -> dict | None:
    result = (
        supabase.table("shifts").update({"status": status}).eq("id", shift_id).execute()
    )
    if result.data:
        return result.data[0]
    return None


def log_event(event_type: str, payload: dict) -> dict:
    result = (
        supabase.table("events")
        .insert({"type": event_type, "payload": payload})
        .execute()
    )
    return result.data[0] if result.data else {}


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

        patient = row.get("patients")
        if patient:
            entry["patient_name"] = patient.get("name")
            entry["acuity_level"] = patient.get("acuity_level")

        enriched.append(entry)

    return enriched


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
