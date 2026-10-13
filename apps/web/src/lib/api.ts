import { appCache, getOrSetCache } from "./cache";

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
  verification_status: 'verified' | 'pending_challenge' | 'unverified';
  verification_method?: string | null;
  verified_at?: string | null;
  verified_by?: string | null;
  metadata?: Record<string, any> | null;
  object_key?: string | null;
  sha256?: string | null;
  created_at: string;
};

export type DnsChallengeInstructions = {
  method: string;
  domain?: string | null;
  record_type?: string | null;
  record_name?: string | null;
  record_value?: string | null;
  instructions: string[];
  verification_check?: string | null;
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

const apiBaseUrl =
  (typeof window !== "undefined" && (window as any).__ASTRA_API_URL__) ||
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.API_BASE_URL ||
  "http://localhost:8000";

export class ApiError extends Error {
  constructor(public readonly status: number, message: string) {
    super(message);
    this.name = "ApiError";
  }
}

export type UserInfo = {
  id: string;
  email: string;
  full_name: string;
  role: string;
  clerk_id?: string | null;
  composio_user_id?: string | null;
  onboarding_completed?: boolean;
  primary_brand_id?: string | null;
};

export type TenantInfo = {
  id: string;
  name: string;
  is_demo: boolean;
};

export type TenantMembershipInfo = {
  tenant_id: string;
  tenant_name: string;
  role: string;
};

export type AuthResponse = {
  access_token: string;
  token_type: string;
  user: UserInfo;
  tenant: TenantInfo;
};

export type MeResponse = {
  user: UserInfo;
  tenant: TenantInfo;
  available_tenants: TenantMembershipInfo[];
};

export type RegisterPayload = {
  email: string;
  password: string;
  full_name: string;
  organization_name: string;
};

export type LoginPayload = {
  email: string;
  password: string;
};

export type TenantSettings = {
  id?: string;
  tenant_id?: string;
  quarantine_threshold: number;
  slack_webhook_url?: string | null;
  alert_critical_only: boolean;
  notification_email?: string | null;
  auto_quarantine_enabled: boolean;
  updated_at?: string | null;
};

let authToken: string | null =
  typeof window !== "undefined" ? localStorage.getItem("astra_auth_token") : null;

export function getAuthToken(): string | null {
  if (typeof window !== "undefined") {
    return authToken || localStorage.getItem("astra_auth_token");
  }
  return authToken;
}

export function setAuthToken(token: string | null) {
  authToken = token;
  if (typeof window !== "undefined") {
    if (token) {
      localStorage.setItem("astra_auth_token", token);
    } else {
      localStorage.removeItem("astra_auth_token");
    }
  }
}

export function getActiveUser(): UserInfo | null {
  if (typeof window !== "undefined") {
    const raw = localStorage.getItem("astra_active_user");
    if (raw) {
      try {
        return JSON.parse(raw);
      } catch {}
    }
  }
  return null;
}

export function setActiveUser(user: UserInfo | null) {
  if (typeof window !== "undefined") {
    if (user) {
      localStorage.setItem("astra_active_user", JSON.stringify(user));
    } else {
      localStorage.removeItem("astra_active_user");
    }
  }
}

export function getActiveTenant(): TenantInfo | null {
  if (typeof window !== "undefined") {
    const raw = localStorage.getItem("astra_active_tenant");
    if (raw) {
      try {
        return JSON.parse(raw);
      } catch {}
    }
  }
  return null;
}

export function setActiveTenant(tenant: TenantInfo | null) {
  if (typeof window !== "undefined") {
    if (tenant) {
      localStorage.setItem("astra_active_tenant", JSON.stringify(tenant));
    } else {
      localStorage.removeItem("astra_active_tenant");
    }
  }
}

async function astraFetch(url: string, init?: RequestInit): Promise<Response> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...((init?.headers as Record<string, string>) || {}),
  };

  const currentToken = getAuthToken();
  if (currentToken) {
    headers["Authorization"] = `Bearer ${currentToken}`;
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
  const tenantId = getActiveTenant()?.id || 'anon';
  return getOrSetCache(`overview_${tenantId}`, async () => {
    const response = await astraFetch(`${apiBaseUrl}/api/v1/overview`, { cache: "no-store" });
    return (await response.json()) as Overview;
  }, 10);
}

export async function listBrands(): Promise<Brand[]> {
  const tenantId = getActiveTenant()?.id || 'anon';
  return getOrSetCache(`brands_${tenantId}`, async () => {
    const res = await astraFetch(`${apiBaseUrl}/api/v1/brands`, { cache: "no-store" });
    return (await res.json()) as Brand[];
  }, 15);
}

export async function getBrand(brandId: string): Promise<Brand | null> {
  try {
    const res = await astraFetch(`${apiBaseUrl}/api/v1/brands/${brandId}`, { cache: "no-store" });
    return await res.json();
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  }
}

export async function createBrand(
  name: string,
  assets?: { asset_type: string; canonical_value: string; metadata?: Record<string, any> }[]
): Promise<Brand | null> {
  try {
    const res = await astraFetch(`${apiBaseUrl}/api/v1/brands`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, assets }),
    });
    if (!res.ok) return null;
    appCache.clear();
    return await res.json();
  } catch (error) {
    throw error;
  }
}

export async function resetBrandProfile(): Promise<{ success: boolean; message: string }> {
  appCache.clear();
  try {
    if (typeof window !== "undefined") {
      const nextRes = await fetch("/api/brand/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      if (nextRes.ok) {
        return await nextRes.json();
      }
    }
  } catch (e) {
    console.warn("Next.js brand reset route error, falling back to direct API:", e);
  }

  const res = await astraFetch(`${apiBaseUrl}/api/v1/brands/reset`, {
    method: "POST",
  });
  return await res.json();
}

export async function deleteBrand(brandId: string): Promise<boolean> {
  appCache.clear();
  const res = await astraFetch(`${apiBaseUrl}/api/v1/brands/${brandId}`, {
    method: "DELETE",
  });
  return res.ok;
}

export async function addBrandAsset(
  brandId: string,
  assetType: string,
  canonicalValue: string,
  metadata?: Record<string, any>
): Promise<BrandAsset | null> {
  try {
    const res = await astraFetch(`${apiBaseUrl}/api/v1/brands/${brandId}/assets`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        asset_type: assetType,
        canonical_value: canonicalValue,
        metadata: metadata || {},
      }),
    });
    if (!res.ok) return null;
    appCache.invalidate('brands');
    appCache.invalidate('overview');
    return await res.json();
  } catch (error) {
    throw error;
  }
}

export async function initiateDnsChallenge(
  brandId: string,
  assetId: string
): Promise<DnsChallengeInstructions> {
  const res = await astraFetch(`${apiBaseUrl}/api/v1/brands/${brandId}/assets/${assetId}/dns-challenge`, {
    method: "POST",
  });
  return await res.json();
}

export async function verifyDnsRecord(
  brandId: string,
  assetId: string
): Promise<BrandAsset> {
  const res = await astraFetch(`${apiBaseUrl}/api/v1/brands/${brandId}/assets/${assetId}/verify-dns`, {
    method: "POST",
  });
  return await res.json();
}

export async function verifyAssetManual(
  brandId: string,
  assetId: string,
  reason: string
): Promise<BrandAsset> {
  const res = await astraFetch(`${apiBaseUrl}/api/v1/brands/${brandId}/assets/${assetId}/verify-manual`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ asset_id: assetId, reason }),
  });
  return await res.json();
}

export async function verifyAssetSocial(
  brandId: string,
  assetId: string
): Promise<BrandAsset> {
  const res = await astraFetch(`${apiBaseUrl}/api/v1/brands/${brandId}/assets/${assetId}/verify-social`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });
  return await res.json();
}

export async function deleteBrandAsset(
  brandId: string,
  assetId: string
): Promise<void> {
  await astraFetch(`${apiBaseUrl}/api/v1/brands/${brandId}/assets/${assetId}`, {
    method: "DELETE",
  });
  appCache.invalidate('brands');
  appCache.invalidate('overview');
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
  const tenantId = getActiveTenant()?.id || 'anon';
  const cacheKey = `sightings_${tenantId}_${brandId || 'all'}_${surface || 'all'}`;
  return getOrSetCache(cacheKey, async () => {
    const url = new URL(`${apiBaseUrl}/api/v1/sightings`);
    if (brandId) url.searchParams.set("brand_id", brandId);
    if (surface) url.searchParams.set("surface", surface);
    const res = await astraFetch(url.toString(), { cache: "no-store" });
    return (await res.json()) as Sighting[];
  }, 10);
}

export type SightingActionResponse = {
  sighting_id: string;
  status: string;
  triage_status: string;
  is_benign: boolean;
  message: string;
  takedown_requested_at?: string | null;
  whitelisted_at?: string | null;
  dismissed_at?: string | null;
};

export async function whitelistSighting(sightingId: string, reason?: string): Promise<SightingActionResponse> {
  const res = await astraFetch(`${apiBaseUrl}/api/v1/sightings/${sightingId}/whitelist`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ reason: reason || "Claimed legitimate brand asset by analyst" }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Failed to whitelist sighting" }));
    throw new Error(err.detail || "Failed to whitelist sighting");
  }
  appCache.invalidate("sightings");
  appCache.invalidate("overview");
  return await res.json();
}

export async function dismissSighting(sightingId: string, reason?: string): Promise<SightingActionResponse> {
  const res = await astraFetch(`${apiBaseUrl}/api/v1/sightings/${sightingId}/dismiss`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ reason: reason || "Dismissed false positive by analyst" }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Failed to dismiss sighting" }));
    throw new Error(err.detail || "Failed to dismiss sighting");
  }
  appCache.invalidate("sightings");
  appCache.invalidate("overview");
  return await res.json();
}

export async function requestTakedownForSighting(
  sightingId: string,
  targetProvider?: string,
  notes?: string
): Promise<SightingActionResponse> {
  const res = await astraFetch(`${apiBaseUrl}/api/v1/sightings/${sightingId}/takedown`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      target_provider: targetProvider || "Registrar Abuse Contact",
      notes: notes || "Brand impersonation and unauthorized trademark usage takedown request",
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Failed to submit takedown request" }));
    throw new Error(err.detail || "Failed to submit takedown request");
  }
  appCache.invalidate("sightings");
  appCache.invalidate("overview");
  return await res.json();
}

export async function reopenSighting(sightingId: string): Promise<SightingActionResponse> {
  const res = await astraFetch(`${apiBaseUrl}/api/v1/sightings/${sightingId}/reopen`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Failed to reopen sighting" }));
    throw new Error(err.detail || "Failed to reopen sighting");
  }
  appCache.invalidate("sightings");
  appCache.invalidate("overview");
  return await res.json();
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
    appCache.clear(); // Analysis updates campaigns, edges, signals, overview
    return await res.json();
  } catch (error) {
    throw error;
  }
}

export type LiveThreatItem = {
  category?: 'social' | 'domain' | 'app' | 'campaign' | string;
  title?: string;
  surface?: string;
  handle?: string;
  platform?: string;
  domain?: string;
  ips?: string[];
  target_url?: string;
  whois?: string;
  whois_url?: string;
  risk_score?: number;
  risk_level?: string;
  details?: string;
  discovered_at?: string;
};

export type ThreatScanStatus = {
  is_scanning: boolean;
  status: string;
  brand_id?: string | null;
  progress_pct: number;
  stage: string;
  stage_index: number;
  total_stages: number;
  eta_seconds: number;
  started_at?: string | null;
  completed_at?: string | null;
  logs: string[];
  findings_found: number;
  live_threats?: LiveThreatItem[] | null;
};

export async function startThreatScan(brandId?: string): Promise<ThreatScanStatus> {
  const res = await astraFetch(`${apiBaseUrl}/api/v1/analysis-jobs/start-scan`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ brand_id: brandId }),
  });
  appCache.clear();
  return await res.json();
}

export async function getThreatScanStatus(brandId?: string): Promise<ThreatScanStatus> {
  const url = new URL(`${apiBaseUrl}/api/v1/analysis-jobs/scan-status`);
  if (brandId) url.searchParams.set("brand_id", brandId);
  const res = await astraFetch(url.toString(), { cache: "no-store" });
  return await res.json();
}


export async function listCampaigns(brandId?: string, status?: string): Promise<Campaign[]> {
  const tenantId = getActiveTenant()?.id || 'anon';
  const cacheKey = `campaigns_${tenantId}_${brandId || 'all'}_${status || 'all'}`;
  return getOrSetCache(cacheKey, async () => {
    const url = new URL(`${apiBaseUrl}/api/v1/campaigns`);
    if (brandId) url.searchParams.set("brand_id", brandId);
    if (status) url.searchParams.set("status", status);
    const res = await astraFetch(url.toString(), { cache: "no-store" });
    return (await res.json()) as Campaign[];
  }, 10);
}

export async function getCampaign(campaignId: string): Promise<CampaignDetail | null> {
  try {
    const res = await astraFetch(`${apiBaseUrl}/api/v1/campaigns/${campaignId}`, { cache: "no-store" });
    return await res.json();
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;
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
  const payload: Record<string, string> = {};
  if (url && url.trim()) payload.url = url.trim();
  if (fileHash && fileHash.trim()) payload.file_hash = fileHash.trim();
  if (!payload.url && !payload.file_hash) {
    throw new Error('A URL or file hash is required for a VirusTotal lookup.');
  }

  const res = await astraFetch(`${apiBaseUrl}/api/v1/integrations/virustotal/check`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return await res.json();
}

export async function scanYouTube(brandId: string): Promise<any> {
  try {
    const res = await astraFetch(`${apiBaseUrl}/api/v1/integrations/youtube/scan`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ brand_id: brandId }),
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
  finding_id?: string;
  tenant_id: string;
  brand_id: string;
  package_name: string;
  app_title: string;
  store_platform: string;
  store_source?: string;
  store_url?: string | null;
  publisher_name?: string | null;
  developer_name?: string | null;
  developer_cert_sha256?: string | null;
  cert_sha256_fingerprint?: string | null;
  official_cert_match?: boolean | null;
  apk_sha256?: string | null;
  triage_status: string;
  triage_priority: number;
  risk_score: number;
  data_mode?: 'live' | 'synthetic_demo' | 'manual_upload';
  malware_status?: string;
  permissions_risk?: string;
  permissions_declared?: string[];
  malware_detections?: Record<string, any>;
  impersonation_evidence?: Record<string, any> | null;
  observed_at?: string;
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
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: "Failed to load response cases" }));
      throw new Error(err.detail || "Failed to load response cases");
    }
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
  case_type?: string;
  draft_recipient?: string;
  draft_subject?: string;
  draft_body?: string;
  finding_id?: string;
  campaign_cluster_id?: string;
  drafted_by?: string;
  submission_payload?: Record<string, any>;
  evidence_manifest?: string[];
}): Promise<ResponseCase | null> {
  try {
    if (!payload.finding_id) {
      throw new Error("Choose a real finding before creating a response draft.");
    }
    const body = {
      finding_id: payload.finding_id,
      cluster_id: payload.campaign_cluster_id,
      target_provider: payload.target_provider,
      case_type: payload.case_type || "infringement_takedown",
      draft_recipient: payload.draft_recipient,
      draft_subject: payload.draft_subject,
      draft_body: payload.draft_body,
      submission_payload: payload.submission_payload || {
        case_type: payload.case_type || "infringement_takedown",
        draft_recipient: payload.draft_recipient,
        draft_subject: payload.draft_subject,
        draft_body: payload.draft_body,
      },
      evidence_manifest: payload.evidence_manifest || [],
    };
    const res = await astraFetch(`${apiBaseUrl}/api/v1/responses/draft`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: "Create draft failed" }));
      throw new Error(err.detail || "Create draft failed");
    }
    return await res.json();
  } catch (error) {
    throw error;
  }
}

export async function approveResponseCase(id: string, notes?: string): Promise<ResponseCase | null> {
  try {
    const res = await astraFetch(`${apiBaseUrl}/api/v1/responses/${id}/approve`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ approval_notes: notes || "Approved by security lead" }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: "Approval failed" }));
      throw new Error(err.detail || "Approval failed");
    }
    return await res.json();
  } catch (error) {
    throw error;
  }
}

export async function dispatchResponseCase(id: string, channel: string = 'manual_portal'): Promise<ResponseCase | null> {
  try {
    const res = await astraFetch(`${apiBaseUrl}/api/v1/responses/${id}/dispatch`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ submission_channel: channel }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: "Dispatch failed" }));
      throw new Error(err.detail || "Dispatch failed");
    }
    return await res.json();
  } catch (error) {
    throw error;
  }
}

export async function resolveResponseCase(id: string, notes: string, externalCaseReference?: string): Promise<ResponseCase | null> {
  try {
    if (notes.trim().length < 10) {
      throw new Error("Enter at least 10 characters describing the observed outcome.");
    }
    const res = await astraFetch(`${apiBaseUrl}/api/v1/responses/${id}/resolve`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        resolution_notes: notes.trim(),
        external_case_reference: externalCaseReference?.trim() || undefined,
      }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: "Resolution failed" }));
      throw new Error(err.detail || "Resolution failed");
    }
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
  permitted_scopes?: string[];
  last_successful_sync_at?: string | null;
  last_health_check_at?: string | null;
  error_message?: string | null;
  created_at: string;
};

export type ConnectorSyncResponse = {
  connector_id: string;
  status: string;
  synced_findings_count: number;
  finding_ids: string[];
  synced_at: string;
  error_message?: string | null;
};

export async function listConnectors(): Promise<{ connectors: Connector[]; total: number }> {
  const res = await astraFetch(`${apiBaseUrl}/api/v1/connectors`, { cache: "no-store" });
  return await res.json();
}

export async function createConnector(payload: {
  connector_type: string;
  name: string;
  auth_config?: Record<string, string>;
  rate_limit_rpm?: number;
  permitted_scopes?: string[];
}): Promise<Connector> {
  const res = await astraFetch(`${apiBaseUrl}/api/v1/connectors`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return await res.json();
}

export async function updateConnector(
  id: string,
  payload: {
    name?: string;
    auth_config?: Record<string, string>;
    rate_limit_rpm?: number;
    permitted_scopes?: string[];
    status?: string;
  }
): Promise<Connector> {
  const res = await astraFetch(`${apiBaseUrl}/api/v1/connectors/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return await res.json();
}

export async function checkConnectorHealth(id: string): Promise<Connector | null> {
  try {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      return {
        id,
        tenant_id: 'default_tenant',
        name: 'Unconfigured Pipeline Template',
        connector_type: 'template',
        status: 'unconfigured',
        rate_limit_rpm: 60,
        error_message: 'Demo template — configure credentials to connect to live feed.',
        created_at: new Date().toISOString(),
      };
    }
    const res = await astraFetch(`${apiBaseUrl}/api/v1/connectors/${id}/health`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: "Connector health check failed" }));
      throw new Error(err.detail || "Connector health check failed");
    }
    return await res.json();
  } catch (error) {
    throw error;
  }
}

export async function syncConnector(id: string): Promise<ConnectorSyncResponse> {
  const res = await astraFetch(`${apiBaseUrl}/api/v1/connectors/${id}/sync`, {
    method: "POST",
  });
  return await res.json();
}

export async function deleteConnector(id: string): Promise<void> {
  await astraFetch(`${apiBaseUrl}/api/v1/connectors/${id}`, {
    method: "DELETE",
  });
}

export async function register(payload: RegisterPayload): Promise<AuthResponse> {
  const res = await astraFetch(`${apiBaseUrl}/api/v1/auth/register`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
  const data = (await res.json()) as AuthResponse;
  setAuthToken(data.access_token);
  setActiveUser(data.user);
  setActiveTenant(data.tenant);
  return data;
}

export async function login(payload: LoginPayload): Promise<AuthResponse> {
  const res = await astraFetch(`${apiBaseUrl}/api/v1/auth/login`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
  const data = (await res.json()) as AuthResponse;
  setAuthToken(data.access_token);
  setActiveUser(data.user);
  setActiveTenant(data.tenant);
  return data;
}

export async function getMe(): Promise<MeResponse | null> {
  try {
    const res = await astraFetch(`${apiBaseUrl}/api/v1/auth/me`);
    const data = (await res.json()) as MeResponse;
    setActiveUser(data.user);
    setActiveTenant(data.tenant);
    return data;
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) return null;
    throw error;
  }
}

export async function switchTenant(tenantId: string): Promise<AuthResponse> {
  const res = await astraFetch(`${apiBaseUrl}/api/v1/auth/switch-tenant`, {
    method: "POST",
    body: JSON.stringify({ tenant_id: tenantId }),
  });
  const data = (await res.json()) as AuthResponse;
  setAuthToken(data.access_token);
  setActiveUser(data.user);
  setActiveTenant(data.tenant);
  return data;
}

export async function registerUser(payload: {
  email: string;
  password: string;
  full_name: string;
  organization_name: string;
}): Promise<AuthResponse> {
  const res = await astraFetch(`${apiBaseUrl}/api/v1/auth/register`, {
    method: "POST",
    body: JSON.stringify({
      email: payload.email,
      password: payload.password,
      full_name: payload.full_name,
      organization_name: payload.organization_name,
    }),
  });
  const data = (await res.json()) as AuthResponse;
  setAuthToken(data.access_token);
  setActiveUser(data.user);
  setActiveTenant(data.tenant);
  return data;
}

export async function loginUser(payload: {
  email: string;
  password: string;
}): Promise<AuthResponse> {
  const res = await astraFetch(`${apiBaseUrl}/api/v1/auth/login`, {
    method: "POST",
    body: JSON.stringify({
      email: payload.email,
      password: payload.password,
    }),
  });
  const data = (await res.json()) as AuthResponse;
  setAuthToken(data.access_token);
  setActiveUser(data.user);
  setActiveTenant(data.tenant);
  return data;
}

export function logout(): void {
  setAuthToken(null);
  setActiveUser(null);
  setActiveTenant(null);
  appCache.clear();
  if (typeof window !== "undefined") {
    try {
      localStorage.removeItem("astra_current_brand_dna");
      localStorage.removeItem("astra_onboarding_completed");
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && (k.startsWith("astra_current_brand_dna_") || k.startsWith("astra_onboarding_completed_") || k.startsWith("astra_cache_"))) {
          keysToRemove.push(k);
        }
      }
      keysToRemove.forEach((k) => localStorage.removeItem(k));
    } catch {}
  }
}

export function clearSession(): void {
  logout();
}

export async function getSettings(): Promise<TenantSettings> {
  const res = await astraFetch(`${apiBaseUrl}/api/v1/settings`);
  return (await res.json()) as TenantSettings;
}

export async function updateSettings(updates: Partial<TenantSettings>): Promise<TenantSettings> {
  const res = await astraFetch(`${apiBaseUrl}/api/v1/settings`, {
    method: "PUT",
    body: JSON.stringify(updates),
  });
  return (await res.json()) as TenantSettings;
}


