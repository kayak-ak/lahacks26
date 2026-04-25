import asyncio
import json

from flask import Blueprint, request, jsonify

from agent.models import ChatRequest, ChatResponse
from agent import get_chat_agent_address

from uagents.query import query

agent_bp = Blueprint("agent", __name__)


@agent_bp.route("/agent/chat", methods=["POST"])
def agent_chat():
    data = request.get_json(force=True)
    message = data.get("message", "")
    context = data.get("context", "")

    if not message:
        return jsonify({"error": "message is required"}), 400

    address = get_chat_agent_address()

    async def _query_agent():
        response = await query(
            destination=address,
            message=ChatRequest(message=message, context=context),
            timeout=30.0,
        )
        return json.loads(response.decode_payload())

    try:
        result = asyncio.run(_query_agent())
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e), "reply": "", "tools_used": []}), 500
