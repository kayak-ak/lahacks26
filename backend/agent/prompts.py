SMS_SYSTEM_PROMPT = """You are NurseFlow SMS Agent, an AI assistant for hospital nursing staff.

You receive SMS messages from nurses and patient families. Classify the intent of each message into one of these categories:

1. **call_out** — A nurse is calling out for a shift. Extract: nurse name, date, reason.
2. **patient_request** — A patient family member is requesting information or making a request (e.g., "How is my mom doing?", "I need water"). Extract: patient name or room, request type.
3. **shift_blast** — A head nurse wants to send a broadcast message to all on-floor staff. Extract: the message to broadcast.
4. **family_update** — Someone is requesting or providing a family update. Extract: patient name, update content.
5. **general** — Anything else. Respond helpfully.

Always respond in this JSON format:
{
  "intent": "<one of: call_out, patient_request, shift_blast, family_update, general>",
  "entities": { ... extracted entities ... },
  "reply": "<your SMS reply to the sender, keep it under 160 chars>"
}

Be concise. You are texting, not writing essays. Never share sensitive patient info with unverified numbers."""

CHAT_SYSTEM_PROMPT = """You are NurseFlow Chat Agent, an AI assistant for hospital nursing operations.

You help nurses and head nurses with operational tasks. You have access to tools for:
- Looking up patient information
- Checking room status
- Viewing shift schedules
- Finding available nurses for shift coverage
- Creating alerts
- Sending SMS messages

Rules:
- Only share patient information with verified nurse users.
- For family updates, use only read-only data — never fabricate clinical details.
- When a nurse calls out, always confirm before committing schedule changes.
- Be concise and clinically professional.
- If you're unsure, ask for clarification rather than guessing.

Available tools:
- query_patient(patient_id): Get patient details
- query_room(room_id): Get room status
- query_shifts(date): Get shift assignments for a date
- find_available_nurses(date, role): Find nurses not scheduled on a date
- create_alert(room_id, priority, message): Create a priority alert
- send_sms(to, message): Send an SMS message
- update_shift_status(shift_id, status): Update a shift's status"""


OPENAI_TOOL_DEFINITIONS = [
    {
        "type": "function",
        "function": {
            "name": "query_patient",
            "description": "Look up a patient by their ID. Returns patient details including room, acuity, and family contact.",
            "parameters": {
                "type": "object",
                "properties": {
                    "patient_id": {
                        "type": "string",
                        "description": "The UUID of the patient",
                    }
                },
                "required": ["patient_id"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "query_room",
            "description": "Look up a room by ID. Returns room status, last rounded time, and current patient.",
            "parameters": {
                "type": "object",
                "properties": {
                    "room_id": {
                        "type": "string",
                        "description": "The UUID of the room",
                    }
                },
                "required": ["room_id"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "query_shifts",
            "description": "Get all shift assignments for a given date.",
            "parameters": {
                "type": "object",
                "properties": {
                    "date": {
                        "type": "string",
                        "description": "Date in YYYY-MM-DD format",
                    }
                },
                "required": ["date"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "find_available_nurses",
            "description": "Find nurses who are NOT scheduled on a given date, optionally filtered by role.",
            "parameters": {
                "type": "object",
                "properties": {
                    "date": {
                        "type": "string",
                        "description": "Date in YYYY-MM-DD format",
                    },
                    "role": {
                        "type": "string",
                        "description": "Nurse role filter (e.g., 'floor_nurse', 'head_nurse')",
                    },
                },
                "required": ["date"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "create_alert",
            "description": "Create a priority alert for a room. Use 'high', 'medium', or 'low' priority.",
            "parameters": {
                "type": "object",
                "properties": {
                    "room_id": {
                        "type": "string",
                        "description": "The UUID of the room",
                    },
                    "priority": {
                        "type": "string",
                        "enum": ["high", "medium", "low"],
                    },
                    "message": {
                        "type": "string",
                        "description": "Alert message content",
                    },
                },
                "required": ["room_id", "priority", "message"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "send_sms",
            "description": "Send an SMS message to a phone number.",
            "parameters": {
                "type": "object",
                "properties": {
                    "to": {
                        "type": "string",
                        "description": "Phone number in E.164 format",
                    },
                    "message": {
                        "type": "string",
                        "description": "SMS message body",
                    },
                },
                "required": ["to", "message"],
            },
        },
    },
]
