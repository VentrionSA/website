# Ventrion — website

A single-page "digital business card" for Ventrion, an independent trade facilitation company working through a trusted network. Sections: hero; 01 independent trade facilitation; 02 the network (an interactive 3D globe, with the table of elements beneath it); 03 mission, vision and values: the mission and the vision, each with a drawing that stays alive (a compass whose rose is the Ventrion star, and a horizon with the sun rising and a ship holding its course, in `components/sections/vision/`), then the values: "Trust does.", four values (in `lib/content.ts`), the eagles section ("The way we work") and the commitments that put the values into practice, the first with a trading house drawn in the colours of the globe and the other two set over photographs, ripe wheat and a ship crossing a calm sea at dawn (`components/sections/MissionVision.tsx`, `Values.tsx`, `principles/`); a closing statement over a sea of clouds; 04 contact (with the local time across the markets, `components/sections/contact/MarketClocks.tsx`).

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
| `NEXT_PUBLIC_CONTACT_PHONE` | `+966 5X XXX XXXX` | The "Arrange a meeting" buttons (contact section, closing, mobile menu, portal), which dial it, and the footer |
| `NEXT_PUBLIC_WHATSAPP_NUMBER` | `+9665XXXXXXXX` | Contact section and footer (`wa.me` link with a pre-filled message); hidden until set |
| `NEXT_PUBLIC_CONTACT_EMAIL` | defaults to `info@ventrion.sa` | Contact section, footer, structured data |
| `NEXT_PUBLIC_COMPANY_LEGAL_NAME` | `Ventrion Company` | Privacy policy and terms |
| `NEXT_PUBLIC_SITE_URL` | `https://www.yourdomain.com` | Canonical URLs, sitemap, Open Graph (falls back to the Vercel URL) |

Until the telephone number is set, those buttons read "Request a meeting" and open an email to Ventrion asking to arrange one. The site speaks of meetings, never of calls.

### 2. Client portal ("Track your progress")

Opened from the header, the mobile menu, the contact section, the footer, or a link to `/#track`. The visitor's Client ID is hashed on their device (SHA-256) and only the fingerprint is sent to `POST /api/portal`, which looks it up in the server-side `CLIENT_REGISTRY` variable (JSON, see `lib/client-portal.ts`). With no registry, every ID is answered "could not verify"; nothing is ever shown as verified without a record.

Issue an ID for a client:

```bash
node scripts/client-id.mjs new "Client name"
```

Give the printed Client ID to the client privately, add the printed entry to `CLIENT_REGISTRY` in Vercel (Production), then redeploy. Update `status`, `stage`, `updated`, `note` and `timeline` there as the engagement progresses.

### 3. Legal pages

`app/privacy/page.tsx` and `app/terms/page.tsx` should be reviewed by your legal advisers. The terms still contain a `[JURISDICTION]` placeholder.

## Content

- **Navigation, markets, mission, vision, values and the three commitments:** `lib/content.ts`; other section copy lives in `components/sections/*`.
- **Imagery:** photographs chosen for their calm and graded to the page's ivory, and drawings in the site's colours; no stock clichés. The hero's wake (`assets/images/backdrops/hero-wake.jpg`, mapped in `lib/backdrops.ts`) comes from Ventrion's own hero design. The other photographs are from Pexels (free licence, no attribution required): a sea of clouds at first light behind the closing statement (`assets/images/backdrops/clouds.jpg`), port cranes at night behind Contact (`expertise.jpg`), and behind two principles ripe wheat (`assets/images/principles/wheat-field.jpg`, Pexels photo 6412607) and a ship in fog at dawn (`ship-in-fog.jpg`, Pexels photo 13135121); replace any of them at the same paths (≥ 2400px wide; Next.js serves AVIF/WebP automatically). The eagles artwork (`assets/images/art/trust-eagles.jpg`) is Ventrion's own, cleaned, extended and graded.
- **Logo:** traced from the supplied artwork — `components/brand/logo-paths.ts`, plus SVGs in `public/brand/`.
- **Network globe:** `components/three/GlobeCanvas.tsx` (three.js through React Three Fiber). Its texture is drawn at runtime from `lib/geo/countries.json`: Natural Earth country outlines at 1:50m (the `world-atlas` package) in the equirectangular projection, simplified to the texture's resolution by `npm run build:map` (`scripts/build-globe-map.mjs`, using `d3-geo` and `topojson-client`); run it again after changing the markets. Marker positions come from `MARKETS` in `lib/content.ts`. The globe is as large as the screen allows (edge to edge on phones), turns to face the market chosen in the list, can be dragged and flicked, and tours the markets when left alone; from the market in focus, routes draw out along the great circles to the rest of the network, with a light travelling each. Without WebGL, or on low-powered devices, a flat map of the network stands in (`components/sections/network/FlatMap.tsx`).

## Accessibility & performance notes

- Respects `prefers-reduced-motion` (no smooth scroll, no scroll animations, static 3D fallbacks).
- The globe is lazy-loaded (its bundle warmed when the browser is idle), renders only while on screen, lowers its resolution if the device cannot hold the frame rate, and falls back to a flat map when WebGL is unavailable or the device is low-powered.
- Keyboard-accessible navigation, mobile menu and client portal (focus trap, Escape to close), and market selector.
