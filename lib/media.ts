import type { StaticImageData } from "next/image";
import type { SectorId } from "@/lib/content";
import oilGas from "@/assets/images/sector-oil-gas.jpg";
import agriculture from "@/assets/images/sector-agriculture.jpg";
import metals from "@/assets/images/sector-metals.jpg";
import perishables from "@/assets/images/sector-perishables.jpg";
import vessel from "@/assets/images/philosophy-vessel.jpg";

/**
 * Placeholder photography from Pexels (free for commercial use, no attribution
 * required — https://www.pexels.com/license/), cropped and colour-graded for the
 * site. Sources:
 *   Oil & Gas      https://www.pexels.com/photo/4606157/
 *   Agriculture    https://www.pexels.com/photo/14502034/
 *   Metals         https://www.pexels.com/photo/6804260/  (mirrored)
 *   Perishables    https://www.pexels.com/photo/16841999/ (mirrored)
 *   Philosophy     https://www.pexels.com/photo/12530458/ (mirrored)
 * Replace with commissioned photography at the same paths when available.
 */
export const SECTOR_MEDIA: Record<SectorId, { src: StaticImageData; alt: string }> = {
  "oil-gas": { src: oilGas, alt: "Aerial view of an oil tanker at sea at dusk" },
  agriculture: { src: agriculture, alt: "Aerial view of a combine harvester working a golden grain field" },
  metals: { src: metals, alt: "Molten metal pouring from a ladle in a foundry" },
  perishables: { src: perishables, alt: "Olive branches in warm Mediterranean light" },
};

export const PHILOSOPHY_MEDIA = {
  src: vessel,
  alt: "Aerial view of a fully loaded container ship crossing dark open water",
};
