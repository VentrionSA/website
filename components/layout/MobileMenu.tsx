"use client";

import { useEffect, useRef, type MouseEvent } from "react";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { ArrowRight, ArrowUpRight, KeyRound, Phone } from "lucide-react";
import { MENU_LINKS } from "@/lib/content";
import { getCallAction } from "@/lib/site";
import { scrollToId, startScroll, stopScroll } from "@/lib/scroll";
import { useActiveSection } from "@/lib/useActiveSection";
import { useClientPortal } from "@/components/portal/ClientPortal";
import { LogoMark } from "@/components/brand/Logo";

const EASE = [0.76, 0, 0.24, 1] as const;
const EASE_OUT = [0.22, 1, 0.36, 1] as const;
const SECTION_IDS = MENU_LINKS.flatMap((l) => l.sections);

/**
 * The phone menu: the page's five sections, numbered as on the page, the one in view
 * marked in burgundy, each with a line of its own where the screen is tall enough. The
 * Ventrion star rests half off the right edge, as in the footer, and the tagline and the
 * two ways in (a meeting, the client portal) close it.
 */
export function MobileMenu({ open, onClose }: { open: boolean; onClose: () => void }) {
  const panelRef = useRef<HTMLDivElement>(null);
  const portal = useClientPortal();
  const call = getCallAction();
  const isHome = usePathname() === "/";
  const active = useActiveSection(SECTION_IDS, isHome);

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
          className="fixed inset-0 z-40 overflow-hidden bg-ink lg:hidden"
          initial={{ clipPath: "inset(0% 0% 100% 0%)" }}
          animate={{ clipPath: "inset(0% 0% 0% 0%)" }}
          exit={{ clipPath: "inset(0% 0% 100% 0%)" }}
          transition={{ duration: 0.85, ease: EASE }}
        >
          {/* the star, half off the right edge, as in the footer */}
          <motion.div
            aria-hidden="true"
            className="pointer-events-none absolute right-0 top-[44%] translate-x-1/2 -translate-y-1/2 text-mark/[0.07]"
            initial={{ opacity: 0, rotate: -12 }}
            animate={{ opacity: 1, rotate: 0 }}
            transition={{ delay: 0.35, duration: 1.6, ease: EASE_OUT }}
          >
            <LogoMark className="float-mark h-[min(120vw,46rem)] w-auto" />
          </motion.div>
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_50%_at_85%_10%,rgba(24,67,53,0.06),transparent_70%)]"
          />

          <div className="shell relative flex h-full flex-col overflow-y-auto pb-[calc(1.25rem+env(safe-area-inset-bottom))] pt-[5.75rem]">
            <nav aria-label="Mobile">
              <ul className="border-t border-line">
                {MENU_LINKS.map((link, i) => {
                  const current = active !== null && link.sections.includes(active);
                  return (
                    <li key={link.href} className="overflow-hidden border-b border-line">
                      <motion.a
                        href={link.href}
                        onClick={(event) => go(event, link.href)}
                        aria-current={current ? "true" : undefined}
                        className="group flex items-center gap-4 py-2.5 [@media(min-height:730px)]:py-3"
                        initial={{ y: "110%" }}
                        animate={{ y: "0%" }}
                        exit={{ y: "110%", transition: { duration: 0.4, ease: EASE } }}
                        transition={{ delay: 0.28 + i * 0.06, duration: 1, ease: EASE_OUT }}
                      >
                        <span className={`eyebrow w-7 shrink-0 self-start pt-[0.8rem] tabular-nums [@media(max-height:620px)]:pt-[0.65rem] ${current ? "text-burgundy" : "text-mist"}`}>
                          {link.index}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span
                            className={`block font-serif text-[clamp(1.85rem,8.2vw,2.4rem)] leading-[1.08] text-ivory [@media(max-height:620px)]:text-[1.6rem] ${current ? "italic" : ""}`}
                          >
                            {link.label}
                          </span>
                          <span className="mt-1 hidden truncate font-text text-[12.5px] tracking-[0.01em] text-mist [@media(min-height:820px)]:block">
                            {link.note}
                          </span>
                        </span>
                        <ArrowRight
                          className={`h-4 w-4 shrink-0 transition-transform duration-500 group-active:translate-x-1 ${current ? "text-burgundy" : "text-mist/60"}`}
                          strokeWidth={1.5}
                          aria-hidden="true"
                        />
                      </motion.a>
                    </li>
                  );
                })}
              </ul>
            </nav>

            <motion.div
              className="mt-auto pt-7"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, transition: { duration: 0.2 } }}
              transition={{ delay: 0.7, duration: 0.9, ease: EASE_OUT }}
            >
              <p className="font-serif text-[1.4rem] leading-[1.15] text-ivory [@media(max-height:620px)]:hidden">
                <span className="block">Creating opportunities.</span>
                <em className="block text-burgundy">In every direction.</em>
              </p>
              <div className="mt-5 flex flex-col gap-2.5 [@media(max-height:620px)]:mt-0">
                <a href={call.href} className="flex items-center gap-4 bg-burgundy px-5 py-3 text-paper shadow-[0_18px_40px_-24px_rgba(150,25,42,0.7)]">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-paper/40">
                    <Phone className="h-4 w-4" strokeWidth={1.5} aria-hidden="true" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block whitespace-nowrap font-text text-[10.5px] uppercase tracking-[0.24em] text-paper/80 max-[359px]:tracking-[0.14em]">{call.label}</span>
                    <span className="mt-1 block font-serif text-[1.3rem] leading-none [font-variant-numeric:lining-nums_tabular-nums]">
                      {call.isPhone ? call.detail : "Speak with us"}
                    </span>
                  </span>
                  <ArrowUpRight className="h-4 w-4 shrink-0" strokeWidth={1.5} aria-hidden="true" />
                </a>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    window.setTimeout(portal.open, 320);
                  }}
                  className="flex items-center gap-4 border border-line-strong bg-ink/70 px-5 py-3 text-left text-ivory backdrop-blur-[2px]"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-line-strong">
                    <KeyRound className="h-4 w-4 text-mark" strokeWidth={1.5} aria-hidden="true" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-text text-[10.5px] uppercase tracking-[0.24em] text-mist">Client portal</span>
                    <span className="mt-1 block whitespace-nowrap font-serif text-[1.3rem] leading-none max-[359px]:text-[1.12rem]">Track your progress</span>
                  </span>
                  <ArrowUpRight className="h-4 w-4 shrink-0" strokeWidth={1.5} aria-hidden="true" />
                </button>
              </div>
            </motion.div>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
