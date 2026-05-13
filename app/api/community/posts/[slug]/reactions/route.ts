import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import {
  getCommunityPostBySlug,
  refreshCommunityPostStats,
} from "@/lib/community";
import { db } from "@/lib/db";
import { communityReactions } from "@/lib/schema";
import type { CommunityReactionKind } from "@/lib/community-shared";

const VALID_REACTIONS = new Set<CommunityReactionKind>(["like", "save"]);

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
    const post = await getCommunityPostBySlug(slug, session.user.id);
    if (!post) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const body = (await req.json()) as { kind?: CommunityReactionKind };
    const kind = VALID_REACTIONS.has(body.kind ?? "like")
      ? (body.kind as CommunityReactionKind)
      : null;

    if (!kind) {
      return NextResponse.json(
        { error: "Invalid reaction kind." },
        { status: 400 },
      );
    }

    const [existing] = await db
      .select({ id: communityReactions.id })
      .from(communityReactions)
      .where(
        and(
          eq(communityReactions.postId, post.id),
          eq(communityReactions.userId, session.user.id),
          eq(communityReactions.kind, kind),
        ),
      )
      .limit(1);

    let active = false;
    if (existing) {
      await db
        .delete(communityReactions)
        .where(eq(communityReactions.id, existing.id));
    } else {
      await db.insert(communityReactions).values({
        postId: post.id,
        userId: session.user.id,
        kind,
      });
      active = true;
    }

    const stats = await refreshCommunityPostStats(post.id);

    return NextResponse.json({ ok: true, active, kind, stats });
  } catch (err) {
    console.error("[community reactions POST]", err);
    return NextResponse.json(
      { error: "Failed to update reaction." },
      { status: 500 },
    );
  }
}
