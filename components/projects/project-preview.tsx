import { LoadingImage } from "@/components/ui/loading-image";
import { ProjectPlaceholderImage } from "./project-placeholder-image";
import type { StudioProject } from "@/stores/useProjectStore";

export function ProjectPreview({
  project,
  imageUrl,
  index,
}: {
  project: StudioProject;
  imageUrl?: string;
  index: number;
}) {
  const url = imageUrl ?? project.previewImages[index];
  return url ? (
    <LoadingImage
      src={url}
      alt=""
      fill
      unoptimized
      sizes={index === 0 ? "(max-width: 1200px) 45vw, 30vw" : "104px"}
      style={{ objectFit: "cover" }}
    />
  ) : <ProjectPlaceholderImage seed={`${project.id}-${index}`} />;
}
