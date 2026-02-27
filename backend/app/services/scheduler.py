"""
app/services/scheduler.py
──────────────────────────
APScheduler cron jobs that run in the background alongside FastAPI.
Started in main.py on app startup.

Jobs:
  1. Every hour   – refresh alerts for all active users
  2. Every day    – mark overdue assignments
  3. Every 6 hrs  – re-run activity conflict detection
"""
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from apscheduler.triggers.interval import IntervalTrigger
from sqlalchemy import select
from datetime import date

from app.core.database import AsyncSessionLocal
from app.models.user import User
from app.models.academic import Assignment, AssignmentStatus, Activity
from app.services.alert_engine import refresh_alerts

scheduler = AsyncIOScheduler()


async def _refresh_all_user_alerts():
    """Regenerate alerts for every active user."""
    async with AsyncSessionLocal() as db:
        result = await db.execute(select(User).where(User.is_active == True))
        users = result.scalars().all()
        for user in users:
            try:
                await refresh_alerts(user.id, db)
            except Exception as e:
                print(f"[scheduler] Alert refresh failed for user {user.id}: {e}")
        await db.commit()
    print(f"[scheduler] Alert refresh complete for {len(users)} users")


async def _mark_overdue_assignments():
    """Auto-mark pending assignments past their deadline as 'overdue'."""
    today = date.today()
    async with AsyncSessionLocal() as db:
        result = await db.execute(
            select(Assignment).where(
                Assignment.status == AssignmentStatus.pending,
                Assignment.deadline < today,
                Assignment.deadline != None,
            )
        )
        overdue = result.scalars().all()
        for assignment in overdue:
            assignment.status = AssignmentStatus.overdue
        await db.commit()
    if overdue:
        print(f"[scheduler] Marked {len(overdue)} assignments as overdue")


async def _recheck_activity_conflicts():
    """Re-run conflict detection for future activities (in case new assignments were added)."""
    from datetime import timedelta
    today = date.today()
    async with AsyncSessionLocal() as db:
        act_result = await db.execute(
            select(Activity).where(Activity.activity_date >= today)
        )
        activities = act_result.scalars().all()

        for activity in activities:
            window_start = activity.activity_date - timedelta(days=1)
            window_end   = activity.activity_date + timedelta(days=1)
            conflict_result = await db.execute(
                select(Assignment).where(
                    Assignment.user_id == activity.user_id,
                    Assignment.deadline >= window_start,
                    Assignment.deadline <= window_end,
                    Assignment.status.notin_([AssignmentStatus.completed.value, AssignmentStatus.overdue.value]),
                )
            )
            clashing = conflict_result.scalars().all()
            activity.has_conflict = bool(clashing)
            activity.conflict_detail = (
                ", ".join(f"'{a.title}' due {a.deadline}" for a in clashing)
                if clashing else None
            )
        await db.commit()


def start_scheduler():
    """Register all jobs and start the scheduler. Called from main.py."""

    # Alert refresh — every hour at minute 0
    scheduler.add_job(
        _refresh_all_user_alerts,
        trigger=IntervalTrigger(hours=1),
        id="refresh_alerts",
        replace_existing=True,
    )

    # Overdue check — every day at 00:05
    scheduler.add_job(
        _mark_overdue_assignments,
        trigger=CronTrigger(hour=0, minute=5),
        id="mark_overdue",
        replace_existing=True,
    )

    # Activity conflict re-check — every 6 hours
    scheduler.add_job(
        _recheck_activity_conflicts,
        trigger=IntervalTrigger(hours=6),
        id="recheck_conflicts",
        replace_existing=True,
    )

    scheduler.start()
    print("[scheduler] ✅ Cron jobs started")


def stop_scheduler():
    scheduler.shutdown(wait=False)
    print("[scheduler] Stopped")
