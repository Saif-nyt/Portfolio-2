import type { ReactNode } from "react";
import { Reveal } from "@/components/animations/Reveal";
import { Scene, type SceneVariant } from "@/components/environment/Scene";

interface PageHeroProps {
  eyebrow: string;
  title: ReactNode;
  lead?: string;
  scene?: SceneVariant;
  children?: ReactNode;
}

/** Shared cinematic intro for interior routes. */
export function PageHero({ eyebrow, title, lead, scene = "quiet", children }: PageHeroProps) {
  return (
    <section className="relative overflow-hidden border-b border-line">
      <Scene variant={scene} />
      <div className="shell relative z-10 flex flex-col gap-6 pb-16 pt-32 md:pb-20 md:pt-44">
        <Reveal>
          <p className="eyebrow">{eyebrow}</p>
        </Reveal>
        <Reveal delay={0.08}>
          <h1 className="max-w-4xl text-4xl leading-[1.05] sm:text-5xl md:text-6xl">{title}</h1>
        </Reveal>
        {lead ? (
          <Reveal delay={0.16}>
            <p className="max-w-2xl text-base leading-relaxed text-dim sm:text-lg">{lead}</p>
          </Reveal>
        ) : null}
        {children}
      </div>
    </section>
  );
}
