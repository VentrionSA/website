import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Ventrion — Connecting markets. Moving opportunity.",
    short_name: "Ventrion",
    description: "An independent trade facilitation company.",
    start_url: "/",
    display: "standalone",
    background_color: "#f4f0e6",
    theme_color: "#f4f0e6",
    icons: [
      { src: "/icon.svg", type: "image/svg+xml", sizes: "any" },
      { src: "/brand/ventrion-icon-512.png", type: "image/png", sizes: "512x512" },
    ],
  };
}
