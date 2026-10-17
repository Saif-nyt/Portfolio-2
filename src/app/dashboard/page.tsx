import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, Database, FlaskConical, Radio } from "lucide-react";
import { SampleCatalog } from "@/components/dashboard/SampleCatalog";
import { PageHero } from "@/components/ui/PageHero";
import { Section } from "@/components/ui/Section";
import {
  getCachedArticles,
  getCachedProcessSteps,
  getCachedServices,
} from "@/server/content-cache";
import { getCachedProjects } from "@/server/projects-cache";

export const metadata: Metadata = {
  title: "Dashboard",
  description:
    "Internal-style demo dashboard: live counts from the JSON content store and a sample catalog proxy — a look at how the portfolio backend is wired.",
  robots: { index: false, follow: false },
  alternates: { canonical: "/dashboard" },
};

const API_ROUTES = [
  { path: "/api/projects", note: "Projects — list & create" },
  { path: "/api/projects/[slug]", note: "Project — read, update, delete" },
  { path: "/api/articles", note: "Articles — list & create" },
  { path: "/api/services", note: "Services — list & create" },
  { path: "/api/skills", note: "Skill groups" },
  { path: "/api/process", note: "Process steps" },
  { path: "/api/settings", note: "Site settings" },
  { path: "/api/media", note: "Media — list & upload" },
  { path: "/api/products", note: "Sample catalog proxy (DummyJSON)" },
  { path: "/api/meta/test", note: "CAPI dry-run (gated by META_TEST_MODE)" },
] as const;

export default async function DashboardPage() {
  const [projects, articles, services, processSteps] = await Promise.all([
    getCachedProjects(),
    getCachedArticles(),
    getCachedServices(),
    getCachedProcessSteps(),
  ]);

  const stats = [
    { label: "Projects", count: projects.length, href: "/work" },
    { label: "Articles", count: articles.length, href: "/insights" },
    { label: "Services", count: services.length, href: "/services" },
    { label: "Process steps", count: processSteps.length, href: "/about" },
  ] as const;

  const recentProjects = projects.slice(0, 5);

  return (
    <>
      <PageHero
        eyebrow="OPERATIONS"
        title="Content Dashboard"
        lead="A behind-the-scenes view of the JSON content store that powers this site — live counts, recent entries, the public API map and a sample-catalog proxy demo."
        scene="quiet"
      />

      <Section id="store-stats" ariaLabelledBy="store-stats-title" className="py-16 md:py-20">
        <div className="shell flex flex-col gap-10">
          <div className="flex flex-col gap-4">
            <p className="eyebrow">Content store</p>
            <h2 id="store-stats-title" className="max-w-2xl text-3xl leading-[1.08] sm:text-4xl">
              Everything on the site reads from <code className="text-accent">data/*.json</code>
            </h2>
            <p className="max-w-2xl text-base leading-relaxed text-dim">
              Pages render from cached reads; the API layer serves the same collections over HTTP
              with token-guarded writes. No database required.
            </p>
          </div>

          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat) => (
              <li key={stat.label}>
                <Link
                  href={stat.href}
                  className="panel card-hover flex h-full flex-col gap-3 rounded-3xl p-6"
                >
                  <Database className="h-4 w-4 text-accent" aria-hidden="true" />
                  <span className="font-display text-4xl font-semibold text-ink">{stat.count}</span>
                  <span className="text-sm text-dim">{stat.label}</span>
                </Link>
              </li>
            ))}
          </ul>

          <div className="grid gap-10 lg:grid-cols-2">
            <div className="flex flex-col gap-5">
              <p className="eyebrow">Recently published projects</p>
              <ul className="panel flex flex-col divide-y divide-line rounded-3xl">
                {recentProjects.map((project) => (
                  <li key={project.slug}>
                    <Link
                      href={`/work/${project.slug}`}
                      className="flex items-center justify-between gap-4 px-5 py-4 transition hover:bg-accentsoft"
                    >
                      <span className="flex min-w-0 flex-col gap-0.5">
                        <span className="truncate font-display text-sm text-ink">
                          {project.title}
                        </span>
                        <span className="font-mono text-xs text-faint">
                          {project.index} · {project.categoryLabel}
                        </span>
                      </span>
                      <ArrowUpRight
                        className="h-4 w-4 shrink-0 text-dim"
                        aria-hidden="true"
                      />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex flex-col gap-5">
              <p className="eyebrow">Public API map</p>
              <ul className="panel flex flex-col divide-y divide-line rounded-3xl">
                {API_ROUTES.map((route) => (
                  <li
                    key={route.path}
                    className="flex items-center justify-between gap-4 px-5 py-3.5"
                  >
                    <code className="truncate text-sm text-accent">{route.path}</code>
                    <span className="shrink-0 text-xs text-faint">{route.note}</span>
                  </li>
                ))}
              </ul>
              <p className="flex items-start gap-2 text-sm leading-relaxed text-faint">
                <Radio className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                <span>
                  Write endpoints require <code className="text-dim">ADMIN_API_TOKEN</code> as a
                  Bearer token; with the token unset they answer 503 rather than pretending to be
                  protected.
                </span>
              </p>
            </div>
          </div>
        </div>
      </Section>

      <Section
        id="sample-catalog"
        ariaLabelledBy="sample-catalog-title"
        className="border-t border-line py-16 md:py-20"
      >
        <div className="shell flex flex-col gap-10">
          <div className="flex flex-col gap-4">
            <p className="eyebrow">Proxy demo</p>
            <h2 id="sample-catalog-title" className="max-w-2xl text-3xl leading-[1.08] sm:text-4xl">
              Sample catalog with loading &amp; error states
            </h2>
          </div>
          <SampleCatalog />
        </div>
      </Section>

      <Section tone="scene" className="border-t border-line">
        <div className="shell flex flex-col items-start gap-6 py-16 md:flex-row md:items-center md:justify-between md:py-20">
          <div className="flex max-w-2xl flex-col gap-4">
            <p className="eyebrow">Test harness</p>
            <h2 className="text-3xl leading-[1.08] sm:text-4xl">
              Meta CAPI dry-run, when you need it
            </h2>
            <p className="text-base leading-relaxed text-dim">
              Set <code className="text-accent">META_TEST_MODE=1</code> and POST an event payload
              to <code className="text-accent">/api/meta/test</code> — it validates the event the
              way a CAPI integration would and echoes the exact request body that would be sent,
              without contacting Meta.
            </p>
          </div>
          <a
            href="https://developers.facebook.com/docs/marketing-api/conversions-api"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-ghost shrink-0"
          >
            <FlaskConical className="h-4 w-4" aria-hidden="true" />
            CAPI docs
          </a>
        </div>
      </Section>
    </>
  );
}
