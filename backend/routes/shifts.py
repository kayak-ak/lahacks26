import requests as http_requests

from flask import Blueprint, jsonify, request

from db import supabase
from agent import SMS_AGENT_URL

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

    try:
        resp = http_requests.post(
            f"{SMS_AGENT_URL}/sms/call-out",
            json={"nurse_name": nurse_name, "date": date, "reason": reason},
            timeout=30.0,
        )
        return jsonify(resp.json()), resp.status_code
    except http_requests.exceptions.ConnectionError:
        return jsonify({"error": "SMS agent is not reachable"}), 503
    except Exception as e:
        return jsonify({"error": str(e)}), 500
