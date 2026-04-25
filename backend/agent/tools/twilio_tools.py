from integrations.twilio_client import send_sms


def send_sms_to_nurse(phone: str, message: str) -> str:
    return send_sms(phone, message)


def blast_sms_to_nurses(phones: list[str], message: str) -> list[str]:
    results = []
    for phone in phones:
        sid = send_sms(phone, message)
        results.append(sid)
    return results
