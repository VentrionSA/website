import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Fraunces, Manrope, Source_Serif_4 } from "next/font/google";
import "./globals.css";
import { SmoothScroll } from "@/components/providers/SmoothScroll";
import { Navigation } from "@/components/layout/Navigation";
import { Footer } from "@/components/layout/Footer";
import { ClientPortalProvider } from "@/components/portal/ClientPortal";
import { MARKETS } from "@/lib/content";
import { getPhoneDisplay, getSiteUrl, isPlaceholder, siteConfig } from "@/lib/site";

const serif = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--font-display",
  display: "swap",
});

// Text serif with optical sizes: the navigation, hero details and the hero strip.
const textSerif = Source_Serif_4({
  subsets: ["latin"],
  axes: ["opsz"],
  variable: "--font-source",
  display: "swap",
});

// Display serif for the first line of the hero, "Creating opportunities.", and "Trust takes two."
const accent = Fraunces({
  subsets: ["latin"],
  // optical sizes give the display cut at headline sizes; the SOFT and WONK axes aren't used
  axes: ["opsz"],
  variable: "--font-fraunces",
  display: "swap",
});

const sans = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
  display: "swap",
});

const siteUrl = getSiteUrl();
const title = "Ventrion — Creating opportunities. In every direction.";
const description = siteConfig.description;

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: title, template: "%s — Ventrion" },
  description,
  applicationName: "Ventrion",
  keywords: [
    "Ventrion",
    "Trade facilitation",
    "Independent trade facilitation",
    "Trusted trade network",
    "International trade network",
    "Middle East trade",
    "Central Asia trade",
    "Asia trade",
  ],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: "/",
    siteName: "Ventrion",
    title,
    description,
    locale: "en_GB",
  },
  twitter: { card: "summary_large_image", title, description },
  robots: { index: true, follow: true },
  formatDetection: { telephone: false, email: false, address: false },
  category: "business",
};

export const viewport: Viewport = {
  themeColor: "#f4f0e6",
  colorScheme: "light",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

function StructuredData() {
  const data = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${siteUrl}/#organization`,
        name: siteConfig.name,
        url: siteUrl,
        logo: `${siteUrl}/brand/ventrion-logo-512.png`,
        description: siteConfig.description,
        slogan: "Creating opportunities. In every direction.",
        areaServed: MARKETS.map((m) => ({ "@type": "Country", name: m.name })),
        knowsAbout: ["Trade facilitation", "International trade"],
        ...(!isPlaceholder(siteConfig.email)
          ? {
              contactPoint: {
                "@type": "ContactPoint",
                contactType: "sales",
                email: siteConfig.email,
                ...(getPhoneDisplay() ? { telephone: getPhoneDisplay() } : {}),
              },
            }
          : {}),
      },
      {
        "@type": "WebSite",
        "@id": `${siteUrl}/#website`,
        url: siteUrl,
        name: siteConfig.name,
        inLanguage: "en",
        publisher: { "@id": `${siteUrl}/#organization` },
      },
    ],
  };
  return (
    <script
      type="application/ld+json"
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${serif.variable} ${textSerif.variable} ${accent.variable} ${sans.variable}`} suppressHydrationWarning>
      <body>
        <a href="#main" className="skip-link">
          Skip to content
        </a>
        <SmoothScroll>
          <ClientPortalProvider>
            <Navigation />
            {children}
            <Footer />
          </ClientPortalProvider>
        </SmoothScroll>
        <div className="grain" aria-hidden="true" />
        <StructuredData />
      </body>
    </html>
  );
}
