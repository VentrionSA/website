# Ventrion — website

Single-page marketing site for Ventrion, an international commodity brokerage and advisory firm.

**Stack:** Next.js 16 (App Router, TypeScript) · Tailwind CSS v4 · GSAP + ScrollTrigger + SplitText · Lenis smooth scroll · Motion (Framer Motion) · Three.js / React Three Fiber · Lucide · Zod.

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # production build
npm run typecheck
```

Pushing to GitHub deploys automatically to the linked Vercel project (`website`). Branch pushes create preview deployments; `main` is production.

## Configure before launch

### 1. Contact details (placeholders)

Values still in `[BRACKETS]` are treated as “not configured”. Set them in **Vercel → Project → Settings → Environment Variables** (then redeploy) or edit `lib/site.ts`:

| Variable | Example | Used for |
| --- | --- | --- |
| `NEXT_PUBLIC_WHATSAPP_NUMBER` | `+9665XXXXXXXX` | Floating WhatsApp button, contact section, mobile menu (`wa.me` link with a pre-filled message) |
| `NEXT_PUBLIC_CONTACT_EMAIL` | `hello@yourdomain.com` | Contact section, footer, structured data |
| `NEXT_PUBLIC_LINKEDIN_URL` | `https://www.linkedin.com/company/…` | Contact section, footer |
| `NEXT_PUBLIC_COMPANY_LEGAL_NAME` | `Ventrion …` | Copyright line |
| `NEXT_PUBLIC_SITE_URL` | `https://www.yourdomain.com` | Canonical URLs, sitemap, Open Graph (falls back to the Vercel URL) |

Until the WhatsApp number is set, WhatsApp buttons scroll to the enquiry form instead.

### 2. Enquiry form delivery

`POST /api/enquiry` validates every field (Zod), applies spam protection (honeypot, minimum fill time, per-IP rate limit, same-origin check) and **only reports success when a delivery channel accepted the enquiry**. With nothing configured it returns a clear “not yet connected” message — it never fakes success.

Configure at least one channel (server-side variables, not `NEXT_PUBLIC_`):

| Variable | Notes |
| --- | --- |
| `RESEND_API_KEY` | API key from [resend.com](https://resend.com) |
| `ENQUIRY_TO_EMAIL` | Recipient(s), comma-separated |
| `ENQUIRY_FROM_EMAIL` | Sender on a domain verified in Resend, e.g. `Ventrion Website <enquiries@yourdomain.com>` |
| `ENQUIRY_WEBHOOK_URL` | Optional: also/alternatively POST enquiries as JSON (CRM, Slack, Zapier, Make…) |
| `ENQUIRY_WEBHOOK_SECRET` | Optional: sent as `Authorization: Bearer …` to the webhook |

### 3. Legal pages

`app/privacy/page.tsx` and `app/terms/page.tsx` are templates with `[PLACEHOLDERS]` — have them reviewed and completed by your legal advisers.

## Content

- **Copy, markets, sectors, services, process, pillars:** `lib/content.ts`
- **Imagery:** `assets/images/` (alt text in `lib/media.ts`). The current images are original rendered artwork made for this site; replace them with commissioned photography at the same filenames (any size ≥ 2400px wide; Next.js serves AVIF/WebP automatically).
- **Logo:** traced from the supplied artwork — `components/brand/logo-paths.ts`, plus SVGs in `public/brand/`.
- **Globe data:** `lib/geo/land-points.json` (Natural Earth land via `world-atlas`, run-length encoded).

## Accessibility & performance notes

- Respects `prefers-reduced-motion` (no smooth scroll, no scroll animations, static 3D fallbacks).
- WebGL scenes are lazy-loaded, pause when off-screen, and fall back to CSS/2D versions when WebGL is unavailable or the device is low-powered.
- Keyboard-accessible navigation, mobile menu (focus trap, Escape to close), market selector and form.
