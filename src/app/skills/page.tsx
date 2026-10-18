import { Suspense } from "react";
import type { Metadata } from "next";
import { FinalCta } from "@/components/sections/FinalCta";
import { SkillsEcosystem } from "@/components/skills/SkillsEcosystem";
import { PageHero } from "@/components/ui/PageHero";
import { Section } from "@/components/ui/Section";
import { ObservatoryLocation } from "@/components/world/locations/ObservatoryLocation";
import { getCachedSkillGroups } from "@/server/content-cache";

export const metadata: Metadata = {
  title: "Skills",
  description:
    "The technologies T. M. Saiful Islam works with — Next.js, React, TypeScript, backend APIs, databases, e-commerce platforms and server-side conversion tracking.",
  alternates: { canonical: "/skills" },
};

async function CapabilitiesSection() {
  const groups = await getCachedSkillGroups();
  return (
    <Section id="capabilities" ariaLabelledBy="capabilities-title">
      <div className="shell py-12">
        {groups.length > 0 ? <SkillsEcosystem groups={groups} /> : null}
      </div>
    </Section>
  );
}

export default function SkillsPage() {
  return (
    <ObservatoryLocation
      codex={
        <Suspense
          fallback={
            <Section id="capabilities" ariaLabelledBy="capabilities-title">
              <div className="shell py-12">
                <p className="text-dim">Loading capabilities…</p>
              </div>
            </Section>
          }
        >
          <CapabilitiesSection />
        </Suspense>
      }
      fallback={
        <>
          <PageHero
            eyebrow="HOLOGRAPHIC OBSERVATORY · SKILLS"
            title="The Capability Constellation"
            lead="Technologies I work with every day — from Next.js and TypeScript on the frontend to APIs, databases and measurement on the backend."
            scene="quiet"
          />
          <Suspense
            fallback={
              <Section id="capabilities" ariaLabelledBy="capabilities-title">
                <div className="shell py-12">
                  <p className="text-dim">Loading capabilities…</p>
                </div>
              </Section>
            }
          >
            <CapabilitiesSection />
          </Suspense>
          <FinalCta />
        </>
      }
    />
  );
}
