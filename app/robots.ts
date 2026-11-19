import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  const base = getSiteUrl();
  // Only the production deployment should be indexed.
  const isProduction = process.env.VERCEL_ENV ? process.env.VERCEL_ENV === "production" : true;
  return {
    rules: isProduction ? [{ userAgent: "*", allow: "/", disallow: ["/api/"] }] : [{ userAgent: "*", disallow: "/" }],
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
