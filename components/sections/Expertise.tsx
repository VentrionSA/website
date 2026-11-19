"use client";

import { useRef } from "react";
import { gsap, MOTION_QUERIES, useGSAP } from "@/lib/gsap";
import { SERVICES } from "@/lib/content";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { SplitHeading } from "@/components/ui/SplitHeading";
import { Reveal } from "@/components/ui/Reveal";
import Image from "next/image";
import { SERVICE_IMAGES } from "@/lib/backdrops";
import { ServiceGlyph } from "./expertise/ServiceGlyph";
import { SectionBackdrop } from "@/components/ui/SectionBackdrop";
import { BACKDROPS } from "@/lib/backdrops";

export function Expertise() {
  const list = useRef<HTMLOListElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MOTION_QUERIES.motion, () => {
        gsap.utils.toArray<HTMLElement>("[data-service]").forEach((row) => {
          const draw = row.querySelectorAll<SVGElement>("[data-draw]");
          const text = row.querySelectorAll("[data-service-text]");
          const rule = row.querySelector("[data-service-rule]");
          const tl = gsap.timeline({ scrollTrigger: { trigger: row, start: "top 80%", toggleActions: "play none none none" } });
          tl.fromTo(rule, { scaleX: 0 }, { scaleX: 1, duration: 1.6, ease: "expo.inOut" }, 0)
            .from(text, { y: 40, autoAlpha: 0, duration: 1.3, stagger: 0.08, ease: "expo.out" }, 0.15)
            .fromTo(
              draw,
              { strokeDasharray: 1, strokeDashoffset: 1 },
              { strokeDashoffset: 0, duration: 2.2, stagger: 0.12, ease: "power2.inOut" },
              0.2,
            );
        });
      });
    },
    { scope: list },
  );

  return (
    <section id="expertise" aria-labelledby="expertise-title" className="relative isolate overflow-hidden bg-ink py-[clamp(6rem,12vw,11rem)]">
      <SectionBackdrop src={BACKDROPS.expertise} wash={0.6} side="both" />
      <div className="shell">
        <div className="grid gap-10 lg:grid-cols-12 lg:items-end">
          <div className="lg:col-span-8">
            <Eyebrow index="04">What We Do</Eyebrow>
            <SplitHeading id="expertise-title" className="display-lg mt-8 max-w-[18ch] text-ivory">
              More than an introduction. <em className="text-gold">A considered approach</em> to every opportunity.
            </SplitHeading>
          </div>
          <Reveal className="lg:col-span-4">
            <p className="text-[16px] leading-relaxed text-mist">
              We help connect your business with the right markets, counterparties and opportunities — from first
              research through to final coordination.
            </p>
          </Reveal>
        </div>

        <ol ref={list} className="mt-16 lg:mt-24">
          {SERVICES.map((service, i) => {
            const flip = i % 2 === 1;
            return (
              <li key={service.index} data-service className="group relative">
                <span data-service-rule aria-hidden="true" className="absolute inset-x-0 top-0 block h-px origin-left bg-line-strong" />
                <div className="grid gap-8 py-12 lg:grid-cols-12 lg:items-center lg:gap-8 lg:py-14">
                  <div className={`lg:col-span-3 lg:row-start-1 ${flip ? "lg:col-start-10" : "lg:col-start-1"}`}>
                    <figure className="theme-dark relative aspect-[4/3] overflow-hidden bg-coal shadow-[0_30px_60px_-30px_rgba(60,45,20,0.45)]">
                      <Image
                        src={SERVICE_IMAGES[service.glyph]}
                        alt=""
                        fill
                        sizes="(min-width: 1024px) 25vw, 100vw"
                        placeholder="blur"
                        className="object-cover transition-transform duration-[1600ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-105"
                      />
                      <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-ink/85 via-ink/45 to-ink/15" />
                      <ServiceGlyph kind={service.glyph} className="absolute inset-0 h-full w-full p-[7%] opacity-70 transition-opacity duration-700 group-hover:opacity-100" />
                      <figcaption className="eyebrow absolute bottom-3 left-4 text-[9px] text-mist/70">Fig. {service.index}</figcaption>
                    </figure>
                  </div>
                  <div className={`lg:col-span-4 lg:row-start-1 ${flip ? "lg:col-start-1" : "lg:col-start-5"}`}>
                    <p data-service-text className="eyebrow tabular-nums text-gold">
                      {service.index}
                    </p>
                    <h3
                      data-service-text
                      className="display-md mt-5 text-ivory transition-[color,transform] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:translate-x-2 group-hover:text-gold-soft"
                    >
                      {service.title}
                    </h3>
                  </div>
                  <p
                    data-service-text
                    className={`max-w-md text-[15.5px] leading-relaxed text-mist lg:col-span-3 lg:row-start-1 ${flip ? "lg:col-start-6" : "lg:col-start-10"}`}
                  >
                    {service.body}
                  </p>
                </div>
              </li>
            );
          })}
        </ol>
        <span aria-hidden="true" className="block h-px bg-line-strong" />
      </div>
    </section>
  );
}
