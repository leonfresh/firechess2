import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CommunityFlashcards } from "@/components/community-flashcards";
import { CommunityPostCard } from "@/components/community-post-card";
import { getCommunityProfile } from "@/lib/community";
import { extractCommunityPuzzleData } from "@/lib/community-shared";

function prettifyCollectionKey(value: string | null) {
  if (!value) return "Shared Positions";
  return value
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ userId: string }>;
}): Promise<Metadata> {
  const { userId } = await params;
  const data = await getCommunityProfile(userId);

  if (!data) return { title: "Community Profile | FireChess" };

  return {
    title: `${data.profile.displayName} — Community Profile | FireChess`,
    description:
      "Shared positions, puzzles, openings, and flashcard review from a FireChess community profile.",
  };
}

export default async function CommunityProfilePage({
  params,
  searchParams,
}: {
  params: Promise<{ userId: string }>;
  searchParams: Promise<{ view?: string }>;
}) {
  const { userId } = await params;
  const sp = await searchParams;
  const data = await getCommunityProfile(userId);

  if (!data) notFound();

  const grouped = data.posts.reduce<Record<string, typeof data.posts>>(
    (acc, post) => {
      const key = prettifyCollectionKey(post.collectionKey);
      acc[key] = [...(acc[key] ?? []), post];
      return acc;
    },
    {},
  );

  const flashcards = data.posts.flatMap((post) => {
    if (post.kind !== "puzzle") return [];

    const puzzleData = extractCommunityPuzzleData(post.pgn);
    if (!puzzleData || puzzleData.solution.length === 0) {
      return [];
    }

    return [
      {
        slug: post.slug,
        title: post.title,
        prompt: post.prompt,
        description: post.description,
        kind: post.kind,
        orientation: puzzleData.orientation,
        startFen: puzzleData.startFen,
        previousMove: puzzleData.previousMove,
        solution: puzzleData.solution,
      },
    ];
  });

  const flashcardView = sp.view === "flashcards";

  return (
    <div className="min-h-screen bg-[#030712] text-white">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <header className="rounded-[2rem] border border-white/[0.08] bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.14),transparent_32%),radial-gradient(circle_at_bottom_right,rgba(249,115,22,0.12),transparent_28%),rgba(255,255,255,0.025)] p-6 sm:p-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="flex items-center gap-4">
              {data.profile.image ? (
                <img
                  src={data.profile.image}
                  alt=""
                  className="h-16 w-16 rounded-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <span className="flex h-16 w-16 items-center justify-center rounded-full bg-orange-500/15 text-2xl font-bold text-orange-300">
                  {(data.profile.displayName[0] ?? "F").toUpperCase()}
                </span>
              )}
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-300">
                  Community Profile
                </p>
                <h1 className="mt-2 text-3xl font-black tracking-tight text-white sm:text-4xl">
                  {data.profile.displayName}
                </h1>
                <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-300">
                  Shared positions, puzzles, opening spots, and training
                  artifacts built from public FireChess posts.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href={`/community/profile/${userId}`}
                className={`rounded-full px-5 py-3 text-sm font-semibold transition ${!flashcardView ? "bg-white text-black" : "border border-white/[0.1] bg-white/[0.03] text-slate-200 hover:border-white/[0.18] hover:text-white"}`}
              >
                Collections
              </Link>
              <Link
                href={`/community/profile/${userId}?view=flashcards`}
                className={`rounded-full px-5 py-3 text-sm font-semibold transition ${flashcardView ? "bg-white text-black" : "border border-white/[0.1] bg-white/[0.03] text-slate-200 hover:border-white/[0.18] hover:text-white"}`}
              >
                Flashcards
              </Link>
            </div>
          </div>
        </header>

        <div className="mt-6 flex flex-wrap items-center gap-4 text-sm text-slate-400">
          <span>{data.posts.length} public posts</span>
          <span>•</span>
          <span>{Object.keys(grouped).length} collections</span>
        </div>

        {flashcardView ? (
          <div className="mt-8">
            <CommunityFlashcards posts={flashcards} />
          </div>
        ) : (
          <div className="mt-8 space-y-10">
            {Object.entries(grouped).map(([collection, posts]) => (
              <section key={collection}>
                <div className="mb-5 flex items-center justify-between gap-3">
                  <div>
                    <h2 className="text-2xl font-bold text-white">
                      {collection}
                    </h2>
                    <p className="text-sm text-slate-500">
                      {posts.length} {posts.length === 1 ? "post" : "posts"}
                    </p>
                  </div>
                </div>
                <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                  {posts.map((post) => (
                    <CommunityPostCard
                      key={post.id}
                      post={{
                        ...post,
                        authorId: data.profile.id,
                        authorName: data.profile.name,
                        authorEmail: data.profile.email,
                        authorImage: data.profile.image,
                        authorChaosUsername: data.profile.chaosUsername,
                        authorDisplayName: data.profile.displayName,
                        hotScore: 0,
                        previewMode: "board",
                        sourceType: post.sourceType,
                      }}
                    />
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
