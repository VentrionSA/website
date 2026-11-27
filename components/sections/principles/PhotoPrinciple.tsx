import Image, { type StaticImageData } from "next/image";
import type { Principle } from "@/lib/content";
import { Reveal } from "@/components/ui/Reveal";
import { Emphasis } from "@/components/ui/Emphasis";
import { Drift } from "@/components/ui/Drift";

/** The principles' titles: large, solid, set in the display serif. */
export const PRINCIPLE_TITLE =
  "max-w-[14ch] text-balance font-serif text-[clamp(2.75rem,5.2vw,5.75rem)] font-medium leading-[1.02] tracking-[-0.01em] text-ivory";

/**
 * A principle set over a photograph, used as the band's background.
 *
 * From 1280px up the photograph runs the full width of the band, and the page colour
 * reaches in from the copy's side so the words sit on ivory while the picture opens out
 * on the other side. Below that the photograph sits above the copy, edge to edge, and the
 * title rises over its faded lower edge. The picture drifts gently as the page scrolls;
 * the title stays fully solid.
 */
export function PhotoPrinciple({
  principle,
  image,
  side,
  position,
  alt,
}: {
  principle: Principle;
  image: StaticImageData;
  /** Where the photograph opens out; the copy takes the other side. */
  side: "left" | "right";
  /** object-position of the photograph, keeping its subject on its own side. */
  position: string;
  alt: string;
}) {
  const photoRight = side === "right";

  return (
    <li className="relative isolate xl:flex xl:min-h-[min(88svh,52vw)] xl:items-center">
      {/* The photograph: a block above the copy, then from 1280px the band's background */}
      <div className="relative aspect-[4/3] overflow-hidden sm:aspect-[16/9] xl:absolute xl:inset-0 xl:-z-10 xl:aspect-auto">
        <Drift className="absolute inset-x-0 -inset-y-[7%]" distance={6} scale={1.06}>
          <Image src={image} alt={alt} fill sizes="100vw" quality={82} placeholder="blur" className="object-cover" style={{ objectPosition: position }} />
        </Drift>
        {/* stacked: the lower edge dissolves into the page, under the title */}
        <div aria-hidden="true" className="absolute inset-x-0 bottom-0 h-[42%] bg-gradient-to-t from-ink via-ink/55 to-transparent xl:hidden" />
        {/* 1280px up: the page colour reaches in from the copy's side, and softens the band's edges */}
        <div
          aria-hidden="true"
          className={`absolute inset-0 hidden xl:block ${
            photoRight
              ? "bg-[linear-gradient(90deg,var(--color-ink)_0%,var(--color-ink)_26%,color-mix(in_srgb,var(--color-ink)_86%,transparent)_36%,color-mix(in_srgb,var(--color-ink)_45%,transparent)_48%,transparent_64%)]"
              : "bg-[linear-gradient(270deg,var(--color-ink)_0%,var(--color-ink)_26%,color-mix(in_srgb,var(--color-ink)_86%,transparent)_36%,color-mix(in_srgb,var(--color-ink)_45%,transparent)_48%,transparent_64%)]"
          }`}
        />
        <div aria-hidden="true" className="absolute inset-x-0 top-0 hidden h-[16%] bg-gradient-to-b from-ink to-transparent xl:block" />
        <div aria-hidden="true" className="absolute inset-x-0 bottom-0 hidden h-[16%] bg-gradient-to-t from-ink to-transparent xl:block" />
      </div>

      {/* The copy */}
      <div className="relative -mt-12 w-full sm:-mt-20 xl:mt-0">
        <div className="shell">
          <Reveal
            stagger={0.1}
            className={`pb-16 sm:max-w-[36rem] sm:pb-20 xl:w-[40%] xl:max-w-none xl:py-24 ${photoRight ? "" : "sm:ml-auto"}`}
          >
            <h3 data-reveal className={PRINCIPLE_TITLE}>
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
        </div>
      </div>
    </li>
  );
}
