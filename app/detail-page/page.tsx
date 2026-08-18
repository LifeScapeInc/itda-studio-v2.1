import { DetailPageWorkspace } from "@/components/detail-page/detail-page-workspace";

export default async function DetailPage({
  searchParams,
}: {
  searchParams: Promise<{ projectId?: string }>;
}) {
  const { projectId } = await searchParams;
  return <DetailPageWorkspace requestedProjectId={projectId ?? null} />;
}
