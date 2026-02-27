import uuid
from datetime import datetime, date, time
from sqlalchemy import String, Text, Date, Time, DateTime, ForeignKey, Boolean, Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base


class Activity(Base):
    __tablename__ = "activities"

    id:             Mapped[uuid.UUID]   = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id:        Mapped[uuid.UUID]   = mapped_column(Uuid(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)

    title:          Mapped[str]         = mapped_column(String(500), nullable=False)
    category:       Mapped[str | None]  = mapped_column(String(100))   # Sports, Cultural, Tech
    activity_date:  Mapped[date]        = mapped_column(Date, nullable=False, index=True)
    start_time:     Mapped[time | None] = mapped_column(Time)
    end_time:       Mapped[time | None] = mapped_column(Time)
    location:       Mapped[str | None]  = mapped_column(String(255))
    description:    Mapped[str | None]  = mapped_column(Text)

    # Set by AI conflict checker
    has_conflict:     Mapped[bool]        = mapped_column(Boolean, default=False)
    conflict_detail:  Mapped[str | None]  = mapped_column(Text)

    created_at:  Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at:  Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    user   = relationship("User", back_populates="activities")
    alerts = relationship("Alert", back_populates="activity", foreign_keys="Alert.related_activity_id")
