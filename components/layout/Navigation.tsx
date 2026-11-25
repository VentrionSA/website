"use client";

import { useEffect, useState } from "react";
import { useMotionValueEvent, useScroll } from "motion/react";
import { usePathname } from "next/navigation";
import { KeyRound } from "lucide-react";
import { LogoLockup } from "@/components/brand/Logo";
import { PortalTrigger } from "@/components/portal/ClientPortal";
import { NAV_LINKS } from "@/lib/content";
import { MobileMenu } from "./MobileMenu";

function useActiveSection(ids: string[], enabled: boolean) {
  const [active, setActive] = useState<string | null>(null);
  useEffect(() => {
    if (!enabled) return;
    const els = ids.map((id) => document.getElementById(id)).filter(Boolean) as HTMLElement[];
    if (!els.length) return;
    // Only the section crossing the middle of the screen is current; between linked
    // sections (the figure, the principles, the closing line) no link is underlined.
    const inBand = new Set<string>();
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) inBand.add(entry.target.id);
          else inBand.delete(entry.target.id);
        });
        setActive(ids.find((id) => inBand.has(id)) ?? null);
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
  const [open, setOpen] = useState(false);
  const active = useActiveSection(SECTION_IDS, isHome);

  // The bar is always in view, on every section; it only condenses once the page scrolls.
  useMotionValueEvent(scrollY, "change", (y) => setScrolled(y > 32));

  useEffect(() => {
    document.documentElement.dataset.menu = open ? "open" : "closed";
  }, [open]);

  const solid = scrolled && !open;
  // Transitions for the lock-up as it settles from the large hero size into the compact bar.
  const morph = "transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]";

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-[60] border-b transition-[background-color,border-color,backdrop-filter] duration-700 ${
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
              // the type size holds while the tagline folds away, so it never widens the lock-up
              taglineClassName={`${morph} text-[7px] lg:text-[clamp(7px,0.623vw,10.75px)] ${
                solid ? "mt-0 max-h-0 opacity-0" : "mt-[0.95em] max-h-[2em] opacity-100"
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
              <li className="flex items-center gap-[clamp(2.25rem,4.3vw,4.5rem)]">
                <span aria-hidden="true" className="h-5 w-px bg-mark/30" />
                <PortalTrigger className="link-draw flex items-center gap-2 font-text text-[clamp(15px,1.12vw,19px)] tracking-[0.025em] text-ivory opacity-90 transition-opacity duration-500 hover:opacity-100">
                  <KeyRound className="h-[0.95em] w-[0.95em]" strokeWidth={1.5} aria-hidden="true" />
                  Client portal
                </PortalTrigger>
              </li>
            </ul>
          </nav>

          <div className="relative z-10 flex items-center gap-1 lg:hidden">
            <PortalTrigger
              label="Client portal"
              className="flex h-11 w-11 items-center justify-center text-ivory transition-opacity hover:opacity-80"
            >
              <KeyRound className="h-[18px] w-[18px]" strokeWidth={1.5} aria-hidden="true" />
            </PortalTrigger>
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
      </header>

      <MobileMenu open={open} onClose={() => setOpen(false)} />
    </>
  );
}
