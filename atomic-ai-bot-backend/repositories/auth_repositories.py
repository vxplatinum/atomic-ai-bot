from datetime import datetime
import hashlib

from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from models.app_models import Bot
from models.auth_models import BlacklistedToken, User


def hash_token(token: str) -> str:
    # Persist SHA256, never the raw JWT.
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


class UserRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_user_by_email(self, email: str):
        result = await self.session.execute(select(User).where(User.email == email))
        return result.scalar_one_or_none()

    async def get_user_by_username(self, username: str):
        result = await self.session.execute(select(User).where(User.username == username))
        return result.scalar_one_or_none()

    async def is_user_blocked(self, user_id: int) -> bool:
        result = await self.session.execute(
            select(User.is_blocked).where(User.id == user_id)
        )
        return bool(result.scalar_one_or_none())

    async def create_user(self, user_data: dict):
        user = User(**user_data)
        self.session.add(user)
        await self.session.commit()
        await self.refresh(user)
        return user

    async def activate_user(self, user: User):
        user.is_active = True
        await self.session.commit()

    async def refresh(self, obj):
        await self.session.refresh(obj)

    async def cleanup_expired_blacklist(self):
        now = datetime.utcnow()
        await self.session.execute(
            delete(BlacklistedToken).where(BlacklistedToken.expires_at <= now)
        )
        await self.session.commit()

    async def add_token_to_blacklist(self, token: str, expires_at: datetime):
        await self.cleanup_expired_blacklist()

        token_hash = hash_token(token)
        result = await self.session.execute(
            select(BlacklistedToken).where(BlacklistedToken.token_hash == token_hash)
        )
        if result.scalar_one_or_none():
            return

        self.session.add(
            BlacklistedToken(token_hash=token_hash, expires_at=expires_at)
        )
        await self.session.commit()

    async def is_token_blacklisted(self, token: str) -> bool:
        token_hash = hash_token(token)
        now = datetime.utcnow()
        result = await self.session.execute(
            select(BlacklistedToken).where(
                BlacklistedToken.token_hash == token_hash,
                BlacklistedToken.expires_at > now,
            )
        )
        return result.scalar_one_or_none() is not None

    async def increment_token_version(self, user_id: int):
        result = await self.session.execute(select(User).where(User.id == user_id))
        user = result.scalar_one_or_none()
        if not user:
            return
        user.token_version += 1
        await self.session.commit()

    async def update_user_password(self, user: User, hashed_password: str):
        user.hashed_password = hashed_password
        await self.session.commit()

    async def delete_user(self, user: User):
        await self.session.execute(delete(Bot).where(Bot.owner_id == user.id))
        await self.session.execute(delete(User).where(User.id == user.id))
        await self.session.commit()