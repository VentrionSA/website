"use client";

import Image from "next/image";
import { useRef, type MouseEvent } from "react";
import { gsap, MOTION_QUERIES, useGSAP } from "@/lib/gsap";
import { SECTORS, type Sector } from "@/lib/content";
import { SECTOR_MEDIA } from "@/lib/media";
import { scrollToId } from "@/lib/scroll";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { SplitHeading } from "@/components/ui/SplitHeading";
import { Reveal } from "@/components/ui/Reveal";
import { ArrowLink } from "@/components/ui/ArrowLink";

import { PREFILL_EVENT } from "@/lib/events";

function SectorPanel({ sector, index, total }: { sector: Sector; index: number; total: number }) {
  const media = SECTOR_MEDIA[sector.id];
  const mirrored = index % 2 === 1;

  const discuss = (event: MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    window.dispatchEvent(new CustomEvent(PREFILL_EVENT, { detail: sector.interest }));
    scrollToId("contact");
  };

  return (
    <article
      id={sector.id}
      data-panel
      aria-labelledby={`${sector.id}-title`}
      className="group/panel sticky top-0 h-[100svh] overflow-hidden"
    >
      <div data-panel-inner className="relative h-full w-full origin-[50%_0%] overflow-hidden bg-ink will-change-transform">
        <div data-panel-media className="absolute inset-0 will-change-transform">
          <Image
            src={media.src}
            alt={media.alt}
            fill
            sizes="100vw"
            quality={75}
            placeholder="blur"
            className="object-cover transition-transform duration-[2200ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover/panel:scale-[1.035]"
          />
        </div>

        {/* Grading overlays */}
        <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-ink via-ink/35 to-ink/30" />
        <div
          aria-hidden="true"
          className={`absolute inset-0 ${mirrored ? "bg-gradient-to-l" : "bg-gradient-to-r"} from-ink/85 via-ink/25 to-transparent`}
        />
        <div aria-hidden="true" className="absolute inset-0 shadow-[inset_0_0_220px_60px_rgba(0,0,0,0.55)]" />
        <div data-panel-shade aria-hidden="true" className="pointer-events-none absolute inset-0 bg-ink opacity-0" />

        {/* Oversized index numeral */}
        <span
          aria-hidden="true"
          className={`text-outline pointer-events-none absolute top-[9vh] select-none font-serif text-[clamp(9rem,26vw,26rem)] leading-none tracking-[-0.04em] ${
            mirrored ? "left-[3vw]" : "right-[3vw]"
          }`}
        >
          {sector.index}
        </span>

        <div className="shell relative flex h-full flex-col justify-between pb-[clamp(2rem,7vh,5rem)] pt-[clamp(5.5rem,13vh,8.5rem)]">
          <div data-panel-reveal className={`flex items-center gap-6 ${mirrored ? "justify-end" : ""}`}>
            <p className="eyebrow text-gold">
              Sector {sector.index} <span className="text-mist">/ {String(total).padStart(2, "0")}</span>
            </p>
          </div>

          <div className="grid gap-8 lg:grid-cols-12 lg:items-end">
            <div className={`lg:col-span-7 ${mirrored ? "lg:order-2 lg:col-start-6 lg:pr-20 lg:text-right" : ""}`}>
              <ul data-panel-reveal className={`eyebrow mb-6 flex flex-wrap gap-x-5 gap-y-2 text-ivory/75 ${mirrored ? "lg:justify-end" : ""}`}>
                {sector.products.map((p, i) => (
                  <li key={p} className="flex items-center gap-5">
                    {i > 0 ? <span aria-hidden="true" className="h-1 w-1 rounded-full bg-gold/70" /> : null}
                    {p}
                  </li>
                ))}
              </ul>
              <h3 id={`${sector.id}-title`} data-panel-reveal className="display-xl text-ivory">
                {sector.name}
              </h3>
            </div>
            <div className={`lg:col-span-4 ${mirrored ? "lg:order-1 lg:col-start-1" : "lg:col-start-9"}`}>
              <span data-panel-reveal aria-hidden="true" className="mb-6 block h-px w-16 bg-gold" />
              <p data-panel-reveal className="max-w-md text-[15px] leading-relaxed text-ivory/80 sm:text-base">
                {sector.description}
              </p>
              <div data-panel-reveal className="mt-8">
                <ArrowLink href="/#contact" variant="text" onClick={discuss}>
                  Discuss {sector.name}
                </ArrowLink>
              </div>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}

export function Commodities() {
  const stack = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MOTION_QUERIES.motion, () => {
        const panels = gsap.utils.toArray<HTMLElement>("[data-panel]");
        const markers = gsap.utils.toArray<HTMLElement>("[data-marker]");
        panels.forEach((panel, i) => {
          const inner = panel.querySelector("[data-panel-inner]");
          const mediaEl = panel.querySelector("[data-panel-media]");
          const shade = panel.querySelector("[data-panel-shade]");
          const reveal = panel.querySelectorAll("[data-panel-reveal]");
          const marker = markers[i];
          const next = markers[i + 1];

          gsap.fromTo(
            mediaEl,
            { scale: 1.22, yPercent: -5 },
            { scale: 1.04, yPercent: 5, ease: "none", scrollTrigger: { trigger: marker, start: "top bottom", end: "bottom top", scrub: true } },
          );
          gsap.from(reveal, {
            y: 56,
            autoAlpha: 0,
            duration: 1.3,
            stagger: 0.08,
            ease: "expo.out",
            scrollTrigger: { trigger: marker, start: "top 45%", toggleActions: "play none none reverse" },
          });
          if (next) {
            const st = { trigger: next, start: "top bottom", end: "top top", scrub: true };
            gsap.to(inner, { scale: 0.9, ease: "none", scrollTrigger: st });
            gsap.to(shade, { opacity: 0.72, ease: "none", scrollTrigger: st });
          }
        });
      });
    },
    { scope: stack },
  );

  return (
    <section id="commodities" aria-labelledby="commodities-title" className="relative bg-ink">
      <div className="shell pb-[clamp(4rem,8vw,7rem)] pt-[clamp(6rem,12vw,11rem)]">
        <Eyebrow index="03">Commodities</Eyebrow>
        <div className="mt-8 grid gap-10 lg:grid-cols-12 lg:items-end">
          <SplitHeading id="commodities-title" className="display-lg max-w-[13ch] text-ivory lg:col-span-8">
            Focused on <em className="text-gold">essential</em> commodities.
          </SplitHeading>
          <Reveal className="lg:col-span-4">
            <p className="text-[16px] leading-relaxed text-mist">
              Four sectors at the heart of global trade. Each opportunity is approached with the same discipline — market
              understanding, qualified counterparties and a considered process.
            </p>
          </Reveal>
        </div>
      </div>

      <div ref={stack} className="relative">
        {SECTORS.map((sector, i) => (
          <div
            key={`marker-${sector.id}`}
            data-marker
            aria-hidden="true"
            className="pointer-events-none absolute left-0 w-px"
            style={{ top: `${i * 100}svh`, height: "100svh" }}
          />
        ))}
        {SECTORS.map((sector, i) => (
          <SectorPanel key={sector.id} sector={sector} index={i} total={SECTORS.length} />
        ))}
      </div>
    </section>
  );
}
