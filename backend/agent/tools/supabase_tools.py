import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from db import supabase


def query_patient(patient_id: str) -> dict | None:
    result = supabase.table("patients").select("*").eq("id", patient_id).execute()
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


def create_alert(room_id: str, priority: str, message: str) -> dict:
    result = (
        supabase.table("alerts")
        .insert(
            {
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
        .insert({"type": event_type, "payload_json": payload})
        .execute()
    )
    return result.data[0] if result.data else {}
