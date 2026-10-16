import Image from "next/image";
import { ProjectPreview } from "@/components/projects/ProjectPreview";
import type { Project } from "@/types";

interface ProjectVisualProps {
  project: Project;
  /** CSS class for the SVG fallback (Image uses fill instead). */
  className?: string;
  sizes?: string;
}

/**
 * Shows the backend-provided project image when set, otherwise falls back to
 * the generated SVG artwork. Parent must be positioned (relative).
 */
export function ProjectVisual({ project, className, sizes }: ProjectVisualProps) {
  if (project.image) {
    return (
      <Image
        src={project.image}
        alt={`${project.title} preview`}
        fill
        sizes={sizes ?? "(min-width: 1024px) 66vw, (min-width: 768px) 50vw, 100vw"}
        className={`object-cover ${className ?? ""}`}
      />
    );
  }
  return <ProjectPreview project={project} className={className} />;
}
