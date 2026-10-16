import { Reveal, Stagger, StaggerItem } from "@/components/animations/Reveal";
import { ActionLink } from "@/components/ui/ActionLink";
import { Section } from "@/components/ui/Section";
import Image from "next/image";
import { getCachedSettings } from "@/server/content-cache";

const introduction =
  "I'm T. M. Saiful Islam, a web developer and digital growth specialist working across web development, e-commerce, performance marketing, and conversion tracking.";

const focus =
  "I enjoy understanding how technology, customer experience, and marketing work together. My focus is building digital experiences that look distinctive, function reliably, and help businesses make better decisions.";

const facts = ["1.5 years of experience", "100+ WordPress websites completed"];

export async function AboutDetails() {
  const { aboutCapabilities, avatar } = await getCachedSettings();
  return (
    <>
      <Section id="about-introduction" ariaLabelledBy="about-introduction-title" tone="panel">
        <div className="shell grid gap-12 py-20 md:py-28 lg:grid-cols-2 lg:items-start lg:gap-16">
          <div className="flex flex-col gap-8">
            <Reveal>
              <div className="flex flex-col gap-5">
                <p className="eyebrow">Professional introduction</p>
                <h2
                  id="about-introduction-title"
                  className="text-3xl leading-[1.08] sm:text-4xl md:text-5xl"
                >
                  Working Across Code, Commerce, and Measurement
                </h2>
              </div>
            </Reveal>

            <Reveal delay={0.06}>
              <div className="flex flex-col gap-4 text-base leading-relaxed text-dim sm:text-lg">
                <p>{introduction}</p>
                <p>{focus}</p>
              </div>
            </Reveal>

            <Reveal delay={0.12}>
              <div className="flex flex-col gap-4">
                <h3 className="eyebrow">At a glance</h3>
                <ul className="grid gap-3 sm:grid-cols-2">
                  {facts.map((fact, index) => (
                    <li key={fact} className="panel flex items-center gap-3 rounded-2xl px-4 py-3.5">
                      <span
                        aria-hidden="true"
                        className="anim-blink h-1.5 w-1.5 shrink-0 rounded-full bg-accent shadow-[0_0_12px_rgba(99,245,231,0.9)]"
                        style={{ animationDelay: `${index * 0.55}s` }}
                      />
                      <span className="font-display text-sm text-ink sm:text-base">{fact}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>

            <Reveal delay={0.16}>
              <div className="flex flex-col gap-4">
                <h3 className="eyebrow">Capabilities</h3>
                <ul className="flex flex-wrap gap-2">
                  {aboutCapabilities.map((capability) => (
                    <li
                      key={capability}
                      className="rounded-full border border-line bg-accentsoft px-3.5 py-1.5 text-xs font-medium text-ink sm:text-sm"
                    >
                      {capability}
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
          </div>

          <Reveal delay={0.1}>
            <figure className="relative">
              <div className="panel relative aspect-[4/5] overflow-hidden rounded-3xl">
                {avatar ? (
                  <Image
                    src={avatar}
                    alt="Portrait of T. M. Saiful Islam"
                    fill
                    sizes="(min-width: 1024px) 40vw, 100vw"
                    className="object-cover"
                  />
                ) : (
                  <>
                <div className="absolute inset-0 bg-[linear-gradient(155deg,rgba(99,245,231,0.16),rgba(22,70,63,0.45)_48%,rgba(7,17,15,0.92))]" />
                <svg
                  aria-hidden="true"
                  viewBox="0 0 400 500"
                  fill="none"
                  className="absolute inset-0 h-full w-full"
                >
                  <defs>
                    <linearGradient id="portrait-ring" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="rgba(99,245,231,0.7)" />
                      <stop offset="100%" stopColor="rgba(55,214,197,0.08)" />
                    </linearGradient>
                    <radialGradient id="portrait-glow" cx="0.5" cy="0.38" r="0.6">
                      <stop offset="0%" stopColor="rgba(99,245,231,0.32)" />
                      <stop offset="100%" stopColor="rgba(99,245,231,0)" />
                    </radialGradient>
                    <pattern id="portrait-grid" width="32" height="32" patternUnits="userSpaceOnUse">
                      <path d="M32 0H0V32" stroke="rgba(163,217,214,0.16)" strokeWidth="1" />
                    </pattern>
                  </defs>
                  <rect width="400" height="500" fill="url(#portrait-grid)" />
                  <circle cx="200" cy="190" r="170" fill="url(#portrait-glow)" />
                  <circle
                    cx="200"
                    cy="190"
                    r="150"
                    stroke="rgba(163,217,214,0.22)"
                    strokeWidth="1"
                    strokeDasharray="4 12"
                  />
                  <circle cx="200" cy="190" r="118" stroke="url(#portrait-ring)" strokeWidth="1.5" />
                  <path d="M0 420 Q200 356 400 420" stroke="rgba(99,245,231,0.35)" strokeWidth="1.5" />
                  <path d="M0 448 Q200 388 400 448" stroke="rgba(163,217,214,0.2)" strokeWidth="1" />
                </svg>
                <span
                  aria-hidden="true"
                  className="text-gradient absolute inset-0 grid place-items-center font-display text-6xl tracking-[0.18em] sm:text-7xl"
                >
                  SI
                </span>
                  </>
                )}
                <div className="pointer-events-none absolute inset-4 rounded-2xl border border-line" />
              </div>
              <figcaption className="sr-only">
                {avatar ? "Portrait of T. M. Saiful Islam" : "Portrait placeholder — photo to be added"}
              </figcaption>
            </figure>
          </Reveal>
        </div>
      </Section>

      <Section id="about-explore" ariaLabelledBy="about-explore-title">
        <div className="shell flex flex-col gap-6 py-16 md:py-20">
          <Reveal>
            <p className="eyebrow">Explore the ecosystem</p>
          </Reveal>
          <Reveal delay={0.06}>
            <h2
              id="about-explore-title"
              className="max-w-2xl text-2xl leading-[1.15] sm:text-3xl"
            >
              See Where the Work Fits Together
            </h2>
          </Reveal>
          <Stagger className="flex flex-wrap gap-3" stagger={0.08}>
            <StaggerItem>
              <ActionLink href="/services" variant="ghost">
                View services
              </ActionLink>
            </StaggerItem>
            <StaggerItem>
              <ActionLink href="/work" variant="ghost">
                Browse selected work
              </ActionLink>
            </StaggerItem>
          </Stagger>
        </div>
      </Section>
    </>
  );
}
