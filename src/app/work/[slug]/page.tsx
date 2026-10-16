import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowUpRight, MessageCircle } from "lucide-react";
import { ProjectCard } from "@/components/projects/ProjectCard";
import {
  CaseStudyGallery,
  CaseStudyList,
  CaseStudyNotice,
  CaseStudyParagraphs,
  CaseStudySection,
} from "@/components/projects/CaseStudySections";
import { ProjectVisual } from "@/components/ui/ProjectVisual";
import { Scene } from "@/components/environment/Scene";
import { ActionLink } from "@/components/ui/ActionLink";
import { Section } from "@/components/ui/Section";
import { getAllProjects } from "@/server/projects";
import { getCachedProject } from "@/server/projects-cache";
import { SITE, SITE_URL } from "@/lib/site";
import type { Project } from "@/types";

export const ensureStatic = "navigation";

export async function generateStaticParams() {
  const projects = await getAllProjects();
  return projects.map((project) => ({ slug: project.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const project = await getCachedProject(slug);

  if (!project) {
    return {
      title: "Project not found",
      description: "The project you are looking for does not exist.",
      alternates: { canonical: `/work/${slug}` },
    };
  }

  const url = `${SITE_URL}/work/${project.slug}`;

  return {
    title: project.title,
    description: project.summary,
    alternates: { canonical: `/work/${project.slug}` },
    openGraph: {
      type: "article",
      url,
      siteName: SITE.name,
      title: project.title,
      description: project.summary,
      locale: "en_GB",
    },
  };
}

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const project = await getCachedProject(slug);

  if (!project) notFound();

  const related: Project[] = [];
  for (const relatedSlug of project.related) {
    const relatedProject = await getCachedProject(relatedSlug);
    if (relatedProject) related.push(relatedProject);
  }

  return (
    <>
      <section className="relative overflow-hidden border-b border-line">
        <Scene variant="quiet" />
        <div className="shell relative z-10 flex flex-col gap-8 pb-16 pt-32 md:pb-20 md:pt-44">
          <Link
            href="/work"
            className="inline-flex min-h-11 w-fit items-center gap-2 font-display text-sm text-dim transition hover:text-accent"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            All projects
          </Link>

          <div className="flex flex-wrap items-center gap-3">
            <span className="font-mono text-xs tracking-[0.2em] text-faint">{project.index}</span>
            <span className="rounded-full border border-linestrong bg-accentsoft px-3 py-1 text-[0.7rem] tracking-wide text-accent">
              {project.categoryLabel}
            </span>
          </div>

          <h1 className="max-w-4xl text-4xl leading-[1.05] sm:text-5xl md:text-6xl">
            {project.title}
          </h1>

          <p className="max-w-2xl text-base leading-relaxed text-dim sm:text-lg">
            {project.summary}
          </p>

          <ul className="flex flex-wrap gap-2">
            {project.stack.map((tech) => (
              <li key={tech} className="rounded-full bg-accentsoft px-3 py-1 text-xs text-dim">
                {tech}
              </li>
            ))}
          </ul>

          <div className="panel relative aspect-[16/9] overflow-hidden rounded-3xl">
            <ProjectVisual project={project} sizes="(min-width: 1024px) 75vw, 100vw" />
          </div>
        </div>
      </section>

      <Section ariaLabelledBy="case-study-title" className="py-16 md:py-24">
        <div className="shell flex flex-col gap-16">
          <div className="flex flex-col gap-5">
            <p className="eyebrow">Case study</p>
            <h2 id="case-study-title" className="max-w-3xl text-3xl leading-[1.08] sm:text-4xl">
              How the project was put together
            </h2>
          </div>

          <CaseStudySection id="overview" kicker="Overview" title="The big picture">
            <CaseStudyParagraphs items={[project.overview]} />
          </CaseStudySection>

          <CaseStudySection
            id="problem"
            kicker="Problem / objective"
            title="What the project set out to solve"
          >
            <CaseStudyParagraphs items={[project.problem]} />
          </CaseStudySection>

          <CaseStudySection id="audience" kicker="Target audience" title="Who it is built for">
            <CaseStudyParagraphs items={[project.audience]} />
          </CaseStudySection>

          <div className="grid grid-cols-1 gap-12 lg:grid-cols-2">
            <CaseStudySection id="role" kicker="My role" title="Where I came in">
              <CaseStudyParagraphs items={[project.role]} />
            </CaseStudySection>

            <CaseStudySection id="services" kicker="Services delivered" title="What I handled">
              <CaseStudyList items={project.services} />
            </CaseStudySection>
          </div>

          <CaseStudySection id="tools" kicker="Tools & technologies" title="The stack used">
            <ul className="flex flex-wrap gap-2">
              {project.tools.map((tool) => (
                <li
                  key={tool}
                  className="rounded-full border border-line px-4 py-2 text-sm text-dim"
                >
                  {tool}
                </li>
              ))}
            </ul>
          </CaseStudySection>

          <div className="grid grid-cols-1 gap-12 lg:grid-cols-2">
            <CaseStudySection id="decisions" kicker="Design decisions" title="Choices that shaped it">
              <CaseStudyList items={project.designDecisions} />
            </CaseStudySection>

            <CaseStudySection id="implementation" kicker="Implementation details" title="How it was built">
              <CaseStudyList items={project.implementation} />
            </CaseStudySection>
          </div>

          <CaseStudySection id="sections" kicker="Sections" title="The screens, block by block">
            <CaseStudyGallery sections={project.sections} />
          </CaseStudySection>

          <CaseStudySection id="deliverables" kicker="Final deliverables" title="What was handed over">
            <CaseStudyList items={project.deliverables} />
          </CaseStudySection>

          <CaseStudySection id="results" kicker="Results" title="Outcomes">
            {project.results ? (
              <CaseStudyParagraphs items={[project.results]} />
            ) : (
              <CaseStudyNotice label="In progress">
                <p>
                  Verified outcome numbers for this project have not been published yet — I am
                  happy to walk through what was delivered and how it performed on a call.
                </p>
              </CaseStudyNotice>
            )}
          </CaseStudySection>

          <CaseStudySection id="lessons" kicker="Lessons learned" title="What it taught me">
            <CaseStudyList items={project.lessons} />
          </CaseStudySection>

          {related.length > 0 ? (
            <CaseStudySection id="related" kicker="Keep exploring" title="Related projects">
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                {related.map((relatedProject, index) => (
                  <ProjectCard
                    key={relatedProject.slug}
                    project={relatedProject}
                    index={index}
                  />
                ))}
              </div>
            </CaseStudySection>
          ) : null}

          <div className="panel flex flex-col gap-6 rounded-3xl p-7 sm:p-9">
            <div className="flex flex-col gap-4">
              <p className="eyebrow">Next step</p>
              <h2 className="text-3xl leading-[1.08] sm:text-4xl">
                Have a project like this in mind?
              </h2>
              <p className="max-w-2xl text-base leading-relaxed text-dim">
                Tell me what you are building — I will come back with a clear view on approach,
                scope and the first steps.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <ActionLink href="/contact">
                Start a Project
                <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
              </ActionLink>
              <ActionLink href={SITE.whatsappUrl} variant="ghost">
                <MessageCircle className="h-4 w-4" aria-hidden="true" />
                Chat on WhatsApp
              </ActionLink>
            </div>
          </div>
        </div>
      </Section>
    </>
  );
}
