# NurseFlow — AI Co-Pilot for Hospital Nursing Operations

## 🏥 Inspiration

Hospital nurses spend up to 35% of their shift on paperwork — answering family phone calls, managing shift call-outs, logging rounding visits, tracking down supplies — instead of being at the bedside. On understaffed floors, missed rounds and delayed alerts put patients at real risk. We saw an opportunity to build a single AI-powered system that offloads the administrative burden and gives charge nurses real-time visibility across every room, every patient, and every shift.

## 💡 What It Does

Siren is an AI-driven hospital operations hub with six core capabilities:

1. **Conversational AI Assistant** — A resizable chat sidebar powered by GPT-4o with 20+ tool definitions. Nurses canquery patient vitals, room status, nurse availability, and shift schedules in natural language. The assistant can also executeactions — admit a patient, record vitals, create alerts, send SMS — with confirmation required before any destructive action. Responses stream in real-time via Server-Sent Events.

2. **Interactive Hospital Floor Map** — An SVG floor plan with 14 color-coded rooms (stable = blue, critical = red, observation = amber, vacant = gray). Click any room to see live patient details, vital signs, camera feeds, and quick actions like admitting a patient or marking a room vacant. Supabase Realtime subscriptions keep the entire dashboard live — room status, vitals, and alert changes update instantly.

3. **SMS Triage Agent** — Nurses text a dedicated number via Twilio. An LLM classifies the intent (call-out, patient request, shift blast, family update, or general), extracts entities, and routes accordingly. A nurse can text "calling out tomorrow, family emergency" and the agent finds available replacements, blast-messages them, and auto-confirms the first response.

4. **Computer Vision Room Monitoring** — A Python WebSocket server streams live camera feeds through MediaPipe Pose estimation. It detects whether a room is occupied (NORMAL), has someone in an abnormal position like a fall or fetal position (ALERT), or is empty (VACANT). The frontend displays the annotated video feed and status in real time.

5. **Voice Interface** — A floating microphone bubble powered by the ElevenLabs Conversational AI SDK lets nurses interact hands-free from any page. A dedicated voice page shows connection status and audio frequency visualization.

6. **Shift Handoff Board** — A structured handoff view with day/night shift tabs, patient cards showing acuity, vitals, rounding logs, pending alerts, and logged events. Nurses can log clinical events with type classification and generate AI handoff summaries.

## 🛠️ How We Built It

### Frontend
- **React 19 + TypeScript** with Vite for fast development
- **Tailwind CSS + shadcn/ui** for a polished, consistent design system
- **Zustand** for state management (chat messages, selected room, sidebar width)
- **Supabase JS SDK** with Realtime subscriptions for live updates across rooms, patients, vitals, alerts, and events
- **react-markdown + remark-gfm** for rich AI response rendering
- **ElevenLabs React SDK** for voice conversation sessions

### Backend
- **Flask** API server with six Blueprint route groups (agent, SMS, rooms, shifts, events, handoff)
- **OpenAI GPT-4o** with function/tool calling — 20+ tools mapped to Supabase CRUD operations, Twilio SMS, and alert creation
- **uAgents** (Fetch.ai) for specialized SMS and chat agents, with Flask proxying requests and handling the SSE streaming endpoint directly for lower latency
- **Supabase** (PostgreSQL) for all persistent data — rooms, patients, nurses, shifts, vitals, rounds, alerts, events
- **Twilio** for inbound/outbound SMS and voice calls
- **MediaPipe + OpenCV** for on-device computer vision — no cloud GPU required
- **websockets** (Python) for streaming annotated camera frames and status JSON

### Key Technical Decisions
- **SSE streaming for chat**: The `/agent/stream` endpoint bypasses the uAgent intermediary and calls OpenAI directly with `stream=True`, yielding `token`, `tool_call`, `done`, and `error` events. This gives token-by-token streaming to the browser with full multi-turn tool call support — when GPT-4o decides to call a tool, we buffer the streamed deltas, execute the tool, and re-call OpenAI for the follow-up response, all while maintaining the SSE stream.
- **Realtime everywhere**: The frontend subscribes to 4+ Supabase Realtime tables. Any database change (new vital reading, room status update, alert created) is reflected within milliseconds on every connected dashboard.
- **Graceful fallback**: Every data-fetching hook and route falls back to mock data when Supabase is unavailable, so the demo always works.

## 🔧 Challenges We Ran Into

- **SSE through Vite proxy**: Development CORS and response buffering made streaming unreliable. We solved this by configuring the Vite proxy with `changeOrigin: true` and adding `X-Accel-Buffering: no` and `Cache-Control: no-cache` headers on the Flask response.
- **Streaming tool calls**: OpenAI's streaming API sends tool call arguments in chunks across multiple `delta` objects. We had to carefully accumulate these by index, reconstruct complete tool call objects, execute them, and then re-stream the follow-up response — all within a single SSE connection.
- **MediaPipe posture classification**: Distinguishing between a person sitting normally vs. lying down or curled up required custom heuristics on landmark positions that worked across different camera angles and body types.
- **Realtime race conditions**: Multiple Supabase Realtime subscriptions triggering re-renders simultaneously caused stale closure bugs in Zustand. We solved this by ensuring all state reads go through `get()` rather than captured closures.

## 🏆 Accomplishments We're Proud Of

- A fully functional streaming AI assistant that can look up patients, record vitals, admit and discharge patients, create alerts, send SMS, and manage nurse availability — all through natural language
- Real-time hospital dashboard where every data change is reflected instantly via Supabase Realtime
- Working computer vision pipeline that classifies room occupancy and detects abnormal postures in real time
- Sprint-to-production pipeline where the SMS agent can receive a call-out text, find replacement nurses, blast-message them, and auto-confirm — end-to-end in under 3 minutes
- Unified design language across 6 pages (Dashboard, Inventory, Logs, Handoff, Voice, and a secret Tetris game)

## 📚 What We Learned

- **Streaming is harder than it looks**: Building a robust SSE pipeline that handles multi-turn tool calls with proper error recovery, backpressure, and client-side reconnection taught us a lot about the nuances of real-time web protocols.
- **Supabase Realtime is powerful but quirky**: The Postgres changes channel is incredibly useful, but subscription management and reconnect logic require careful handling to avoid memory leaks and stale listeners.
- **Computer vision on a hackathon timeline**: MediaPipe is free and runs on-device, but tuning detection thresholds and handling edge cases (occlusion, multiple people, unusual camera positions) takes longer than expected.
- **Agent design patterns**: GPT-4o's function calling is remarkably good at choosing the right tool, but requires careful prompt engineering to ensure it asks for confirmation before destructive actions (admit, discharge, record vitals).

## 🚀 What's Next

- **HIPAA compliance layer**: Add row-level security policies, audit logging, and data de-identification for production hospital use
- **Role-based access control**: Nurse vs. head nurse vs. admin permissions in the dashboard
- **Google Calendar integration**: MCP-based shift management with real calendar sync
- **Sanitization gesture detection**: Track hand-hygiene compliance at dispenser zones using MediaPipe Holistic
- **Multi-language voice**: ElevenLabs multilingual voices for family updates in Spanish, Mandarin, and more
- **Mobile-responsive UI**: Adapt the dashboard for tablet and phone form factors for bedside use

## 🏗️ Built With

| Category | Technologies |
|----------|-------------|
| Frontend | React, TypeScript, Vite, Tailwind CSS, shadcn/ui, Zustand, Supabase JS SDK, ElevenLabs React SDK, react-markdown |
| Backend | Python, Flask, OpenAI GPT-4o, uAgents (Fetch.ai), MediaPipe, OpenCV, websockets |
| Database | Supabase (PostgreSQL, Realtime subscriptions, Row Level Security) |
| Integrations | Twilio (SMS/Voice), Vonage (SMS), ElevenLabs (Voice AI), Cloudinary (Image uploads) |
| Computer Vision | MediaPipe Pose, OpenCV, on-device inference |
| Dev Tools | uv, Drizzle ORM, ngrok |
