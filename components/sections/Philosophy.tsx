"use client";

import Image from "next/image";
import { useRef } from "react";
import { gsap, MOTION_QUERIES, useGSAP } from "@/lib/gsap";
import { PHILOSOPHY_MEDIA } from "@/lib/media";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { SplitHeading } from "@/components/ui/SplitHeading";
import { Reveal } from "@/components/ui/Reveal";

// A deliberately sparse network: nodes in a 1600×900 space.
const NODES: [number, number][] = [
  [140, 640],
  [380, 520],
  [520, 720],
  [760, 430],
  [930, 600],
  [1120, 380],
  [1270, 560],
  [1460, 300],
  [640, 250],
  [1010, 180],
];
const LINKS: [number, number][] = [
  [0, 1],
  [1, 2],
  [1, 3],
  [3, 4],
  [3, 8],
  [4, 5],
  [5, 6],
  [5, 7],
  [8, 9],
  [9, 5],
  [2, 4],
  [6, 7],
];

function curve([x1, y1]: [number, number], [x2, y2]: [number, number]) {
  const mx = (x1 + x2) / 2;
  const my = (y1 + y2) / 2 - Math.abs(x2 - x1) * 0.18;
  return `M${x1} ${y1} Q${mx} ${my} ${x2} ${y2}`;
}

export function Philosophy() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MOTION_QUERIES.motion, () => {
        gsap.fromTo(
          "[data-philo-media]",
          { scale: 1.25, yPercent: -8 },
          { scale: 1.02, yPercent: 8, ease: "none", scrollTrigger: { trigger: root.current, start: "top bottom", end: "bottom top", scrub: true } },
        );
        gsap.fromTo(
          "[data-philo-link]",
          { strokeDasharray: 1, strokeDashoffset: 1 },
          {
            strokeDashoffset: 0,
            duration: 2.4,
            stagger: 0.12,
            ease: "power2.inOut",
            scrollTrigger: { trigger: root.current, start: "top 60%", once: true },
          },
        );
        gsap.from("[data-philo-node]", {
          scale: 0,
          transformOrigin: "50% 50%",
          duration: 1,
          stagger: 0.08,
          ease: "back.out(2)",
          scrollTrigger: { trigger: root.current, start: "top 55%", once: true },
        });
      });
    },
    { scope: root },
  );

  return (
    <section ref={root} id="philosophy" aria-labelledby="philosophy-title" className="relative isolate overflow-hidden bg-ink">
      <div data-philo-media className="absolute inset-0 -z-20 will-change-transform">
        <Image src={PHILOSOPHY_MEDIA.src} alt={PHILOSOPHY_MEDIA.alt} fill sizes="100vw" quality={75} placeholder="blur" className="object-cover" />
      </div>
      <div aria-hidden="true" className="absolute inset-0 -z-10 bg-ink/55" />
      <div aria-hidden="true" className="absolute inset-0 -z-10 bg-[radial-gradient(70%_70%_at_50%_50%,transparent_20%,rgba(16,17,16,0.92)_100%)]" />
      <div aria-hidden="true" className="absolute inset-x-0 top-0 -z-10 h-40 bg-gradient-to-b from-ink to-transparent" />
      <div aria-hidden="true" className="absolute inset-x-0 bottom-0 -z-10 h-40 bg-gradient-to-t from-ink to-transparent" />

      {/* Animated network overlay */}
      <svg aria-hidden="true" className="absolute inset-0 -z-10 h-full w-full" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice">
        {LINKS.map(([a, b], i) => (
          <g key={i}>
            <path data-philo-link pathLength={1} d={curve(NODES[a], NODES[b])} fill="none" stroke="#c4a779" strokeOpacity={0.45} strokeWidth={1} vectorEffect="non-scaling-stroke" />
            <path d={curve(NODES[a], NODES[b])} fill="none" stroke="#f1dcb2" strokeOpacity={0.5} strokeWidth={1} className="dash-flow" vectorEffect="non-scaling-stroke" style={{ animationDuration: `${7 + (i % 4)}s` }} />
          </g>
        ))}
        {NODES.map(([x, y], i) => (
          <g key={i} data-philo-node>
            <circle cx={x} cy={y} r={14} fill="none" stroke="#c4a779" strokeOpacity={0.25} vectorEffect="non-scaling-stroke" />
            <circle cx={x} cy={y} r={3.5} fill="#e9d6b0" />
          </g>
        ))}
      </svg>

      <div className="shell relative flex min-h-[110svh] flex-col justify-center py-[clamp(7rem,14vw,12rem)]">
        <Eyebrow index="07">Global Trade Philosophy</Eyebrow>
        <SplitHeading id="philosophy-title" className="display-xl mt-8 max-w-[13ch] text-ivory">
          Essential commodities. <em className="text-gold">Connected opportunities.</em>
        </SplitHeading>
        <Reveal className="mt-10 max-w-xl lg:ml-[41.66%]">
          <p className="text-lg leading-relaxed text-ivory/80 sm:text-xl">
            Behind every successful commodity transaction is a network of relationships, informed decisions and
            coordinated execution. Our role is to help bring those elements together.
          </p>
        </Reveal>
      </div>
    </section>
  );
}
