import type { Metadata } from "next";
import Link from "next/link";
import { CommunityPostCard } from "@/components/community-post-card";
import { getCommunityFeed } from "@/lib/community";
import {
  COMMUNITY_CATEGORY_OPTIONS,
  filterCommunityPostsByCategory,
  isCommunityCategoryId,
  type CommunityCategoryId,
} from "@/lib/community-categories";
import type { CommunitySortMode } from "@/lib/community-shared";

export const metadata: Metadata = {
  title: "Community Hub — Positions, Openings, and Puzzles | FireChess",
  description:
    "Discover positions, opening ideas, and puzzles shared by FireChess players. Comment, save, and learn from public chess moments.",
};

export default async function CommunityHubPage({
  searchParams,
}: {
  searchParams: Promise<{ sort?: string; category?: string }>;
}) {
  const params = await searchParams;
  const sort: CommunitySortMode = params.sort === "hot" ? "hot" : "new";
  const category: CommunityCategoryId = isCommunityCategoryId(params.category)
    ? params.category
    : "all";
  const posts = await getCommunityFeed(sort, 48);
  const categoryCounts = COMMUNITY_CATEGORY_OPTIONS.map((option) => ({
    ...option,
    count: filterCommunityPostsByCategory(posts, option.id).length,
  }));
  const activeCategory =
    categoryCounts.find((option) => option.id === category) ??
    categoryCounts[0];
  const filteredPosts = filterCommunityPostsByCategory(posts, category);

  function buildCommunityHref(
    nextSort: CommunitySortMode,
    nextCategory: CommunityCategoryId,
  ) {
    const query = new URLSearchParams();
    if (nextSort !== "new") {
      query.set("sort", nextSort);
    }
    if (nextCategory !== "all") {
      query.set("category", nextCategory);
    }

    const search = query.toString();
    return search ? `/community?${search}` : "/community";
  }

  return (
    <div className="min-h-screen bg-[#030712] text-white">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        {/* ─── Page Header ─── */}
        <header className="mb-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-orange-400">
                Community Hub
              </p>
              <h1 className="mt-1.5 text-2xl font-black tracking-tight text-white sm:text-3xl">
                Positions worth sharing.
              </h1>
              <p className="mt-1.5 max-w-xl text-sm leading-relaxed text-slate-400">
                Real game moments turned into public puzzles, opening questions,
                and study objects anyone can comment on, save, or review later.
              </p>
            </div>
            <div className="flex shrink-0 flex-wrap gap-2">
              <Link
                href="/board"
                className="rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 px-4 py-2 text-sm font-semibold text-white transition hover:brightness-110"
              >
                🧰 Board Workbench
              </Link>
              <Link
                href="/games"
                className="rounded-xl border border-white/[0.1] bg-white/[0.03] px-4 py-2 text-sm font-semibold text-slate-300 transition hover:border-white/[0.18] hover:text-white"
              >
                Browse Famous Games
              </Link>
            </div>
          </div>
        </header>

        {/* ─── Sort tabs ─── */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1 rounded-xl border border-white/[0.08] bg-white/[0.03] p-1">
            <Link
              href={buildCommunityHref("new", category)}
              className={`rounded-lg px-4 py-1.5 text-sm font-semibold transition-colors ${sort === "new" ? "bg-white/[0.12] text-white" : "text-slate-400 hover:text-white"}`}
            >
              ✨ New
            </Link>
            <Link
              href={buildCommunityHref("hot", category)}
              className={`rounded-lg px-4 py-1.5 text-sm font-semibold transition-colors ${sort === "hot" ? "bg-white/[0.12] text-white" : "text-slate-400 hover:text-white"}`}
            >
              🔥 Hot
            </Link>
          </div>
          <p className="text-xs text-slate-500">
            {sort === "hot"
              ? "Ranked by likes, comments, and recency."
              : "Freshest positions first."}
          </p>
        </div>

        <section className="mb-8 rounded-3xl border border-white/[0.08] bg-white/[0.03] p-4 sm:p-5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
                Categories
              </p>
              <h2 className="mt-1 text-lg font-bold text-white">
                Filter the hub like the homepage feed.
              </h2>
              <p className="mt-1 max-w-2xl text-sm text-slate-400">
                {activeCategory.description}
              </p>
            </div>
            <p className="text-xs text-slate-500">
              Showing {filteredPosts.length} of {posts.length} boards.
            </p>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {categoryCounts.map((option) => {
              const selected = option.id === category;
              return (
                <Link
                  key={option.id}
                  href={buildCommunityHref(sort, option.id)}
                  className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-2 text-sm font-semibold transition ${selected ? option.accentClass : "border-white/[0.08] bg-white/[0.02] text-slate-300 hover:border-white/[0.16] hover:text-white"}`}
                >
                  <span>{option.label}</span>
                  <span className="rounded-full bg-black/20 px-2 py-0.5 text-[11px] text-inherit">
                    {option.count}
                  </span>
                </Link>
              );
            })}
          </div>
        </section>

        {filteredPosts.length === 0 ? (
          <div className="mt-8 rounded-2xl border border-dashed border-white/[0.08] bg-white/[0.02] px-6 py-20 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-white/[0.06] bg-white/[0.03] text-3xl">
              ♟️
            </div>
            <h2 className="mt-5 text-xl font-bold text-white">
              No boards in this category yet
            </h2>
            <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-slate-400">
              Switch filters or publish a new board from the workbench to start
              filling this lane with puzzles, opening prep, or endgame study.
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/board"
                className="rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:brightness-110"
              >
                Create the first post
              </Link>
              <Link
                href="/positions"
                className="rounded-xl border border-white/[0.1] bg-white/[0.03] px-5 py-2.5 text-sm font-semibold text-slate-300 transition hover:border-white/[0.18] hover:text-white"
              >
                Study Positions
              </Link>
            </div>
          </div>
        ) : (
          <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {filteredPosts.map((post) => (
              <CommunityPostCard key={post.id} post={post} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
