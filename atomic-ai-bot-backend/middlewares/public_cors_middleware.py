from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response

# Widget may run on any store origin. Reflect Origin for /app/public only.
PUBLIC_API_PREFIX = "/app/public"


class PublicCORSMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        if not request.url.path.startswith(PUBLIC_API_PREFIX):
            return await call_next(request)

        origin = request.headers.get("origin")

        if request.method == "OPTIONS":
            response = Response(status_code=204)
            if origin:
                response.headers["Access-Control-Allow-Origin"] = origin
                response.headers["Access-Control-Allow-Methods"] = "GET, OPTIONS"
                response.headers["Access-Control-Allow-Headers"] = "*"
                response.headers["Access-Control-Max-Age"] = "86400"
            return response

        response = await call_next(request)
        if origin:
            response.headers["Access-Control-Allow-Origin"] = origin
            response.headers["Vary"] = "Origin"
        return response


def add_public_cors_middleware(app):
    app.add_middleware(PublicCORSMiddleware)
