import { and, asc, desc, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  buildUserDisplayName,
  computeCommunityHotScore,
  type CommunityReactionKind,
  type CommunitySortMode,
} from "@/lib/community-shared";
import {
  communityComments,
  communityPosts,
  communityReactions,
  users,
} from "@/lib/schema";

export type CommunityPostCard = Awaited<
  ReturnType<typeof getCommunityFeed>
>[number];
export type CommunityPostDetail = Awaited<
  ReturnType<typeof getCommunityPostBySlug>
>;
export type CommunityCommentItem = Awaited<
  ReturnType<typeof getCommunityComments>
>[number];

export async function getCommunityFeed(sort: CommunitySortMode, limit = 24) {
  const rows = await db
    .select({
      id: communityPosts.id,
      slug: communityPosts.slug,
      kind: communityPosts.kind,
      sourceType: communityPosts.sourceType,
      title: communityPosts.title,
      prompt: communityPosts.prompt,
      description: communityPosts.description,
      fen: communityPosts.fen,
      pgn: communityPosts.pgn,
      orientation: communityPosts.orientation,
      openingName: communityPosts.openingName,
      tags: communityPosts.tags,
      collectionKey: communityPosts.collectionKey,
      previewMode: communityPosts.previewMode,
      likesCount: communityPosts.likesCount,
      commentsCount: communityPosts.commentsCount,
      savesCount: communityPosts.savesCount,
      hotScore: communityPosts.hotScore,
      createdAt: communityPosts.createdAt,
      authorId: users.id,
      authorName: users.name,
      authorEmail: users.email,
      authorImage: users.image,
      authorChaosUsername: users.chaosUsername,
    })
    .from(communityPosts)
    .leftJoin(users, eq(communityPosts.authorId, users.id))
    .where(eq(communityPosts.visibility, "public"))
    .orderBy(
      sort === "hot"
        ? desc(communityPosts.hotScore)
        : desc(communityPosts.createdAt),
      desc(communityPosts.createdAt),
    )
    .limit(limit);

  return rows.map((row) => ({
    ...row,
    authorDisplayName: buildUserDisplayName({
      name: row.authorName,
      chaosUsername: row.authorChaosUsername,
      email: row.authorEmail,
    }),
  }));
}

export async function getCommunityPostBySlug(
  slug: string,
  viewerId?: string | null,
) {
  const rows = await db
    .select({
      id: communityPosts.id,
      slug: communityPosts.slug,
      kind: communityPosts.kind,
      sourceType: communityPosts.sourceType,
      title: communityPosts.title,
      prompt: communityPosts.prompt,
      description: communityPosts.description,
      fen: communityPosts.fen,
      pgn: communityPosts.pgn,
      orientation: communityPosts.orientation,
      openingName: communityPosts.openingName,
      tags: communityPosts.tags,
      collectionKey: communityPosts.collectionKey,
      visibility: communityPosts.visibility,
      previewMode: communityPosts.previewMode,
      likesCount: communityPosts.likesCount,
      commentsCount: communityPosts.commentsCount,
      savesCount: communityPosts.savesCount,
      hotScore: communityPosts.hotScore,
      createdAt: communityPosts.createdAt,
      authorId: users.id,
      authorName: users.name,
      authorEmail: users.email,
      authorImage: users.image,
      authorChaosUsername: users.chaosUsername,
    })
    .from(communityPosts)
    .leftJoin(users, eq(communityPosts.authorId, users.id))
    .where(eq(communityPosts.slug, slug))
    .limit(1);

  const row = rows[0];
  if (!row) return null;

  let viewerReactions: CommunityReactionKind[] = [];
  if (viewerId) {
    const reactions = await db
      .select({ kind: communityReactions.kind })
      .from(communityReactions)
      .where(
        and(
          eq(communityReactions.postId, row.id),
          eq(communityReactions.userId, viewerId),
        ),
      );
    viewerReactions = reactions.map((reaction) => reaction.kind);
  }

  return {
    ...row,
    viewerReactions,
    authorDisplayName: buildUserDisplayName({
      name: row.authorName,
      chaosUsername: row.authorChaosUsername,
      email: row.authorEmail,
    }),
  };
}

export async function getCommunityComments(postId: string) {
  const rows = await db
    .select({
      id: communityComments.id,
      postId: communityComments.postId,
      authorId: users.id,
      authorName: users.name,
      authorEmail: users.email,
      authorImage: users.image,
      authorChaosUsername: users.chaosUsername,
      body: communityComments.body,
      parentId: communityComments.parentId,
      createdAt: communityComments.createdAt,
    })
    .from(communityComments)
    .leftJoin(users, eq(communityComments.authorId, users.id))
    .where(eq(communityComments.postId, postId))
    .orderBy(asc(communityComments.createdAt));

  return rows.map((row) => ({
    ...row,
    authorDisplayName: buildUserDisplayName({
      name: row.authorName,
      chaosUsername: row.authorChaosUsername,
      email: row.authorEmail,
    }),
  }));
}

export async function getCommunityProfile(userId: string) {
  const [profile] = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      image: users.image,
      chaosUsername: users.chaosUsername,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!profile) return null;

  const posts = await db
    .select({
      id: communityPosts.id,
      slug: communityPosts.slug,
      kind: communityPosts.kind,
      sourceType: communityPosts.sourceType,
      title: communityPosts.title,
      prompt: communityPosts.prompt,
      description: communityPosts.description,
      fen: communityPosts.fen,
      pgn: communityPosts.pgn,
      orientation: communityPosts.orientation,
      openingName: communityPosts.openingName,
      tags: communityPosts.tags,
      collectionKey: communityPosts.collectionKey,
      likesCount: communityPosts.likesCount,
      commentsCount: communityPosts.commentsCount,
      savesCount: communityPosts.savesCount,
      createdAt: communityPosts.createdAt,
    })
    .from(communityPosts)
    .where(
      and(
        eq(communityPosts.authorId, userId),
        eq(communityPosts.visibility, "public"),
      ),
    )
    .orderBy(desc(communityPosts.createdAt));

  return {
    profile: {
      ...profile,
      displayName: buildUserDisplayName(profile),
    },
    posts,
  };
}

async function getPostStats(postId: string) {
  const [post] = await db
    .select({ createdAt: communityPosts.createdAt })
    .from(communityPosts)
    .where(eq(communityPosts.id, postId))
    .limit(1);

  if (!post) return null;

  const [likesRow] = await db
    .select({ count: sql<number>`cast(count(*) as int)` })
    .from(communityReactions)
    .where(
      and(
        eq(communityReactions.postId, postId),
        eq(communityReactions.kind, "like"),
      ),
    );

  const [savesRow] = await db
    .select({ count: sql<number>`cast(count(*) as int)` })
    .from(communityReactions)
    .where(
      and(
        eq(communityReactions.postId, postId),
        eq(communityReactions.kind, "save"),
      ),
    );

  const [commentsRow] = await db
    .select({ count: sql<number>`cast(count(*) as int)` })
    .from(communityComments)
    .where(eq(communityComments.postId, postId));

  return {
    createdAt: post.createdAt,
    likesCount: likesRow?.count ?? 0,
    savesCount: savesRow?.count ?? 0,
    commentsCount: commentsRow?.count ?? 0,
  };
}

export async function refreshCommunityPostStats(postId: string) {
  const stats = await getPostStats(postId);
  if (!stats) return null;

  const hotScore = computeCommunityHotScore(stats);

  await db
    .update(communityPosts)
    .set({
      likesCount: stats.likesCount,
      savesCount: stats.savesCount,
      commentsCount: stats.commentsCount,
      hotScore,
      updatedAt: new Date(),
    })
    .where(eq(communityPosts.id, postId));

  return {
    ...stats,
    hotScore,
  };
}
