from fastapi import HTTPException, status

from config.config import ADMIN_EMAILS, REDIS_SESSION_COUNT_KEY, REDIS_URL
from models.auth_models import User
from repositories.admin_repositories import AdminRepository
from repositories.app_repositories import AppRepository
from schemas.admin_schemas import AdminBotUpdate, AdminStats, AdminUserUpdate
from database.redis_client import get_redis
from utils.domain_utils import normalize_domain


class AdminService:
    def __init__(self, repo: AdminRepository):
        self.repo = repo

    async def ensure_admin(self, user: User):
        if user.role in {"admin", "super_admin"}:
            return

        if user.email.lower() in ADMIN_EMAILS:
            return

        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required",
        )

    async def get_stats(self) -> AdminStats:
        return AdminStats(
            total_users=await self.repo.count_users(),
            total_bots=await self.repo.count_bots(),
            active_sessions=await self._count_active_sessions(),
        )

    async def list_users(self, email: str | None, limit: int, offset: int):
        users, total = await self.repo.list_users(email, limit, offset)

        items = [
            {
                "id": user.id,
                "username": user.username,
                "email": user.email,
                "is_active": user.is_active,
                "role": user.role,
                "is_blocked": user.is_blocked,
                "tariff_plan": user.tariff_plan,
            }
            for user in users
        ]
        return {"items": items, "total": total, "limit": limit, "offset": offset}

    async def get_user_detail(self, user_id: int):
        user = await self.repo.get_user_by_id(user_id)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        bots = await self.repo.get_user_bots(user.id)
        return {
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "is_active": user.is_active,
            "role": user.role,
            "is_blocked": user.is_blocked,
            "tariff_plan": user.tariff_plan,
            "bots": bots,
        }

    async def update_user(self, user_id: int, data: AdminUserUpdate, current_admin: User):
        user = await self.repo.get_user_by_id(user_id)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        if data.is_blocked is None and data.tariff_plan is None and data.role is None:
            raise HTTPException(status_code=400, detail="No fields to update")

        if user.id == current_admin.id:
            if data.is_blocked is True:
                raise HTTPException(status_code=400, detail="Admin cannot block itself")
            if data.role == "user":
                raise HTTPException(status_code=400, detail="Admin cannot remove its own role")

        was_blocked = user.is_blocked
        await self.repo.update_user(
            user_id=user_id,
            is_blocked=data.is_blocked,
            tariff_plan=data.tariff_plan,
            role=data.role,
        )

        if data.is_blocked is True and not was_blocked:
            # New block invalidates every token this user still holds.
            await self.repo.increment_token_version(user_id)

        return await self.get_user_detail(user_id)

    async def get_bot(self, bot_id: int):
        bot = await self.repo.get_bot_by_id(bot_id)
        if not bot:
            raise HTTPException(status_code=404, detail="Bot not found")
        return bot

    async def update_bot(self, bot_id: int, data: AdminBotUpdate):
        bot = await self.get_bot(bot_id)
        update_dict = data.model_dump(exclude_unset=True)
        if not update_dict:
            raise HTTPException(status_code=400, detail="No fields to update")

        if "allowed_domain" in update_dict:
            canonical_domain = normalize_domain(update_dict["allowed_domain"])
            if not canonical_domain:
                raise HTTPException(status_code=400, detail="Invalid domain")
            app_repo = AppRepository(self.repo.session)
            existing = await app_repo.find_bot_by_canonical_domain(canonical_domain, exclude_bot_id=bot_id)
            if existing:
                raise HTTPException(status_code=400, detail="A bot is already registered for this domain")
            update_dict["allowed_domain"] = canonical_domain

        success = await self.repo.update_bot(bot.id, update_dict)
        if not success:
            raise HTTPException(status_code=400, detail="Could not update bot")
        return await self.get_bot(bot.id)

    async def delete_bot(self, bot_id: int):
        success = await self.repo.delete_bot(bot_id)
        if not success:
            raise HTTPException(status_code=404, detail="Bot not found")

    async def _count_active_sessions(self) -> int:
        if not REDIS_URL:
            return 0

        client = await get_redis()
        if client is None:
            return 0

        try:
            count = await client.get(REDIS_SESSION_COUNT_KEY)
            return int(count or 0)
        except Exception as exc:
            print(f"Redis active session count failed: {exc}")
            return 0
