import Link from "next/link";
import type { ReactNode } from "react";

type Variant = "primary" | "ghost";

interface ActionLinkProps {
  href: string;
  children: ReactNode;
  variant?: Variant;
  className?: string;
  ariaLabel?: string;
  external?: boolean;
}

export function ActionLink({
  href,
  children,
  variant = "primary",
  className = "",
  ariaLabel,
  external,
}: ActionLinkProps) {
  const classes = `${variant === "primary" ? "btn-primary" : "btn-ghost"} ${className}`;
  const isExternal = external ?? (href.startsWith("http") || href.startsWith("mailto:") || href.startsWith("tel:"));

  if (isExternal) {
    return (
      <a
        href={href}
        className={classes}
        aria-label={ariaLabel}
        target={href.startsWith("http") ? "_blank" : undefined}
        rel={href.startsWith("http") ? "noopener noreferrer" : undefined}
      >
        {children}
      </a>
    );
  }

  return (
    <Link href={href} className={classes} aria-label={ariaLabel}>
      {children}
    </Link>
  );
}
