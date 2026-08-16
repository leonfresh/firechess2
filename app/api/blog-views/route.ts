/**
 * GET  /api/blog-views?slugs=a,b,c — batch fetch view counts
 * POST /api/blog-views { slug }    — increment view count, returns new count
 *
 * Backed by the blog_post_view table (Neon via Drizzle). Fails soft: if the
 * DB is unreachable, GET returns zero counts and POST returns ok:false so
 * the UI just hides the counter instead of erroring the page.
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { blogPostViews } from "@/lib/schema";
import { inArray, eq, sql } from "drizzle-orm";

const SLUG_RE = /^[a-z0-9][a-z0-9-]{0,120}$/;

// Cheap per-IP throttle on increments: 1 view per slug per IP per 10 min.
// Resets on cold start — fine at this scale, stops refresh-spam inflation.
const seen = new Map<string, number>();
const THROTTLE_MS = 10 * 60 * 1000;

export async function GET(req: NextRequest) {
  const slugsParam = req.nextUrl.searchParams.get("slugs") ?? "";
  const slugs = slugsParam
    .split(",")
    .map((s) => s.trim())
    .filter((s) => SLUG_RE.test(s))
    .slice(0, 100);

  if (slugs.length === 0) {
    return NextResponse.json({ views: {} });
  }

  try {
    const rows = await db
      .select({ slug: blogPostViews.slug, views: blogPostViews.views })
      .from(blogPostViews)
      .where(inArray(blogPostViews.slug, slugs));

    const views: Record<string, number> = {};
    for (const s of slugs) views[s] = 0;
    for (const r of rows) views[r.slug] = r.views;
    return NextResponse.json({ views });
  } catch {
    return NextResponse.json({ views: {} }, { status: 200 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as { slug?: string };
    const slug = body.slug ?? "";
    if (!SLUG_RE.test(slug)) {
      return NextResponse.json({ ok: false }, { status: 400 });
    }

    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      req.headers.get("x-real-ip") ??
      "unknown";
    const key = `${ip}:${slug}`;
    const last = seen.get(key);
    const now = Date.now();
    if (last && now - last < THROTTLE_MS) {
      // Throttled — return current count without incrementing
      const rows = await db
        .select({ views: blogPostViews.views })
        .from(blogPostViews)
        .where(eq(blogPostViews.slug, slug));
      return NextResponse.json({ ok: true, views: rows[0]?.views ?? 0, throttled: true });
    }
    seen.set(key, now);
    if (seen.size > 10_000) seen.clear(); // bound memory

    const rows = await db
      .insert(blogPostViews)
      .values({ slug, views: 1, lastViewedAt: new Date() })
      .onConflictDoUpdate({
        target: blogPostViews.slug,
        set: {
          views: sql`${blogPostViews.views} + 1`,
          lastViewedAt: new Date(),
        },
      })
      .returning({ views: blogPostViews.views });

    return NextResponse.json({ ok: true, views: rows[0]?.views ?? 1 });
  } catch {
    return NextResponse.json({ ok: false }, { status: 200 });
  }
}
