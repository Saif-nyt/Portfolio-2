import type { Metadata } from "next";
import { ArticleCard } from "@/components/insights/ArticleCard";
import { FinalCta } from "@/components/sections/FinalCta";
import { PageHero } from "@/components/ui/PageHero";
import { getCachedArticles } from "@/server/content-cache";

export const metadata: Metadata = {
  title: "Insights",
  description:
    "Practical field notes on web development, e-commerce and conversion tracking, written from real project work by T. M. Saiful Islam.",
  alternates: { canonical: "/insights" },
};

export default async function InsightsPage() {
  const articles = await getCachedArticles();

  return (
    <>
      <PageHero
        eyebrow="FIELD NOTES"
        title="Insights From the Field"
        lead="Technical notes on building, tracking and growing digital products — observations from real project work, written by T. M. Saiful Islam."
      />

      <section aria-labelledby="insights-list-title" className="shell py-16 md:py-24">
        <div className="flex flex-col gap-4">
          <p className="eyebrow">The archive</p>
          <h2 id="insights-list-title" className="text-3xl leading-[1.08] sm:text-4xl">
            All Published Notes
          </h2>
        </div>

        <ul className="mt-10 grid gap-6 md:grid-cols-2">
          {articles.map((article, index) => (
            <li key={article.slug} className={index === 0 ? "md:col-span-2" : undefined}>
              <ArticleCard article={article} featured={index === 0} index={index} />
            </li>
          ))}
        </ul>
      </section>

      <FinalCta />
    </>
  );
}
