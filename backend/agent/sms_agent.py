import json
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from uagents import Agent, Context

from agent.models import (
    SMSInboundRequest,
    SMSInboundResponse,
    SMSOutboundRequest,
    SMSOutboundResponse,
    CallOutRequest,
    CallOutResponse,
)
from agent.prompts import SMS_SYSTEM_PROMPT
from agent.tools.supabase_tools import (
    find_available_nurses,
    update_shift_status,
    log_event,
    query_patient,
)
from agent.tools.twilio_tools import send_sms_to_nurse, blast_sms_to_nurses
from integrations.openai_client import get_openai_client

sms_agent = Agent(
    name="sms_triage",
    port=int(os.getenv("SMS_AGENT_PORT", "8001")),
    seed=os.getenv("SMS_AGENT_SEED", "sms_agent_recovery_phrase"),
    endpoint=[f"http://127.0.0.1:{os.getenv('SMS_AGENT_PORT', '8001')}/submit"],
)


def _handle_call_out(entities: dict) -> tuple[str, str]:
    date = entities.get("date", "")
    reason = entities.get("reason", "No reason provided")
    nurse_name = entities.get("nurse_name", "Unknown nurse")

    available = find_available_nurses(date)
    if not available:
        return "call_out", "No available nurses found for that date."

    phone_numbers = [n["phone"] for n in available[:5] if n.get("phone")]
    message = f"Shift available on {date} ({reason}). Reply YES to confirm."
    blast_sms_to_nurses(phone_numbers, message)
    log_event(
        "call_out_initiated", {"nurse_name": nurse_name, "date": date, "reason": reason}
    )

    return (
        "call_out",
        f"Blast sent to {len(phone_numbers)} available nurses for {date}.",
    )


def _handle_patient_request(entities: dict) -> tuple[str, str]:
    patient_name = entities.get("patient_name")
    request_type = entities.get("request_type", "general")

    if patient_name:
        patient = query_patient(patient_name)
        if patient and patient.get("room_id"):
            return (
                "patient_request",
                f"Request for {patient_name} noted. Room {patient['room_id']} assigned.",
            )

    return (
        "patient_request",
        "Patient request received. We'll route this to the assigned nurse.",
    )


def _handle_shift_blast(entities: dict) -> tuple[str, str]:
    message = entities.get("message", "Attention: floor update.")
    date = entities.get("date")

    if date:
        available = find_available_nurses(date)
        phones = [n["phone"] for n in available if n.get("phone")]
        blast_sms_to_nurses(phones, message)
        return "shift_blast", f"Blast sent to {len(phones)} staff members."

    return "shift_blast", "Date required for shift blast. Please provide a date."


def _handle_family_update(entities: dict) -> tuple[str, str]:
    patient_name = entities.get("patient_name")
    if patient_name:
        patient = query_patient(patient_name)
        if patient:
            acuity = patient.get("acuity_level", "unknown")
            return (
                "family_update",
                f"Patient {patient_name} has acuity level {acuity}. "
                "An update will be prepared for the family.",
            )
    return "family_update", "Family update noted. We'll prepare an update."


@sms_agent.on_query(model=SMSInboundRequest, replies=SMSInboundResponse)
async def handle_sms_inbound(
    ctx: Context, _sender: str, msg: SMSInboundRequest
) -> SMSInboundResponse:
    client = get_openai_client()

    try:
        response = client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": SMS_SYSTEM_PROMPT},
                {"role": "user", "content": msg.body},
            ],
            response_format={"type": "json_object"},
        )
    except Exception as e:
        ctx.logger.error(f"OpenAI API error: {e}")
        return SMSInboundResponse(
            intent="general",
            reply="Sorry, I couldn't process your message. Please try again.",
            action_taken="none",
        )

    content = response.choices[0].message.content
    try:
        parsed = json.loads(content)
    except json.JSONDecodeError:
        return SMSInboundResponse(
            intent="general",
            reply="I received your message but had trouble understanding it. Could you rephrase?",
            action_taken="none",
        )

    intent = parsed.get("intent", "general")
    entities = parsed.get("entities", {})
    reply = parsed.get("reply", "")

    action_taken = "none"
    final_reply = reply

    if intent == "call_out":
        action_taken, detail = _handle_call_out(entities)
        final_reply = detail
    elif intent == "patient_request":
        action_taken, detail = _handle_patient_request(entities)
        final_reply = detail
    elif intent == "shift_blast":
        action_taken, detail = _handle_shift_blast(entities)
        final_reply = detail
    elif intent == "family_update":
        action_taken, detail = _handle_family_update(entities)
        final_reply = detail

    log_event(
        "sms_inbound",
        {
            "from": msg.from_number,
            "body": msg.body,
            "intent": intent,
            "action_taken": action_taken,
        },
    )

    return SMSInboundResponse(
        intent=intent,
        reply=final_reply[:320],
        action_taken=action_taken,
    )


@sms_agent.on_query(model=SMSOutboundRequest, replies=SMSOutboundResponse)
async def handle_sms_outbound(
    ctx: Context, _sender: str, msg: SMSOutboundRequest
) -> SMSOutboundResponse:
    try:
        sid = send_sms_to_nurse(msg.to_number, msg.message)
        log_event(
            "sms_outbound", {"to": msg.to_number, "message": msg.message, "sid": sid}
        )
        return SMSOutboundResponse(success=True, message_sid=sid)
    except Exception as e:
        ctx.logger.error(f"SMS send error: {e}")
        return SMSOutboundResponse(success=False, message_sid="")


@sms_agent.on_query(model=CallOutRequest, replies=CallOutResponse)
async def handle_call_out(
    ctx: Context, _sender: str, msg: CallOutRequest
) -> CallOutResponse:
    available = find_available_nurses(msg.date)
    if not available:
        return CallOutResponse(
            success=False,
            replacement_name="",
            message="No available nurses found.",
        )

    replacement = available[0]
    phone = replacement.get("phone", "")
    if phone:
        send_sms_to_nurse(
            phone,
            f"Hi {replacement['name']}, can you cover {msg.date} for {msg.nurse_name}? Reply YES to confirm.",
        )

    log_event(
        "call_out_processed",
        {
            "nurse_name": msg.nurse_name,
            "date": msg.date,
            "replacement": replacement.get("name"),
        },
    )

    return CallOutResponse(
        success=True,
        replacement_name=replacement.get("name", ""),
        message=f"SMS sent to {replacement.get('name', 'replacement')}.",
    )


@sms_agent.on_rest_get("/sms/health", SMSOutboundResponse)
async def health_check(ctx: Context) -> dict:
    return {"status": "ok", "agent": sms_agent.name}


if __name__ == "__main__":
    sms_agent.run()
