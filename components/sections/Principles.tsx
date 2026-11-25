"use client";

import { useEffect, useRef, useState } from "react";
import { gsap, MOTION_QUERIES, useGSAP } from "@/lib/gsap";
import { PRINCIPLES } from "@/lib/content";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Reveal } from "@/components/ui/Reveal";
import { Emphasis } from "@/components/ui/Emphasis";
import { PrincipleFrame, PrincipleInlineImage } from "./principles/PrincipleImages";
import { TrustEagles } from "./principles/TrustEagles";

/** "Trust does." oversized; "Trust" in burgundy italic, filled by a sweep of light as it scrolls into view. */
function TrustStatement() {
  const ref = useRef<HTMLHeadingElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MOTION_QUERIES.motion, () => {
        gsap.fromTo(
          "[data-trust-sweep]",
          { backgroundPosition: "100% 0%" },
          {
            backgroundPosition: "0% 0%",
            ease: "none",
            scrollTrigger: { trigger: ref.current, start: "top 92%", end: "center 62%", scrub: 0.6 },
          },
        );
      });
    },
    { scope: ref },
  );

  return (
    <h2
      ref={ref}
      id="principles-title"
      className="mt-5 font-serif text-[clamp(4.2rem,13vw,13rem)] leading-[0.95] tracking-[-0.02em] text-ivory"
    >
      <span
        data-trust-sweep
        className="mr-[-0.04em] inline-block pb-[0.14em] pl-[0.04em] pr-[0.06em] italic"
        style={{
          backgroundImage: "linear-gradient(90deg, #b52336 0%, #b52336 48%, transparent 52%, transparent 100%)",
          backgroundSize: "210% 100%",
          backgroundPosition: "0% 0%",
          WebkitBackgroundClip: "text",
          backgroundClip: "text",
          color: "transparent",
          WebkitTextStroke: "1px rgba(181,35,54,0.5)",
        }}
      >
        Trust
      </span>{" "}
      does.
    </h2>
  );
}

export function Principles() {
  const [active, setActive] = useState(0);
  const items = useRef<(HTMLLIElement | null)[]>([]);

  // The principle crossing the middle of the viewport drives the pinned illustration.
  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActive(Number((entry.target as HTMLElement).dataset.index));
        });
      },
      { rootMargin: "-48% 0px -48% 0px" },
    );
    items.current.forEach((el) => el && io.observe(el));
    return () => io.disconnect();
  }, []);

  return (
    <section id="principles" aria-labelledby="principles-title" className="relative isolate overflow-clip bg-ink py-[clamp(6rem,12vw,11rem)]">

      <div className="shell relative">
        <div className="flex flex-col items-center text-center">
          <Eyebrow index="03" className="justify-center">
            Our Principles
          </Eyebrow>
          <Reveal className="mt-10">
            <p className="display-md max-w-[24ch] text-balance text-mist">
              But <em className="text-ivory">network size alone</em> is not what matters to us.
            </p>
          </Reveal>
          <TrustStatement />
          <TrustEagles />
          {/* What the eagles mean */}
          <Reveal className="relative -mt-[clamp(1.5rem,7vw,6.5rem)] flex max-w-[36rem] flex-col items-center">
            <span aria-hidden="true" className="h-10 w-px bg-gradient-to-b from-transparent to-mark/40" />
            <p className="mt-6 text-balance font-serif text-[clamp(1.3rem,2vw,1.7rem)] italic leading-snug text-ivory">
              High above the ground, two eagles lock talons and fall together, turning as one. Each trusts the other
              to let go in time.
            </p>
          </Reveal>
        </div>

        <div className="mt-[clamp(4rem,9vw,8rem)] lg:grid lg:grid-cols-12 lg:gap-8">
          {/* Pinned photograph (desktop) */}
          <div className="hidden lg:col-span-5 lg:block">
            <div className="sticky top-[12vh] flex h-[76vh] flex-col items-center justify-center">
              <div className="w-full max-w-[min(440px,calc((76vh-7rem)*0.8))]">
                <PrincipleFrame active={active} />
              </div>
              <div className="mx-auto mt-10 flex w-full max-w-[min(440px,calc((76vh-7rem)*0.8))] items-center gap-3" aria-hidden="true">
                {PRINCIPLES.map((principle, i) => (
                  <span
                    key={principle.id}
                    className={`h-px flex-1 transition-colors duration-700 ${i <= active ? "bg-mark" : "bg-line-strong"}`}
                  />
                ))}
              </div>
              <p className="eyebrow mx-auto mt-4 w-full max-w-[min(440px,calc((76vh-7rem)*0.8))] text-mist" aria-hidden="true">
                <span className="text-ivory">{PRINCIPLES[active].numeral}</span>
                <span className="px-2">/</span>IV
              </p>
            </div>
          </div>

          <ol className="lg:col-span-6 lg:col-start-7">
            {PRINCIPLES.map((principle, i) => (
              <li
                key={principle.id}
                ref={(el) => {
                  items.current[i] = el;
                }}
                data-index={i}
                className="flex flex-col justify-center border-t border-line py-16 first:border-t-0 first:pt-0 lg:min-h-[76vh] lg:py-24 lg:first:pt-24"
              >
                <PrincipleInlineImage id={principle.id} />
                <Reveal stagger={0.1}>
                  <p data-reveal className="eyebrow text-ivory">
                    {principle.numeral}
                  </p>
                  <h3 data-reveal className="display-md mt-5 max-w-[16ch] text-ivory">
                    <Emphasis text={principle.title} />
                  </h3>
                  <p data-reveal className="mt-7 max-w-[30ch] font-serif text-[1.45rem] leading-snug text-ivory/90 sm:text-[1.6rem]">
                    <Emphasis text={principle.lead} className="text-ivory" />
                  </p>
                  {principle.body.map((paragraph) => (
                    <p key={paragraph.slice(0, 24)} data-reveal className="mt-5 max-w-[34rem] text-[16px] leading-[1.8] text-mist">
                      {paragraph}
                    </p>
                  ))}
                  {principle.closing ? (
                    <p data-reveal className="mt-6 max-w-[28ch] font-serif text-[1.35rem] italic leading-snug text-ivory sm:text-[1.5rem]">
                      {principle.closing}
                    </p>
                  ) : null}
                </Reveal>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
