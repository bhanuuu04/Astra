import { ResponsePacketView } from "@/features/responses/ResponsePacketView";

export const metadata = {
  title: "Response Packet & Manifest | ASTRA Digital Risk Protection",
};

export default async function ResponsePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ResponsePacketView campaignId={id} />;
}
