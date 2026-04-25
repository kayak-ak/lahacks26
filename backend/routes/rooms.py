from flask import Blueprint, jsonify, request

from db import supabase

rooms_bp = Blueprint("rooms", __name__)


@rooms_bp.route("/rooms", methods=["GET"])
def list_rooms():
    result = supabase.table("rooms").select("*").execute()
    return jsonify(result.data if result.data else [])


@rooms_bp.route("/rooms/<room_id>/history", methods=["GET"])
def room_history(room_id):
    limit = request.args.get("limit", 50, type=int)

    room_result = supabase.table("rooms").select("*").eq("id", room_id).execute()
    if not room_result.data:
        return jsonify({"error": "Room not found"}), 404

    rounding_result = (
        supabase.table("rounding_logs")
        .select("*")
        .eq("room_id", room_id)
        .order("entered_at", desc=True)
        .limit(limit)
        .execute()
    )

    alerts_result = (
        supabase.table("alerts")
        .select("*")
        .eq("room_id", room_id)
        .order("created_at", desc=True)
        .limit(limit)
        .execute()
    )

    return jsonify(
        {
            "room": room_result.data[0],
            "rounding_logs": rounding_result.data if rounding_result.data else [],
            "alerts": alerts_result.data if alerts_result.data else [],
        }
    )
