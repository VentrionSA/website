import { enquiryRequestSchema, toFieldErrors, type Enquiry, type EnquiryResponse } from "@/lib/enquiry";

/**
 * POST /api/enquiry
 *
 * Delivery channels (configure in Vercel → Settings → Environment Variables):
 *   RESEND_API_KEY + ENQUIRY_TO_EMAIL [+ ENQUIRY_FROM_EMAIL]  → email via Resend
 *   ENQUIRY_WEBHOOK_URL [+ ENQUIRY_WEBHOOK_SECRET]            → JSON POST (CRM, Slack, Zapier, Make…)
 *
 * The response is only successful when at least one channel accepted the enquiry.
 * With nothing configured the route answers 503 — the form never fakes success.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BODY_BYTES = 20_000;
const MIN_FILL_MS = 2_500;
const MAX_FORM_AGE_MS = 1000 * 60 * 60 * 24;
const RATE_LIMIT = { windowMs: 10 * 60 * 1000, max: 5 };

// Best-effort per-instance rate limiting (serverless instances are short-lived).
const hits = new Map<string, number[]>();

function rateLimited(key: string) {
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((t) => now - t < RATE_LIMIT.windowMs);
  recent.push(now);
  hits.set(key, recent);
  if (hits.size > 5000) hits.clear();
  return recent.length > RATE_LIMIT.max;
}

function json(body: EnquiryResponse, status: number) {
  return Response.json(body, { status, headers: { "Cache-Control": "no-store" } });
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

function makeReference() {
  const date = new Date().toISOString().slice(2, 10).replace(/-/g, "");
  const rand = crypto.getRandomValues(new Uint32Array(1))[0].toString(36).toUpperCase().padStart(6, "0").slice(0, 6);
  return `VTR-${date}-${rand}`;
}

const FIELD_LABELS: [keyof Enquiry, string][] = [
  ["fullName", "Full name"],
  ["company", "Company"],
  ["email", "Business email"],
  ["phone", "WhatsApp / phone"],
  ["country", "Country"],
  ["message", "Message"],
];

async function sendWithResend(enquiry: Enquiry, reference: string) {
  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.ENQUIRY_TO_EMAIL;
  if (!apiKey || !to) return null;
  const from = process.env.ENQUIRY_FROM_EMAIL || "Ventrion Website <onboarding@resend.dev>";

  const rows = FIELD_LABELS.map(
    ([key, labelText]) =>
      `<tr><td style="padding:8px 16px 8px 0;color:#6f706a;font:12px/1.4 Arial,sans-serif;text-transform:uppercase;letter-spacing:.12em;vertical-align:top;white-space:nowrap">${labelText}</td><td style="padding:8px 0;color:#101110;font:15px/1.5 Arial,sans-serif;white-space:pre-wrap">${escapeHtml(
        String(enquiry[key] || "—"),
      )}</td></tr>`,
  ).join("");
  const html = `<div style="background:#f4f0e6;padding:32px"><div style="max-width:640px;margin:0 auto;background:#ffffff;padding:32px;border-top:3px solid #c4a779"><p style="margin:0 0 4px;color:#8f7650;font:12px Arial,sans-serif;letter-spacing:.2em;text-transform:uppercase">New website enquiry</p><h1 style="margin:0 0 24px;font:24px Georgia,serif;color:#101110">${escapeHtml(enquiry.company)}</h1><table style="border-collapse:collapse">${rows}</table><p style="margin:24px 0 0;color:#6f706a;font:12px Arial,sans-serif">Reference ${reference}</p></div></div>`;
  const text = FIELD_LABELS.map(([key, labelText]) => `${labelText}: ${enquiry[key] || "—"}`).join("\n") + `\n\nReference: ${reference}`;

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from,
      to: to.split(",").map((s) => s.trim()).filter(Boolean),
      reply_to: enquiry.email,
      subject: `Enquiry ${reference}: ${enquiry.company}`,
      html,
      text,
    }),
    signal: AbortSignal.timeout(10_000),
  });
  if (!response.ok) {
    console.error("[enquiry] Resend delivery failed", response.status, await response.text().catch(() => ""));
    return false;
  }
  return true;
}

async function sendToWebhook(enquiry: Enquiry, reference: string) {
  const url = process.env.ENQUIRY_WEBHOOK_URL;
  if (!url) return null;
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (process.env.ENQUIRY_WEBHOOK_SECRET) headers.Authorization = `Bearer ${process.env.ENQUIRY_WEBHOOK_SECRET}`;
  const response = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify({ reference, submittedAt: new Date().toISOString(), source: "website", enquiry }),
    signal: AbortSignal.timeout(10_000),
  });
  if (!response.ok) {
    console.error("[enquiry] Webhook delivery failed", response.status);
    return false;
  }
  return true;
}

export async function POST(request: Request) {
  // Same-origin check (browsers always send Origin on cross-origin POSTs).
  const origin = request.headers.get("origin");
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  if (origin && host) {
    try {
      if (new URL(origin).host !== host) {
        return json({ ok: false, error: "bad_request", message: "This request could not be accepted." }, 403);
      }
    } catch {
      return json({ ok: false, error: "bad_request", message: "This request could not be accepted." }, 400);
    }
  }

  if (!request.headers.get("content-type")?.includes("application/json")) {
    return json({ ok: false, error: "bad_request", message: "Unsupported request format." }, 415);
  }

  const ip = (request.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() || request.headers.get("x-real-ip") || "unknown";
  if (rateLimited(ip)) {
    return json(
      { ok: false, error: "rate_limited", message: "Too many enquiries were sent from this connection. Please try again in a few minutes." },
      429,
    );
  }

  const raw = await request.text();
  if (raw.length > MAX_BODY_BYTES) {
    return json({ ok: false, error: "bad_request", message: "Your enquiry is too long. Please shorten the message." }, 413);
  }

  let payload: unknown;
  try {
    payload = JSON.parse(raw);
  } catch {
    return json({ ok: false, error: "bad_request", message: "The enquiry could not be read. Please try again." }, 400);
  }

  const parsed = enquiryRequestSchema.safeParse(payload);
  if (!parsed.success) {
    const fieldErrors = toFieldErrors(parsed.error);
    const spamIssue = parsed.error.issues.some((i) => i.path[0] === "website" || i.path[0] === "startedAt");
    if (spamIssue && Object.keys(fieldErrors).length === 0) {
      return json({ ok: false, error: "spam", message: "Your enquiry could not be processed. Please try again." }, 400);
    }
    return json({ ok: false, error: "validation", message: "Please review the highlighted fields.", fieldErrors }, 422);
  }

  const { website, startedAt, ...enquiry } = parsed.data;
  const age = Date.now() - startedAt;
  if (website || age < MIN_FILL_MS || age > MAX_FORM_AGE_MS) {
    return json(
      {
        ok: false,
        error: "spam",
        message: age < MIN_FILL_MS ? "That was quick — please take a moment to review your enquiry, then submit again." : "Your enquiry could not be processed. Please refresh the page and try again.",
      },
      400,
    );
  }

  const reference = makeReference();
  const results = await Promise.allSettled([sendWithResend(enquiry, reference), sendToWebhook(enquiry, reference)]);
  const outcomes = results.map((r) => (r.status === "fulfilled" ? r.value : false));

  if (outcomes.every((o) => o === null)) {
    console.warn("[enquiry] No delivery channel configured — set RESEND_API_KEY/ENQUIRY_TO_EMAIL or ENQUIRY_WEBHOOK_URL.");
    return json(
      {
        ok: false,
        error: "not_configured",
        message:
          "Online enquiries are not yet connected, so your message has not been sent. Please contact us directly via WhatsApp or email in the meantime.",
      },
      503,
    );
  }

  if (!outcomes.some((o) => o === true)) {
    return json(
      { ok: false, error: "delivery_failed", message: "We could not deliver your enquiry just now. Please try again shortly, or contact us on WhatsApp." },
      502,
    );
  }

  return json({ ok: true, reference }, 200);
}

export function GET() {
  return new Response("Method Not Allowed", { status: 405, headers: { Allow: "POST" } });
}
