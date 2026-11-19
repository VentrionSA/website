"use client";

import { useEffect, useState, type RefObject } from "react";

export type GraphicsTier = "pending" | "none" | "low" | "high";

function hasWebGL(): boolean {
  try {
    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl2") || canvas.getContext("webgl");
    return !!gl;
  } catch {
    return false;
  }
}

/**
 * Decides how much 3D the device should get:
 *  - "none": no WebGL, or the user prefers reduced motion → static fallback art
 *  - "low":  small / low-power devices → lighter scenes, capped pixel ratio
 *  - "high": everything else
 */
export function detectGraphicsTier({ allowReducedMotion = false } = {}): Exclude<GraphicsTier, "pending"> {
  if (typeof window === "undefined") return "none";
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduce && !allowReducedMotion) return "none";
  if (!hasWebGL()) return "none";

  const nav = navigator as Navigator & {
    deviceMemory?: number;
    connection?: { saveData?: boolean; effectiveType?: string };
  };
  const cores = nav.hardwareConcurrency ?? 4;
  const memory = nav.deviceMemory ?? 4;
  const saveData = nav.connection?.saveData === true;
  const slowNet = /(^|-)2g$/.test(nav.connection?.effectiveType ?? "");
  const coarse = window.matchMedia("(pointer: coarse)").matches;
  const small = window.innerWidth < 768;

  if (saveData || slowNet || memory <= 2 || cores <= 2) return "none";
  if ((coarse && small) || cores <= 4 || memory <= 4) return "low";
  return "high";
}

export function useGraphicsTier(options?: { allowReducedMotion?: boolean }): GraphicsTier {
  const [tier, setTier] = useState<GraphicsTier>("pending");
  const allow = options?.allowReducedMotion ?? false;
  useEffect(() => {
    setTier(detectGraphicsTier({ allowReducedMotion: allow }));
  }, [allow]);
  return tier;
}

export function usePrefersReducedMotion(): boolean {
  const [reduce, setReduce] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduce(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  return reduce;
}

/** True once the element has come within `rootMargin` of the viewport (latches). */
export function useNearViewport<T extends Element>(ref: RefObject<T | null>, rootMargin = "600px 0px") {
  const [near, setNear] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || near) return;
    if (!("IntersectionObserver" in window)) {
      setNear(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setNear(true);
          io.disconnect();
        }
      },
      { rootMargin },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [ref, rootMargin, near]);
  return near;
}

/** Live visibility of an element (for pausing render loops off-screen). */
export function useInViewport<T extends Element>(ref: RefObject<T | null>, rootMargin = "0px") {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), { rootMargin });
    io.observe(el);
    return () => io.disconnect();
  }, [ref, rootMargin]);
  return visible;
}
