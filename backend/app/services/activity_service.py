from uuid import UUID
from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from app.models.activity import Activity
from app.models.assignment import Assignment, AssignmentStatus
from app.schemas.schemas import ActivityCreate


async def create_activity(
    user_id: UUID, data: ActivityCreate, db: AsyncSession
) -> Activity:
    # Create the activity object first
    activity = Activity(
        user_id=user_id,
        title=data.title,
        category=data.category,
        activity_date=data.activity_date,
        start_time=data.start_time,
        end_time=data.end_time,
        location=data.location,
        description=data.description
    )
    
    # Run conflict check sequentially with error handling
    try:
        conflict_text = await _check_conflicts(user_id, data.activity_date, db)
        if conflict_text:
            activity.has_conflict = True
            activity.conflict_detail = conflict_text
    except Exception as e:
        # Don't let conflict check crash the whole creation
        print(f"[conflict_check] Warning: failed for date {data.activity_date}: {e}")
        activity.has_conflict = False
        activity.conflict_detail = f"Conflict check failed: {e}"

    db.add(activity)
    await db.flush()
    await db.refresh(activity)
    return activity


async def get_activities(user_id: UUID, db: AsyncSession) -> list[Activity]:
    result = await db.execute(
        select(Activity)
        .where(Activity.user_id == user_id)
        .order_by(Activity.activity_date.asc())
    )
    return list(result.scalars().all())


async def delete_activity(user_id: UUID, activity_id: UUID, db: AsyncSession) -> None:
    result = await db.execute(
        select(Activity).where(
            and_(Activity.id == activity_id, Activity.user_id == user_id)
        )
    )
    activity = result.scalar_one_or_none()
    if not activity:
        raise HTTPException(status_code=404, detail="Activity not found")
    await db.delete(activity)
    await db.flush()


async def _check_conflicts(user_id: UUID, activity_date, db: AsyncSession) -> str | None:
    """
    Returns a conflict description string if any assignment deadline
    falls on the same date as the activity.
    """
    # Use a robust raw SQL query for conflict detection to bypass ORM session complexities
    from sqlalchemy import text
    stmt = text("""
        SELECT title FROM assignments 
        WHERE user_id = :u AND deadline = :d AND status NOT IN ('completed')
    """)
    result = await db.execute(stmt, {"u": user_id, "d": activity_date})
    titles = [row[0] for row in result.all()]

    if titles:
        return f"Conflicts with: {', '.join(titles)}"
    return None


async def refresh_all_conflicts(user_id: UUID, db: AsyncSession) -> int:
    """Re-run conflict check on all activities. Returns count updated."""
    result = await db.execute(
        select(Activity).where(Activity.user_id == user_id)
    )
    activities = result.scalars().all()
    updated = 0
    for activity in activities:
        conflict_text = await _check_conflicts(user_id, activity.activity_date, db)
        had_conflict = activity.has_conflict
        activity.has_conflict = bool(conflict_text)
        activity.conflict_detail = conflict_text
        if activity.has_conflict != had_conflict:
            updated += 1
    await db.flush()
    return updated
