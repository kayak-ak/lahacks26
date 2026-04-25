import os
import sys
import multiprocessing

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from agent.sms_agent import sms_agent
from agent.chat_agent import chat_agent


def run_sms_agent():
    sms_agent.run()


def run_chat_agent():
    chat_agent.run()


if __name__ == "__main__":
    sms_port = int(os.getenv("SMS_AGENT_PORT", "8001"))
    chat_port = int(os.getenv("CHAT_AGENT_PORT", "8002"))

    sms_proc = multiprocessing.Process(target=run_sms_agent)
    chat_proc = multiprocessing.Process(target=run_chat_agent)

    print(f"Starting SMS Agent on port {sms_port}...")
    sms_proc.start()
    print(f"Starting Chat Agent on port {chat_port}...")
    chat_proc.start()

    try:
        sms_proc.join()
        chat_proc.join()
    except KeyboardInterrupt:
        print("\nShutting down agents...")
        sms_proc.terminate()
        chat_proc.terminate()
        sms_proc.join()
        chat_proc.join()
