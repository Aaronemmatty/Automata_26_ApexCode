from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.college_events.college_loader import CollegeLoader
from app.college_events.main import fetch_events_for_college
from app.database import get_db

router = APIRouter(tags=["College Events"])


def _serialize_calendar_event(item: dict) -> dict | None:
    raw_start = item.get("start_date") or item.get("date")
    if not raw_start:
        return None

    start = str(raw_start)[:10]
    end = str(item.get("end_date") or raw_start)[:10]
    title = item.get("title") or item.get("event_name") or "Academic Event"
    event_type = item.get("type") or item.get("event_type") or "Notice"

    return {
        "title": title,
        "start": start,
        "end": end,
        "type": event_type,
        "event_name": title,
        "date": start,
        "event_type": event_type,
        "college": item.get("college"),
        "source_url": item.get("source_url"),
    }


@router.get("/colleges")
async def list_colleges():
    loader = CollegeLoader()
    return [
        {
            "name": c.name,
            "base_url": c.base_url,
            "sitemap_url": c.sitemap_url,
            "keywords": c.keywords,
        }
        for c in loader.list_colleges()
    ]


@router.get("/events")
async def get_events(
    college: str | None = Query(default=None, min_length=2),
    db: AsyncSession = Depends(get_db),
):
    try:
        selected_college = college
        if not selected_college:
            loader = CollegeLoader()
            all_colleges = loader.list_colleges()
            if not all_colleges:
                return []
            selected_college = all_colleges[0].name

        events = await fetch_events_for_college(selected_college, db)
        serialized = []
        for item in events:
            mapped = _serialize_calendar_event(item)
            if mapped:
                serialized.append(mapped)
        return serialized
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc))
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Failed to fetch events: {exc}")
