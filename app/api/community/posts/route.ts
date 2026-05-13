import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getCommunityFeed } from "@/lib/community";
import { communityPosts } from "@/lib/schema";
import {
  attachCommunityPuzzleDataToPgn,
  coerceCommunityPuzzleData,
  createUniqueCommunitySlug,
  defaultCollectionKey,
  deriveFenFromInput,
  normalizeTags,
  type CommunityPostKind,
  type CommunitySortMode,
  type CommunitySourceType,
} from "@/lib/community-shared";
import { Chess } from "chess.js";

const VALID_KINDS = new Set<CommunityPostKind>([
  "position",
  "opening",
  "puzzle",
]);
const VALID_SOURCES = new Set<CommunitySourceType>([
  "analysis",
  "manual",
  "community-thread",
  "famous-game",
  "opening-guide",
  "endgame-scan",
  "puzzle-source",
]);

function parseUciMove(uci: string) {
  if (uci.length < 4) return null;

  return {
    from: uci.slice(0, 2),
    to: uci.slice(2, 4),
    promotion: uci.slice(4, 5) || undefined,
  };
}

export async function GET(req: NextRequest) {
  const sortParam = req.nextUrl.searchParams.get("sort");
  const limitParam = Number(req.nextUrl.searchParams.get("limit") ?? "24");
  const sort: CommunitySortMode = sortParam === "hot" ? "hot" : "new";
  const limit = Number.isFinite(limitParam)
    ? Math.min(48, Math.max(1, limitParam))
    : 24;

  try {
    const posts = await getCommunityFeed(sort, limit);
    return NextResponse.json({ posts });
  } catch (err) {
    console.error("[community posts GET]", err);
    return NextResponse.json(
      { error: "Failed to load community posts." },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = (await req.json()) as {
      kind?: CommunityPostKind;
      sourceType?: CommunitySourceType;
      title?: string;
      prompt?: string;
      description?: string;
      fen?: string;
      pgn?: string;
      orientation?: "white" | "black";
      openingName?: string;
      tags?: string[] | string;
      puzzleData?: unknown;
      collectionKey?: string;
      visibility?: "public" | "unlisted";
      previewMode?: "board" | "gif";
    };

    const kind = VALID_KINDS.has(body.kind ?? "position")
      ? (body.kind as CommunityPostKind)
      : "position";
    const sourceType = VALID_SOURCES.has(body.sourceType ?? "manual")
      ? (body.sourceType as CommunitySourceType)
      : "manual";
    const title = body.title?.trim() ?? "";
    const prompt = body.prompt?.trim() ?? "";

    if (title.length < 4) {
      return NextResponse.json(
        { error: "Title must be at least 4 characters." },
        { status: 400 },
      );
    }

    if (prompt.length < 8) {
      return NextResponse.json(
        { error: "Prompt must be at least 8 characters." },
        { status: 400 },
      );
    }

    let fenToStore: string | null = null;
    let pgnToStore: string | null = null;
    let orientationToStore: "white" | "black" =
      body.orientation === "black" ? "black" : "white";

    if (kind === "puzzle") {
      const puzzleData = coerceCommunityPuzzleData(body.puzzleData);
      if (!puzzleData) {
        return NextResponse.json(
          {
            error:
              "Use Start Puzzle Mode on the board first so FireChess can save the previous move and verified solution line.",
          },
          { status: 400 },
        );
      }

      const contextDerived = deriveFenFromInput({ pgn: body.pgn, fen: null });
      if (!contextDerived.fen || !contextDerived.pgn) {
        return NextResponse.json(
          {
            error:
              "Puzzles need PGN context for the opponent's last move. Load a PGN or build the setup move before publishing.",
          },
          { status: 400 },
        );
      }

      if (contextDerived.fen !== puzzleData.startFen) {
        return NextResponse.json(
          {
            error:
              "The saved puzzle start no longer matches the board context. Restart puzzle mode on the current position.",
          },
          { status: 400 },
        );
      }

      try {
        const contextChess = new Chess();
        contextChess.loadPgn(contextDerived.pgn);
        const previousMove = contextChess.history({ verbose: true }).at(-1);

        if (!previousMove) {
          return NextResponse.json(
            {
              error:
                "FireChess could not recover the opponent's last move for this puzzle.",
            },
            { status: 400 },
          );
        }

        const previousMoveUci = `${previousMove.from}${previousMove.to}${previousMove.promotion ?? ""}`;
        if (
          previousMove.san !== puzzleData.previousMove.san ||
          previousMoveUci !== puzzleData.previousMove.uci
        ) {
          return NextResponse.json(
            {
              error:
                "The recorded previous move does not match the current puzzle start. Restart puzzle mode on the position you want to publish.",
            },
            { status: 400 },
          );
        }

        const solutionChess = new Chess(puzzleData.startFen);
        for (const move of puzzleData.solution) {
          const parsed = parseUciMove(move.uci);
          if (!parsed) {
            return NextResponse.json(
              { error: "A puzzle move had an invalid UCI string." },
              { status: 400 },
            );
          }

          const fenBefore = solutionChess.fen();
          const moveNumber = Number(fenBefore.split(" ")[5] ?? "1") || 1;
          const result = solutionChess.move(parsed);

          if (
            !result ||
            result.san !== move.san ||
            result.color !== move.color ||
            moveNumber !== move.moveNumber
          ) {
            return NextResponse.json(
              {
                error:
                  "The saved solution line is no longer valid from the chosen puzzle start. Record the solution again from puzzle mode.",
              },
              { status: 400 },
            );
          }
        }
      } catch {
        return NextResponse.json(
          { error: "The puzzle context could not be verified." },
          { status: 400 },
        );
      }

      fenToStore = puzzleData.startFen;
      pgnToStore = attachCommunityPuzzleDataToPgn(contextDerived.pgn, {
        ...puzzleData,
        orientation: puzzleData.orientation,
      });
      orientationToStore = puzzleData.orientation;

      if (!pgnToStore) {
        return NextResponse.json(
          {
            error:
              "Puzzles need a PGN context ending on the opponent's last move.",
          },
          { status: 400 },
        );
      }
    } else {
      const derived = deriveFenFromInput({ fen: body.fen, pgn: body.pgn });
      if (!derived.fen) {
        return NextResponse.json(
          { error: derived.error ?? "Invalid position input." },
          { status: 400 },
        );
      }

      fenToStore = derived.fen;
      pgnToStore = derived.pgn;
    }

    const existingSlugs = await db
      .select({ slug: communityPosts.slug })
      .from(communityPosts);
    const slug = createUniqueCommunitySlug(
      title,
      existingSlugs.map((item) => item.slug),
    );

    const [post] = await db
      .insert(communityPosts)
      .values({
        authorId: session.user.id,
        slug,
        kind,
        sourceType,
        title,
        prompt,
        description: body.description?.trim() || null,
        fen: fenToStore,
        pgn: pgnToStore,
        orientation: orientationToStore,
        openingName: body.openingName?.trim() || null,
        tags: normalizeTags(body.tags),
        collectionKey:
          body.collectionKey?.trim() || defaultCollectionKey(kind, sourceType),
        visibility: body.visibility === "unlisted" ? "unlisted" : "public",
        previewMode: body.previewMode === "gif" ? "gif" : "board",
      })
      .returning({ id: communityPosts.id, slug: communityPosts.slug });

    return NextResponse.json({ ok: true, id: post.id, slug: post.slug });
  } catch (err) {
    console.error("[community posts POST]", err);
    return NextResponse.json(
      { error: "Failed to create post." },
      { status: 500 },
    );
  }
}
