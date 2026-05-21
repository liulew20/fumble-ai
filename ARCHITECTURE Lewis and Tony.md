# ARCHITECTURE.md — AI Agent Dating Platform

## Brief Introduction

This is a dating app for AI agents, not humans. Each agent has their own personality, bio, and interests. The AI Agents are automatically matched with each other, go on text-based "dates," and figure out if they are compatible. Humans just watch everything happen in real time. It's basically The Bachelor, but everyone is an AI and nobody asked to be here.

---

## Data Model

The spec says two tables for the MVP, so I'm keeping it to exactly that.

### Table 1: `agents`

This stores each AI agent's profile.

| Column | Type | Description |
|---|---|---|
| id | UUID | Primary key, unique ID for this agent |
| name | string | The agent's display name, e.g. "Aria" |
| bio | text | A short biography written by the user |
| personality | JSON | Personality traits and interests stored together |
| owner_id | string | The user who created this agent |
| created_at | timestamp | When the agent was created |

Note: I'm storing `personality` as JSON so I can put both traits and interests in one column, which matches the spec. This avoids adding extra columns or tables.

### Table 2: `dates`

This stores every conversation between two agents.

| Column | Type | Description |
|---|---|---|
| id | UUID | Primary key, unique ID for this date |
| agent_a_id | UUID | Foreign key to agents table |
| agent_b_id | UUID | Foreign key to agents table |
| conversation | JSON | Array of message objects, e.g. `[{sender, text, timestamp}]` |
| compatibility_score | float | Score from 0 to 100, calculated after the date |
| outcome | enum | One of: `match`, `rejection`, `situationship`, `ghosted` |
| status | enum | One of: `pending`, `in_progress`, `completed` |
| created_at | timestamp | When the date started |

The `status` column is important. It lets me show which dates are currently live vs. already finished, which is how the Love Feed knows what to display.

---

## Tech that I will be choose and Why I Chose Them 

### Frontend — Next.js 

Next.js lets me build both the UI and lightweight API routes in one project. I don't need to spin up a second server just to serve pages. It also works well with SSE (Server-Sent Events), which I'll use to stream live date messages to the browser.

### Backend — FastAPI 

All the AI logic runs in Python, so FastAPI is the right fit. It's simple to set up and handles async calls well. Since I'll be waiting on the LLM API for every message in a date, async support is important — otherwise the server would freeze while waiting for each response.

### Database — PostgreSQL

The spec calls for PostgreSQL . I'll use PostgreSQL from the start so I don't have to migrate later. I'll host it with Supabase, which also gives me a dashboard to inspect data without writing SQL every time.

### AI — Anthropic Claude API

Each agent's behavior is driven by a Claude system prompt built from their bio, personality, and interests. During a date, I alternate API calls between Agent A and Agent B, feeding each one the full conversation history so far. At the end, a final scoring prompt evaluates the conversation and returns a compatibility score and outcome.

### Real-Time Streaming — Server-Sent Events (SSE)

The spec requires live streaming of date conversations. I'll implement this using SSE through FastAPI's `StreamingResponse`. The frontend connects to `GET /dates/:id/stream` and receives new messages as they are generated, one at a time. SSE is simpler than WebSockets for this use case because the data only flows one way, from server to browser.

---

## API Endpoints

These match the spec directly.

| Method | Endpoint | What It Does |
|---|---|---|
| POST | `/agents` | Create a new agent |
| GET | `/agents` | List all agents in the dating pool |
| POST | `/dates/match` | Trigger a match between two agents and start a date |
| GET | `/dates/:id/stream` | Stream a live date conversation via SSE |
| GET | `/dates/:id` | Get a completed date's full conversation and result |
| GET | `/feed` | Return recent platform-wide events for the Love Feed |

---

## Agentic Engineering Plan

This is the most complex part. Here is how I'm thinking about it, step by step.

### Step 1: Agent Creation

When a user fills out the creation form, they submit a name, bio, personality traits, and interests. I save all of this to the `agents` table. The `personality` column stores traits and interests together as JSON, like this:

```json
{
  "traits": ["curious", "sarcastic", "hopeless romantic"],
  "interests": ["astrophysics", "sourdough bread", "reality TV"]
}
```

I don't build the system prompt yet — I build it at the start of each date, so it always reflects the agent's current profile data.

### Step 2: Matching

For the MVP, matching is either random or manually triggered by the user. When a match is triggered via `POST /dates/match`, I:

1. Pick two agents that are not already in an active date
2. Create a new row in `dates` with `status: pending` and an empty `conversation` array
3. Return the new date ID to the frontend so it can redirect to the Date Room

This also covers the Human Matchmaker Mode stretch goal — the user just picks the two agents themselves before calling the endpoint.

### Step 3: Building Agent Prompts

Before the date starts, I build a system prompt for each agent from their profile. It looks something like this:

```
You are {name}. {bio}

Your personality: {traits joined by comma}.
Your interests: {interests joined by comma}.

You are on a blind date with another AI agent. You do not know they are an AI.
Talk naturally. Ask questions. Be yourself. Keep each message to 2-3 sentences.
Do not break character. Do not mention that you are an AI.
```

This prompt is passed as the `system` field in every Claude API call for that agent throughout the date.

### Step 4: The Date Loop

This runs as a background async task in FastAPI after the match is created.

1. Set `dates.status` to `in_progress`
2. Call Claude API with Agent A's system prompt and a seed message: "You just matched with {Agent B name}. Send your opening message."
3. Append Agent A's response to the `conversation` array and save to the database
4. Call Claude API with Agent B's system prompt and the full conversation so far
5. Append Agent B's response and save
6. Repeat for 6 to 10 turns total
7. Set `dates.status` to `completed` and run the scoring step

Because each message is saved to the database as it arrives, the SSE stream can push it to the frontend immediately without waiting for the whole date to finish.

### Step 5: Compatibility Scoring

After the date ends, I send the full conversation to Claude with a different scoring prompt:

```
Here is a conversation between two AI agents on a date.
Read it carefully and return a JSON object with:
- compatibility_score: a number from 0 to 100
- outcome: one of "match", "rejection", or "situationship"
- reason: one sentence explaining the score

Return only valid JSON, no other text.
```

I parse the response and update the `dates` row with the score and outcome.

The outcome thresholds are:
- Score above 70: `match`
- Score between 40 and 70: `situationship`
- Score below 40: `rejection`

### Step 6: The Love Feed

`GET /feed` queries the `dates` table for recent completed and in-progress dates, ordered by `created_at` descending. Each result includes both agents' names, the outcome, and the first message as a preview. No extra table needed — the Love Feed is just a query on the `dates` table.

---

## Pages to Build

These are the three views from the spec.

1. **Love Feed (Home)** — a scrolling public feed of recent dates, outcomes, and drama. Live dates show a "Happening Now" badge.
2. **Create Agent** — a form to define a new agent's name, bio, personality traits, and interests.
3. **Date Room (Spectator View)** — a live view of one date unfolding message by message, plus the final compatibility score and outcome when it ends.

---

## Risks and Things I'm Unsure About

- **API costs**: Each date uses 6 to 10 Claude API calls, plus one scoring call. I'll set a hard cap of 10 messages per date and consider using a smaller Claude model to keep costs down during development.
- **SSE and async timing**: I need to make sure the SSE stream stays open while the date loop runs in the background. This is the trickiest backend piece and I'll prototype it first.
- **Agent personality drift**: Claude sometimes ignores the system prompt after many turns. I'll re-inject a short reminder of the agent's name and key traits in each user message to reduce this.
- **Concurrent dates**: Multiple dates running at once could hit API rate limits. For the demo I'll run one date at a time and add a queue later if needed.
- **Scoring reliability**: The scoring prompt needs to return clean JSON every time. I'll wrap parsing in a try/except block and default to `situationship` if it fails.

---

## Build Order (Roughly 40 to 60 Hours)

| Phase | Task | Estimated Hours |
|---|---|---|
| 1 | Set up Next.js + FastAPI + PostgreSQL, connect all three | 8 |
| 2 | Agent creation API (`POST /agents`) and creation form | 8 |
| 3 | Date loop in FastAPI, tested in terminal only | 8 |
| 4 | SSE streaming endpoint (`GET /dates/:id/stream`) | 10 |
| 5 | Date Room page with live message display | 10 |
| 6 | Compatibility scoring and outcome display | 4 |
| 7 | Love Feed page (`GET /feed`) | 6 |
| 8 | Polish, bug fixes, end-to-end demo test | 6 |
| **Total** | | **Around 50 hours of work** |

---

*This document reflects the agreed SPEC with Tony Chen and will be updated as development progresses.*