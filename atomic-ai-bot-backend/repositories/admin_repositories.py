from sqlalchemy import delete, func, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from models.app_models import Bot
from models.auth_models import User


class AdminRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def count_users(self) -> int:
        result = await self.session.execute(select(func.count(User.id)))
        return result.scalar_one()

    async def count_bots(self) -> int:
        result = await self.session.execute(select(func.count(Bot.id)))
        return result.scalar_one()

    async def list_users(
        self,
        email: str | None,
        limit: int,
        offset: int,
    ) -> tuple[list[User], int]:
        filters = []
        if email:
            filters.append(User.email.ilike(f"%{email}%"))

        count_query = select(func.count(User.id))
        users_query = select(User).order_by(User.id).limit(limit).offset(offset)

        if filters:
            count_query = count_query.where(*filters)
            users_query = users_query.where(*filters)

        total_result = await self.session.execute(count_query)
        users_result = await self.session.execute(users_query)
        return list(users_result.scalars().all()), total_result.scalar_one()

    async def get_user_by_id(self, user_id: int):
        result = await self.session.execute(select(User).where(User.id == user_id))
        return result.scalar_one_or_none()

    async def get_user_bots(self, user_id: int) -> list[Bot]:
        result = await self.session.execute(
            select(Bot).where(Bot.owner_id == user_id).order_by(Bot.id)
        )
        return list(result.scalars().all())

    async def update_user(
        self,
        user_id: int,
        is_blocked: bool | None,
        tariff_plan: str | None,
        role: str | None,
    ) -> bool:
        update_dict = {}
        if is_blocked is not None:
            update_dict["is_blocked"] = is_blocked
        if tariff_plan is not None:
            update_dict["tariff_plan"] = tariff_plan
        if role is not None:
            update_dict["role"] = role

        if not update_dict:
            return False

        result = await self.session.execute(
            update(User).where(User.id == user_id).values(**update_dict)
        )
        await self.session.commit()
        return result.rowcount > 0

    async def increment_token_version(self, user_id: int):
        result = await self.session.execute(select(User).where(User.id == user_id))
        user = result.scalar_one_or_none()
        if not user:
            return
        user.token_version += 1
        await self.session.commit()

    async def get_bot_by_id(self, bot_id: int):
        result = await self.session.execute(select(Bot).where(Bot.id == bot_id))
        return result.scalar_one_or_none()

    async def update_bot(self, bot_id: int, update_dict: dict) -> bool:
        if not update_dict:
            return False

        result = await self.session.execute(
            update(Bot).where(Bot.id == bot_id).values(**update_dict)
        )
        await self.session.commit()
        return result.rowcount > 0

    async def delete_bot(self, bot_id: int) -> bool:
        result = await self.session.execute(delete(Bot).where(Bot.id == bot_id))
        await self.session.commit()
        return result.rowcount > 0
