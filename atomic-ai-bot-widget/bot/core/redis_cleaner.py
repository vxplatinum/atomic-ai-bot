import asyncio
import redis.asyncio as redis

from bot.core.config import REDIS_CHAT_HISTORY_KEY_PREFIX, REDIS_URL, chat_history_key


async def clear_redis():
    # Delete only this service's history keys. Do not FLUSHALL — backend sessions share Redis.
    r = redis.from_url(REDIS_URL)
    pattern = chat_history_key("*")
    deleted = 0
    async for key in r.scan_iter(match=pattern):
        await r.delete(key)
        deleted += 1
    await r.aclose()
    print(f"Deleted {deleted} keys matching {REDIS_CHAT_HISTORY_KEY_PREFIX}:*")


asyncio.run(clear_redis())
