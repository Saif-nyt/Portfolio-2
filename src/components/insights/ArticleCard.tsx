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

/**
 * Deterministic generated cover for articles that have no uploaded image —
 * keeps every card visually complete without inventing a photograph.
 */
function GeneratedCover({ seed, label }: { seed: string; label: string }) {
  const hash = Array.from(seed).reduce((total, char) => total + char.charCodeAt(0), 0);
  const nodes = [0, 1, 2, 3, 4].map((i) => ({
    x: 14 + ((hash + i * 37) % 72),
    y: 20 + ((hash * (i + 2) + i * 53) % 58),
  }));

  return (
    <svg
      viewBox="0 0 800 450"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
      className="block h-full w-full"
    >
      <rect width="800" height="450" fill="#07110F" />
      <g stroke="#63F5E7" strokeOpacity="0.08">
        {Array.from({ length: 9 }).map((_, i) => (
          <line key={`v${i}`} x1={(i + 1) * 80} y1="0" x2={(i + 1) * 80} y2="450" />
        ))}
        {Array.from({ length: 5 }).map((_, i) => (
          <line key={`h${i}`} x1="0" y1={(i + 1) * 75} x2="800" y2={(i + 1) * 75} />
        ))}
      </g>
      <g stroke="#63F5E7" strokeOpacity="0.35" strokeWidth="1.5">
        {nodes.slice(0, -1).map((node, i) => (
          <line key={i} x1={node.x * 8} y1={node.y * 5} x2={nodes[i + 1].x * 8} y2={nodes[i + 1].y * 5} />
        ))}
      </g>
      {nodes.map((node, i) => (
        <circle
          key={i}
          cx={node.x * 8}
          cy={node.y * 5}
          r={i === 0 ? 10 : 6}
          fill={i === 0 ? "#63F5E7" : "#0B1B19"}
          stroke="#63F5E7"
          strokeOpacity="0.7"
        />
      ))}
      <text
        x="40"
        y="410"
        fill="#A3D9D6"
        fillOpacity="0.5"
        fontFamily="monospace"
        fontSize="20"
        letterSpacing="4"
      >
        {label.toUpperCase()}
      </text>
    </svg>
  );
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
        ) : (
          <div className="relative -mx-6 -mt-6 aspect-[16/9] overflow-hidden border-b border-line sm:-mx-7 sm:-mt-7">
            <GeneratedCover seed={article.slug} label={article.category} />
          </div>
        )}
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
