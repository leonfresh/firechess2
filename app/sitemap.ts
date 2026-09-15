import type { MetadataRoute } from "next";
import { getAllPosts, getAvailableLocales, getSupportedLocales, type Locale } from "@/lib/blog";
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
  const base = "https://www.firechess.com";

  const blogPosts = getAllPosts().map((post) => ({
    url: `${base}/blog/${post.slug}`,
    lastModified: new Date(post.date),
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  const openingPages = OPENING_GUIDES.map((guide) => ({
    url: `${base}/openings/${guide.id}`,
    changeFrequency: "monthly" as const,
    priority: 0.75,
  }));

  const tacticPages = TACTIC_MOTIFS.map((t) => ({
    url: `${base}/tactics/${t.id}`,
    changeFrequency: "monthly" as const,
    priority: 0.75,
  }));

  const endgamePages = ENDGAME_GUIDES.map((g) => ({
    url: `${base}/endgames/${g.id}`,
    changeFrequency: "monthly" as const,
    priority: 0.75,
  }));

  const positionPages = POSITIONAL_MOTIFS.map((m) => ({
    url: `${base}/positions/${m.id}`,
    changeFrequency: "monthly" as const,
    priority: 0.75,
  }));

  const timeControlPages = TIME_CONTROLS.map((tc) => ({
    url: `${base}/time-controls/${tc.id}`,
    changeFrequency: "monthly" as const,
    priority: 0.75,
  }));

  const mistakePages = CHESS_MISTAKES.map((m) => ({
    url: `${base}/mistakes/${m.id}`,
    changeFrequency: "monthly" as const,
    priority: 0.75,
  }));

  const gamePages = FAMOUS_GAMES.map((g) => ({
    url: `${base}/games/${g.id}`,
    changeFrequency: "monthly" as const,
    priority: 0.8,
  }));

  const playerPages = GM_PROFILES.map((gm) => ({
    url: `${base}/players/${gm.id}`,
    changeFrequency: "monthly" as const,
    priority: 0.75,
  }));

  const glossaryPages = GLOSSARY_TERMS.map((t) => ({
    url: `${base}/glossary/${t.id}`,
    changeFrequency: "monthly" as const,
    priority: 0.75,
  }));

  const ratingPages = RATING_GUIDES.map((g) => ({
    url: `${base}/improve/${g.id}`,
    changeFrequency: "monthly" as const,
    priority: 0.8,
  }));

  return [
    // Core pages
    {
      url: base,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${base}/pricing`,
      changeFrequency: "monthly",
      priority: 0.9,
    },

    // Feature pages
    {
      url: `${base}/analyze`,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${base}/train`,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${base}/openings`,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${base}/openings/beginner`,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${base}/openings/intermediate`,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${base}/openings/advanced`,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    ...openingPages,
    {
      url: `${base}/tactics`,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    ...tacticPages,
    {
      url: `${base}/endgames`,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    ...endgamePages,
    {
      url: `${base}/positions`,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    ...positionPages,
    {
      url: `${base}/time-controls`,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    ...timeControlPages,
    {
      url: `${base}/mistakes`,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    ...mistakePages,
    {
      url: `${base}/improve`,
      changeFrequency: "monthly",
      priority: 0.85,
    },
    ...ratingPages,
    {
      url: `${base}/games`,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    ...gamePages,
    {
      url: `${base}/players`,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    ...playerPages,
    {
      url: `${base}/glossary`,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    ...glossaryPages,
    {
      url: `${base}/chaos`,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${base}/sparring`,
      changeFrequency: "monthly",
      priority: 0.75,
    },
    {
      url: `${base}/assist`,
      changeFrequency: "monthly",
      priority: 0.75,
    },
    {
      url: `${base}/escape`,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${base}/coaches`,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${base}/youtubers`,
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${base}/support`,
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${base}/dungeon`,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${base}/guess`,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${base}/roast`,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${base}/leaderboard`,
      changeFrequency: "daily",
      priority: 0.7,
    },
    {
      url: `${base}/shop`,
      changeFrequency: "monthly",
      priority: 0.5,
    },

    // Content pages
    {
      url: `${base}/blog`,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    ...blogPosts,

    // Translated blog posts
    ...getAllPosts()
      .flatMap((post) => {
        const available = getAvailableLocales(post.slug);
        return available
          .filter((loc) => loc !== "en")
          .map((loc) => ({
            url: `${base}/${loc}/blog/${post.slug}`,
            lastModified: new Date(post.date),
            changeFrequency: "monthly" as const,
            priority: 0.5,
          }));
      }),

    {
      url: `${base}/about`,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${base}/changelog`,
      changeFrequency: "weekly",
      priority: 0.5,
    },
    {
      url: `${base}/feedback`,
      changeFrequency: "yearly",
      priority: 0.3,
    },

    // Legal
    {
      url: `${base}/privacy`,
      changeFrequency: "yearly",
      priority: 0.2,
    },
    {
      url: `${base}/terms`,
      changeFrequency: "yearly",
      priority: 0.2,
    },
  ];
}
