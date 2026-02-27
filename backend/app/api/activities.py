from uuid import UUID
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.schemas.schemas import ActivityCreate, ActivityOut
from app.services import activity_service

router = APIRouter(prefix="/activities", tags=["Activities"])


@router.post("/", response_model=ActivityOut, status_code=201)
async def create_activity(
    data: ActivityCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Add a new extracurricular activity.
    Automatically checks for conflicts with assignment deadlines.
    """
    return await activity_service.create_activity(current_user.id, data, db)


@router.get("/", response_model=list[ActivityOut])
async def list_activities(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List all activities, ordered by date."""
    return await activity_service.get_activities(current_user.id, db)


@router.delete("/{activity_id}", status_code=204)
async def delete_activity(
    activity_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    await activity_service.delete_activity(current_user.id, activity_id, db)


@router.post("/refresh-conflicts")
async def refresh_conflicts(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Re-run conflict detection for all activities."""
    count = await activity_service.refresh_all_conflicts(current_user.id, db)
    return {"updated": count}
