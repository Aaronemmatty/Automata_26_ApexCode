from __future__ import annotations

import asyncio
from collections import defaultdict
from datetime import datetime, timedelta
from uuid import UUID

from fastapi import HTTPException
from google.oauth2.credentials import Credentials
from sqlalchemy.ext.asyncio import AsyncSession

from app.classroom.client import ClassroomClient
from app.classroom.oauth import get_valid_access_token

_user_calls: dict[str, list[datetime]] = defaultdict(list)


def _rate_limit(user_id: str, limit: int = 60, per_seconds: int = 60):
    now = datetime.utcnow()
    window_start = now - timedelta(seconds=per_seconds)
    _user_calls[user_id] = [t for t in _user_calls[user_id] if t >= window_start]
    if len(_user_calls[user_id]) >= limit:
        raise HTTPException(status_code=429, detail="Rate limit exceeded for Classroom API")
    _user_calls[user_id].append(now)


async def _get_classroom_client(db: AsyncSession, user_id: UUID) -> tuple[ClassroomClient, str]:
    _rate_limit(str(user_id))
    from sqlalchemy import select
    from app.classroom.security import decrypt_secret
    from app.config import settings
    from app.models.integrations import GoogleToken
    result = await db.execute(select(GoogleToken).where(GoogleToken.user_id == user_id))
    record = result.scalar_one_or_none()
    if not record:
        raise HTTPException(status_code=404, detail="Google account not connected. Please connect via Settings.")
    token = await get_valid_access_token(db, user_id)
    from app.classroom.oauth import _build_credentials, SCOPES
    access_token = decrypt_secret(record.access_token)
    refresh_token = decrypt_secret(record.refresh_token) if record.refresh_token else None
    creds = _build_credentials(access_token, refresh_token, record.expiry, record.scope or " ".join(SCOPES))
    # Use the refreshed token if refresh happened
    creds_with_fresh = Credentials(
        token=token,
        refresh_token=refresh_token,
        token_uri="https://oauth2.googleapis.com/token",
        client_id=settings.GOOGLE_CLIENT_ID,
        client_secret=settings.GOOGLE_CLIENT_SECRET,
        scopes=(record.scope.split() if record.scope else SCOPES),
    )
    return ClassroomClient(creds_with_fresh), token


async def get_courses(db: AsyncSession, user_id: UUID) -> list[dict]:
    classroom_client, _ = await _get_classroom_client(db, user_id)
    return await asyncio.to_thread(classroom_client.get_courses)


async def get_events(db: AsyncSession, user_id: UUID) -> list[dict]:
    classroom_client, _ = await _get_classroom_client(db, user_id)
    courses = await asyncio.to_thread(classroom_client.get_courses)

    events: list[dict] = []
    for course in courses:
        course_id = course.get("id")
        course_name = course.get("name", "Unknown course")
        if not course_id:
            continue

        try:
            coursework_with_status = await asyncio.to_thread(
                classroom_client.get_all_coursework_with_status,
                course_id,
            )
        except Exception as exc:
            import logging
            logging.getLogger(__name__).warning("Coursework fetch failed for %s: %s", course_name, exc)
            coursework_with_status = []

        for item in coursework_with_status:
            due_dt = item.get("due_date")
            due_date = due_dt.date().isoformat() if due_dt else None
            raw_status = item.get("status")
            if raw_status == "missing":
                submission_status = "missing"
            elif raw_status in {"submitted", "graded"}:
                submission_status = "submitted"
            else:
                submission_status = "assigned"

            events.append(
                {
                    "title": item.get("title"),
                    "course": course_name,
                    "type": "Assignment",
                    "due_date": due_date,
                    "posted_at": item.get("posted_at"),
                    "submission_status": submission_status,
                    "workflow_status": raw_status,
                    "is_graded": raw_status == "graded",
                    "assigned_grade": item.get("assigned_grade"),
                    "submission_state": item.get("submission_state"),
                    "link": item.get("submission_url"),
                }
            )

        try:
            announcements_items = await asyncio.to_thread(
                classroom_client.get_announcements, course_id
            )
        except Exception as exc:
            import logging
            logging.getLogger(__name__).warning("Announcements fetch failed for %s: %s", course_name, exc)
            announcements_items = []

        for ann in announcements_items:
            events.append(
                {
                    "title": (ann.get("text", "Announcement")[:120]),
                    "course": course_name,
                    "type": "Announcement",
                    "due_date": ann.get("creationTime"),
                    "posted_at": ann.get("creationTime"),
                    "link": ann.get("alternateLink"),
                }
            )

    events.sort(
        key=lambda e: (
            e.get("due_date") or e.get("posted_at") or "0000-01-01",
            e.get("title") or "",
        ),
        reverse=True,
    )
    return events
