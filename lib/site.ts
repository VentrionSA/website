/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  SITE CONFIGURATION
 *  Replace the bracketed placeholders below (or set the matching environment
 *  variables in Vercel → Project → Settings → Environment Variables).
 *  Anything still in [BRACKETS] is treated as "not configured" by the UI.
 * ─────────────────────────────────────────────────────────────────────────────
 */

const PLACEHOLDER_PATTERN = /^\[[A-Z0-9_]+\]$/;

/** True when a config value has not been replaced yet. */
export function isPlaceholder(value: string | null | undefined): boolean {
  return !value || PLACEHOLDER_PATTERN.test(value.trim());
}

export const siteConfig = {
  name: "Ventrion",
  /** Registered legal entity name, shown in the copyright line. */
  legalName: process.env.NEXT_PUBLIC_COMPANY_LEGAL_NAME || "Ventrion Company",
  tagline: "International Commodity Brokerage & Advisory",
  description:
    "Ventrion is an independent international commodity brokerage and advisory firm connecting buyers and suppliers across the Middle East, Central Asia and Asia in Oil & Gas, Agriculture, Metals and Perishables.",

  /** Business contact details — placeholders until confirmed. */
  email: process.env.NEXT_PUBLIC_CONTACT_EMAIL || "info@ventrion.sa",
  /** International format, digits only or with +, e.g. +9665XXXXXXXX */
  whatsappNumber: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "[WHATSAPP_NUMBER_WITH_COUNTRY_CODE]",

  whatsappMessage: "Hello, I would like to enquire about your commodity brokerage and advisory services.",
} as const;

/** Absolute site URL — server-side only (used for metadata, sitemap, OG). */
export function getSiteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL;
  if (explicit) return explicit.replace(/\/$/, "");
  if (process.env.VERCEL_ENV === "production" && process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  }
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
}

/** Returns a wa.me deep link, or null while the number is still a placeholder. */
export function getWhatsAppHref(message: string = siteConfig.whatsappMessage): string | null {
  if (isPlaceholder(siteConfig.whatsappNumber)) return null;
  const digits = siteConfig.whatsappNumber.replace(/\D/g, "");
  if (digits.length < 8) return null;
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}

export function getMailtoHref(): string | null {
  if (isPlaceholder(siteConfig.email)) return null;
  return `mailto:${siteConfig.email}`;
}
