from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.router import api_router
from app.core.config import get_settings
from app.core.logging import setup_enterprise_logging
from app.integrations.sentry import init_sentry

settings = get_settings()
settings.validate_runtime_security()
setup_enterprise_logging()
init_sentry()
app = FastAPI(title=settings.app_name, version="0.1.0", description="ASTRA Digital Risk Protection API")
# Clean exact origins (remove wildcard patterns from literal origins list)
clean_origins = [orig for orig in settings.allowed_origins if "*" not in orig]

app.add_middleware(
    CORSMiddleware,
    allow_origins=clean_origins or ["http://localhost:3000", "http://localhost:3001"],
    allow_origin_regex=None,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "X-Request-ID"],
)


@app.middleware("http")
async def add_security_headers(request, call_next):
    response = await call_next(request)
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    return response


app.include_router(api_router)
