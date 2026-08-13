from datetime import datetime, timedelta, timezone
import hashlib
import json
from jose import jwt, JWTError
from passlib.context import CryptContext
from fastapi import HTTPException, BackgroundTasks
from fastapi_mail import FastMail, MessageSchema, MessageType

from repositories.auth_repositories import UserRepository
from schemas.auth_schemas import UserCreate
from config.config import (
    SECRET_KEY,
    ALGORITHM,
    ADMIN_EMAILS,
    MAIL_CONFIG,
    FRONTEND_URL,
    REDIS_ACTIVE_SESSION_KEY_PREFIX,
    REDIS_SESSION_COUNT_KEY,
    REDIS_URL,
    ACCESS_TOKEN_EXPIRE_MINUTES,
    REFRESH_TOKEN_EXPIRE_DAYS,
)
from database.redis_client import get_redis

PWD_CONTEXT = CryptContext(schemes=["bcrypt"], deprecated="auto", bcrypt__ident="2b")


class MailService:
    def __init__(self):
        self.fastmail = FastMail(MAIL_CONFIG)

    async def send_verification_email(self, email: str, token: str):
        verification_url = f"{FRONTEND_URL.rstrip('/')}/auth/verify-email?token={token}"

        html = f"""
        <html>
            <body>
                <p>Thank you for registering!</p>
                <p>Please click the link below to verify your email address:</p>
                <a href="{verification_url}">{verification_url}</a>
                <p>Url will expire in 24 hours</p>
            </body>
        </html>
        """

        message = MessageSchema(
            subject="Email Verification",
            recipients=[email],
            body=html,
            subtype=MessageType.html,
        )

        await self.fastmail.send_message(message)

    async def send_reset_password_email(self, email: str, token: str):
        reset_url = f"{FRONTEND_URL.rstrip('/')}/auth/reset-password-confirm?token={token}"

        html = f"""
        <html>
            <body>
                <p>Looks like you have requested to reset your password</p>
                <p>Please click the link below to reset your password:</p>
                <a href="{reset_url}">{reset_url}</a>
                <p>If you did not request a password reset, please ignore this email</p>
            </body>
        </html>
        """

        message = MessageSchema(
            subject="Password Reset",
            recipients=[email],
            body=html,
            subtype=MessageType.html,
        )

        await self.fastmail.send_message(message)


class AuthService:
    def __init__(self, repo: UserRepository, mail_service: MailService):
        self.repo = repo
        self.mail_service = mail_service

    def hash_password(self, password: str):
        return PWD_CONTEXT.hash(password)

    def verify_password(self, plain_password, hashed_password):
        return PWD_CONTEXT.verify(plain_password, hashed_password)

    def create_token(self, data: dict, expires_delta: timedelta, token_type: str = "access"):
        to_encode = data.copy()
        expire = datetime.now(timezone.utc) + expires_delta
        to_encode.update({"exp": expire, "type": token_type})
        return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

    def build_token_payload(self, user, role: str) -> dict:
        return {
            "sub": user.username,
            "role": role,
            "tv": user.token_version,
        }

    def get_effective_role(self, user) -> str:
        # ADMIN_EMAILS count as admin even if users.role is still user.
        if user.role in {"admin", "super_admin"}:
            return "admin"
        if user.email.lower() in ADMIN_EMAILS:
            return "admin"
        return "user"

    def user_to_out(self, user) -> dict:
        return {
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "is_active": user.is_active,
            "role": self.get_effective_role(user),
        }

    async def register_new_user(self, user_in: UserCreate, background_tasks: BackgroundTasks):
        if await self.repo.get_user_by_email(user_in.email):
            raise HTTPException(status_code=400, detail="Email already registered")

        if await self.repo.get_user_by_username(user_in.username):
            raise HTTPException(status_code=400, detail="Username already taken")

        hashed_pwd = self.hash_password(user_in.password)
        user_data = {
            "username": user_in.username,
            "email": user_in.email,
            "hashed_password": hashed_pwd,
        }
        user = await self.repo.create_user(user_data)

        verify_token = self.create_token({"sub": user.email}, timedelta(hours=24), "verify")
        background_tasks.add_task(self.mail_service.send_verification_email, user.email, verify_token)

        return self.user_to_out(user)

    async def authenticate_user(self, login: str, password: str):
        user = await self.repo.get_user_by_username(login)
        if not user:
            user = await self.repo.get_user_by_email(login)
        if not user or not self.verify_password(password, user.hashed_password):
            return None
        await self.ensure_user_not_blocked(user.id)
        return user

    async def verify_email_token(self, token: str):
        try:
            payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
            email: str = payload.get("sub")
            t_type: str = payload.get("type")
            if email is None or t_type != "verify":
                raise ValueError()
        except (JWTError, ValueError):
            raise HTTPException(status_code=400, detail="Invalid or expired verification token")

        user = await self.repo.get_user_by_email(email)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        await self.repo.activate_user(user)
        return {"message": "Account activated"}

    async def logout(self, refresh_token: str, access_token: str):
        await self.blacklist_token(refresh_token)
        await self.blacklist_token(access_token)
        await self.delete_active_session(refresh_token)

    async def refresh_tokens(self, refresh_token: str):
        if await self.repo.is_token_blacklisted(refresh_token):
            raise HTTPException(status_code=401, detail="Token blacklisted")

        try:
            payload = jwt.decode(refresh_token, SECRET_KEY, algorithms=[ALGORITHM])
        except JWTError:
            raise HTTPException(status_code=401, detail="Invalid or expired refresh token")

        if payload.get("type") != "refresh":
            raise HTTPException(status_code=401, detail="Invalid refresh token")

        username = payload.get("sub")
        if not username:
            raise HTTPException(status_code=401, detail="Invalid refresh token")

        user = await self.repo.get_user_by_username(username)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        if payload.get("tv") != user.token_version:
            raise HTTPException(status_code=401, detail="Token revoked")

        await self.ensure_user_not_blocked(user.id)

        role = self.get_effective_role(user)
        token_payload = self.build_token_payload(user, role)

        access_token = self.create_token(
            token_payload,
            timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES),
            "access",
        )
        new_refresh_token = self.create_token(
            token_payload,
            timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS),
            "refresh",
        )

        await self.blacklist_token(refresh_token)
        await self.delete_active_session(refresh_token)
        await self.register_active_session(new_refresh_token, user.id)

        return {
            "access_token": access_token,
            "refresh_token": new_refresh_token,
            "token_type": "bearer",
        }

    async def blacklist_token(self, token: str):
        expires_at = self._token_expires_at(token)
        if expires_at is None or expires_at <= datetime.utcnow():
            return
        if not await self.repo.is_token_blacklisted(token):
            await self.repo.add_token_to_blacklist(token, expires_at)

    def _token_expires_at(self, token: str) -> datetime | None:
        try:
            payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
            exp = payload.get("exp")
            if exp is None:
                return None
            return datetime.utcfromtimestamp(exp)
        except JWTError:
            return None

    async def get_current_user(self, token: str):
        if await self.repo.is_token_blacklisted(token):
            raise HTTPException(status_code=401, detail="Token blacklisted")

        try:
            payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
            if payload.get("type") != "access":
                raise HTTPException(status_code=401, detail="Invalid access token")
            username: str = payload.get("sub")
            if username is None:
                raise HTTPException(status_code=401, detail="Invalid token")
        except JWTError:
            raise HTTPException(status_code=401, detail="Could not validate credentials")

        user = await self.repo.get_user_by_username(username)
        if user is None:
            raise HTTPException(status_code=404, detail="User not found")

        if payload.get("tv") != user.token_version:
            raise HTTPException(status_code=401, detail="Token revoked")

        await self.ensure_user_not_blocked(user.id)

        return user

    async def ensure_user_not_blocked(self, user_id: int):
        if await self.repo.is_user_blocked(user_id):
            raise HTTPException(status_code=403, detail="User account is blocked")

    async def request_password_reset(self, email: str, background_tasks: BackgroundTasks):
        # Route always returns success. Send mail only if the address exists.
        user = await self.repo.get_user_by_email(email)
        if user:
            reset_token = self.create_token({"sub": user.email}, timedelta(hours=1), "reset")
            background_tasks.add_task(
                self.mail_service.send_reset_password_email,
                user.email,
                reset_token,
            )

    async def reset_password_confirm(self, token: str, new_password: str):
        try:
            payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
            email: str = payload.get("sub")
            t_type: str = payload.get("type")
            if email is None or t_type != "reset":
                raise ValueError()
        except (JWTError, ValueError):
            raise HTTPException(status_code=400, detail="Invalid or expired reset token")

        user = await self.repo.get_user_by_email(email)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        hashed_pwd = self.hash_password(new_password)
        await self.repo.update_user_password(user, hashed_pwd)
        # Bump tv so existing access/refresh tokens stop working.
        await self.repo.increment_token_version(user.id)
        return {"message": "Password reset successful"}

    async def delete_account(self, access_token: str, password: str):
        user = await self.get_current_user(access_token)
        if not self.verify_password(password, user.hashed_password):
            raise HTTPException(status_code=400, detail="Incorrect password")
        await self.blacklist_token(access_token)
        await self.repo.delete_user(user)
        return {"message": "Account deleted"}

    async def register_active_session(self, refresh_token: str, user_id: int):
        if not REDIS_URL:
            return

        payload = jwt.decode(refresh_token, SECRET_KEY, algorithms=[ALGORITHM])
        expires_at = payload.get("exp")
        if expires_at is None:
            return

        ttl = int(expires_at - datetime.now(timezone.utc).timestamp())
        if ttl <= 0:
            return

        client = await get_redis()
        if client is None:
            return

        try:
            await client.setex(
                self._session_key(refresh_token),
                ttl,
                json.dumps({"user_id": user_id}),
            )
            await client.incr(REDIS_SESSION_COUNT_KEY)
        except Exception as exc:
            print(f"Redis session write failed: {exc}")

    async def delete_active_session(self, refresh_token: str):
        if not REDIS_URL:
            return

        client = await get_redis()
        if client is None:
            return

        try:
            deleted = await client.delete(self._session_key(refresh_token))
            if deleted:
                count = await client.decr(REDIS_SESSION_COUNT_KEY)
                if count is not None and count < 0:
                    await client.set(REDIS_SESSION_COUNT_KEY, 0)
        except Exception as exc:
            print(f"Redis session delete failed: {exc}")

    def _session_key(self, token: str) -> str:
        token_hash = hashlib.sha256(token.encode("utf-8")).hexdigest()
        return f"{REDIS_ACTIVE_SESSION_KEY_PREFIX}:{token_hash}"
