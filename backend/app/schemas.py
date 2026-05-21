from pydantic import BaseModel, field_validator
from typing import List, Optional
import uuid
from datetime import datetime


class AgentCreate(BaseModel):
    name: str
    bio: Optional[str] = None
    traits: List[str]
    interests: List[str]
    avatar: Optional[str] = None

    @field_validator("name")
    @classmethod
    def name_required(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("name is required")
        return v.strip()

    @field_validator("bio")
    @classmethod
    def bio_max_500(cls, v: Optional[str]) -> Optional[str]:
        if v and len(v) > 500:
            raise ValueError("bio must be 500 characters or fewer")
        return v

    @field_validator("traits")
    @classmethod
    def traits_not_empty(cls, v: List[str]) -> List[str]:
        cleaned = [t.strip() for t in v if t.strip()]
        if not cleaned:
            raise ValueError("at least one trait is required")
        return cleaned

    @field_validator("interests")
    @classmethod
    def interests_not_empty(cls, v: List[str]) -> List[str]:
        cleaned = [i.strip() for i in v if i.strip()]
        if not cleaned:
            raise ValueError("at least one interest is required")
        return cleaned


class AgentResponse(BaseModel):
    id: uuid.UUID
    name: str
    bio: Optional[str]
    traits: Optional[List[str]]
    interests: Optional[List[str]]
    avatar: Optional[str] = None
    created_at: datetime

    model_config = {"from_attributes": True}


class MatchRequest(BaseModel):
    agent_1_id: Optional[uuid.UUID] = None
    agent_2_id: Optional[uuid.UUID] = None
    mode: str = "pg13"


class DateResponse(BaseModel):
    id: uuid.UUID
    agent_1_id: uuid.UUID
    agent_2_id: uuid.UUID
    agent_1_name: Optional[str] = None
    agent_2_name: Optional[str] = None
    status: str
    conversation: Optional[List[dict]] = None
    compatibility_score: Optional[float] = None
    outcome: Optional[str] = None
    mode: str = "pg13"
    created_at: datetime

    model_config = {"from_attributes": True}
