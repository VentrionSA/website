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
  // Transitions for the lock-up as it settles from the large hero size into the compact bar.
  const morph = "transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]";

  return (
    <>
      <motion.header
        initial={false}
        animate={{ y: hidden && !open ? "-105%" : "0%" }}
        transition={{ duration: 0.7, ease: EASE }}
        className={`fixed inset-x-0 top-0 z-50 border-b transition-[background-color,border-color,backdrop-filter] duration-700 ${
          solid ? "border-line bg-ink/80 backdrop-blur-xl" : "border-transparent bg-transparent"
        }`}
      >
        <div
          className={`shell flex items-center justify-between ${morph} ${
            solid ? "h-[68px]" : "h-[clamp(84px,7.5vw,128px)]"
          }`}
        >
          <a href="/#top" className="relative z-10 -m-2 p-2" aria-label="Ventrion, Global Commerce — back to top">
            <LogoLockup
              tagline
              className={`${morph} ${solid ? "gap-3" : "gap-3 lg:gap-[1.14vw]"}`}
              markClassName={`w-auto ${morph} ${solid ? "h-[30px]" : "h-[38px] lg:h-[clamp(44px,4.2vw,72px)]"}`}
              wordClassName={`h-auto ${morph} ${solid ? "w-[104px]" : "w-[118px] lg:w-[clamp(132px,12.3vw,212px)]"}`}
              taglineClassName={`${morph} ${
                solid ? "mt-0 max-h-0 opacity-0" : "mt-[0.95em] max-h-[2em] text-[7px] opacity-100 lg:text-[clamp(7px,0.623vw,10.75px)]"
              }`}
            />
          </a>

          <nav aria-label="Primary" className={`hidden lg:-mr-[0.9vw] lg:block ${morph} ${solid ? "" : "-translate-y-[0.8vw]"}`}>
            <ul className="flex items-center gap-[clamp(2.25rem,4.3vw,4.5rem)]">
              {NAV_LINKS.map((link) => {
                const id = link.href.replace("/#", "");
                const isActive = active === id;
                return (
                  <li key={link.href}>
                    <a
                      href={link.href}
                      aria-current={isActive ? "true" : undefined}
                      className={`link-draw font-text text-[clamp(17px,1.294vw,22px)] tracking-[0.025em] text-ivory transition-opacity duration-500 ${
                        isActive ? "" : "opacity-90 hover:opacity-100"
                      }`}
                    >
                      {link.label}
                    </a>
                  </li>
                );
              })}
            </ul>
          </nav>

          <div className="relative z-10 flex items-center gap-3 lg:hidden">
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
