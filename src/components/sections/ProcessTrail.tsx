"use client";

import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import { useRef } from "react";
import { Reveal } from "@/components/animations/Reveal";
import { SectionHeading } from "@/components/ui/Section";
import type { ProcessStep } from "@/types";

/** Scene 5 — The Trail: work process revealed as an illuminated path. */
export function ProcessTrail({ steps }: { steps: ProcessStep[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start 78%", "end 62%"],
  });
  const scaleY = useTransform(scrollYProgress, [0, 1], [0.04, 1]);

  return (
    <section
      id="process"
      aria-labelledby="process-title"
      className="relative overflow-hidden border-y border-line bg-bgdeep py-24 md:py-32"
    >
      <div className="shell relative z-10">
        <SectionHeading
          id="process-title"
          eyebrow="Work process"
          title="From Idea to Launch."
          lead="A clear trail through five stages — visible from the start, whether or not anything is animating."
        />

        <div ref={ref} className="relative mt-14">
          <div
            aria-hidden="true"
            className="absolute bottom-4 left-7 top-4 w-px bg-line md:left-1/2"
          />
          {!reduceMotion ? (
            <motion.div
              aria-hidden="true"
              className="absolute bottom-4 left-7 top-4 w-px origin-top bg-gradient-to-b from-accent via-accentstrong to-transparent shadow-[0_0_16px_rgba(99,245,231,0.7)] md:left-1/2"
              style={{ scaleY }}
            />
          ) : null}

          <ol className="flex flex-col gap-10">
            {steps.map((step, index) => (
              <li key={step.number} className="relative pl-20 sm:pl-24">
                <Reveal delay={index * 0.04}>
                  <span
                    aria-hidden="true"
                    className="absolute left-0 top-0 grid h-14 w-14 place-items-center rounded-full border border-linestrong bg-panelsolid font-display text-sm text-accent shadow-[0_0_28px_-8px_rgba(99,245,231,0.9)]"
                  >
                    {step.number}
                  </span>
                  <div className="flex flex-col gap-2">
                    <h3 className="text-xl sm:text-2xl">{step.title}</h3>
                    <p className="max-w-xl text-sm leading-relaxed text-dim sm:text-base">
                      {step.body}
                    </p>
                  </div>
                </Reveal>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
