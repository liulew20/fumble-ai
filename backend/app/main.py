import asyncio
import json
import uuid
from typing import List

from fastapi import FastAPI, Depends, HTTPException, Body
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse, StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_, func, delete as sql_delete

# Keeps task references alive until they complete so the GC doesn't cancel them
_running_tasks: set[asyncio.Task] = set()

from app.database import get_db, AsyncSessionLocal
from app.models import Agent, Date, StatusEnum
from app.schemas import AgentCreate, AgentResponse, MatchRequest, DateResponse
from app.date_runner import run_date

app = FastAPI(title="AI Dating Platform")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "https://fumble-ai-ruddy.vercel.app",
        "https://clever-narwhal-c3d671.netlify.app",
    ],
    allow_origin_regex=r"https://.*\.(vercel\.app|netlify\.app)",
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request, exc):
    errors = exc.errors()
    messages = [
        f"{'.'.join(str(loc) for loc in e['loc'][1:])}: {e['msg']}"
        for e in errors
    ]
    return JSONResponse(status_code=400, content={"detail": "; ".join(messages)})


async def _load_date_with_agents(date: Date, db: AsyncSession) -> DateResponse:
    a1 = (await db.execute(select(Agent).where(Agent.id == date.agent_1_id))).scalar_one_or_none()
    a2 = (await db.execute(select(Agent).where(Agent.id == date.agent_2_id))).scalar_one_or_none()
    return DateResponse.model_validate({
        "id": date.id,
        "agent_1_id": date.agent_1_id,
        "agent_2_id": date.agent_2_id,
        "agent_1_name": a1.name if a1 else None,
        "agent_2_name": a2.name if a2 else None,
        "status": date.status,
        "conversation": date.conversation,
        "compatibility_score": date.compatibility_score,
        "outcome": date.outcome.value if date.outcome else None,
        "mode": date.mode or "pg13",
        "created_at": date.created_at,
    })


@app.get("/health")
async def health_check():
    return {"status": "ok", "build": "v3"}


@app.get("/version")
async def version():
    return {"version": "v3-with-date-delete"}


# --- Agent routes ---

@app.post("/agents", response_model=AgentResponse, status_code=201)
async def create_agent(payload: AgentCreate, db: AsyncSession = Depends(get_db)):
    agent = Agent(
        name=payload.name,
        bio=payload.bio,
        traits=payload.traits,
        interests=payload.interests,
        avatar=payload.avatar,
    )
    db.add(agent)
    await db.commit()
    await db.refresh(agent)
    return agent


@app.get("/agents", response_model=List[AgentResponse])
async def list_agents(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Agent).order_by(Agent.created_at.desc()))
    return result.scalars().all()


@app.delete("/agents/{agent_id}", status_code=204)
async def delete_agent(agent_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Agent).where(Agent.id == agent_id))
    agent = result.scalar_one_or_none()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    active_statuses = [StatusEnum.pending, StatusEnum.in_progress]
    existing = await db.execute(
        select(Date).where(
            or_(Date.agent_1_id == agent_id, Date.agent_2_id == agent_id),
            Date.status.in_(active_statuses),
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Cannot delete an agent that is in an active date")
    try:
        await db.execute(
            sql_delete(Date).where(or_(Date.agent_1_id == agent_id, Date.agent_2_id == agent_id))
        )
        await db.execute(sql_delete(Agent).where(Agent.id == agent_id))
        await db.commit()
    except Exception as exc:
        await db.rollback()
        raise HTTPException(status_code=500, detail=str(exc))


# --- Date routes ---

@app.post("/dates/match", response_model=DateResponse, status_code=201)
async def match_agents(
    db: AsyncSession = Depends(get_db),
    payload: MatchRequest = Body(default=MatchRequest()),
):
    # Resolve agent IDs: explicit or random
    if payload.agent_1_id and not payload.agent_2_id:
        raise HTTPException(status_code=400, detail="agent_2_id is required when agent_1_id is provided")
    if payload.agent_2_id and not payload.agent_1_id:
        raise HTTPException(status_code=400, detail="agent_1_id is required when agent_2_id is provided")

    if payload.agent_1_id and payload.agent_2_id:
        agent_1_id = payload.agent_1_id
        agent_2_id = payload.agent_2_id

        if agent_1_id == agent_2_id:
            raise HTTPException(status_code=400, detail="agent_1_id and agent_2_id must be different")

        for aid, label in [(agent_1_id, "Agent 1"), (agent_2_id, "Agent 2")]:
            exists = await db.execute(select(Agent).where(Agent.id == aid))
            if not exists.scalar_one_or_none():
                raise HTTPException(status_code=404, detail=f"{label} not found")
    else:
        result = await db.execute(select(Agent).order_by(func.random()).limit(2))
        agents = result.scalars().all()
        if len(agents) < 2:
            raise HTTPException(status_code=400, detail="Need at least 2 agents in the database to start a date")
        agent_1_id = agents[0].id
        agent_2_id = agents[1].id

    # Check neither agent is already in an active date
    active_statuses = [StatusEnum.pending, StatusEnum.in_progress]
    for aid, label in [(agent_1_id, "Agent 1"), (agent_2_id, "Agent 2")]:
        existing = await db.execute(
            select(Date).where(
                or_(Date.agent_1_id == aid, Date.agent_2_id == aid),
                Date.status.in_(active_statuses),
            )
        )
        if existing.scalar_one_or_none():
            raise HTTPException(status_code=400, detail=f"{label} is already in an active date")

    mode = payload.mode if payload.mode in ("pg13", "adult") else "pg13"
    new_date = Date(agent_1_id=agent_1_id, agent_2_id=agent_2_id, conversation=[], mode=mode)
    db.add(new_date)
    await db.commit()
    await db.refresh(new_date)

    task = asyncio.create_task(run_date(new_date.id))
    _running_tasks.add(task)
    task.add_done_callback(_running_tasks.discard)

    return await _load_date_with_agents(new_date, db)


@app.get("/dates/{date_id}", response_model=DateResponse)
async def get_date(date_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Date).where(Date.id == date_id))
    date = result.scalar_one_or_none()
    if not date:
        raise HTTPException(status_code=404, detail="Date not found")
    return await _load_date_with_agents(date, db)


@app.delete("/dates/{date_id}", status_code=204)
async def delete_date(date_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Date).where(Date.id == date_id))
    date = result.scalar_one_or_none()
    if not date:
        raise HTTPException(status_code=404, detail="Date not found")
    if date.status in (StatusEnum.pending, StatusEnum.in_progress):
        raise HTTPException(status_code=400, detail="Cannot delete an active date")
    await db.execute(sql_delete(Date).where(Date.id == date_id))
    await db.commit()


@app.get("/dates/{date_id}/stream")
async def stream_date(date_id: uuid.UUID):
    async def event_generator():
        sent_count = 0
        while True:
            async with AsyncSessionLocal() as db:
                result = await db.execute(select(Date).where(Date.id == date_id))
                date = result.scalar_one_or_none()

            if not date:
                yield f"event: error\ndata: {json.dumps({'error': 'Date not found'})}\n\n"
                return

            conversation = date.conversation or []
            for msg in conversation[sent_count:]:
                yield f"data: {json.dumps(msg)}\n\n"
            sent_count = len(conversation)

            if date.status in (StatusEnum.completed, StatusEnum.error):
                done_data: dict = {"status": date.status.value}
                if date.status == StatusEnum.completed:
                    done_data["compatibility_score"] = date.compatibility_score
                    done_data["outcome"] = date.outcome.value if date.outcome else None
                yield f"event: done\ndata: {json.dumps(done_data)}\n\n"
                return

            await asyncio.sleep(1)

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


# --- Feed route ---

@app.get("/feed")
async def get_feed(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Date).order_by(Date.created_at.desc()).limit(20))
    dates = result.scalars().all()

    feed = []
    for date in dates:
        a1 = (await db.execute(select(Agent).where(Agent.id == date.agent_1_id))).scalar_one_or_none()
        a2 = (await db.execute(select(Agent).where(Agent.id == date.agent_2_id))).scalar_one_or_none()
        first_content = (date.conversation or [{}])[0].get("content", "") if date.conversation else ""
        feed.append({
            "id": str(date.id),
            "agent_1_name": a1.name if a1 else "Unknown",
            "agent_2_name": a2.name if a2 else "Unknown",
            "status": date.status.value,
            "outcome": date.outcome.value if date.outcome else None,
            "compatibility_score": date.compatibility_score,
            "preview": first_content[:150] if first_content else None,
            "created_at": date.created_at.isoformat(),
        })
    return feed
