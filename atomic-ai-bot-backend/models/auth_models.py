from sqlalchemy.orm import Mapped, mapped_column, relationship
from datetime import datetime
from sqlalchemy import String, DateTime

from database.database import Base

class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)
    username: Mapped[str] = mapped_column(unique=True, index=True)
    email: Mapped[str] = mapped_column(unique=True, index=True)
    hashed_password: Mapped[str] = mapped_column()
    is_active: Mapped[bool] = mapped_column(default=False)
    role: Mapped[str] = mapped_column(String(50), default="user")
    is_blocked: Mapped[bool] = mapped_column(default=False)
    tariff_plan: Mapped[str] = mapped_column(String(50), default="free")
    # Bump token_version to revoke all JWTs for this user.
    token_version: Mapped[int] = mapped_column(default=1)
    bots = relationship("Bot", back_populates="owner")

class BlacklistedToken(Base):
    __tablename__ = "token_blacklist"

    id: Mapped[int] = mapped_column(primary_key=True)
    token_hash: Mapped[str] = mapped_column(String(64), unique=True, index=True)
    expires_at: Mapped[datetime] = mapped_column(DateTime, index=True)
    blacklisted_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)