/**
 * Section photography. The hero image (hero-wake.jpg) is the wake from Ventrion's own
 * hero design, cleaned of its type and set to the page ivory.
 * The others are placeholder photography from Pexels (free licence, no
 * attribution required). Replace files in assets/images/backdrops at the same paths.
 */
import hero from "@/assets/images/backdrops/hero-wake.jpg";
import approach from "@/assets/images/backdrops/approach.jpg";
import network from "@/assets/images/backdrops/network.jpg";
import cranes from "@/assets/images/backdrops/cranes.jpg";
import vessel from "@/assets/images/backdrops/vessel.jpg";
import expertise from "@/assets/images/backdrops/expertise.jpg";

export const BACKDROPS = {
  /** A ship's wake on misted green water, running to the top right */
  hero,
  /** Vessel above the clouds */
  about: approach,
  /** Vessels at anchor, seen from above */
  network,
  /** Port cranes against a sunset sky */
  principles: cranes,
  /** A single vessel on open water */
  closing: vessel,
  /** Port cranes at night, gold reflections */
  contact: expertise,
};
