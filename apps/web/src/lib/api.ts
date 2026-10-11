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
