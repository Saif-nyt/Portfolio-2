import type { ReactNode } from "react";
import { Reveal } from "@/components/animations/Reveal";

interface CaseStudySectionProps {
  id: string;
  title: string;
  kicker?: string;
  lead?: string;
  children: ReactNode;
  className?: string;
}

export function CaseStudySection({
  id,
  title,
  kicker,
  lead,
  children,
  className = "",
}: CaseStudySectionProps) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className={`flex flex-col gap-5 ${className}`}>
      {kicker ? <p className="eyebrow">{kicker}</p> : null}
      <h2 id={`${id}-title`} className="text-2xl leading-[1.1] sm:text-3xl">
        {title}
      </h2>
      {lead ? <p className="max-w-3xl text-base leading-relaxed text-dim">{lead}</p> : null}
      <div className="flex flex-col gap-4">{children}</div>
    </section>
  );
}

export function CaseStudyList({ items }: { items: string[] }) {
  if (items.length === 0) return null;

  return (
    <ul className="flex flex-col gap-3">
      {items.map((item, itemIndex) => (
        <li key={item} className="flex gap-3 break-words text-base leading-relaxed text-dim">
          <span
            aria-hidden="true"
            className="anim-blink-gentle mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent"
            style={{ animationDelay: `${itemIndex * 0.4}s` }}
          />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

export function CaseStudyParagraphs({ items }: { items: string[] }) {
  if (items.length === 0) return null;

  return (
    <div className="flex max-w-3xl flex-col gap-4">
      {items.map((item) => (
        <p key={item} className="break-words text-base leading-relaxed text-dim">
          {item}
        </p>
      ))}
    </div>
  );
}

export function CaseStudyNotice({ children, label }: { children: ReactNode; label: string }) {
  return (
    <div role="note" className="panel flex flex-col gap-3 rounded-3xl border-linestrong p-6 sm:p-7">
      <p className="eyebrow">{label}</p>
      <div className="flex flex-col gap-3 text-base leading-relaxed text-dim">{children}</div>
    </div>
  );
}

export function CaseStudyGallery({ sections }: { sections: { label: string; body: string[] }[] }) {
  if (sections.length === 0) return null;

  return (
    <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
      {sections.map((section) => (
        <Reveal key={section.label} className="panel flex h-full flex-col gap-3 rounded-3xl p-6">
          <h3 className="text-lg text-ink">{section.label}</h3>
          <ul className="flex flex-col gap-2">
            {section.body.map((line) => (
              <li key={line} className="break-words text-sm leading-relaxed text-dim">
                {line}
              </li>
            ))}
          </ul>
        </Reveal>
      ))}
    </div>
  );
}
