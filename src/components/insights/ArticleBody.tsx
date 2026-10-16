import { TableOfContents } from "@/components/insights/TableOfContents";
import type { Article } from "@/types";

interface ArticleBodyProps {
  article: Article;
}

export function ArticleBody({ article }: ArticleBodyProps) {
  const headings = article.sections.map((section, index) => ({
    id: `section-${index + 1}`,
    label: section.heading,
  }));

  return (
    <article aria-labelledby="article-title" className="shell py-14 md:py-20">
      <div className="grid gap-10 lg:grid-cols-[15rem_minmax(0,1fr)] lg:gap-14">
        <TableOfContents headings={headings} />

        <div className="flex max-w-[65ch] flex-col gap-10">
          {article.sections.map((section, index) => {
            const id = `section-${index + 1}`;

            return (
              <section
                key={id}
                aria-labelledby={id}
                className="flex flex-col gap-4 scroll-mt-28"
              >
                <h2 id={id} className="scroll-mt-28 text-2xl leading-snug text-ink sm:text-3xl">
                  {section.heading}
                </h2>

                {section.paragraphs.map((paragraph, paragraphIndex) => (
                  <p
                    key={`${id}-p-${paragraphIndex}`}
                    className="text-base leading-relaxed text-dim"
                  >
                    {paragraph}
                  </p>
                ))}

                {section.list ? (
                  <ul className="mt-1 flex flex-col gap-2.5 rounded-2xl border border-line bg-accentsoft p-5">
                    {section.list.map((item, itemIndex) => (
                      <li
                        key={`${id}-li-${itemIndex}`}
                        className="flex items-start gap-3 text-sm leading-relaxed text-dim sm:text-base"
                      >
                        <span
                          aria-hidden="true"
                          className="anim-blink-gentle mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent"
                          style={{ animationDelay: `${itemIndex * 0.4}s` }}
                        />
                        {item}
                      </li>
                    ))}
                  </ul>
                ) : null}
              </section>
            );
          })}

          <div className="border-t border-line pt-6">
            <p className="eyebrow mb-2">About the author</p>
            <p className="text-sm leading-relaxed text-dim">
              {article.author}, full-stack web developer &amp; digital growth specialist.
            </p>
          </div>
        </div>
      </div>
    </article>
  );
}
