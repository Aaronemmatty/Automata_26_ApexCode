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


async def _google_get(token: str, path: str, params: dict | None = None) -> dict:
    def _run() -> dict:
        service = ClassroomClient(Credentials(token=token)).service
        parts = path.split("/")

        if len(parts) == 1 and parts[0] == "courses":
            request = service.courses().list(**(params or {}))
            return request.execute()

        if len(parts) == 3 and parts[0] == "courses" and parts[2] == "announcements":
            course_id = parts[1]
            request = service.courses().announcements().list(courseId=course_id, **(params or {}))
            return request.execute()

        raise HTTPException(status_code=500, detail=f"Unsupported Classroom path: {path}")

    try:
        return await asyncio.to_thread(_run)
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"Classroom API error: {exc}")


async def _google_get_all_items(token: str, path: str, list_key: str, params: dict | None = None) -> list[dict]:
    items: list[dict] = []
    next_page_token: str | None = None
    base_params = dict(params or {})

    while True:
        query_params = dict(base_params)
        if next_page_token:
            query_params["pageToken"] = next_page_token

        payload = await _google_get(token, path, query_params)
        items.extend(payload.get(list_key, []))
        next_page_token = payload.get("nextPageToken")
        if not next_page_token:
            break

    return items


async def _get_classroom_client(db: AsyncSession, user_id: UUID) -> tuple[ClassroomClient, str]:
    _rate_limit(str(user_id))
    token = await get_valid_access_token(db, user_id)
    creds = Credentials(token=token)
    return ClassroomClient(creds), token


async def get_courses(db: AsyncSession, user_id: UUID) -> list[dict]:
    classroom_client, _ = await _get_classroom_client(db, user_id)
    return await asyncio.to_thread(classroom_client.get_courses)


async def get_events(db: AsyncSession, user_id: UUID) -> list[dict]:
    classroom_client, token = await _get_classroom_client(db, user_id)
    courses = await asyncio.to_thread(classroom_client.get_courses)

    events: list[dict] = []
    for course in courses:
        course_id = course.get("id")
        course_name = course.get("name", "Unknown course")
        if not course_id:
            continue

        coursework_with_status = await asyncio.to_thread(
            classroom_client.get_all_coursework_with_status,
            course_id,
        )
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

        announcements_items = await _google_get_all_items(
            token,
            f"courses/{course_id}/announcements",
            "announcements",
            {"pageSize": 100},
        )
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
