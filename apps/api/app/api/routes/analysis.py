from datetime import datetime, timezone
from typing import List, Optional
import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.security import TenantContext, get_current_tenant_context, require_write_permission
from app.db.models import (
    AnalysisRun,
    Brand,
    BrandAsset,
    Sighting,
    Signal,
)
from app.db.session import get_session
from app.domain.brand_service import get_brand
from app.domain.detector_service import DETECTOR_VERSION, run_detectors_on_sighting
from app.domain.linking_service import compute_campaign_edges_and_clusters
from app.domain.scoring_service import calculate_sighting_risk_score
from app.schemas.analysis import (
    AnalysisJobRequest,
    AnalysisJobResponse,
    SignalResponse,
)

router = APIRouter(prefix="/api/v1/analysis-jobs", tags=["analysis"])


@router.post("", response_model=AnalysisJobResponse, status_code=status.HTTP_201_CREATED)
def handle_run_analysis_job(
    request: AnalysisJobRequest,
    session: Session = Depends(get_session),
    context: TenantContext = Depends(require_write_permission),
) -> AnalysisJobResponse:
    # 1. Resolve Tenant and Brand from server context
    tenant_id = context.tenant_id

    brand_id = request.brand_id
    if not brand_id:
        brand = session.scalar(
            select(Brand).where(Brand.tenant_id == tenant_id).order_by(Brand.created_at.asc())
        )
        if not brand:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No brand enrolled yet")
        brand_id = brand.id
    else:
        brand = session.scalar(select(Brand).where(Brand.id == brand_id, Brand.tenant_id == tenant_id))
        if not brand:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Brand {brand_id} not found")

    # 2. Create AnalysisRun record
    run_id = uuid.uuid4()
    run = AnalysisRun(
        id=run_id,
        tenant_id=tenant_id,
        brand_id=brand_id,
        status="running",
        detector_versions={"suite_version": DETECTOR_VERSION},
        thresholds={"impersonation": 0.65, "phishing": 0.50, "rogue_app": 0.60},
        formula_snapshot="risk = 100 * (0.35*id + 0.30*harm + 0.20*exp + 0.15*fresh)",
    )
    session.add(run)
    session.flush()

    # 3. Retrieve Brand DNA assets
    brand_assets = list(session.scalars(
        select(BrandAsset).where(BrandAsset.brand_id == brand_id)
    ).all())

    # 4. Fetch target sightings
    stmt = select(Sighting).where(
        Sighting.tenant_id == tenant_id,
        Sighting.brand_id == brand_id,
    )
    if request.sighting_ids:
        stmt = stmt.where(Sighting.id.in_(request.sighting_ids))
    sightings = list(session.scalars(stmt).all())

    # 5. Run detectors & generate versioned Signals
    signals_count = 0
    for sighting in sightings:
        detected_signals = run_detectors_on_sighting(sighting, brand, brand_assets)

        for sig in detected_signals:
            sig_record = Signal(
                id=uuid.uuid4(),
                sighting_id=sighting.id,
                run_id=run_id,
                detector_key=sig["detector_key"],
                detector_version=sig["detector_version"],
                score=sig["score"],
                threshold=sig["threshold"],
                explanation=sig["explanation"],
                evidence_ids=sig.get("evidence_ids"),
                feature_values=sig.get("feature_values"),
            )
            session.add(sig_record)
            signals_count += 1

        # Calculate composite score for sighting
        score_val, features = calculate_sighting_risk_score(
            detected_signals,
            observed_at=sighting.observed_at,
        )
        if sighting.normalized_payload:
            payload = dict(sighting.normalized_payload)
            payload["computed_risk_score"] = score_val
            payload["feature_breakdown"] = features
            sighting.normalized_payload = payload

    session.flush()

    # 6. Execute Campaign Linker
    edges_count, camps_count = compute_campaign_edges_and_clusters(session, tenant_id, brand_id)

    # 7. Complete AnalysisRun
    now_time = datetime.now(timezone.utc)
    run.status = "completed"
    run.completed_at = now_time
    session.commit()

    return AnalysisJobResponse(
        run_id=run_id,
        status="completed",
        brand_id=brand_id,
        sightings_processed=len(sightings),
        signals_generated=signals_count,
        edges_proposed=edges_count,
        campaigns_updated=camps_count,
        created_at=run.created_at,
        completed_at=now_time,
    )


@router.get("/{run_id}/signals", response_model=List[SignalResponse])
def handle_get_run_signals(
    run_id: uuid.UUID,
    session: Session = Depends(get_session),
    context: TenantContext = Depends(get_current_tenant_context),
) -> List[SignalResponse]:
    run = session.scalar(
        select(AnalysisRun).where(AnalysisRun.id == run_id, AnalysisRun.tenant_id == context.tenant_id)
    )
    if not run:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Analysis run not found")
    signals = list(session.scalars(select(Signal).where(Signal.run_id == run_id)).all())
    return [SignalResponse.model_validate(s) for s in signals]
