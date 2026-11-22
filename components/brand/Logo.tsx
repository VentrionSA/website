import { MARK_PATH, MARK_VIEWBOX, WORDMARK_PATH, WORDMARK_VIEWBOX } from "./logo-paths";

type SvgProps = { className?: string; title?: string };

/** The eight-point Ventrion star mark. Inherits colour from `currentColor`. */
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

/** Horizontal lock-up used in the navigation and footer. */
export function LogoLockup({ className = "", markClassName = "h-8 w-auto", wordClassName = "h-[11px] w-auto" }: {
  className?: string;
  markClassName?: string;
  wordClassName?: string;
}) {
  return (
    <span className={`inline-flex items-center gap-3 text-ivory ${className}`}>
      <LogoMark className={`text-mark ${markClassName}`} />
      <LogoWordmark className={wordClassName} />
      <span className="sr-only">Ventrion</span>
    </span>
  );
}
