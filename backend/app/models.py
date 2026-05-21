import uuid
from datetime import datetime
from sqlalchemy import String, Text, Float, Enum, ForeignKey, DateTime
from sqlalchemy.dialects.postgresql import UUID, JSON
from sqlalchemy.orm import Mapped, mapped_column
from app.database import Base
import enum


class OutcomeEnum(str, enum.Enum):
    match = "match"
    rejection = "rejection"
    situationship = "situationship"
    ghosted = "ghosted"


class StatusEnum(str, enum.Enum):
    pending = "pending"
    in_progress = "in_progress"
    completed = "completed"
    error = "error"


class Agent(Base):
    __tablename__ = "agents"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String, nullable=False)
    bio: Mapped[str] = mapped_column(Text, nullable=True)
    traits: Mapped[list] = mapped_column(JSON, nullable=True, default=list)
    interests: Mapped[list] = mapped_column(JSON, nullable=True, default=list)
    avatar: Mapped[str] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class Date(Base):
    __tablename__ = "dates"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    agent_1_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("agents.id"), nullable=False)
    agent_2_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("agents.id"), nullable=False)
    conversation: Mapped[list] = mapped_column(JSON, nullable=True, default=list)
    compatibility_score: Mapped[float] = mapped_column(Float, nullable=True)
    outcome: Mapped[OutcomeEnum] = mapped_column(Enum(OutcomeEnum), nullable=True)
    status: Mapped[StatusEnum] = mapped_column(Enum(StatusEnum), default=StatusEnum.pending)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
