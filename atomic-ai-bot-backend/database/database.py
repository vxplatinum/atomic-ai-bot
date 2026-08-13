from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase

from config.config import (
    DB_ECHO,
    DB_MAX_OVERFLOW,
    DB_POOL_RECYCLE,
    DB_POOL_SIZE,
    POSTGRES_URL,
)
from database.postgres_url import normalize_async_postgres_url


class Base(DeclarativeBase):
    pass


if not POSTGRES_URL:
    raise RuntimeError("Atomic AI Bot: POSTGRES_URL is not set. Add it to your .env file.")

ASYNC_POSTGRES_URL, POSTGRES_CONNECT_ARGS = normalize_async_postgres_url(POSTGRES_URL)

engine = create_async_engine(
    ASYNC_POSTGRES_URL,
    echo=DB_ECHO,
    pool_size=DB_POOL_SIZE,
    max_overflow=DB_MAX_OVERFLOW,
    pool_pre_ping=True,
    pool_recycle=DB_POOL_RECYCLE,
    connect_args=POSTGRES_CONNECT_ARGS,
)

async_session = async_sessionmaker(engine, expire_on_commit=False, class_=AsyncSession)


async def create_tables() -> None:
    # Import models so their tables are registered on Base.metadata.
    from models import app_models, auth_models  # noqa: F401

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


async def get_db():
    async with async_session() as session:
        yield session
