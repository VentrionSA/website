/**
 * Section photography. The hero image (hero-wake.jpg) is the wake from Ventrion's own
 * hero design, cleaned of its type and set to the page ivory.
 * The others are placeholder photography from Pexels (free licence, no
 * attribution required). Replace files in assets/images/backdrops at the same paths.
 */
import hero from "@/assets/images/backdrops/hero-wake.jpg";
import clouds from "@/assets/images/backdrops/clouds.jpg";
import expertise from "@/assets/images/backdrops/expertise.jpg";

export const BACKDROPS = {
  /** A ship's wake on misted green water, running to the top right */
  hero,
  /** Above a sea of clouds at first light: the world, seen from altitude */
  closing: clouds,
  /** Port cranes at night, gold reflections */
  contact: expertise,
};
