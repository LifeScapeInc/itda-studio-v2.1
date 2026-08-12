import styled from "styled-components";
import { ProjectPlaceholderImage } from "./project-placeholder-image";
import type { StudioProject } from "@/stores/useProjectStore";
const Img = styled.img`width:100%;height:100%;object-fit:cover`;
export function ProjectPreview({
  project,
  index
}: {
  project: StudioProject;
  index: number;
}) {
  const url = project.previewImages[index];
  return url ? (
    <Img
      src={url}
      alt=""
    />
  ) : <ProjectPlaceholderImage seed={`${project.id}-${index}`} />;
}
