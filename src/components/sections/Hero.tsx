import { ArrowDown, MessageCircle } from "lucide-react";
import { Reveal } from "@/components/animations/Reveal";
import { Scene } from "@/components/environment/Scene";
import { DialogueTicker } from "@/components/sections/DialogueTicker";
import { ActionLink } from "@/components/ui/ActionLink";
import { CountUp } from "@/components/ui/CountUp";
import { SITE } from "@/lib/site";

/** Scene 1 — Arrival: the cinematic full-screen opening. */
export function Hero() {
  return (
    <section
      aria-labelledby="hero-title"
      className="relative flex min-h-[100svh] flex-col justify-center overflow-hidden"
    >
      <Scene variant="arrival" />

      <div
        className="pointer-events-none absolute inset-0"
        aria-hidden="true"
        style={{
          background:
            "radial-gradient(75% 70% at 26% 52%, color-mix(in srgb, var(--bg) 82%, transparent), transparent 78%)",
        }}
      />

      <div className="shell relative z-10 flex flex-col gap-7 pb-28 pt-36 md:pb-32 md:pt-44">
        <Reveal>
          <p className="eyebrow flex items-center gap-3">
            <span aria-hidden="true" className="anim-grow h-px w-10 bg-accent" />
            {SITE.eyebrow}
          </p>
        </Reveal>

        <Reveal delay={0.12}>
          <h1
            id="hero-title"
            className="max-w-5xl text-[2.6rem] leading-[1.03] tracking-tight sm:text-6xl md:text-7xl lg:text-[5rem]"
          >
            Building Digital Experiences{" "}
            <span className="text-gradient">Beyond the Ordinary.</span>
          </h1>
        </Reveal>

        <Reveal delay={0.24}>
          <p className="max-w-2xl text-base leading-relaxed text-dim sm:text-lg">
            I&apos;m T. M. Saiful Islam — a web developer and digital growth specialist helping
            businesses build better websites, strengthen their online presence, and measure what
            matters.
          </p>
        </Reveal>

        <Reveal delay={0.34}>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <ActionLink href="/work">Explore My Work</ActionLink>
            <ActionLink href="/contact" variant="ghost">
              Let&apos;s Work Together
            </ActionLink>
            <ActionLink href={SITE.whatsappUrl} variant="ghost" className="hidden lg:inline-flex">
              <MessageCircle className="h-4 w-4" aria-hidden="true" />
              Chat on WhatsApp
            </ActionLink>
          </div>
        </Reveal>

        <Reveal delay={0.44}>
          <p className="anim-bob flex flex-wrap items-center gap-x-3 gap-y-2 rounded-full border border-line bg-[var(--veil)] px-5 py-2.5 font-display text-xs text-dim backdrop-blur-md sm:text-sm">
            <span className="text-accent">
              <CountUp value={SITE.projectsCompleted} /> WordPress Websites Completed
            </span>
            <span
              aria-hidden="true"
              className="anim-blink h-1 w-1 rounded-full bg-line"
              style={{ animationDelay: "1.2s" }}
            />
            <span>
              <CountUp value={SITE.experience} /> of Experience
            </span>
          </p>
        </Reveal>

        <Reveal delay={0.52}>
          <DialogueTicker />
        </Reveal>
      </div>

      <a
        href="#about"
        className="group absolute inset-x-0 bottom-6 z-10 mx-auto flex w-fit flex-col items-center gap-2 rounded-full px-4 py-2 text-dim transition hover:text-accent"
        aria-label="Scroll to explore the rest of the site"
      >
        <span className="font-mono text-[0.65rem] tracking-[0.28em] uppercase">Explore</span>
        <ArrowDown className="anim-nudge h-4 w-4" aria-hidden="true" />
      </a>
    </section>
  );
}
