import { Chess } from "chess.js";
import {
  attachCommunityPuzzleDataToPgn,
  coerceCommunityPuzzleData,
  defaultCollectionKey,
  deriveFenFromInput,
  normalizeTags,
  type CommunityPostKind,
  type CommunitySourceType,
} from "@/lib/community-shared";

export type CommunityPostRequestBody = {
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

export type ResolvedCommunityPostPayload = {
  kind: CommunityPostKind;
  sourceType: CommunitySourceType;
  title: string;
  prompt: string;
  description: string | null;
  fen: string;
  pgn: string | null;
  orientation: "white" | "black";
  openingName: string | null;
  tags: string[];
  collectionKey: string;
  visibility: "public" | "unlisted";
  previewMode: "board" | "gif";
};

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

export function resolveCommunityPostPayload(
  body: CommunityPostRequestBody,
):
  | { ok: true; values: ResolvedCommunityPostPayload }
  | { ok: false; error: string } {
  const kind = VALID_KINDS.has(body.kind ?? "position")
    ? (body.kind as CommunityPostKind)
    : "position";
  const sourceType = VALID_SOURCES.has(body.sourceType ?? "manual")
    ? (body.sourceType as CommunitySourceType)
    : "manual";
  const title = body.title?.trim() ?? "";
  const prompt = body.prompt?.trim() ?? "";

  if (title.length < 4) {
    return { ok: false, error: "Title must be at least 4 characters." };
  }

  if (prompt.length < 8) {
    return { ok: false, error: "Prompt must be at least 8 characters." };
  }

  let fenToStore: string | null = null;
  let pgnToStore: string | null = null;
  let orientationToStore: "white" | "black" =
    body.orientation === "black" ? "black" : "white";

  if (kind === "puzzle") {
    const puzzleData = coerceCommunityPuzzleData(body.puzzleData);
    if (!puzzleData) {
      return {
        ok: false,
        error:
          "Use Start Puzzle Mode on the board first so FireChess can save the verified solution line.",
      };
    }

    const rawPuzzleContextPgn =
      typeof body.pgn === "string" ? body.pgn.trim() : "";
    const contextDerived = rawPuzzleContextPgn
      ? deriveFenFromInput({ pgn: rawPuzzleContextPgn, fen: null })
      : { fen: null, pgn: null, error: null };

    if (rawPuzzleContextPgn && (!contextDerived.fen || !contextDerived.pgn)) {
      return {
        ok: false,
        error: contextDerived.error ?? "Invalid PGN context for puzzle.",
      };
    }

    if (contextDerived.fen && contextDerived.fen !== puzzleData.startFen) {
      return {
        ok: false,
        error:
          "The saved puzzle start no longer matches the board context. Restart puzzle mode on the current position.",
      };
    }

    try {
      if (contextDerived.pgn && puzzleData.previousMove) {
        const contextChess = new Chess();
        contextChess.loadPgn(contextDerived.pgn);
        const previousMove = contextChess.history({ verbose: true }).at(-1);

        if (!previousMove) {
          return {
            ok: false,
            error:
              "FireChess could not recover the lead-in move for this puzzle.",
          };
        }

        const previousMoveUci = `${previousMove.from}${previousMove.to}${previousMove.promotion ?? ""}`;
        if (
          previousMove.san !== puzzleData.previousMove.san ||
          previousMoveUci !== puzzleData.previousMove.uci
        ) {
          return {
            ok: false,
            error:
              "The recorded lead-in move does not match the current puzzle start. Restart puzzle mode on the position you want to publish.",
          };
        }
      }

      const solutionChess = new Chess(puzzleData.startFen);
      for (const move of puzzleData.solution) {
        const parsed = parseUciMove(move.uci);
        if (!parsed) {
          return {
            ok: false,
            error: "A puzzle move had an invalid UCI string.",
          };
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
          return {
            ok: false,
            error:
              "The saved solution line is no longer valid from the chosen puzzle start. Record the solution again from puzzle mode.",
          };
        }
      }
    } catch {
      return {
        ok: false,
        error: "The puzzle context could not be verified.",
      };
    }

    fenToStore = puzzleData.startFen;
    pgnToStore = attachCommunityPuzzleDataToPgn(contextDerived.pgn, {
      ...puzzleData,
      orientation: puzzleData.orientation,
    });
    orientationToStore = puzzleData.orientation;
  } else {
    const derived = deriveFenFromInput({ fen: body.fen, pgn: body.pgn });
    if (!derived.fen) {
      return {
        ok: false,
        error: derived.error ?? "Invalid position input.",
      };
    }

    fenToStore = derived.fen;
    pgnToStore = derived.pgn;
  }

  return {
    ok: true,
    values: {
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
    },
  };
}
