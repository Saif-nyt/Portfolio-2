import Link from "next/link";
import { Reveal, Stagger, StaggerItem } from "@/components/animations/Reveal";
import { Scene } from "@/components/environment/Scene";
import { ActionLink } from "@/components/ui/ActionLink";
import { CountUp } from "@/components/ui/CountUp";
import { SectionHeading } from "@/components/ui/Section";
import { getCachedSettings } from "@/server/content-cache";
import { SITE } from "@/lib/site";

const FACTS = [
  { value: SITE.experience, label: "of experience" },
  { value: SITE.projectsCompleted, label: "projects completed" },
];

/** Scene 2 — Discover the Developer: a quieter environment. */
export async function AboutPreview() {
  const { aboutCapabilities } = await getCachedSettings();
  return (
    <section id="about" aria-labelledby="about-title" className="relative overflow-hidden py-24 md:py-32">
      <Scene variant="quiet" />

      <div className="shell relative z-10 grid gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
        <div className="flex flex-col gap-7">
          <SectionHeading
            id="about-title"
            eyebrow="Discover the developer"
            title="Curious by Nature. Driven to Build."
          />

          <Reveal delay={0.1}>
            <div className="flex flex-col gap-4 text-base leading-relaxed text-dim sm:text-lg">
              <p>
                I&apos;m T. M. Saiful Islam, a web developer and digital growth specialist working
                across web development, e-commerce, performance marketing, and conversion tracking.
              </p>
              <p>
                I enjoy understanding how technology, customer experience, and marketing work
                together. My focus is building digital experiences that look distinctive, function
                reliably, and help businesses make better decisions.
              </p>
            </div>
          </Reveal>

          <Reveal delay={0.18}>
            <div className="flex flex-wrap gap-3">
              <ActionLink href="/about" variant="ghost">
                More About Me
              </ActionLink>
              <ActionLink href="/work">See the Work</ActionLink>
            </div>
          </Reveal>
        </div>

        <Stagger className="flex flex-col gap-4">
          <StaggerItem>
            <div className="grid gap-4 sm:grid-cols-2">
              {FACTS.map((fact) => (
                <div key={fact.label} className="panel rounded-3xl p-6">
                  <p className="font-display text-3xl text-accent sm:text-4xl">
                    <CountUp value={fact.value} />
                  </p>
                  <p className="mt-2 text-sm text-dim">{fact.label}</p>
                </div>
              ))}
            </div>
          </StaggerItem>

          <StaggerItem>
            <div className="panel rounded-3xl p-6">
              <p className="eyebrow mb-4">Capabilities</p>
              <ul className="flex flex-wrap gap-2">
                {aboutCapabilities.map((capability) => (
                  <li
                    key={capability}
                    className="rounded-full border border-line bg-accentsoft px-3.5 py-1.5 text-sm text-dim"
                  >
                    {capability}
                  </li>
                ))}
              </ul>
              <Link
                href="/services"
                className="mt-5 inline-block font-display text-sm text-accent underline-offset-4 hover:underline"
              >
                What those capabilities turn into →
              </Link>
            </div>
          </StaggerItem>
        </Stagger>
      </div>
    </section>
  );
}
