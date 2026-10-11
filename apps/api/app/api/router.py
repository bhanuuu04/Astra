from fastapi import APIRouter

from app.api.routes import (
    analysis,
    brands,
    campaigns,
    demo,
    health,
    integrations,
    overview,
    responses,
    sightings,
)

api_router = APIRouter()
api_router.include_router(health.router)
api_router.include_router(overview.router)
api_router.include_router(brands.router)
api_router.include_router(sightings.router)
api_router.include_router(analysis.router)
api_router.include_router(campaigns.router)
api_router.include_router(responses.router)
api_router.include_router(integrations.router)
api_router.include_router(demo.router)
