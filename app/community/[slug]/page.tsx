import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { getCommunityComments, getCommunityPostBySlug } from "@/lib/community";
import {
  COMMUNITY_KIND_LABELS,
  COMMUNITY_SOURCE_LABELS,
  extractCommunityPuzzleData,
  formatCommunityLineMove,
} from "@/lib/community-shared";
import { CommunityBoardPreview } from "@/components/community-board-preview";
import { CommunityPuzzleInlinePlayer } from "@/components/community-puzzle-inline-player";
import { CommunityPostAdminMenu } from "@/components/community-post-admin-menu";
import { CommunityComments } from "@/components/community-comments";
import { CommunityReactionBar } from "@/components/community-reaction-bar";

function prettifyCollectionKey(value: string | null) {
  if (!value) return null;
  return value
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await getCommunityPostBySlug(slug);

  if (!post) {
    return { title: "Community Post | FireChess" };
  }

  return {
    title: `${post.title} | FireChess Community`,
    description: post.prompt,
    openGraph: {
      title: `${post.title} | FireChess Community`,
      description: post.prompt,
      type: "article",
      url: `https://firechess.com/community/${post.slug}`,
    },
    twitter: {
      card: "summary_large_image",
      title: `${post.title} | FireChess Community`,
      description: post.prompt,
    },
  };
}

export default async function CommunityPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const session = await auth();
  const post = await getCommunityPostBySlug(slug, session?.user?.id);

  if (!post) notFound();

  const comments = await getCommunityComments(post.id);
  const collectionLabel = prettifyCollectionKey(post.collectionKey);
  const puzzleData = extractCommunityPuzzleData(post.pgn);

  return (
    <div className="min-h-screen bg-[#030712] text-white">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <nav className="mb-5 flex flex-wrap items-center gap-2 text-xs text-slate-500">
          <Link
            href="/community"
            className="transition-colors hover:text-slate-300"
          >
            Community
          </Link>
          <span>/</span>
          <span className="min-w-0 break-words text-slate-300">
            {post.title}
          </span>
        </nav>

        <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <section className="space-y-6 rounded-[2rem] border border-white/[0.08] bg-white/[0.03] p-5 sm:p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                <span className="rounded-full border border-cyan-500/25 bg-cyan-500/10 px-2.5 py-1 text-cyan-300">
                  {COMMUNITY_KIND_LABELS[post.kind]}
                </span>
                <span>{COMMUNITY_SOURCE_LABELS[post.sourceType]}</span>
                {collectionLabel && (
                  <span className="rounded-full border border-white/[0.08] bg-white/[0.03] px-2.5 py-1 normal-case tracking-normal text-slate-400">
                    {collectionLabel}
                  </span>
                )}
              </div>

              <CommunityPostAdminMenu
                slug={post.slug}
                title={post.title}
                redirectHref="/community"
              />
            </div>

            <div>
              <h1 className="text-3xl font-black tracking-tight text-white sm:text-4xl">
                {post.title}
              </h1>
              <p className="mt-3 max-w-3xl text-base leading-relaxed text-slate-300">
                {post.prompt}
              </p>
            </div>

            {post.kind === "puzzle" && puzzleData ? (
              <section id="play-puzzle" className="space-y-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-bold text-white">
                      Play the Puzzle
                    </h2>
                    <p className="mt-1 text-sm leading-relaxed text-slate-300">
                      Solve it directly on this main board. After each correct
                      move, the opponent reply autoplays and then it becomes
                      your turn again.
                    </p>
                  </div>
                  <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-[11px] font-semibold text-emerald-300">
                    Verified SAN line
                  </span>
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <div className="rounded-2xl border border-white/[0.08] bg-black/20 px-4 py-3 text-sm text-slate-300">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                      {puzzleData.previousMove
                        ? "Last Move Played"
                        : "Puzzle Start"}
                    </p>
                    <p className="mt-1 font-mono text-white">
                      {puzzleData.previousMove
                        ? formatCommunityLineMove(puzzleData.previousMove)
                        : puzzleData.orientation === "white"
                          ? "White to move"
                          : "Black to move"}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-white/[0.08] bg-black/20 px-4 py-3 text-sm text-slate-300">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                      Stored Continuation
                    </p>
                    <p className="mt-1 font-mono text-white">
                      {puzzleData.solution
                        .map((move) => formatCommunityLineMove(move))
                        .join(" · ")}
                    </p>
                  </div>
                </div>

                <CommunityPuzzleInlinePlayer
                  fen={post.fen}
                  pgn={post.pgn}
                  orientation={post.orientation ?? "white"}
                  prompt={post.prompt}
                  puzzleData={puzzleData}
                  defaultPlaying
                  showPlayToggle={false}
                  showFooterBar={false}
                  showCoordinates
                />
              </section>
            ) : (
              <CommunityBoardPreview
                fen={post.fen}
                pgn={post.pgn}
                orientation={post.orientation ?? "white"}
                size={420}
                showCoordinates
              />
            )}

            <CommunityReactionBar
              slug={post.slug}
              initialLikes={post.likesCount}
              initialSaves={post.savesCount}
              initialComments={post.commentsCount}
              initiallyLiked={post.viewerReactions.includes("like")}
              initiallySaved={post.viewerReactions.includes("save")}
            />

            {post.description && (
              <div className="rounded-3xl border border-white/[0.08] bg-black/15 p-5">
                <h2 className="text-lg font-bold text-white">Notes</h2>
                <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-slate-300">
                  {post.description}
                </p>
              </div>
            )}

            <CommunityComments
              slug={post.slug}
              initialComments={comments.map((comment) => ({
                id: comment.id,
                body: comment.body,
                authorId: comment.authorId ?? null,
                authorDisplayName: comment.authorDisplayName,
                authorImage: comment.authorImage,
                createdAt: comment.createdAt,
              }))}
            />
          </section>

          <aside className="space-y-5">
            <section className="rounded-[2rem] border border-white/[0.08] bg-white/[0.03] p-5">
              <h2 className="text-lg font-bold text-white">About the Author</h2>
              <div className="mt-4 flex items-center gap-3">
                {post.authorImage ? (
                  <img
                    src={post.authorImage}
                    alt=""
                    className="h-12 w-12 rounded-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <span className="flex h-12 w-12 items-center justify-center rounded-full bg-orange-500/15 text-lg font-bold text-orange-300">
                    {(post.authorDisplayName[0] ?? "F").toUpperCase()}
                  </span>
                )}
                <div>
                  <p className="font-semibold text-white">
                    {post.authorDisplayName}
                  </p>
                  {post.authorId && (
                    <Link
                      href={`/community/profile/${post.authorId}`}
                      className="text-sm text-cyan-300 transition-colors hover:text-cyan-200"
                    >
                      Open public profile →
                    </Link>
                  )}
                </div>
              </div>
            </section>

            <section className="rounded-[2rem] border border-white/[0.08] bg-white/[0.03] p-5 text-sm text-slate-300">
              <h2 className="text-lg font-bold text-white">Post Details</h2>
              <div className="mt-4 space-y-2">
                <p>
                  <span className="text-slate-500">Kind:</span>{" "}
                  {COMMUNITY_KIND_LABELS[post.kind]}
                </p>
                <p>
                  <span className="text-slate-500">Source:</span>{" "}
                  {COMMUNITY_SOURCE_LABELS[post.sourceType]}
                </p>
                {post.openingName && (
                  <p>
                    <span className="text-slate-500">Opening:</span>{" "}
                    {post.openingName}
                  </p>
                )}
                <p>
                  <span className="text-slate-500">Created:</span>{" "}
                  {post.createdAt
                    ? new Date(post.createdAt).toLocaleDateString("en-US", {
                        month: "long",
                        day: "numeric",
                        year: "numeric",
                      })
                    : "Recently"}
                </p>
              </div>
              {post.tags.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {post.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full bg-white/[0.04] px-2.5 py-1 text-xs text-slate-400"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </section>

            <section className="rounded-[2rem] border border-white/[0.08] bg-white/[0.03] p-5 text-sm text-slate-300">
              <h2 className="text-lg font-bold text-white">Next Steps</h2>
              <ul className="mt-4 space-y-2 leading-relaxed text-slate-400">
                <li>
                  Save the post if you want it to show up in your own study loop
                  later.
                </li>
                <li>
                  Open the author profile to review this post as part of their
                  public flashcard deck.
                </li>
                <li>
                  Use the board workbench to create your own position, opening,
                  or puzzle post.
                </li>
              </ul>
              <Link
                href="/board"
                className="mt-4 inline-flex rounded-full bg-gradient-to-r from-orange-500 to-amber-500 px-4 py-2 font-semibold text-white transition hover:brightness-110"
              >
                Open Board Workbench
              </Link>
            </section>
          </aside>
        </div>
      </div>
    </div>
  );
}
