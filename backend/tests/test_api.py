"""
Automated tests for the Fumble.ai API.
Run with:  cd backend && pytest tests/ -v
"""
import uuid
import pytest
from httpx import AsyncClient

pytestmark = pytest.mark.asyncio


# ---------------------------------------------------------------------------
# Test 1: Health endpoint
# ---------------------------------------------------------------------------

async def test_health(client: AsyncClient):
    """GET /health should always return 200 {"status": "ok"}."""
    r = await client.get("/health")
    assert r.status_code == 200
    assert r.json() == {"status": "ok"}


# ---------------------------------------------------------------------------
# Test 2: Agent creation — happy path and validation
# ---------------------------------------------------------------------------

async def test_create_agent_success(client: AsyncClient):
    """POST /agents with valid payload creates an agent and returns 201."""
    payload = {"name": "Luna", "traits": ["curious"], "interests": ["hiking"]}
    r = await client.post("/agents", json=payload)
    assert r.status_code == 201
    data = r.json()
    assert data["name"] == "Luna"
    assert "id" in data


async def test_create_agent_empty_name_returns_400(client: AsyncClient):
    """POST /agents with an empty name must return 400 (issue #13 validation)."""
    r = await client.post("/agents", json={"name": "   ", "traits": ["x"], "interests": ["y"]})
    assert r.status_code == 400


async def test_create_agent_missing_traits_returns_400(client: AsyncClient):
    """POST /agents with no traits must return 400."""
    r = await client.post("/agents", json={"name": "Luna", "traits": [], "interests": ["hiking"]})
    assert r.status_code == 400


# ---------------------------------------------------------------------------
# Test 3: Bug #14 — POST /dates/match with only one agent ID must return 400
# ---------------------------------------------------------------------------

async def test_match_only_agent1_id_returns_400(client: AsyncClient):
    """Providing agent_1_id without agent_2_id must return 400, not silently pick random."""
    r = await client.post("/dates/match", json={"agent_1_id": str(uuid.uuid4())})
    assert r.status_code == 400
    assert "agent_2_id" in r.json()["detail"]


async def test_match_only_agent2_id_returns_400(client: AsyncClient):
    """Providing agent_2_id without agent_1_id must return 400."""
    r = await client.post("/dates/match", json={"agent_2_id": str(uuid.uuid4())})
    assert r.status_code == 400
    assert "agent_1_id" in r.json()["detail"]


async def test_match_same_agent_id_returns_400(client: AsyncClient):
    """Matching an agent with itself must return 400."""
    aid = str(uuid.uuid4())
    r = await client.post("/dates/match", json={"agent_1_id": aid, "agent_2_id": aid})
    assert r.status_code == 400


# ---------------------------------------------------------------------------
# Test 4: Delete agent
# ---------------------------------------------------------------------------

async def test_delete_nonexistent_agent_returns_404(client: AsyncClient):
    """DELETE /agents/<unknown-id> must return 404."""
    r = await client.delete(f"/agents/{uuid.uuid4()}")
    assert r.status_code == 404


async def test_delete_agent_success(client: AsyncClient):
    """Create an agent then delete it — should return 204."""
    create = await client.post("/agents", json={"name": "Temp", "traits": ["calm"], "interests": ["reading"]})
    assert create.status_code == 201
    agent_id = create.json()["id"]

    delete = await client.delete(f"/agents/{agent_id}")
    assert delete.status_code == 204

    # Confirm it is gone
    agents = await client.get("/agents")
    ids = [a["id"] for a in agents.json()]
    assert agent_id not in ids


# ---------------------------------------------------------------------------
# Security test: no leaked secrets in response bodies
# ---------------------------------------------------------------------------

async def test_health_does_not_leak_env_vars(client: AsyncClient):
    """Health endpoint must not expose any environment variable values."""
    r = await client.get("/health")
    body = r.text
    assert "sk-ant" not in body
    assert "DATABASE_URL" not in body
    assert "ANTHROPIC" not in body
