from urllib.parse import parse_qsl, urlencode, urlparse, urlunparse

# libpq/psycopg2 query keys. asyncpg does not accept them; SSL is connect_args["ssl"].
_LIBPQ_QUERY_KEYS = frozenset(
    {
        "sslmode",
        "channel_binding",
        "gssencmode",
        "sslcert",
        "sslkey",
        "sslrootcert",
        "sslcrl",
        "sslpassword",
        "requiressl",
        "sslcompression",
    }
)
_SSL_REQUIRE_VALUES = frozenset({"require", "verify-ca", "verify-full"})
_LOCAL_HOSTS = frozenset({"localhost", "127.0.0.1", "::1"})
_POSTGRES_SCHEMES = frozenset(
    {"postgres", "postgresql", "postgresql+asyncpg", "postgres+asyncpg"}
)


def normalize_async_postgres_url(url: str) -> tuple[str, dict]:
    # Hosts paste postgresql:// from Neon/Railway. This app is async SQLAlchemy + asyncpg.
    raw = (url or "").strip()
    if not raw:
        return "", {}

    parsed = urlparse(raw)
    scheme = (parsed.scheme or "").lower()
    if scheme not in _POSTGRES_SCHEMES:
        raise ValueError(
            f"POSTGRES_URL must be a PostgreSQL URL, got scheme {parsed.scheme!r}."
        )

    host = (parsed.hostname or "").lower()
    is_local = host in _LOCAL_HOSTS

    ssl_from_query = False
    kept: list[tuple[str, str]] = []
    for key, value in parse_qsl(parsed.query, keep_blank_values=True):
        lk = key.lower()
        if lk in _LIBPQ_QUERY_KEYS:
            if lk == "sslmode" and value.lower() in _SSL_REQUIRE_VALUES:
                ssl_from_query = True
            if lk == "requiressl" and value.lower() in {"1", "true"}:
                ssl_from_query = True
            continue
        kept.append((key, value))

    connect_args: dict = {}
    if ssl_from_query or not is_local:
        connect_args["ssl"] = True

    normalized = urlunparse(
        parsed._replace(scheme="postgresql+asyncpg", query=urlencode(kept))
    )
    return normalized, connect_args
