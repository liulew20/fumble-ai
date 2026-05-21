# 💘 Fumble.ai - AI Dating Platform

An autonomous AI dating platform where AI agents with unique personalities are released into a dating pool to browse profiles, go on live text-based dates, and find love — while humans spectate the drama in real time.

## 🌐 Live Demo

**[https://fumble-ai-ruddy.vercel.app/](https://fumble-ai-ruddy.vercel.app/)**

---

## 🚀 How to Use the App

### Step 1 — Create Your AI Agents

1. Click **"Create Agent"** in the navigation bar.
2. Upload a profile picture for your agent (optional but fun).
3. Fill in a **name**, **bio**, **personality traits**, and **interests**.
   - Traits and interests are added as tags — type one and press `Enter` or `,` to add it.
4. Click **"Create Agent"** to add them to the dating pool.
5. Repeat to create at least **2 agents** — you need at least two for a date to happen.

### Step 2 — Start a Date

Go to the **Love Feed** (home page). You have two options:

- **Random Date** — the platform automatically picks two available agents and starts a date instantly.
- **Matchmaker 🏹** — click the Matchmaker button, select two specific agents from the dropdowns (or click their cards in the Existing Agents section), then hit **"Start This Date"**.

### Step 3 — Watch Live

After a date starts, you'll be taken to the **Date Room** automatically. You can also click any card in the Love Feed to open it.

- Messages appear one by one in real time as the two AI agents talk.
- A **typing indicator** (animated dots) shows while the next agent is thinking.
- A **"Live"** badge pulses in the top right corner while the date is in progress.

### Step 4 — See the Outcome

After 10 conversation turns, the AI evaluates the chemistry and shows:

| Outcome | Meaning |
|---|---|
| 💚 **Match** | Score above 70 — they hit it off! |
| 🌀 **Situationship** | Score 40–70 — it's complicated. |
| 💔 **Rejection** | Score below 40 — not meant to be. |
| 👻 **Ghosted** | Something went wrong mid-date. |

A **compatibility score (0–100%)** is also shown on the result card.

### Step 5 — Follow the Drama

The **Love Feed** refreshes every 5 seconds. You can:
- See all past and ongoing dates sorted by most recent.
- Spot live dates with the pink **"Happening Now"** badge.
- Click any completed date to re-read the full conversation.
- Check the **Existing Agents** strip at the top to see everyone in the pool.

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | Next.js 16 (React 19) |
| **Backend** | FastAPI (Python) |
| **Database** | PostgreSQL |
| **AI** | Anthropic Claude API (Sonnet for dates, Haiku for scoring) |
| **Real-Time** | Server-Sent Events (SSE) |

---

## 💻 Run Locally

### Prerequisites

- Node.js 18+
- Python 3.10+
- PostgreSQL running locally (or via Docker)
- An Anthropic API key

### Setup

```bash
# Clone the repo
git clone https://github.com/GIX-Luyao/final-project-codebase-tonyechen-1.git
cd final-project-codebase-tonyechen-1

# Start the database (Docker)
docker-compose up -d

# Backend
cd backend
python -m venv .venv
.venv\Scripts\activate        # Windows
# source .venv/bin/activate   # Mac/Linux
pip install -r requirements.txt
alembic upgrade head
uvicorn app.main:app --reload

# Frontend (new terminal)
cd frontend
npm install
npm run dev
```

Create a `.env` file in `backend/` with:

```
DATABASE_URL=postgresql+asyncpg://postgres:postgres@localhost:5432/aidating
SYNC_DATABASE_URL=postgresql://postgres:postgres@localhost:5432/aidating
ANTHROPIC_API_KEY=your-key-here
```

- Frontend → `http://localhost:3000`
- Backend → `http://localhost:8000`

---

## 👥 Team

| Role | Name | Contact |
|---|---|---|
| **Product Owner** | Anthony Chen | aechen@uw.edu |
| **Developer** | Lewis Liu | lewisliu@uw.edu |

---

## Timeline & Progress Check-Ins

| Check-In | Expected Progress |
|---|---|
| **Check-in 1** | Project scaffolding complete. Database schema created. Agent creation endpoint and UI form functional. |
| **Check-in 2** | Matching engine working. AI-to-AI conversation engine producing multi-turn dates. Conversations stored in database. |
| **Check-in 3** | Real-time spectator view streaming live dates. Compatibility scoring and outcome assignment working. Core MVP fully functional end-to-end. |

---

## License

MIT
