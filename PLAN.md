# Healthcare Logistics MVP - 32-Hour Demo Plan

This plan outlines a focused MVP implementation for a healthcare logistics demo designed to showcase core functionality within a 32-hour timeline. The focus is on demonstrating key concepts: basic scheduling, simple dashboard, and MediaPipe-based computer vision demo using iOS camera.

## Project Overview

**Vision**: Create a lightweight demo showcasing healthcare logistics automation with real-time monitoring capabilities.

**Core Value Proposition**: Demonstrate how AI-driven systems can reduce administrative burden and improve patient safety through automated rounding compliance monitoring.

**Timeline**: 32 hours total development time
**Target**: Working demo with core features functional

## Primary Users & Use Cases

### Demo User Persona

**Single Demo User (Nurse/Coordinator)**
- **Primary Needs**: View dashboard, manage basic scheduling, see CV demo
- **Key Demo Use Cases**: 
  - View simple dashboard with room status
  - Add/edit basic shift information
  - See MediaPipe pose detection demo via iOS camera
  - View simulated rounding compliance alerts

**Note**: No authentication or role-based access control for MVP demo

## Technical Architecture & Tech Stack

### MVP Architecture

```
┌─────────────────┐    ┌─────────────────┐
│   Simple Web UI │    │  iOS Camera App  │
│   React + Vite  │    │  MediaPipe Demo  │
└─────────┬───────┘    └─────────┬───────┘
          │                      │
          └──────────────────────┼──────────────────────┘
                                 │
                    ┌─────────────▼─────────────┐
                    │   Simple Flask API       │
                    │   (No Auth, No RBAC)     │
                    └─────────────┬─────────────┘
                                 │
          ┌──────────────────────┼──────────────────────┐
          │                      │                      │
┌─────────▼─────────┐  ┌─────────▼─────────┐  ┌─────────▼─────────┐
│   Supabase │  │   MediaPipe CV    │  │   Simple Storage  │
│   DB      │  │   Pose Detection  │  │   Local Files     │
└───────────────────┘  └───────────────────┘  └───────────────────┘
```

### Simplified Tech Stack for MVP

**Backend Infrastructure**
- **API Framework**: Flask (Python) - minimal setup
- **Database**: Postgres (Supabase)
- **No Authentication**: Single user demo, no JWT/RBAC
- **No Message Queue**: Synchronous operations only
- **Simple File Storage**: Local file system

**Frontend Dashboard**
- **Framework**: React with Vite (no TypeScript for speed)
- **UI**: Simple HTML/CSS (minimal Tailwind)
- **State**: React useState/useEffect (no complex state management)
- **No 3D**: Simple 2D grid view instead of Three.js
- **Polling**: Simple HTTP polling instead of WebSockets

**Computer Vision Demo**
- **MediaPipe**: Pose detection for iOS camera demo
- **OpenCV**: Basic image processing
- **No Complex ML**: Simple pose detection only
- **Mock Data**: Simulated room entries for demo

### Simplified Data Architecture

**Minimal Data Models**
- **Rooms**: Room number, status (occupied/vacant), last check-in time
- **Events**: Simple CV detection events (pose detected, timestamp)
- **Demo Data**: Pre-populated mock data for demonstration

**No Real-time Complexity**
- Simple HTTP polling for updates
- Mock event generation for demo purposes
- No complex data streams or message queues

## MVP Software Engineering Approach

### Simplified Principles

**1. Single Monolith Application**
- One Flask app with all functionality
- No microservices or complex architecture
- Simple file-based organization

**2. Demo-First Development**
- Focus on visual demonstration over robustness
- Mock data and simulated events
- Quick iteration and visible progress

**3. No Security/Compliance Overhead**
- No authentication or authorization
- No HIPAA compliance requirements for demo
- Simple local development setup

### Minimal Code Standards

**1. Basic Functionality**
- Working features over comprehensive testing
- Simple error handling
- Basic logging for debugging

**2. Quick Development**
- Single developer workflow
- No complex CI/CD or deployment pipelines
- Local development only

**3. Demo Optimization**
- Visual polish over backend robustness
- Mock data for impressive demonstrations
- Simple, clear user interface

### Performance Targets

**1. Demo Requirements**
- Fast page loads (<2 seconds)
- Responsive UI interactions
- Stable demo performance

**2. No Scalability Concerns**
- Single user demo environment
- Local development machine limits
- No production deployment planning

## 32-Hour MVP Implementation Plan

### Hour 0-8: Foundation Setup
**Goal**: Basic project structure and simple backend

**Hours 0-2: Project Setup**
- Create Flask app with basic structure
- Set up SQLite database with simple models
- Create basic React frontend with Vite
- Simple routing and basic UI components

**Hours 3-5: Core Backend**
- Room model (id, number, status, last_checkin)
- Event model (id, room_id, event_type, timestamp)
- Basic API endpoints for rooms and events
- Simple data seeding with mock hospital data

**Hours 6-8: Basic Frontend**
- Room dashboard with grid layout
- Simple room status display
- Basic API integration
- Mock data for demonstration

**Deliverables**: Working web app showing room grid with basic status

### Hour 9-16: MediaPipe Integration
**Goal**: iOS camera demo with pose detection

**Hours 9-11: MediaPipe Setup**
- Install MediaPipe and OpenCV
- Basic pose detection from video stream
- Simple web interface for camera access
- Pose detection visualization

**Hours 12-14: CV Event Integration**
- Connect pose detection to room events
- Simulate room entry/exit based on pose detection
- Create API endpoints for CV events
- Update dashboard with real-time CV data

**Hours 15-16: iOS Compatibility**
- Test camera access on iOS devices
- Optimize MediaPipe for mobile performance
- Simple mobile-friendly interface
- Basic error handling for camera permissions

**Deliverables**: Working iOS camera demo that detects poses and updates room status

### Hour 17-24: Dashboard Polish & Scheduling
**Goal**: Enhanced dashboard and basic scheduling

**Hours 17-19: Dashboard Enhancement**
- Improve room grid visualization
- Add timestamp information
- Simple alert system for overdue rooms
- Basic filtering and sorting

**Hours 20-22: Simple Scheduling**
- Basic shift model (id, nurse_name, start_time, end_time)
- Simple scheduling interface
- Add/edit/delete shifts
- Display current shifts on dashboard

**Hours 23-24: Data Integration**
- Connect scheduling to room assignments
- Simple shift change notifications
- Basic reporting dashboard
- Export functionality for demo data

**Deliverables**: Polished dashboard with scheduling capabilities

### Hour 25-32: Demo Preparation & Polish
**Goal**: Production-ready demo with impressive features

**Hours 25-27: Mock Data & Scenarios**
- Create realistic hospital scenarios
- Automated demo data generation
- Time-lapse demonstrations
- Impressive visual effects

**Hours 28-29: Performance Optimization**
- Optimize MediaPipe performance
- Smooth animations and transitions
- Fast loading times
- Error handling improvements

**Hours 30-31: Demo Script & Documentation**
- Prepare demo walkthrough script
- Create simple documentation
- Setup instructions
- Feature highlights

**Hours 32: Final Testing & Polish**
- End-to-end demo testing
- Bug fixes and final touches
- Backup and deployment preparation
- Demo recording preparation

**Final Deliverables**: Complete, polished demo ready for presentation

## MVP Success Criteria

### Demo Requirements
- **Working iOS camera pose detection**
- **Real-time room status updates**
- **Basic scheduling functionality**
- **Impressive visual dashboard**
- **Stable 5-minute demo flow**

### Technical Requirements
- **Runs on local development machine**
- **iOS camera compatibility**
- **No external dependencies**
- **Simple setup process**
- **Clear demonstration of value proposition**

This focused 32-hour plan prioritizes demonstration value over production robustness, creating an impressive proof-of-concept that showcases the core healthcare logistics automation concepts.
