from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import RedirectResponse
from sqlalchemy import select, delete
from sqlalchemy.ext.asyncio import AsyncSession

from app.classroom.oauth import build_google_connect_url, exchange_code_and_store
from app.classroom.service import get_courses, get_events
from app.config import settings
from app.core.security import decode_access_token
from app.core.dependencies import get_current_user
from app.database import get_db
from app.models.integrations import GoogleToken
from app.models.user import User

router = APIRouter(tags=["Classroom"])


@router.get("/auth/google/debug-config")
async def google_debug_config():
    client_id = settings.GOOGLE_CLIENT_ID or ""
    return {
        "debug": settings.DEBUG,
        "google_client_id_configured": bool(client_id),
        "google_client_id_suffix": client_id[-8:] if client_id else None,
        "google_client_secret_configured": bool(settings.GOOGLE_CLIENT_SECRET),
        "google_redirect_uri": settings.GOOGLE_REDIRECT_URI,
    }


@router.get("/auth/google/connect")
async def google_connect(
    token: str = Query(..., min_length=20),
    db: AsyncSession = Depends(get_db),
):
    payload = decode_access_token(token)
    if not payload or not payload.get("sub"):
        raise HTTPException(status_code=401, detail="Invalid auth token")

    try:
        user_id = UUID(str(payload["sub"]))
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid auth token")

    result = await db.execute(select(User).where(User.id == user_id, User.is_active == True))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")

    url = build_google_connect_url(str(user.id))
    return RedirectResponse(url=url)


@router.get("/auth/google/callback")
async def google_callback(
    code: str,
    state: str,
    db: AsyncSession = Depends(get_db),
):
    await exchange_code_and_store(db, code, state)
    # Redirect to whichever frontend port is active
    frontend_url = settings.ALLOWED_ORIGINS.split(",")[0].strip()
    return RedirectResponse(url=f"{frontend_url}/classroom?connected=1")


@router.get("/classroom/courses")
async def classroom_courses(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await get_courses(db, current_user.id)


@router.get("/classroom/events")
async def classroom_events(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await get_events(db, current_user.id)


@router.get("/classroom/status")
async def classroom_status(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Check if the current user has a connected Google account."""
    result = await db.execute(select(GoogleToken).where(GoogleToken.user_id == current_user.id))
    record = result.scalar_one_or_none()
    if not record:
        return {"connected": False}
    return {
        "connected": True,
        "scope": record.scope,
        "expiry": record.expiry.isoformat() if record.expiry else None,
    }


@router.delete("/classroom/disconnect")
async def classroom_disconnect(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Remove stored Google credentials — user must reconnect to use Classroom."""
    await db.execute(delete(GoogleToken).where(GoogleToken.user_id == current_user.id))
    return {"disconnected": True}
