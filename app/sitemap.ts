import type { MetadataRoute } from "next";
import { getAllPosts } from "@/lib/blog";
import { OPENING_GUIDES } from "@/lib/opening-guides";
import { TACTIC_MOTIFS } from "@/lib/tactics-motifs";
import { ENDGAME_GUIDES } from "@/lib/endgame-guides";
import { POSITIONAL_MOTIFS } from "@/lib/positional-motifs";
import { TIME_CONTROLS } from "@/lib/time-controls";
import { CHESS_MISTAKES } from "@/lib/chess-mistakes";
import { RATING_GUIDES } from "@/lib/rating-guides";
import { FAMOUS_GAMES } from "@/lib/famous-games";
import { GM_PROFILES } from "@/lib/gm-profiles";
import { GLOSSARY_TERMS } from "@/lib/chess-glossary";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://firechess.com";

  const blogPosts = getAllPosts().map((post) => ({
    url: `${base}/blog/${post.slug}`,
    lastModified: new Date(post.date),
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  const openingPages = OPENING_GUIDES.map((guide) => ({
    url: `${base}/openings/${guide.id}`,
    lastModified: new Date(),
    changeFrequency: "monthly" as const,
    priority: 0.75,
  }));

  const tacticPages = TACTIC_MOTIFS.map((t) => ({
    url: `${base}/tactics/${t.id}`,
    lastModified: new Date(),
    changeFrequency: "monthly" as const,
    priority: 0.75,
  }));

  const endgamePages = ENDGAME_GUIDES.map((g) => ({
    url: `${base}/endgames/${g.id}`,
    lastModified: new Date(),
    changeFrequency: "monthly" as const,
    priority: 0.75,
  }));

  const positionPages = POSITIONAL_MOTIFS.map((m) => ({
    url: `${base}/positions/${m.id}`,
    lastModified: new Date(),
    changeFrequency: "monthly" as const,
    priority: 0.75,
  }));

  const timeControlPages = TIME_CONTROLS.map((tc) => ({
    url: `${base}/time-controls/${tc.id}`,
    lastModified: new Date(),
    changeFrequency: "monthly" as const,
    priority: 0.75,
  }));

  const mistakePages = CHESS_MISTAKES.map((m) => ({
    url: `${base}/mistakes/${m.id}`,
    lastModified: new Date(),
    changeFrequency: "monthly" as const,
    priority: 0.75,
  }));

  const gamePages = FAMOUS_GAMES.map((g) => ({
    url: `${base}/games/${g.id}`,
    lastModified: new Date(),
    changeFrequency: "monthly" as const,
    priority: 0.8,
  }));

  const playerPages = GM_PROFILES.map((gm) => ({
    url: `${base}/players/${gm.id}`,
    lastModified: new Date(),
    changeFrequency: "monthly" as const,
    priority: 0.75,
  }));

  const glossaryPages = GLOSSARY_TERMS.map((t) => ({
    url: `${base}/glossary/${t.id}`,
    lastModified: new Date(),
    changeFrequency: "monthly" as const,
    priority: 0.75,
  }));

  const ratingPages = RATING_GUIDES.map((g) => ({
    url: `${base}/improve/${g.id}`,
    lastModified: new Date(),
    changeFrequency: "monthly" as const,
    priority: 0.8,
  }));

  return [
    // Core pages
    {
      url: base,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${base}/pricing`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.9,
    },

    // Feature pages
    {
      url: `${base}/analyze`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${base}/train`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${base}/openings`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${base}/openings/beginner`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${base}/openings/intermediate`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${base}/openings/advanced`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    ...openingPages,
    {
      url: `${base}/tactics`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    ...tacticPages,
    {
      url: `${base}/endgames`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    ...endgamePages,
    {
      url: `${base}/positions`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    ...positionPages,
    {
      url: `${base}/time-controls`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    ...timeControlPages,
    {
      url: `${base}/mistakes`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    ...mistakePages,
    {
      url: `${base}/improve`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.85,
    },
    ...ratingPages,
    {
      url: `${base}/games`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    ...gamePages,
    {
      url: `${base}/players`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    ...playerPages,
    {
      url: `${base}/glossary`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    ...glossaryPages,
    {
      url: `${base}/chaos`,`
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${base}/sparring`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.75,
    },
    {
      url: `${base}/escape`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${base}/coaches`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${base}/youtubers`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${base}/support`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${base}/dungeon`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${base}/guess`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${base}/roast`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${base}/leaderboard`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.7,
    },
    {
      url: `${base}/shop`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },

    // Content pages
    {
      url: `${base}/blog`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    ...blogPosts,
    {
      url: `${base}/about`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${base}/changelog`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.5,
    },
    {
      url: `${base}/feedback`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.3,
    },

    // Legal
    {
      url: `${base}/privacy`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.2,
    },
    {
      url: `${base}/terms`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.2,
    },
  ];
}
