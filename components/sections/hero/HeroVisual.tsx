"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { useGraphicsTier } from "@/lib/device";

const HeroCanvas = dynamic(() => import("@/components/three/HeroCanvas"), { ssr: false });

/**
 * Static, CSS-only rendition of the armillary sphere. Shown while the 3D scene
 * loads, and permanently when WebGL is unavailable or motion is reduced.
 */
function HeroFallback({ className = "" }: { className?: string }) {
  return (
    <div aria-hidden="true" className={`pointer-events-none absolute inset-0 flex items-start justify-center pt-[16vh] lg:items-center lg:pt-0 ${className}`}>
      <div className="relative aspect-square w-[min(78vw,46vh)] lg:w-[min(36vw,54vh)]">
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background:
              "radial-gradient(circle at 34% 30%, #f3e3c0 0%, #c4a779 14%, #8a7350 34%, #3b3326 62%, #151513 82%)",
            boxShadow: "0 0 120px -20px rgba(196,167,121,0.35), inset -30px -40px 80px rgba(0,0,0,0.65)",
          }}
        />
        <div className="absolute -inset-[26%] rounded-full border border-gold/35" style={{ transform: "rotateX(72deg) rotateZ(-14deg)" }} />
        <div className="absolute -inset-[44%] rounded-full border border-gold/20" style={{ transform: "rotateX(64deg) rotateY(38deg)" }} />
        <div className="absolute -inset-[62%] rounded-full border border-dashed border-gold/15" style={{ transform: "rotateX(76deg) rotateZ(22deg)" }} />
      </div>
    </div>
  );
}

export function HeroVisual() {
  const tier = useGraphicsTier();
  const [ready, setReady] = useState(false);
  const webgl = tier === "high" || tier === "low";

  return (
    <div className="absolute inset-0 [perspective:1200px]">
      <HeroFallback className={`transition-opacity duration-[1800ms] ${webgl && ready ? "opacity-0" : "opacity-100"}`} />
      {webgl ? (
        <div className={`absolute inset-0 transition-opacity duration-[2200ms] ease-out ${ready ? "opacity-100" : "opacity-0"}`}>
          <HeroCanvas tier={tier} onReady={() => setReady(true)} />
        </div>
      ) : null}
    </div>
  );
}
