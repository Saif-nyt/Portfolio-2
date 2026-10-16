interface TableOfContentsProps {
  headings: { id: string; label: string }[];
}

export function TableOfContents({ headings }: TableOfContentsProps) {
  return (
    <nav aria-label="Table of contents" className="lg:sticky lg:top-28 lg:self-start">
      <p className="eyebrow mb-4">In this article</p>
      <ol className="flex flex-col gap-3 border-l border-line pl-4 text-sm">
        {headings.map((heading) => (
          <li key={heading.id}>
            <a href={`#${heading.id}`} className="text-dim transition-colors hover:text-accent">
              {heading.label}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}
