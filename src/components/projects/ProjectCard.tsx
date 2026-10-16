import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { Reveal } from "@/components/animations/Reveal";
import { Fireflies } from "@/components/ui/Fireflies";
import { ProjectVisual } from "@/components/ui/ProjectVisual";
import type { Project } from "@/types";

interface ProjectCardProps {
  project: Project;
  featured?: boolean;
  index?: number;
}

/** Large cinematic project tile used across home and work routes. */
export function ProjectCard({ project, featured = false, index = 0 }: ProjectCardProps) {
  return (
    <Reveal delay={index * 0.08} className={featured ? "md:col-span-2" : undefined}>
      <article className="panel card-hover sheen group flex h-full flex-col overflow-hidden rounded-3xl">
        <Fireflies count={5} />
        <div
          className={`relative overflow-hidden border-b border-line ${
            featured ? "aspect-[16/9] sm:aspect-[21/9]" : "aspect-[16/10]"
          }`}
        >
          <ProjectVisual project={project} sizes={featured ? "(min-width: 640px) 50vw, 100vw" : "(min-width: 768px) 50vw, 100vw"} />
          <span className="absolute left-4 top-4 rounded-full border border-linestrong bg-[var(--veil)] px-3 py-1 font-mono text-[0.65rem] tracking-[0.16em] text-accent backdrop-blur-md">
            CASE STUDY
          </span>
        </div>

        <div className="flex flex-1 flex-col gap-4 p-6 sm:p-7">
          <div className="flex flex-wrap items-center gap-3">
            <span className="font-mono text-xs tracking-[0.2em] text-faint">{project.index}</span>
            <span className="rounded-full border border-line px-3 py-1 text-[0.7rem] tracking-wide text-accent">
              {project.categoryLabel}
            </span>
          </div>

          <h3 className="text-xl sm:text-2xl">{project.title}</h3>
          <p className="text-sm leading-relaxed text-dim">{project.summary}</p>

          <ul className="mt-auto flex flex-wrap gap-2 pt-2">
            {project.stack.slice(0, 4).map((tech) => (
              <li
                key={tech}
                className="rounded-full bg-accentsoft px-2.5 py-1 text-[0.7rem] text-dim"
              >
                {tech}
              </li>
            ))}
          </ul>

          <Link
            href={`/work/${project.slug}`}
            className="inline-flex items-center gap-2 rounded-full font-display text-sm text-ink transition group-hover:text-accent"
            aria-label={`View case study: ${project.title}`}
          >
            View case study
            <ArrowRight
              className="h-4 w-4 transition-transform group-hover:translate-x-1"
              aria-hidden="true"
            />
          </Link>
        </div>
      </article>
    </Reveal>
  );
}
