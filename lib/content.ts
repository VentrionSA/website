/**
 * Website copy and structured content.
 * Edit text here — components read from these exports.
 */

export type NavLink = { href: string; label: string };

export const NAV_LINKS: NavLink[] = [
  { href: "/#about", label: "About" },
  { href: "/#network", label: "Network" },
  { href: "/#contact", label: "Contact" },
];

/** The regions named in the band beneath the hero. */
export const HERO_REGIONS = ["Middle East", "Central Asia", "Asia"] as const;

/* ── Markets (network reach — not office locations) ─────────────────────── */

export type Region = "Middle East" | "Central Asia & Caspian" | "Asia";

export type Market = {
  id: string;
  name: string;
  region: Region;
  /** Representative coordinates used to place the marker on the map. */
  lat: number;
  lon: number;
};

// Ids match NETWORK in scripts/build-globe-map.mjs, which writes the globe's country
// outlines (lib/geo/countries.json); run `npm run build:map` after changing the markets.
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

/* ── Vision and mission ────────────────────────────────────────────────── */

export type Statement = {
  /** Set large in the serif. *Starred* words are emphasised. */
  statement: string;
  /** The line beneath it. */
  support: string;
};

export const VISION: Statement = {
  statement: "To be the *first call* for trusted trade across the Middle East, Central Asia and Asia.",
  support: "Known for the opportunities we create, the time we save and the trust we keep.",
};

export const MISSION: Statement = {
  statement: "To create opportunities for our clients by facilitating trade with counterparts *we know and trust.*",
  support: "Every counterpart vetted. Every conversation candid. Every commitment kept.",
};

/* ── Principles of the network ─────────────────────────────────────────── */

export type PrincipleId = "principals" | "quality" | "distance";

export type Principle = {
  id: PrincipleId;
  title: string;
  /** Opening sentence, set in the serif. *Starred* words are emphasised. */
  lead: string;
  body: string[];
  /** Closing line, set in green italic. */
  closing?: string;
};

export const PRINCIPLES: Principle[] = [
  {
    id: "principals",
    title: "Principals We *Know*",
    lead: "We prefer *direct relationships* over chains of intermediaries.",
    body: [
      "Wherever possible, Ventrion deals with the principals themselves: the decision-makers our clients need to reach, whether they are looking for a buyer or a seller. Many of these relationships have developed through years of cooperation.",
      "This creates something that cannot be achieved by working through a chain of intermediaries:",
    ],
    closing: "accountability between people who expect to work together again.",
  },
  {
    id: "quality",
    title: "*Quality* Over Quantity",
    lead: "We do not measure our network by the *number of names* in it.",
    body: [
      "A large network has little value if its people are unknown or unreliable. Every counterparty we work with has passed our due diligence and vetting, and shares our standards of communication, transparency and conduct.",
    ],
    closing: "Everything we facilitate carries our name.",
  },
  {
    // global reach, personal accountability: said in other words
    id: "distance",
    title: "Distance Changes *Nothing*",
    lead: "However far an engagement reaches, *it stays personal.*",
    body: [
      "Our network spans markets thousands of kilometres apart. Our clients are never passed along a chain: they deal with the people at Ventrion who know their engagement, and who answer to them personally.",
    ],
    closing: "One call reaches the whole network.",
  },
];
