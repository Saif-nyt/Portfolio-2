import { Reveal, Stagger, StaggerItem } from "@/components/animations/Reveal";
import { Section, SectionHeading } from "@/components/ui/Section";
import { getCachedProcessSteps } from "@/server/content-cache";

export async function ServiceProcess() {
  const processSteps = await getCachedProcessSteps();
  return (
    <Section id="service-process" ariaLabelledBy="service-process-title" tone="panel">
      <div className="shell flex flex-col gap-12 py-20 md:py-28">
        <Reveal>
          <SectionHeading
            id="service-process-title"
            eyebrow="How an engagement runs"
            title="From Brief to Launch in Five Steps"
            lead="Every project follows the same path: understand the problem first, plan it as one connected brief, build in reviewable stages, validate against that brief, then launch with measurement confirmed."
          />
        </Reveal>

        <Stagger className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3" stagger={0.09}>
          {processSteps.map((step) => (
            <StaggerItem key={step.number} className="h-full">
              <article className="panel card-hover flex h-full flex-col gap-3 rounded-3xl p-6 sm:p-7">
                <span className="font-mono text-xs tracking-[0.2em] text-accent">{step.number}</span>
                <h3 className="text-xl sm:text-2xl">{step.title}</h3>
                <p className="text-sm leading-relaxed text-dim">{step.body}</p>
              </article>
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </Section>
  );
}
