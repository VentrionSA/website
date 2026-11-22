"use client";

import { useEffect, useRef, type MouseEvent } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ArrowUpRight } from "lucide-react";
import { NAV_LINKS } from "@/lib/content";
import { getWhatsAppHref } from "@/lib/site";
import { scrollToId, startScroll, stopScroll } from "@/lib/scroll";
import { WhatsAppIcon } from "@/components/ui/icons";

const EASE = [0.76, 0, 0.24, 1] as const;
const EASE_OUT = [0.22, 1, 0.36, 1] as const;

export function MobileMenu({ open, onClose }: { open: boolean; onClose: () => void }) {
  const panelRef = useRef<HTMLDivElement>(null);
  const whatsapp = getWhatsAppHref();

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
    const focusTimer = window.setTimeout(() => panelRef.current?.querySelector<HTMLElement>("a[href]")?.focus(), 350);
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
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_50%_at_85%_10%,rgba(196,167,121,0.12),transparent_70%)]"
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
                      <span className="eyebrow w-6 text-gold">0{i + 1}</span>
                      <span className="display-md">{link.label}</span>
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
                The meeting point between buyers and sellers.
              </p>
              <div className="flex flex-col gap-3 sm:flex-row">
                <a
                  href="/#contact"
                  onClick={(event) => go(event, "/#contact")}
                  className="inline-flex items-center justify-between gap-4 bg-burgundy px-6 py-4 text-[11px] font-semibold uppercase tracking-[0.24em] text-ink"
                >
                  Request an Introduction
                  <ArrowUpRight className="h-4 w-4" strokeWidth={1.5} aria-hidden="true" />
                </a>
                <a
                  href={whatsapp ?? "/#contact"}
                  onClick={whatsapp ? undefined : (event) => go(event, "/#contact")}
                  {...(whatsapp ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                  className="inline-flex items-center justify-between gap-4 border border-line-strong px-6 py-4 text-[11px] font-semibold uppercase tracking-[0.24em] text-ivory"
                >
                  WhatsApp
                  <WhatsAppIcon className="h-4 w-4 text-whatsapp" />
                </a>
              </div>
            </motion.div>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
