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
- Looking up patient information (by ID or name), including age, reason for admission, and acuity level
- Checking room status and room type (patient, exam, triage, emergency)
- Viewing patient vital signs: heart rate, blood pressure, temperature, and oxygen saturation
- Viewing vitals history for trend analysis
- Getting a full rooms overview with patients, vitals, and nurse assignments
- Viewing shift schedules
- Finding available nurses for shift coverage
- Seeing real-time nurse availability — who is available, busy, or on break, and which patient/room they're attending
- Recording new vital sign readings
- Admitting patients to rooms
- Discharging patients from rooms
- Creating alerts
- Sending SMS messages

Rules:
- Only share patient information with verified nurse users.
- For family updates, use only read-only data — never fabricate clinical details.
- When a nurse calls out, always confirm before committing schedule changes.
- **Before admitting, discharging, or recording vitals, always confirm the action with the user before executing.**
- When discussing vital signs, include units (bpm, mmHg, °F, %) and flag any values outside normal ranges:
  - Heart rate: normal 60-100 bpm; critical if <50 or >120
  - Blood pressure: normal systolic <120 and diastolic <80; critical if systolic >140 or diastolic >90
  - Temperature: normal 97-99°F; fever ≥100.4°F
  - Oxygen saturation: normal 95-100%; critical if <90%
- Be concise and clinically professional.
- If you're unsure, ask for clarification rather than guessing."
- Room types are: patient (standard rooms), exam (examination rooms), triage, and emergency.

Available tools:
- query_patient(patient_id): Get patient details by UUID, including age, reason, acuity level, and room
- query_patient_by_name(name): Get patient details by name, including age, reason, and acuity level
- query_room(room_id): Get room status and type
- query_patient_by_room(room_id): Get the patient assigned to a room
- query_shifts(date): Get shift assignments for a date with nurse details
- find_available_nurses(date, role): Find nurses not scheduled on a date
- get_nurse_availability(): Get real-time status of all nurses
- update_nurse_status(nurse_id, status, room_id, patient_id): Update a nurse's real-time status
- create_alert(type, room_id, priority, message): Create a priority alert. Types: vitals, rounding, medication, safety, general
- send_sms(to, message): Send an SMS message
- update_shift_status(shift_id, status): Update a shift's status
- log_event(event_type, payload): Log an event for audit purposes
- get_latest_vitals(patient_id): Get the most recent vital signs for a patient
- get_vitals_by_patient_name(name): Get patient details and latest vitals by patient name
- get_vitals_by_room(room_id_or_number): Get room, patient, and latest vitals by room UUID or number (e.g., "102", "Exam Room 2")
- get_vitals_history(patient_id, limit): Get recent vitals readings for trend analysis
- get_rooms_overview(): Get a summary of all rooms with patients, vitals, and nurse assignments
- admit_patient(room_id_or_number, name, age, reason, acuity_level, family_phone): Admit a patient to a room. Accepts room UUID or number.
- discharge_patient(patient_id): Discharge a patient — removes them from the room and sets room to needs_cleaning
- record_vitals(patient_id, heart_rate, bp_systolic, bp_diastolic, temperature_f, oxygen_saturation): Record a new vital signs reading"""


OPENAI_TOOL_DEFINITIONS = [
    {
        "type": "function",
        "function": {
            "name": "query_patient",
            "description": "Look up a patient by their UUID. Returns patient details including name, age, reason for admission, acuity level, room assignment, and family phone.",
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
            "description": "Look up a patient by name. Returns patient details including age, reason for admission, acuity level, room, and family phone. Use this when the user provides a name instead of a UUID.",
            "parameters": {
                "type": "object",
                "properties": {
                    "name": {
                        "type": "string",
                        "description": "The patient's name (e.g., 'Sarah Johnson')",
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
            "description": "Look up a room by UUID. Returns room status, type (patient, exam, triage, emergency), number, last rounded/sanitized times.",
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
            "name": "query_patient_by_room",
            "description": "Find the patient assigned to a room. Returns patient details including name, age, reason, and acuity level.",
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
            "description": "Get all shift assignments for a given date, including nurse details.",
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
            "description": "Get real-time availability of all nurses. Shows who is available, busy, on break, or off duty, and which room/patient they are currently attending, including room type.",
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
            "description": "Create a priority alert for a room. Types include: vitals, rounding, medication, safety, general.",
            "parameters": {
                "type": "object",
                "properties": {
                    "type": {
                        "type": "string",
                        "enum": [
                            "vitals",
                            "rounding",
                            "medication",
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
                        "description": "Alert priority level",
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
    {
        "type": "function",
        "function": {
            "name": "update_shift_status",
            "description": "Update the status of a shift (e.g., confirmed, cancelled, completed).",
            "parameters": {
                "type": "object",
                "properties": {
                    "shift_id": {
                        "type": "string",
                        "description": "The UUID of the shift",
                    },
                    "status": {
                        "type": "string",
                        "description": "The new status (e.g., confirmed, cancelled, completed)",
                    },
                },
                "required": ["shift_id", "status"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "log_event",
            "description": "Log an event to the audit log for tracking purposes.",
            "parameters": {
                "type": "object",
                "properties": {
                    "event_type": {
                        "type": "string",
                        "description": "Type of event (e.g., 'vitals_recorded', 'patient_admitted')",
                    },
                    "payload": {
                        "type": "object",
                        "description": "JSON payload with event details",
                    },
                },
                "required": ["event_type", "payload"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_latest_vitals",
            "description": "Get the most recent vital signs for a patient by their UUID. Returns heart rate, blood pressure (systolic/diastolic), temperature (°F), and oxygen saturation.",
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
            "name": "get_vitals_by_patient_name",
            "description": "Look up a patient by name and return their details along with the latest vital signs (heart rate, blood pressure, temperature, O2 saturation).",
            "parameters": {
                "type": "object",
                "properties": {
                    "name": {
                        "type": "string",
                        "description": "The patient's name (e.g., 'Michael Chen')",
                    }
                },
                "required": ["name"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_vitals_by_room",
            "description": "Look up room details, the assigned patient, and their latest vital signs by room number or UUID. Accepts room numbers like '102', 'Exam Room 2', 'Triage Room', or a room UUID.",
            "parameters": {
                "type": "object",
                "properties": {
                    "room_id_or_number": {
                        "type": "string",
                        "description": "Room UUID, or human-readable room number like '102', 'Exam Room 2', 'Triage Room'",
                    }
                },
                "required": ["room_id_or_number"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_vitals_history",
            "description": "Get recent vital signs readings for a patient to analyze trends. Returns the last N readings ordered by most recent first.",
            "parameters": {
                "type": "object",
                "properties": {
                    "patient_id": {
                        "type": "string",
                        "description": "The UUID of the patient",
                    },
                    "limit": {
                        "type": "integer",
                        "description": "Number of readings to return (default 10)",
                    },
                },
                "required": ["patient_id"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_rooms_overview",
            "description": "Get a summary of all rooms including room type, status, assigned patient (with age, reason, acuity), latest vitals (HR, BP, temp, O2), and attending nurse. Use for dashboard-style queries.",
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
            "name": "admit_patient",
            "description": "Admit a new patient to a room. Sets the room status to 'occupied'. Accepts room UUID or room number (e.g., '102', 'Exam Room 2'). Always confirm with the user before admitting.",
            "parameters": {
                "type": "object",
                "properties": {
                    "room_id_or_number": {
                        "type": "string",
                        "description": "Room UUID or room number (e.g., '102', 'Exam Room 2')",
                    },
                    "name": {
                        "type": "string",
                        "description": "Patient name",
                    },
                    "age": {
                        "type": "integer",
                        "description": "Patient age",
                    },
                    "reason": {
                        "type": "string",
                        "description": "Reason for admission",
                    },
                    "acuity_level": {
                        "type": "integer",
                        "description": "Acuity level 1-5 (1=low, 5=critical)",
                    },
                    "family_phone": {
                        "type": "string",
                        "description": "Family contact phone number",
                    },
                },
                "required": [
                    "room_id_or_number",
                    "name",
                    "age",
                    "reason",
                    "acuity_level",
                ],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "discharge_patient",
            "description": "Discharge a patient from their room. Removes the patient from the room and sets room status to 'needs_cleaning'. Always confirm with the user before discharging.",
            "parameters": {
                "type": "object",
                "properties": {
                    "patient_id": {
                        "type": "string",
                        "description": "The UUID of the patient to discharge",
                    }
                },
                "required": ["patient_id"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "record_vitals",
            "description": "Record a new set of vital signs for a patient. All measurement fields are optional — provide whichever readings were taken. Always confirm with the user before recording.",
            "parameters": {
                "type": "object",
                "properties": {
                    "patient_id": {
                        "type": "string",
                        "description": "The UUID of the patient",
                    },
                    "heart_rate": {
                        "type": "integer",
                        "description": "Heart rate in bpm",
                    },
                    "bp_systolic": {
                        "type": "integer",
                        "description": "Systolic blood pressure in mmHg",
                    },
                    "bp_diastolic": {
                        "type": "integer",
                        "description": "Diastolic blood pressure in mmHg",
                    },
                    "temperature_f": {
                        "type": "number",
                        "description": "Temperature in Fahrenheit",
                    },
                    "oxygen_saturation": {
                        "type": "integer",
                        "description": "Oxygen saturation percentage",
                    },
                },
                "required": ["patient_id"],
            },
        },
    },
]
