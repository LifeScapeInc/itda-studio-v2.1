import { CreateWorkspace } from "@/components/create/create-workspace";
import { getReferenceLibraryData } from "@/system/create/reference-library";

export default async function CreatePage({
  searchParams,
}: {
  searchParams: Promise<{ projectId?: string }>;
}) {
  const { projectId } = await searchParams;
  return (
    <CreateWorkspace
      library={getReferenceLibraryData()}
      requestedProjectId={projectId ?? null}
    />
  );
}
