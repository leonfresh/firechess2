import { Chess } from "chess.js";

export type CommunityPostKind = "position" | "opening" | "puzzle";
export type CommunitySortMode = "new" | "hot";
export type CommunitySourceType =
  | "analysis"
  | "manual"
  | "community-thread"
  | "famous-game"
  | "opening-guide"
  | "endgame-scan"
  | "puzzle-source";
export type CommunityReactionKind = "like" | "save";
export type CommunityPuzzleLineMove = {
  san: string;
  uci: string;
  color: "w" | "b";
  moveNumber: number;
};
export type CommunityPuzzleData = {
  startFen: string;
  orientation: "white" | "black";
  previousMove?: CommunityPuzzleLineMove;
  solution: CommunityPuzzleLineMove[];
};

export const STARTING_FEN =
  "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

export const COMMUNITY_KIND_LABELS: Record<CommunityPostKind, string> = {
  position: "Position",
  opening: "Opening",
  puzzle: "Puzzle",
};

export const COMMUNITY_SOURCE_LABELS: Record<CommunitySourceType, string> = {
  analysis: "Analysis",
  manual: "Workbench",
  "community-thread": "Community Thread",
  "famous-game": "Famous Game",
  "opening-guide": "Guide",
  "endgame-scan": "Endgame Scan",
  "puzzle-source": "Puzzle",
};

const COMMUNITY_PUZZLE_PGN_HEADER = "FireChessPuzzleData";

export function buildUserDisplayName(user: {
  name: string | null;
  chaosUsername?: string | null;
  email?: string | null;
}) {
  if (user.chaosUsername?.trim()) return user.chaosUsername.trim();
  if (user.name?.trim()) return user.name.trim();
  if (user.email?.trim()) return user.email.trim().split("@")[0];
  return "FireChess Player";
}

export function formatCommunityLineMove(move: CommunityPuzzleLineMove) {
  return move.color === "w"
    ? `${move.moveNumber}. ${move.san}`
    : `${move.moveNumber}... ${move.san}`;
}

function coerceCommunityPuzzleLineMove(
  value: unknown,
): CommunityPuzzleLineMove | null {
  if (!value || typeof value !== "object") return null;

  const maybeMove = value as Partial<CommunityPuzzleLineMove>;
  const san = typeof maybeMove.san === "string" ? maybeMove.san.trim() : "";
  const uci = typeof maybeMove.uci === "string" ? maybeMove.uci.trim() : "";
  const color = maybeMove.color;
  const moveNumber = Number(maybeMove.moveNumber);

  if (!san || !uci || (color !== "w" && color !== "b")) {
    return null;
  }

  if (!Number.isInteger(moveNumber) || moveNumber <= 0) {
    return null;
  }

  return {
    san,
    uci,
    color,
    moveNumber,
  };
}

export function coerceCommunityPuzzleData(
  value: unknown,
): CommunityPuzzleData | null {
  if (!value || typeof value !== "object") return null;

  const maybeData = value as Partial<CommunityPuzzleData>;
  const startFen =
    typeof maybeData.startFen === "string" ? maybeData.startFen.trim() : "";
  const orientation = maybeData.orientation;
  const previousMove = coerceCommunityPuzzleLineMove(maybeData.previousMove);
  const solution = Array.isArray(maybeData.solution)
    ? maybeData.solution
        .map((move) => coerceCommunityPuzzleLineMove(move))
        .filter((move): move is CommunityPuzzleLineMove => Boolean(move))
    : [];

  if (!startFen || (orientation !== "white" && orientation !== "black")) {
    return null;
  }

  if (solution.length === 0) {
    return null;
  }

  return {
    startFen,
    orientation,
    previousMove: previousMove ?? undefined,
    solution,
  };
}

function stripCommunityPuzzleDataHeader(pgn: string) {
  return pgn
    .replace(
      new RegExp(`\\[${COMMUNITY_PUZZLE_PGN_HEADER}\\s+"[^"]*"\\]\\s*`, "g"),
      "",
    )
    .trim();
}

export function attachCommunityPuzzleDataToPgn(
  pgn: string | null | undefined,
  puzzleData: CommunityPuzzleData | null | undefined,
) {
  const cleanPgn = stripCommunityPuzzleDataHeader((pgn ?? "").trim());
  const normalizedPuzzleData = coerceCommunityPuzzleData(puzzleData);

  if (!normalizedPuzzleData) {
    return cleanPgn || null;
  }

  const encoded = encodeURIComponent(JSON.stringify(normalizedPuzzleData));

  if (!cleanPgn) {
    return `[${COMMUNITY_PUZZLE_PGN_HEADER} "${encoded}"]`;
  }

  const segments = cleanPgn.split(/\n\s*\n/);

  if (segments.length > 1) {
    const [headers, ...rest] = segments;
    return `${headers}\n[${COMMUNITY_PUZZLE_PGN_HEADER} "${encoded}"]\n\n${rest.join("\n\n")}`.trim();
  }

  return `[${COMMUNITY_PUZZLE_PGN_HEADER} "${encoded}"]\n\n${cleanPgn}`.trim();
}

export function extractCommunityPuzzleData(
  pgn: string | null | undefined,
): CommunityPuzzleData | null {
  if (!pgn) return null;

  const match = pgn.match(
    new RegExp(`\\[${COMMUNITY_PUZZLE_PGN_HEADER}\\s+"([^"]*)"\\]`),
  );

  if (!match?.[1]) {
    return null;
  }

  try {
    return coerceCommunityPuzzleData(JSON.parse(decodeURIComponent(match[1])));
  } catch {
    return null;
  }
}

export function slugifyCommunityTitle(title: string) {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
}

export function createUniqueCommunitySlug(
  title: string,
  existingSlugs: Iterable<string>,
) {
  const taken = new Set(existingSlugs);
  const base = slugifyCommunityTitle(title) || "position";
  if (!taken.has(base)) return base;

  let i = 2;
  while (taken.has(`${base}-${i}`)) i += 1;
  return `${base}-${i}`;
}

export function normalizeTags(input: string[] | string | null | undefined) {
  const raw = Array.isArray(input)
    ? input
    : typeof input === "string"
      ? input.split(",")
      : [];

  return raw
    .map((tag) => tag.trim().toLowerCase())
    .filter(Boolean)
    .slice(0, 8);
}

export function defaultCollectionKey(
  kind: CommunityPostKind,
  sourceType: CommunitySourceType,
) {
  if (kind === "puzzle") return "my-puzzles-from-real-games";
  if (kind === "opening") return "opening-spots-i-keep-studying";
  if (sourceType === "endgame-scan") return "endgames-i-learned-from";
  if (sourceType === "analysis") return "positions-i-asked-for-help-on";
  return "shared-positions";
}

export function computeCommunityHotScore(post: {
  likesCount: number;
  commentsCount: number;
  savesCount: number;
  createdAt: Date | string | null;
}) {
  const createdAt =
    post.createdAt instanceof Date
      ? post.createdAt
      : post.createdAt
        ? new Date(post.createdAt)
        : new Date();
  const ageHours = Math.max(
    1,
    (Date.now() - createdAt.getTime()) / (1000 * 60 * 60),
  );
  const engagement =
    post.likesCount * 3 + post.commentsCount * 5 + post.savesCount * 4;
  return Number((engagement / Math.pow(ageHours + 2, 1.15)).toFixed(4));
}

export function deriveFenFromInput({
  fen,
  pgn,
}: {
  fen?: string | null;
  pgn?: string | null;
}) {
  const fenValue = fen?.trim();
  if (fenValue) {
    try {
      const chess = new Chess(fenValue);
      return { fen: chess.fen(), pgn: pgn?.trim() || null, error: null };
    } catch {
      return { fen: null, pgn: null, error: "Invalid FEN." };
    }
  }

  const pgnValue = pgn?.trim();
  if (pgnValue) {
    const chess = new Chess();
    try {
      chess.loadPgn(pgnValue);
      return { fen: chess.fen(), pgn: pgnValue, error: null };
    } catch {
      return { fen: null, pgn: null, error: "Invalid PGN." };
    }
  }

  return { fen: null, pgn: null, error: "Provide a FEN or PGN." };
}
