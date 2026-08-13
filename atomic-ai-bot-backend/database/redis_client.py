from config.config import REDIS_URL
from database.redis_url import normalize_redis_url

# Optional. Auth works without Redis; admin active_sessions is then 0.
_redis_client = None


async def get_redis():
    global _redis_client
    url = normalize_redis_url(REDIS_URL)
    if not url:
        return None

    if _redis_client is None:
        try:
            import redis.asyncio as redis

            client = redis.from_url(url, decode_responses=True)
            await client.ping()
            _redis_client = client
        except Exception as exc:
            print(f"Redis connect failed: {exc}")
            return None

    return _redis_client


async def close_redis():
    global _redis_client
    if _redis_client is not None:
        await _redis_client.aclose()
        _redis_client = None
