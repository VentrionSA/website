/**
 * Website copy and structured content.
 * Edit text here — components read from these exports.
 */

export type NavLink = { href: string; label: string };

export const NAV_LINKS: NavLink[] = [
  { href: "/#about", label: "Ventrion" },
  { href: "/#network", label: "Network" },
  { href: "/#principles", label: "Principles" },
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

/* ── Principles of the network ─────────────────────────────────────────── */

export type PrincipleId = "partners" | "local" | "quality" | "accountability";

export type Principle = {
  id: PrincipleId;
  numeral: string;
  title: string;
  /** Opening sentence, set in the serif. *Starred* words are emphasised. */
  lead: string;
  body: string[];
  /** Closing line, set in gold italic. */
  closing?: string;
};

export const PRINCIPLES: Principle[] = [
  {
    id: "partners",
    numeral: "I",
    title: "Partners We *Know*",
    lead: "We prefer *established relationships* over anonymous service procurement.",
    body: [
      "Wherever possible, we work with agents and partners whose operational standards, financial reliability and way of working are already familiar to us. Many of these relationships have developed through years of cooperation.",
      "This creates something that cannot be achieved simply by searching for a service provider when a shipment appears:",
    ],
    closing: "accountability between people who expect to work together again.",
  },
  {
    id: "local",
    numeral: "II",
    title: "Local Knowledge, *Ventrion Responsibility*",
    lead: "Every market has its own *operational realities.*",
    body: [
      "Port procedures, customs practices, documentation requirements, local transportation conditions and commercial conventions can differ significantly between countries. Our overseas partners provide the local knowledge required to navigate these differences.",
      "But from the client’s perspective, Ventrion remains responsible for coordinating the operation. The client should not need to manage separate relationships around the world.",
    ],
    closing: "We do that for them.",
  },
  {
    id: "quality",
    numeral: "III",
    title: "*Quality* Over Quantity",
    lead: "We do not measure the *strength* of our network by the number of agents we can list.",
    body: [
      "A large network has little value if the people within it are unknown or unreliable. Our preference is to work with counterparties who understand how we operate and who share our expectations regarding communication, transparency and professional conduct.",
      "When an operation requires a new partner, we approach that selection carefully.",
    ],
    closing: "Because every company acting on behalf of Ventrion also becomes part of the experience we deliver to our client.",
  },
  {
    id: "accountability",
    numeral: "IV",
    title: "Global Reach With *Personal Accountability*",
    lead: "The purpose of an international network is to make *distance less relevant.*",
    body: ["A shipment may be handled thousands of kilometres away, but the relationship with our client remains local and direct."],
  },
];
