"use client";

import Image from "next/image";
import { useRef } from "react";
import { ArrowRight } from "lucide-react";
import { gsap, MOTION_QUERIES, useGSAP } from "@/lib/gsap";
import { Reveal } from "@/components/ui/Reveal";
import eagles from "@/assets/images/art/trust-eagles.jpg";

/**
 * "The way we work": the eagles, with Ventrion's own words for them, set to
 * Ventrion's design. On large screens the artwork fills the right of the
 * section and its sky runs behind the text; on phones it sits between the
 * headline and the text. A deep green band closes it with the Ventrion principle.
 */
export function WayWeWork() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MOTION_QUERIES.motion, () => {
        // A slow drift as the section passes: the pair seems to glide.
        gsap.fromTo(
          "[data-eagles-art]",
          { yPercent: -3, scale: 1.03 },
          {
            yPercent: 3,
            scale: 1,
            ease: "none",
            scrollTrigger: { trigger: root.current, start: "top bottom", end: "bottom top", scrub: 0.8 },
          },
        );
      });
    },
    { scope: root },
  );

  return (
    <section ref={root} aria-labelledby="way-title" className="relative isolate mt-[clamp(4rem,8vw,7rem)] overflow-hidden">
      <div className="xl:flex xl:min-h-[min(42vw,calc(100svh-11rem))] xl:items-center">
        <div className="shell w-full py-[clamp(3.5rem,7vw,6rem)] xl:py-[clamp(2.5rem,3.5vw,3.5rem)]">
          <div className="xl:max-w-[28rem]">
            <Reveal>
              <p className="flex items-center gap-4 font-text text-[12px] font-medium uppercase tracking-[0.2em] text-ivory sm:text-[13px]">
                <span aria-hidden="true" className="h-px w-10 bg-burgundy sm:w-12" />
                The way we work
              </p>
              <h3
                id="way-title"
                className="mt-6 font-accent text-[clamp(3.2rem,6vw,6.2rem)] font-normal leading-[0.95] tracking-[-0.02em] text-ivory"
                style={{ fontVariationSettings: '"opsz" 90' }}
              >
                Trust takes two.
              </h3>
            </Reveal>

            {/* The artwork: full width between the headline and the text below 1280px; from 1280px up,
                the section's backdrop. Placed from 31% to 108% of the section, the pair sits to the
                right of the text with both wings in view, as in Ventrion's design. */}
            <div
              aria-hidden="true"
              className="relative -mx-[clamp(1.25rem,4.6vw,5rem)] mt-8 aspect-[23/20] overflow-hidden sm:aspect-[16/11] md:aspect-[2/1] xl:absolute xl:inset-y-0 xl:left-[31%] xl:right-[-8%] xl:-z-10 xl:mx-0 xl:mt-0 xl:aspect-auto"
            >
              <div data-eagles-art className="absolute inset-0 will-change-transform">
                <Image
                  src={eagles}
                  alt=""
                  fill
                  quality={85}
                  placeholder="blur"
                  sizes="(min-width: 1280px) 80vw, 100vw"
                  className="object-cover object-[50%_46%]"
                />
              </div>
              {/* the sky melts into the page: top and bottom when stacked, the left edge from 1280px up */}
              <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,var(--color-ink)_0%,transparent_10%,transparent_90%,var(--color-ink)_100%)] xl:bg-[linear-gradient(90deg,var(--color-ink)_0%,color-mix(in_srgb,var(--color-ink)_60%,transparent)_5%,transparent_12%)]" />
            </div>

            <Reveal stagger={0.1} className="mt-8 max-w-[31rem]">
              <p data-reveal className="font-text text-[17px] leading-[1.5] text-ivory xl:leading-[1.45]">
                In a remarkable display between potential partners, bald eagles clasp talons and spiral earthward, releasing
                their hold before reaching the ground.
              </p>
              <p data-reveal className="mt-5 font-text text-[17px] leading-[1.5] text-ivory xl:mt-4 xl:leading-[1.45]">
                To us, the timing of that release expresses trust in one another—a powerful image of connection and shared
                responsibility.
              </p>
              <p data-reveal className="mt-5 font-text text-[17px] leading-[1.5] text-ivory xl:mt-4 xl:leading-[1.45]">
                At Ventrion, we value transparency and trust above all else. They guide every conversation, every
                commitment, and every relationship we build.
              </p>
              <p data-reveal className="mt-7 xl:mt-6">
                <a
                  href="#commitments"
                  className="group inline-flex items-center gap-3 font-text text-[17px] text-burgundy transition-colors duration-500 hover:text-burgundy-deep"
                >
                  Our commitment to you
                  <ArrowRight
                    className="h-[1.05em] w-[1.05em] transition-transform duration-500 group-hover:translate-x-1"
                    strokeWidth={1.5}
                    aria-hidden="true"
                  />
                </a>
              </p>
            </Reveal>
          </div>
        </div>
      </div>

      {/* The Ventrion principle */}
      <div className="bg-ivory text-paper">
        <div className="shell flex flex-col gap-5 py-[clamp(2.25rem,4vw,3.25rem)] lg:flex-row lg:items-center lg:gap-12">
          <p className="shrink-0 font-text text-[12px] font-medium uppercase tracking-[0.2em] text-paper/90 sm:text-[13px]">
            The Ventrion principle
          </p>
          <span aria-hidden="true" className="h-px w-12 shrink-0 bg-burgundy lg:h-14 lg:w-px" />
          <div>
            <p className="font-text text-[clamp(1.45rem,2.5vw,2.35rem)] leading-[1.2] text-paper">
              Confidence is earned, conversation by conversation.
            </p>
            <p className="mt-2 font-text text-[15px] tracking-[0.02em] text-paper/80 sm:text-[17px]">
              Clear expectations. Honest communication. Commitments honoured.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
