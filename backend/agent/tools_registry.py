from agent.tools.supabase_tools import (
    query_patient,
    query_patient_by_name,
    query_patient_by_room,
    query_room,
    query_room_by_number,
    list_rooms,
    query_shifts_by_date,
    find_available_nurses,
    get_nurse_availability,
    update_nurse_status,
    create_alert,
    update_shift_status,
    log_event,
    get_latest_vitals,
    get_vitals_by_patient_name,
    get_vitals_by_room,
    get_vitals_history,
    get_rooms_overview,
    admit_patient,
    discharge_patient,
    record_vitals,
)
from agent.tools.twilio_tools import send_sms as tool_send_sms

TOOL_EXECUTORS = {
    "query_patient": lambda args: query_patient(args["patient_id"]),
    "query_patient_by_name": lambda args: query_patient_by_name(args["name"]),
    "query_patient_by_room": lambda args: query_patient_by_room(args["room_id"]),
    "query_room": lambda args: query_room(args["room_id"]),
    "query_shifts": lambda args: query_shifts_by_date(args["date"]),
    "find_available_nurses": lambda args: find_available_nurses(
        args["date"], args.get("role")
    ),
    "get_nurse_availability": lambda args: get_nurse_availability(),
    "update_nurse_status": lambda args: update_nurse_status(
        args["nurse_id"],
        args["status"],
        args.get("current_room_id"),
        args.get("current_patient_id"),
    ),
    "create_alert": lambda args: create_alert(
        args["type"],
        args["room_id"],
        args["priority"],
        args["message"],
    ),
    "send_sms": lambda args: {"sid": tool_send_sms(args["to"], args["message"])},
    "update_shift_status": lambda args: update_shift_status(
        args["shift_id"], args["status"]
    ),
    "log_event": lambda args: log_event(args["event_type"], args["payload"]),
    "get_latest_vitals": lambda args: get_latest_vitals(args["patient_id"]),
    "get_vitals_by_patient_name": lambda args: get_vitals_by_patient_name(args["name"]),
    "get_vitals_by_room": lambda args: get_vitals_by_room(args["room_id_or_number"]),
    "get_vitals_history": lambda args: get_vitals_history(
        args["patient_id"], args.get("limit", 10)
    ),
    "get_rooms_overview": lambda args: get_rooms_overview(),
    "admit_patient": lambda args: admit_patient(
        args["room_id_or_number"],
        args["name"],
        args["age"],
        args["reason"],
        args.get("acuity_level", 1),
        args.get("family_phone"),
    ),
    "discharge_patient": lambda args: discharge_patient(args["patient_id"]),
    "record_vitals": lambda args: record_vitals(
        args["patient_id"],
        args.get("heart_rate"),
        args.get("bp_systolic"),
        args.get("bp_diastolic"),
        args.get("temperature_f"),
        args.get("oxygen_saturation"),
    ),
}
