import { Suspense } from "react";
import type { Metadata } from "next";
import { AboutDetails } from "@/components/about/AboutDetails";
import { FinalCta } from "@/components/sections/FinalCta";
import { PageHero } from "@/components/ui/PageHero";
import { AboutLocation } from "@/components/world/locations/AboutLocation";

export const metadata: Metadata = {
  title: "About",
  description:
    "About T. M. Saiful Islam — a full-stack web developer building modern web applications, e-commerce systems and digital platforms for clients worldwide.",
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  return (
    <AboutLocation
      codex={
        <Suspense
          fallback={
            <section className="shell py-20 md:py-28" aria-busy="true">
              <p className="text-dim">Loading background…</p>
            </section>
          }
        >
          <AboutDetails />
        </Suspense>
      }
      fallback={
        <>
          <PageHero
            eyebrow="ANCIENT TEMPLE · ABOUT"
            title="Curious by Nature. Driven to Build."
            lead="Background, focus areas, and the disciplines I work across — from building websites and storefronts to shipping full-stack applications and keeping measurement trustworthy."
            scene="quiet"
          />
          <Suspense
            fallback={
              <section className="shell py-20 md:py-28" aria-busy="true">
                <p className="text-dim">Loading background…</p>
              </section>
            }
          >
            <AboutDetails />
          </Suspense>
          <FinalCta />
        </>
      }
    />
  );
}
