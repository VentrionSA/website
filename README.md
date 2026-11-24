# Ventrion — website

A single-page "digital business card" for Ventrion, an independent trade facilitation company working through a trusted network. Sections: hero, independent trade facilitation, the network (interactive 3D globe), our principles (four principles with self-drawing line illustrations in `components/sections/principles/`), a closing statement, contact.

**Stack:** Next.js 16 (App Router, TypeScript) · Tailwind CSS v4 · GSAP + ScrollTrigger + SplitText · Lenis smooth scroll · Motion (Framer Motion) · Three.js / React Three Fiber · Lucide · Zod.

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # production build
npm run typecheck
```

Pushing to GitHub deploys automatically to the linked Vercel project (`website`). Branch pushes create preview deployments; `main` is production.

## Configure before launch

### 1. Contact details

Values still in `[BRACKETS]` are treated as “not configured”. Set them in **Vercel → Project → Settings → Environment Variables** (then redeploy) or edit `lib/site.ts`:

| Variable | Example | Used for |
| --- | --- | --- |
| `NEXT_PUBLIC_CONTACT_PHONE` | `+966 5X XXX XXXX` | The "Call Ventrion" buttons (contact section, closing, mobile menu, portal) and the footer |
| `NEXT_PUBLIC_WHATSAPP_NUMBER` | `+9665XXXXXXXX` | Contact section and footer (`wa.me` link with a pre-filled message); hidden until set |
| `NEXT_PUBLIC_CONTACT_EMAIL` | defaults to `info@ventrion.sa` | Contact section, footer, structured data |
| `NEXT_PUBLIC_COMPANY_LEGAL_NAME` | `Ventrion Company` | Privacy policy and terms |
| `NEXT_PUBLIC_SITE_URL` | `https://www.yourdomain.com` | Canonical URLs, sitemap, Open Graph (falls back to the Vercel URL) |

Until the telephone number is set, the call buttons read "Request a call" and open an email to Ventrion asking for a call back.

### 2. Investor portal ("Track your investment")

Opened from the header, the mobile menu, the contact section, the footer, or a link to `/#track`. The visitor's Investor ID is hashed on their device (SHA-256) and only the fingerprint is sent to `POST /api/investor`, which looks it up in the server-side `INVESTOR_REGISTRY` variable (JSON, see `lib/investor.ts`). With no registry, every ID is answered "could not verify"; nothing is ever shown as verified without a record.

Issue an ID for a client:

```bash
node scripts/investor.mjs new "Client name"
```

Give the printed Investor ID to the client privately, add the printed entry to `INVESTOR_REGISTRY` in Vercel (Production), then redeploy. Update `status`, `stage`, `updated`, `note` and `timeline` there as the engagement progresses.

### 3. Legal pages

`app/privacy/page.tsx` and `app/terms/page.tsx` should be reviewed by your legal advisers. The terms still contain a `[JURISDICTION]` placeholder.

## Content

- **Navigation, markets and the four principles:** `lib/content.ts`; other section copy lives in `components/sections/*`.
- **Imagery:** section backgrounds in `assets/images/backdrops/` (mapped in `lib/backdrops.ts`) are placeholder photography from Pexels (free commercial licence, no attribution required); replace with commissioned photography at the same filenames (≥ 2400px wide; Next.js serves AVIF/WebP automatically).
- **Logo:** traced from the supplied artwork — `components/brand/logo-paths.ts`, plus SVGs in `public/brand/`.
- **Globe map:** `lib/geo/countries.json`, country outlines from Natural Earth (via world-atlas, 1:110m with Bahrain from 1:50m) pre-projected to an equirectangular map; network markets are tagged by id. The globe draws it as a texture at runtime.

## Accessibility & performance notes

- Respects `prefers-reduced-motion` (no smooth scroll, no scroll animations, static 3D fallbacks).
- WebGL scenes are lazy-loaded, pause when off-screen, and fall back to CSS/2D versions when WebGL is unavailable or the device is low-powered.
- Keyboard-accessible navigation, mobile menu and investor portal (focus trap, Escape to close), and market selector.
