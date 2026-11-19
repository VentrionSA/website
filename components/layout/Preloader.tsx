"use client";

import { useEffect, useRef, useState } from "react";
import { LogoMark, LogoWordmark } from "@/components/brand/Logo";
import { getLenis, stopScroll, startScroll } from "@/lib/scroll";

const MIN_MS = 1150; // fast, but long enough to read as intentional
const MAX_MS = 2600; // never hold people back on a slow connection

/**
 * Homepage loading screen: the Ventrion star draws itself in a circular sweep
 * around a glowing centre while a 0–100% counter and hairline progress bar run,
 * then the curtain lifts. Rendered on the server so it paints instantly.
 */
export function Preloader() {
  const [progress, setProgress] = useState(0);
  const [leaving, setLeaving] = useState(false);
  const [gone, setGone] = useState(false);
  const loaded = useRef(false);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    // Skip for reduced motion, and for deep links (/#contact) so they land immediately.
    if (reduce || window.location.hash) {
      setGone(true);
      return;
    }
    stopScroll();
    const onLoad = () => (loaded.current = true);
    if (document.readyState === "complete") onLoad();
    else window.addEventListener("load", onLoad, { once: true });

    const start = performance.now();
    let raf = 0;
    let shown = 0;
    const tick = (now: number) => {
      const t = now - start;
      getLenis()?.stop();
      // Ease towards 90% on time alone; the last stretch waits for the page to load.
      const timeTarget = Math.min(1, t / MIN_MS);
      const eased = 1 - Math.pow(1 - timeTarget, 3);
      const ceiling = loaded.current || t > MAX_MS ? 100 : 90;
      const target = Math.min(ceiling, eased * 100);
      shown += (target - shown) * 0.22;
      if (target === 100 && shown > 99.4) shown = 100;
      setProgress(shown);
      if (shown >= 100) {
        setLeaving(true);
        window.setTimeout(() => {
          setGone(true);
          startScroll();
        }, 650);
        return;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("load", onLoad);
      startScroll();
    };
  }, []);

  if (gone) return null;
  const pct = Math.round(progress);

  return (
    <div
      id="preloader"
      role="progressbar"
      aria-label="Loading"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={pct}
      className="preloader fixed inset-0 z-[95] flex items-center justify-center bg-ink"
      data-leaving={leaving ? "" : undefined}
    >
      <div className="preloader-inner flex flex-col items-center">
        <div className="relative h-28 w-28 sm:h-32 sm:w-32">
          {/* glowing core */}
          <span aria-hidden="true" className="preloader-glow absolute left-1/2 top-1/2 h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gold-soft" />
          {/* faint full mark + the mark revealed by a conic sweep tied to progress */}
          <LogoMark className="absolute inset-0 h-full w-full text-ivory/[0.08]" />
          <div
            className="preloader-mark absolute inset-0"
            style={{
              WebkitMaskImage: `conic-gradient(from 0deg, #000 ${progress * 3.6}deg, transparent ${progress * 3.6}deg)`,
              maskImage: `conic-gradient(from 0deg, #000 ${progress * 3.6}deg, transparent ${progress * 3.6}deg)`,
            }}
          >
            <LogoMark className="h-full w-full text-gold-soft" />
          </div>
        </div>
        <div className="mt-7 text-ivory transition-[opacity,letter-spacing] duration-700" style={{ opacity: Math.min(1, Math.max(0, (progress - 35) / 40)) }}>
          <LogoWordmark className="h-[13px] w-auto" />
        </div>
      </div>

      <p className="eyebrow absolute bottom-7 left-1/2 -translate-x-1/2 text-[10px] tabular-nums text-mist">
        Loading {pct}%
      </p>
      <span aria-hidden="true" className="absolute bottom-0 left-0 h-px bg-gold" style={{ width: `${progress}%` }} />
    </div>
  );
}
