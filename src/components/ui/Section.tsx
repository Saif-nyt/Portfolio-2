import type { ReactNode } from "react";

interface SectionProps {
  id?: string;
  children: ReactNode;
  className?: string;
  ariaLabelledBy?: string;
  /**
   * "solid" keeps the flat page background, "scene" adds the cinematic
   * vertical veil so neighbouring environments blend into one world.
   */
  tone?: "solid" | "scene" | "panel";
  as?: "section" | "div" | "article";
}

export function Section({
  id,
  children,
  className = "",
  ariaLabelledBy,
  tone = "solid",
  as: Tag = "section",
}: SectionProps) {
  const toneClass =
    tone === "scene" ? "relative scene-veil" : tone === "panel" ? "relative bg-bgdeep" : "relative";

  return (
    <Tag
      id={id}
      aria-labelledby={ariaLabelledBy}
      className={`${toneClass} overflow-hidden ${className}`}
    >
      {children}
    </Tag>
  );
}

interface SectionHeadingProps {
  id: string;
  eyebrow?: string;
  title: ReactNode;
  lead?: string;
  align?: "left" | "center";
  className?: string;
}

export function SectionHeading({
  id,
  eyebrow,
  title,
  lead,
  align = "left",
  className = "",
}: SectionHeadingProps) {
  const alignment = align === "center" ? "text-center mx-auto items-center" : "text-left items-start";

  return (
    <div className={`flex flex-col gap-5 ${alignment} ${className}`}>
      {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
      <h2 id={id} className="text-3xl leading-[1.08] sm:text-4xl md:text-5xl">
        {title}
      </h2>
      {lead ? (
        <p className="max-w-2xl text-base leading-relaxed text-dim sm:text-lg">{lead}</p>
      ) : null}
    </div>
  );
}
