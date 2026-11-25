import { cloudMoodboards } from "@/system/server/cloud-catalog";
import { NavigationLeft } from "@/components/layout/navigation-left";
import { NavigationTop } from "@/components/layout/navigation-top";
import { MoodboardGrid } from "@/components/moodboard/moodboard-grid";
import { StudioShell, WorkspaceContent } from "@/system/styles/layout";
export default async function MoodboardPage() {
  return (
    <StudioShell>
      <NavigationTop />
      <NavigationLeft />
      <WorkspaceContent>
        <MoodboardGrid moodboards={await cloudMoodboards()} />
      </WorkspaceContent>
    </StudioShell>
  );
}
