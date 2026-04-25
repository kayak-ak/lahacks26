import asyncio
import json

from flask import Blueprint, jsonify, request

from db import supabase
from agent.models import CallOutRequest, CallOutResponse
from agent import get_sms_agent_address

from uagents.query import query

shifts_bp = Blueprint("shifts", __name__)


@shifts_bp.route("/shifts", methods=["GET"])
def list_shifts():
    date = request.args.get("date")
    status = request.args.get("status")

    q = supabase.table("shifts").select("*, nurses(*)")
    if date:
        q = q.eq("date", date)
    if status:
        q = q.eq("status", status)

    result = q.execute()
    return jsonify(result.data if result.data else [])


@shifts_bp.route("/shifts/call-out", methods=["POST"])
def call_out():
    data = request.get_json(force=True)
    nurse_name = data.get("nurse_name", "")
    date = data.get("date", "")
    reason = data.get("reason", "")

    if not nurse_name or not date:
        return jsonify({"error": "nurse_name and date are required"}), 400

    address = get_sms_agent_address()

    async def _query_agent():
        response = await query(
            destination=address,
            message=CallOutRequest(
                nurse_name=nurse_name,
                date=date,
                reason=reason,
            ),
            timeout=30.0,
        )
        return json.loads(response.decode_payload())

    try:
        result = asyncio.run(_query_agent())
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500
