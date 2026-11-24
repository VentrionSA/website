/**
 * Investor portal ("Track your investment") — shared by the browser and the API route.
 *
 * Security model
 * - An Investor ID never leaves the visitor's device in readable form. The browser
 *   normalises it (upper case, letters and digits only) and sends only its SHA-256
 *   fingerprint, over HTTPS.
 * - The server looks the fingerprint up in INVESTOR_REGISTRY, a server-side
 *   environment variable (JSON, set in Vercel → Settings → Environment Variables).
 *   Investor records are never stored in this repository or in the browser.
 * - Lookups are rate limited and answered no faster than a fixed minimum time.
 *
 * Issue a new Investor ID and its registry entry with:
 *   node scripts/investor.mjs new "Client name"
 *
 * INVESTOR_REGISTRY format (keys are fingerprints):
 *   {
 *     "<64-character SHA-256 fingerprint>": {
 *       "name": "Client or engagement name",
 *       "status": "In progress",
 *       "stage": "Counterparty introduced",
 *       "updated": "2026-11-24",
 *       "note": "Optional message for the client",
 *       "timeline": [{ "date": "2026-11-02", "label": "Engagement opened", "done": true }]
 *     }
 *   }
 */

export const INVESTOR_ID_MIN = 6;
export const INVESTOR_ID_MAX = 32;

/** Upper case, letters and digits only: "vtr-7kq2 m9xd" and "VTR7KQ2M9XD" are the same ID. */
export function normalizeInvestorId(raw: string): string {
  return raw.toUpperCase().replace(/[^A-Z0-9]/g, "");
}

export type InvestorTimelineStep = { date?: string; label: string; done?: boolean };

export type InvestorRecord = {
  name?: string;
  status: string;
  stage?: string;
  updated?: string;
  note?: string;
  timeline?: InvestorTimelineStep[];
};

export type InvestorResponse =
  | { status: "verified"; record: InvestorRecord }
  | { status: "unverified" }
  | { status: "limited"; retryAfter: number }
  | { status: "invalid" };

export const FINGERPRINT_PATTERN = /^[a-f0-9]{64}$/;

/** SHA-256 of the normalised ID as lowercase hex (Web Crypto: browsers and Node 20+). */
export async function fingerprintInvestorId(raw: string): Promise<string> {
  const data = new TextEncoder().encode(normalizeInvestorId(raw));
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
}
