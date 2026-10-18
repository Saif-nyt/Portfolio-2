interface FirefliesProps {
  count?: number;
}

/**
 * Ambient fireflies drifting inside a card — pure static markup animated
 * in CSS (deterministic placement, no hydration risk). The layer sits at
 * z-index -1 inside the card's stacking context, so it renders behind all
 * content. Decorative only; hidden under reduced motion.
 */
export function Fireflies({ count = 5 }: FirefliesProps) {
  return (
    <span className="fireflies" aria-hidden="true">
      {Array.from({ length: count }, (_, index) => (
        <span key={index} className="firefly" />
      ))}
    </span>
  );
}
