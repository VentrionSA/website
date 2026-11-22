"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useMotionValueEvent, useScroll } from "motion/react";
import { usePathname } from "next/navigation";
import { LogoLockup } from "@/components/brand/Logo";
import { NAV_LINKS } from "@/lib/content";
import { MobileMenu } from "./MobileMenu";

const EASE = [0.22, 1, 0.36, 1] as const;

function useActiveSection(ids: string[], enabled: boolean) {
  const [active, setActive] = useState<string | null>(null);
  useEffect(() => {
    if (!enabled) return;
    const els = ids.map((id) => document.getElementById(id)).filter(Boolean) as HTMLElement[];
    if (!els.length) return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActive(entry.target.id);
        });
      },
      { rootMargin: "-45% 0px -50% 0px" },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [ids, enabled]);
  return active;
}

const SECTION_IDS = NAV_LINKS.map((l) => l.href.replace("/#", ""));

export function Navigation() {
  const pathname = usePathname();
  const isHome = pathname === "/";
  const { scrollY } = useScroll();
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [open, setOpen] = useState(false);
  const lastY = useRef(0);
  const active = useActiveSection(SECTION_IDS, isHome);

  useMotionValueEvent(scrollY, "change", (y) => {
    const prev = lastY.current;
    lastY.current = y;
    setScrolled(y > 32);
    if (open) return;
    if (y > 640 && y > prev + 6) setHidden(true);
    else if (y < prev - 6 || y <= 640) setHidden(false);
  });

  useEffect(() => {
    document.documentElement.dataset.menu = open ? "open" : "closed";
  }, [open]);

  const solid = scrolled && !open;

  return (
    <>
      <motion.header
        initial={false}
        animate={{ y: hidden && !open ? "-105%" : "0%" }}
        transition={{ duration: 0.7, ease: EASE }}
        className={`fixed inset-x-0 top-0 z-50 border-b transition-[background-color,border-color,backdrop-filter] duration-700 ${
          solid ? "border-line bg-ink/75 backdrop-blur-xl" : "border-transparent bg-transparent"
        }`}
      >
        <div className={`shell flex items-center justify-between transition-[height] duration-700 ${solid ? "h-[68px]" : "h-[84px]"}`}>
          <a href="/#top" className="relative z-10 -m-2 p-2" aria-label="Ventrion — back to top">
            <LogoLockup markClassName="h-[30px] w-auto" wordClassName="h-[11px] w-auto" />
          </a>

          <nav aria-label="Primary" className="hidden lg:block">
            <ul className="flex items-center gap-10">
              {NAV_LINKS.map((link) => {
                const id = link.href.replace("/#", "");
                const isActive = active === id;
                return (
                  <li key={link.href}>
                    <a
                      href={link.href}
                      aria-current={isActive ? "true" : undefined}
                      className={`link-draw text-[11px] font-medium uppercase tracking-[0.22em] transition-colors duration-500 ${
                        isActive ? "text-burgundy" : "text-ivory/80 hover:text-ivory"
                      }`}
                    >
                      {link.label}
                    </a>
                  </li>
                );
              })}
            </ul>
          </nav>

          <div className="relative z-10 flex items-center gap-3">
            <a
              href="/#contact"
              className="group hidden items-center gap-3 border border-gold/50 px-5 py-3 text-[10.5px] font-semibold uppercase tracking-[0.24em] text-ivory transition-colors duration-500 hover:border-burgundy hover:bg-burgundy hover:text-ink md:inline-flex"
            >
              <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-burgundy transition-colors duration-500 group-hover:bg-ink" />
              Request an Introduction
            </a>

            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              aria-expanded={open}
              aria-controls="mobile-menu"
              aria-label={open ? "Close menu" : "Open menu"}
              className="relative -mr-2 flex h-11 w-11 items-center justify-center lg:hidden"
            >
              <span className="relative block h-3 w-7">
                <span
                  className={`absolute left-0 h-px w-full bg-ivory transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                    open ? "top-1/2 rotate-45" : "top-0"
                  }`}
                />
                <span
                  className={`absolute left-0 h-px bg-ivory transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                    open ? "top-1/2 w-full -rotate-45" : "top-full w-2/3"
                  }`}
                />
              </span>
            </button>
          </div>
        </div>
      </motion.header>

      <MobileMenu open={open} onClose={() => setOpen(false)} />
    </>
  );
}
