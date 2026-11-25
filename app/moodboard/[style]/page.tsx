import { notFound } from "next/navigation";
import { NavigationLeft } from "@/components/layout/navigation-left";
import { NavigationTop } from "@/components/layout/navigation-top";
import { MoodboardDetail } from "@/components/moodboard/moodboard-detail";
import { cloudMoodboardDetail } from "@/system/server/cloud-catalog";
import { StudioShell, LibraryDetailWorkspace } from "@/system/styles/layout";

export default async function MoodboardStylePage({
  params,
}: {
  params: Promise<{ style: string }>;
}) {
  const { style } = await params;
  const detail=await cloudMoodboardDetail(style);
  if(!detail)notFound();
  const {moodboard,manifest}=detail;

  return (
    <StudioShell>
      <NavigationTop />
      <NavigationLeft />
      <LibraryDetailWorkspace>
        <MoodboardDetail moodboard={moodboard} manifest={manifest} />
      </LibraryDetailWorkspace>
    </StudioShell>
  );
}
