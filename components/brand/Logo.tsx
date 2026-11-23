import { MARK_PATH, MARK_VIEWBOX, WORDMARK_PATH, WORDMARK_VIEWBOX } from "./logo-paths";

type SvgProps = { className?: string; title?: string };

/** The Ventrion star mark, exactly as the logo (always upright). Inherits colour from `currentColor`. */
export function LogoMark({ className, title }: SvgProps) {
  return (
    <svg
      viewBox={MARK_VIEWBOX}
      className={className}
      fill="currentColor"
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
    >
      <path d={MARK_PATH} fillRule="evenodd" />
    </svg>
  );
}

/** The VENTRION wordmark. Inherits colour from `currentColor`. */
export function LogoWordmark({ className, title }: SvgProps) {
  return (
    <svg
      viewBox={WORDMARK_VIEWBOX}
      className={className}
      fill="currentColor"
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
    >
      <path d={WORDMARK_PATH} fillRule="evenodd" />
    </svg>
  );
}

/**
 * Horizontal lock-up used in the navigation and footer: the star, the wordmark and,
 * optionally, the GLOBAL COMMERCE tagline set between hairlines beneath the wordmark.
 * The tagline row is as wide as the wordmark; size it with `taglineClassName` (font-size).
 */
export function LogoLockup({
  className = "",
  markClassName = "h-8 w-auto",
  wordClassName = "h-[11px] w-auto",
  tagline = false,
  taglineClassName = "",
}: {
  className?: string;
  markClassName?: string;
  wordClassName?: string;
  tagline?: boolean;
  taglineClassName?: string;
}) {
  return (
    <span className={`inline-flex items-center gap-3 text-ivory ${className}`}>
      <LogoMark className={`shrink-0 text-mark ${markClassName}`} />
      <span className="flex flex-col">
        <LogoWordmark className={wordClassName} />
        {tagline ? (
          <span
            aria-hidden="true"
            className={`flex items-center gap-[0.85em] overflow-hidden whitespace-nowrap font-sans font-semibold uppercase leading-none tracking-[0.245em] ${taglineClassName}`}
          >
            <span className="h-px min-w-[0.6em] flex-1 bg-current opacity-45" />
            <span className="-mr-[0.245em]">Global Commerce</span>
            <span className="h-px min-w-[0.6em] flex-1 bg-current opacity-45" />
          </span>
        ) : null}
      </span>
      <span className="sr-only">{tagline ? "Ventrion, Global Commerce" : "Ventrion"}</span>
    </span>
  );
}
