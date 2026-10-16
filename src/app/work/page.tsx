import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ProjectExplorer } from "@/components/projects/ProjectExplorer";
import { FinalCta } from "@/components/sections/FinalCta";
import { Section } from "@/components/ui/Section";
import { PageHero } from "@/components/ui/PageHero";
import { getCachedProjects } from "@/server/projects-cache";

export const metadata: Metadata = {
  title: "Work",
  description:
    "Explore selected web development, WordPress, Shopify, marketing and conversion tracking projects — filter by discipline and open any project for the full case study.",
  alternates: { canonical: "/work" },
};

export default async function WorkPage() {
  const projects = await getCachedProjects();

  return (
    <>
      <PageHero
        eyebrow="PORTFOLIO"
        title="Explore the Projects"
        lead="Websites, storefronts, dashboards and measurement systems — filter by discipline and open any project for the full breakdown of the thinking behind it."
        scene="quiet"
      >
      </PageHero>

      <Section id="project-explorer" ariaLabelledBy="project-explorer-title" className="py-16 md:py-24">
        <div className="shell flex flex-col gap-10">
          <div className="flex flex-col gap-4">
            <p className="eyebrow">Browse the work</p>
            <h2 id="project-explorer-title" className="max-w-2xl text-3xl leading-[1.08] sm:text-4xl">
              Filter by the discipline you need
            </h2>
          </div>

          <ProjectExplorer projects={projects} />
        </div>
      </Section>

      <Section tone="scene" className="border-t border-line">
        <div className="shell flex flex-col items-start gap-6 py-16 md:flex-row md:items-center md:justify-between md:py-20">
          <div className="flex max-w-2xl flex-col gap-4">
            <p className="eyebrow">Working together</p>
            <h2 className="text-3xl leading-[1.08] sm:text-4xl">
              Like what you see? Let&apos;s talk about your project.
            </h2>
            <p className="text-base leading-relaxed text-dim">
              Share your goals and constraints — you&apos;ll get an honest read on scope, timeline
              and the smartest place to start.
            </p>
          </div>
          <Link href="/contact" className="btn-primary shrink-0">
            Start a Conversation
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      </Section>

      <FinalCta />
    </>
  );
}
