import requests as http_requests

from flask import Blueprint, request, Response, jsonify

from agent import SMS_AGENT_URL
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

    try:
        resp = http_requests.post(
            f"{SMS_AGENT_URL}/sms/inbound",
            json={"body": body, "from_number": from_number},
            timeout=30.0,
        )
        result = resp.json()
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

    try:
        resp = http_requests.post(
            f"{SMS_AGENT_URL}/sms/outbound",
            json={"to_number": to_number, "message": message},
            timeout=15.0,
        )
        return jsonify(resp.json()), resp.status_code
    except http_requests.exceptions.ConnectionError:
        try:
            sid = send_sms(to_number, message)
            return jsonify({"success": True, "message_sid": sid})
        except Exception as e:
            return jsonify({"error": str(e)}), 500
    except Exception as e:
        return jsonify({"error": str(e)}), 500
