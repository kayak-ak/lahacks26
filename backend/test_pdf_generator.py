"""Quick smoke test for generate_patient_summary with mocked Supabase data."""

import sys
import os
from unittest.mock import MagicMock, patch

sys.path.insert(0, os.path.dirname(__file__))

FAKE_PATIENT = {
    "id": "p-001",
    "name": "James Nguyen",
    "room_id": "r-204",
    "acuity_level": 3,
    "admitted_at": "2026-04-20T08:30:00",
    "family_phone": "+1-555-0123",
}

FAKE_ROOM = {
    "id": "r-204",
    "number": "204",
    "status": "occupied",
    "last_rounded_at": "2026-04-25T11:45:00",
    "last_sanitized_at": "2026-04-25T11:45:00",
    "camera_feed_url": "",
}

FAKE_ROUNDING_LOGS = [
    {
        "entered_at": "2026-04-25T11:45:00",
        "duration_sec": 180,
        "sanitized": True,
        "nurse_id": "n-101",
    },
    {
        "entered_at": "2026-04-25T10:45:00",
        "duration_sec": 120,
        "sanitized": True,
        "nurse_id": "n-102",
    },
    {
        "entered_at": "2026-04-25T09:45:00",
        "duration_sec": 90,
        "sanitized": False,
        "nurse_id": "n-101",
    },
]

FAKE_ALERTS = [
    {
        "type": "rounding_violation",
        "priority": "high",
        "message": "Room 204 not rounded in 60 min",
        "created_at": "2026-04-25T09:00:00",
        "resolved_at": None,
    },
]

FAKE_FAMILY_CONTACTS = [
    {
        "name": "Linh Nguyen",
        "phone": "+1-555-0456",
        "preferred_channel": "sms",
    },
]


def _mock_supabase():
    """Build a mock supabase client that returns fake data."""
    mock = MagicMock()

    def _table(name):
        q = MagicMock()

        # Chainable methods
        q.select.return_value = q
        q.eq.return_value = q
        q.order.return_value = q
        q.limit.return_value = q

        # Data returned by .execute()
        if name == "patients":
            q.execute.return_value = MagicMock(data=[FAKE_PATIENT])
        elif name == "rooms":
            q.execute.return_value = MagicMock(data=[FAKE_ROOM])
        elif name == "rounding_logs":
            q.execute.return_value = MagicMock(data=FAKE_ROUNDING_LOGS)
        elif name == "alerts":
            q.execute.return_value = MagicMock(data=FAKE_ALERTS)
        elif name == "family_contacts":
            q.execute.return_value = MagicMock(data=FAKE_FAMILY_CONTACTS)
        else:
            q.execute.return_value = MagicMock(data=[])

        return q

    mock.table.side_effect = _table
    return mock


def main():
    mock_sb = _mock_supabase()
    with patch.dict(sys.modules, {"db": MagicMock(supabase=mock_sb)}):
        from agent.tools.generate_patient_summary import generate_patient_summary

        result = generate_patient_summary("James Nguyen")

    if "error" in result:
        print(f"FAILED: {result['error']}")
        sys.exit(1)

    pdf_path = result["pdf_path"]
    if os.path.isfile(pdf_path):
        size = os.path.getsize(pdf_path)
        print(f"SUCCESS — PDF generated at: {pdf_path} ({size:,} bytes)")
    else:
        print(f"FAILED — path returned but file not found: {pdf_path}")
        sys.exit(1)


if __name__ == "__main__":
    main()
