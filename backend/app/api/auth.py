from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.schemas.schemas import RegisterRequest, LoginRequest, TokenResponse, UserOut
from app.services import auth_service

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", response_model=UserOut, status_code=201)
async def register(data: RegisterRequest, db: AsyncSession = Depends(get_db)):
    """Register a new user account."""
    user = await auth_service.register_user(data, db)
    return user


@router.post("/signup", response_model=UserOut, status_code=201)
async def signup(data: RegisterRequest, db: AsyncSession = Depends(get_db)):
    """Alias for register to support /auth/signup path."""
    user = await auth_service.register_user(data, db)
    return user


@router.post("/login", response_model=TokenResponse)
async def login(data: LoginRequest, db: AsyncSession = Depends(get_db)):
    """Login and receive a JWT access token."""
    token = await auth_service.login_user(data, db)
    return TokenResponse(access_token=token)


@router.get("/me", response_model=UserOut)
async def get_me(current_user: User = Depends(get_current_user)):
    """Get the currently authenticated user's profile."""
    return current_user
