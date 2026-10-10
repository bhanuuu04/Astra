from pydantic import BaseModel


class OverviewResponse(BaseModel):
    brands: int
    sightings: int
    active_campaigns: int
    high_risk_campaigns: int
    environment: str
