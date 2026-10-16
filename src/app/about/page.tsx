import type { Metadata } from "next";
import { AboutDetails } from "@/components/about/AboutDetails";
import { FinalCta } from "@/components/sections/FinalCta";
import { PageHero } from "@/components/ui/PageHero";

export const metadata: Metadata = {
  title: "About",
  description:
    "About T. M. Saiful Islam — a web developer and digital growth specialist working across web development, e-commerce, performance marketing, and conversion tracking.",
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  return (
    <>
      <PageHero
        eyebrow="ABOUT THE DEVELOPER"
        title="Curious by Nature. Driven to Build."
        lead="Background, focus areas, and the disciplines I work across — from building websites and storefronts to running campaigns and keeping the measurement trustworthy."
        scene="quiet"
      />
      <AboutDetails />
      <FinalCta />
    </>
  );
}
