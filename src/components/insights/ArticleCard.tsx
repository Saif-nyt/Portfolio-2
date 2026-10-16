import Image from "next/image";
import Link from "next/link";
import { Reveal } from "@/components/animations/Reveal";
import { Fireflies } from "@/components/ui/Fireflies";
import { formatArticleDate } from "@/lib/format";
import type { Article } from "@/types";

interface ArticleCardProps {
  article: Article;
  featured?: boolean;
  index?: number;
  titleAs?: "h2" | "h3";
}

export function ArticleCard({
  article,
  featured = false,
  index = 0,
  titleAs: TitleTag = "h2",
}: ArticleCardProps) {
  return (
    <Reveal delay={index * 0.07} className="h-full">
      <article className="panel card-hover sheen group flex h-full flex-col gap-4 overflow-hidden rounded-3xl p-6 sm:p-7">
        <Fireflies count={4} />
        {article.cover ? (
          <div className="relative -mx-6 -mt-6 aspect-[16/9] overflow-hidden border-b border-line sm:-mx-7 sm:-mt-7">
            <Image
              src={article.cover}
              alt=""
              fill
              sizes="(min-width: 768px) 50vw, 100vw"
              className="object-cover"
            />
          </div>
        ) : null}
        <div className="flex flex-wrap items-center gap-3">
          <span className="rounded-full border border-linestrong bg-accentsoft px-3 py-1 text-[0.7rem] tracking-[0.16em] text-accent uppercase">
            {article.category}
          </span>
          <span className="font-mono text-[0.7rem] tracking-[0.16em] text-faint">
            {article.readingTime}
          </span>
        </div>

        <TitleTag
          className={
            featured ? "text-2xl leading-[1.15] sm:text-3xl" : "text-xl leading-[1.2] sm:text-2xl"
          }
        >
          <Link
            href={`/insights/${article.slug}`}
            className="transition-colors group-hover:text-accent"
            aria-label={`Read article: ${article.title}`}
          >
            {article.title}
          </Link>
        </TitleTag>

        <p
          className={
            featured ? "text-sm leading-relaxed text-dim sm:text-base" : "text-sm leading-relaxed text-dim"
          }
        >
          {article.summary}
        </p>

        <div className="mt-auto flex flex-wrap items-center gap-x-2 gap-y-1 border-t border-line pt-4 text-xs text-faint">
          <time dateTime={article.publishedAt}>{formatArticleDate(article.publishedAt)}</time>
          <span aria-hidden="true">·</span>
          <span>{article.author}</span>
        </div>
      </article>
    </Reveal>
  );
}
