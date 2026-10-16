"use client";

import { Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { NAV_LINKS } from "@/lib/site";
import { ThemeToggle } from "./ThemeToggle";

function subscribeToScroll(callback: () => void) {
  window.addEventListener("scroll", callback, { passive: true });
  return () => window.removeEventListener("scroll", callback);
}

export function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const toggleRef = useRef<HTMLButtonElement | null>(null);
  const scrolled = useSyncExternalStore(
    subscribeToScroll,
    () => window.scrollY > 24,
    () => false,
  );

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        toggleRef.current?.focus();
        return;
      }
      if (event.key !== "Tab" || !menuRef.current) return;

      const focusables = menuRef.current.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled])',
      );
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement;

      if (event.shiftKey && (active === first || active === toggleRef.current)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        toggleRef.current?.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    const firstLink = menuRef.current?.querySelector<HTMLElement>("a[href]");
    firstLink?.focus();

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  const isActive = useCallback(
    (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href)),
    [pathname],
  );

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        scrolled || open
          ? "border-b border-line bg-[var(--veil)] backdrop-blur-xl"
          : "border-b border-transparent bg-transparent"
      }`}
    >
      <div className="shell flex h-16 items-center justify-between gap-4 md:h-[4.5rem]">
        <Link
          href="/"
          onClick={() => setOpen(false)}
          className="group flex items-center gap-3 rounded-full py-1 pr-3 focus-visible:outline-2"
          aria-label="T. M. Saiful Islam — home"
        >
          <span
            aria-hidden="true"
            className="grid h-9 w-9 place-items-center rounded-full border border-linestrong bg-accentsoft font-display text-sm font-semibold text-accent transition group-hover:shadow-[0_0_24px_-6px_rgba(99,245,231,0.8)]"
          >
            SI
          </span>
          <span className="hidden font-display text-sm font-medium tracking-wide text-ink sm:block">
            T. M. Saiful Islam
          </span>
        </Link>

        <nav aria-label="Primary" className="hidden items-center gap-1 md:flex">
          <ul className="flex items-center gap-1">
            {NAV_LINKS.map((link) => {
              const active = isActive(link.href);
              return (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    onClick={() => setOpen(false)}
                    aria-current={active ? "page" : undefined}
                    className={`relative block rounded-full px-4 py-2 font-display text-sm transition ${
                      active
                        ? "text-accent"
                        : "text-dim hover:text-ink"
                    }`}
                  >
                    {link.label}
                    <span
                      aria-hidden="true"
                      className={`absolute inset-x-4 -bottom-0.5 h-px origin-left transition-transform duration-300 ${
                        active ? "scale-x-100 bg-accent shadow-[0_0_10px_rgba(99,245,231,0.9)]" : "scale-x-0 bg-transparent"
                      }`}
                    />
                  </Link>
                </li>
              );
            })}
          </ul>
          <div className="ml-2 flex items-center gap-2">
            <ThemeToggle />
            <a
              href="mailto:saifulislamnyt@gmail.com"
              className="btn-primary hidden !min-h-[2.5rem] !px-5 text-sm lg:inline-flex"
            >
              Start a Project
            </a>
          </div>
        </nav>

        <div className="flex items-center gap-2 md:hidden">
          <ThemeToggle />
          <button
            ref={toggleRef}
            type="button"
            className="grid h-10 w-10 place-items-center rounded-full border border-line bg-panel text-ink"
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? "Close navigation menu" : "Open navigation menu"}
            onClick={() => setOpen((value) => !value)}
          >
            {open ? (
              <X className="h-5 w-5" aria-hidden="true" />
            ) : (
              <Menu className="h-5 w-5" aria-hidden="true" />
            )}
          </button>
        </div>
      </div>

      <div
        id="mobile-menu"
        ref={menuRef}
        hidden={!open}
        className="border-t border-line bg-[var(--veil)] backdrop-blur-xl md:hidden"
      >
        <nav aria-label="Mobile" className="shell py-6">
          <ul className="flex flex-col gap-1">
            {NAV_LINKS.map((link, index) => {
              const active = isActive(link.href);
              return (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    onClick={() => setOpen(false)}
                    aria-current={active ? "page" : undefined}
                    className={`flex min-h-[3.5rem] items-center justify-between rounded-2xl px-4 py-4 font-display text-lg transition ${
                      active
                        ? "border border-linestrong bg-accentsoft text-accent"
                        : "border border-transparent text-ink hover:bg-accentsoft"
                    }`}
                  >
                    {link.label}
                    <span className="font-mono text-xs text-faint" aria-hidden="true">
                      0{index + 1}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
          <a href="mailto:saifulislamnyt@gmail.com" className="btn-primary mt-6 w-full">
            Start a Project
          </a>
        </nav>
      </div>
    </header>
  );
}
