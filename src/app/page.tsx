import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Reveal } from "@/components/animations/Reveal";
import { GameMount } from "@/components/game/GameMount";
import { ArticleCard } from "@/components/insights/ArticleCard";
import { ProjectCard } from "@/components/projects/ProjectCard";
import { AboutPreview } from "@/components/sections/AboutPreview";
import { FinalCta } from "@/components/sections/FinalCta";
import { Hero } from "@/components/sections/Hero";
import { ProcessTrail } from "@/components/sections/ProcessTrail";
import { ServiceCard } from "@/components/services/ServiceCard";
import { SkillsEcosystem } from "@/components/skills/SkillsEcosystem";
import { ActionLink } from "@/components/ui/ActionLink";
import { SectionHeading } from "@/components/ui/Section";
import {
  getCachedArticles,
  getCachedProcessSteps,
  getCachedServices,
  getCachedSkillGroups,
} from "@/server/content-cache";
import { getCachedProjects } from "@/server/projects-cache";

export default async function HomePage() {
  const [projects, articles, services, skillGroups, processSteps] = await Promise.all([
    getCachedProjects(),
    getCachedArticles(),
    getCachedServices(),
    getCachedSkillGroups(),
    getCachedProcessSteps(),
  ]);
  const featuredProjects = projects.slice(0, 3);
  const latestArticles = articles.slice(0, 3);

  return (
    <>
      <GameMount />
      <Hero />
      <AboutPreview />
      <SkillsEcosystem groups={skillGroups} />

      <section
        id="services"
        aria-labelledby="services-title"
        className="relative overflow-hidden py-24 md:py-32"
      >
        <div className="shell relative z-10 flex flex-col gap-12">
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <SectionHeading
              id="services-title"
              eyebrow="Services"
              title="What I Build."
              lead="Illuminated structures in one ecosystem — each service is a discipline, and they compose into larger engagements."
            />
            <Reveal delay={0.1}>
              <Link
                href="/services"
                className="inline-flex items-center gap-2 rounded-full font-display text-sm text-accent underline-offset-4 hover:underline"
              >
                View all services
                <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </Reveal>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {services.map((service, index) => (
              <ServiceCard key={service.slug} service={service} index={index} />
            ))}
          </div>
        </div>
      </section>

      <section
        id="work"
        aria-labelledby="work-title"
        className="relative overflow-hidden border-y border-line bg-bgdeep py-24 md:py-32"
      >
        <div className="shell relative z-10 flex flex-col gap-12">
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <SectionHeading
              id="work-title"
              eyebrow="Selected work"
              title="Projects From the Field."
              lead="Commerce builds, dashboards, measurement systems and creative work — each documented from the problem it solved to how it was shipped."
            />
            <Reveal delay={0.1}>
              <ActionLink href="/work" variant="ghost">
                Explore all projects
              </ActionLink>
            </Reveal>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            {featuredProjects.map((project, index) => (
              <ProjectCard
                key={project.slug}
                project={project}
                index={index}
                featured={index === 0}
              />
            ))}
          </div>
        </div>
      </section>

      <ProcessTrail steps={processSteps} />

      <section
        id="insights"
        aria-labelledby="insights-title"
        className="relative overflow-hidden py-24 md:py-32"
      >
        <div className="shell relative z-10 flex flex-col gap-12">
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <SectionHeading
              id="insights-title"
              eyebrow="Field notes"
              title="Insights From the Explorer."
              lead="Practical writing on web development, e-commerce platforms, Meta Ads and conversion tracking."
            />
            <Reveal delay={0.1}>
              <Link
                href="/insights"
                className="inline-flex items-center gap-2 rounded-full font-display text-sm text-accent underline-offset-4 hover:underline"
              >
                Read all insights
                <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </Reveal>
          </div>

          <div className="grid gap-5 md:grid-cols-3">
            {latestArticles.map((article, index) => (
              <ArticleCard key={article.slug} article={article} index={index} titleAs="h3" />
            ))}
          </div>
        </div>
      </section>

      <FinalCta />
    </>
  );
}
