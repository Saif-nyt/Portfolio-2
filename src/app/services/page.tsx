import type { Metadata } from "next";
import { Reveal } from "@/components/animations/Reveal";
import { FinalCta } from "@/components/sections/FinalCta";
import { ServiceCard } from "@/components/services/ServiceCard";
import { ServiceProcess } from "@/components/services/ServiceProcess";
import { ActionLink } from "@/components/ui/ActionLink";
import { PageHero } from "@/components/ui/PageHero";
import { Section, SectionHeading } from "@/components/ui/Section";
import { getCachedServices } from "@/server/content-cache";

export const metadata: Metadata = {
  title: "Services",
  description:
    "Web development, WordPress and Shopify builds, Meta Ads campaigns, and server-side conversion tracking — services that connect into one measurable growth system.",
  alternates: { canonical: "/services" },
};

export default async function ServicesPage() {
  const services = await getCachedServices();

  return (
    <>
      <PageHero
        eyebrow="SERVICES"
        title="What I Build"
        lead="Websites, storefronts, campaigns, and the measurement underneath them — scoped clearly, built in reviewable stages, and validated before launch."
        scene="arrival"
      />

      <Section id="services-list" ariaLabelledBy="services-list-title">
        <div className="shell flex flex-col gap-10 py-20 md:py-28">
          <Reveal>
            <SectionHeading
              id="services-list-title"
              eyebrow="Capabilities"
              title="Six Services, One Connected Practice"
              lead="Each service stands on its own or links up with the others. Descriptions and deliverables are listed in full below, so you can see exactly what a piece of work includes before we ever talk."
            />
          </Reveal>

          <div className="grid gap-6 lg:grid-cols-2">
            {services.map((service, index) => (
              <ServiceCard key={service.slug} service={service} detailed index={index} />
            ))}
          </div>
        </div>
      </Section>

      <ServiceProcess />

      <Section id="services-cta" ariaLabelledBy="services-cta-title">
        <div className="shell py-16 md:py-20">
          <Reveal>
            <div className="panel flex flex-col gap-7 rounded-3xl p-7 sm:p-9 lg:flex-row lg:items-center lg:justify-between lg:gap-10">
              <div className="flex flex-col gap-3">
                <p className="eyebrow">Next step</p>
                <h2 id="services-cta-title" className="text-2xl leading-[1.15] sm:text-3xl">
                  Tell Me What You Are Trying to Build
                </h2>
                <p className="max-w-2xl text-sm leading-relaxed text-dim sm:text-base">
                  Share the goal, the constraints, and what has been tried so far. You get a clear
                  scope, a realistic timeline, and an honest view of what the numbers can and cannot
                  show.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <ActionLink href="/contact">Start a Project</ActionLink>
                <ActionLink href="/work" variant="ghost">
                  View work
                </ActionLink>
              </div>
            </div>
          </Reveal>
        </div>
      </Section>

      <FinalCta />
    </>
  );
}
