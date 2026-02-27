import uuid
from datetime import datetime
from sqlalchemy import String, Boolean, DateTime, Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base


class User(Base):
    __tablename__ = "users"

    id:               Mapped[uuid.UUID]  = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email:            Mapped[str]        = mapped_column(String(255), unique=True, nullable=False, index=True)
    username:         Mapped[str]        = mapped_column(String(100), unique=True, nullable=False)
    full_name:        Mapped[str | None] = mapped_column(String(255))
    hashed_password:  Mapped[str]        = mapped_column(nullable=False)
    is_active:        Mapped[bool]       = mapped_column(Boolean, default=True)
    created_at:       Mapped[datetime]   = mapped_column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at:       Mapped[datetime]   = mapped_column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    assignments  = relationship("Assignment",       back_populates="user", cascade="all, delete-orphan")
    subjects     = relationship("Subject",          back_populates="user", cascade="all, delete-orphan")
    activities   = relationship("Activity",         back_populates="user", cascade="all, delete-orphan")
    documents    = relationship("Document",         back_populates="user", cascade="all, delete-orphan")
    alerts       = relationship("Alert",            back_populates="user", cascade="all, delete-orphan")
    timetable_entries = relationship("TimetableEntry", back_populates="user", cascade="all, delete-orphan")
    timetable_documents = relationship("TimetableDocument", back_populates="user", cascade="all, delete-orphan")
    google_token = relationship("GoogleToken", back_populates="user", cascade="all, delete-orphan", uselist=False)
