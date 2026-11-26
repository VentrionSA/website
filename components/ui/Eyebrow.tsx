import type { ReactNode } from "react";

/**
 * Small uppercase section label, e.g. "01 — About".
 *
 * `align="center"` is for centred sections: the label itself sits exactly on the centre
 * line, over the heading. From sm up the index and its rule hang to the label's left (an
 * empty column of the same width balances them on the right); on phones the index sits
 * between two short rules on a line of its own, above the label.
 */
export function Eyebrow({
  index,
  children,
  className = "",
  tone = "accent",
  align = "start",
}: {
  index?: string;
  children: ReactNode;
  className?: string;
  tone?: "accent" | "mist";
  align?: "start" | "center";
}) {
  const color = tone === "accent" ? "text-ivory" : "text-mist";

  if (align === "center") {
    return (
      <p
        className={`eyebrow flex flex-col items-center gap-3 text-center sm:grid sm:grid-cols-[1fr_auto_1fr] sm:gap-4 ${color} ${className}`}
      >
        <span className="flex items-center gap-3 sm:gap-4 sm:justify-self-end">
          <span aria-hidden="true" className="h-px w-6 bg-current opacity-60 sm:hidden" />
          {index ? <span className="tabular-nums">{index}</span> : null}
          <span aria-hidden="true" className="h-px w-6 bg-current opacity-60 sm:w-10" />
        </span>
        {/* the negative margin cancels the trailing letter-spacing, so the words centre optically */}
        <span className="-mr-[0.28em]">{children}</span>
        <span aria-hidden="true" className="hidden sm:block" />
      </p>
    );
  }

  return (
    <p className={`eyebrow flex items-center gap-4 ${color} ${className}`}>
      {index ? <span className="tabular-nums">{index}</span> : null}
      <span aria-hidden="true" className="h-px w-10 bg-current opacity-60" />
      <span>{children}</span>
    </p>
  );
}
