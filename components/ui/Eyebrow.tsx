import type { ReactNode } from "react";

/** Small uppercase section label, e.g. "01 — About". */
export function Eyebrow({
  index,
  children,
  className = "",
  tone = "accent",
}: {
  index?: string;
  children: ReactNode;
  className?: string;
  tone?: "accent" | "mist";
}) {
  return (
    <p className={`eyebrow flex items-center gap-4 ${tone === "accent" ? "text-burgundy" : "text-mist"} ${className}`}>
      {index ? <span className="tabular-nums">{index}</span> : null}
      <span aria-hidden="true" className="h-px w-10 bg-current opacity-60" />
      <span>{children}</span>
    </p>
  );
}
