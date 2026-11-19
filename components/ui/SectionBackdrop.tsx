import Image, { type StaticImageData } from "next/image";

/**
 * Full-bleed photographic background washed with the cream page colour, so the
 * image reads as texture while dark text stays crisp. The parent must be
 * `relative isolate`.
 */
export function SectionBackdrop({
  src,
  position = "50% 50%",
  wash = 0.8,
  priority = false,
}: {
  src: StaticImageData;
  position?: string;
  /** 0–1: strength of the cream wash over the photo. */
  wash?: number;
  priority?: boolean;
}) {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-30 overflow-hidden">
      <Image
        src={src}
        alt=""
        fill
        sizes="100vw"
        quality={60}
        placeholder="blur"
        {...(priority ? { loading: "eager" as const, fetchPriority: "high" as const } : {})}
        className="object-cover"
        style={{ objectPosition: position }}
      />
      <div className="absolute inset-0 bg-ink" style={{ opacity: wash }} />
      <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-ink to-transparent" />
      <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-ink to-transparent" />
    </div>
  );
}
