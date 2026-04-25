import json
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from patch_cosmpy import patch_cosmpy_protobuf

patch_cosmpy_protobuf()

from uagents import Agent, Context, Model

from agent.prompts import CHAT_SYSTEM_PROMPT, OPENAI_TOOL_DEFINITIONS
from agent.tools.supabase_tools import (
    query_patient,
    query_patient_by_name,
    query_patient_by_room,
    query_room,
    query_room_by_number,
    list_rooms,
    query_shifts_by_date,
    find_available_nurses,
    get_nurse_availability,
    update_nurse_status,
    create_alert,
    update_shift_status,
    log_event,
    get_latest_vitals,
    get_vitals_by_patient_name,
    get_vitals_by_room,
    get_vitals_history,
    get_rooms_overview,
    admit_patient,
    discharge_patient,
    record_vitals,
)
from agent.tools.twilio_tools import send_sms as tool_send_sms
from integrations.openai_client import get_openai_client


class ChatRequest(Model):
    message: str
    context: str


class ChatResponse(Model):
    reply: str
    tools_used: list


chat_agent = Agent(
    name="chat_orchestrator",
    port=int(os.getenv("CHAT_AGENT_PORT", "8002")),
    seed=os.getenv("CHAT_AGENT_SEED", "chat_agent_recovery_phrase"),
    endpoint=[f"http://127.0.0.1:{os.getenv('CHAT_AGENT_PORT', '8002')}/submit"],
)

TOOL_EXECUTORS = {
    "query_patient": lambda args: query_patient(args["patient_id"]),
    "query_patient_by_name": lambda args: query_patient_by_name(args["name"]),
    "query_patient_by_room": lambda args: query_patient_by_room(args["room_id"]),
    "query_room": lambda args: query_room(args["room_id"]),
    "query_shifts": lambda args: query_shifts_by_date(args["date"]),
    "find_available_nurses": lambda args: find_available_nurses(
        args["date"], args.get("role")
    ),
    "get_nurse_availability": lambda args: get_nurse_availability(),
    "update_nurse_status": lambda args: update_nurse_status(
        args["nurse_id"],
        args["status"],
        args.get("current_room_id"),
        args.get("current_patient_id"),
    ),
    "create_alert": lambda args: create_alert(
        args["type"],
        args["room_id"],
        args["priority"],
        args["message"],
    ),
    "send_sms": lambda args: {"sid": tool_send_sms(args["to"], args["message"])},
    "update_shift_status": lambda args: update_shift_status(
        args["shift_id"], args["status"]
    ),
    "log_event": lambda args: log_event(args["event_type"], args["payload"]),
    "get_latest_vitals": lambda args: get_latest_vitals(args["patient_id"]),
    "get_vitals_by_patient_name": lambda args: get_vitals_by_patient_name(args["name"]),
    "get_vitals_by_room": lambda args: get_vitals_by_room(args["room_id_or_number"]),
    "get_vitals_history": lambda args: get_vitals_history(
        args["patient_id"], args.get("limit", 10)
    ),
    "get_rooms_overview": lambda args: get_rooms_overview(),
    "admit_patient": lambda args: admit_patient(
        args["room_id_or_number"],
        args["name"],
        args["age"],
        args["reason"],
        args.get("acuity_level", 1),
        args.get("family_phone"),
    ),
    "discharge_patient": lambda args: discharge_patient(args["patient_id"]),
    "record_vitals": lambda args: record_vitals(
        args["patient_id"],
        args.get("heart_rate"),
        args.get("bp_systolic"),
        args.get("bp_diastolic"),
        args.get("temperature_f"),
        args.get("oxygen_saturation"),
    ),
}


@chat_agent.on_rest_post("/chat", ChatRequest, ChatResponse)
async def handle_chat(ctx: Context, req: ChatRequest) -> ChatResponse:
    client = get_openai_client()

    messages = [
        {"role": "system", "content": CHAT_SYSTEM_PROMPT},
        {"role": "user", "content": req.message},
    ]
    if req.context:
        messages.insert(
            1, {"role": "system", "content": f"Additional context: {req.context}"}
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
        messages.append(message)

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


@chat_agent.on_rest_get("/health", ChatResponse)
async def health_check(ctx: Context) -> dict:
    return {"status": "ok", "agent": chat_agent.name}


if __name__ == "__main__":
    chat_agent.run()
