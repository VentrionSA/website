/**
 * Website copy and structured content.
 * Edit text here — components read from these exports.
 */

export type NavLink = { href: string; label: string };

export const NAV_LINKS: NavLink[] = [
  { href: "/#about", label: "Ventrion" },
  { href: "/#network", label: "Network" },
  { href: "/#contact", label: "Contact" },
];

/* ── Markets (network reach — not office locations) ─────────────────────── */

export type Region = "Middle East" | "Central Asia & Caspian" | "Asia";

export type Market = {
  id: string;
  name: string;
  region: Region;
  /** Representative coordinates used to place the marker on the globe. */
  lat: number;
  lon: number;
};

// Order matters: it matches the country index baked into lib/geo/land-points.json
export const MARKETS: Market[] = [
  { id: "saudi-arabia", name: "Saudi Arabia", region: "Middle East", lat: 24.2, lon: 45.1 },
  { id: "united-arab-emirates", name: "United Arab Emirates", region: "Middle East", lat: 24.4, lon: 54.4 },
  { id: "qatar", name: "Qatar", region: "Middle East", lat: 25.3, lon: 51.2 },
  { id: "bahrain", name: "Bahrain", region: "Middle East", lat: 26.07, lon: 50.55 },
  { id: "kazakhstan", name: "Kazakhstan", region: "Central Asia & Caspian", lat: 48.0, lon: 67.5 },
  { id: "azerbaijan", name: "Azerbaijan", region: "Central Asia & Caspian", lat: 40.3, lon: 47.7 },
  { id: "china", name: "China", region: "Asia", lat: 34.5, lon: 104.0 },
  { id: "india", name: "India", region: "Asia", lat: 21.5, lon: 78.5 },
  { id: "indonesia", name: "Indonesia", region: "Asia", lat: -2.2, lon: 113.5 },
];

export const REGIONS: Region[] = ["Middle East", "Central Asia & Caspian", "Asia"];

/** Network connections drawn as arcs between markets (indices into MARKETS). */
export const CONNECTIONS: [number, number][] = [
  [1, 7],
  [1, 6],
  [1, 8],
  [0, 4],
  [0, 7],
  [2, 6],
  [2, 8],
  [3, 5],
  [5, 4],
  [4, 6],
  [7, 8],
  [0, 5],
  [3, 7],
  [6, 8],
];

/* ── Enquiry form options ───────────────────────────────────────────────── */

export const ENQUIRY_ROLES = ["Buyer", "Seller", "Other"] as const;

export type EnquiryRole = (typeof ENQUIRY_ROLES)[number];
