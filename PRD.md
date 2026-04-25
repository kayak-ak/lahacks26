# Product Requirements Document: NurseFlow AI

> AI-driven operations hub for mitigating nurse understaffing and administrative fatigue through automated communication, scheduling, and real-time monitoring.

---

## 1. Problem Statement

Nurses spend up to 35% of their shift on administrative tasks — call-outs, family updates, scheduling, manual rounding logs — instead of direct patient care. Understaffed floors compound this: missed rounds, hygiene lapses, and information bottlenecks put patients at risk. There is no unified system that automates admin overhead **and** provides real-time operational visibility to floor leads.

## 2. Primary Users

| Persona | Role | Core Needs |
|---------|------|------------|
| **Floor Nurse (Primary)** | Bedside care provider | Hands-free updates, automatic rounding logs, quick-shift scheduling |
| **Head Nurse / Charge Nurse (Primary)** | Floor operations lead | Real-time ward visibility, shift-fill alerts, compliance dashboards |
| **Patient Family (Secondary)** | Recipient of care updates | Proactive call/SMS updates on loved one's status |
| **Hospital Admin (Tertiary)** | Resource planner | Aggregate compliance metrics, staffing analytics |

## 3. Core Objectives

1. **Administrative Offloading** — Automate routine inquiries (family updates, shift call-outs, supply requests) via voice + SMS agents.
2. **Enhanced Patient Safety** — Enforce consistent hourly rounding and hand-hygiene compliance through CV monitoring.
3. **Operational Transparency** — Provide a real-time "Digital Twin" of the ward so head nurses can triage issues at a glance.
4. **Intelligent Scheduling** — Let the AI agent manage shift coverage, calendar edits, and blast notifications autonomously.

## 4. Tech Stack

### 4.1 Backend

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| API Server | **Flask** (Python) | Lightweight, fast to stand up; native Python ecosystem for ML/CV interop. Hosts REST endpoints, WebSocket feeds, and LLM orchestration. |
| Database | **Supabase** (PostgreSQL) | Managed Postgres with real-time subscriptions (for dashboard push), built-in auth, row-level security. Stores patients, rooms, shifts, rounding logs, alerts. |
| Auth | **Supabase Auth** | Role-based access (nurse, head nurse, admin) with JWT tokens. |
| Real-time | **Supabase Realtime** | Pushes room status changes, alerts, and rounding events to the frontend over WebSocket. |

### 4.2 AI & Agent Layer

| Component | Technology | Rationale |
|-----------|-----------|-----------|
| LLM Core | **OpenAI GPT-4o** (or similar) | Tool-calling / function-calling for structured agent actions (schedule edits, alerts, lookups). |
| Agent Orchestration | **Custom Flask routes + tool registry** | Agent receives natural language → decides which tool to call (calendar, SMS, DB query, alert). |
| Voice Synthesis | **ElevenLabs API** | Low-latency, natural TTS for outbound family-update calls and internal nurse announcements. |
| Voice Telephony | **Twilio Voice** | Inbound/outbound call handling; integrates with ElevenLabs for full conversational IVR. |
| SMS | **Twilio SMS** | Schedule blast notifications, triage patient requests, family text updates. |

### 4.3 Computer Vision

| Component | Technology | Rationale |
|-----------|-----------|-----------|
| Pose Estimation | **MediaPipe** (Holistic / Pose) | Real-time, on-device detection of staff entering patient rooms and hand-sanitization gestures near dispensers. No cloud GPU required. |
| Room Occupancy | **MediaPipe + simple CV** | Detect open vs. occupied rooms and push status to Supabase for dashboard rendering. |
| Processing | **Python CV service** | Separate lightweight Flask microservice or threaded process consuming RTSP camera feeds, running MediaPipe inference, posting events to Supabase. |

### 4.4 Scheduling & Integration

| Component | Technology | Rationale |
|-----------|-----------|-----------|
| Calendar | **Google Calendar API** | Authoritative shift calendar; reads/writes via service account. |
| Agent ↔ Calendar | **MCP (Model Context Protocol)** | Structured tool interface allowing the AI agent to create, modify, and delete calendar events (shift swaps, call-out coverage). |

### 4.5 Frontend

| Component | Technology | Rationale |
|-----------|-----------|-----------|
| SPA Framework | **React + Vite** | Fast HMR for hackathon velocity; component ecosystem. |
| 3D / Spatial View | **Three.js / React Three Fiber** | Digital twin of the hospital floor — color-coded rooms, equipment markers, live staff positions. |
| State | **React Query + Supabase Realtime hooks** | Server-state caching + live subscriptions for real-time badge updates. |
| Styling | **Tailwind CSS** | Rapid prototyping with utility classes. |

## 5. System Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                        FRONTEND (React + Vite)                    │
│  ┌─────────────────┐  ┌──────────────────┐  ┌────────────────┐  │
│  │  Dashboard       │  │  Three.js        │  │  Shift Mgmt    │  │
│  │  (alerts, feeds) │  │  Digital Twin     │  │  (calendar UI) │  │
│  └────────┬────────┘  └────────┬─────────┘  └───────┬────────┘  │
│           │   Supabase Realtime │                    │            │
└───────────┼────────────────────┼────────────────────┼────────────┘
            │                    │                    │
            ▼                    ▼                    ▼
┌──────────────────────────────────────────────────────────────────┐
│                     Supabase (Postgres + Auth + Realtime)        │
│  patients │ rooms │ shifts │ rounding_logs │ alerts │ events     │
└──────────────────────────┬───────────────────────────────────────┘
                           │ DB triggers / webhooks
                           ▼
┌──────────────────────────────────────────────────────────────────┐
│                     FLASK API SERVER                              │
│  ┌─────────────┐  ┌──────────────┐  ┌─────────────────────────┐│
│  │ /voice      │  │ /sms         │  │ /agent (LLM orchestrate) ││
│  │ Twilio web  │  │ Twilio web   │  │ tool-call dispatcher     ││
│  └──────┬──────┘  └──────┬───────┘  └──────────┬──────────────┘│
│         │                │                      │                │
│  ┌──────▼──────┐  ┌──────▼───────┐  ┌──────────▼──────────────┐│
│  │ ElevenLabs  │  │ Twilio SMS   │  │ MCP → Google Calendar   ││
│  │ TTS / STT   │  │ outbound     │  │ shift CRUD              ││
│  └─────────────┘  └──────────────┘  └─────────────────────────┘│
└──────────────────────────────────────────────────────────────────┘
                           ▲
                           │ CV events (room visits, gestures)
┌──────────────────────────────────────────────────────────────────┐
│                     CV SERVICE (Python + MediaPipe)               │
│  RTSP camera → pose estimation → event classification → Supabase │
└──────────────────────────────────────────────────────────────────┘
```

## 6. Feature Breakdown

### 6.1 Voice Agent (Family Updates & Call-outs)

- **Inbound**: Family member calls in → Twilio webhook → LLM determines patient identity → queries Supabase for status → ElevenLabs speaks update.
- **Outbound**: Nurse triggers "update family" via dashboard or SMS → agent calls family → delivers scripted + dynamic update.
- **Call-out handling**: Nurse texts "call out [name] [reason]" → agent finds coverage candidates → blast-calls via ElevenLabs + Twilio until shift filled.
- **Language**: Support English + Spanish TTS (ElevenLabs multilingual voices).

### 6.2 SMS Triage Agent

- **Patient request**: Text-based intake (e.g., "I need water", "pain level 7") → classified by LLM → routed to assigned nurse or runner via SMS.
- **Shift blast**: Head nurse sends one command → agent fans out SMS to all on-floor staff.
- **Family SMS**: Subscribe family numbers → automated check-in texts at configurable intervals.

### 6.3 Rounding Sentinel (CV)

- **Room-entry detection**: MediaPipe Pose processes camera feed; when a person in scrubs enters a room zone, a `rounding_log` row is upserted in Supabase with `room_id`, `timestamp`, `staff_id` (if identifiable).
- **60-min violation**: Supabase cron / Flask scheduler checks every 5 min — rooms unvisited for > 60 min trigger a high-priority Twilio alert to the floor lead.
- **Sanitization gesture**: MediaPipe Holistic tracks hand position near dispenser zones; logs `sanitization_event` tied to the room entry. Non-compliance flags the rounding entry.
- **Open-room detection**: CV classifies rooms as "open/occupied/needs-cleaning" and writes status to `rooms` table; reflected instantly on the Digital Twin.
- **Edge note**: All CV inference runs on-device (no cloud round-trip) to minimize latency and respect privacy.

### 6.4 Digital Twin Dashboard (Three.js)

- **Floor layout**: 3D or 2D top-down model built in React Three Fiber. Each room is a selectable mesh.
- **Color coding**:
  - 🟢 Green — recently rounded, low acuity
  - 🟡 Yellow — approaching 60-min rounding deadline
  - 🔴 Red — overdue rounding or high acuity
  - 🔵 Blue — open / available
  - ⬜ Gray — needs cleaning
- **Live markers**: Supply runners, equipment, and nurse positions overlay the map (fed from CV service + manual check-ins).
- **Click-to-act**: Select a room → sidebar shows patient details + actions (page nurse, update family, mark cleaned).

### 6.5 Shift Management (MCP + Google Calendar)

- **MCP tool definitions**: Calendar CRUD tools exposed to the LLM agent:
  - `calendar.create_shift(nurse_id, date, time_slot)`
  - `calendar.update_shift(shift_id, new_time_slot)`
  - `calendar.delete_shift(shift_id)`
  - `calendar.find_coverage(date, role)`
- **Call-out flow**: Nurse reports absence → agent finds eligible replacements → sends SMS/call offers → first confirmation auto-updates calendar.
- **Dashboard integration**: Shift calendar widget pulls from Google Calendar; edits via agent are reflected in real-time.

## 7. Data Model (Supabase)

```sql
-- Core tables
patients (id, room_id, name, acuity_level, admitted_at, family_phone)
rooms (id, number, status, last_rounded_at, last_sanitized_at, camera_feed_url)
nurses (id, name, role, phone, email, floor_assignment)
shifts (id, nurse_id, date, time_slot, status)  -- status: scheduled | confirmed | called_out | open
rounding_logs (id, room_id, nurse_id, entered_at, sanitized, duration_sec)
alerts (id, type, room_id, priority, message, created_at, resolved_at)
events (id, type, payload_json, created_at)  -- audit trail for all agent actions
family_contacts (id, patient_id, name, phone, preferred_channel)  -- sms | voice
```

- **RLS policies**: Nurses can only read/write their floor's data; head nurses get floor-wide access; admins get hospital-wide access.
- **Realtime channels**: `rooms` table changes broadcast on `room-updates` channel; `alerts` on `alerts` channel.

## 8. API Endpoints (Flask)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/voice/inbound` | Twilio voice webhook — initiates LLM conversation |
| POST | `/voice/outbound` | Trigger outbound call to family or staff |
| POST | `/sms/inbound` | Twilio SMS webhook — parse intent, route |
| POST | `/sms/outbound` | Send SMS blast or targeted message |
| POST | `/agent/chat` | General-purpose LLM chat with tool-calling |
| GET | `/rooms` | List rooms with current status |
| GET | `/rooms/{id}/history` | Rounding + sanitization log for a room |
| GET | `/shifts` | Current shift assignments |
| POST | `/shifts/call-out` | Initiate call-out coverage flow |
| POST | `/cv/event` | Ingest CV service events (rounding, sanitization, room status) |
| GET | `/dashboard/feed` | SSE stream of real-time events for frontend |

## 9. User Flows

### 9.1 Nurse Call-Out Flow

1. Nurse texts "call out" to Twilio number.
2. SMS agent collects: name, date, reason.
3. Agent queries Supabase for eligible replacement nurses.
4. Agent blast-calls (ElevenLabs) candidates: "Shift available [date], [time]. Reply YES to confirm."
5. First "YES" received → agent updates Google Calendar via MCP → confirms to calling-out nurse + head nurse via SMS.
6. Event logged in `events` table.

### 9.2 Family Update Call Flow

1. Head nurse clicks "Update family" on a room in the Digital Twin.
2. Frontend sends POST `/voice/outbound` with `patient_id` and `update_type`.
3. Flask queries Supabase for patient status, crafts update script.
4. ElevenLabs synthesizes speech → Twilio places call to `family_phone`.
5. If no answer, fall back to SMS with the same content.
6. Call result logged in `events` table.

### 9.3 Rounding Violation Alert Flow

1. CV service detects no entry to Room 204 for > 60 min.
2. CV service POSTs to `/cv/event` with type `rounding_violation`.
3. Flask creates high-priority `alert` row in Supabase.
4. Supabase Realtime pushes alert to dashboard.
5. Flask triggers Twilio SMS to floor lead: ⚠️ "Room 204 — no rounding check in 60 min."
6. Alert persists on dashboard until resolved (nurse clicks "Resolved").

## 10. Hackathon Scope & Priorities

| Priority | Feature | Notes |
|----------|---------|-------|
| P0 | Flask API + Supabase schema + seed data | Foundation everything else depends on |
| P0 | Dashboard (React + Vite) with room list + status | Basic UI before Three.js |
| P0 | SMS agent (Twilio → LLM → Supabase) | Fastest demo path for call-out flow |
| P1 | Voice agent (Twilio + ElevenLabs) | Family update call demo |
| P1 | Digital Twin (Three.js floor view) | Visual wow factor |
| P1 | CV Rounding Sentinel (MediaPipe) | Core differentiator; start with 1 camera |
| P2 | MCP + Google Calendar integration | Nice to have; can stub with direct DB writes |
| P2 | Santization gesture detection | Polish feature |
| P2 | Family SMS subscription | Post-MVP |

## 11. Environment & Configuration

| Variable | Purpose |
|----------|---------|
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_KEY` | Service-role anon key |
| `TWILIO_ACCOUNT_SID` | Twilio account |
| `TWILIO_AUTH_TOKEN` | Twilio auth |
| `TWILIO_PHONE_NUMBER` | Outbound number |
| `ELEVENLABS_API_KEY` | TTS/voice synthesis |
| `OPENAI_API_KEY` | LLM calls |
| `GOOGLE_CALENDAR_CREDENTIALS` | Service account JSON for calendar |
| `CAMERA_FEED_URL` | RTSP stream URL for CV service |

## 12. Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| CV latency on hardware | Delayed rounding alerts | Run MediaPipe on-device; skip frames > 5 FPS target |
| Twilio call quality | Robotic voice drops family trust | Use ElevenLabs low-latency streaming; fallback to SMS |
| LLM hallucination | Incorrect patient info shared | Restrict agent to read-only queries for family updates; require head-nurse approval for schedule changes |
| HIPAA / PHI | Handling real patient data | Use synthetic seed data for hackathon; design schema for future de-identification layer |

## 13. Success Metrics (Hackathon Demo)

1. **Call-out automation**: Text → agent finds replacement → calendar updated in < 3 min (end-to-end).
2. **Family update**: One-click outbound call delivering accurate, synthesized patient status.
3. **Rounding detection**: CV correctly logs a room entry within 5 seconds of occurrence.
4. **Dashboard**: Live room color changes reflecting real Supabase data via Realtime subscriptions.
5. **Digital Twin**: Interactive 3D floor plan with clickable rooms showing patient + rounding details.