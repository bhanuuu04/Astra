from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.security import TenantContext, require_admin
from app.db.session import get_session
from app.domain.demo_service import reset_demo_environment
from app.schemas.demo import DemoResetResponse

router = APIRouter(prefix="/api/v1/demo", tags=["demo"])


@router.post("/reset", response_model=DemoResetResponse, status_code=status.HTTP_200_OK)
def handle_demo_reset(
    session: Session = Depends(get_session),
    admin: TenantContext = Depends(require_admin),
) -> DemoResetResponse:
    settings = get_settings()
    if settings.app_env.lower() in ("production", "prod"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Demo environment reset is permanently disabled in production environments.",
        )

    if not settings.allow_demo_reset:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Demo environment reset is disabled. Set ALLOW_DEMO_RESET=true in non-production configuration to enable.",
        )

    return reset_demo_environment(session)
