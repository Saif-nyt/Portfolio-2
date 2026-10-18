import Link from "next/link";
import { Mail, MessageCircle, Phone } from "lucide-react";
import { NAV_LINKS, SITE, SITE_URL } from "@/lib/site";

async function getCopyrightYear(): Promise<number> {
  "use cache";
  return new Date().getFullYear();
}

export async function Footer() {
  const year = await getCopyrightYear();

  return (
    <footer className="relative border-t border-line bg-bgdeep">
      <div className="shell grid gap-10 py-14 md:grid-cols-[1.4fr_1fr_1.2fr] md:py-16">
        <div className="flex flex-col gap-4">
          <p className="font-display text-lg font-semibold">{SITE.name}</p>
          <p className="max-w-sm text-sm leading-relaxed text-dim">
            Full-stack web developer and digital growth specialist — building websites, e-commerce
            experiences and reliable conversion tracking.
          </p>
          <p className="text-sm text-faint">
            {SITE.projectsCompleted} projects completed · {SITE.experience} of experience
          </p>
        </div>

        <nav aria-label="Footer">
          <p className="eyebrow mb-4">Navigate</p>
          <ul className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="inline-block rounded py-1 text-dim transition hover:text-accent"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div>
          <p className="eyebrow mb-4">Contact</p>
          <ul className="flex flex-col gap-3 text-sm">
            <li>
              <a
                href={`mailto:${SITE.email}`}
                className="inline-flex items-center gap-2 rounded py-1 text-dim transition hover:text-accent"
              >
                <Mail className="h-4 w-4" aria-hidden="true" />
                {SITE.email}
              </a>
            </li>
            <li>
              <a
                href={`tel:${SITE.phone.replace(/\s/g, "")}`}
                className="inline-flex items-center gap-2 rounded py-1 text-dim transition hover:text-accent"
              >
                <Phone className="h-4 w-4" aria-hidden="true" />
                {SITE.phoneDisplay}
              </a>
            </li>
            <li>
              <a
                href={SITE.whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded py-1 text-dim transition hover:text-accent"
              >
                <MessageCircle className="h-4 w-4" aria-hidden="true" />
                Chat on WhatsApp
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-line">
        <div className="shell flex flex-col gap-2 py-6 text-xs text-faint sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {year} {SITE.name}. All rights reserved.
          </p>
          <p>
            Designed &amp; built as a living digital world ·{" "}
            <a href={SITE_URL} className="underline decoration-dotted hover:text-accent">
              {SITE_URL.replace(/^https?:\/\//, "")}
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
