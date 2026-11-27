"use client";

import { useEffect, useRef, type MouseEvent } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ArrowUpRight, KeyRound, Phone } from "lucide-react";
import { NAV_LINKS } from "@/lib/content";
import { getCallAction } from "@/lib/site";
import { scrollToId, startScroll, stopScroll } from "@/lib/scroll";
import { useClientPortal } from "@/components/portal/ClientPortal";

const EASE = [0.76, 0, 0.24, 1] as const;
const EASE_OUT = [0.22, 1, 0.36, 1] as const;

export function MobileMenu({ open, onClose }: { open: boolean; onClose: () => void }) {
  const panelRef = useRef<HTMLDivElement>(null);
  const portal = useClientPortal();
  const call = getCallAction();

  useEffect(() => {
    if (!open) return;
    stopScroll();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (event.key === "Tab" && panelRef.current) {
        // Simple focus trap
        const focusables = panelRef.current.querySelectorAll<HTMLElement>("a[href], button:not([disabled])");
        if (!focusables.length) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    // Move focus into the menu without scrolling: each link slides up inside a clipped row,
    // and a plain focus() makes the browser scroll that row to show the link at once, so
    // "About" would jump into place instead of sliding in with the others.
    const focusTimer = window.setTimeout(
      () => panelRef.current?.querySelector<HTMLElement>("a[href]")?.focus({ preventScroll: true }),
      350,
    );
    return () => {
      document.removeEventListener("keydown", onKey);
      window.clearTimeout(focusTimer);
      startScroll();
    };
  }, [open, onClose]);

  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth >= 1024) onClose();
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [onClose]);

  const go = (event: MouseEvent<HTMLAnchorElement>, href: string) => {
    if (window.location.pathname !== "/") {
      onClose();
      return;
    }
    event.preventDefault();
    onClose();
    window.setTimeout(() => scrollToId(href), 80);
  };

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          key="menu"
          id="mobile-menu"
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          aria-label="Site menu"
          className="fixed inset-0 z-40 bg-ink lg:hidden"
          initial={{ clipPath: "inset(0% 0% 100% 0%)" }}
          animate={{ clipPath: "inset(0% 0% 0% 0%)" }}
          exit={{ clipPath: "inset(0% 0% 100% 0%)" }}
          transition={{ duration: 0.85, ease: EASE }}
        >
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_50%_at_85%_10%,rgba(24,67,53,0.06),transparent_70%)]"
          />
          <div className="shell relative flex h-full flex-col overflow-y-auto pb-[calc(2rem+env(safe-area-inset-bottom))] pt-28">
            <nav aria-label="Mobile">
              <ul>
                {NAV_LINKS.map((link, i) => (
                  <li key={link.href} className="overflow-hidden border-b border-line">
                    <motion.a
                      href={link.href}
                      onClick={(event) => go(event, link.href)}
                      className="flex items-baseline gap-5 py-5"
                      initial={{ y: "110%" }}
                      animate={{ y: "0%" }}
                      exit={{ y: "110%", transition: { duration: 0.4, ease: EASE } }}
                      transition={{ delay: 0.28 + i * 0.07, duration: 1, ease: EASE_OUT }}
                    >
                      <span className="eyebrow w-6 text-mist">0{i + 1}</span>
                      <span className="display-md text-ivory">{link.label}</span>
                    </motion.a>
                  </li>
                ))}
              </ul>
            </nav>

            <motion.div
              className="mt-auto space-y-6 pt-12"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, transition: { duration: 0.2 } }}
              transition={{ delay: 0.7, duration: 0.9, ease: EASE_OUT }}
            >
              <p className="max-w-xs text-sm leading-relaxed text-mist">
                An independent trade facilitation company.
              </p>
              <div className="flex flex-col gap-3">
                <a
                  href={call.href}
                  className="inline-flex items-center justify-between gap-4 bg-burgundy px-6 py-4 font-text text-[17px] text-paper"
                >
                  <span className="flex items-center gap-3">
                    <Phone className="h-4 w-4" strokeWidth={1.5} aria-hidden="true" />
                    {call.label}
                  </span>
                  <ArrowUpRight className="h-4 w-4" strokeWidth={1.5} aria-hidden="true" />
                </a>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    window.setTimeout(portal.open, 320);
                  }}
                  className="inline-flex items-center justify-between gap-4 border border-line-strong px-6 py-4 font-text text-[17px] text-ivory"
                >
                  <span className="flex items-center gap-3">
                    <KeyRound className="h-4 w-4" strokeWidth={1.5} aria-hidden="true" />
                    Client portal
                  </span>
                  <ArrowUpRight className="h-4 w-4" strokeWidth={1.5} aria-hidden="true" />
                </button>
              </div>
            </motion.div>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
