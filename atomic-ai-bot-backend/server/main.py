from fastapi import FastAPI
from contextlib import asynccontextmanager

from database.database import create_tables, engine
from database.redis_client import close_redis

from routes.admin_endpoints import router as admin_router
from routes.auth_endpoints import router as auth_router
from routes.app_endpoints import router as app_router

from middlewares.cors_middleware import add_cors_middleware
from middlewares.public_cors_middleware import add_public_cors_middleware


@asynccontextmanager
async def lifespan(app: FastAPI):
    await create_tables()
    yield
    await close_redis()
    await engine.dispose()


app = FastAPI(title="Atomic-AI-Bot-Backend", version="1.0.0", lifespan=lifespan)

add_cors_middleware(app)
add_public_cors_middleware(app)

app.include_router(auth_router)
app.include_router(app_router)
app.include_router(admin_router)


@app.get("/")
async def root():
    return {"status": "Server is running"}


@app.get("/health")
async def health_check():
    return {"status": "OK"}
