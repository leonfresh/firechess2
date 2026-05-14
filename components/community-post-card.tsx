import Link from "next/link";
import { CommunityPostAdminMenu } from "@/components/community-post-admin-menu";
import { CommunityBoardPreview } from "@/components/community-board-preview";
import { CommunityPuzzleInlinePlayer } from "@/components/community-puzzle-inline-player";
import type { CommunityPostCard as CommunityPostCardData } from "@/lib/community";
import {
  COMMUNITY_KIND_LABELS,
  extractCommunityPuzzleData,
} from "@/lib/community-shared";

function getCommunityCardTheme(kind: string) {
  switch (kind) {
    case "opening":
      return {
        badge: "border-cyan-400/25 bg-cyan-400/12 text-cyan-100",
        boardGlow:
          "bg-[radial-gradient(circle_at_bottom_right,rgba(34,211,238,0.16),transparent_38%)]",
      };
    case "puzzle":
      return {
        badge: "border-fuchsia-400/25 bg-fuchsia-400/12 text-fuchsia-100",
        boardGlow:
          "bg-[radial-gradient(circle_at_bottom_right,rgba(217,70,239,0.18),transparent_38%)]",
      };
    default:
      return {
        badge: "border-orange-400/25 bg-orange-400/12 text-orange-100",
        boardGlow:
          "bg-[radial-gradient(circle_at_bottom_right,rgba(249,115,22,0.18),transparent_38%)]",
      };
  }
}

function getDisplayInitial(value: string) {
  return (value.trim()[0] ?? "F").toUpperCase();
}

function formatCreatedAt(value: string | Date | null) {
  if (!value) return "Recently";

  try {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
    }).format(new Date(value));
  } catch {
    return "Recently";
  }
}

function formatSignalCount(value: number) {
  return `${value} signal${value === 1 ? "" : "s"}`;
}

export function CommunityPostCard({ post }: { post: CommunityPostCardData }) {
  const puzzleData =
    post.kind === "puzzle" ? extractCommunityPuzzleData(post.pgn) : null;
  const theme = getCommunityCardTheme(post.kind);
  const createdAt = formatCreatedAt(post.createdAt);
  const totalSignals = post.likesCount + post.commentsCount + post.savesCount;
  const summary = puzzleData
    ? `${puzzleData.solution.length} move${puzzleData.solution.length === 1 ? "" : "s"} • Play inline`
    : post.openingName
      ? `Study anchor • ${post.openingName}`
      : post.prompt || "Open the board to join the discussion.";

  return (
    <article className="group relative h-full overflow-hidden rounded-[2.15rem] bg-[linear-gradient(160deg,rgba(7,12,24,0.86),rgba(10,15,30,0.8)_55%,rgba(15,23,42,0.92))] shadow-[0_28px_70px_-42px_rgba(2,6,23,0.95)] backdrop-blur-sm transition duration-300 hover:-translate-y-1 hover:shadow-[0_36px_100px_-46px_rgba(249,115,22,0.2)]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.06),transparent_30%),radial-gradient(circle_at_85%_0%,rgba(56,189,248,0.1),transparent_36%),radial-gradient(circle_at_bottom_right,rgba(249,115,22,0.1),transparent_32%)] opacity-80" />

      <div className="relative flex h-full flex-col">
        <div className="flex flex-wrap items-start justify-between gap-3 px-5 pt-5">
          <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
            <span className={`rounded-full border px-3 py-1 ${theme.badge}`}>
              {COMMUNITY_KIND_LABELS[post.kind]}
            </span>
          </div>

          <div className="ml-auto flex items-center gap-2">
            <span className="shrink-0 pt-1 text-[11px] font-medium text-slate-500">
              {createdAt}
            </span>
            <CommunityPostAdminMenu slug={post.slug} title={post.title} />
          </div>
        </div>

        <div className="px-5 pt-4">
          <div
            className={`relative rounded-[1.85rem] bg-[linear-gradient(160deg,rgba(255,255,255,0.05),rgba(255,255,255,0.015))] p-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] transition duration-300 group-hover:-translate-y-1 ${
              puzzleData ? "overflow-visible" : "overflow-hidden"
            }`}
          >
            <div
              className={`pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.08),transparent_34%)] ${theme.boardGlow} opacity-90`}
            />
            {puzzleData ? (
              <div className="relative">
                <CommunityPuzzleInlinePlayer
                  fen={post.fen}
                  pgn={post.pgn}
                  orientation={post.orientation ?? "white"}
                  prompt={post.prompt}
                  puzzleData={puzzleData}
                  href={`/community/${post.slug}#play-puzzle`}
                  size={420}
                  showCoordinates={false}
                  showFooterBar={false}
                />
              </div>
            ) : (
              <div className="relative overflow-hidden rounded-[1.3rem]">
                <CommunityBoardPreview
                  fen={post.fen}
                  pgn={post.pgn}
                  orientation={post.orientation ?? "white"}
                  size={420}
                  showCoordinates={false}
                  href={`/community/${post.slug}`}
                />
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-1 flex-col px-5 pb-5 pt-4">
          <Link href={`/community/${post.slug}`} className="min-w-0 flex-1">
            <h3 className="text-[1.12rem] font-bold tracking-tight text-white transition-colors group-hover:text-orange-200">
              {post.title}
            </h3>
            <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-slate-400">
              {summary}
            </p>
          </Link>

          <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-4">
            <div className="flex min-w-0 items-center gap-3">
              {post.authorImage ? (
                <img
                  src={post.authorImage}
                  alt=""
                  className="h-10 w-10 rounded-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-500/15 text-sm font-bold text-orange-200">
                  {getDisplayInitial(post.authorDisplayName)}
                </span>
              )}

              <div className="min-w-0">
                {post.authorId ? (
                  <Link
                    href={`/community/profile/${post.authorId}`}
                    className="block truncate text-sm font-semibold text-white transition-colors hover:text-orange-200"
                  >
                    {post.authorDisplayName}
                  </Link>
                ) : (
                  <p className="truncate text-sm font-semibold text-white">
                    {post.authorDisplayName}
                  </p>
                )}
              </div>
            </div>

            <span className="ml-auto shrink-0 text-[11px] font-semibold text-slate-400">
              {formatSignalCount(totalSignals)}
            </span>
          </div>
        </div>
      </div>
    </article>
  );
}
