import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { Reveal } from "@/components/animations/Reveal";
import { Fireflies } from "@/components/ui/Fireflies";
import type { Service } from "@/types";

interface ServiceCardProps {
  service: Service;
  detailed?: boolean;
  index?: number;
}

const ACCENT: Record<Service["accent"], { ring: string; text: string; dot: string }> = {
  cyan: { ring: "hover:border-[rgba(99,245,231,0.5)]", text: "text-cyan", dot: "bg-cyan" },
  turquoise: {
    ring: "hover:border-[rgba(55,214,197,0.5)]",
    text: "text-turquoise",
    dot: "bg-turquoise",
  },
  mist: { ring: "hover:border-[rgba(163,217,214,0.5)]", text: "text-mist", dot: "bg-mist" },
};

/**
 * Illuminated structure card for a single service. Descriptions and
 * deliverables are always visible — hover only adds light, never content.
 */
export function ServiceCard({ service, detailed = false, index = 0 }: ServiceCardProps) {
  const accent = ACCENT[service.accent];

  return (
    <Reveal delay={index * 0.07}>
      <article
        className={`panel card-hover sheen group flex h-full flex-col gap-5 rounded-3xl p-6 sm:p-7 ${accent.ring}`}
      >
        <Fireflies count={4} />
        <div className="flex items-start justify-between gap-4">
          <span className={`font-mono text-xs tracking-[0.2em] ${accent.text}`}>
            {service.number}
          </span>
          <span
            aria-hidden="true"
            className={`anim-blink h-2 w-2 rounded-full ${accent.dot} shadow-[0_0_14px_rgba(99,245,231,0.8)]`}
            style={{ animationDelay: `${index * 0.6}s` }}
          />
        </div>

        <div className="flex flex-col gap-2">
          <h3 className="text-xl sm:text-2xl">{service.title}</h3>
          <p className="text-sm text-dim">{service.short}</p>
        </div>

        <p className="text-sm leading-relaxed text-faint">{service.description}</p>

        {detailed ? (
          <div className="flex flex-col gap-4 border-t border-line pt-4">
            {service.deliverables.map((group) => (
              <div key={group.title}>
                <p className="eyebrow mb-2">{group.title}</p>
                <ul className="grid gap-1.5 text-sm text-dim">
                  {group.items.map((item, itemIndex) => (
                    <li key={item} className="flex items-start gap-2">
                      <span
                        aria-hidden="true"
                        className={`anim-blink-gentle mt-2 h-1 w-1 shrink-0 rounded-full ${accent.dot}`}
                        style={{ animationDelay: `${itemIndex * 0.4}s` }}
                      />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        ) : null}

        <Link
          href={`/contact?service=${encodeURIComponent(service.slug)}`}
          className="mt-auto inline-flex items-center gap-2 rounded-full font-display text-sm text-ink transition group-hover:text-accent"
        >
          Discuss This Service
          <ArrowUpRight
            className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
            aria-hidden="true"
          />
        </Link>
      </article>
    </Reveal>
  );
}
