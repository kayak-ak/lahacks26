import os

SMS_AGENT_PORT = int(os.getenv("SMS_AGENT_PORT", "8001"))
CHAT_AGENT_PORT = int(os.getenv("CHAT_AGENT_PORT", "8002"))

SMS_AGENT_SEED = os.getenv("SMS_AGENT_SEED", "sms_agent_recovery_phrase")
CHAT_AGENT_SEED = os.getenv("CHAT_AGENT_SEED", "chat_agent_recovery_phrase")

SMS_AGENT_ADDRESS = None
CHAT_AGENT_ADDRESS = None


def _compute_addresses():
    global SMS_AGENT_ADDRESS, CHAT_AGENT_ADDRESS
    from uagents import Agent

    _sms = Agent(name="sms_triage", seed=SMS_AGENT_SEED, port=SMS_AGENT_PORT)
    SMS_AGENT_ADDRESS = _sms.address

    _chat = Agent(name="chat_orchestrator", seed=CHAT_AGENT_SEED, port=CHAT_AGENT_PORT)
    CHAT_AGENT_ADDRESS = _chat.address


def get_sms_agent_address() -> str:
    if SMS_AGENT_ADDRESS is None:
        _compute_addresses()
    return SMS_AGENT_ADDRESS


def get_chat_agent_address() -> str:
    if CHAT_AGENT_ADDRESS is None:
        _compute_addresses()
    return CHAT_AGENT_ADDRESS
