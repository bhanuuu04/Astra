export type Overview = {
  brands: number;
  sightings: number;
  active_campaigns: number;
  high_risk_campaigns: number;
  environment: string;
};

export type BrandAsset = {
  id: string;
  brand_id: string;
  asset_type: string;
  canonical_value: string;
  object_key?: string | null;
  sha256?: string | null;
  verified_at?: string | null;
  created_at: string;
};

export type Brand = {
  id: string;
  tenant_id: string;
  name: string;
  status: string;
  created_at: string;
  assets: BrandAsset[];
};

export type Sighting = {
  id: string;
  tenant_id: string;
  brand_id: string;
  surface: string;
  source_kind: string;
  observed_at?: string | null;
  raw_ref?: string | null;
  normalized_payload?: Record<string, any> | null;
  created_at: string;
};

export type DemoResetResult = {
  success: boolean;
  message: string;
  tenant_id: string;
  brand_id: string;
  brand_name: string;
  assets_seeded: number;
  sightings_seeded: number;
  indicators_seeded: number;
  evidence_seeded: number;
  rogue_apps_seeded: number;
};

const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL ?? process.env.API_BASE_URL ?? "http://localhost:8000";

export class ApiError extends Error {
  constructor(public readonly status: number, message: string) {
    super(message);
    this.name = "ApiError";
  }
}

let authToken: string | null = null;

export function setAuthToken(token: string | null) {
  authToken = token;
}

async function astraFetch(url: string, init?: RequestInit): Promise<Response> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...((init?.headers as Record<string, string>) || {}),
  };

  if (authToken) {
    headers["Authorization"] = `Bearer ${authToken}`;
  }

  const response = await fetch(url, {
    ...init,
    headers,
  });
  if (!response.ok) {
    let message = `ASTRA API request failed (${response.status})`;
    try {
      const body = await response.clone().json();
      const detail = body?.detail || body?.error;
      if (typeof detail === "string") message = detail;
    } catch {
      // Keep the status-based message if the server returned a non-JSON body.
    }
    throw new ApiError(response.status, message);
  }
  return response;
}

export async function getOverview(): Promise<Overview | null> {
  try {
    const response = await astraFetch(`${apiBaseUrl}/api/v1/overview`, { cache: "no-store" });
    if (!response.ok) return null;
    return (await response.json()) as Overview;
  } catch (error) {
    throw error;
  }
}

export async function listBrands(): Promise<Brand[]> {
  try {
    const res = await astraFetch(`${apiBaseUrl}/api/v1/brands`, { cache: "no-store" });
    if (!res.ok) return [];
    return await res.json();
  } catch (error) {
    throw error;
  }
}

export async function getBrand(brandId: string): Promise<Brand | null> {
  try {
    const res = await astraFetch(`${apiBaseUrl}/api/v1/brands/${brandId}`, { cache: "no-store" });
    if (!res.ok) return null;
    return await res.json();
  } catch (error) {
    throw error;
  }
}

export async function createBrand(name: string, assets?: { asset_type: string; canonical_value: string }[]): Promise<Brand | null> {
  try {
    const res = await astraFetch(`${apiBaseUrl}/api/v1/brands`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, assets }),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (error) {
    throw error;
  }
}

export async function addBrandAsset(brandId: string, assetType: string, canonicalValue: string): Promise<BrandAsset | null> {
  try {
    const res = await astraFetch(`${apiBaseUrl}/api/v1/brands/${brandId}/assets`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ asset_type: assetType, canonical_value: canonicalValue }),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (error) {
    throw error;
  }
}

export async function ingestSightingsBatch(sightings: any[]): Promise<{ ingested_count: number; sighting_ids: string[] } | null> {
  try {
    const res = await astraFetch(`${apiBaseUrl}/api/v1/sightings:batch`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sightings }),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (error) {
    throw error;
  }
}

export async function listSightings(brandId?: string, surface?: string): Promise<Sighting[]> {
  try {
    const url = new URL(`${apiBaseUrl}/api/v1/sightings`);
    if (brandId) url.searchParams.set("brand_id", brandId);
    if (surface) url.searchParams.set("surface", surface);
    const res = await astraFetch(url.toString(), { cache: "no-store" });
    if (!res.ok) return [];
    return await res.json();
  } catch (error) {
    throw error;
  }
}

export async function resetDemo(): Promise<DemoResetResult | null> {
  try {
    const res = await astraFetch(`${apiBaseUrl}/api/v1/demo/reset`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (error) {
    throw error;
  }
}

export type AnalysisJobResult = {
  run_id: string;
  status: string;
  brand_id: string;
  sightings_processed: number;
  signals_generated: number;
  edges_proposed: number;
  campaigns_updated: number;
  created_at: string;
  completed_at?: string | null;
};

export type Campaign = {
  id: string;
  tenant_id: string;
  brand_id: string;
  title: string;
  status: string;
  risk_score: number;
  first_seen_at?: string | null;
  last_seen_at?: string | null;
  created_at: string;
  member_count: number;
};

export type CampaignEdge = {
  id: string;
  campaign_id: string;
  from_endpoint: string;
  to_endpoint: string;
  pivot_type: string;
  confidence: number;
  evidence_ids?: string[] | null;
  review_status: string;
  created_at: string;
};

export type Signal = {
  id: string;
  sighting_id: string;
  run_id?: string | null;
  detector_key: string;
  detector_version: string;
  score: number;
  threshold: number;
  explanation: string;
  evidence_ids?: string[] | null;
  feature_values?: Record<string, any> | null;
  created_at: string;
};

export type CampaignDetail = {
  campaign: Campaign;
  members: Sighting[];
  edges: CampaignEdge[];
  signals: Signal[];
};

export async function runAnalysisJob(brandId?: string, sightingIds?: string[]): Promise<AnalysisJobResult | null> {
  try {
    const res = await astraFetch(`${apiBaseUrl}/api/v1/analysis-jobs`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ brand_id: brandId, sighting_ids: sightingIds }),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (error) {
    throw error;
  }
}

export async function listCampaigns(brandId?: string, status?: string): Promise<Campaign[]> {
  try {
    const url = new URL(`${apiBaseUrl}/api/v1/campaigns`);
    if (brandId) url.searchParams.set("brand_id", brandId);
    if (status) url.searchParams.set("status", status);
    const res = await astraFetch(url.toString(), { cache: "no-store" });
    if (!res.ok) return [];
    return await res.json();
  } catch (error) {
    throw error;
  }
}

export async function getCampaign(campaignId: string): Promise<CampaignDetail | null> {
  try {
    const res = await astraFetch(`${apiBaseUrl}/api/v1/campaigns/${campaignId}`, { cache: "no-store" });
    if (!res.ok) return null;
    return await res.json();
  } catch (error) {
    throw error;
  }
}

export async function submitCampaignDecision(campaignId: string, decision: string, reason: string): Promise<Campaign | null> {
  try {
    const res = await astraFetch(`${apiBaseUrl}/api/v1/campaigns/${campaignId}/decisions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ decision, reason }),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (error) {
    throw error;
  }
}

export async function submitEdgeDecision(campaignId: string, edgeId: string, decision: string, reason: string): Promise<CampaignEdge | null> {
  try {
    const res = await astraFetch(`${apiBaseUrl}/api/v1/campaigns/${campaignId}/edges/${edgeId}/decisions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ decision, reason }),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (error) {
    throw error;
  }
}

export type ResponseDraftItem = {
  recipient_type: string;
  recipient_name: string;
  subject: string;
  body_text: string;
  contact_email: string;
  portal_url?: string | null;
  policy_reference: string;
};

export type EvidenceManifestItem = {
  id: string;
  name: string;
  media_type: string;
  sha256: string;
  captured_at: string;
  source_reference: string;
  included: boolean;
};

export type ResponsePacket = {
  action_id: string;
  campaign_id: string;
  campaign_title: string;
  status: string;
  drafts: ResponseDraftItem[];
  manifest: EvidenceManifestItem[];
  created_at: string;
};

export type SimulateActionResult = {
  action_id: string;
  campaign_id: string;
  status: string;
  simulated_at: string;
  simulated_by: string;
  message: string;
};

export async function generateResponsePacket(campaignId: string): Promise<ResponsePacket | null> {
  try {
    const res = await astraFetch(`${apiBaseUrl}/api/v1/campaigns/${campaignId}/response-drafts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (error) {
    throw error;
  }
}

export async function simulateAction(actionId: string, actor?: string, notes?: string): Promise<SimulateActionResult | null> {
  try {
    const res = await astraFetch(`${apiBaseUrl}/api/v1/actions/${actionId}/simulate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ actor, notes }),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (error) {
    throw error;
  }
}

export async function getIntegrationsStatus(): Promise<any> {
  try {
    const res = await astraFetch(`${apiBaseUrl}/api/v1/integrations/status`, { cache: "no-store" });
    if (!res.ok) return null;
    return await res.json();
  } catch (error) {
    throw error;
  }
}

export async function checkVirusTotal(url?: string, fileHash?: string): Promise<any> {
  try {
    const res = await astraFetch(`${apiBaseUrl}/api/v1/integrations/virustotal/check`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url, file_hash: fileHash }),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (error) {
    throw error;
  }
}

export async function scanYouTube(brandName?: string): Promise<any> {
  try {
    const res = await astraFetch(`${apiBaseUrl}/api/v1/integrations/youtube/scan`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ brand_name: brandName || "Astra Security" }),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (error) {
    throw error;
  }
}

export async function generateCampaignAISummary(campaignId: string): Promise<any> {
  try {
    const res = await astraFetch(`${apiBaseUrl}/api/v1/campaigns/${campaignId}/ai-summary`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (error) {
    throw error;
  }
}

// -------------------------------------------------------------
// DRP Phase 0 & 1: Findings API
// -------------------------------------------------------------

export type Finding = {
  id: string;
  tenant_id: string;
  brand_id: string;
  surface: string;
  target_identifier: string;
  observed_at: string;
  collected_at: string;
  data_mode: 'live' | 'synthetic_demo' | 'manual_upload';
  triage_status: 'pending' | 'investigating' | 'confirmed_threat' | 'false_positive' | 'needs_evidence';
  triage_priority: number;
  triage_reasoning?: string | null;
  raw_evidence_id?: string | null;
  evidence_payload?: Record<string, any> | null;
  created_at: string;
  signals?: any[];
};

export async function listFindings(params?: {
  brand_id?: string;
  surface?: string;
  triage_status?: string;
  data_mode?: string;
  min_priority?: number;
  limit?: number;
  offset?: number;
}): Promise<{ findings: Finding[]; total: number; limit: number; offset: number }> {
  try {
    const url = new URL(`${apiBaseUrl}/api/v1/findings`);
    if (params) {
      Object.entries(params).forEach(([key, val]) => {
        if (val !== undefined && val !== null) {
          url.searchParams.set(key, String(val));
        }
      });
    }
    const res = await astraFetch(url.toString(), { cache: "no-store" });
    if (!res.ok) return { findings: [], total: 0, limit: 50, offset: 0 };
    return await res.json();
  } catch (error) {
    throw error;
  }
}

export async function getFinding(id: string, includeSignals: boolean = true): Promise<Finding | null> {
  try {
    const res = await astraFetch(`${apiBaseUrl}/api/v1/findings/${id}?include_signals=${includeSignals}`, {
      cache: "no-store",
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (error) {
    throw error;
  }
}

export async function triageFinding(
  id: string,
  triage_status: 'pending' | 'investigating' | 'confirmed_threat' | 'false_positive' | 'needs_evidence',
  rationale: string
): Promise<Finding | null> {
  try {
    const res = await astraFetch(`${apiBaseUrl}/api/v1/findings/${id}/triage`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ triage_status, rationale }),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (error) {
    throw error;
  }
}

// -------------------------------------------------------------
// DRP Phase 0 & 1: Mobile App Radar API
// -------------------------------------------------------------

export type MobileAppFinding = {
  id: string;
  tenant_id: string;
  brand_id: string;
  package_name: string;
  app_title: string;
  store_platform: string;
  store_url?: string | null;
  developer_name?: string | null;
  developer_cert_sha256?: string | null;
  apk_sha256?: string | null;
  triage_status: string;
  risk_score: number;
  impersonation_evidence?: Record<string, any> | null;
  created_at: string;
};

export async function listMobileAppRadar(params?: {
  brand_id?: string;
  store_platform?: string;
  triage_status?: string;
  limit?: number;
  offset?: number;
}): Promise<{ apps: MobileAppFinding[]; total: number; limit: number; offset: number }> {
  try {
    const url = new URL(`${apiBaseUrl}/api/v1/apps/radar`);
    if (params) {
      Object.entries(params).forEach(([key, val]) => {
        if (val !== undefined && val !== null) {
          url.searchParams.set(key, String(val));
        }
      });
    }
    const res = await astraFetch(url.toString(), { cache: "no-store" });
    if (!res.ok) return { apps: [], total: 0, limit: 50, offset: 0 };
    return await res.json();
  } catch (error) {
    throw error;
  }
}

export async function scanMobileAppPackage(id: string, scanType: string = 'virustotal'): Promise<any> {
  try {
    const res = await astraFetch(`${apiBaseUrl}/api/v1/apps/${id}/scan-package`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ scan_type: scanType }),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (error) {
    throw error;
  }
}

// -------------------------------------------------------------
// DRP Phase 0 & 1: Response Cases API
// -------------------------------------------------------------

export type ResponseCase = {
  id: string;
  tenant_id: string;
  finding_id?: string | null;
  campaign_cluster_id?: string | null;
  lifecycle_state: 'draft' | 'pending_approval' | 'approved' | 'submitted' | 'acknowledged' | 'resolved' | 'rejected';
  target_provider: string;
  case_type: string;
  draft_recipient?: string | null;
  draft_subject?: string | null;
  draft_body?: string | null;
  submitted_payload?: Record<string, any> | null;
  drafted_by: string;
  approved_by?: string | null;
  dispatched_by?: string | null;
  resolved_by?: string | null;
  created_at: string;
  approved_at?: string | null;
  dispatched_at?: string | null;
  resolved_at?: string | null;
};

export async function listResponseCases(params?: {
  lifecycle_state?: string;
  target_provider?: string;
  limit?: number;
  offset?: number;
}): Promise<{ cases: ResponseCase[]; total: number; limit: number; offset: number }> {
  try {
    const url = new URL(`${apiBaseUrl}/api/v1/responses`);
    if (params) {
      Object.entries(params).forEach(([key, val]) => {
        if (val !== undefined && val !== null) {
          url.searchParams.set(key, String(val));
        }
      });
    }
    const res = await astraFetch(url.toString(), { cache: "no-store" });
    if (!res.ok) return { cases: [], total: 0, limit: 50, offset: 0 };
    return await res.json();
  } catch (error) {
    throw error;
  }
}

export async function getResponseCase(id: string): Promise<ResponseCase | null> {
  try {
    const res = await astraFetch(`${apiBaseUrl}/api/v1/responses/${id}`, { cache: "no-store" });
    if (!res.ok) return null;
    return await res.json();
  } catch (error) {
    throw error;
  }
}

export async function createResponseDraft(payload: {
  target_provider: string;
  case_type: string;
  draft_recipient?: string;
  draft_subject?: string;
  draft_body?: string;
  finding_id?: string;
  campaign_cluster_id?: string;
  drafted_by?: string;
}): Promise<ResponseCase | null> {
  try {
    const res = await astraFetch(`${apiBaseUrl}/api/v1/responses/draft`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (error) {
    throw error;
  }
}

export async function approveResponseCase(id: string, approvedBy: string = 'analyst_console'): Promise<ResponseCase | null> {
  try {
    const res = await astraFetch(`${apiBaseUrl}/api/v1/responses/${id}/approve`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ approved_by: approvedBy }),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (error) {
    throw error;
  }
}

export async function dispatchResponseCase(id: string, dispatchedBy: string = 'analyst_console'): Promise<ResponseCase | null> {
  try {
    const res = await astraFetch(`${apiBaseUrl}/api/v1/responses/${id}/dispatch`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dispatched_by: dispatchedBy }),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (error) {
    throw error;
  }
}

export async function resolveResponseCase(id: string, outcome: string, notes?: string): Promise<ResponseCase | null> {
  try {
    const res = await astraFetch(`${apiBaseUrl}/api/v1/responses/${id}/resolve`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ outcome, notes }),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (error) {
    throw error;
  }
}

// -------------------------------------------------------------
// DRP Phase 0 & 1: Connectors API
// -------------------------------------------------------------

export type Connector = {
  id: string;
  tenant_id: string;
  name: string;
  connector_type: string;
  status: 'active' | 'degraded' | 'error' | 'unconfigured';
  rate_limit_rpm: number;
  last_successful_sync_at?: string | null;
  last_health_check_at?: string | null;
  error_message?: string | null;
  created_at: string;
};

export async function listConnectors(): Promise<{ connectors: Connector[]; total: number }> {
  try {
    const res = await astraFetch(`${apiBaseUrl}/api/v1/connectors`, { cache: "no-store" });
    if (!res.ok) return { connectors: [], total: 0 };
    return await res.json();
  } catch (error) {
    throw error;
  }
}

export async function checkConnectorHealth(id: string): Promise<Connector | null> {
  try {
    const res = await astraFetch(`${apiBaseUrl}/api/v1/connectors/${id}/health`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (error) {
    throw error;
  }
}

