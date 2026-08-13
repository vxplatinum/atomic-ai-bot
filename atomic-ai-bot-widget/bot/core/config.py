from dotenv import load_dotenv
import os
from pathlib import Path


def strip_trailing_slash(url: str | None) -> str:
    # Avoid // when joining base URL + path.
    return (url or "").strip().rstrip("/")


load_dotenv()

OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")
REDIS_URL = os.getenv("REDIS_URL")
REDIS_CHAT_HISTORY_KEY_PREFIX = (
    os.getenv("REDIS_CHAT_HISTORY_KEY_PREFIX", "chat").strip().rstrip(":")
)
SERVER_URL = strip_trailing_slash(os.getenv("SERVER_URL"))
BOT_URL = strip_trailing_slash(os.getenv("BOT_URL"))
MODEL_NAME = os.getenv("MODEL_NAME")
# GET {SERVER_URL}/{VALIDATE_PATH}/{api_key}
VALIDATE_PATH = os.getenv("BACKEND_VALIDATE_PATH", "/app/public/validate").strip("/")
VALIDATE_ENDPOINT = f"{SERVER_URL}/{VALIDATE_PATH}" if SERVER_URL else ""

ROOT_DIR = Path(__file__).parent.parent.parent
STATIC_DIR = ROOT_DIR / "bot/static"


def chat_history_key(session_id: str) -> str:
    return f"{REDIS_CHAT_HISTORY_KEY_PREFIX}:{session_id}"
