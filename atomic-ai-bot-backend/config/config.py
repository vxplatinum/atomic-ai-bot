from dotenv import load_dotenv
from pathlib import Path
from fastapi_mail import ConnectionConfig
import os

load_dotenv()

BASE_DIR = Path(__file__).resolve().parent.parent

POSTGRES_URL = os.getenv("POSTGRES_URL")
DB_POOL_SIZE = int(os.getenv("DB_POOL_SIZE", 2))
DB_MAX_OVERFLOW = int(os.getenv("DB_MAX_OVERFLOW", 1))
DB_POOL_RECYCLE = int(os.getenv("DB_POOL_RECYCLE", 1800))
DB_ECHO = os.getenv("DB_ECHO", "false").lower() == "true"

SECRET_KEY = os.getenv("SECRET_KEY")
if not SECRET_KEY:
    raise RuntimeError("SECRET_KEY is required. Add it to your .env file.")

ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 30))
REFRESH_TOKEN_EXPIRE_DAYS = int(os.getenv("REFRESH_TOKEN_EXPIRE_DAYS", 7))

FRONTEND_URL = os.getenv("FRONTEND_URL")
if not FRONTEND_URL:
    raise RuntimeError("FRONTEND_URL is required. Add it to your .env file.")

ADMIN_EMAILS = [
    email.strip().lower()
    for email in os.getenv("ADMIN_EMAILS", "").split(",")
    if email.strip()
]

REDIS_URL = os.getenv("REDIS_URL")
REDIS_ACTIVE_SESSION_KEY_PREFIX = os.getenv("REDIS_ACTIVE_SESSION_KEY_PREFIX", "session")
REDIS_SESSION_COUNT_KEY = f"{REDIS_ACTIVE_SESSION_KEY_PREFIX}:active_count"

CORS_ORIGINS = [
    origin.strip().rstrip("/")
    for origin in os.getenv("CORS_ORIGINS", "").split(",")
    if origin.strip()
]

MAIL_CONFIG = ConnectionConfig(
    MAIL_USERNAME=os.getenv("MAIL_USERNAME"),
    MAIL_PASSWORD=os.getenv("MAIL_PASSWORD"),
    MAIL_FROM=os.getenv("MAIL_FROM"),
    MAIL_PORT=int(os.getenv("MAIL_PORT", 587)),
    MAIL_SERVER=os.getenv("MAIL_SERVER"),
    MAIL_STARTTLS=(os.getenv("MAIL_STARTTLS", "True") == "True"),
    MAIL_SSL_TLS=(os.getenv("MAIL_SSL_TLS", "False") == "True"),
    USE_CREDENTIALS=True,
)
