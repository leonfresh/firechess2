import type { MetadataRoute } from "next";
import { getAllPosts } from "@/lib/blog";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://firechess.com";

  const blogPosts = getAllPosts().map((post) => ({
    url: `${base}/blog/${post.slug}`,
    lastModified: new Date(post.date),
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  return [
    // Core pages
    { url: base, lastModified: new Date(), changeFrequency: "weekly", priority: 1 },
    { url: `${base}/pricing`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.9 },

    // Feature pages
    { url: `${base}/analyze`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.8 },
    { url: `${base}/train`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.8 },
    { url: `${base}/openings`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.8 },
    { url: `${base}/dungeon`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 },
    { url: `${base}/guess`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 },
    { url: `${base}/roast`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 },
    { url: `${base}/leaderboard`, lastModified: new Date(), changeFrequency: "daily", priority: 0.7 },
    { url: `${base}/shop`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },

    // Content pages
    { url: `${base}/blog`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.8 },
    ...blogPosts,
    { url: `${base}/about`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 },
    { url: `${base}/changelog`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.5 },
    { url: `${base}/feedback`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.3 },

    // Legal
    { url: `${base}/privacy`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.2 },
    { url: `${base}/terms`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.2 },
  ];
}
