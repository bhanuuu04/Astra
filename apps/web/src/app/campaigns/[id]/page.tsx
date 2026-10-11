import { CampaignDetailView } from "@/features/campaigns/CampaignDetailView";

export const metadata = {
  title: "Campaign Graph Investigation | ASTRA Digital Risk Protection",
};

export default async function CampaignPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <CampaignDetailView campaignId={id} />;
}
