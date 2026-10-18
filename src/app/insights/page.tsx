import { Suspense } from "react";
import type { Metadata } from "next";
import { ArticleCard } from "@/components/insights/ArticleCard";
import { FinalCta } from "@/components/sections/FinalCta";
import { PageHero } from "@/components/ui/PageHero";
import { SanctuaryLocation } from "@/components/world/locations/SanctuaryLocation";
import { getCachedArticles } from "@/server/content-cache";

export const metadata: Metadata = {
  title: "Insights",
  description:
    "Practical field notes on web development, e-commerce and conversion tracking, written from real project work by T. M. Saiful Islam.",
  alternates: { canonical: "/insights" },
};

async function ArticleListSection() {
  const articles = [...(await getCachedArticles())].sort((a, b) =>
    b.publishedAt.localeCompare(a.publishedAt),
  );

  return (
    <section id="insights-list" aria-labelledby="insights-list-title" className="shell py-16 md:py-24">
      <div className="flex flex-col gap-4">
        <p className="eyebrow">The archive</p>
        <h2 id="insights-list-title" className="text-3xl leading-[1.08] sm:text-4xl">
          All Published Notes
        </h2>
      </div>
      {articles.length > 0 ? (
        <ul className="mt-10 grid gap-6 md:grid-cols-2">
          {articles.map((article, index) => (
            <li key={article.slug} className={index === 0 ? "md:col-span-2" : undefined}>
              <ArticleCard article={article} featured={index === 0} index={index} />
            </li>
          ))}
        </ul>
      ) : (
        <p
          role="status"
          className="panel mt-10 rounded-3xl p-10 text-center text-dim"
        >
          No field notes published yet. New insights are written from current project work —
          check back soon.
        </p>
      )}
    </section>
  );
}

export default function InsightsPage() {
  return (
    <SanctuaryLocation
      codex={
        <Suspense
          fallback={
            <section className="shell py-16 md:py-24" aria-labelledby="insights-list-title">
              <div className="flex flex-col gap-4">
                <p className="eyebrow">The archive</p>
                <h2 id="insights-list-title" className="text-3xl leading-[1.08] sm:text-4xl">
                  All Published Notes
                </h2>
              </div>
              <p className="mt-10 text-dim">Loading notes…</p>
            </section>
          }
        >
          <ArticleListSection />
        </Suspense>
      }
      fallback={
        <>
          <PageHero
            eyebrow="KNOWLEDGE SANCTUARY · INSIGHTS"
            title="Insights From the Field"
            lead="Technical notes on building, tracking and growing digital products — observations from real project work."
          />
          <Suspense
            fallback={
              <section className="shell py-16 md:py-24" aria-labelledby="insights-list-title">
                <div className="flex flex-col gap-4">
                  <p className="eyebrow">The archive</p>
                  <h2 id="insights-list-title" className="text-3xl leading-[1.08] sm:text-4xl">
                    All Published Notes
                  </h2>
                </div>
                <p className="mt-10 text-dim">Loading notes…</p>
              </section>
            }
          >
            <ArticleListSection />
          </Suspense>
          <FinalCta />
        </>
      }
    />
  );
}
