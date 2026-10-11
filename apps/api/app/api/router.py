from fastapi import APIRouter

from app.api.routes import (
    analysis,
    brands,
    campaigns,
    connectors,
    demo,
    findings,
    health,
    integrations,
    mobile_apps,
    overview,
    response_cases,
    responses,
    sightings,
)

api_router = APIRouter()
api_router.include_router(health.router)
api_router.include_router(overview.router)
api_router.include_router(brands.router)
api_router.include_router(sightings.router)
api_router.include_router(findings.router)  # New DRP findings API
api_router.include_router(mobile_apps.router)  # Mobile App Radar API
api_router.include_router(response_cases.router)  # DRP Response/Takedown API
api_router.include_router(connectors.router)  # Connector management API
api_router.include_router(analysis.router)
api_router.include_router(campaigns.router)
api_router.include_router(responses.router)  # Legacy responses
api_router.include_router(integrations.router)
api_router.include_router(demo.router)
