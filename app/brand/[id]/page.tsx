import { BrandWorkspace } from "@/components/brand/brand-workspace";
export default async function BrandDetailPage({ params }: { params: Promise<{ id: string }> }) {
 const { id } = await params;
 return <BrandWorkspace id={id} />;
}
