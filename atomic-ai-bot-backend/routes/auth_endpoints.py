from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from fastapi.security import OAuth2PasswordRequestForm, OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import timedelta

from database.database import get_db

from repositories.auth_repositories import UserRepository

from services.auth_services import AuthService, MailService

from schemas.auth_schemas import (
    UserCreate,
    UserOut,
    Token,
    VerificationRequest,
    LogoutRequest,
    RefreshRequest,
    ForgotPasswordRequest,
    ResetPasswordConfirm,
    DeleteAccountRequest,
)

from config.config import ACCESS_TOKEN_EXPIRE_MINUTES, REFRESH_TOKEN_EXPIRE_DAYS

router = APIRouter(prefix="/auth", tags=["auth"])
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

def get_auth_service(db: AsyncSession = Depends(get_db)):
    repo = UserRepository(db)
    mail_service = MailService()
    return AuthService(repo, mail_service)

@router.post("/register", response_model=UserOut)
async def register(
    user_in: UserCreate, 
    background_tasks: BackgroundTasks,
    service: AuthService = Depends(get_auth_service)
):
    return await service.register_new_user(user_in, background_tasks)

@router.post("/login", response_model=Token)
async def login(
    form_data: OAuth2PasswordRequestForm = Depends(), 
    service: AuthService = Depends(get_auth_service)
):
    user = await service.authenticate_user(form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email, username, or password",
        )
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Your email address has not been verified")

    role = service.get_effective_role(user)
    token_payload = service.build_token_payload(user, role)
    access_token = service.create_token(
        token_payload,
        timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES),
        "access",
    )
    refresh_token = service.create_token(
        token_payload,
        timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS),
        "refresh",
    )
    await service.register_active_session(refresh_token, user.id)
    return {"access_token": access_token, "refresh_token": refresh_token, "token_type": "bearer"}

@router.post("/verify-email")
async def verify_email(req: VerificationRequest, service: AuthService = Depends(get_auth_service)):
    return await service.verify_email_token(req.token)

@router.post("/refresh", response_model=Token)
async def refresh(
    req: RefreshRequest,
    service: AuthService = Depends(get_auth_service),
):
    return await service.refresh_tokens(req.refresh_token)


@router.post("/logout")
async def logout(
    req: LogoutRequest,
    token: str = Depends(oauth2_scheme),
    service: AuthService = Depends(get_auth_service),
):
    await service.logout(req.refresh_token, token)
    return {"message": "You have been successfully logged out"}

@router.get("/me", response_model=UserOut)
async def get_me(
    token: str = Depends(oauth2_scheme), 
    service: AuthService = Depends(get_auth_service)
):

    user = await service.get_current_user(token)
    return service.user_to_out(user)

@router.post("/forgot-password")
async def forgot_password(
    req: ForgotPasswordRequest, 
    background_tasks: BackgroundTasks,
    service: AuthService = Depends(get_auth_service)
):
    await service.request_password_reset(req.email, background_tasks)
    return {"message": "Password reset email has been sent"}

@router.post("/reset-password-confirm")
async def reset_password_confirm(req: ResetPasswordConfirm, service: AuthService = Depends(get_auth_service)):
    return await service.reset_password_confirm(req.token, req.new_password)


@router.delete("/account")
async def delete_account(
    body: DeleteAccountRequest,
    token: str = Depends(oauth2_scheme),
    service: AuthService = Depends(get_auth_service),
):
    return await service.delete_account(token, body.password)