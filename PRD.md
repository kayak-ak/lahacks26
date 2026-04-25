Project Outline: Healthcare Logistics & Nursing Orchestrator
This document outlines the architecture and feature set for an AI-driven operations hub designed to mitigate nurse understaffing and administrative fatigue through automated communication, scheduling, and real-time monitoring.
1. Core Objectives
Administrative Offloading: Automating routine inquiries and scheduling tasks.
Enhanced Patient Safety: Ensuring consistent rounding and hand hygiene compliance.
Operational Transparency: Providing a real-time "Digital Twin" of the ward for head nurses.
2. Technical Architecture
Component
Technology
Primary Function
 
Component,Technology,Primary Function
Voice Interface,ElevenLabs + Twilio,Automated call handling for family updates and staff call-outs.
Communication,Twilio API,SMS-based triage for patient requests and shift blast notifications.
Orchestration,Flask (Python),"Backend API managing logic, LLM tool-calling, and data flow."
Scheduling Tool,MCP + Google Calendar,Model Context Protocol (MCP) to allow agents to edit calendars directly.
Frontend Hub,React + Vite,Unified dashboard for real-time monitoring and shift approvals.
Agent,LLM Core,Agent will have access to all data


3. Standout Feature: The Rounding Sentinel
The Rounding Sentinel utilizes Computer Vision (CV) to automate the logging of "Hourly Rounding," a critical metric in nursing care that is often manually neglected during busy shifts.
Detection: Pose estimation tracks when medical staff enter a patient room.
Logic: If a room is not visited within a 60-minute window, a high-priority alert is sent via Twilio to the floor lead.
Compliance: Tracks "Sanitization Gestures" near dispensers to ensure hygiene protocols are met before patient contact.

Also: cv tracks open rooms and uploads to a database which rooms are open
Connected to the interactive visualization


4. Interactive Visualization: Three.js Digital Twin
The dashboard integrates a 3D or 2D spatial representation of the hospital floor to provide immediate situational awareness.
Real-time Status: Room models change color based on patient acuity or time since the last rounding check.
Spatial Telemetry: Visualizes the physical location of "Supply Runners" or equipment to reduce hunting time.






