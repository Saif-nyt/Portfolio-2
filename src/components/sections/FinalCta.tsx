import { MessageCircle } from "lucide-react";
import { Reveal } from "@/components/animations/Reveal";
import { Scene } from "@/components/environment/Scene";
import { ActionLink } from "@/components/ui/ActionLink";
import { SITE } from "@/lib/site";

/** Final illuminated scene before the footer. */
export function FinalCta() {
  return (
    <section aria-labelledby="final-cta-title" className="relative overflow-hidden">
      <Scene variant="gateway" />

      <div className="shell relative z-10 flex flex-col items-center gap-7 py-28 text-center md:py-36">
        <Reveal>
          <p className="eyebrow">The trail continues</p>
        </Reveal>
        <Reveal delay={0.08}>
          <h2 id="final-cta-title" className="max-w-3xl text-3xl leading-[1.08] sm:text-4xl md:text-5xl">
            Let&apos;s Build Something That Moves Your Business Forward.
          </h2>
        </Reveal>
        <Reveal delay={0.16}>
          <p className="max-w-2xl text-base leading-relaxed text-dim sm:text-lg">
            From modern websites to e-commerce experiences and reliable conversion tracking,
            let&apos;s turn your next idea into something meaningful.
          </p>
        </Reveal>
        <Reveal delay={0.24}>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <ActionLink href="/contact">Start a Project</ActionLink>
            <ActionLink href={SITE.whatsappUrl} variant="ghost">
              <MessageCircle className="h-4 w-4" aria-hidden="true" />
              Chat on WhatsApp
            </ActionLink>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
