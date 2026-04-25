import json
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from uagents import Agent, Context

from agent.models import ChatRequest, ChatResponse
from agent.prompts import CHAT_SYSTEM_PROMPT, OPENAI_TOOL_DEFINITIONS
from agent.tools.supabase_tools import (
    query_patient,
    query_room,
    query_shifts_by_date as query_shifts,
    find_available_nurses,
    create_alert,
)
from agent.tools.twilio_tools import send_sms as tool_send_sms
from integrations.openai_client import get_openai_client

chat_agent = Agent(
    name="chat_orchestrator",
    port=int(os.getenv("CHAT_AGENT_PORT", "8002")),
    seed=os.getenv("CHAT_AGENT_SEED", "chat_agent_recovery_phrase"),
    endpoint=[f"http://127.0.0.1:{os.getenv('CHAT_AGENT_PORT', '8002')}/submit"],
)


TOOL_EXECUTORS = {
    "query_patient": lambda args: query_patient(args["patient_id"]),
    "query_room": lambda args: query_room(args["room_id"]),
    "query_shifts": lambda args: query_shifts(args["date"]),
    "find_available_nurses": lambda args: find_available_nurses(
        args["date"], args.get("role")
    ),
    "create_alert": lambda args: create_alert(
        args["room_id"], args["priority"], args["message"]
    ),
    "send_sms": lambda args: {"sid": tool_send_sms(args["to"], args["message"])},
}


@chat_agent.on_query(model=ChatRequest, replies=ChatResponse)
async def handle_chat(ctx: Context, _sender: str, msg: ChatRequest) -> ChatResponse:
    client = get_openai_client()

    messages = [
        {"role": "system", "content": CHAT_SYSTEM_PROMPT},
        {"role": "user", "content": msg.message},
    ]
    if msg.context:
        messages.insert(
            1, {"role": "system", "content": f"Additional context: {msg.context}"}
        )

    tools_used: list[str] = []

    try:
        response = client.chat.completions.create(
            model="gpt-4o",
            messages=messages,
            tools=OPENAI_TOOL_DEFINITIONS,
            tool_choice="auto",
        )
    except Exception as e:
        ctx.logger.error(f"OpenAI API error: {e}")
        return ChatResponse(reply=f"Error processing request: {e}", tools_used=[])

    message = response.choices[0].message

    tool_calls = message.tool_calls
    if tool_calls:
        for tool_call in tool_calls:
            func_name = tool_call.function.name
            func_args = json.loads(tool_call.function.arguments)
            tools_used.append(func_name)

            executor = TOOL_EXECUTORS.get(func_name)
            if executor is None:
                ctx.logger.warning(f"Unknown tool: {func_name}")
                continue

            try:
                result = executor(func_args)
                messages.append(
                    {
                        "role": "tool",
                        "tool_call_id": tool_call.id,
                        "content": json.dumps(result, default=str),
                    }
                )
            except Exception as e:
                ctx.logger.error(f"Tool execution error ({func_name}): {e}")
                messages.append(
                    {
                        "role": "tool",
                        "tool_call_id": tool_call.id,
                        "content": json.dumps({"error": str(e)}),
                    }
                )

        try:
            final_response = client.chat.completions.create(
                model="gpt-4o",
                messages=messages,
                tools=OPENAI_TOOL_DEFINITIONS,
                tool_choice="auto",
            )
            reply = final_response.choices[0].message.content or ""
        except Exception as e:
            ctx.logger.error(f"OpenAI follow-up error: {e}")
            reply = "I was able to process your request but encountered an error formatting the response."

        return ChatResponse(reply=reply, tools_used=tools_used)

    reply = message.content or ""
    return ChatResponse(reply=reply, tools_used=tools_used)


@chat_agent.on_rest_get("/agent/health", ChatResponse)
async def health_check(ctx: Context) -> dict:
    return {"status": "ok", "agent": chat_agent.name}


if __name__ == "__main__":
    chat_agent.run()
