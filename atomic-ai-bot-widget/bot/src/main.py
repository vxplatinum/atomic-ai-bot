from fastapi import FastAPI, HTTPException, Request
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates
from openai import AsyncOpenAI
import redis.asyncio as redis
import json
import httpx
from urllib.parse import quote, urlparse
import re

from bot.src.models import AIRequest, ClearChatRequest
from bot.core.config import (
    BOT_URL as ENV_BOT_URL,
    MODEL_NAME,
    OPENROUTER_API_KEY,
    REDIS_URL,
    STATIC_DIR,
    VALIDATE_ENDPOINT,
    chat_history_key,
    strip_trailing_slash,
)
from bot.core.origin_helpers import canonicalize_loopback_origin, referer_to_origin

# Hex only — injected into CSS, so reject anything else from validate.
_THEME_HEX = re.compile(r"^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$")


def theme_accent_from_bot_payload(bot_payload: dict | None) -> str | None:
    if not isinstance(bot_payload, dict):
        return None
    settings = bot_payload.get("settings")
    if not isinstance(settings, dict):
        return None
    widget = settings.get("widget")
    if not isinstance(widget, dict):
        return None
    raw = widget.get("color")
    if not isinstance(raw, str):
        return None
    cand = raw.strip()
    return cand if cand and _THEME_HEX.fullmatch(cand) else None


def theme_text_from_bot_payload(bot_payload: dict | None) -> str | None:
    if not isinstance(bot_payload, dict):
        return None
    settings = bot_payload.get("settings")
    if not isinstance(settings, dict):
        return None
    widget = settings.get("widget")
    if not isinstance(widget, dict):
        return None
    raw = widget.get("text_color")
    if not isinstance(raw, str):
        return None
    cand = raw.strip()
    return cand if cand and _THEME_HEX.fullmatch(cand) else None


_WIDGET_TITLE_MAX_LEN = 120
_TITLE_CTRL_RE = re.compile(r"[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]")


def widget_header_title_from_payload(bot_payload: dict | None) -> str:
    default = "AI Assistant"
    if not isinstance(bot_payload, dict):
        return default
    settings = bot_payload.get("settings")
    if not isinstance(settings, dict):
        return default
    widget = settings.get("widget")
    if not isinstance(widget, dict):
        return default
    raw = widget.get("icon")
    if not isinstance(raw, str):
        return default
    t = raw.strip()
    if not t:
        return default
    t = _TITLE_CTRL_RE.sub("", t)
    t = t.replace("\n", " ").replace("\r", " ").strip()
    if not t:
        return default
    return t[:_WIDGET_TITLE_MAX_LEN]


def _bot_server_netloc(request: Request) -> str:
    if ENV_BOT_URL:
        nl = urlparse(ENV_BOT_URL).netloc
        if nl:
            return nl.lower()
    return urlparse(str(request.base_url)).netloc.lower()


def resolve_embedding_origin(request: Request, explicit_widget_origin: str | None) -> str:
    # Prefer Referer when it is the store, not this bot. In-iframe fetch Referer is the bot host — then send widget_origin.
    ref_origin = referer_to_origin(request.headers.get("referer") or "")
    bot_netloc = _bot_server_netloc(request)
    if ref_origin:
        rnet = urlparse(ref_origin).netloc.lower()
        if rnet and rnet != bot_netloc:
            return canonicalize_loopback_origin(ref_origin)

    ex = canonicalize_loopback_origin((explicit_widget_origin or "").strip())
    if ex:
        return ex

    return canonicalize_loopback_origin((request.headers.get("origin") or "").strip())


def _extract_assistant_text(message: object) -> str:
    # OpenRouter/OpenAI content may be a string, None, or a list of parts.
    if message is None:
        return ""
    content = getattr(message, "content", None)
    refusal = getattr(message, "refusal", None)

    if isinstance(refusal, str) and refusal.strip():
        return refusal.strip()

    if isinstance(content, str) and content.strip():
        return content

    if content is None or content == "":
        return ""

    if isinstance(content, list):
        parts: list[str] = []
        for part in content:
            if isinstance(part, dict):
                if part.get("type") == "text" and isinstance(part.get("text"), str):
                    parts.append(part["text"])
                elif isinstance(part.get("content"), str):
                    parts.append(part["content"])
            else:
                t = getattr(part, "text", None)
                if isinstance(t, str):
                    parts.append(t)
        return "".join(parts)

    return str(content)


async def fetch_bot_from_main_validate(api_key: str, embed_origin: str) -> dict | None:
    if not VALIDATE_ENDPOINT:
        return None

    hdrs: dict[str, str] = {}
    if embed_origin:
        hdrs["Origin"] = embed_origin
        hdrs["Referer"] = f"{embed_origin}/"

    try:
        async with httpx.AsyncClient() as client:
            r = await client.get(
                f"{VALIDATE_ENDPOINT}/{quote(str(api_key), safe='')}",
                headers=hdrs,
                timeout=5.0,
            )
    except Exception as e:
        print(f"Main validate HTTP error: {e}")
        return None

    if r.status_code != 200:
        print(f"Validate HTTP {r.status_code}: {r.text[:200]!r}")
        return None

    try:
        payload = r.json()
    except json.JSONDecodeError:
        print("Validate response is not JSON")
        return None

    # Main backend is authoritative after 200 + JSON. Do not re-check allowed_domain here.
    return payload


FORBIDDEN_PAGE = """<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Access denied</title>
  <style>
    body { font-family: system-ui, sans-serif; padding: 2rem; text-align: center; color: #444; background: #fff; }
    h1 { font-size: 1.25rem; }
    p { margin-top: 0.75rem; }
  </style>
</head>
<body>
  <h1>Embedding not allowed</h1>
  <p>This chat cannot load here (invalid api key or site is not permitted for this bot).</p>
</body>
</html>"""

BAD_REQUEST_PAGE = """<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Bad request</title>
</head>
<body style="font-family:sans-serif;padding:2rem;">
  <p>Missing <code>api_key</code> (or legacy <code>token</code>) in the chat URL.</p>
</body>
</html>"""


client = AsyncOpenAI(
    base_url="https://openrouter.ai/api/v1",
    api_key=OPENROUTER_API_KEY,
)

r = redis.from_url(
    REDIS_URL,
    decode_responses=True,
)


def _safe_history_from_redis(raw: str | bytes | None) -> list:
    if not raw:
        return []
    try:
        data = json.loads(raw)
        if isinstance(data, list):
            return data
        print(f"Redis history payload is not a list: type={type(data)}")
        return []
    except (json.JSONDecodeError, TypeError) as ex:
        print(f"Redis history JSON invalid: {ex!r}")
        return []


def _ensure_openrouter_config_or_warn() -> None:
    if not OPENROUTER_API_KEY:
        print("WARNING: OPENROUTER_API_KEY is not set — /ai-answer will fail.")
    if not MODEL_NAME:
        print("WARNING: MODEL_NAME is not set — OpenRouter may reject requests.")

app = FastAPI(title="Atomic-AI-Bot-ChatBot", version="1.0.0")


@app.on_event("startup")
async def _startup_checks() -> None:
    _ensure_openrouter_config_or_warn()

app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")
templates = Jinja2Templates(directory=STATIC_DIR / "templates")


@app.get("/chat", response_class=HTMLResponse)
async def chat_page(request: Request):
    qp = request.query_params
    api_key = qp.get("api_key") or qp.get("token")
    if not api_key:
        return HTMLResponse(content=BAD_REQUEST_PAGE, status_code=400)

    parent_q = (qp.get("parent_origin") or "").strip()

    embed_origin = resolve_embedding_origin(request, parent_q if parent_q else None)
    if not embed_origin:
        return HTMLResponse(content=FORBIDDEN_PAGE, status_code=403)

    bot_payload = await fetch_bot_from_main_validate(api_key, embed_origin)
    if bot_payload is None:
        return HTMLResponse(content=FORBIDDEN_PAGE, status_code=403)

    bot_pub = strip_trailing_slash(ENV_BOT_URL) if ENV_BOT_URL else ""
    theme_accent = theme_accent_from_bot_payload(bot_payload)
    theme_text = theme_text_from_bot_payload(bot_payload)
    header_title = widget_header_title_from_payload(bot_payload)
    return templates.TemplateResponse(
        request=request,
        name="chat.html",
        context={
            "bot_url": bot_pub or None,
            "chat_theme_accent": theme_accent,
            "chat_theme_text": theme_text,
            "chat_header_title": header_title,
        },
    )


@app.post("/ai-answer")
async def ai_answer(data: AIRequest, request: Request):
    message = data.message
    session_id = data.session_id
    api_token = data.api_token

    embed_origin = resolve_embedding_origin(request, data.widget_origin)
    if not embed_origin:
        raise HTTPException(
            status_code=403,
            detail="Embedding origin is required and could not be determined.",
        )

    bot_payload = await fetch_bot_from_main_validate(api_token, embed_origin)
    if bot_payload is None:
        raise HTTPException(status_code=403, detail="Invalid api key or site not allowed.")

    settings = bot_payload.get("settings") or {}
    system_prompt = settings.get("system_prompt")
    if not system_prompt:
        system_prompt = "You are a helpful assistant."

    history_json = await r.get(chat_history_key(session_id))
    raw_history = _safe_history_from_redis(history_json)

    clean_history = [
        msg
        for msg in raw_history
        if msg.get("content") is not None and isinstance(msg.get("content"), str)
    ]

    clean_history.append({"role": "user", "content": message})
    clean_history = clean_history[-10:]

    messages_payload = [{"role": "system", "content": system_prompt}] + clean_history

    try:
        completion = await client.chat.completions.create(
            model=MODEL_NAME,
            messages=messages_payload,
            temperature=0.7,
            max_tokens=1500,
        )

        if not completion.choices:
            answer = "Sorry, something went wrong while generating the reply."
        else:
            answer = _extract_assistant_text(completion.choices[0].message)
            if not answer or not answer.strip():
                answer = "Sorry, something went wrong while generating the reply."

        clean_history.append({"role": "assistant", "content": answer})
        await r.set(chat_history_key(session_id), json.dumps(clean_history), ex=3600)

        return {"answer": answer}

    except Exception as e:
        print(f"OpenAI Error: {e}")
        # User turn was not written; Redis stays at the previous history.
        return {"answer": "The AI service is temporarily unavailable. Please try again later."}


@app.get("/history")
async def history(session_id: str, request: Request):
    qp = request.query_params
    api_key = qp.get("api_key") or qp.get("token")
    if not api_key:
        raise HTTPException(status_code=403, detail="Missing api_key.")

    w_origin = (qp.get("widget_origin") or "").strip()

    embed_origin = resolve_embedding_origin(request, w_origin if w_origin else None)
    if not embed_origin:
        raise HTTPException(status_code=403, detail="Missing embedding origin.")

    if await fetch_bot_from_main_validate(api_key, embed_origin) is None:
        raise HTTPException(status_code=403, detail="Invalid api key or site not allowed.")

    history_json = await r.get(chat_history_key(session_id))

    hist = _safe_history_from_redis(history_json)
    return {"history": hist}


@app.post("/history/clear")
async def clear_chat_history(body: ClearChatRequest, request: Request):
    embed_origin = resolve_embedding_origin(request, body.widget_origin)
    if not embed_origin:
        raise HTTPException(
            status_code=403,
            detail="Embedding origin is required and could not be determined.",
        )

    if await fetch_bot_from_main_validate(body.api_token, embed_origin) is None:
        raise HTTPException(status_code=403, detail="Invalid api key or site not allowed.")

    await r.delete(chat_history_key(body.session_id))
    return {"ok": True}
