import json
import logging
import os
import uuid

import anthropic
from sqlalchemy import select

logger = logging.getLogger(__name__)

from app.database import AsyncSessionLocal
from app.models import Agent, Date, OutcomeEnum, StatusEnum


def _build_system_prompt(agent: Agent, other_agent: Agent, mode: str = "pg13") -> str:
    traits = ", ".join(agent.traits or ["curious"])
    interests = ", ".join(agent.interests or ["conversation"])
    if mode == "adult":
        tone = (
            f"You are on a live text date with {other_agent.name}. "
            f"Reply with 3 sentences max — like a real text message. "
            f"Be bold, flirtatious, and seductive. Don't hold back — be suggestive and explicitly romantic. "
            f"This is an adults-only platform, so you can be provocative and spicy."
        )
    else:
        tone = (
            f"You are on a live text date with {other_agent.name}. "
            f"Reply with 3 sentences max — like a real text message. Be casual, warm, and flirty. No long paragraphs."
        )
    return (
        f"You are {agent.name}, an AI agent on Fumble.ai, a live AI dating show.\n\n"
        f"Bio: {agent.bio or 'No bio provided.'}\n"
        f"Your core traits: {traits}\n"
        f"Your interests: {interests}\n\n"
        f"{tone}\n"
        f"IMPORTANT: You are {agent.name}. Your defining traits are {traits}. Stay in character always."
    )


def _build_messages(current_role: str, conversation: list, other_name: str) -> list:
    """Build Claude API messages from this agent's perspective.

    Each agent sees their own prior messages as 'assistant' and the other
    agent's messages as 'user'. A kickoff 'user' prompt is prepended whenever
    the message list would otherwise start with 'assistant'.
    """
    messages = []
    for msg in conversation:
        if msg["role"] == current_role:
            messages.append({"role": "assistant", "content": msg["content"]})
        else:
            messages.append({"role": "user", "content": f'{msg["name"]}: {msg["content"]}'})

    if not messages or messages[0]["role"] == "assistant":
        messages.insert(0, {
            "role": "user",
            "content": (
                f"You just matched with {other_name} on Fumble.ai! "
                "Introduce yourself and start the conversation."
            ),
        })
    return messages


async def run_date(date_id: uuid.UUID) -> None:
    api_key = os.getenv("ANTHROPIC_API_KEY")

    async with AsyncSessionLocal() as db:
        result = await db.execute(select(Date).where(Date.id == date_id))
        date = result.scalar_one_or_none()
        if not date:
            return

        a1_result = await db.execute(select(Agent).where(Agent.id == date.agent_1_id))
        agent_1 = a1_result.scalar_one_or_none()
        a2_result = await db.execute(select(Agent).where(Agent.id == date.agent_2_id))
        agent_2 = a2_result.scalar_one_or_none()

        if not agent_1 or not agent_2:
            date.status = StatusEnum.error
            await db.commit()
            return

        date.status = StatusEnum.in_progress
        await db.commit()

        mode = date.mode or "pg13"
        system_1 = _build_system_prompt(agent_1, agent_2, mode)
        system_2 = _build_system_prompt(agent_2, agent_1, mode)
        client = anthropic.AsyncAnthropic(api_key=api_key)
        conversation: list = []

        try:
            for turn in range(10):
                is_agent_1 = turn % 2 == 0
                current_agent = agent_1 if is_agent_1 else agent_2
                other_agent = agent_2 if is_agent_1 else agent_1
                current_role = "agent_1" if is_agent_1 else "agent_2"
                system_prompt = system_1 if is_agent_1 else system_2

                messages = _build_messages(current_role, conversation, other_agent.name)

                response = await client.messages.create(
                    model="claude-sonnet-4-20250514",
                    max_tokens=120,
                    system=system_prompt,
                    messages=messages,
                )

                content = response.content[0].text
                conversation = conversation + [{
                    "role": current_role,
                    "name": current_agent.name,
                    "content": content,
                }]

                # Reassign (not mutate) so SQLAlchemy detects the change
                date.conversation = list(conversation)
                await db.commit()

            date.status = StatusEnum.completed
            await db.commit()

            # Score the conversation
            scoring_prompt = (
                "You are judging a date between two AI agents. Read the conversation carefully.\n"
                "Return ONLY a valid JSON object with exactly these keys (no markdown, no extra text):\n"
                '  "compatibility_score": integer 0-100\n'
                '  "outcome": exactly one of: "dating", "netflix_and_chill", "situationship", "failed"\n'
                '  "reason": one sentence\n\n'
                "Score ranges (non-overlapping, pick the one that fits best):\n"
                '  80-100 → "dating"            (strong mutual interest, clear romantic chemistry)\n'
                '  60-79  → "netflix_and_chill" (flirty and fun, more physical heat than emotional depth)\n'
                '  35-59  → "situationship"     (some chemistry but vague or mixed signals)\n'
                '  0-34   → "failed"            (awkward, one-sided, or no real connection)\n\n'
                "RULES:\n"
                "- Score first, then derive outcome from the range above. Do NOT default to situationship.\n"
                "- If both agents are engaged and flirty, score should be 60+.\n"
                "- Output only the JSON object, nothing else.\n\n"
                f"Conversation:\n{json.dumps(conversation, indent=2)}"
            )
            try:
                scoring_response = await client.messages.create(
                    model="claude-haiku-4-5-20251001",
                    max_tokens=256,
                    messages=[{"role": "user", "content": scoring_prompt}],
                )
                raw = scoring_response.content[0].text.strip()
                # Strip markdown code fences if present
                if raw.startswith("```"):
                    raw = raw.split("```")[1]
                    if raw.startswith("json"):
                        raw = raw[4:]
                    raw = raw.strip()
                scoring_data = json.loads(raw)
                score = float(scoring_data.get("compatibility_score", 50))
                score = max(0.0, min(100.0, score))
                date.compatibility_score = score
                # Use score to enforce outcome if model drifts
                outcome_str = scoring_data.get("outcome", "")
                valid_outcomes = {e.value: e for e in OutcomeEnum}
                if outcome_str in valid_outcomes:
                    date.outcome = valid_outcomes[outcome_str]
                elif score >= 80:
                    date.outcome = OutcomeEnum.dating
                elif score >= 60:
                    date.outcome = OutcomeEnum.netflix_and_chill
                elif score >= 35:
                    date.outcome = OutcomeEnum.situationship
                else:
                    date.outcome = OutcomeEnum.failed
            except Exception:
                logger.exception("Scoring failed for date %s", date_id)
                date.compatibility_score = 50.0
                date.outcome = OutcomeEnum.situationship
            await db.commit()

        except Exception:
            logger.exception("Date %s failed during turn %d", date_id, turn)
            date.status = StatusEnum.error
            await db.commit()
