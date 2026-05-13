import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import {
  getCommunityComments,
  refreshCommunityPostStats,
} from "@/lib/community";
import { db } from "@/lib/db";
import { communityComments, communityPosts } from "@/lib/schema";

async function getPostFromSlug(slug: string) {
  const [post] = await db
    .select({ id: communityPosts.id })
    .from(communityPosts)
    .where(eq(communityPosts.slug, slug))
    .limit(1);

  return post;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;

  try {
    const post = await getPostFromSlug(slug);
    if (!post) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const comments = await getCommunityComments(post.id);
    return NextResponse.json({ comments });
  } catch (err) {
    console.error("[community comments GET]", err);
    return NextResponse.json(
      { error: "Failed to load comments." },
      { status: 500 },
    );
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { slug } = await params;

  try {
    const post = await getPostFromSlug(slug);
    if (!post) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const body = (await req.json()) as { body?: string; parentId?: string };
    const message = body.body?.trim() ?? "";
    if (message.length < 2) {
      return NextResponse.json(
        { error: "Comment must be at least 2 characters." },
        { status: 400 },
      );
    }

    await db.insert(communityComments).values({
      postId: post.id,
      authorId: session.user.id,
      parentId: body.parentId?.trim() || null,
      body: message,
    });

    const stats = await refreshCommunityPostStats(post.id);
    const comments = await getCommunityComments(post.id);
    const comment = comments.at(-1) ?? null;

    return NextResponse.json({ ok: true, comment, stats });
  } catch (err) {
    console.error("[community comments POST]", err);
    return NextResponse.json(
      { error: "Failed to create comment." },
      { status: 500 },
    );
  }
}
