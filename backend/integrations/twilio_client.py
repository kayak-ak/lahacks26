import os

from twilio.rest import Client

_twilio_client = None


def get_twilio_client() -> Client:
    global _twilio_client
    if _twilio_client is None:
        _twilio_client = Client(
            os.getenv("TWILIO_ACCOUNT_SID"),
            os.getenv("TWILIO_AUTH_TOKEN"),
        )
    return _twilio_client


def get_twilio_phone_number() -> str:
    return os.getenv("TWILIO_PHONE_NUMBER", "+15555551234")


def send_sms(to: str, body: str) -> str:
    client = get_twilio_client()
    from_number = get_twilio_phone_number()
    message = client.messages.create(to=to, from_=from_number, body=body)
    return message.sid


def make_call(to: str, twiml_url: str) -> str:
    client = get_twilio_client()
    from_number = get_twilio_phone_number()
    call = client.calls.create(to=to, from_=from_number, url=twiml_url)
    return call.sid
