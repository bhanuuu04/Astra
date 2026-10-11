from collections import defaultdict
from datetime import datetime, timezone
from typing import Dict, List, Set, Tuple
import uuid

from sqlalchemy import delete, select
from sqlalchemy.orm import Session

from app.db.models import (
    Campaign,
    CampaignEdgeLegacy as CampaignEdge,
    CampaignMember,
    Indicator,
    Sighting,
    SightingIndicator,
)


def compute_campaign_edges_and_clusters(
    session: Session,
    tenant_id: uuid.UUID,
    brand_id: uuid.UUID,
) -> Tuple[int, int]:
    """
    Campaign Linker Engine:
    Finds sightings that share extracted indicator pivots, generates candidate
    CampaignEdge connections, and groups related sightings into campaigns.
    Returns (edges_proposed_count, campaigns_updated_count).
    """
    # 1. Fetch sightings and their indicators for this brand
    sightings = list(session.scalars(
        select(Sighting).where(
            Sighting.tenant_id == tenant_id,
            Sighting.brand_id == brand_id,
        )
    ).all())

    if not sightings:
        return 0, 0

    sighting_map = {s.id: s for s in sightings}

    # Query all sighting_indicators with indicator details
    stmt = (
        select(SightingIndicator, Indicator)
        .join(Indicator, SightingIndicator.indicator_id == Indicator.id)
        .where(Indicator.tenant_id == tenant_id)
    )
    rows = session.execute(stmt).all()

    # Map indicator -> list of sighting_ids
    indicator_sightings: Dict[Tuple[str, str], List[uuid.UUID]] = defaultdict(list)
    sighting_indicators_map: Dict[uuid.UUID, List[Indicator]] = defaultdict(list)

    for si, ind in rows:
        if si.sighting_id in sighting_map:
            key = (ind.indicator_type, ind.canonical_value)
            indicator_sightings[key].append(si.sighting_id)
            sighting_indicators_map[si.sighting_id].append(ind)

    # 2. Find shared pivots and build graph adjacency
    proposed_edges: List[Dict] = []
    adjacency: Dict[uuid.UUID, Set[uuid.UUID]] = defaultdict(set)

    # Weights by pivot strength
    pivot_confidence = {
        "upi": 1.0,
        "phone": 1.0,
        "crypto_wallet": 0.98,
        "apk_package": 0.95,
        "domain": 0.90,
        "url": 0.95,
        "handle": 0.70,
    }

    # Connect sightings sharing the same pivot
    seen_pairs: Set[Tuple[uuid.UUID, uuid.UUID]] = set()

    for (ind_type, ind_val), s_ids in indicator_sightings.items():
        unique_ids = list(set(s_ids))
        if len(unique_ids) > 1:
            conf = pivot_confidence.get(ind_type, 0.75)
            for i in range(len(unique_ids)):
                for j in range(i + 1, len(unique_ids)):
                    s1, s2 = unique_ids[i], unique_ids[j]
                    pair_key = (min(s1, s2), max(s1, s2))
                    adjacency[s1].add(s2)
                    adjacency[s2].add(s1)

                    if pair_key not in seen_pairs:
                        seen_pairs.add(pair_key)
                        s1_obj = sighting_map[s1]
                        s2_obj = sighting_map[s2]
                        proposed_edges.append({
                            "sighting_pair": (s1, s2),
                            "from_endpoint": f"{s1_obj.surface}:{s1_obj.raw_ref or str(s1)[:8]}",
                            "to_endpoint": f"{s2_obj.surface}:{s2_obj.raw_ref or str(s2)[:8]}",
                            "pivot_type": ind_type,
                            "confidence": conf,
                            "evidence_ids": [f"{ind_type}:{ind_val}"],
                        })

    # 3. Find connected components (Campaign clusters)
    visited: Set[uuid.UUID] = set()
    clusters: List[List[uuid.UUID]] = []

    for s_id in sighting_map:
        if s_id not in visited:
            component: List[uuid.UUID] = []
            queue = [s_id]
            visited.add(s_id)
            while queue:
                curr = queue.pop(0)
                component.append(curr)
                for neighbor in adjacency[curr]:
                    if neighbor not in visited:
                        visited.add(neighbor)
                        queue.append(neighbor)
            clusters.append(component)

    # 4. Upsert or create campaigns for multi-member clusters
    campaigns_count = 0
    total_edges_created = 0

    for cluster in clusters:
        cluster_set = set(cluster)
        # Check if all sightings in cluster are explicitly labeled benign
        is_all_benign = bool(cluster) and all(
            bool(sighting_map[sid].normalized_payload and sighting_map[sid].normalized_payload.get("isBenign", False))
            for sid in cluster
        )

        # Calculate truthful risk score derived directly from member sightings
        sighting_scores = [
            float(sighting_map[sid].normalized_payload.get("computed_risk_score", 0.0))
            for sid in cluster
            if sighting_map[sid].normalized_payload
        ]
        base_risk = max(sighting_scores) if sighting_scores else 40.0
        if is_all_benign:
            derived_risk = 5.0
        else:
            # Multi-surface correlation boost (+5.0) capped at 98.0
            derived_risk = min(98.0, base_risk + (5.0 if len(cluster) > 1 else 0.0))

        # Determine distinctive campaign title based on shared pivots or target references
        shared_pivots = [
            f"{itype}:{val}" for (itype, val), sids in indicator_sightings.items()
            if len(set(sids).intersection(cluster_set)) > 1
        ]
        surfaces = sorted(list(set(sighting_map[sid].surface for sid in cluster)))
        surfaces_str = ", ".join(surfaces)

        if is_all_benign:
            title = f"Benign Inquiries & Communications ({sighting_map[cluster[0]].surface})"
        elif len(cluster) > 1:
            primary_pivot = shared_pivots[0] if shared_pivots else f"Cluster {str(cluster[0])[:8]}"
            title = f"Campaign: {primary_pivot} ({surfaces_str})"
        else:
            s_obj = sighting_map[cluster[0]]
            ref = s_obj.raw_ref or str(s_obj.id)[:8]
            title = f"Isolated Threat Event ({s_obj.surface}: {ref})"

        # Check existing campaign by member sighting association (prevents improper merges)
        existing_camp_id = session.scalar(
            select(CampaignMember.campaign_id)
            .join(Campaign, CampaignMember.campaign_id == Campaign.id)
            .where(
                CampaignMember.sighting_id.in_(cluster),
                Campaign.tenant_id == tenant_id,
                Campaign.brand_id == brand_id,
            )
            .limit(1)
        )

        existing_camp = None
        if existing_camp_id:
            existing_camp = session.scalar(
                select(Campaign).where(Campaign.id == existing_camp_id)
            )

        camp_id = existing_camp.id if existing_camp else uuid.uuid4()
        if not existing_camp:
            existing_camp = Campaign(
                id=camp_id,
                tenant_id=tenant_id,
                brand_id=brand_id,
                title=title,
                status="proposed" if not is_all_benign else "closed",
                risk_score=derived_risk,
                first_seen_at=datetime.now(timezone.utc),
                last_seen_at=datetime.now(timezone.utc),
            )
            session.add(existing_camp)
            session.flush()
            campaigns_count += 1
        else:
            existing_camp.risk_score = derived_risk
            existing_camp.last_seen_at = datetime.now(timezone.utc)
            campaigns_count += 1

        # Associate campaign members
        for s_id in cluster:
            member = session.scalar(
                select(CampaignMember).where(
                    CampaignMember.campaign_id == camp_id,
                    CampaignMember.sighting_id == s_id,
                )
            )
            if not member:
                member = CampaignMember(
                    id=uuid.uuid4(),
                    campaign_id=camp_id,
                    sighting_id=s_id,
                    membership_reason="Correlated by campaign linker via shared pivots",
                )
                session.add(member)

        # Persist cluster-local edges only (edges where both endpoints belong to this cluster)
        cluster_edges = [
            e for e in proposed_edges
            if e["sighting_pair"][0] in cluster_set and e["sighting_pair"][1] in cluster_set
        ]

        for edge_data in cluster_edges:
            edge = session.scalar(
                select(CampaignEdge).where(
                    CampaignEdge.campaign_id == camp_id,
                    CampaignEdge.from_endpoint == edge_data["from_endpoint"],
                    CampaignEdge.to_endpoint == edge_data["to_endpoint"],
                )
            )
            if not edge:
                edge = CampaignEdge(
                    id=uuid.uuid4(),
                    campaign_id=camp_id,
                    from_endpoint=edge_data["from_endpoint"],
                    to_endpoint=edge_data["to_endpoint"],
                    pivot_type=edge_data["pivot_type"],
                    confidence=edge_data["confidence"],
                    evidence_ids=edge_data["evidence_ids"],
                    review_status="proposed",
                )
                session.add(edge)
                total_edges_created += 1

    session.commit()
    return total_edges_created, campaigns_count
