"use client";

import { useRef, type MouseEvent, type ReactNode } from "react";
import { motion, useMotionValue, useSpring } from "motion/react";
import { ArrowRight, ArrowUpRight } from "lucide-react";

type Variant = "primary" | "outline" | "text";

const base =
  "group relative inline-flex select-none items-center justify-center gap-4 overflow-hidden whitespace-nowrap text-[11px] font-semibold uppercase tracking-[0.24em] transition-colors duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]";

const variants: Record<Variant, string> = {
  primary: "bg-gold px-7 py-[1.05rem] text-ink hover:bg-ivory",
  outline: "border border-line-strong px-7 py-[1rem] text-ivory hover:border-gold hover:text-gold",
  text: "link-draw py-1 text-ivory hover:text-gold",
};

type Props = {
  href: string;
  children: ReactNode;
  variant?: Variant;
  className?: string;
  external?: boolean;
  icon?: "right" | "up-right" | "none";
  magnetic?: boolean;
  onClick?: (event: MouseEvent<HTMLAnchorElement>) => void;
  ariaLabel?: string;
};

/** Primary call-to-action link with a sliding arrow and optional magnetic hover. */
export function ArrowLink({
  href,
  children,
  variant = "primary",
  className = "",
  external,
  icon = "right",
  magnetic = false,
  onClick,
  ariaLabel,
}: Props) {
  const ref = useRef<HTMLAnchorElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 220, damping: 18, mass: 0.4 });
  const sy = useSpring(y, { stiffness: 220, damping: 18, mass: 0.4 });

  const onMove = (event: MouseEvent<HTMLAnchorElement>) => {
    if (!magnetic || !ref.current || !window.matchMedia("(pointer: fine)").matches) return;
    const rect = ref.current.getBoundingClientRect();
    x.set((event.clientX - rect.left - rect.width / 2) * 0.18);
    y.set((event.clientY - rect.top - rect.height / 2) * 0.28);
  };
  const onLeave = () => {
    x.set(0);
    y.set(0);
  };

  const Icon = icon === "up-right" ? ArrowUpRight : ArrowRight;

  return (
    <motion.a
      ref={ref}
      href={href}
      onClick={onClick}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      style={magnetic ? { x: sx, y: sy } : undefined}
      className={`${base} ${variants[variant]} ${className}`}
      aria-label={ariaLabel}
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
    >
      <span className="relative">{children}</span>
      {icon !== "none" ? (
        <span className="relative inline-flex h-4 w-4 overflow-hidden" aria-hidden="true">
          <Icon
            strokeWidth={1.5}
            className="absolute inset-0 h-4 w-4 transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:translate-x-[140%]"
          />
          <Icon
            strokeWidth={1.5}
            className="absolute inset-0 h-4 w-4 -translate-x-[140%] transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:translate-x-0"
          />
        </span>
      ) : null}
    </motion.a>
  );
}
