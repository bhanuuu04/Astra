import { BrandDetailView } from "@/features/brands/BrandDetailView";

export const metadata = {
  title: "Brand DNA Details | ASTRA Digital Risk Protection",
};

export default async function BrandPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <BrandDetailView brandId={id} />;
}
