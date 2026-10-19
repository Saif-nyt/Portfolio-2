import type { Metadata } from "next";
import { Suspense } from "react";
import { Clock, Mail, MessageCircle, Phone } from "lucide-react";
import { GithubIcon } from "@/components/ui/GithubIcon";
import { Reveal } from "@/components/animations/Reveal";
import { ContactForm } from "@/components/contact/ContactForm";
import { DownloadCv } from "@/components/contact/DownloadCv";
import { ActionLink } from "@/components/ui/ActionLink";
import { PageHero } from "@/components/ui/PageHero";
import { Section } from "@/components/ui/Section";
import { NexusLocation } from "@/components/world/locations/NexusLocation";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Start a project — full-stack web development, e-commerce, APIs and conversion tracking. Tell me what you are building and let's explore the next step.",
  alternates: { canonical: "/contact" },
};

const channels = [
  {
    id: "email",
    label: "Email",
    value: SITE.email,
    href: `mailto:${SITE.email}`,
    icon: Mail,
    note: "Best for briefs, links and anything worth a considered reply.",
    external: false,
  },
  {
    id: "phone",
    label: "Phone",
    value: SITE.phoneDisplay,
    href: `tel:${SITE.phone}`,
    icon: Phone,
    note: "Straight to my line — calls are welcome during working hours.",
    external: false,
  },
  {
    id: "whatsapp",
    label: "WhatsApp",
    value: "Start a conversation",
    href: SITE.whatsappUrl,
    icon: MessageCircle,
    note: "Opens WhatsApp in a new tab with a message ready to send.",
    external: true,
  },
  {
    id: "github",
    label: "GitHub",
    value: SITE.githubHandle,
    href: SITE.github,
    icon: GithubIcon,
    note: "Code, experiments and open-source work — opens in a new tab.",
    external: true,
  },
];

/** Compact channels + form shown inside the in-world contact codex. */
function ContactCodexBody() {
  return (
    <div className="grid gap-8 lg:grid-cols-2 lg:items-start">
      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-3">
          <p className="eyebrow">Direct channels</p>
          <h3 className="text-2xl leading-[1.1] sm:text-3xl">Reach Me Directly</h3>
          <p className="text-sm leading-relaxed text-dim sm:text-base">
            The form is the quickest route, but these lines reach me just as directly.
          </p>
        </div>
        <ul className="flex flex-col gap-3">
          {channels.map((channel) => {
            const Icon = channel.icon;
            return (
              <li key={channel.id}>
                <a
                  href={channel.href}
                  target={channel.external ? "_blank" : undefined}
                  rel={channel.external ? "noopener noreferrer" : undefined}
                  aria-label={
                    channel.external ? `${channel.label} (opens in a new tab)` : undefined
                  }
                  className="panel card-hover flex items-start gap-4 rounded-2xl px-4 py-4"
                >
                  <span
                    aria-hidden="true"
                    className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-line bg-accentsoft text-accent"
                  >
                    <Icon className="h-5 w-5" />
                  </span>
                  <span className="flex min-w-0 flex-col gap-1">
                    <span className="eyebrow">{channel.label}</span>
                    <span className="break-words font-display text-base text-ink">
                      {channel.value}
                    </span>
                    <span className="text-sm leading-relaxed text-dim">{channel.note}</span>
                  </span>
                </a>
              </li>
            );
          })}
        </ul>
        <p className="flex items-start gap-2.5 text-sm leading-relaxed text-dim">
          <Clock className="mt-0.5 h-4 w-4 shrink-0 text-accent" aria-hidden="true" />
          <span>
            Currently taking on new projects — messages are usually answered within one
            business day, Monday to Friday.
          </span>
        </p>
      </div>
      <div className="panel rounded-3xl p-6">
        <Suspense
          fallback={<div className="h-[28rem] animate-pulse rounded-2xl bg-accentsoft/40" />}
        >
          <ContactForm />
        </Suspense>
      </div>
    </div>
  );
}

export default function ContactPage() {
  return (
    <NexusLocation
      codex={<ContactCodexBody />}
      fallback={
        <>
          <PageHero
            scene="gateway"
            eyebrow="COMMUNICATION NEXUS · CONTACT"
            title="Have Something Ambitious in Mind?"
            lead="Tell me what you're building, what you want to improve, or where you're looking to grow. Let's explore the next step."
          />

          <Section id="channels" ariaLabelledBy="contact-channels-title" tone="panel">
            <div className="shell grid gap-12 py-20 md:py-28 lg:grid-cols-2 lg:items-start lg:gap-16">
              <div className="flex flex-col gap-8">
                <Reveal>
                  <div className="flex flex-col gap-5">
                    <p className="eyebrow">Direct channels</p>
                    <h2 id="contact-channels-title" className="text-3xl leading-[1.08] sm:text-4xl">
                      Reach Me Directly
                    </h2>
                    <p className="max-w-xl text-base leading-relaxed text-dim sm:text-lg">
                      The form below is the quickest route, but these lines reach me just as
                      directly. Pick whichever suits how you like to communicate.
                    </p>
                  </div>
                </Reveal>

                <Reveal delay={0.06}>
                  <ul className="flex flex-col gap-3">
                    {channels.map((channel) => {
                      const Icon = channel.icon;
                      return (
                        <li key={channel.id}>
                          <a
                            href={channel.href}
                            target={channel.external ? "_blank" : undefined}
                            rel={channel.external ? "noopener noreferrer" : undefined}
                            aria-label={
                              channel.external
                                ? `${channel.label} (opens in a new tab)`
                                : undefined
                            }
                            className="panel card-hover flex items-start gap-4 rounded-2xl px-4 py-4 sm:px-5"
                          >
                            <span
                              aria-hidden="true"
                              className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-line bg-accentsoft text-accent"
                            >
                              <Icon className="h-5 w-5" />
                            </span>
                            <span className="flex min-w-0 flex-col gap-1">
                              <span className="eyebrow">{channel.label}</span>
                              <span className="break-words font-display text-base text-ink sm:text-lg">
                                {channel.value}
                              </span>
                              <span className="text-sm leading-relaxed text-dim">
                                {channel.note}
                              </span>
                            </span>
                          </a>
                        </li>
                      );
                    })}
                  </ul>
                </Reveal>

                <Reveal delay={0.12}>
                  <div className="flex flex-col gap-5">
                    <p className="flex items-start gap-2.5 text-sm leading-relaxed text-dim">
                      <Clock className="mt-0.5 h-4 w-4 shrink-0 text-accent" aria-hidden="true" />
                      <span>
                        Currently taking on new projects — messages are usually answered within
                        one business day, Monday to Friday.
                      </span>
                    </p>
                    <DownloadCv />
                  </div>
                </Reveal>
              </div>

              <Reveal delay={0.08}>
                <div id="form" className="panel rounded-3xl p-6 sm:p-8">
                  <Suspense
                    fallback={
                      <div className="h-[28rem] animate-pulse rounded-2xl bg-accentsoft/40" />
                    }
                  >
                    <ContactForm />
                  </Suspense>
                </div>
              </Reveal>
            </div>
          </Section>

          <Section id="contact-alternatives" ariaLabelledBy="contact-alternatives-title">
            <div className="shell flex flex-col gap-5 py-16 md:py-20">
              <p className="eyebrow">Other ways to start</p>
              <h2
                id="contact-alternatives-title"
                className="max-w-2xl text-2xl leading-[1.1] sm:text-3xl"
              >
                If a Form Isn&apos;t Your Thing, Reach Out Directly.
              </h2>
              <div className="flex flex-wrap gap-3">
                <ActionLink href={`mailto:${SITE.email}`} variant="ghost">
                  <Mail className="h-4 w-4" aria-hidden="true" />
                  Email me
                </ActionLink>
                <ActionLink href={SITE.whatsappUrl} variant="ghost">
                  <MessageCircle className="h-4 w-4" aria-hidden="true" />
                  Chat on WhatsApp
                </ActionLink>
                <ActionLink href={SITE.github} variant="ghost">
                  <GithubIcon className="h-4 w-4" />
                  View GitHub
                </ActionLink>
              </div>
            </div>
          </Section>
        </>
      }
    />
  );
}
