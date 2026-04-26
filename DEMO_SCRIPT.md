# NurseFlow AI — LA Hacks 2026 Demo Script

> **Time budget**: ~3 minutes  
> **Tone**: Technical & chill — you're a dev talking to devs  
> **Stage directions**: [in brackets]

---

## 0. Title / Hook (5 sec)

**[Dashboard on screen]**

> Hey everyone — we're NurseFlow AI, or Siren.
> Nurses spend a third of their shift on admin — call-outs, family updates, rounding logs — instead of patients. We built one hub that automates all of it.

---

## 1. Dashboard — Hospital Floor Map (20 sec)

**[Dashboard loaded with color-coded rooms]**

> Here's the live dashboard. Fourteen rooms, color-coded by status — occupied, critical, vacant, needs cleaning. All powered by Supabase Realtime — room status, patient vitals, alerts, all push live without polling.

**[Click Room 101 — detail modal opens]**

> Click any room to see the patient, their vitals, acuity level, and active alerts. Real data, live updates.

---

## 2. AI Assistant — Siren Chat (30 sec)

**[Open sidebar assistant]**

> This is Siren, our AI assistant. GPT-4o with 20+ tool definitions — it doesn't just chat, it actually does things in the database.

**[Type: "What's the status of Room 105?"]**

> Ask a question — Siren calls the right tools, queries Supabase, streams the answer back via SSE.

**[Type: "Record vitals for Maria Garcia — heart rate 88, blood pressure 120/80, temp 98.6, oxygen 97"]**

> It asks for confirmation before any write operation — admit, discharge, record vitals — nothing destructive happens silently. **[Click confirm]** Done — vitals written, reflected in real-time.

---

## 3. SMS Triage Agent (25 sec)

**[Show phone/Twilio number or SMS flow diagram]**

> A nurse texts our Twilio number saying they need to call out. The agent classifies intent — this is a call-out — queries for available replacement nurses, and blast-sends texts to fill the shift. Under thirty seconds, zero human coordination needed.

---

## 4. Computer Vision — Room Monitoring (20 sec)

**[Show camera feed / WebSocket stream or prerecorded clip]**

> MediaPipe Pose on a live camera feed. Detects body presence and posture — is someone in the room? Are they curled up abnormally? The WebSocket streams status as NORMAL, ALERT, or VACANT to the frontend. All on-device — no cloud GPU round-trip, no latency.

---

## 5. Voice Interface — ElevenLabs (15 sec)

**[Click floating mic bubble]**

> We also wired up an ElevenLabs voice agent. Talk hands-free — nurses in a ward don't always have a free hand to type. Voice-first interaction is essential for clinical workflow.

**[Say: "Show me alerts for Room 107". The voice responds.]**

> Same tool-calling pipeline as the text chat, but voice-first.

---

## 6. Shift Handoff Board (20 sec)

**[Navigate to /handoff]**

> The handoff board organizes shift transitions. Day and night tabs, patient cards with acuity, vitals, rounding logs, and pending tasks — all pulled from Supabase.

**[Click "Generate Report" on a patient card]**

> And here's the kicker — we generate AI-filled PDF handoff reports. The system pulls patient data, events, vitals, sends it to GPT-4o to write a clinical summary, and fills an actual PDF form. No more manual handoff scribbles.

---

## 7. Tech Stack (15 sec)

**[Optional: flash a slide, or just narrate]**

> Under the hood — React 19, TypeScript, Vite, Tailwind, shadcn/ui, Zustand on the frontend. Flask and Python for the API layer. Supabase for Postgres plus Realtime subscriptions. OpenAI GPT-4o with function calling. Twilio and Vonage for SMS. ElevenLabs for voice. MediaPipe and OpenCV for computer vision. uAgents framework for the SMS and chat micro-agents. All connected, all live.

---

## 8. Closing (10 sec)

**[Back to dashboard, everything running]**

> That's Siren. One hub for nurses — real-time visibility, AI actions, SMS triage, voice, CV monitoring, and automated handoffs. Less paperwork, more patient care.

> Thank you — we're NurseFlow AI.

---

## Pre-Demo Checklist

Before going live, make sure:

- [ ] `npm run db:seed` has been run — database has demo data
- [ ] Flask backend is running on `:5001`
- [ ] Frontend Vite dev server is running on `:5173`
- [ ] Camera WebSocket server running (optional — skip if no webcam)
- [ ] `.env` files populated for both `frontend/` and `backend/`
- [ ] Supabase project is live and accessible
- [ ] OpenAI API key is set in `backend/.env`
- [ ] Browser tab open to `http://localhost:5173`
- [ ] Chat sidebar pre-loaded with one message so it's not blank
- [ ] Handoff page has patient cards visible
- [ ] SMS test message pre-sent so you have a conversation to show (or screenshot ready)

---

## Backup Plan

If something breaks live:

| Failure | Fallback |
|---------|----------|
| Supabase down | Frontend auto-falls back to hardcoded mock data |
| AI chat failing | Show a pre-recorded conversation screenshot |
| SMS not delivering | Show terminal logs of the agent processing a message |
| CV stream not connecting | Show a prerecorded clip of pose detection |
| Voice agent not connecting | Fall back to text-only demo of the chat sidebar |

---

## Timing Breakdown

| Section | Target Time |
|---------|------------|
| 0. Title / Hook | 5 sec |
| 1. Dashboard | 20 sec |
| 2. AI Assistant | 30 sec |
| 3. SMS Triage | 25 sec |
| 4. Computer Vision | 20 sec |
| 5. Voice Interface | 15 sec |
| 6. Shift Handoff | 20 sec |
| 7. Tech Stack | 15 sec |
| 8. Closing | 10 sec |
| **Buffer** | **20 sec** |
| **Total** | **~3 min** |
