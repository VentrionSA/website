import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Ventrion — International Commodity Brokerage & Advisory",
    short_name: "Ventrion",
    description: "Independent commodity brokerage and advisory across the Middle East, Central Asia and Asia.",
    start_url: "/",
    display: "standalone",
    background_color: "#f5eee2",
    theme_color: "#f5eee2",
    icons: [
      { src: "/icon.svg", type: "image/svg+xml", sizes: "any" },
      { src: "/brand/ventrion-icon-512.png", type: "image/png", sizes: "512x512" },
    ],
  };
}
