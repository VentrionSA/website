/**
 * Website copy and structured content.
 * Edit text here — components read from these exports.
 */

export type NavLink = { href: string; label: string };

export const NAV_LINKS: NavLink[] = [
  { href: "/#about", label: "About" },
  { href: "/#network", label: "Network" },
  { href: "/#commodities", label: "Commodities" },
  { href: "/#expertise", label: "Expertise" },
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
  description: string;
};

// Order matters: it matches the country index baked into lib/geo/land-points.json
export const MARKETS: Market[] = [
  {
    id: "saudi-arabia",
    name: "Saudi Arabia",
    region: "Middle East",
    lat: 24.2,
    lon: 45.1,
    description:
      "The Gulf’s largest economy and a cornerstone of global energy, petrochemical and fertiliser production.",
  },
  {
    id: "united-arab-emirates",
    name: "United Arab Emirates",
    region: "Middle East",
    lat: 24.4,
    lon: 54.4,
    description:
      "A leading international trading and logistics hub, linking Gulf supply with markets worldwide.",
  },
  {
    id: "qatar",
    name: "Qatar",
    region: "Middle East",
    lat: 25.3,
    lon: 51.2,
    description:
      "A major natural gas producer with a significant role in global energy and fertiliser exports.",
  },
  {
    id: "bahrain",
    name: "Bahrain",
    region: "Middle East",
    lat: 26.07,
    lon: 50.55,
    description:
      "An established Gulf commercial and financial centre with long-standing refining and aluminium industries.",
  },
  {
    id: "kazakhstan",
    name: "Kazakhstan",
    region: "Central Asia & Caspian",
    lat: 48.0,
    lon: 67.5,
    description: "Central Asia’s largest economy, with substantial oil, metals and grain production.",
  },
  {
    id: "azerbaijan",
    name: "Azerbaijan",
    region: "Central Asia & Caspian",
    lat: 40.3,
    lon: 47.7,
    description:
      "A Caspian energy producer and an important corridor between Europe, the Caucasus and Central Asia.",
  },
  {
    id: "china",
    name: "China",
    region: "Asia",
    lat: 34.5,
    lon: 104.0,
    description:
      "The world’s largest consumer of metals and a leading importer of energy and agricultural commodities.",
  },
  {
    id: "india",
    name: "India",
    region: "Asia",
    lat: 21.5,
    lon: 78.5,
    description:
      "One of the world’s largest consuming markets for energy, fertilisers and edible oils.",
  },
  {
    id: "indonesia",
    name: "Indonesia",
    region: "Asia",
    lat: -2.2,
    lon: 113.5,
    description: "Southeast Asia’s largest economy, with major energy, metals and agricultural sectors.",
  },
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

/* ── Sectors ────────────────────────────────────────────────────────────── */

export type SectorId = "oil-gas" | "agriculture" | "metals" | "perishables";

export type Sector = {
  id: SectorId;
  index: string;
  name: string;
  products: string[];
  description: string;
  /** Value used to pre-select the enquiry form. */
  interest: EnquiryInterest;
};

export const SECTORS: Sector[] = [
  {
    id: "oil-gas",
    index: "01",
    name: "Oil & Gas",
    products: ["Fuel Oil", "LPG", "Bitumen"],
    description:
      "Connecting qualified buyers and suppliers across refined products and gas liquids — from fuel oil and LPG to bitumen — with compliance considered at every stage of the opportunity.",
    interest: "Oil & Gas",
  },
  {
    id: "agriculture",
    index: "02",
    name: "Agriculture",
    products: ["Urea", "Sugar", "Agri-Commodities"],
    description:
      "Supporting supply opportunities in urea, sugar and other agricultural commodities, linking producers and qualified buyers across global agricultural value chains.",
    interest: "Agriculture",
  },
  {
    id: "metals",
    index: "03",
    name: "Metals",
    products: ["Aluminium", "Copper", "Base Metals"],
    description:
      "Facilitating commercial connections between manufacturers, suppliers and buyers of aluminium, copper and other metals across industrial supply chains.",
    interest: "Metals",
  },
  {
    id: "perishables",
    index: "04",
    name: "Perishables",
    products: ["Olive Oil", "Mediterranean Produce"],
    description:
      "Connecting buyers with producers of olive oil and other Mediterranean food products, with careful attention to specification, quality and reliability of supply.",
    interest: "Perishables",
  },
];

/* ── What we do ─────────────────────────────────────────────────────────── */

export type ServiceGlyph =
  | "research"
  | "connect"
  | "negotiate"
  | "logistics"
  | "finance"
  | "compliance"
  | "intelligence"
  | "value";

export type Service = { index: string; title: string; body: string; glyph: ServiceGlyph };

export const SERVICES: Service[] = [
  {
    index: "01",
    title: "Market Research & Sourcing",
    body: "We study demand and supply across commodity markets, helping buyers identify relevant sourcing opportunities and potential suppliers — always with the current market climate in mind.",
    glyph: "research",
  },
  {
    index: "02",
    title: "Buyer & Seller Connections",
    body: "We connect clients directly with end suppliers, established trading companies and qualified buyers — building long-term relationships that extend beyond a single transaction.",
    glyph: "connect",
  },
  {
    index: "03",
    title: "Deal Negotiation",
    body: "We support negotiations between buyers and sellers so that both sides reach fair prices and workable terms — efficiently, and without wasted time.",
    glyph: "negotiate",
  },
  {
    index: "04",
    title: "Logistics Coordination",
    body: "We support communication around shipping and transport documentation — including charter party agreements and Q88 vessel questionnaires — to ease the logistical demands of each transaction, where agreed.",
    glyph: "logistics",
  },
  {
    index: "05",
    title: "Trade Finance & Risk",
    body: "We help counterparties work through financing structures, hedging considerations and risk management, alongside their banks and financial institutions where required.",
    glyph: "finance",
  },
  {
    index: "06",
    title: "Compliance",
    body: "Every engagement is approached with applicable laws, regulations and sanctions requirements in mind — helping clients save time and avoid unreliable intermediaries.",
    glyph: "compliance",
  },
  {
    index: "07",
    title: "Market Intelligence",
    body: "Commercial context on market trends, commodity pricing and trade regulation, giving buyers and sellers the insight to make informed decisions.",
    glyph: "intelligence",
  },
  {
    index: "08",
    title: "Value-Added Services",
    body: "Additional support where it is useful — including market reports, risk assessments and counterparty due diligence — for better-informed decisions.",
    glyph: "value",
  },
];

/* ── Process ────────────────────────────────────────────────────────────── */

export type ProcessStep = { index: string; title: string; body: string };

export const PROCESS_INTRO =
  "A step-by-step methodology for executing commodity transactions — designed for efficiency and compliance for every party involved.";

export const PROCESS: ProcessStep[] = [
  {
    index: "01",
    title: "Consultation",
    body: "We begin by understanding your order specification, commercial expectations and objectives.",
  },
  {
    index: "02",
    title: "Research",
    body: "We carry out due diligence on your requirement and company profile to identify the best-placed counterparty within our network.",
  },
  {
    index: "03",
    title: "Logistics",
    body: "Pricing, procedures, payment terms and specifications are worked through and aligned with the relevant suppliers.",
  },
  {
    index: "04",
    title: "Processing",
    body: "Counterparties are brought into direct, end-to-end contact to complete the transaction — with our support and coordination throughout.",
  },
];

/* ── Why work with us ───────────────────────────────────────────────────── */

export type Pillar = { numeral: string; title: string; body: string };

export const PILLARS: Pillar[] = [
  {
    numeral: "I",
    title: "Regional Reach",
    body: "Connections across strategically important commodity markets in the Middle East, Central Asia and Asia.",
  },
  {
    numeral: "II",
    title: "Sector Focus",
    body: "A defined focus across Oil & Gas, Agriculture, Metals and Perishables.",
  },
  {
    numeral: "III",
    title: "Commercial Understanding",
    body: "An approach grounded in market awareness, counterpart relationships and commercial objectives.",
  },
  {
    numeral: "IV",
    title: "Discretion & Professionalism",
    body: "A relationship-led approach to commercial introductions and advisory engagement.",
  },
];

/* ── Enquiry form options ───────────────────────────────────────────────── */

export const ENQUIRY_ROLES = ["Buyer", "Seller", "Supplier", "Distributor", "Other"] as const;
export const ENQUIRY_INTERESTS = ["Oil & Gas", "Agriculture", "Metals", "Perishables", "Multiple"] as const;

export type EnquiryRole = (typeof ENQUIRY_ROLES)[number];
export type EnquiryInterest = (typeof ENQUIRY_INTERESTS)[number];
