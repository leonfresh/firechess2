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
        // Block training-data scrapers (no referral value, pure content farming).
        userAgent: ["GPTBot", "CCBot", "Google-Extended"],
        disallow: ["/"],
      },
      {
        // Allow answer-engine / retrieval bots — these cite us and drive
        // referral traffic (chatgpt.com already refers visitors). This is a
        // zero-outreach discovery channel, so we explicitly opt in.
        userAgent: ["ChatGPT-User", "OAI-SearchBot", "PerplexityBot", "Perplexity-User"],
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
    ],
    sitemap: "https://firechess.com/sitemap.xml",
  };
}
