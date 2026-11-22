"use client";

import { useEffect, useRef, useState } from "react";
import { gsap, MOTION_QUERIES, useGSAP } from "@/lib/gsap";
import { PRINCIPLES, type PrincipleId } from "@/lib/content";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Reveal } from "@/components/ui/Reveal";
import { Emphasis } from "@/components/ui/Emphasis";
import { SectionBackdrop } from "@/components/ui/SectionBackdrop";
import { BACKDROPS } from "@/lib/backdrops";
import { PrincipleIllustration } from "./principles/Illustrations";

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

/** Inline illustration for small screens: draws itself once it scrolls into view. */
function InlineIllustration({ id }: { id: PrincipleId }) {
  const ref = useRef<HTMLDivElement>(null);
  const [seen, setSeen] = useState(false);

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
      { rootMargin: "0px 0px -20% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={ref} className="mb-10 aspect-square w-full max-w-[280px] lg:hidden">
      <PrincipleIllustration id={id} active={seen} />
    </div>
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
      <SectionBackdrop src={BACKDROPS.principles} wash={0.9} side="both" saturate={0.3} position="50% 70%" />

      <div className="shell relative">
        <div className="flex flex-col items-center text-center">
          <Eyebrow index="03" className="justify-center">
            Our Principles
          </Eyebrow>
          <Reveal className="mt-10">
            <p className="display-md max-w-[24ch] text-balance text-mist">
              But <em className="text-burgundy">network size alone</em> is not what matters to us.
            </p>
          </Reveal>
          <TrustStatement />
        </div>

        <div className="mt-[clamp(4rem,9vw,8rem)] lg:grid lg:grid-cols-12 lg:gap-8">
          {/* Pinned illustration (desktop) */}
          <div className="hidden lg:col-span-5 lg:block">
            <div className="sticky top-[12vh] flex h-[76vh] flex-col justify-center">
              <div className="relative mx-auto aspect-square w-full max-w-[440px]">
                {PRINCIPLES.map((principle, i) => (
                  <div
                    key={principle.id}
                    className={`absolute inset-0 transition-opacity duration-700 ${active === i ? "opacity-100" : "opacity-0"}`}
                  >
                    <PrincipleIllustration id={principle.id} active={active === i} />
                  </div>
                ))}
              </div>
              <div className="mx-auto mt-12 flex w-full max-w-[440px] items-center gap-3" aria-hidden="true">
                {PRINCIPLES.map((principle, i) => (
                  <span
                    key={principle.id}
                    className={`h-px flex-1 transition-colors duration-700 ${i <= active ? "bg-gold" : "bg-line-strong"}`}
                  />
                ))}
              </div>
              <p className="eyebrow mx-auto mt-4 w-full max-w-[440px] text-mist" aria-hidden="true">
                <span className="text-gold">{PRINCIPLES[active].numeral}</span>
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
                <InlineIllustration id={principle.id} />
                <Reveal stagger={0.1}>
                  <p data-reveal className="eyebrow text-gold">
                    {principle.numeral}
                  </p>
                  <h3 data-reveal className="display-md mt-5 max-w-[16ch] text-ivory">
                    <Emphasis text={principle.title} />
                  </h3>
                  <p data-reveal className="mt-7 max-w-[30ch] font-serif text-[1.45rem] leading-snug text-ivory/90 sm:text-[1.6rem]">
                    <Emphasis text={principle.lead} />
                  </p>
                  {principle.body.map((paragraph) => (
                    <p key={paragraph.slice(0, 24)} data-reveal className="mt-5 max-w-[34rem] text-[16px] leading-[1.8] text-mist">
                      {paragraph}
                    </p>
                  ))}
                  {principle.closing ? (
                    <p data-reveal className="mt-6 max-w-[28ch] font-serif text-[1.35rem] italic leading-snug text-gold sm:text-[1.5rem]">
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
