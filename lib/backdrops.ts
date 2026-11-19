/**
 * Placeholder section and service photography from Pexels (free licence, no
 * attribution required). Replace files in assets/images/{backdrops,services}.
 */
import hero from "@/assets/images/backdrops/hero.jpg";
import about from "@/assets/images/backdrops/about.jpg";
import network from "@/assets/images/backdrops/network.jpg";
import commodities from "@/assets/images/backdrops/commodities.jpg";
import expertise from "@/assets/images/backdrops/expertise.jpg";
import approach from "@/assets/images/backdrops/approach.jpg";
import why from "@/assets/images/backdrops/why.jpg";
import contact from "@/assets/images/backdrops/contact.jpg";

import research from "@/assets/images/services/research.jpg";
import connect from "@/assets/images/services/connect.jpg";
import negotiate from "@/assets/images/services/negotiate.jpg";
import logistics from "@/assets/images/services/logistics.jpg";
import finance from "@/assets/images/services/finance.jpg";
import compliance from "@/assets/images/services/compliance.jpg";
import intelligence from "@/assets/images/services/intelligence.jpg";
import value from "@/assets/images/services/value.jpg";
import type { ServiceGlyph } from "@/lib/content";
import type { StaticImageData } from "next/image";

export const BACKDROPS = { hero, about, network, commodities, expertise, approach, why, contact };

export const SERVICE_IMAGES: Record<ServiceGlyph, StaticImageData> = {
  research,
  connect,
  negotiate,
  logistics,
  finance,
  compliance,
  intelligence,
  value,
};
