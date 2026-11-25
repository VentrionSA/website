"use client";

import Image, { type StaticImageData } from "next/image";
import { useEffect, useRef, useState } from "react";
import { PRINCIPLES, type PrincipleId } from "@/lib/content";
import principals from "@/assets/images/principles/principals.jpg";
import local from "@/assets/images/principles/local.jpg";
import quality from "@/assets/images/principles/quality.jpg";
import accountability from "@/assets/images/principles/accountability.jpg";

/**
 * One photograph per principle, graded to the site's deep green and ivory.
 * These are placeholders: to replace one, swap its file in
 * assets/images/principles/ (square, subject near the centre, about 1600px)
 * and adjust its framing below if needed.
 *
 *   I    principals      two hands meeting: the decision-makers themselves
 *   II   local           a lighthouse at dusk: guidance from those who know the water
 *   III  quality         a single king on a dark board: one name that counts
 *   IV   accountability  an antique globe turned to Arabia and the Indian Ocean
 */
const IMAGES: Record<PrincipleId, { src: StaticImageData; desktop: string; mobile: string }> = {
  principals: { src: principals, desktop: "50% 50%", mobile: "50% 50%" },
  local: { src: local, desktop: "52% 50%", mobile: "50% 50%" },
  quality: { src: quality, desktop: "60% 50%", mobile: "50% 50%" },
  accountability: { src: accountability, desktop: "50% 50%", mobile: "50% 20%" },
};

/** A fine inset rule over the photograph, like a print's mount. */
function Mount() {
  return <span aria-hidden="true" className="pointer-events-none absolute inset-3 z-[3] border border-paper/25" />;
}

/**
 * Desktop: the pinned frame beside the principles. The photograph of the principle in view
 * fades in over the last one and settles from a slight zoom.
 */
export function PrincipleFrame({ active }: { active: number }) {
  // The previous photograph stays fully visible underneath while the next fades in over it.
  const [shown, setShown] = useState({ current: active, previous: active });
  if (shown.current !== active) setShown({ current: active, previous: shown.current });

  return (
    <div className="relative aspect-[4/5] w-full overflow-hidden bg-[#0b231c]">
      {PRINCIPLES.map((principle, i) => {
        const image = IMAGES[principle.id];
        const state = i === shown.current ? "current" : i === shown.previous ? "previous" : "hidden";
        return (
          <div
            key={principle.id}
            className={`absolute inset-0 ease-premium motion-safe:transition-[opacity,scale] motion-safe:duration-[1100ms,1800ms] ${
              state === "current"
                ? "z-[2] scale-100 opacity-100"
                : state === "previous"
                  ? "z-[1] scale-100 opacity-100"
                  : "z-0 opacity-0 motion-safe:scale-[1.06]"
            }`}
          >
            <Image
              src={image.src}
              alt=""
              fill
              quality={80}
              placeholder="blur"
              sizes="(min-width: 1024px) 560px, 100vw"
              className="object-cover"
              style={{ objectPosition: image.desktop }}
            />
          </div>
        );
      })}
      <Mount />
    </div>
  );
}

/** Small screens: the photograph sits above its principle and rises into view once. */
export function PrincipleInlineImage({ id }: { id: PrincipleId }) {
  const ref = useRef<HTMLDivElement>(null);
  const [seen, setSeen] = useState(false);
  const image = IMAGES[id];

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setSeen(true);
          io.disconnect();
        }
      },
      { rootMargin: "0px 0px -15% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={ref} className="relative mb-10 aspect-square w-full max-w-[26rem] overflow-hidden lg:hidden">
      <div
        className={`absolute inset-0 ease-premium motion-safe:transition-[clip-path,scale] motion-safe:duration-[1300ms,1800ms] ${
          seen ? "scale-100 [clip-path:inset(0)]" : "motion-safe:scale-[1.08] motion-safe:[clip-path:inset(100%_0_0_0)]"
        }`}
      >
        <Image
          src={image.src}
          alt=""
          fill
          quality={80}
          placeholder="blur"
          sizes="(min-width: 640px) 26rem, 100vw"
          className="object-cover"
          style={{ objectPosition: image.mobile }}
        />
        <Mount />
      </div>
    </div>
  );
}
