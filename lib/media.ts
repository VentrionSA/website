import type { StaticImageData } from "next/image";
import type { SectorId } from "@/lib/content";
import oilGas from "@/assets/images/sector-oil-gas.jpg";
import agriculture from "@/assets/images/sector-agriculture.jpg";
import metals from "@/assets/images/sector-metals.jpg";
import perishables from "@/assets/images/sector-perishables.jpg";
import vessel from "@/assets/images/philosophy-vessel.jpg";

/**
 * Imagery used across the site. These files are original rendered artwork
 * created for Ventrion; swap them for commissioned photography at the same
 * paths (or point these imports elsewhere) and update the alt text.
 */
export const SECTOR_MEDIA: Record<SectorId, { src: StaticImageData; alt: string }> = {
  "oil-gas": { src: oilGas, alt: "Ripples spreading across a dark, glossy oil surface lit in warm gold" },
  agriculture: { src: agriculture, alt: "Macro view of a heap of golden grain in low side light" },
  metals: { src: metals, alt: "Bundles of aluminium ingots stacked in a dimly lit warehouse" },
  perishables: { src: perishables, alt: "Green and black olives with olive leaves on dark slate" },
};

export const PHILOSOPHY_MEDIA = {
  src: vessel,
  alt: "Aerial view of a bulk carrier and its wake crossing dark open water",
};
