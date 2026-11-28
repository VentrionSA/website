import { LogoMark } from "@/components/brand/Logo";

/**
 * A section break: the Ventrion star between two hairlines that fade out to either side,
 * as a book marks the end of a chapter. Fills the space between sections with something
 * deliberate. The star is always upright, as the logo.
 */
export function Ornament({ className = "" }: { className?: string }) {
  return (
    <div aria-hidden="true" className={`flex items-center justify-center gap-4 ${className}`}>
      <span className="h-px w-full max-w-[14rem] bg-gradient-to-r from-transparent to-mark/35" />
      <LogoMark className="h-[18px] w-auto shrink-0 text-mark/60" />
      <span className="h-px w-full max-w-[14rem] bg-gradient-to-l from-transparent to-mark/35" />
    </div>
  );
}
