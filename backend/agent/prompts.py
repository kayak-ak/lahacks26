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
- Looking up patient information (by ID or name)
- Checking room status
- Viewing shift schedules
- Finding available nurses for shift coverage
- Seeing real-time nurse availability — who is available, busy, or on break, and which patient/room they're attending
- Creating alerts
- Sending SMS messages

Rules:
- Only share patient information with verified nurse users.
- For family updates, use only read-only data — never fabricate clinical details.
- When a nurse calls out, always confirm before committing schedule changes.
- Be concise and clinically professional.
- If you're unsure, ask for clarification rather than guessing.

Available tools:
- query_patient(patient_id): Get patient details by UUID
- query_patient_by_name(name): Get patient details by name
- query_room(room_id): Get room status
- query_shifts(date): Get shift assignments for a date
- find_available_nurses(date, role): Find nurses not scheduled on a date
- get_nurse_availability(): Get real-time status of all nurses — who's available, busy, or on break, and which patient/room they're attending
- update_nurse_status(nurse_id, status, room_id, patient_id): Update a nurse's real-time status
- create_alert(type, room_id, priority, message): Create a priority alert
- send_sms(to, message): Send an SMS message
- update_shift_status(shift_id, status): Update a shift's status"""


OPENAI_TOOL_DEFINITIONS = [
    {
        "type": "function",
        "function": {
            "name": "query_patient",
            "description": "Look up a patient by their UUID. Returns patient details including room, acuity, and family contact.",
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
            "name": "query_patient_by_name",
            "description": "Look up a patient by name. Use this when the user provides a name instead of a UUID.",
            "parameters": {
                "type": "object",
                "properties": {
                    "name": {
                        "type": "string",
                        "description": "The patient's name",
                    }
                },
                "required": ["name"],
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
                        "description": "Nurse role filter (e.g., 'nurse', 'head_nurse')",
                    },
                },
                "required": ["date"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_nurse_availability",
            "description": "Get real-time availability of all nurses. Shows who is available, busy, on break, or off duty, and which room/patient they are currently attending. Use this to answer questions like 'which nurses are available right now?' or 'who is attending room 204?'",
            "parameters": {
                "type": "object",
                "properties": {},
                "required": [],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "update_nurse_status",
            "description": "Update a nurse's real-time status (available, busy, break, off_duty) and optionally assign them to a room/patient.",
            "parameters": {
                "type": "object",
                "properties": {
                    "nurse_id": {
                        "type": "string",
                        "description": "The UUID of the nurse",
                    },
                    "status": {
                        "type": "string",
                        "enum": ["available", "busy", "break", "off_duty"],
                        "description": "The new status of the nurse",
                    },
                    "current_room_id": {
                        "type": "string",
                        "description": "Optional: UUID of the room the nurse is attending",
                    },
                    "current_patient_id": {
                        "type": "string",
                        "description": "Optional: UUID of the patient the nurse is attending",
                    },
                },
                "required": ["nurse_id", "status"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "create_alert",
            "description": "Create a priority alert for a room. Types include: rounding_violation, supply_request, safety, general.",
            "parameters": {
                "type": "object",
                "properties": {
                    "type": {
                        "type": "string",
                        "enum": [
                            "rounding_violation",
                            "supply_request",
                            "safety",
                            "general",
                        ],
                        "description": "The type of alert",
                    },
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
                "required": ["type", "room_id", "priority", "message"],
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
