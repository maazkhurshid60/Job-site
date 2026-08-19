import type { MetadataRoute } from "next";
import { SITE_NAME } from "@/lib/seo";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${SITE_NAME} — Engineering, Civil & DOT Recruiting Agency`,
    short_name: SITE_NAME,
    description:
      "Browse open engineering, civil and DOT roles, or refer candidates and earn a commission on every placement.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#123173",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
