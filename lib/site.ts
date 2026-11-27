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
  /** Registered legal entity name, used in the privacy policy and terms. */
  legalName: process.env.NEXT_PUBLIC_COMPANY_LEGAL_NAME || "Ventrion Company",
  tagline: "Creating opportunities. In every direction.",
  description:
    "Ventrion is an independent trade facilitation company, bringing trusted counterparts together through an established network across the Middle East, Central Asia and Asia.",

  /** Business contact details — placeholders until confirmed. */
  email: process.env.NEXT_PUBLIC_CONTACT_EMAIL || "info@ventrion.sa",
  /**
   * The number the "Arrange a meeting" buttons dial, written as it should be displayed.
   * Without a number, those buttons become "Request a meeting" (an email asking Ventrion to be in touch).
   */
  phone: process.env.NEXT_PUBLIC_CONTACT_PHONE || "+966 55 151 0051",
  /** International format, digits only or with +, e.g. +9665XXXXXXXX */
  whatsappNumber: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "[WHATSAPP_NUMBER_WITH_COUNTRY_CODE]",

  whatsappMessage: "Hello Ventrion, I would like to arrange a confidential conversation.",
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

/** The configured telephone number as written (for display), or null while it is a placeholder. */
export function getPhoneDisplay(): string | null {
  if (isPlaceholder(siteConfig.phone)) return null;
  const digits = siteConfig.phone.replace(/\D/g, "");
  return digits.length >= 8 ? siteConfig.phone.trim() : null;
}

/** A tel: link for the call buttons, or null while the number is still a placeholder. */
export function getTelHref(): string | null {
  const display = getPhoneDisplay();
  if (!display) return null;
  const plus = display.startsWith("+") ? "+" : "";
  return `tel:${plus}${display.replace(/\D/g, "")}`;
}

/** Email asking Ventrion to arrange a meeting: the meeting action until a phone number is configured. */
export function getCallbackHref(): string | null {
  if (isPlaceholder(siteConfig.email)) return null;
  const subject = "Meeting request";
  const body = "Hello Ventrion,\n\nI would like to arrange a meeting.\n\nTelephone: \nPreferred time: \n\nName: \nCompany: ";
  return `mailto:${siteConfig.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

/**
 * The single action used across the site to arrange a meeting: by telephone, or by email
 * until a number is configured. (The site speaks of meetings, never of calls.)
 */
export function getCallAction(): { href: string; label: string; detail: string; isPhone: boolean } {
  const tel = getTelHref();
  if (tel) return { href: tel, label: "Arrange a meeting", detail: getPhoneDisplay() ?? "", isPhone: true };
  return { href: getCallbackHref() ?? "/#contact", label: "Request a meeting", detail: "We will be in touch", isPhone: false };
}
