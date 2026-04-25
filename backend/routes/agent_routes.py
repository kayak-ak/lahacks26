import requests as http_requests

from flask import Blueprint, request, jsonify

from agent import CHAT_AGENT_URL

agent_bp = Blueprint("agent", __name__)


@agent_bp.route("/agent/chat", methods=["POST"])
def agent_chat():
    data = request.get_json(force=True)
    message = data.get("message", "")
    context = data.get("context", "")

    if not message:
        return jsonify({"error": "message is required"}), 400

    try:
        resp = http_requests.post(
            f"{CHAT_AGENT_URL}/chat",
            json={"message": message, "context": context},
            timeout=30.0,
        )
        return jsonify(resp.json()), resp.status_code
    except http_requests.exceptions.ConnectionError:
        return jsonify(
            {"error": "Chat agent is not reachable", "reply": "", "tools_used": []}
        ), 503
    except http_requests.exceptions.Timeout:
        return jsonify(
            {"error": "Chat agent timed out", "reply": "", "tools_used": []}
        ), 504
    except Exception as e:
        return jsonify({"error": str(e), "reply": "", "tools_used": []}), 500
