from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from database.database import get_db

from models.auth_models import User

from repositories.admin_repositories import AdminRepository

from routes.auth_endpoints import get_auth_service, oauth2_scheme
from schemas.admin_schemas import (
    AdminBotOut,
    AdminBotUpdate,
    AdminStats,
    AdminUserDetail,
    AdminUserListResponse,
    AdminUserUpdate,
)

from services.admin_services import AdminService
from services.auth_services import AuthService


router = APIRouter(prefix="/admin", tags=["admin"])


def get_admin_service(db: AsyncSession = Depends(get_db)):
    repo = AdminRepository(db)
    return AdminService(repo)


async def get_current_admin(
    token: str = Depends(oauth2_scheme),
    auth_service: AuthService = Depends(get_auth_service),
    admin_service: AdminService = Depends(get_admin_service),
):
    user = await auth_service.get_current_user(token)
    await admin_service.ensure_admin(user)
    return user


@router.get("/stats", response_model=AdminStats)
async def get_stats(
    _: User = Depends(get_current_admin),
    service: AdminService = Depends(get_admin_service),
):
    return await service.get_stats()


@router.get("/users", response_model=AdminUserListResponse)
async def list_users(
    email: str | None = Query(default=None, description="Search by email"),
    limit: int = Query(default=50, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    _: User = Depends(get_current_admin),
    service: AdminService = Depends(get_admin_service),
):
    return await service.list_users(email, limit, offset)


@router.get("/users/{user_id}", response_model=AdminUserDetail)
async def get_user(
    user_id: int,
    _: User = Depends(get_current_admin),
    service: AdminService = Depends(get_admin_service),
):
    return await service.get_user_detail(user_id)


@router.patch("/users/{user_id}", response_model=AdminUserDetail)
async def update_user(
    user_id: int,
    data: AdminUserUpdate,
    current_admin: User = Depends(get_current_admin),
    service: AdminService = Depends(get_admin_service),
):
    return await service.update_user(user_id, data, current_admin)


@router.get("/bots/{bot_id}", response_model=AdminBotOut)
async def get_bot(
    bot_id: int,
    _: User = Depends(get_current_admin),
    service: AdminService = Depends(get_admin_service),
):
    return await service.get_bot(bot_id)


@router.patch("/bots/{bot_id}", response_model=AdminBotOut)
async def update_bot(
    bot_id: int,
    data: AdminBotUpdate,
    _: User = Depends(get_current_admin),
    service: AdminService = Depends(get_admin_service),
):
    return await service.update_bot(bot_id, data)


@router.delete("/bots/{bot_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_bot(
    bot_id: int,
    _: User = Depends(get_current_admin),
    service: AdminService = Depends(get_admin_service),
):
    await service.delete_bot(bot_id)
    return None
