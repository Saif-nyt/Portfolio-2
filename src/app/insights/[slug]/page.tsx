import Image from "next/image";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Reveal } from "@/components/animations/Reveal";
import { ArticleBody } from "@/components/insights/ArticleBody";
import { ArticleCard } from "@/components/insights/ArticleCard";
import { Scene } from "@/components/environment/Scene";
import { FinalCta } from "@/components/sections/FinalCta";
import { getAllArticles } from "@/server/articles";
import { getCachedArticle } from "@/server/content-cache";
import { formatArticleDate } from "@/lib/format";
import { SITE_URL } from "@/lib/site";
import type { Article } from "@/types";

interface ArticlePageProps {
  params: Promise<{ slug: string }>;
}

export const ensureStatic = "navigation";

export async function generateStaticParams() {
  const articles = await getAllArticles();
  return articles.map((article) => ({ slug: article.slug }));
}

export async function generateMetadata({ params }: ArticlePageProps): Promise<Metadata> {
  const { slug } = await params;
  const article = await getCachedArticle(slug);

  if (!article) {
    return { title: "Article not found" };
  }

  return {
    title: article.title,
    description: article.summary,
    authors: [{ name: article.author }],
    alternates: { canonical: `/insights/${slug}` },
    openGraph: {
      type: "article",
      publishedTime: article.publishedAt,
      title: article.title,
      description: article.summary,
      url: `${SITE_URL}/insights/${slug}`,
    },
    twitter: {
      card: "summary",
      title: article.title,
      description: article.summary,
    },
  };
}

export default async function ArticlePage({ params }: ArticlePageProps) {
  const { slug } = await params;
  const article = await getCachedArticle(slug);

  if (!article) {
    notFound();
  }

  const related: Article[] = [];
  for (const relatedSlug of article.related) {
    const relatedArticle = await getCachedArticle(relatedSlug);
    if (relatedArticle) related.push(relatedArticle);
  }
  related.length = Math.min(related.length, 3);

  return (
    <>
      <header className="relative overflow-hidden border-b border-line">
        <Scene variant="quiet" />
        <div className="shell relative z-10 flex flex-col gap-5 pb-14 pt-32 md:pb-16 md:pt-40">
          <Reveal>
            <span className="inline-flex rounded-full border border-linestrong bg-accentsoft px-3 py-1 text-[0.7rem] tracking-[0.18em] text-accent uppercase">
              {article.category}
            </span>
          </Reveal>

          <Reveal delay={0.08}>
            <h1
              id="article-title"
              className="max-w-4xl text-3xl leading-[1.05] sm:text-4xl md:text-5xl"
            >
              {article.title}
            </h1>
          </Reveal>

          <Reveal delay={0.16}>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-faint">
              <span>{article.author}</span>
              <span aria-hidden="true">·</span>
              <time dateTime={article.publishedAt}>{formatArticleDate(article.publishedAt)}</time>
              <span aria-hidden="true">·</span>
              <span>{article.readingTime}</span>
            </div>
          </Reveal>

          <Reveal delay={0.24}>
            <p className="max-w-2xl text-base leading-relaxed text-dim sm:text-lg">
              {article.summary}
            </p>
          </Reveal>

          {article.cover ? (
            <Reveal delay={0.3}>
              <div className="panel relative aspect-[16/9] max-w-4xl overflow-hidden rounded-3xl">
                <Image
                  src={article.cover}
                  alt=""
                  fill
                  sizes="(min-width: 1024px) 75vw, 100vw"
                  className="object-cover"
                />
              </div>
            </Reveal>
          ) : null}
        </div>
      </header>

      <ArticleBody article={article} />

      {related.length > 0 ? (
        <section aria-labelledby="related-title" className="border-t border-line">
          <div className="shell py-16 md:py-20">
            <p className="eyebrow">Keep reading</p>
            <h2
              id="related-title"
              className="mt-4 text-3xl leading-[1.08] sm:text-4xl"
            >
              Related Articles
            </h2>

            <ul className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {related.map((relatedArticle, index) => (
                <li key={relatedArticle.slug}>
                  <ArticleCard article={relatedArticle} index={index} />
                </li>
              ))}
            </ul>
          </div>
        </section>
      ) : null}

      <FinalCta />
    </>
  );
}
