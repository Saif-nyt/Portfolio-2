import { withVars } from "@/lib/styles";

/** Slow-moving volumetric fog banks layered between landscape planes. */
export function MistLayer({ className = "" }: { className?: string }) {
  return (
    <div
      className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}
      aria-hidden="true"
    >
      <span
        className="anim-drift absolute -left-[20%] top-[14%] h-52 w-[75%] rounded-full blur-2xl"
        style={withVars(
          {
            background:
              "radial-gradient(ellipse at center, rgba(163,217,214,0.18), transparent 70%)",
          },
          { "--drift-x": "7%", "--drift-dur": "38s" },
        )}
      />
      <span
        className="anim-drift absolute right-[10%] top-[42%] h-40 w-[60%] rounded-full blur-3xl"
        style={withVars(
          {
            background:
              "radial-gradient(ellipse at center, rgba(55,214,197,0.14), transparent 72%)",
          },
          { "--drift-x": "-8%", "--drift-dur": "46s" },
        )}
      />
      <span
        className="anim-drift absolute bottom-[6%] left-[24%] h-56 w-[70%] rounded-full blur-3xl"
        style={withVars(
          {
            background:
              "radial-gradient(ellipse at center, rgba(163,217,214,0.13), transparent 74%)",
          },
          { "--drift-x": "5%", "--drift-dur": "52s" },
        )}
      />
    </div>
  );
}
