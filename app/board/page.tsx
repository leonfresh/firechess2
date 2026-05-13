import type { Metadata } from "next";
import Link from "next/link";
import { CommunityPostComposer } from "@/components/community-post-composer";
import type {
  CommunityPostKind,
  CommunitySourceType,
} from "@/lib/community-shared";

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
  }>;
}) {
  const sp = await searchParams;
  const minimal = sp.minimal === "1";

  const kind =
    sp.kind === "opening" || sp.kind === "puzzle" ? sp.kind : "position";
  const sourceType =
    sp.sourceType === "analysis" ||
    sp.sourceType === "community-thread" ||
    sp.sourceType === "famous-game" ||
    sp.sourceType === "opening-guide" ||
    sp.sourceType === "endgame-scan" ||
    sp.sourceType === "puzzle-source"
      ? sp.sourceType
      : "manual";
  const orientation = sp.orientation === "black" ? "black" : "white";

  return (
    <div className="min-h-screen bg-[#030712] text-white">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <nav className="mb-5 flex items-center gap-2 text-xs text-slate-500">
          <Link
            href="/community"
            className="transition-colors hover:text-slate-300"
          >
            Community
          </Link>
          <span>/</span>
          <span className="text-slate-300">
            {minimal ? "New Community Post" : "Board Workbench"}
          </span>
        </nav>

        <CommunityPostComposer
          initialKind={kind as CommunityPostKind}
          initialSourceType={sourceType as CommunitySourceType}
          initialFen={sp.fen ?? ""}
          initialPgn={sp.pgn ?? ""}
          initialTitle={sp.title ?? ""}
          initialPrompt={sp.prompt ?? ""}
          initialOpeningName={sp.openingName ?? ""}
          initialOrientation={orientation}
          minimal={minimal}
        />
      </div>
    </div>
  );
}
