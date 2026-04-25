import os

SMS_AGENT_PORT = int(os.getenv("SMS_AGENT_PORT", "8001"))
CHAT_AGENT_PORT = int(os.getenv("CHAT_AGENT_PORT", "8002"))

SMS_AGENT_URL = f"http://127.0.0.1:{SMS_AGENT_PORT}"
CHAT_AGENT_URL = f"http://127.0.0.1:{CHAT_AGENT_PORT}"
