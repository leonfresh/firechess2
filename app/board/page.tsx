import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { CommunityPostComposer } from "@/components/community-post-composer";
import { isAdmin } from "@/lib/admin";
import { auth } from "@/lib/auth";
import { getCommunityPostBySlug } from "@/lib/community";
import type {
  CommunityPostKind,
  CommunitySourceType,
} from "@/lib/community-shared";
import { extractCommunityPuzzleData } from "@/lib/community-shared";

export const metadata: Metadata = {
  title:
    "Board Workbench — Create Positions, Openings, and Puzzles | FireChess",
  description:
    "Load a FEN or PGN, turn it into a shareable post, and publish it to the FireChess community hub.",
};

export default async function BoardWorkbenchPage({
  searchParams,
}: {
  searchParams: Promise<{
    kind?: string;
    sourceType?: string;
    fen?: string;
    pgn?: string;
    title?: string;
    prompt?: string;
    openingName?: string;
    orientation?: string;
    minimal?: string;
    editSlug?: string;
  }>;
}) {
  const sp = await searchParams;
  const editSlug = sp.editSlug?.trim() ?? "";
  const minimal = !editSlug && sp.minimal === "1";

  let editingPost = null as Awaited<ReturnType<typeof getCommunityPostBySlug>>;

  if (editSlug) {
    const session = await auth();
    if (!session?.user?.id || !(await isAdmin(session.user.id))) {
      redirect("/community");
    }

    editingPost = await getCommunityPostBySlug(editSlug, session.user.id);
    if (!editingPost) {
      notFound();
    }
  }

  const puzzleData = editingPost
    ? extractCommunityPuzzleData(editingPost.pgn)
    : null;

  const kind = editingPost
    ? editingPost.kind
    : sp.kind === "opening" || sp.kind === "puzzle"
      ? sp.kind
      : "position";
  const sourceType = editingPost
    ? editingPost.sourceType
    : sp.sourceType === "analysis" ||
        sp.sourceType === "community-thread" ||
        sp.sourceType === "famous-game" ||
        sp.sourceType === "opening-guide" ||
        sp.sourceType === "endgame-scan" ||
        sp.sourceType === "puzzle-source"
      ? sp.sourceType
      : "manual";
  const orientation = editingPost
    ? (editingPost.orientation ?? "white")
    : sp.orientation === "black"
      ? "black"
      : "white";

  return (
    <div className="min-h-screen bg-[#030712] text-white">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <nav className="mb-5 flex flex-wrap items-center gap-2 text-xs text-slate-500">
          <Link
            href="/community"
            className="transition-colors hover:text-slate-300"
          >
            Community
          </Link>
          <span>/</span>
          <span className="min-w-0 break-words text-slate-300">
            {editSlug
              ? "Edit Community Post"
              : minimal
                ? "New Community Post"
                : "Board Workbench"}
          </span>
        </nav>

        <CommunityPostComposer
          initialKind={kind as CommunityPostKind}
          initialSourceType={sourceType as CommunitySourceType}
          initialFen={editingPost?.fen ?? sp.fen ?? ""}
          initialPgn={editingPost?.pgn ?? sp.pgn ?? ""}
          initialTitle={editingPost?.title ?? sp.title ?? ""}
          initialPrompt={editingPost?.prompt ?? sp.prompt ?? ""}
          initialDescription={editingPost?.description ?? ""}
          initialOpeningName={editingPost?.openingName ?? sp.openingName ?? ""}
          initialOrientation={orientation}
          initialTags={editingPost?.tags ?? []}
          initialPuzzleMoves={
            puzzleData?.solution.map((move) => move.uci) ?? []
          }
          editSlug={editingPost?.slug}
          minimal={minimal}
        />
      </div>
    </div>
  );
}
