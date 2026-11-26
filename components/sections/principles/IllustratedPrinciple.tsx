import Image, { type StaticImageData } from "next/image";
import type { Principle } from "@/lib/content";
import { Reveal } from "@/components/ui/Reveal";
import { Emphasis } from "@/components/ui/Emphasis";

/**
 * A principle set over one of Ventrion's illustrations, used as the band's background.
 *
 * From 1280px up the illustration fills about seven tenths of the width on one side and
 * the copy sits over it from the other side, on a fade of the page colour that lets the
 * picture emerge from behind the words. Below that the illustration sits above the copy,
 * and the title rises over its faded lower edge.
 */
export function IllustratedPrinciple({
  principle,
  image,
  side,
}: {
  principle: Principle;
  image: StaticImageData;
  /** Where the illustration sits; the copy takes the other side. */
  side: "left" | "right";
}) {
  const artRight = side === "right";

  return (
    <li className="relative isolate grid lg:items-center">
      {/* The illustration */}
      <Reveal
        y={24}
        className={`relative z-0 w-full [grid-area:1/1] sm:w-[86%] xl:w-[min(70vw,72rem)] ${
          artRight ? "sm:justify-self-end xl:mr-[2vw]" : "sm:justify-self-start xl:ml-[2vw]"
        }`}
      >
        <Image
          src={image}
          alt=""
          sizes="(min-width: 1280px) min(70vw, 1152px), (min-width: 640px) 86vw, 100vw"
          quality={85}
          className="h-auto w-full"
        />
        {/* stacked: the lower edge dissolves into the page, under the title */}
        <div aria-hidden="true" className="absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-ink to-transparent xl:hidden" />
      </Reveal>

      {/* 1280px up: the page colour reaches in from the copy's side, behind the words */}
      <div
        aria-hidden="true"
        className={`pointer-events-none relative z-[1] hidden self-stretch [grid-area:1/1] xl:block ${
          artRight
            ? "bg-[linear-gradient(90deg,var(--color-ink)_0%,var(--color-ink)_28%,color-mix(in_srgb,var(--color-ink)_88%,transparent)_38%,color-mix(in_srgb,var(--color-ink)_50%,transparent)_48%,transparent_60%)]"
            : "bg-[linear-gradient(270deg,var(--color-ink)_0%,var(--color-ink)_28%,color-mix(in_srgb,var(--color-ink)_88%,transparent)_38%,color-mix(in_srgb,var(--color-ink)_50%,transparent)_48%,transparent_60%)]"
        }`}
      />

      {/* The copy, over the illustration */}
      <div className="relative z-[2] -mt-16 [grid-area:2/1] sm:-mt-24 xl:mt-0 xl:[grid-area:1/1]">
        <div className="shell">
          <Reveal
            stagger={0.1}
            className={`pb-16 sm:max-w-[36rem] sm:pb-20 xl:w-[40%] xl:max-w-none xl:py-16 ${artRight ? "" : "sm:ml-auto"}`}
          >
            <h3 data-reveal className="display-md max-w-[14ch] text-balance text-ivory">
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
