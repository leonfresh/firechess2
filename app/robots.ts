import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          "/auth/",
          "/dashboard",
          "/dashboard/",
          "/account",
          "/account/",
          "/admin/",
          "/support/",
        ],
      },
      {
        // Block AI scrapers from content farming
        userAgent: ["GPTBot", "ChatGPT-User", "CCBot", "Google-Extended"],
        disallow: ["/"],
      },
    ],
    sitemap: "https://firechess.com/sitemap.xml",
  };
}
