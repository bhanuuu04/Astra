export type Overview = {
  brands: number;
  sightings: number;
  active_campaigns: number;
  high_risk_campaigns: number;
  environment: string;
};

const apiBaseUrl = process.env.API_BASE_URL ?? "http://localhost:8000";

export async function getOverview(): Promise<Overview | null> {
  try {
    const response = await fetch(`${apiBaseUrl}/api/v1/overview`, { cache: "no-store" });
    if (!response.ok) return null;
    return (await response.json()) as Overview;
  } catch {
    return null;
  }
}
