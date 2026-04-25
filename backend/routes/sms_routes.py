import asyncio
import json

from flask import Blueprint, request, Response, jsonify

from agent.models import (
    SMSInboundRequest,
    SMSInboundResponse,
    SMSOutboundRequest,
    SMSOutboundResponse,
)
from agent import get_sms_agent_address

from uagents.query import query
from integrations.twilio_client import send_sms

sms_bp = Blueprint("sms", __name__)


@sms_bp.route("/sms/inbound", methods=["POST"])
def sms_inbound():
    body = request.form.get("Body", "")
    from_number = request.form.get("From", "")

    if not body:
        return Response(
            "<Response><Message>Empty message received.</Message></Response>",
            mimetype="text/xml",
        )

    address = get_sms_agent_address()

    async def _query_agent():
        response = await query(
            destination=address,
            message=SMSInboundRequest(body=body, from_number=from_number),
            timeout=30.0,
        )
        return json.loads(response.decode_payload())

    try:
        result = asyncio.run(_query_agent())
        reply = result.get("reply", "Your message has been received.")
    except Exception:
        reply = "Your message has been received. A nurse will respond shortly."

    twiml = f"<Response><Message>{reply}</Message></Response>"
    return Response(twiml, mimetype="text/xml")


@sms_bp.route("/sms/outbound", methods=["POST"])
def sms_outbound():
    data = request.get_json(force=True)
    to_number = data.get("to_number", "")
    message = data.get("message", "")

    if not to_number or not message:
        return jsonify({"error": "to_number and message are required"}), 400

    address = get_sms_agent_address()

    async def _query_agent():
        response = await query(
            destination=address,
            message=SMSOutboundRequest(to_number=to_number, message=message),
            timeout=15.0,
        )
        return json.loads(response.decode_payload())

    try:
        result = asyncio.run(_query_agent())
        return jsonify(result)
    except Exception as e:
        try:
            sid = send_sms(to_number, message)
            return jsonify({"success": True, "message_sid": sid})
        except Exception as e2:
            return jsonify({"error": str(e2)}), 500
