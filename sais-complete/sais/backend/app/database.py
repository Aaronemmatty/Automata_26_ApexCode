from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase
from app.config import settings

# Create async engine
engine_kwargs = {
    "echo": False,
}
if not settings.DATABASE_URL.startswith("sqlite"):
    engine_kwargs["pool_size"] = 10
    engine_kwargs["max_overflow"] = 20

engine = create_async_engine(settings.DATABASE_URL, **engine_kwargs)


async def ensure_assignment_ai_metadata_column() -> None:
    async with engine.begin() as conn:
        if settings.DATABASE_URL.startswith("sqlite"):
            try:
                await conn.exec_driver_sql("ALTER TABLE assignments ADD COLUMN ai_metadata JSON")
            except Exception:
                pass
        else:
            try:
                await conn.exec_driver_sql("ALTER TABLE assignments ADD COLUMN IF NOT EXISTS ai_metadata JSON")
            except Exception:
                pass

# Session factory
AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,   # keep objects usable after commit
)


# Base class for all ORM models
class Base(DeclarativeBase):
    pass


# Dependency — yields a DB session per request, closes it after
async def get_db() -> AsyncSession:
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()
