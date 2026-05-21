import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getCommunityFeed } from "@/lib/community";
import {
  resolveCommunityPostPayload,
  type CommunityPostRequestBody,
} from "@/lib/community-post-payload";
import { communityPosts } from "@/lib/schema";
import {
  createUniqueCommunitySlug,
  type CommunitySortMode,
} from "@/lib/community-shared";

export const revalidate = 60;

export async function GET(req: NextRequest) {
  const sortParam = req.nextUrl.searchParams.get("sort");
  const limitParam = Number(req.nextUrl.searchParams.get("limit") ?? "24");
  const sort: CommunitySortMode = sortParam === "hot" ? "hot" : "new";
  const limit = Number.isFinite(limitParam)
    ? Math.min(48, Math.max(1, limitParam))
    : 24;

  try {
    const posts = await getCommunityFeed(sort, limit);
    return NextResponse.json(
      { posts },
      {
        headers: {
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
        },
      },
    );
  } catch (err) {
    console.error("[community posts GET]", err);
    return NextResponse.json(
      { error: "Failed to load community posts." },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = (await req.json()) as CommunityPostRequestBody;
    const normalized = resolveCommunityPostPayload(body);

    if (!normalized.ok) {
      return NextResponse.json({ error: normalized.error }, { status: 400 });
    }

    const { values } = normalized;

    const existingSlugs = await db
      .select({ slug: communityPosts.slug })
      .from(communityPosts);
    const slug = createUniqueCommunitySlug(
      values.title,
      existingSlugs.map((item) => item.slug),
    );

    const [post] = await db
      .insert(communityPosts)
      .values({
        authorId: session.user.id,
        slug,
        kind: values.kind,
        sourceType: values.sourceType,
        title: values.title,
        prompt: values.prompt,
        description: values.description,
        fen: values.fen,
        pgn: values.pgn,
        orientation: values.orientation,
        openingName: values.openingName,
        tags: values.tags,
        collectionKey: values.collectionKey,
        visibility: values.visibility,
        previewMode: values.previewMode,
      })
      .returning({ id: communityPosts.id, slug: communityPosts.slug });

    return NextResponse.json({ ok: true, id: post.id, slug: post.slug });
  } catch (err) {
    console.error("[community posts POST]", err);
    return NextResponse.json(
      { error: "Failed to create post." },
      { status: 500 },
    );
  }
}
