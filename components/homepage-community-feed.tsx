"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { CommunityBoardPreview } from "@/components/community-board-preview";
import { CommunityPuzzleInlinePlayer } from "@/components/community-puzzle-inline-player";
import type { CommunityPostCard as CommunityPostCardData } from "@/lib/community";
import {
  COMMUNITY_CATEGORY_OPTIONS,
  filterCommunityPostsByCategory,
  type CommunityCategoryId,
} from "@/lib/community-categories";
import {
  COMMUNITY_KIND_LABELS,
  extractCommunityPuzzleData,
  type CommunitySortMode,
} from "@/lib/community-shared";

type FeedState = {
  posts: CommunityPostCardData[];
  loading: boolean;
  error: string | null;
};

const HOMEPAGE_FETCH_LIMIT = 18;
const HOMEPAGE_VISIBLE_LIMIT = 6;

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

function getCommunityCardTheme(kind: string) {
  switch (kind) {
    case "opening":
      return {
        badge: "border-cyan-400/25 bg-cyan-400/12 text-cyan-100",
        boardGlow:
          "bg-[radial-gradient(circle_at_bottom_right,rgba(34,211,238,0.16),transparent_38%)]",
        callout: "border-cyan-400/18 bg-cyan-400/[0.08] text-cyan-50",
      };
    case "puzzle":
      return {
        badge: "border-fuchsia-400/25 bg-fuchsia-400/12 text-fuchsia-100",
        boardGlow:
          "bg-[radial-gradient(circle_at_bottom_right,rgba(217,70,239,0.18),transparent_38%)]",
        callout: "border-fuchsia-400/18 bg-fuchsia-400/[0.08] text-fuchsia-50",
      };
    default:
      return {
        badge: "border-orange-400/25 bg-orange-400/12 text-orange-100",
        boardGlow:
          "bg-[radial-gradient(circle_at_bottom_right,rgba(249,115,22,0.18),transparent_38%)]",
        callout: "border-orange-400/18 bg-orange-400/[0.08] text-orange-50",
      };
  }
}

function getDisplayInitial(value: string) {
  return (value.trim()[0] ?? "F").toUpperCase();
}

function formatSignalCount(value: number) {
  return `${value} signal${value === 1 ? "" : "s"}`;
}

function buildCommunityHref(
  sort: CommunitySortMode,
  category: CommunityCategoryId,
) {
  const query = new URLSearchParams();

  if (sort !== "new") {
    query.set("sort", sort);
  }

  if (category !== "all") {
    query.set("category", category);
  }

  const search = query.toString();
  return search ? `/community?${search}` : "/community";
}

export function HomepageCommunityFeed() {
  const [state, setState] = useState<FeedState>({
    posts: [],
    loading: true,
    error: null,
  });
  const [sort, setSort] = useState<CommunitySortMode>("hot");
  const [category, setCategory] = useState<CommunityCategoryId>("all");

  useEffect(() => {
    let cancelled = false;

    setState((current) => ({
      ...current,
      loading: true,
      error: null,
    }));

    async function loadPosts() {
      try {
        const res = await fetch(
          `/api/community/posts?sort=${sort}&limit=${HOMEPAGE_FETCH_LIMIT}`,
          {
            cache: "no-store",
          },
        );

        if (!res.ok) {
          throw new Error("Failed to load community posts.");
        }

        const data = (await res.json()) as { posts?: CommunityPostCardData[] };
        if (cancelled) return;

        setState({
          posts: Array.isArray(data.posts) ? data.posts : [],
          loading: false,
          error: null,
        });
      } catch (error) {
        if (cancelled) return;

        setState((current) => ({
          posts: current.posts,
          loading: false,
          error:
            error instanceof Error
              ? error.message
              : "Failed to load community posts.",
        }));
      }
    }

    loadPosts();
    return () => {
      cancelled = true;
    };
  }, [sort]);

  const categoryCounts = useMemo(
    () =>
      COMMUNITY_CATEGORY_OPTIONS.map((option) => ({
        ...option,
        count: filterCommunityPostsByCategory(state.posts, option.id).length,
      })),
    [state.posts],
  );

  const activeCategory =
    categoryCounts.find((option) => option.id === category) ??
    categoryCounts[0];

  const filteredPosts = useMemo(
    () => filterCommunityPostsByCategory(state.posts, category),
    [category, state.posts],
  );

  const visiblePosts = useMemo(
    () => filteredPosts.slice(0, HOMEPAGE_VISIBLE_LIMIT),
    [filteredPosts],
  );

  if (state.loading && state.posts.length === 0) {
    return (
      <div className="relative px-1 py-2 sm:py-3">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.08),transparent_34%),radial-gradient(circle_at_top_right,rgba(249,115,22,0.07),transparent_28%),radial-gradient(circle_at_bottom,rgba(15,23,42,0.42),transparent_44%)]" />

        <div className="relative animate-pulse space-y-6">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
            <div className="space-y-3">
              <div className="h-4 w-28 rounded-full bg-white/[0.07]" />
              <div className="h-7 w-80 max-w-[80%] rounded bg-white/[0.09]" />
              <div className="h-4 w-[28rem] max-w-[90%] rounded bg-white/[0.05]" />
            </div>
            <div className="space-y-3">
              <div className="h-11 w-40 rounded-xl bg-white/[0.06]" />
              <div className="h-4 w-44 rounded bg-white/[0.05]" />
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {Array.from({ length: 5 }).map((_, index) => (
              <div
                key={index}
                className="h-10 w-28 rounded-full bg-white/[0.05]"
              />
            ))}
          </div>

          <div
            className="grid gap-4"
            style={{
              gridTemplateColumns:
                "repeat(auto-fill, minmax(min(100%, 21rem), 1fr))",
            }}
          >
            {Array.from({ length: 6 }).map((_, index) => (
              <div
                key={index}
                className="overflow-hidden rounded-[2.1rem] bg-white/[0.04] p-4 shadow-[0_24px_70px_-48px_rgba(2,6,23,0.95)] backdrop-blur-sm"
              >
                <div className="space-y-4">
                  <div className="aspect-square w-full rounded-2xl bg-white/[0.06]" />
                  <div>
                    <div className="h-4 w-24 rounded bg-white/[0.06]" />
                    <div className="mt-3 h-5 w-5/6 rounded bg-white/[0.08]" />
                    <div className="mt-2 h-4 w-4/6 rounded bg-white/[0.05]" />
                    <div className="mt-4 h-4 w-full rounded bg-white/[0.05]" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (state.error && state.posts.length === 0) {
    return (
      <div className="relative overflow-hidden rounded-[2rem] bg-[linear-gradient(180deg,rgba(24,10,5,0.72),rgba(12,8,7,0.78))] p-5 shadow-[0_30px_80px_-48px_rgba(2,6,23,0.95)] sm:p-6">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(249,115,22,0.12),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(239,68,68,0.08),transparent_34%)]" />

        <div className="relative">
          <p className="text-sm font-semibold text-white">
            Community feed unavailable
          </p>
          <p className="mt-1 text-sm text-slate-400">{state.error}</p>
          <Link
            href="/community"
            className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-orange-300 hover:text-orange-200"
          >
            Open the full community hub
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M13 7l5 5m0 0l-5 5m5-5H6"
              />
            </svg>
          </Link>
        </div>
      </div>
    );
  }

  if (state.posts.length === 0) {
    return (
      <div className="relative overflow-hidden rounded-[2rem] bg-[linear-gradient(180deg,rgba(7,13,26,0.72),rgba(4,8,17,0.82))] p-6 text-center shadow-[0_30px_80px_-48px_rgba(2,6,23,0.95)]">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.08),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(249,115,22,0.08),transparent_34%)]" />

        <div className="relative">
          <p className="text-base font-semibold text-white">
            No community posts yet
          </p>
          <p className="mt-2 text-sm text-slate-400">
            The homepage will pull real positions from the database as soon as
            the first public posts are published.
          </p>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/community"
              className="inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.03] px-4 py-2 text-sm font-semibold text-slate-200 transition hover:border-white/[0.14] hover:bg-white/[0.05]"
            >
              Browse community
            </Link>
            <Link
              href="/board"
              className="inline-flex items-center gap-2 rounded-full border border-orange-500/30 bg-orange-500/10 px-4 py-2 text-sm font-semibold text-orange-300 transition hover:border-orange-500/45 hover:bg-orange-500/15"
            >
              Create the first post
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative px-1 py-2 sm:py-4">
      <div className="pointer-events-none absolute inset-y-0 left-1/2 w-screen -translate-x-1/2 bg-[radial-gradient(ellipse_70%_36%_at_28%_18%,rgba(56,189,248,0.05),transparent_72%),radial-gradient(ellipse_56%_30%_at_72%_26%,rgba(244,114,182,0.04),transparent_74%),radial-gradient(ellipse_42%_24%_at_52%_48%,rgba(249,115,22,0.04),transparent_78%)] opacity-80" />

      <div className="relative">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-3xl">
            <p className="max-w-2xl text-sm leading-relaxed text-slate-400 sm:text-base">
              {activeCategory.description}
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:items-end">
            <div className="flex items-center gap-1 rounded-full border border-white/[0.08] bg-black/10 p-1 backdrop-blur-sm">
              {(["new", "hot"] as const).map((mode) => {
                const selected = mode === sort;
                return (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setSort(mode)}
                    className={`rounded-lg px-4 py-1.5 text-sm font-semibold transition-colors ${selected ? "bg-white/[0.08] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]" : "text-slate-400 hover:text-white"}`}
                  >
                    {mode === "new" ? "✨ New" : "🔥 Hot"}
                  </button>
                );
              })}
            </div>

            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 sm:justify-end">
              <span>
                {state.loading
                  ? "Refreshing feed..."
                  : `Showing ${visiblePosts.length} of ${filteredPosts.length} boards.`}
              </span>
              <Link
                href={buildCommunityHref(sort, category)}
                className="font-semibold text-orange-300 transition-colors hover:text-orange-200"
              >
                Open full feed
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          {categoryCounts.map((option) => {
            const selected = option.id === category;
            return (
              <button
                key={option.id}
                type="button"
                onClick={() => setCategory(option.id)}
                className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-2 text-sm font-semibold transition ${selected ? option.accentClass : "border-white/[0.08] bg-white/[0.02] text-slate-300 hover:border-white/[0.16] hover:text-white"}`}
              >
                <span>{option.label}</span>
                <span className="rounded-full bg-black/20 px-2 py-0.5 text-[11px] text-inherit">
                  {option.count}
                </span>
              </button>
            );
          })}
        </div>

        {state.error && state.posts.length > 0 && (
          <div className="mt-5 rounded-2xl bg-orange-500/[0.08] px-4 py-3 backdrop-blur-sm">
            <p className="text-sm font-semibold text-white">
              Could not refresh the live feed.
            </p>
            <p className="mt-1 text-sm text-orange-100/70">{state.error}</p>
          </div>
        )}

        {filteredPosts.length === 0 ? (
          <div className="mt-6 rounded-[1.9rem] bg-white/[0.04] px-6 py-12 text-center backdrop-blur-sm">
            <p className="text-base font-semibold text-white">
              No boards in this category yet
            </p>
            <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-slate-400">
              Switch filters or open the full community hub to browse the rest
              of the live feed.
            </p>
            <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setCategory("all")}
                className="inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.03] px-4 py-2 text-sm font-semibold text-slate-200 transition hover:border-white/[0.14] hover:bg-white/[0.05]"
              >
                Show all boards
              </button>
              <Link
                href={buildCommunityHref(sort, "all")}
                className="inline-flex items-center gap-2 rounded-full border border-orange-500/30 bg-orange-500/10 px-4 py-2 text-sm font-semibold text-orange-300 transition hover:border-orange-500/45 hover:bg-orange-500/15"
              >
                Open full feed
              </Link>
            </div>
          </div>
        ) : (
          <>
            <div
              className="mt-6 grid gap-4"
              style={{
                gridTemplateColumns:
                  "repeat(auto-fill, minmax(min(100%, 21rem), 1fr))",
              }}
            >
              {visiblePosts.map((post) => (
                <article
                  key={post.id}
                  className="group relative flex h-full flex-col overflow-hidden rounded-[2.15rem] border border-white/[0.04] bg-[linear-gradient(160deg,rgba(7,12,24,0.58),rgba(10,15,30,0.46)_55%,rgba(15,23,42,0.6))] p-5 shadow-[0_28px_70px_-52px_rgba(2,6,23,0.82)] backdrop-blur-sm transition duration-300 hover:-translate-y-1 hover:border-white/[0.08] hover:shadow-[0_36px_100px_-56px_rgba(56,189,248,0.16)]"
                >
                  <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.05),transparent_30%),radial-gradient(circle_at_85%_0%,rgba(56,189,248,0.08),transparent_36%),radial-gradient(circle_at_bottom_right,rgba(249,115,22,0.08),transparent_32%)] opacity-70" />
                  {(() => {
                    const puzzleData =
                      post.kind === "puzzle"
                        ? extractCommunityPuzzleData(post.pgn)
                        : null;
                    const theme = getCommunityCardTheme(post.kind);
                    const totalSignals =
                      post.likesCount + post.commentsCount + post.savesCount;
                    const summary = puzzleData
                      ? `${puzzleData.solution.length} move${puzzleData.solution.length === 1 ? "" : "s"} • Play inline`
                      : post.openingName
                        ? `Study anchor • ${post.openingName}`
                        : post.prompt ||
                          "Open the board to join the discussion.";

                    return (
                      <div className="relative flex h-full flex-col">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                            <span
                              className={`rounded-full border px-3 py-1 ${theme.badge}`}
                            >
                              {COMMUNITY_KIND_LABELS[post.kind]}
                            </span>
                          </div>

                          <span className="shrink-0 pt-1 text-[11px] font-medium text-slate-500">
                            {formatCreatedAt(post.createdAt)}
                          </span>
                        </div>

                        <div
                          className={`relative mt-4 rounded-[1.9rem] bg-[linear-gradient(160deg,rgba(255,255,255,0.035),rgba(255,255,255,0.012))] p-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.035)] transition duration-300 group-hover:-translate-y-1 ${puzzleData ? "overflow-visible" : "overflow-hidden"}`}
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
                                size={560}
                                showCoordinates={false}
                                showFooterBar={false}
                              />
                            </div>
                          ) : (
                            <div className="relative overflow-hidden rounded-[1.35rem]">
                              <Link
                                href={`/community/${post.slug}`}
                                className="block w-full"
                              >
                                <CommunityBoardPreview
                                  fen={post.fen}
                                  pgn={post.pgn}
                                  orientation={post.orientation ?? "white"}
                                  size={560}
                                  showCoordinates={false}
                                />
                              </Link>
                            </div>
                          )}
                        </div>

                        <div className="mt-4 flex flex-1 flex-col">
                          <Link
                            href={`/community/${post.slug}`}
                            className="block"
                          >
                            <h3 className="line-clamp-2 text-lg font-bold tracking-tight text-white transition-colors group-hover:text-orange-300">
                              {post.title}
                            </h3>
                            <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-slate-400">
                              {summary}
                            </p>
                          </Link>

                          <div className="mt-auto flex items-center justify-between gap-3 pt-4">
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
                                    className="truncate text-sm font-semibold text-white transition-colors hover:text-orange-200"
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

                            <span className="shrink-0 text-[11px] font-semibold text-slate-400">
                              {formatSignalCount(totalSignals)}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </article>
              ))}
            </div>

            {filteredPosts.length > visiblePosts.length && (
              <div className="mt-5 flex flex-col gap-3 rounded-2xl bg-white/[0.04] px-4 py-3 backdrop-blur-sm sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-slate-400">
                  {filteredPosts.length - visiblePosts.length} more board
                  {filteredPosts.length - visiblePosts.length === 1
                    ? ""
                    : "s"}{" "}
                  in this filter are waiting in the full community feed.
                </p>
                <Link
                  href={buildCommunityHref(sort, category)}
                  className="text-sm font-semibold text-orange-300 transition-colors hover:text-orange-200"
                >
                  View the rest
                </Link>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
