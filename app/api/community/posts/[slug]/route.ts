import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { isAdmin } from "@/lib/admin";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  resolveCommunityPostPayload,
  type CommunityPostRequestBody,
} from "@/lib/community-post-payload";
import { communityPosts } from "@/lib/schema";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const session = await auth();

  if (!session?.user?.id || !(await isAdmin(session.user.id))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { slug } = await params;

  try {
    const [post] = await db
      .select({
        id: communityPosts.id,
        slug: communityPosts.slug,
        authorId: communityPosts.authorId,
      })
      .from(communityPosts)
      .where(eq(communityPosts.slug, slug))
      .limit(1);

    if (!post) {
      return NextResponse.json({ error: "Post not found." }, { status: 404 });
    }

    const body = (await req.json()) as CommunityPostRequestBody;
    const normalized = resolveCommunityPostPayload(body);

    if (!normalized.ok) {
      return NextResponse.json({ error: normalized.error }, { status: 400 });
    }

    const { values } = normalized;

    await db
      .update(communityPosts)
      .set({
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
        updatedAt: new Date(),
      })
      .where(eq(communityPosts.id, post.id));

    revalidatePath("/");
    revalidatePath("/community");
    revalidatePath(`/community/${post.slug}`);
    revalidatePath(`/community/profile/${post.authorId}`);

    return NextResponse.json({ ok: true, slug: post.slug });
  } catch (err) {
    console.error("[community posts PATCH]", err);
    return NextResponse.json(
      { error: "Failed to update post." },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const session = await auth();

  if (!session?.user?.id || !(await isAdmin(session.user.id))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { slug } = await params;

  try {
    const [post] = await db
      .select({
        id: communityPosts.id,
        slug: communityPosts.slug,
        authorId: communityPosts.authorId,
      })
      .from(communityPosts)
      .where(eq(communityPosts.slug, slug))
      .limit(1);

    if (!post) {
      return NextResponse.json({ error: "Post not found." }, { status: 404 });
    }

    await db.delete(communityPosts).where(eq(communityPosts.id, post.id));

    revalidatePath("/");
    revalidatePath("/community");
    revalidatePath(`/community/${post.slug}`);
    revalidatePath(`/community/profile/${post.authorId}`);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[community posts DELETE]", err);
    return NextResponse.json(
      { error: "Failed to delete post." },
      { status: 500 },
    );
  }
}
