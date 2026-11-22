"use client";

import Image, { type StaticImageData } from "next/image";
import { useRef } from "react";
import { gsap, MOTION_QUERIES, useGSAP } from "@/lib/gsap";

/**
 * Full-bleed photographic background:
 * the photo stays clearly visible, a directional ivory overlay keeps the text
 * side readable, and the image drifts with a scroll-linked parallax.
 * The parent must be `relative isolate`.
 */
export function SectionBackdrop({
  src,
  position = "50% 50%",
  wash = 0.45,
  side = "left",
  saturate = 1,
  edges = true,
  priority = false,
}: {
  src: StaticImageData;
  position?: string;
  /** 0–1: base cream wash across the whole photo. */
  wash?: number;
  /** Which side carries the text and gets the stronger overlay ("none" for no side overlay). */
  side?: "left" | "right" | "both" | "none";
  /** Colour saturation of the photo (1 = original). */
  saturate?: number;
  /** Fade the photo into the page colour at the section's top and bottom edges. */
  edges?: boolean;
  priority?: boolean;
}) {
  const root = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MOTION_QUERIES.motion, () => {
        gsap.fromTo(
          "[data-backdrop-media]",
          { scale: 1.12, yPercent: -4 },
          {
            scale: 1.02,
            yPercent: 4,
            ease: "none",
            scrollTrigger: { trigger: root.current?.parentElement, start: "top bottom", end: "bottom top", scrub: true },
          },
        );
      });
    },
    { scope: root },
  );

  const sideGradient =
    side === "none"
      ? ""
      : side === "both"
      ? "bg-[radial-gradient(70%_80%_at_50%_50%,transparent_0%,var(--color-ink)_100%)] opacity-70"
      : side === "left"
        ? "bg-gradient-to-r from-ink via-ink/75 to-ink/10"
        : "bg-gradient-to-l from-ink via-ink/75 to-ink/10";

  return (
    <div ref={root} aria-hidden="true" className="pointer-events-none absolute inset-0 -z-30 overflow-clip">
      {/* Viewport-sized sticky layer: the photo is never stretched over tall sections */}
      <div className="sticky top-0 h-[100svh] w-full overflow-hidden">
        <div data-backdrop-media className="absolute inset-0 will-change-transform">
          <Image
            src={src}
            alt=""
            fill
            sizes="100vw"
            quality={85}
            placeholder="blur"
            {...(priority ? { loading: "eager" as const, fetchPriority: "high" as const } : {})}
            className="object-cover"
            style={{ objectPosition: position, ...(saturate !== 1 ? { filter: `saturate(${saturate})` } : {}) }}
          />
        </div>
        {wash > 0 ? <div className="absolute inset-0 bg-ink" style={{ opacity: wash }} /> : null}
        {sideGradient ? <div className={`absolute inset-0 ${sideGradient}`} /> : null}
      </div>
      {edges ? (
        <>
          <div className="absolute inset-x-0 top-0 h-48 bg-gradient-to-b from-ink to-transparent" />
          <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-ink to-transparent" />
        </>
      ) : null}
    </div>
  );
}
