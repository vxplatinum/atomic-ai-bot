import re

_URL_RE = re.compile(r"(rediss?://\S+)", re.IGNORECASE)
_VALID_SCHEMES = ("redis://", "rediss://", "unix://")


def normalize_redis_url(raw: str | None) -> str | None:
    # Accept a DSN or a pasted `redis-cli --tls -u redis://...` command.
    text = (raw or "").strip().strip("'\"")
    if not text:
        return None

    match = _URL_RE.search(text)
    url = (match.group(1) if match else text).strip().strip("'\"")
    if " " in url:
        url = url.split()[0]

    lower = url.lower()
    if not lower.startswith(_VALID_SCHEMES):
        return None

    wants_tls = "--tls" in text.lower() or "upstash.io" in lower
    if wants_tls and lower.startswith("redis://"):
        url = "rediss://" + url[len("redis://") :]
    return url
