import { MessageCircle } from "lucide-react";
import { SITE } from "@/lib/site";

/**
 * Persistent WhatsApp entry point. A genuine anchor with the exact
 * prefilled message, an accessible name, a compact tooltip, and a
 * gentle floating motion that is disabled under reduced-motion.
 */
export function WhatsAppWidget() {
  return (
    <div className="group fixed bottom-5 right-4 z-40 flex flex-col items-end gap-2 sm:bottom-7 sm:right-6">
      <span className="pointer-events-none translate-y-1 rounded-full border border-line bg-panelsolid px-3 py-1.5 text-xs text-ink opacity-0 shadow-lg transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:translate-y-0 group-focus-within:opacity-100">
        Chat with Saiful
      </span>

      <span className="anim-float inline-block">
        <a
          href={SITE.whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Chat with Saiful on WhatsApp — opens in a new tab. Prefilled message: ${SITE.whatsappMessage}`}
          className="grid h-14 w-14 place-items-center rounded-full border border-linestrong bg-[var(--veil)] text-accent shadow-[0_18px_40px_-18px_rgba(99,245,231,0.75)] backdrop-blur-xl transition duration-300 hover:border-accent hover:bg-accent hover:text-accentink focus-visible:border-accent"
        >
          <MessageCircle className="h-6 w-6" aria-hidden="true" />
        </a>
      </span>
    </div>
  );
}
