# NurseFlow AI

> AI-driven hospital operations hub that helps nurses spend more time with patients and less on paperwork.

Built for **LA Hacks 2026**.

---

## Overview

NurseFlow AI (codename **Siren**) reduces nurse administrative burden and improves patient safety through automated SMS communication, real-time room monitoring via computer vision, intelligent shift scheduling, and a conversational AI assistant — all in one dashboard.

**Primary audience:** Floor Nurses and Charge/Head Nurses working in hospital wards.  
**Secondary:** Patient families (receive outbound SMS/call updates).  
**Tertiary:** Hospital administrators (compliance metrics, staffing analytics).

---

## Features

### Interactive Hospital Floor Map
- SVG floor plan with 14 clickable, color-coded rooms (stable, critical, observation, vacant)
- Click a room to open detail modals or admit patients into vacant rooms
- Realtime database subscriptions for rooms, patients, vitals, and alerts

### AI Chat Assistant ("Siren")
- Resizable sidebar with streaming SSE responses from GPT-4o
- 20+ tool definitions for structured CRUD on patients, rooms, vitals, shifts, alerts, and events
- Context-aware: includes selected room info as context
- Confirmation required before destructive actions (admit, discharge, record vitals)

### SMS Triage Agent
- Inbound SMS webhook processes nurse texts via Twilio
- LLM classifies intent: call-out, patient request, shift blast, family update, general
- Handles shift call-outs by finding replacements and blast-sending SMS
- Outbound SMS via Twilio or Vonage

### Computer Vision Room Monitoring
- MediaPipe Pose detects person presence and body posture in real-time
- Classifies rooms as NORMAL, ALERT (abnormal position), or VACANT
- WebSocket streams JPEG frames + status JSON to the frontend
- Configurable auto-vacancy timer

### Voice Interface
- ElevenLabs Conversational AI integration for hands-free interaction
- Floating draggable mic bubble accessible from any page
- Dedicated voice page with visual frequency feedback

### Shift Handoff Board
- Day/night shift tabs with date picker
- Patient cards with acuity, vitals, rounding logs, alerts, and pending tasks
- Log clinical events with type classification
- AI-generated handoff reports

### Communication Logs
- View and search outbound emails/SMS to patient families
- Filterable detail dialogs

### Inventory Tracking
- Medical supply dashboard with status badges (adequate, low, critical)
- Filtering and search

### Easter Egg
- Press `Alt+P` for a fully functional Tetris game

---

## Tech Stack

### Frontend

| Layer | Technology |
|-------|-----------|
| Framework | React 19 + TypeScript |
| Build Tool | Vite |
| Styling | Tailwind CSS + shadcn/ui |
| State Management | Zustand |
| Routing | React Router DOM v7 |
| Database Client | Supabase JS SDK |
| Schema & Seed | Drizzle ORM |
| Voice | ElevenLabs React SDK |
| Markdown | react-markdown + remark-gfm |
| Image Uploads | Cloudinary |

### Backend

| Layer | Technology |
|-------|-----------|
| API Framework | Flask |
| Language | Python 3.11+ |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth with RLS (planned) |
| Agent Framework | uAgents |
| LLM | OpenAI GPT-4o (function/tool calling) |
| SMS / Voice | Twilio + Vonage |
| Computer Vision | MediaPipe + OpenCV |
| WebSocket | websockets (Python) |
| Package Manager | uv |

### Infrastructure

| Component | Detail |
|-----------|--------|
| Database Hosting | Supabase (AWS) |
| Frontend Dev | Vite dev server at `localhost:5173` |
| Backend API | Flask at `localhost:5001` |
| CV WebSocket | `ws://localhost:8765` |
| Agent Ports | SMS Agent `8001`, Chat Agent `8002` |

---

## Project Structure

```
lahacks26/
  frontend/
    src/
      pages/              # Dashboard, Handoff, Logs, Inventory, Voice, Tetris
      components/
        dashboard/        # Sidebar, AssistantSidebar, HospitalFloor, RoomDetailModal, etc.
        ui/               # shadcn/ui primitives
        tetris/           # Easter-egg game
      hooks/              # useRoomData, useVoiceAgent, useBackendCameraFeed, useTetris
      store/              # Zustand stores (assistant, chat)
      db/                 # Supabase client + Drizzle schema
      cloudinary/         # Upload widget + config
    scripts/             # seed.ts
  backend/
    app.py               # Flask app factory with blueprints
    camera_ws_server.py   # CV WebSocket server
    mediapipe_tracking.py # MediaPipe trackers
    poseDetection.py      # Pose detection helpers
    faceAndGesture.py     # Face and gesture recognition
    agent/
      chat_agent.py       # uAgents-based chat agent (GPT-4o + tools)
      sms_agent.py        # uAgents-based SMS triage agent
      prompts.py          # System prompts + tool definitions
      tools_registry.py   # Maps tool names to executors
      models.py           # Pydantic/uAgents models
      tools/
        supabase_tools.py # 20+ DB CRUD functions
        twilio_tools.py   # SMS sending wrappers
    integrations/
      openai_client.py   # Singleton OpenAI client
      twilio_client.py    # Singleton Twilio client
    routes/
      agent_routes.py     # /agent/stream (SSE), /agent/chat
      sms_routes.py       # /sms/inbound, /sms/outbound
      rooms.py            # /rooms, /rooms/{id}/history
      shifts.py           # /shifts, /shifts/call-out
      events.py           # /events, /events/stats
      handoff.py          # /handoff, /handoff/accept
```

---

## Database Schema

| Table | Purpose |
|-------|---------|
| `rooms` | 14 rooms (patient, exam, triage, emergency) with status and camera feeds |
| `patients` | Patient records with acuity levels, admission info, family contacts |
| `nurses` | Nurse profiles with roles and floor assignments |
| `nurse_statuses` | Real-time nurse availability tracking |
| `shifts` | Shift scheduling with status lifecycle |
| `vitals` | Patient vital signs (HR, BP, Temp, O2) |
| `rounding_logs` | Hourly rounding compliance tracking |
| `alerts` | Priority alerts with resolution tracking |
| `events` | Audit log of all agent actions |
| `family_contacts` | Family contact info with preferred channels |
| `emails` | Communication logs |

---

## Getting Started

### Prerequisites

- Node.js 18+
- Python 3.11+
- [uv](https://docs.astral.sh/uv/) (Python package manager)
- Supabase project with the schema applied
- API keys: OpenAI, Twilio (optional), Vonage (optional), ElevenLabs (optional)

### Frontend

```bash
cd frontend
npm install
npm run dev           # Starts Vite at localhost:5173
```

**Additional commands:**

```bash
npm run db:push       # Push Drizzle schema to Supabase
npm run db:seed       # Seed database with test data
npm run build         # Production build
```

### Backend

```bash
cd backend
uv sync               # Install dependencies
python app.py         # Starts Flask API on port 5001
```

**Optional services:**

```bash
python camera_ws_server.py   # CV WebSocket on port 8765
python agent/sms_agent.py    # SMS agent on port 8001
python agent/chat_agent.py   # Chat agent on port 8002
```

Vite proxies `/agent`, `/sms`, `/rooms`, `/shifts`, `/events`, `/handoff` to the Flask backend.

### Environment Variables

**Frontend** (`frontend/.env`):

```
VITE_CLOUDINARY_CLOUD_NAME=
VITE_SUPABASE_URL=
VITE_SUPABASE_PUBLISHABLE_KEY=
VITE_ELEVENLABS_AGENT_ID=
DATABASE_URL=
```

**Backend** (`backend/.env`):

```
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
OPENAI_API_KEY=
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=
SMS_AGENT_PORT=8001
CHAT_AGENT_PORT=8002
```

---

## Architecture Highlights

- **Dual agent system**: Separate uAgents for SMS triage and chat, with Flask orchestrating REST/SSE endpoints
- **SSE streaming**: `/agent/stream` streams GPT-4o tokens and tool calls via Server-Sent Events
- **Realtime everywhere**: Frontend subscribes to Supabase Realtime channels for live updates
- **Graceful fallback**: Both frontend and backend fall back to hardcoded mock data when Supabase is unavailable
- **On-device CV**: MediaPipe inference streamed via WebSocket — no cloud GPU needed
- **Tool-calling LLM**: GPT-4o with 20+ function definitions for structured, safe database operations

---

## License

This project was built for LA Hacks 2026.