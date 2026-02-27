from __future__ import annotations

import json
from pathlib import Path
from typing import Sequence

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.integrations import CollegeEvent


def _to_payload(event: CollegeEvent) -> dict:
    return {
        "college": event.college,
        "event_name": event.event_name,
        "event_type": event.event_type,
        "date": event.event_date,
        "semester": event.semester,
        "department": event.department,
        "source_url": event.source_url,
    }


async def save_events_with_fallback(db: AsyncSession, events: Sequence[dict], fallback_path: Path) -> list[dict]:
    persisted: list[dict] = []

    try:
        for item in events:
            exists = await db.execute(
                select(CollegeEvent).where(
                    CollegeEvent.college == item["college"],
                    CollegeEvent.event_name == item["event_name"],
                    CollegeEvent.event_date == item.get("date"),
                    CollegeEvent.source_url == item["source_url"],
                )
            )
            if exists.scalar_one_or_none():
                persisted.append(item)
                continue

            db.add(
                CollegeEvent(
                    college=item["college"],
                    event_name=item["event_name"],
                    event_type=item["event_type"],
                    event_date=item.get("date"),
                    semester=item.get("semester"),
                    department=item.get("department"),
                    source_url=item["source_url"],
                )
            )
            persisted.append(item)

        await db.flush()
        return persisted
    except Exception:
        fallback_path.parent.mkdir(parents=True, exist_ok=True)
        fallback_path.write_text(json.dumps(list(events), indent=2), encoding="utf-8")
        return list(events)
