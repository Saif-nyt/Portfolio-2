"use client";

import { useState } from "react";
import { Reveal } from "@/components/animations/Reveal";
import { SectionHeading } from "@/components/ui/Section";
import type { SkillGroup } from "@/types";

/**
 * Scene 3 — The Ecosystem: an interconnected skill map.
 * The interactive map shows on desktop; a static, fully readable grid is
 * rendered for small screens and under prefers-reduced-motion (CSS decides
 * which one is visible, so nothing depends on JS availability).
 */
export function SkillsEcosystem({ groups }: { groups: SkillGroup[] }) {
  const [activeId, setActiveId] = useState(groups[0].id);
  const active = groups.find((group) => group.id === activeId) ?? groups[0];

  return (
    <section
      id="skills"
      aria-labelledby="skills-title"
      className="relative overflow-hidden border-y border-line bg-bgdeep py-24 md:py-32"
    >
      <div className="shell relative z-10">
        <SectionHeading
          id="skills-title"
          eyebrow="The ecosystem"
          title="Capabilities, Connected."
          lead="Four regions of one system — development, commerce, advertising and measurement. Hover or focus a region to illuminate it."
        />

        <div className="mt-12 grid gap-6 lg:grid-cols-2">
          <div className="skills-map relative h-[26rem] overflow-hidden rounded-3xl border border-line bg-panel md:h-[32rem]">
            <div
              aria-hidden="true"
              className="absolute inset-0"
              style={{
                backgroundImage:
                  "linear-gradient(rgba(163,217,214,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(163,217,214,0.06) 1px, transparent 1px)",
                backgroundSize: "48px 48px",
                maskImage: "radial-gradient(80% 80% at 50% 50%, black 30%, transparent 100%)",
                WebkitMaskImage: "radial-gradient(80% 80% at 50% 50%, black 30%, transparent 100%)",
              }}
            />

            <svg
              className="absolute inset-0 h-full w-full"
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
              aria-hidden="true"
              focusable="false"
            >
              {groups.map((group) => (
                <g key={group.id}>
                  <line
                    x1="50"
                    y1="50"
                    x2={group.x}
                    y2={group.y}
                    vectorEffect="non-scaling-stroke"
                    stroke={
                      group.id === activeId ? "rgba(99,245,231,0.85)" : "rgba(163,217,214,0.28)"
                    }
                    strokeWidth={group.id === activeId ? 1.6 : 1}
                    className={group.id === activeId ? "anim-ants" : undefined}
                  />
                  <circle
                    cx={group.x}
                    cy={group.y}
                    r="0.7"
                    fill={group.id === activeId ? "#63F5E7" : "rgba(163,217,214,0.5)"}
                  />
                </g>
              ))}
              <circle cx="50" cy="50" r="1.6" fill="none" stroke="rgba(99,245,231,0.7)" strokeWidth="1" vectorEffect="non-scaling-stroke" />
            </svg>

            <span
              className="absolute left-1/2 top-1/2 hidden -translate-x-1/2 -translate-y-1/2 rounded-full border border-linestrong bg-[var(--veil)] px-3 py-1 font-mono text-[0.6rem] tracking-[0.2em] text-accent backdrop-blur-md sm:block"
              aria-hidden="true"
            >
              SKILLS
            </span>

            <ul className="absolute inset-0">
              {groups.map((group) => {
                const isActive = group.id === activeId;
                return (
                  <li
                    key={group.id}
                    className="absolute w-[9.5rem] -translate-x-1/2 -translate-y-1/2 sm:w-48"
                    style={{ left: `${group.x}%`, top: `${group.y}%` }}
                  >
                    <button
                      type="button"
                      aria-pressed={isActive}
                      onMouseEnter={() => setActiveId(group.id)}
                      onFocus={() => setActiveId(group.id)}
                      onClick={() => setActiveId(group.id)}
                      className={`w-full rounded-2xl border px-3.5 py-3 text-left backdrop-blur-md transition duration-300 ${
                        isActive
                          ? "border-linestrong bg-[var(--veil)] shadow-[0_0_36px_-12px_rgba(99,245,231,0.85)]"
                          : "border-line bg-[var(--veil)] hover:border-linestrong"
                      }`}
                    >
                      <span
                        className={`block font-display text-sm transition ${
                          isActive ? "text-accent" : "text-ink"
                        }`}
                      >
                        {group.title}
                      </span>
                      <span className="mt-0.5 block font-mono text-[0.62rem] tracking-widest text-faint">
                        {group.items.length} capabilities
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>

          <div className="flex flex-col justify-center">
            <Reveal key={active.id} delay={0.05} y={16}>
              <div className="panel flex h-full flex-col gap-5 rounded-3xl p-6 sm:p-8">
                <div className="flex items-center gap-3">
                  <span
                    aria-hidden="true"
                    className="anim-blink h-2 w-2 rounded-full bg-accent shadow-[0_0_14px_rgba(99,245,231,0.9)]"
                  />
                  <p className="eyebrow">{active.title}</p>
                </div>
                <p className="text-base leading-relaxed text-dim">{active.blurb}</p>
                <ul className="grid gap-2.5">
                  {active.items.map((item, index) => (
                    <li
                      key={item.name}
                      className="flex items-start gap-3 rounded-xl border border-line bg-[color-mix(in_srgb,var(--panel-solid)_55%,transparent)] px-4 py-3 text-sm text-ink"
                    >
                      <span
                        aria-hidden="true"
                        className="anim-blink mt-1.5 h-1.5 w-1.5 shrink-0 rotate-45 bg-accent shadow-[0_0_10px_rgba(99,245,231,0.9)]"
                        style={{ animationDelay: `${index * 0.45}s` }}
                      />
                      {item.name}
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
          </div>
        </div>

        <div className="skills-static mt-12 gap-5 sm:grid-cols-2">
          {groups.map((group, index) => (
            <div key={group.id} className="panel flex h-full flex-col gap-4 rounded-3xl p-6">
                <p className="eyebrow">{group.title}</p>
                <p className="text-sm leading-relaxed text-dim">{group.blurb}</p>
                <ul className="mt-auto grid gap-2">
                  {group.items.map((item, itemIndex) => (
                    <li key={item.name} className="flex items-start gap-2.5 text-sm text-ink">
                      <span
                        aria-hidden="true"
                        className="anim-blink mt-1.5 h-1.5 w-1.5 shrink-0 rotate-45 bg-accent"
                        style={{ animationDelay: `${itemIndex * 0.45}s` }}
                      />
                      {item.name}
                    </li>
                  ))}
                </ul>
                <span className="font-mono text-[0.62rem] tracking-[0.2em] text-faint">
                  0{index + 1}
                </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
