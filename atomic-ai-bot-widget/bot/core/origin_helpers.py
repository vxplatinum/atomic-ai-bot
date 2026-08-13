from urllib.parse import urlparse, urlunparse


def canonicalize_loopback_origin(origin: str) -> str:
    # localhost -> 127.0.0.1 so Origin/Referer match the main backend domain check.
    o = (origin or "").strip()
    if not o:
        return o
    p = urlparse(o)
    if p.scheme not in ("http", "https") or not p.hostname:
        return o
    if p.hostname.lower() != "localhost":
        return o
    netloc = "127.0.0.1" if not p.port else f"127.0.0.1:{p.port}"
    return urlunparse((p.scheme, netloc, "", "", "", ""))


def referer_to_origin(referer: str) -> str:
    r = (referer or "").strip()
    if not r:
        return ""
    p = urlparse(r)
    if not p.scheme or not p.netloc:
        return ""
    origin = urlunparse((p.scheme, p.netloc, "", "", "", ""))
    return canonicalize_loopback_origin(origin)
