import type { StaticImageData } from "next/image";
import type { SectorId } from "@/lib/content";
import oilGas from "@/assets/images/sector-oil-gas.jpg";
import agriculture from "@/assets/images/sector-agriculture.jpg";
import metals from "@/assets/images/sector-metals.jpg";
import perishables from "@/assets/images/sector-perishables.jpg";
import vessel from "@/assets/images/philosophy-vessel.jpg";

/**
 * Imagery used across the site. The current files are original rendered
 * artwork; replace them with commissioned photography at the same paths
 * (or point these imports elsewhere) and update the alt text.
 */
export const SECTOR_MEDIA: Record<SectorId, { src: StaticImageData; alt: string }> = {
  "oil-gas": { src: oilGas, alt: "Glossy dark crude oil surface rippling under warm light" },
  agriculture: { src: agriculture, alt: "Aerial view of furrowed agricultural fields at golden hour" },
  metals: { src: metals, alt: "Stacked aluminium ingots catching dramatic warehouse light" },
  perishables: { src: perishables, alt: "Green and black olives in low, warm light" },
};

export const PHILOSOPHY_MEDIA = {
  src: vessel,
  alt: "Aerial view of a bulk carrier crossing dark open water",
};
