from fastapi import APIRouter, Depends, Request, HTTPException

from services.app_services import AppService, get_bot_service
from services.auth_services import AuthService
from schemas.app_schemas import BotCreate, BotOut, BotShortInfo, BotUpdate

from routes.auth_endpoints import get_auth_service, oauth2_scheme

from models.auth_models import User

router = APIRouter(prefix="/app", tags=["Application"])

async def get_current_user(
    token: str = Depends(oauth2_scheme), 
    service: AuthService = Depends(get_auth_service)
):
    user = await service.get_current_user(token)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid token")
    return user

@router.get("/bots", response_model=list[BotShortInfo])
async def list_bots(
    current_user: User = Depends(get_current_user),
    service: AppService = Depends(get_bot_service)
):
    return await service.get_all_user_bots(current_user.id)

@router.post("/bots", response_model=BotShortInfo)
async def create_bot(
    bot_data: BotCreate,
    current_user: User = Depends(get_current_user),
    service: AppService = Depends(get_bot_service)
):
    return await service.create_new_bot(current_user.id, bot_data)

@router.patch("/bots/{bot_id}")
async def update_bot_endpoint(
    bot_id: int,
    update_data: BotUpdate,
    current_user: User = Depends(get_current_user),
    service: AppService = Depends(get_bot_service)
):
    success = await service.edit_bot(bot_id, current_user.id, update_data)
    if not success:
        raise HTTPException(status_code=400, detail="Could not update the bot you are trying to update has not been found")
    return {"status": "success", "message": "The bot has been successfully updated"}

@router.delete("/bots/{bot_id}", status_code=204)
async def delete_bot(
    bot_id: int,
    current_user: User = Depends(get_current_user),
    service: AppService = Depends(get_bot_service)
):
    success = await service.delete_user_bot(bot_id, current_user.id)
    if not success:
        raise HTTPException(status_code=404, detail="The bot you are trying to delete has not been found")
    return None

@router.get("/public/validate/{api_key}", response_model=BotOut)
async def validate_widget(
    api_key: str,
    request: Request,
    service: AppService = Depends(get_bot_service)
):
    # Store page origin. Widget and chat service both send Origin or Referer.
    origin = request.headers.get("origin") or request.headers.get("referer") or ""
    return await service.validate_bot_access(api_key, origin)