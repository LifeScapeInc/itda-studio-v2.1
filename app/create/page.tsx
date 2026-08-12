import { CreateWorkspace } from "@/components/create/create-workspace";
import { getReferenceLibraryData } from "@/system/create/reference-library";

export default function CreatePage() {
  return <CreateWorkspace library={getReferenceLibraryData()} />;
}
