import secrets
from fastapi import HTTPException, Depends

from repositories.app_repositories import AppRepository, get_app_repository
from schemas.app_schemas import BotCreate, BotUpdate
from database.redis_client import get_redis
from utils.domain_utils import normalize_domain, domains_match


class AppService:
    def __init__(self, repo: AppRepository, redis=None):
        self.repo = repo
        self.redis = redis

    async def create_new_bot(self, user_id: int, bot_data: BotCreate):
        canonical_domain = self._canonical_domain_or_error(bot_data.allowed_domain)
        await self._ensure_domain_available(canonical_domain)

        payload = bot_data.model_copy(update={"allowed_domain": canonical_domain})
        api_key = f"at_{secrets.token_urlsafe(32)}"
        return await self.repo.create_user_bot(
            user_id=user_id,
            bot_data=payload,
            api_key=api_key,
        )

    async def validate_bot_access(self, api_key: str, origin: str):
        bot = await self.repo.get_bot_by_api_key(api_key)
        if not bot:
            raise HTTPException(status_code=404, detail="Bot not found")

        if not domains_match(bot.allowed_domain, origin):
            raise HTTPException(status_code=403, detail="Domain not allowed for this bot")

        return bot

    def _canonical_domain_or_error(self, domain: str) -> str:
        canonical = normalize_domain(domain)
        if not canonical:
            raise HTTPException(status_code=400, detail="Invalid domain")
        return canonical

    async def _ensure_domain_available(self, canonical_domain: str, exclude_bot_id: int | None = None):
        existing = await self.repo.find_bot_by_canonical_domain(canonical_domain, exclude_bot_id)
        if existing:
            raise HTTPException(status_code=400, detail="A bot is already registered for this domain")

    async def get_all_user_bots(self, user_id: int) -> list:
        bots = await self.repo.get_user_bots(user_id)
        return bots if bots is not None else []

    async def delete_user_bot(self, bot_id: int, user_id: int) -> bool:
        return await self.repo.delete_bot(bot_id, user_id)

    async def edit_bot(self, bot_id: int, user_id: int, update_data: BotUpdate):
        bot = await self.repo.get_bot_by_id(bot_id, user_id)
        if not bot:
            return False

        update_dict = update_data.model_dump(exclude_unset=True)
        if "allowed_domain" in update_dict:
            canonical_domain = self._canonical_domain_or_error(update_dict["allowed_domain"])
            await self._ensure_domain_available(canonical_domain, exclude_bot_id=bot_id)
            update_dict["allowed_domain"] = canonical_domain

        success = await self.repo.update_bot(bot_id, user_id, update_dict)

        if success and self.redis:
            try:
                # Leftover invalidation. Nothing in this repo writes config:{api_key}.
                await self.redis.delete(f"config:{bot.api_key}")
            except Exception as exc:
                print(f"Redis cache delete failed: {exc}")
        return success


async def get_bot_service(repo: AppRepository = Depends(get_app_repository)):
    redis = await get_redis()
    return AppService(repo, redis)
