from uagents import Model


class ChatRequest(Model):
    message: str
    context: str


class ChatResponse(Model):
    reply: str
    tools_used: list


class SMSInboundRequest(Model):
    body: str
    from_number: str


class SMSInboundResponse(Model):
    intent: str
    reply: str
    action_taken: str


class SMSOutboundRequest(Model):
    to_number: str
    message: str


class SMSOutboundResponse(Model):
    success: bool
    message_sid: str


class CallOutRequest(Model):
    nurse_name: str
    date: str
    reason: str


class CallOutResponse(Model):
    success: bool
    replacement_name: str
    message: str
