import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Ventrion — Connecting Global Markets",
    short_name: "Ventrion",
    description: "The meeting point between buyers and sellers.",
    start_url: "/",
    display: "standalone",
    background_color: "#f3eee4",
    theme_color: "#f3eee4",
    icons: [
      { src: "/icon.svg", type: "image/svg+xml", sizes: "any" },
      { src: "/brand/ventrion-icon-512.png", type: "image/png", sizes: "512x512" },
    ],
  };
}
