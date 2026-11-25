import { z } from "zod";
import { FINGERPRINT_PATTERN, type ClientRecord, type PortalResponse } from "@/lib/client-portal";

/**
 * POST /api/portal  { fingerprint }  — verifies a Client ID for the client portal.
 *
 * The browser sends only the SHA-256 fingerprint of the ID (see lib/client-portal.ts).
 * Records come from the server-side CLIENT_REGISTRY environment variable; with
 * no registry configured every lookup is answered "unverified". The route never
 * invents a record.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BODY_BYTES = 1_000;
const MIN_RESPONSE_MS = 900; // uniform timing; also slows guessing
const RATE_LIMIT = { windowMs: 10 * 60 * 1000, max: 8 };

const bodySchema = z.object({ fingerprint: z.string().regex(FINGERPRINT_PATTERN) });

const recordSchema: z.ZodType<ClientRecord> = z.object({
  name: z.string().max(200).optional(),
  status: z.string().min(1).max(120),
  stage: z.string().max(200).optional(),
  updated: z.string().max(40).optional(),
  note: z.string().max(1200).optional(),
  timeline: z
    .array(z.object({ date: z.string().max(40).optional(), label: z.string().min(1).max(200), done: z.boolean().optional() }))
    .max(24)
    .optional(),
});

const registrySchema = z.record(z.string().regex(FINGERPRINT_PATTERN), recordSchema);

let cache: { source: string; registry: Map<string, ClientRecord> } | null = null;

function loadRegistry(): Map<string, ClientRecord> {
  const source = process.env.CLIENT_REGISTRY ?? process.env.INVESTOR_REGISTRY ?? "";
  if (cache && cache.source === source) return cache.registry;
  let registry = new Map<string, ClientRecord>();
  if (source.trim()) {
    try {
      const parsed = registrySchema.safeParse(JSON.parse(source));
      if (parsed.success) registry = new Map(Object.entries(parsed.data));
      else console.error("CLIENT_REGISTRY is not in the expected format; no client can be verified until it is fixed.");
    } catch {
      console.error("CLIENT_REGISTRY is not valid JSON; no client can be verified until it is fixed.");
    }
  }
  cache = { source, registry };
  return registry;
}

// Best-effort per-instance rate limiting (serverless instances are short-lived).
const hits = new Map<string, number[]>();

function retryAfterSeconds(key: string): number {
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((t) => now - t < RATE_LIMIT.windowMs);
  if (recent.length >= RATE_LIMIT.max) {
    hits.set(key, recent);
    return Math.ceil((RATE_LIMIT.windowMs - (now - recent[0])) / 1000);
  }
  recent.push(now);
  hits.set(key, recent);
  if (hits.size > 5000) hits.clear();
  return 0;
}

async function respond(body: PortalResponse, status: number, started: number) {
  const wait = MIN_RESPONSE_MS - (Date.now() - started);
  if (wait > 0) await new Promise((resolve) => setTimeout(resolve, wait));
  return Response.json(body, { status, headers: { "Cache-Control": "no-store", "X-Robots-Tag": "noindex" } });
}

export async function POST(request: Request) {
  const started = Date.now();

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown";
  const retryAfter = retryAfterSeconds(ip);
  if (retryAfter > 0) return respond({ status: "limited", retryAfter }, 429, started);

  const length = Number(request.headers.get("content-length") ?? 0);
  if (length > MAX_BODY_BYTES) return respond({ status: "invalid" }, 413, started);

  let json: unknown = null;
  try {
    json = await request.json();
  } catch {
    return respond({ status: "invalid" }, 400, started);
  }
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) return respond({ status: "invalid" }, 400, started);

  const record = loadRegistry().get(parsed.data.fingerprint);
  if (!record) return respond({ status: "unverified" }, 200, started);
  return respond({ status: "verified", record }, 200, started);
}

export function GET() {
  return Response.json({ status: "invalid" } satisfies PortalResponse, { status: 405, headers: { Allow: "POST" } });
}
