import { Chess, type PieceSymbol } from "chess.js";

export type MoveClassification =
  | "brilliant"
  | "best"
  | "good"
  | "book"
  | "inaccuracy"
  | "mistake"
  | "blunder";

export const MOVE_CLASSIFICATION_LABELS: Record<MoveClassification, string> = {
  brilliant: "Brilliant",
  best: "Best",
  good: "Good",
  book: "Book",
  inaccuracy: "Inaccuracy",
  mistake: "Mistake",
  blunder: "Blunder",
};

export const MOVE_CLASSIFICATION_SHORT_LABELS: Record<
  MoveClassification,
  string
> = {
  brilliant: "!!",
  best: "!",
  good: "✓",
  book: "DB",
  inaccuracy: "?!",
  mistake: "?",
  blunder: "??",
};

export const MOVE_CLASSIFICATION_EMOJI: Record<MoveClassification, string> = {
  brilliant: "💎",
  best: "✅",
  good: "👍",
  book: "📖",
  inaccuracy: "⚠️",
  mistake: "❌",
  blunder: "💀",
};

export const MOVE_CLASSIFICATION_COLORS: Record<MoveClassification, string> = {
  brilliant: "text-cyan-300",
  best: "text-emerald-300",
  good: "text-emerald-200/90",
  book: "text-slate-300",
  inaccuracy: "text-amber-300",
  mistake: "text-orange-300",
  blunder: "text-red-300",
};

export const MOVE_CLASSIFICATION_BG: Record<MoveClassification, string> = {
  brilliant: "bg-cyan-500/15",
  best: "bg-emerald-500/15",
  good: "bg-emerald-500/10",
  book: "bg-white/[0.05]",
  inaccuracy: "bg-amber-500/15",
  mistake: "bg-orange-500/15",
  blunder: "bg-red-500/15",
};

export const MOVE_CLASSIFICATION_BORDER: Record<MoveClassification, string> = {
  brilliant: "border-cyan-500/30",
  best: "border-emerald-500/25",
  good: "border-emerald-500/15",
  book: "border-white/[0.08]",
  inaccuracy: "border-amber-500/25",
  mistake: "border-orange-500/25",
  blunder: "border-red-500/30",
};

export const MOVE_CLASSIFICATION_BADGE_FILL: Record<
  MoveClassification,
  string
> = {
  brilliant: "#06b6d4",
  best: "#10b981",
  good: "#34d399",
  book: "#94a3b8",
  inaccuracy: "#f59e0b",
  mistake: "#f97316",
  blunder: "#ef4444",
};

type MovePieceDetails = {
  san: string;
  piece: PieceSymbol;
  captured?: PieceSymbol;
  moveLosesMaterial: boolean;
  canBeTakenBack: boolean;
};

const PIECE_VALUES: Record<PieceSymbol, number> = {
  p: 1,
  n: 3,
  b: 3,
  r: 5,
  q: 9,
  k: 0,
};

function normalizeUci(move: string | null): {
  from: string;
  to: string;
  promotion?: PieceSymbol;
} | null {
  if (!move || !/^[a-h][1-8][a-h][1-8][qrbn]?$/.test(move)) {
    return null;
  }

  return {
    from: move.slice(0, 2),
    to: move.slice(2, 4),
    promotion: (move.slice(4, 5) || undefined) as PieceSymbol | undefined,
  };
}

function countAttackers(fen: string, targetSquare: string, color: "w" | "b") {
  const fenParts = fen.split(" ");
  if (fenParts.length < 2) return 0;
  fenParts[1] = color;

  try {
    const chess = new Chess(fenParts.join(" "));
    return chess
      .moves({ verbose: true })
      .filter((move) => move.to === targetSquare).length;
  } catch {
    return 0;
  }
}

function getMovePieceDetails(
  fenBefore: string,
  moveUci: string | null,
): MovePieceDetails | null {
  const parsed = normalizeUci(moveUci);
  if (!parsed) return null;

  try {
    const beforeChess = new Chess(fenBefore);
    const movingPiece = beforeChess.get(
      parsed.from as Parameters<Chess["get"]>[0],
    );
    if (!movingPiece) return null;

    const move = beforeChess.move({
      from: parsed.from,
      to: parsed.to,
      promotion: parsed.promotion,
    });
    if (!move) return null;

    const movedValue = PIECE_VALUES[move.piece];
    const capturedValue = move.captured ? PIECE_VALUES[move.captured] : 0;
    const moveLosesMaterial = movedValue - capturedValue >= 2;
    const canBeTakenBack =
      countAttackers(beforeChess.fen(), move.to, move.color === "w" ? "b" : "w") >
        0 &&
      countAttackers(beforeChess.fen(), move.to, move.color) === 0;

    return {
      san: move.san,
      piece: move.piece,
      captured: move.captured,
      moveLosesMaterial,
      canBeTakenBack,
    };
  } catch {
    return null;
  }
}

export function isBrilliantCandidate(fenBefore: string, moveUci: string | null) {
  const move = getMovePieceDetails(fenBefore, moveUci);
  if (!move) return false;
  return (
    move.moveLosesMaterial ||
    move.canBeTakenBack ||
    move.san.includes("x") ||
    move.san.includes("+") ||
    move.san.includes("#")
  );
}

export function isBookMove(moveIndex: number, cpLoss: number) {
  return moveIndex < 16 && cpLoss <= 12;
}

export function isBrilliantMove(args: {
  fenBefore: string;
  moveUci: string | null;
  cpLoss: number;
  evalBeforeMover: number;
  evalAfterMover: number;
  isBestMove: boolean;
  moveIndex?: number;
}) {
  const {
    fenBefore,
    moveUci,
    cpLoss,
    evalBeforeMover,
    evalAfterMover,
    isBestMove,
    moveIndex = 99,
  } = args;

  if (!isBestMove || cpLoss > 10 || isBookMove(moveIndex, cpLoss)) {
    return false;
  }

  if (evalBeforeMover >= 350 && evalAfterMover >= 350) {
    return false;
  }

  const move = getMovePieceDetails(fenBefore, moveUci);
  if (!move) return false;

  const isSacrifice = isBrilliantCandidate(fenBefore, moveUci);
  if (!isSacrifice) return false;

  const evalGain = evalAfterMover - evalBeforeMover;
  const foundWinningShot = evalAfterMover >= 180;
  const sharpPayoff = evalGain >= 90 || move.san.includes("+") || move.san.includes("#");
  const wasStillTense = evalBeforeMover <= 140;

  return sharpPayoff && (foundWinningShot || wasStillTense);
}

export function classifyMoveQuality(args: {
  cpLoss: number;
  isBestMove: boolean;
  evalBeforeMover: number;
  evalAfterMover: number;
  fenBefore: string;
  moveUci: string | null;
  moveIndex?: number;
}): MoveClassification {
  const {
    cpLoss,
    isBestMove,
    evalBeforeMover,
    evalAfterMover,
    fenBefore,
    moveUci,
    moveIndex = 99,
  } = args;

  if (isBookMove(moveIndex, cpLoss)) return "book";

  if (
    isBrilliantMove({
      fenBefore,
      moveUci,
      cpLoss,
      evalBeforeMover,
      evalAfterMover,
      isBestMove,
      moveIndex,
    })
  ) {
    return "brilliant";
  }

  if (isBestMove) return "best";

  const stillWinning = evalAfterMover >= 400;
  const wasWinning = evalBeforeMover >= 400;

  if (wasWinning && stillWinning) {
    if (cpLoss <= 50) return "good";
    if (cpLoss <= 200) return "inaccuracy";
    return "mistake";
  }

  if (wasWinning && evalAfterMover >= 200) {
    if (cpLoss <= 35) return "good";
    if (cpLoss <= 120) return "inaccuracy";
    if (cpLoss <= 300) return "mistake";
    return "blunder";
  }

  if (cpLoss <= 25) return "good";
  if (cpLoss <= 75) return "inaccuracy";
  if (cpLoss <= 200) return "mistake";
  return "blunder";
}

export function buildMoveQualityCommentary(args: {
  classification: MoveClassification;
  cpLoss: number;
  evalBefore: number;
  evalAfter: number;
  bestMoveSan?: string | null;
}) {
  const swing = ((args.evalAfter - args.evalBefore) / 100).toFixed(1);

  switch (args.classification) {
    case "brilliant":
      return "A best-move sacrifice or tactical shot that changes the character of the position.";
    case "best":
      return "You matched the engine's top choice here.";
    case "good":
      return "A solid move that kept the position under control.";
    case "book":
      return "Still inside book-level territory, so the engine treats this as theory-friendly.";
    case "inaccuracy":
      return `A small slip that cost about ${(args.cpLoss / 100).toFixed(1)} pawns (${swing.startsWith("-") ? swing : `+${swing}`} swing).`;
    case "mistake":
      return `A real miss that dropped about ${(args.cpLoss / 100).toFixed(1)} pawns${args.bestMoveSan ? `; ${args.bestMoveSan} was cleaner.` : "."}`;
    case "blunder":
      return `A heavy error that changed the evaluation by roughly ${(args.cpLoss / 100).toFixed(1)} pawns${args.bestMoveSan ? `; ${args.bestMoveSan} was the save.` : "."}`;
  }
}
