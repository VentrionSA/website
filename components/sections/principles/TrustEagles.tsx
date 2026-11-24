"use client";

import Image from "next/image";
import { useRef } from "react";
import { gsap, MOTION_QUERIES, useGSAP } from "@/lib/gsap";
import eagles from "@/assets/images/art/trust-eagles.jpg";

/**
 * Two eagles, talons clasped in flight: the trust between two partners.
 * Artwork from Ventrion's design, cleaned, upscaled and graded to the site's
 * ivory and green. As it scrolls through, the pair turns slowly within its
 * vortex of cloud, the way eagles spiral together.
 */
export function TrustEagles() {
  const root = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MOTION_QUERIES.motion, () => {
        const tl = gsap.timeline({
          defaults: { ease: "none" },
          scrollTrigger: { trigger: root.current, start: "top bottom", end: "bottom top", scrub: 0.9 },
        });
        tl.fromTo("[data-eagles]", { rotate: -8, scale: 0.9, autoAlpha: 0.15 }, { rotate: 0, scale: 1, autoAlpha: 1, duration: 0.5 })
          .to("[data-eagles]", { rotate: 5, scale: 1.03, duration: 0.5 });
      });
    },
    { scope: root },
  );

  // Soft-edged frame: fades on all four sides; the eagles sit well inside it.
  const fade =
    "linear-gradient(90deg,transparent 0%,rgba(0,0,0,0.55) 9%,#000 17%,#000 83%,rgba(0,0,0,0.55) 91%,transparent 100%),linear-gradient(180deg,transparent 0%,rgba(0,0,0,0.6) 6%,#000 11%,#000 82%,rgba(0,0,0,0.55) 91%,transparent 100%)";

  return (
    <div
      ref={root}
      aria-hidden="true"
      className="pointer-events-none relative mt-2 w-[136vw] max-w-[90rem] shrink-0 sm:w-[118vw] lg:mt-0 lg:w-[100vw]"
    >
      <div
        data-eagles
        className="relative aspect-[3264/1924] w-full will-change-transform"
        style={{ maskImage: fade, WebkitMaskImage: fade, maskComposite: "intersect", WebkitMaskComposite: "source-in" }}
      >
        <Image
          src={eagles}
          alt=""
          fill
          quality={86}
          placeholder="blur"
          sizes="(min-width: 1440px) 1440px, 136vw"
          className="object-cover"
        />
      </div>
    </div>
  );
}
