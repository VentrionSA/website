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
  /** Representative coordinates used to place the marker on the globe. */
  lat: number;
  lon: number;
};

// Ids match the network tags in lib/geo/countries.json (used by the globe and map).
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

/* ── Principles of the network ─────────────────────────────────────────── */

export type PrincipleId = "principals" | "local" | "quality" | "accountability";

export type Principle = {
  id: PrincipleId;
  numeral: string;
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
    numeral: "I",
    title: "Principals We *Know*",
    lead: "We prefer *direct relationships* over chains of intermediaries.",
    body: [
      "Ventrion is connected to the principals themselves: the decision-makers our clients need to reach, whether they are looking for a buyer or a seller. Many of these relationships have developed through years of cooperation.",
      "This creates something that cannot be achieved by working through a chain of intermediaries:",
    ],
    closing: "accountability between people who expect to work together again.",
  },
  {
    id: "local",
    numeral: "II",
    title: "Local Knowledge, *Trusted Guidance*",
    lead: "Every market has its own *realities.*",
    body: [
      "Regulations, procedures and commercial conventions differ from one country to the next. Ventrion does not manage them on a client’s behalf.",
      "Instead, we guide our clients to the people who have the knowledge and the expertise: people we know, and trust.",
    ],
    closing: "We know who to call.",
  },
  {
    id: "quality",
    numeral: "III",
    title: "*Quality* Over Quantity",
    lead: "We do not measure our network by the *number of names* in it.",
    body: [
      "A large network has little value if its people are unknown or unreliable. We work with counterparties who share our standards of communication, transparency and conduct.",
    ],
    closing: "Every introduction carries our name.",
  },
  {
    id: "accountability",
    numeral: "IV",
    title: "Global Reach With *Personal Accountability*",
    lead: "The purpose of an international network is to make *distance less relevant.*",
    body: ["A transaction may take place thousands of kilometres away, but the relationship with our client remains local and direct."],
  },
];
