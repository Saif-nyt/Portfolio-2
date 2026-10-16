import { Reveal } from "@/components/animations/Reveal";
import { Scene } from "@/components/environment/Scene";
import { ActionLink } from "@/components/ui/ActionLink";

/** Shared 404 body used by the app not-found route and the proxy fallback. */
export function NotFoundContent() {
  return (
    <section className="relative flex min-h-[70svh] flex-col items-center justify-center overflow-hidden py-32 text-center">
      <Scene variant="quiet" />

      <div className="shell relative z-10 flex flex-col items-center gap-6">
        <Reveal>
          <p className="eyebrow">Lost in the forest</p>
        </Reveal>
        <Reveal delay={0.1}>
          <h1 className="text-4xl sm:text-5xl md:text-6xl">This path ends here.</h1>
        </Reveal>
        <Reveal delay={0.18}>
          <p className="max-w-md text-base leading-relaxed text-dim sm:text-lg">
            The page you were looking for doesn&apos;t exist — or it drifted away with the floating
            mountains. Head back to solid ground.
          </p>
        </Reveal>
        <Reveal delay={0.26}>
          <div className="flex flex-col gap-3 sm:flex-row">
            <ActionLink href="/">Return Home</ActionLink>
            <ActionLink href="/work" variant="ghost">
              Explore the Work
            </ActionLink>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
