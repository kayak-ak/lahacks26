import json

import requests as http_requests
from openai import OpenAI

from flask import Blueprint, request, jsonify, Response, stream_with_context

from agent import CHAT_AGENT_URL
from agent.prompts import CHAT_SYSTEM_PROMPT, OPENAI_TOOL_DEFINITIONS
from agent.tools_registry import TOOL_EXECUTORS
from integrations.openai_client import get_openai_client

agent_bp = Blueprint("agent", __name__)


def _build_messages(message: str, context: str | None) -> list[dict]:
    messages = [
        {"role": "system", "content": CHAT_SYSTEM_PROMPT},
    ]
    if context:
        messages.insert(
            1, {"role": "system", "content": f"Additional context: {context}"}
        )
    messages.append({"role": "user", "content": message})
    return messages


def _sse_event(event: str, data: dict) -> str:
    return f"event: {event}\ndata: {json.dumps(data)}\n\n"


def _stream_openai(messages: list[dict], client: OpenAI):
    tools_used: list[str] = []

    try:
        while True:
            response = client.chat.completions.create(
                model="gpt-4o",
                messages=messages,
                tools=OPENAI_TOOL_DEFINITIONS,
                tool_choice="auto",
                stream=True,
            )

            collected_content = ""
            tool_calls_map: dict[int, dict] = {}

            for chunk in response:
                if not chunk.choices:
                    continue
                delta = chunk.choices[0].delta

                if delta.content:
                    collected_content += delta.content
                    yield _sse_event("token", {"content": delta.content})

                if delta.tool_calls:
                    for tc in delta.tool_calls:
                        idx = tc.index
                        if idx not in tool_calls_map:
                            tool_calls_map[idx] = {
                                "id": tc.id or "",
                                "name": (tc.function.name or "") if tc.function else "",
                                "arguments": (tc.function.arguments or "")
                                if tc.function
                                else "",
                            }
                        else:
                            if tc.id:
                                tool_calls_map[idx]["id"] = tc.id
                            if tc.function:
                                if tc.function.name:
                                    tool_calls_map[idx]["name"] = tc.function.name
                                if tc.function.arguments:
                                    tool_calls_map[idx]["arguments"] += (
                                        tc.function.arguments
                                    )

            if not tool_calls_map:
                break

            assistant_msg = {"role": "assistant", "content": collected_content or None}
            assistant_tc = []
            for idx in sorted(tool_calls_map.keys()):
                entry = tool_calls_map[idx]
                assistant_tc.append(
                    {
                        "id": entry["id"],
                        "type": "function",
                        "function": {
                            "name": entry["name"],
                            "arguments": entry["arguments"],
                        },
                    }
                )
            assistant_msg["tool_calls"] = assistant_tc
            messages.append(assistant_msg)

            for idx in sorted(tool_calls_map.keys()):
                entry = tool_calls_map[idx]
                func_name = entry["name"]
                tools_used.append(func_name)

                yield _sse_event(
                    "tool_call", {"name": func_name, "args": entry["arguments"]}
                )

                executor = TOOL_EXECUTORS.get(func_name)
                if executor is None:
                    messages.append(
                        {
                            "role": "tool",
                            "tool_call_id": entry["id"],
                            "content": json.dumps(
                                {"error": f"Unknown tool: {func_name}"}
                            ),
                        }
                    )
                    continue

                try:
                    func_args = json.loads(entry["arguments"])
                    result = executor(func_args)
                    messages.append(
                        {
                            "role": "tool",
                            "tool_call_id": entry["id"],
                            "content": json.dumps(result, default=str),
                        }
                    )
                except Exception as e:
                    messages.append(
                        {
                            "role": "tool",
                            "tool_call_id": entry["id"],
                            "content": json.dumps({"error": str(e)}),
                        }
                    )

        yield _sse_event("done", {"tools_used": tools_used})
    except Exception as e:
        yield _sse_event("error", {"message": str(e)})
        yield _sse_event("done", {"tools_used": tools_used})


@agent_bp.route("/agent/stream", methods=["POST"])
def agent_stream():
    data = request.get_json(force=True)
    message = data.get("message", "")
    context = data.get("context", "")

    if not message:
        return jsonify({"error": "message is required"}), 400

    client = get_openai_client()
    messages = _build_messages(message, context or None)

    try:
        generator = _stream_openai(messages, client)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

    return Response(
        stream_with_context(generator),
        mimetype="text/event-stream; charset=utf-8",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
            "Connection": "keep-alive",
            "Transfer-Encoding": "chunked",
        },
    )


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
