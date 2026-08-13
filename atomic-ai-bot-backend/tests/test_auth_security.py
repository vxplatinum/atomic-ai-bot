import os
from datetime import timedelta
from unittest.mock import AsyncMock, MagicMock

import pytest
from fastapi import HTTPException

os.environ.setdefault("SECRET_KEY", "test-secret-key-for-unit-tests-only")
os.environ.setdefault("FRONTEND_URL", "http://localhost:5173")
os.environ.setdefault("POSTGRES_URL", "postgresql+asyncpg://user:pass@localhost/db")

from services.auth_services import AuthService, MailService
from utils.domain_utils import domains_match


class TestDomainValidation:
    def test_exact_domain_match(self):
        assert domains_match("example.com", "https://example.com") is True

    def test_subdomain_match(self):
        assert domains_match("example.com", "https://app.example.com") is True

    def test_wrong_domain_rejected(self):
        assert domains_match("example.com", "https://evil.com") is False

    def test_missing_origin_rejected(self):
        assert domains_match("example.com", "") is False


class TestTokenTypes:
    def setup_method(self):
        repo = AsyncMock()
        repo.is_token_blacklisted = AsyncMock(return_value=False)
        repo.is_user_blocked = AsyncMock(return_value=False)
        repo.get_user_by_username = AsyncMock(
            return_value=MagicMock(
                id=1,
                username="alice",
                email="alice@example.com",
                is_active=True,
                is_blocked=False,
                token_version=1,
                role="user",
            )
        )
        self.service = AuthService(repo, MailService())
        self.user = repo.get_user_by_username.return_value

    @pytest.mark.asyncio
    async def test_refresh_token_rejected_as_access(self):
        refresh = self.service.create_token(
            self.service.build_token_payload(self.user, "user"),
            timedelta(days=1),
            "refresh",
        )
        with pytest.raises(HTTPException) as exc:
            await self.service.get_current_user(refresh)
        assert exc.value.status_code == 401
        assert exc.value.detail == "Invalid access token"

    @pytest.mark.asyncio
    async def test_access_token_accepted(self):
        access = self.service.create_token(
            self.service.build_token_payload(self.user, "user"),
            timedelta(minutes=30),
            "access",
        )
        user = await self.service.get_current_user(access)
        assert user.username == "alice"

    @pytest.mark.asyncio
    async def test_stale_token_version_rejected(self):
        access = self.service.create_token(
            {"sub": "alice", "role": "user", "tv": 0},
            timedelta(minutes=30),
            "access",
        )
        with pytest.raises(HTTPException) as exc:
            await self.service.get_current_user(access)
        assert exc.value.status_code == 401
        assert exc.value.detail == "Token revoked"

    @pytest.mark.asyncio
    async def test_login_accepts_email_or_username(self):
        repo = AsyncMock()
        repo.get_user_by_username = AsyncMock(return_value=None)
        repo.get_user_by_email = AsyncMock(
            return_value=MagicMock(
                id=1,
                username="alice",
                hashed_password="hash",
                is_blocked=False,
            )
        )
        repo.is_user_blocked = AsyncMock(return_value=False)
        service = AuthService(repo, MailService())
        service.verify_password = MagicMock(return_value=True)

        user = await service.authenticate_user("alice@example.com", "secret")
        assert user.username == "alice"
        repo.get_user_by_email.assert_awaited_once_with("alice@example.com")


class TestNormalizeAsyncPostgresUrl:
    def test_neon_libpq_url(self):
        from database.postgres_url import normalize_async_postgres_url

        url, args = normalize_async_postgres_url(
            "postgresql://u:p@ep-x.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
        )
        assert url.startswith("postgresql+asyncpg://")
        assert "sslmode" not in url
        assert "channel_binding" not in url
        assert args == {"ssl": True}

    def test_localhost_stays_without_ssl(self):
        from database.postgres_url import normalize_async_postgres_url

        url, args = normalize_async_postgres_url("postgresql+asyncpg://user:pass@localhost/db")
        assert url == "postgresql+asyncpg://user:pass@localhost/db"
        assert args == {}

    def test_postgres_scheme(self):
        from database.postgres_url import normalize_async_postgres_url

        url, args = normalize_async_postgres_url("postgres://u:p@db.example.com:5432/app")
        assert url == "postgresql+asyncpg://u:p@db.example.com:5432/app"
        assert args == {"ssl": True}


class TestNormalizeRedisUrl:
    def test_cli_tls_paste(self):
        from database.redis_url import normalize_redis_url

        url = normalize_redis_url(
            "redis-cli --tls -u redis://default:secret@host.upstash.io:6379"
        )
        assert url == "rediss://default:secret@host.upstash.io:6379"

    def test_plain_dsn(self):
        from database.redis_url import normalize_redis_url

        assert normalize_redis_url("redis://localhost:6379/0") == "redis://localhost:6379/0"

    def test_invalid(self):
        from database.redis_url import normalize_redis_url

        assert normalize_redis_url("not-a-url") is None
