from fastapi.params import Depends
from sqlalchemy import delete, select, delete, and_, update
from sqlalchemy.ext.asyncio import AsyncSession

from models.app_models import Bot
from schemas.app_schemas import BotCreate

from utils.domain_utils import domain_identity

from database.database import get_db

class AppRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def create_user_bot(self, user_id: int, bot_data: BotCreate, api_key: str):
        bot_dict = bot_data.model_dump()
        bot_settings = bot_dict.pop("settings", {})
        db_bot = Bot(
            name=bot_dict["name"],
            allowed_domain=bot_dict["allowed_domain"],
            api_key=api_key,
            owner_id=user_id,
            settings=bot_settings
        )

        self.session.add(db_bot)
        await self.session.commit()
        await self.session.refresh(db_bot)
        return db_bot

    async def get_bot_by_api_key(self, api_key: str) -> Bot | None:
        result = await self.session.execute(
            select(Bot).where(Bot.api_key == api_key)
        )
        return result.scalar_one_or_none()

    async def find_bot_by_canonical_domain(
        self,
        domain: str,
        exclude_bot_id: int | None = None,
    ) -> Bot | None:
        # Compare in Python so localhost / 127.0.0.1 / ::1 collapse to one identity.
        target = domain_identity(domain)
        result = await self.session.execute(select(Bot))
        for bot in result.scalars():
            if exclude_bot_id is not None and bot.id == exclude_bot_id:
                continue
            if domain_identity(bot.allowed_domain) == target:
                return bot
        return None
    
    async def get_user_bots(self, user_id: int) -> list[Bot]:
        result = await self.session.execute(
            select(Bot).where(Bot.owner_id == user_id)
        )
        return list(result.scalars().all())
    
    async def delete_bot(self, bot_id: int, user_id: int) -> bool:
        query = delete(Bot).where(
            and_(Bot.id == bot_id, Bot.owner_id == user_id)
        )
        result = await self.session.execute(query)
        await self.session.commit()
    
        return result.rowcount > 0
    
    async def get_bot_by_id(self, bot_id: int, user_id: int):
        query = select(Bot).where(Bot.id == bot_id, Bot.owner_id == user_id)
        result = await self.session.execute(query)
        return result.scalar_one_or_none()

    async def update_bot(self, bot_id: int, user_id: int, update_dict: dict) -> bool:
        if not update_dict:
            return False
            
        query = (
            update(Bot)
            .where(Bot.id == bot_id, Bot.owner_id == user_id)
            .values(**update_dict)
        )
    
        result = await self.session.execute(query)
        await self.session.commit()
        return result.rowcount > 0
    
async def get_app_repository(db: AsyncSession = Depends(get_db)):
    return AppRepository(db)