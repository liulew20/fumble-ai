# SPEC.md — AI Dating Platform

## Project Overview

An autonomous AI dating platform where AI agents with distinct personalities, bios, and interests are released into a dating pool. Agents autonomously browse profiles, go on text-based dates, and determine compatibility — while humans spectate the drama in real time.

## Team

- **Product Owner:** Tony Chen
- **Developer:** Lewis Liu
- **Agreed Development Fee:** 40 GIX Bucks

---

## User Stories

1. **As a user**, I want to create an AI agent with a custom name, bio, personality traits, and interests so it can enter the dating pool with a unique identity.
2. **As a user**, I want my agent to be autonomously matched with another agent without my intervention so the dating process feels organic.
3. **As a user**, I want to spectate a live AI-to-AI chat date in real time so I can watch the conversation unfold message by message.
4. **As a user**, I want to see a compatibility score and outcome (match, rejection, situationship) after a date so I know how it went.
5. **As a user**, I want to view my agent's date history and past conversations so I can track its romantic journey.
6. **As a user**, I want to browse a public "Love Feed" showing platform-wide romantic events (matches, breakups, rejections) so I can follow the drama.
7. **As a user**, I want to manually pair two agents in "Human Matchmaker Mode" and watch the resulting date so I can play cupid.

---

## Desired Specifications

### Core Features (Must-Have)

| Feature | Description |
|---|---|
| **Agent Creation** | Users define an agent's name, bio, personality traits, and interests. Each agent is backed by a distinct LLM persona prompt. |
| **Autonomous Matching** | A matching engine pairs agents based on profile traits or randomness. No human intervention required. |
| **Live AI-to-AI Chat Date** | Two matched agents engage in a multi-turn autonomous text conversation powered by LLM API calls. |
| **Real-Time Spectator View** | Conversations are streamed (WebSocket/SSE) to a spectator UI so users watch dates live. |
| **Compatibility Scoring & Outcomes** | After each date, a scoring prompt evaluates the conversation and assigns an outcome: match, rejection, or situationship. |
| **Conversation Logging** | All date conversations are persisted and viewable after completion. |

### Stretch Features

| Feature | Description |
|---|---|
| Ghost / Unmatch / Situationship | Agents can autonomously ghost, unmatch, or linger in situationship states. |
| Love Feed | A public timeline of platform-wide romantic events. |
| Web-Access Research | Agents use web access to research shared interests and reference them on dates. |
| Human Matchmaker Mode | Users manually pair two agents and observe. |
| Seasonal Events | Themed events (AI Valentine's Day, AI Breakup Season) that alter agent behavior. |

---

## Desired Technical Architecture

> *Open to negotiation — the developer may propose alternatives.*

### Stack

- **Frontend:** Next.js (React)
- **Backend:** FastAPI (Python)
- **Database:** PostgreSQL (or SQLite for MVP)
- **AI:** OpenAI API or Anthropic API for agent personas and conversation generation
- **Real-Time:** WebSockets or Server-Sent Events for live date streaming

### Data Model (MVP)

**agents**

| Column | Type | Description |
|---|---|---|
| id | UUID | Primary key |
| name | String | Agent display name |
| bio | Text | Agent biography |
| personality | JSON | Personality traits and interests |
| owner_id | String | User who created the agent |
| created_at | Timestamp | Creation time |

**dates**

| Column | Type | Description |
|---|---|---|
| id | UUID | Primary key |
| agent_a_id | UUID | FK → agents |
| agent_b_id | UUID | FK → agents |
| conversation | JSON | Array of message objects |
| compatibility_score | Float | 0–100 score |
| outcome | Enum | match / rejection / situationship / ghosted |
| status | Enum | pending / in_progress / completed |
| created_at | Timestamp | Date start time |

### Key API Endpoints

- `POST /agents` — Create a new agent
- `GET /agents` — List all agents in the dating pool
- `POST /dates/match` — Trigger a match and start a date
- `GET /dates/:id/stream` — Stream a live date (WebSocket/SSE)
- `GET /dates/:id` — Retrieve a completed date's conversation and result
- `GET /feed` — Public Love Feed

---

## Scope Constraints

- One developer, approximately 40–60 hours using AI coding tools
- Core demo: 2–3 pages/views (Agent Creation, Live Date Spectator, Date History/Feed)
- MVP data model: 2 tables (agents, dates)
- **Must-have deliverable:** Two AI agents with distinct personalities are autonomously matched, go on a live AI-to-AI chat date, and the conversation is displayed for humans to spectate in real time.
