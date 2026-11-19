"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import { useState } from "react";
import { useGraphicsTier } from "@/lib/device";
import heroGlobe from "@/assets/images/hero-globe.webp";

// Start downloading the 3D bundle as soon as this module evaluates (during
// hydration) rather than after the first effect — so the live globe is ready sooner.
const loadHeroCanvas = () => import("@/components/three/HeroCanvas");
if (typeof window !== "undefined") void loadHeroCanvas();
const HeroCanvas = dynamic(loadHeroCanvas, { ssr: false });

/**
 * The hero globe is painted immediately from a pre-rendered poster of the exact
 * same scene and framing (assets/images/hero-globe.webp), then cross-fades to the
 * live WebGL globe once its first frame is drawn. Devices without WebGL, low-power
 * devices and people who prefer reduced motion keep the poster.
 */
export function HeroVisual() {
  const tier = useGraphicsTier();
  const [ready, setReady] = useState(false);
  const webgl = tier === "high" || tier === "low";

  return (
    <div className="hero-stage absolute inset-0">
      <Image
        src={heroGlobe}
        alt=""
        aria-hidden="true"
        loading="eager"
        fetchPriority="high"
        sizes="(min-width: 1024px) 1500px, 820px"
        className={`hero-poster pointer-events-none select-none transition-opacity duration-700 ease-out ${webgl && ready ? "opacity-0" : "opacity-100"}`}
        draggable={false}
      />
      {webgl ? (
        <div className={`absolute inset-0 transition-opacity duration-700 ease-out ${ready ? "opacity-100" : "opacity-0"}`}>
          <HeroCanvas tier={tier} onReady={() => setReady(true)} />
        </div>
      ) : null}
    </div>
  );
}
