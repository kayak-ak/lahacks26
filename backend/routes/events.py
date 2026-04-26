from flask import Blueprint, jsonify, request
from db import supabase

events_bp = Blueprint("events", __name__)

# TODO: Remove mock data after database has been implemented
MOCK_EVENTS = [
    {"id": "evt-1", "type": "sms_outbound", "payload": {"to": "+15552001", "message": "Your family member James Wilson is stable. Vitals normal.", "sid": "SM001"}, "created_at": "2026-04-25T14:30:00Z"},
    {"id": "evt-2", "type": "sms_inbound", "payload": {"from": "+15552002", "body": "How is Maria doing?", "intent": "family_inquiry", "action_taken": "auto_reply"}, "created_at": "2026-04-25T13:15:00Z"},
    {"id": "evt-3", "type": "call_out_initiated", "payload": {"nurse_name": "Emily Rodriguez", "date": "2026-04-25", "reason": "sick"}, "created_at": "2026-04-25T10:00:00Z"},
    {"id": "evt-4", "type": "sms_outbound", "payload": {"to": "+15551002", "message": "SHIFT AVAILABLE: 2026-04-25 15:00-23:00. Reply YES to confirm.", "sid": "SM002"}, "created_at": "2026-04-25T10:05:00Z"},
    {"id": "evt-5", "type": "call_out_processed", "payload": {"nurse_name": "Emily Rodriguez", "date": "2026-04-25", "replacement": "Marcus Johnson", "status": "filled"}, "created_at": "2026-04-25T10:20:00Z"},
    {"id": "evt-6", "type": "sms_outbound", "payload": {"to": "+15552003", "message": "Update: Robert Thompson moved to observation. Vitals improving.", "sid": "SM003"}, "created_at": "2026-04-25T09:45:00Z"},
    {"id": "evt-7", "type": "sms_inbound", "payload": {"from": "+15551003", "body": "call out Emily Rodriguez 2026-04-25 sick", "intent": "call_out", "action_taken": "initiated_coverage"}, "created_at": "2026-04-25T09:55:00Z"},
    {"id": "evt-8", "type": "shift_blast", "payload": {"to": "all_floor_1", "message": "Reminder: Mandatory huddle at 15:00 in break room.", "recipients": 4}, "created_at": "2026-04-25T08:00:00Z"},
    {"id": "evt-9", "type": "sms_outbound", "payload": {"to": "+15552004", "message": "Linda Patel is resting comfortably. No changes to report.", "sid": "SM004"}, "created_at": "2026-04-24T20:30:00Z"},
    {"id": "evt-10", "type": "call_out_initiated", "payload": {"nurse_name": "David Kim", "date": "2026-04-24", "reason": "family emergency"}, "created_at": "2026-04-24T06:00:00Z"},
]


@events_bp.route("/events", methods=["GET"])
def list_events():
    event_type = request.args.get("type")
    limit = request.args.get("limit", 100, type=int)
    offset = request.args.get("offset", 0, type=int)

    try:
        q = supabase.table("events").select("*").order("created_at", desc=True).limit(limit).offset(offset)
        if event_type:
            q = q.eq("type", event_type)
        result = q.execute()
        if result.data:
            return jsonify(result.data)
    except Exception:
        pass

    # TODO: Remove fallback to mock data once Supabase events table is reliably populated
    filtered = MOCK_EVENTS
    if event_type:
        filtered = [e for e in filtered if e["type"] == event_type]
    return jsonify(filtered[offset:offset + limit])


@events_bp.route("/events/stats", methods=["GET"])
def event_stats():
    try:
        result = supabase.table("events").select("type").execute()
        if result.data:
            from collections import Counter
            counts = Counter(row["type"] for row in result.data)
            return jsonify({"total": len(result.data), "by_type": dict(counts)})
    except Exception:
        pass

    # TODO: Remove fallback to mock data once Supabase events table is reliably populated
    from collections import Counter
    counts = Counter(e["type"] for e in MOCK_EVENTS)
    return jsonify({"total": len(MOCK_EVENTS), "by_type": dict(counts)})
