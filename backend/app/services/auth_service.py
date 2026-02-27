from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.user import User
from app.core.security import hash_password, verify_password, create_access_token
from app.schemas.schemas import RegisterRequest, LoginRequest


async def register_user(data: RegisterRequest, db: AsyncSession) -> User:
    """Create a new user. Raises 400 if email/username taken."""
    normalized_email = data.email.strip().lower()
    normalized_username = data.username.strip()

    if not normalized_username:
        raise HTTPException(status_code=400, detail="Username is required")

    # Check email uniqueness
    existing = await db.execute(select(User).where(User.email == normalized_email))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Email already registered")

    # Check username uniqueness
    existing = await db.execute(select(User).where(User.username == normalized_username))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Username already taken")

    hashed = hash_password(data.password)
    user = User(
        email=normalized_email,
        username=normalized_username,
        full_name=data.full_name,
        hashed_password=hashed,
    )
    db.add(user)
    await db.flush()   # get the id before commit
    return user


async def login_user(data: LoginRequest, db: AsyncSession) -> str:
    """Verify credentials and return a JWT access token."""
    normalized_email = data.email.strip().lower()
    result = await db.execute(select(User).where(User.email == normalized_email))
    user = result.scalar_one_or_none()

    if not user or not verify_password(data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )

    if not user.is_active:
        raise HTTPException(status_code=400, detail="Account is disabled")

    return create_access_token(subject=user.id)
