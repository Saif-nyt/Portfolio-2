import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { FinalCta } from "@/components/sections/FinalCta";
import { ProjectExplorer } from "@/components/projects/ProjectExplorer";
import { PageHero } from "@/components/ui/PageHero";
import { Section } from "@/components/ui/Section";
import { VaultLocation } from "@/components/world/locations/VaultLocation";
import { getCachedProjects } from "@/server/projects-cache";

export const metadata: Metadata = {
  title: "Work",
  description:
    "Explore selected web development, e-commerce, dashboard and conversion-tracking projects — filter by discipline and open any project for the full case study.",
  alternates: { canonical: "/work" },
};

async function ProjectExplorerSection() {
  const projects = await getCachedProjects();

  return (
    <Section
      id="project-explorer"
      ariaLabelledBy="project-explorer-title"
      className="py-16 md:py-24"
    >
      <div className="shell flex flex-col gap-10">
        <h2 id="project-explorer-title" className="sr-only">
          All projects
        </h2>
        <ProjectExplorer projects={projects} />
      </div>
    </Section>
  );
}

export default function WorkPage() {
  return (
    <VaultLocation
      codex={
        <Suspense
          fallback={
            <Section className="py-16 md:py-24" ariaLabelledBy="project-explorer-title">
              <div className="shell">
                <p className="text-dim">Loading projects…</p>
              </div>
            </Section>
          }
        >
          <ProjectExplorerSection />
        </Suspense>
      }
      fallback={
        <>
          <PageHero
            eyebrow="ARTIFACT VAULT · PROJECTS"
            title="Explore the Projects"
            lead="Websites, storefronts, dashboards and measurement systems — filter by discipline and open any project for the full breakdown."
            scene="quiet"
          />
          <Suspense
            fallback={
              <Section className="py-16 md:py-24" ariaLabelledBy="project-explorer-title">
                <div className="shell">
                  <p className="text-dim">Loading projects…</p>
                </div>
              </Section>
            }
          >
            <ProjectExplorerSection />
          </Suspense>
          <Section tone="scene" className="border-t border-line">
            <div className="shell flex flex-col items-start gap-6 py-16 md:flex-row md:items-center md:justify-between md:py-20">
              <div className="flex max-w-2xl flex-col gap-4">
                <p className="eyebrow">Working together</p>
                <h2 className="text-3xl leading-[1.08] sm:text-4xl">
                  Like what you see? Let&apos;s talk about your project.
                </h2>
              </div>
              <Link href="/contact" className="btn-primary shrink-0">
                Start a Conversation
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>
          </Section>
          <FinalCta />
        </>
      }
    />
  );
}
