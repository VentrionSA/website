import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Manrope } from "next/font/google";
import "./globals.css";
import { SmoothScroll } from "@/components/providers/SmoothScroll";
import { Navigation } from "@/components/layout/Navigation";
import { Footer } from "@/components/layout/Footer";
import { WhatsAppFloat } from "@/components/layout/WhatsAppFloat";
import { MARKETS, SECTORS } from "@/lib/content";
import { getSiteUrl, isPlaceholder, siteConfig } from "@/lib/site";

const serif = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--font-display",
  display: "swap",
});

const sans = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
  display: "swap",
});

const siteUrl = getSiteUrl();
const title = "Ventrion — International Commodity Brokerage & Advisory";
const description =
  "Independent commodity brokerage and advisory connecting buyers and suppliers across the Middle East, Central Asia and Asia — Oil & Gas, Agriculture, Metals and Perishables.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: title, template: "%s — Ventrion" },
  description,
  applicationName: "Ventrion",
  keywords: [
    "International Commodity Brokerage",
    "Commodity Advisory",
    "Commodity Sourcing",
    "Global Commodity Markets",
    "Middle East Commodity Brokerage",
    "Asian Commodity Markets",
    "Oil and Gas Brokerage",
    "Fuel Oil, LPG and Bitumen",
    "Urea Suppliers",
    "Sugar Trading",
    "Aluminium and Copper",
    "Olive Oil Suppliers",
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
  themeColor: "#101110",
  colorScheme: "dark",
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
        slogan: "Connecting Markets. Moving Essential Commodities.",
        areaServed: MARKETS.map((m) => ({ "@type": "Country", name: m.name })),
        knowsAbout: [
          "Commodity brokerage",
          "Commodity advisory",
          "Commodity sourcing",
          ...SECTORS.flatMap((s) => [s.name, ...s.products]),
        ],
        ...(!isPlaceholder(siteConfig.email)
          ? { contactPoint: { "@type": "ContactPoint", contactType: "sales", email: siteConfig.email } }
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
    <html lang="en" className={`${serif.variable} ${sans.variable}`} suppressHydrationWarning>
      <body>
        <a href="#main" className="skip-link">
          Skip to content
        </a>
        <SmoothScroll>
          <Navigation />
          {children}
          <Footer />
          <WhatsAppFloat />
        </SmoothScroll>
        <div className="grain" aria-hidden="true" />
        <StructuredData />
      </body>
    </html>
  );
}
