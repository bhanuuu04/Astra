from typing import Any, Dict, List
import uuid

from pydantic import BaseModel


class DemoResetResponse(BaseModel):
    success: bool
    message: str
    tenant_id: uuid.UUID
    brand_id: uuid.UUID
    brand_name: str
    assets_seeded: int
    sightings_seeded: int
    indicators_seeded: int
    evidence_seeded: int
    rogue_apps_seeded: int
