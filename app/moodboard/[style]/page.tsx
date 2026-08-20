import { notFound } from "next/navigation";
import { NavigationLeft } from "@/components/layout/navigation-left";
import { NavigationTop } from "@/components/layout/navigation-top";
import { MoodboardDetail } from "@/components/moodboard/moodboard-detail";
import { getMoodboardLayoutManifest } from "@/system/moodboard/moodboard-manifest";
import { getMoodboard, MOODBOARDS } from "@/system/moodboard/moodboards";
import { StudioShell, WorkspaceContent } from "@/system/styles/layout";

export function generateStaticParams() {
  return MOODBOARDS.map((moodboard) => ({
    style: moodboard.slug,
  }));
}

export default async function MoodboardStylePage({
  params,
}: {
  params: Promise<{ style: string }>;
}) {
  const { style } = await params;
  const moodboard = getMoodboard(style);

  if (!moodboard) {
    notFound();
  }

  const manifest = getMoodboardLayoutManifest(style);

  if (!manifest) {
    notFound();
  }

  return (
    <StudioShell>
      <NavigationTop />
      <NavigationLeft />
      <WorkspaceContent $surface>
        <MoodboardDetail moodboard={moodboard} manifest={manifest} />
      </WorkspaceContent>
    </StudioShell>
  );
}
