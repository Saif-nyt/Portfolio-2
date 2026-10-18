import { Suspense } from "react";
import type { Metadata } from "next";
import { Reveal } from "@/components/animations/Reveal";
import { FinalCta } from "@/components/sections/FinalCta";
import { ServiceCard } from "@/components/services/ServiceCard";
import { ServiceProcess } from "@/components/services/ServiceProcess";
import { PageHero } from "@/components/ui/PageHero";
import { Section, SectionHeading } from "@/components/ui/Section";
import { ForgeLocation } from "@/components/world/locations/ForgeLocation";
import { getCachedProcessSteps, getCachedServices } from "@/server/content-cache";

export const metadata: Metadata = {
  title: "Services",
  description:
    "Full-stack web development, frontend engineering, backend APIs, e-commerce and analytics integrations — services that connect into one measurable system.",
  alternates: { canonical: "/services" },
};

async function ServicesBody() {
  const [services, processSteps] = await Promise.all([
    getCachedServices(),
    getCachedProcessSteps(),
  ]);

  return (
    <>
      <Section id="services-list" ariaLabelledBy="services-list-title">
        <div className="shell flex flex-col gap-10 py-20 md:py-28">
          <Reveal>
            <SectionHeading
              id="services-list-title"
              eyebrow="Capabilities"
              title="Services, One Connected Practice"
              lead="Each service stands on its own or links up with the others. Descriptions and deliverables are listed in full below."
            />
          </Reveal>
          <div className="grid gap-6 lg:grid-cols-2">
            {services.length > 0 ? (
              services.map((service, index) => (
                <ServiceCard key={service.slug} service={service} detailed index={index} />
              ))
            ) : (
              <p role="status" className="panel rounded-3xl p-10 text-center text-dim lg:col-span-2">
                Service details are being finalised — check back shortly.
              </p>
            )}
          </div>
        </div>
      </Section>
      <ServiceProcess steps={processSteps} />
    </>
  );
}

export default function ServicesPage() {
  return (
    <ForgeLocation
      codex={
        <Suspense
          fallback={
            <Section id="services-list" ariaLabelledBy="services-list-title">
              <div className="shell py-20 md:py-28">
                <p className="text-dim">Loading services…</p>
              </div>
            </Section>
          }
        >
          <ServicesBody />
        </Suspense>
      }
      fallback={
        <>
          <PageHero
            eyebrow="TECHNOLOGY FORGE · SERVICES"
            title="What I Build"
            lead="Websites, storefronts, applications, campaigns and the measurement underneath them — scoped clearly, built in reviewable stages, and validated before launch."
            scene="arrival"
          />
          <Suspense
            fallback={
              <Section id="services-list" ariaLabelledBy="services-list-title">
                <div className="shell py-20 md:py-28">
                  <p className="text-dim">Loading services…</p>
                </div>
              </Section>
            }
          >
            <ServicesBody />
          </Suspense>
          <FinalCta />
        </>
      }
    />
  );
}
