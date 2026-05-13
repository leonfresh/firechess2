"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { Chess, type Square } from "chess.js";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { Chessboard, type CbSquare } from "@/components/chessboard-compat";
import { EvalBar } from "@/components/eval-bar";
import { useSession } from "@/components/session-provider";
import { stockfishClient, type LocalEngineLine } from "@/lib/stockfish-client";
import {
  useBoardTheme,
  useCustomPieces,
  useShowCoordinates,
} from "@/lib/use-coins";
import { useBoardSize } from "@/lib/use-board-size";
import {
  COMMUNITY_KIND_LABELS,
  COMMUNITY_SOURCE_LABELS,
  STARTING_FEN,
  defaultCollectionKey,
  deriveFenFromInput,
  formatCommunityLineMove,
  normalizeTags,
  type CommunityPostKind,
  type CommunityPuzzleData,
  type CommunityPuzzleLineMove,
  type CommunitySourceType,
} from "@/lib/community-shared";

type MoveClassification =
  | "best"
  | "good"
  | "inaccuracy"
  | "mistake"
  | "blunder";

type WorkbenchMove = {
  id: number;
  san: string;
  uci: string;
  color: "w" | "b";
  moveNumber: number;
  fenBefore: string;
  fenAfter: string;
  classification: MoveClassification | null;
  cpLoss: number | null;
  bestMoveSan: string | null;
};

type LoadedBoardState = {
  rootFen: string;
  currentFen: string;
  moves: WorkbenchMove[];
  error: string | null;
};

type ChessMoveResult = {
  san: string;
  from: string;
  to: string;
  color: "w" | "b";
  promotion?: string;
};

type PuzzleBuilderState = {
  startFen: string;
  startMoveCount: number;
};

const CLASSIFICATION_STYLES: Record<
  MoveClassification,
  {
    label: string;
    chip: string;
    accent: string;
  }
> = {
  best: {
    label: "Best",
    chip: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
    accent: "text-emerald-300",
  },
  good: {
    label: "Good",
    chip: "border-emerald-500/15 bg-emerald-500/5 text-emerald-200",
    accent: "text-emerald-200",
  },
  inaccuracy: {
    label: "Inaccuracy",
    chip: "border-amber-500/30 bg-amber-500/10 text-amber-300",
    accent: "text-amber-300",
  },
  mistake: {
    label: "Mistake",
    chip: "border-orange-500/30 bg-orange-500/10 text-orange-300",
    accent: "text-orange-300",
  },
  blunder: {
    label: "Blunder",
    chip: "border-red-500/30 bg-red-500/10 text-red-300",
    accent: "text-red-300",
  },
};

const CLASSIFICATION_BADGE_ASSETS: Record<MoveClassification, string> = {
  best: "/chess-badges/best.svg",
  good: "/chess-badges/good.svg",
  inaccuracy: "/chess-badges/inaccuracy.svg",
  mistake: "/chess-badges/mistake.svg",
  blunder: "/chess-badges/blunder.svg",
};

const LIVE_ANALYSIS_BADGES = [
  {
    label: "Best",
    chip: CLASSIFICATION_STYLES.best.chip,
    iconSrc: CLASSIFICATION_BADGE_ASSETS.best,
  },
  {
    label: "Good",
    chip: CLASSIFICATION_STYLES.good.chip,
    iconSrc: CLASSIFICATION_BADGE_ASSETS.good,
  },
  {
    label: "?! Inaccuracy",
    chip: CLASSIFICATION_STYLES.inaccuracy.chip,
    iconSrc: CLASSIFICATION_BADGE_ASSETS.inaccuracy,
  },
  {
    label: "? Mistake",
    chip: CLASSIFICATION_STYLES.mistake.chip,
    iconSrc: CLASSIFICATION_BADGE_ASSETS.mistake,
  },
  {
    label: "?? Blunder",
    chip: CLASSIFICATION_STYLES.blunder.chip,
    iconSrc: CLASSIFICATION_BADGE_ASSETS.blunder,
  },
] as const;

const REPORT_FEATURE_BADGES = [
  {
    label: "Accuracy",
    chip: "border-cyan-500/30 bg-cyan-500/10 text-cyan-300",
  },
  {
    label: "ACPL",
    chip: "border-sky-500/30 bg-sky-500/10 text-sky-300",
  },
  {
    label: "Move grades",
    chip: "border-amber-500/30 bg-amber-500/10 text-amber-300",
  },
  {
    label: "Best lines",
    chip: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
  },
] as const;

function normalizeEvalToWhite(fen: string, cp: number) {
  return fen.includes(" w ") ? cp : -cp;
}

function formatEval(cp: number | null) {
  if (cp === null) return "--";
  if (Math.abs(cp) >= 99000) {
    const n = 100000 - Math.abs(cp);
    const sign = cp > 0 ? "+" : "-";
    return n <= 0 ? `${sign}Mate` : `${sign}M${n}`;
  }
  const pawns = cp / 100;
  return `${pawns > 0 ? "+" : ""}${(Math.round(pawns * 10) / 10).toFixed(1)}`;
}

function formatLoss(cpLoss: number | null) {
  if (cpLoss === null) return "Unscored";
  if (cpLoss <= 0) return "No loss";
  return `${(Math.round((cpLoss / 100) * 10) / 10).toFixed(1)} pawns lost`;
}

function classifyMove(
  cpLoss: number,
  isBestMove: boolean,
  evalBeforeMover: number,
  evalAfterMover: number,
): MoveClassification {
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

function parseUci(uci: string | null) {
  if (!uci || uci.length < 4) return null;
  return {
    from: uci.slice(0, 2),
    to: uci.slice(2, 4),
    promotion: uci.slice(4, 5) || undefined,
  };
}

function uciToSan(fen: string, uci: string | null) {
  const parsed = parseUci(uci);
  if (!parsed) return null;

  try {
    const chess = new Chess(fen);
    const move = chess.move(
      parsed as { from: string; to: string; promotion?: string },
    );
    return move?.san ?? null;
  } catch {
    return null;
  }
}

function pvToSan(fen: string, pvMoves: string[]) {
  if (pvMoves.length === 0) return "";

  try {
    const chess = new Chess(fen);
    const sanMoves: string[] = [];

    for (const uci of pvMoves) {
      const parsed = parseUci(uci);
      if (!parsed) break;
      const move = chess.move(
        parsed as { from: string; to: string; promotion?: string },
      );
      if (!move) break;
      sanMoves.push(move.san);
    }

    return sanMoves.join(" ");
  } catch {
    return "";
  }
}

function createWorkbenchMove(
  id: number,
  move: ChessMoveResult,
  fenBefore: string,
  fenAfter: string,
): WorkbenchMove {
  const fullmove = Number(fenBefore.split(" ")[5] ?? "1") || 1;

  return {
    id,
    san: move.san,
    uci: `${move.from}${move.to}${move.promotion ?? ""}`,
    color: move.color,
    moveNumber: fullmove,
    fenBefore,
    fenAfter,
    classification: null,
    cpLoss: null,
    bestMoveSan: null,
  };
}

function serializePuzzleLineMove(move: WorkbenchMove): CommunityPuzzleLineMove {
  return {
    san: move.san,
    uci: move.uci,
    color: move.color,
    moveNumber: move.moveNumber,
  };
}

function tokenizeSanLine(line: string) {
  return line
    .replace(/\{[^}]*\}/g, " ")
    .replace(/\([^)]*\)/g, " ")
    .replace(/\$\d+/g, " ")
    .split(/\s+/)
    .map((token) => token.trim())
    .map((token) => token.replace(/^\d+\.(\.\.)?/, ""))
    .map((token) => token.replace(/^\.{3}/, ""))
    .filter(
      (token) => token.length > 0 && !/^(1-0|0-1|1\/2-1\/2|\*)$/.test(token),
    );
}

function buildWorkbenchMovesFromSanLine(
  startFen: string,
  sanLine: string,
  startingMoveId: number,
) {
  const tokens = tokenizeSanLine(sanLine);
  if (tokens.length === 0) {
    return {
      moves: [] as WorkbenchMove[],
      finalFen: startFen,
      error: "Enter at least one SAN move for the solution line.",
    };
  }

  try {
    const chess = new Chess(startFen);
    const moves: WorkbenchMove[] = [];
    let nextMoveId = startingMoveId;

    for (const token of tokens) {
      const fenBefore = chess.fen();
      const move = chess.move(token) as ChessMoveResult | null;

      if (!move) {
        return {
          moves: [] as WorkbenchMove[],
          finalFen: startFen,
          error: `\"${token}\" is not legal from the current puzzle position.`,
        };
      }

      nextMoveId += 1;
      moves.push(createWorkbenchMove(nextMoveId, move, fenBefore, chess.fen()));
    }

    return {
      moves,
      finalFen: chess.fen(),
      error: null,
    };
  } catch {
    return {
      moves: [] as WorkbenchMove[],
      finalFen: startFen,
      error: "The SAN line could not be parsed from this puzzle start.",
    };
  }
}

function buildPgnFromMoves(rootFen: string, moves: WorkbenchMove[]) {
  if (moves.length === 0) return null;

  try {
    const chess = rootFen === STARTING_FEN ? new Chess() : new Chess(rootFen);

    for (const move of moves) {
      const parsed = parseUci(move.uci);
      if (!parsed) return null;
      chess.move(parsed as { from: string; to: string; promotion?: string });
    }

    const pgn = chess.pgn();
    return pgn.trim() ? pgn : null;
  } catch {
    return null;
  }
}

function getPgnRootFen(pgnText: string) {
  const fenHeader = pgnText.match(/\[FEN\s+"([^"]+)"\]/)?.[1];
  const setUp = /\[SetUp\s+"1"\]/.test(pgnText);

  if (!fenHeader || !setUp) return STARTING_FEN;

  try {
    return new Chess(fenHeader).fen();
  } catch {
    return STARTING_FEN;
  }
}

function buildBoardStateFromPgn(pgnText: string): LoadedBoardState {
  const trimmed = pgnText.trim();
  if (!trimmed) {
    return {
      rootFen: STARTING_FEN,
      currentFen: STARTING_FEN,
      moves: [],
      error: "Provide a PGN to load.",
    };
  }

  try {
    const finalChess = new Chess();
    finalChess.loadPgn(trimmed);
    const history = finalChess.history({ verbose: true }) as Array<{
      from: string;
      to: string;
      san: string;
      color: "w" | "b";
      promotion?: string;
    }>;
    const rootFen = getPgnRootFen(trimmed);
    const replay = rootFen === STARTING_FEN ? new Chess() : new Chess(rootFen);
    const moves: WorkbenchMove[] = [];

    for (const [index, entry] of history.entries()) {
      const fenBefore = replay.fen();
      const result = replay.move({
        from: entry.from,
        to: entry.to,
        promotion: entry.promotion,
      }) as ChessMoveResult | null;

      if (!result) {
        return {
          rootFen: STARTING_FEN,
          currentFen: STARTING_FEN,
          moves: [],
          error: "The PGN could not be reconstructed move by move.",
        };
      }

      moves.push(
        createWorkbenchMove(index + 1, result, fenBefore, replay.fen()),
      );
    }

    return {
      rootFen,
      currentFen: replay.fen(),
      moves,
      error: null,
    };
  } catch {
    return {
      rootFen: STARTING_FEN,
      currentFen: STARTING_FEN,
      moves: [],
      error: "Invalid PGN.",
    };
  }
}

function buildBoardStateFromInput(
  inputMode: "fen" | "pgn",
  fenInput: string,
  pgnInput: string,
): LoadedBoardState {
  if (inputMode === "pgn") {
    return buildBoardStateFromPgn(pgnInput);
  }

  const derived = deriveFenFromInput({ fen: fenInput, pgn: null });
  if (!derived.fen) {
    return {
      rootFen: STARTING_FEN,
      currentFen: STARTING_FEN,
      moves: [],
      error: derived.error ?? "Invalid FEN.",
    };
  }

  return {
    rootFen: derived.fen,
    currentFen: derived.fen,
    moves: [],
    error: null,
  };
}

function hydrateInitialBoardState(initialFen: string, initialPgn: string) {
  if (initialPgn.trim()) {
    return buildBoardStateFromPgn(initialPgn);
  }

  if (initialFen.trim()) {
    return buildBoardStateFromInput("fen", initialFen, "");
  }

  return {
    rootFen: STARTING_FEN,
    currentFen: STARTING_FEN,
    moves: [],
    error: null,
  } satisfies LoadedBoardState;
}

export function CommunityPostComposer({
  initialKind = "position",
  initialSourceType = "manual",
  initialFen = "",
  initialPgn = "",
  initialTitle = "",
  initialPrompt = "",
  initialOpeningName = "",
  initialOrientation = "white",
  minimal = false,
}: {
  initialKind?: CommunityPostKind;
  initialSourceType?: CommunitySourceType;
  initialFen?: string;
  initialPgn?: string;
  initialTitle?: string;
  initialPrompt?: string;
  initialOpeningName?: string;
  initialOrientation?: "white" | "black";
  minimal?: boolean;
}) {
  const initialBoardState = useMemo(
    () => hydrateInitialBoardState(initialFen, initialPgn),
    [initialFen, initialPgn],
  );
  const quickPostMode = minimal && initialKind !== "puzzle";
  const streamlinedWorkbenchMode = !minimal;
  const compactComposerMode = quickPostMode || streamlinedWorkbenchMode;
  const router = useRouter();
  const boardInstanceId = useId();
  const { authenticated } = useSession();
  const boardTheme = useBoardTheme();
  const customPieces = useCustomPieces();
  const showCoordinates = useShowCoordinates();
  const { ref: boardRef, size: boardSize } = useBoardSize(
    compactComposerMode ? (quickPostMode ? 240 : 420) : 560,
    { evalBar: !compactComposerMode },
  );

  const [kind, setKind] = useState<CommunityPostKind>(initialKind);
  const [sourceType, setSourceType] =
    useState<CommunitySourceType>(initialSourceType);
  const [inputMode, setInputMode] = useState<"fen" | "pgn">(
    initialPgn ? "pgn" : "fen",
  );
  const [fenInput, setFenInput] = useState(initialBoardState.currentFen);
  const [pgnInput, setPgnInput] = useState(initialPgn);
  const [rootFen, setRootFen] = useState(initialBoardState.rootFen);
  const [currentFen, setCurrentFen] = useState(initialBoardState.currentFen);
  const [moveHistory, setMoveHistory] = useState<WorkbenchMove[]>(
    initialBoardState.moves,
  );
  const [title, setTitle] = useState(initialTitle);
  const [prompt, setPrompt] = useState(initialPrompt);
  const [description, setDescription] = useState("");
  const [openingName, setOpeningName] = useState(initialOpeningName);
  const [orientation, setOrientation] = useState<"white" | "black">(
    initialOrientation,
  );
  const [tags, setTags] = useState("");
  const [selectedSquare, setSelectedSquare] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(
    initialBoardState.error,
  );
  const [publishError, setPublishError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [puzzleGuideOpen, setPuzzleGuideOpen] = useState(
    initialKind === "puzzle",
  );
  const [puzzleBuilder, setPuzzleBuilder] = useState<PuzzleBuilderState | null>(
    null,
  );
  const [quickPuzzleBuilderOpen, setQuickPuzzleBuilderOpen] = useState(false);
  const [quickPuzzleSanInput, setQuickPuzzleSanInput] = useState("");
  const [quickPuzzleSanError, setQuickPuzzleSanError] = useState<string | null>(
    null,
  );
  const [engineEnabled, setEngineEnabled] = useState(!compactComposerMode);
  const [engineDepth, setEngineDepth] = useState(12);
  const [engineBusy, setEngineBusy] = useState(false);
  const [engineError, setEngineError] = useState<string | null>(null);
  const [engineEvalWhite, setEngineEvalWhite] = useState<number | null>(null);
  const [engineTopLines, setEngineTopLines] = useState<LocalEngineLine[]>([]);

  useEffect(() => {
    setFenInput(currentFen);
  }, [currentFen]);

  const nextMoveIdRef = useRef(initialBoardState.moves.at(-1)?.id ?? 0);
  const analysisVersionRef = useRef(0);
  const boardSectionRef = useRef<HTMLElement | null>(null);
  const puzzleBuilderSectionRef = useRef<HTMLElement | null>(null);
  const loadSectionRef = useRef<HTMLElement | null>(null);
  const publishSectionRef = useRef<HTMLElement | null>(null);
  const autoFocusedPuzzleBuilderRef = useRef(false);

  const normalizedTags = useMemo(() => normalizeTags(tags), [tags]);
  const collectionKey = defaultCollectionKey(kind, sourceType);
  const currentChess = useMemo(() => {
    try {
      return new Chess(currentFen);
    } catch {
      return new Chess();
    }
  }, [currentFen]);
  const liveSideToMove = currentChess.turn() === "w" ? "White" : "Black";
  const latestMove = moveHistory.at(-1) ?? null;
  const latestMoveSquares = latestMove
    ? [latestMove.uci.slice(0, 2), latestMove.uci.slice(2, 4)]
    : null;
  const bestMoveUci = engineTopLines[0]?.bestMove ?? null;
  const bestMoveSan = useMemo(
    () => uciToSan(currentFen, bestMoveUci),
    [currentFen, bestMoveUci],
  );
  const puzzlePreviousMove = useMemo(() => {
    if (!puzzleBuilder) return null;
    return moveHistory[puzzleBuilder.startMoveCount - 1] ?? null;
  }, [moveHistory, puzzleBuilder]);
  const puzzleSolutionMoves = useMemo(
    () =>
      puzzleBuilder ? moveHistory.slice(puzzleBuilder.startMoveCount) : [],
    [moveHistory, puzzleBuilder],
  );
  const puzzleContextMoves = useMemo(
    () =>
      puzzleBuilder ? moveHistory.slice(0, puzzleBuilder.startMoveCount) : [],
    [moveHistory, puzzleBuilder],
  );
  const puzzleStartChess = useMemo(() => {
    if (!puzzleBuilder) return null;
    try {
      return new Chess(puzzleBuilder.startFen);
    } catch {
      return null;
    }
  }, [puzzleBuilder]);
  const puzzleSideToMove = puzzleStartChess
    ? puzzleStartChess.turn() === "w"
      ? "White"
      : "Black"
    : liveSideToMove;
  const generatedPgn = useMemo(
    () => buildPgnFromMoves(rootFen, moveHistory),
    [rootFen, moveHistory],
  );
  const puzzleContextPgn = useMemo(
    () =>
      puzzleBuilder ? buildPgnFromMoves(rootFen, puzzleContextMoves) : null,
    [puzzleBuilder, puzzleContextMoves, rootFen],
  );
  const puzzleData = useMemo<CommunityPuzzleData | null>(() => {
    if (
      !puzzleBuilder ||
      !puzzlePreviousMove ||
      puzzleSolutionMoves.length === 0
    ) {
      return null;
    }

    return {
      startFen: puzzleBuilder.startFen,
      orientation,
      previousMove: serializePuzzleLineMove(puzzlePreviousMove),
      solution: puzzleSolutionMoves.map(serializePuzzleLineMove),
    };
  }, [orientation, puzzleBuilder, puzzlePreviousMove, puzzleSolutionMoves]);
  const analysisReady = Boolean(generatedPgn);
  const lineSourceLabel =
    rootFen === STARTING_FEN ? "Start position" : "Custom setup";
  const puzzleSetupReady = Boolean(puzzleBuilder && puzzlePreviousMove);
  const puzzlePromptReady =
    kind === "puzzle" && title.trim().length > 0 && prompt.trim().length > 0;
  const puzzleLineReady = puzzleSolutionMoves.length > 0;
  const puzzleNotesReady = description.trim().length > 0;
  const titlePlaceholder =
    kind === "puzzle"
      ? `${puzzleSideToMove} to move: can you find the tactic?`
      : "Missed winning tactic from my rapid game";
  const promptPlaceholder =
    kind === "puzzle"
      ? `${puzzleSideToMove} to move. Find the best move and explain the idea.`
      : "White to move. Why does the obvious recapture fail here?";
  const descriptionPlaceholder =
    kind === "puzzle"
      ? "Solution: give the winning move, the main line, and the tactical motif people should notice."
      : "Explain the move, the tactic, or the training idea you want people to take away.";
  const previewBoardSize = quickPostMode
    ? Math.min(boardSize, 240)
    : compactComposerMode
      ? Math.min(boardSize, 420)
      : boardSize;

  const scrollSectionIntoView = (element: HTMLElement | null) => {
    element?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const applyPuzzleDefaults = () => {
    setPuzzleGuideOpen(true);
    setKind("puzzle");
    setPublishError(null);

    if (!title.trim()) {
      setTitle(`${puzzleSideToMove} to move: can you find the tactic?`);
    }

    if (!prompt.trim()) {
      setPrompt(
        `${puzzleSideToMove} to move. Find the best move and explain the idea.`,
      );
    }
  };

  const openPuzzleBuilder = () => {
    if (compactComposerMode) {
      applyPuzzleDefaults();
      setQuickPuzzleBuilderOpen(true);
      setQuickPuzzleSanError(null);
      setQuickPuzzleSanInput(
        puzzleSolutionMoves.length > 0
          ? puzzleSolutionMoves.map((move) => move.san).join(" ")
          : "",
      );
      return;
    }

    applyPuzzleDefaults();
    scrollSectionIntoView(puzzleBuilderSectionRef.current);
  };

  const closeQuickPuzzleBuilder = () => {
    setQuickPuzzleBuilderOpen(false);
    setQuickPuzzleSanError(null);
  };

  const revertQuickPuzzleBuilder = () => {
    setQuickPuzzleBuilderOpen(false);
    setQuickPuzzleSanInput("");
    setQuickPuzzleSanError(null);
    setPuzzleBuilder(null);
    setKind(initialKind);
    setPublishError(null);
  };

  const applyQuickPuzzleSanLine = () => {
    if (!puzzleBuilder) {
      setQuickPuzzleSanError(
        "Lock the current board as the puzzle start before applying a SAN line.",
      );
      return;
    }

    const baseMoves = moveHistory.slice(0, puzzleBuilder.startMoveCount);
    const startingMoveId = baseMoves.at(-1)?.id ?? 0;
    const builtLine = buildWorkbenchMovesFromSanLine(
      puzzleBuilder.startFen,
      quickPuzzleSanInput,
      startingMoveId,
    );

    if (builtLine.error) {
      setQuickPuzzleSanError(builtLine.error);
      return;
    }

    setMoveHistory([...baseMoves, ...builtLine.moves]);
    setCurrentFen(builtLine.finalFen);
    setSelectedSquare(null);
    setPublishError(null);
    setQuickPuzzleSanError(null);
    nextMoveIdRef.current = builtLine.moves.at(-1)?.id ?? startingMoveId;

    builtLine.moves.forEach((move) => {
      void updateMoveClassification(move.id, move);
    });
  };

  useEffect(() => {
    if (minimal || initialKind !== "puzzle") return;
    if (autoFocusedPuzzleBuilderRef.current) return;

    autoFocusedPuzzleBuilderRef.current = true;

    const frame = window.requestAnimationFrame(() => {
      scrollSectionIntoView(puzzleBuilderSectionRef.current);
    });

    return () => window.cancelAnimationFrame(frame);
  }, [initialKind, minimal]);

  const clearPuzzleMode = () => {
    setPuzzleBuilder(null);
    setPublishError(null);
  };

  const startPuzzleModeFromCurrentPosition = () => {
    applyPuzzleDefaults();

    if (moveHistory.length === 0) {
      setPublishError(
        "Puzzles need the opponent's last move first. Load a PGN or play that move before you start puzzle mode.",
      );
      return;
    }

    setPuzzleBuilder({
      startFen: currentFen,
      startMoveCount: moveHistory.length,
    });
    setOrientation(currentChess.turn() === "w" ? "white" : "black");
  };

  const legalTargets = useMemo(() => {
    if (!selectedSquare) return [];

    try {
      return currentChess
        .moves({ square: selectedSquare as Square, verbose: true })
        .map((move) => move.to);
    } catch {
      return [];
    }
  }, [currentChess, selectedSquare]);

  const customSquareStyles = useMemo(() => {
    const styles: Record<string, React.CSSProperties> = {};

    if (latestMoveSquares) {
      styles[latestMoveSquares[0]] = {
        background: "rgba(34, 211, 238, 0.28)",
        backgroundColor: "rgba(34, 211, 238, 0.28)",
        borderRadius: "4px",
        boxShadow: "inset 0 0 0 2px rgba(125, 211, 252, 0.42)",
      };
      styles[latestMoveSquares[1]] = {
        backgroundColor: "rgba(249, 115, 22, 0.3)",
        borderRadius: "4px",
        boxShadow: "inset 0 0 0 2px rgba(253, 186, 116, 0.5)",
      };
    }

    if (selectedSquare) {
      styles[selectedSquare] = {
        ...(styles[selectedSquare] ?? {}),
        boxShadow: "inset 0 0 0 2px rgba(249,115,22,0.9)",
      };
    }

    for (const square of legalTargets) {
      styles[square] = {
        ...(styles[square] ?? {}),
        backgroundImage:
          "radial-gradient(circle, rgba(249,115,22,0.35) 22%, transparent 24%)",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      };
    }

    return styles;
  }, [latestMoveSquares, selectedSquare, legalTargets]);

  const workbenchCustomSquare = useMemo(() => {
    return ((props: any) => {
      const square = props?.square as string | undefined;
      const classification = latestMove?.classification;
      const destinationSquare = latestMove?.uci.slice(2, 4);
      const showBadge = Boolean(
        classification && destinationSquare && square === destinationSquare,
      );

      return (
        <div style={props?.style} className="relative h-full w-full">
          {props?.children}
          {showBadge && classification && (
            <img
              src={CLASSIFICATION_BADGE_ASSETS[classification]}
              alt=""
              aria-hidden="true"
              className="pointer-events-none absolute -right-0.5 -top-0.5 z-[40] h-5 w-5 drop-shadow-lg"
              title={CLASSIFICATION_STYLES[classification].label}
            />
          )}
        </div>
      );
    }) as any;
  }, [latestMove]);

  const engineLines = useMemo(
    () =>
      engineTopLines.map((line, index) => ({
        key: `${index}-${line.bestMove ?? "none"}`,
        eval: formatEval(normalizeEvalToWhite(currentFen, line.cp)),
        move: uciToSan(currentFen, line.bestMove) ?? line.bestMove ?? "--",
        pv: pvToSan(currentFen, line.pvMoves.slice(0, 5)),
      })),
    [currentFen, engineTopLines],
  );

  useEffect(() => {
    if (!engineEnabled) {
      setEngineBusy(false);
      setEngineError(null);
      setEngineTopLines([]);
      setEngineEvalWhite(null);
      return;
    }

    let active = true;
    const runId = ++analysisVersionRef.current;
    setEngineBusy(true);
    setEngineError(null);

    void (async () => {
      try {
        const lines = await stockfishClient.getTopMoves(
          currentFen,
          3,
          engineDepth,
        );
        if (!active || analysisVersionRef.current !== runId) return;

        setEngineTopLines(lines);
        setEngineEvalWhite(
          lines[0] ? normalizeEvalToWhite(currentFen, lines[0].cp) : 0,
        );
      } catch (error) {
        if (!active || analysisVersionRef.current !== runId) return;
        setEngineTopLines([]);
        setEngineEvalWhite(null);
        setEngineError(
          error instanceof Error
            ? error.message
            : "The engine could not analyse this position.",
        );
      } finally {
        if (active && analysisVersionRef.current === runId) {
          setEngineBusy(false);
        }
      }
    })();

    return () => {
      active = false;
    };
  }, [currentFen, engineDepth, engineEnabled]);

  useEffect(() => {
    if (kind === "puzzle") {
      setPuzzleGuideOpen(true);
    }
  }, [kind]);

  useEffect(() => {
    if (!compactComposerMode || kind !== "puzzle") return;

    setQuickPuzzleBuilderOpen(true);
  }, [compactComposerMode, kind]);

  useEffect(() => {
    if (puzzleBuilder && moveHistory.length < puzzleBuilder.startMoveCount) {
      setPuzzleBuilder(null);
      setPublishError(
        "Puzzle mode was cleared because you rewound before the marked start position. Start puzzle mode again on the new position.",
      );
    }
  }, [moveHistory.length, puzzleBuilder]);

  const updateMoveClassification = async (
    moveId: number,
    move: WorkbenchMove,
  ) => {
    if (!engineEnabled) return;

    try {
      const [beforeEval, afterEval] = await Promise.all([
        stockfishClient.evaluateFen(move.fenBefore, engineDepth),
        stockfishClient.evaluateFen(move.fenAfter, engineDepth),
      ]);

      if (!beforeEval) return;

      const evalBeforeWhite = normalizeEvalToWhite(
        move.fenBefore,
        beforeEval.cp,
      );
      const evalAfterWhite = afterEval
        ? normalizeEvalToWhite(move.fenAfter, afterEval.cp)
        : evalBeforeWhite;
      const evalBeforeMover =
        move.color === "w" ? evalBeforeWhite : -evalBeforeWhite;
      const evalAfterMover =
        move.color === "w" ? evalAfterWhite : -evalAfterWhite;
      const cpLoss = Math.max(0, evalBeforeMover - evalAfterMover);
      const isBestMove = beforeEval.bestMove === move.uci;
      const classification = classifyMove(
        cpLoss,
        isBestMove,
        evalBeforeMover,
        evalAfterMover,
      );
      const bestMoveSanForEntry = uciToSan(move.fenBefore, beforeEval.bestMove);

      setMoveHistory((current) =>
        current.map((entry) =>
          entry.id === moveId
            ? {
                ...entry,
                classification,
                cpLoss,
                bestMoveSan: bestMoveSanForEntry,
              }
            : entry,
        ),
      );
    } catch {
      // Leave the move unscored when the engine is unavailable.
    }
  };

  const commitMove = (from: string, to: string, promotion = "q") => {
    try {
      const chess = new Chess(currentFen);
      const move = chess.move({
        from,
        to,
        promotion,
      }) as ChessMoveResult | null;
      if (!move) return false;

      const nextFen = chess.fen();
      const moveId = nextMoveIdRef.current + 1;
      nextMoveIdRef.current = moveId;
      const nextMove = createWorkbenchMove(moveId, move, currentFen, nextFen);

      setCurrentFen(nextFen);
      setMoveHistory((current) => [...current, nextMove]);
      setSelectedSquare(null);
      setPublishError(null);
      void updateMoveClassification(moveId, nextMove);
      return true;
    } catch {
      return false;
    }
  };

  const handleDrop = (sourceSquare: CbSquare, targetSquare: CbSquare) => {
    if (!targetSquare) return false;
    return commitMove(sourceSquare, targetSquare);
  };

  const handleSquareClick = (square: CbSquare) => {
    if (selectedSquare) {
      if (selectedSquare === square) {
        setSelectedSquare(null);
        return;
      }

      if (commitMove(selectedSquare, square)) {
        return;
      }
    }

    try {
      const piece = currentChess.get(square as Square);
      if (piece && piece.color === currentChess.turn()) {
        setSelectedSquare(square);
        return;
      }
    } catch {
      // Ignore bad square input and clear selection below.
    }

    setSelectedSquare(null);
  };

  const undoLastMove = () => {
    setMoveHistory((current) => {
      if (current.length === 0) return current;

      const next = current.slice(0, -1);
      setCurrentFen(next.at(-1)?.fenAfter ?? rootFen);
      return next;
    });
    setSelectedSquare(null);
    setPublishError(null);
  };

  const resetToStartPosition = () => {
    nextMoveIdRef.current = 0;
    setRootFen(STARTING_FEN);
    setCurrentFen(STARTING_FEN);
    setMoveHistory([]);
    setPuzzleBuilder(null);
    setSelectedSquare(null);
    setLoadError(null);
    setFenInput(STARTING_FEN);
    setPgnInput("");
    setInputMode("fen");
  };

  const loadIntoWorkbench = () => {
    const loaded = buildBoardStateFromInput(inputMode, fenInput, pgnInput);
    if (loaded.error) {
      setLoadError(loaded.error);
      return;
    }

    nextMoveIdRef.current = loaded.moves.at(-1)?.id ?? 0;
    setRootFen(loaded.rootFen);
    setCurrentFen(loaded.currentFen);
    setMoveHistory(loaded.moves);
    setPuzzleBuilder(null);
    setSelectedSquare(null);
    setLoadError(null);
    setPublishError(null);
  };

  const runAnalysisReport = () => {
    if (!generatedPgn) return;

    try {
      sessionStorage.setItem("firechess-library-pgn", generatedPgn);
      sessionStorage.setItem("firechess-analyze-autostart", "workbench");
    } catch {
      // Fall back to navigation even if sessionStorage is unavailable.
    }

    router.push("/analyze");
  };

  const publishPost = async () => {
    if (!authenticated) {
      signIn(undefined, { callbackUrl: window.location.href });
      return;
    }

    if (kind === "puzzle") {
      if (!puzzleBuilder || !puzzlePreviousMove) {
        setPublishError(
          "Use Start Puzzle Mode on the exact puzzle start so FireChess can save the opponent's last move.",
        );
        return;
      }

      if (!puzzleContextPgn) {
        setPublishError(
          "Puzzles need PGN context ending on the opponent's last move. Load a PGN or build the setup move before publishing.",
        );
        return;
      }

      if (!puzzleData) {
        setPublishError(
          "Record the correct solution line after starting puzzle mode before you publish.",
        );
        return;
      }
    }

    setPublishError(null);
    setSubmitting(true);

    try {
      const resolvedTitle =
        title.trim() ||
        (kind === "puzzle"
          ? `${puzzleSideToMove} to move`
          : openingName.trim()
            ? `${openingName.trim()} snapshot`
            : "Interesting position");
      const resolvedPrompt =
        prompt.trim() ||
        (kind === "puzzle"
          ? `${puzzleSideToMove} to move. Find the best move.`
          : "What would you play here?");

      const res = await fetch("/api/community/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind,
          sourceType,
          title: resolvedTitle,
          prompt: resolvedPrompt,
          description,
          fen: kind === "puzzle" ? puzzleBuilder?.startFen : currentFen,
          pgn:
            kind === "puzzle"
              ? (puzzleContextPgn ?? undefined)
              : (generatedPgn ?? undefined),
          puzzleData: kind === "puzzle" ? (puzzleData ?? undefined) : undefined,
          orientation,
          openingName,
          tags: normalizedTags,
          collectionKey,
          visibility: "public",
          previewMode: "board",
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to create post.");
      }

      router.push(`/community/${data.slug}`);
    } catch (error) {
      setPublishError(
        error instanceof Error ? error.message : "Something went wrong.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const boardStatus = currentChess.isCheckmate()
    ? `${currentChess.turn() === "w" ? "White" : "Black"} is checkmated`
    : currentChess.isStalemate()
      ? "Stalemate"
      : currentChess.isDraw()
        ? "Drawn position"
        : `${currentChess.turn() === "w" ? "White" : "Black"} to move${currentChess.isCheck() ? " · check" : ""}`;

  const bestMoveArrow = useMemo(() => {
    if (!engineEnabled) return [] as [string, string, string?][];
    const parsed = parseUci(bestMoveUci);
    if (!parsed) return [];
    return [[parsed.from, parsed.to, "rgba(249,115,22,0.85)"]];
  }, [bestMoveUci, engineEnabled]);

  if (compactComposerMode) {
    return (
      <div className="flex flex-col gap-5 md:flex-row md:items-start">
        <section
          className={`space-y-3 rounded-[2rem] border border-white/[0.08] bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.02))] p-3 sm:p-4 md:sticky md:top-0 md:flex-none ${quickPostMode ? "md:w-[320px]" : "md:w-[440px]"}`}
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-cyan-200/70">
                {quickPostMode ? "Board Preview" : "Board Workbench"}
              </p>
              <h2 className="mt-1.5 text-xl font-bold tracking-tight text-white sm:text-2xl">
                {quickPostMode ? "Preview board" : "Live board"}
              </h2>
              <p className="mt-1 hidden text-sm leading-relaxed text-slate-400 md:block">
                {quickPostMode
                  ? "Sample board is live. Edit it directly or swap in your own position in the setup panel."
                  : "Use the same light composer flow as the modal, just with more room for the board and optional advanced tools when you need them."}
              </p>
            </div>
            <span className="rounded-full border border-fuchsia-500/20 bg-fuchsia-500/10 px-3 py-1 text-xs font-semibold text-fuchsia-200">
              {COMMUNITY_KIND_LABELS[kind]}
            </span>
          </div>

          <div
            ref={boardRef}
            className="rounded-[1.75rem] border border-white/[0.08] bg-black/20 p-2.5"
          >
            <div
              className={`mx-auto overflow-hidden rounded-[1.5rem] border border-white/[0.08] shadow-[0_24px_60px_rgba(0,0,0,0.35)] ${quickPostMode ? "max-w-[320px]" : "max-w-[420px]"}`}
            >
              <Chessboard
                id={`community-workbench-${boardInstanceId}`}
                position={currentFen}
                boardOrientation={orientation}
                boardWidth={previewBoardSize}
                arePiecesDraggable
                showBoardNotation={false}
                customDarkSquareStyle={{
                  backgroundColor: boardTheme.darkSquare,
                }}
                customLightSquareStyle={{
                  backgroundColor: boardTheme.lightSquare,
                }}
                customPieces={customPieces}
                customSquareStyles={customSquareStyles}
                customSquare={workbenchCustomSquare}
                customArrows={[]}
                onPieceDrop={handleDrop}
                onSquareClick={handleSquareClick}
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-2 text-xs text-slate-300">
            <span className="rounded-full border border-cyan-500/20 bg-cyan-500/10 px-3 py-1 text-cyan-300">
              {quickPostMode
                ? "Preview ready"
                : analysisReady
                  ? "PGN ready"
                  : "Extended view"}
            </span>
            <span className="rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-1">
              {moveHistory.length} {moveHistory.length === 1 ? "ply" : "plies"}
            </span>
            <span className="rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-1">
              {lineSourceLabel}
            </span>
            {!quickPostMode ? (
              <span className="rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-1">
                {COMMUNITY_SOURCE_LABELS[sourceType]}
              </span>
            ) : null}
          </div>

          <p className="text-sm leading-relaxed text-slate-400">
            {boardStatus}
          </p>

          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={undoLastMove}
              disabled={moveHistory.length === 0}
              className="rounded-2xl border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-sm font-semibold text-slate-200 transition hover:border-white/[0.16] hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              Undo
            </button>
            <button
              type="button"
              onClick={() =>
                setOrientation((value) =>
                  value === "white" ? "black" : "white",
                )
              }
              className="rounded-2xl border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-sm font-semibold text-slate-200 transition hover:border-white/[0.16] hover:text-white"
            >
              Flip
            </button>
            <button
              type="button"
              onClick={resetToStartPosition}
              className="rounded-2xl border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-sm font-semibold text-slate-200 transition hover:border-white/[0.16] hover:text-white"
            >
              Reset
            </button>
          </div>
        </section>

        <section
          ref={publishSectionRef}
          className="min-w-0 rounded-[2rem] border border-white/[0.08] bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.02))] p-5 sm:p-6 md:flex-1"
        >
          {streamlinedWorkbenchMode ? (
            <div className="mb-4 rounded-[1.75rem] border border-white/[0.08] bg-white/[0.03] px-4 py-4 sm:px-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-cyan-200/70">
                    Composer
                  </p>
                  <h3 className="mt-1 text-xl font-bold tracking-tight text-white">
                    Board Workbench
                  </h3>
                  <p className="mt-1 text-sm leading-relaxed text-slate-400">
                    Same flow as the quick modal, but with a larger board and
                    optional extras tucked away below.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2 text-xs text-slate-300">
                  <span className="rounded-full border border-cyan-500/20 bg-cyan-500/10 px-3 py-1 text-cyan-300">
                    Streamlined
                  </span>
                  <span className="rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-1">
                    {kind === "puzzle" ? "Puzzle flow" : "Position flow"}
                  </span>
                </div>
              </div>
            </div>
          ) : null}

          <section
            ref={loadSectionRef}
            className="rounded-[1.75rem] border border-white/[0.08] bg-white/[0.03] p-4"
          >
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold text-white">
                  {quickPostMode ? "Enter FEN or PGN" : "Load a position"}
                </h3>
                <p className="mt-1 text-xs leading-relaxed text-slate-500">
                  {quickPostMode
                    ? "Replace the default preview board with your own position or line."
                    : "Paste a FEN or PGN only when you want to replace the live board on the left."}
                </p>
              </div>
              <span className="rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-1 text-[11px] text-slate-300">
                {quickPostMode ? "Visible by default" : "Board loader"}
              </span>
            </div>

            <div className="mb-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={openPuzzleBuilder}
                className="rounded-full border border-fuchsia-500/20 bg-fuchsia-500/10 px-4 py-2 text-sm font-semibold text-fuchsia-200 transition hover:border-fuchsia-400/40 hover:text-white"
              >
                Puzzle Builder
              </button>
              <button
                type="button"
                onClick={() => setInputMode("fen")}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${inputMode === "fen" ? "bg-white text-black" : "bg-white/[0.05] text-slate-300 hover:bg-white/[0.08] hover:text-white"}`}
              >
                FEN
              </button>
              <button
                type="button"
                onClick={() => setInputMode("pgn")}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${inputMode === "pgn" ? "bg-white text-black" : "bg-white/[0.05] text-slate-300 hover:bg-white/[0.08] hover:text-white"}`}
              >
                PGN
              </button>
            </div>

            {inputMode === "fen" ? (
              <label className="space-y-2">
                <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                  FEN
                </span>
                <textarea
                  rows={4}
                  value={fenInput}
                  onChange={(event) => setFenInput(event.target.value)}
                  placeholder="r1bq1rk1/pp1nbppp/2p1pn2/3p4/2PP4/2N1PN2/PPQ2PPP/R1B1KB1R w KQ - 0 8"
                  className="w-full rounded-2xl border border-white/[0.08] bg-black/20 px-4 py-3 font-mono text-sm text-white placeholder:text-slate-500 focus:border-orange-500/40 focus:outline-none"
                />
              </label>
            ) : (
              <label className="space-y-2">
                <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                  PGN
                </span>
                <textarea
                  rows={5}
                  value={pgnInput}
                  onChange={(event) => setPgnInput(event.target.value)}
                  placeholder="1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6"
                  className="w-full rounded-2xl border border-white/[0.08] bg-black/20 px-4 py-3 font-mono text-sm text-white placeholder:text-slate-500 focus:border-orange-500/40 focus:outline-none"
                />
              </label>
            )}

            <div className="mt-4 flex items-center justify-between gap-3">
              <p className="text-xs leading-relaxed text-slate-500">
                The preview board updates from the input above.
              </p>
              <button
                type="button"
                onClick={loadIntoWorkbench}
                className="rounded-full bg-gradient-to-r from-cyan-500 to-sky-500 px-4 py-2 text-sm font-semibold text-white transition hover:brightness-110"
              >
                Update preview
              </button>
            </div>

            {loadError ? (
              <p className="mt-3 text-sm text-red-400">{loadError}</p>
            ) : null}
          </section>

          {quickPuzzleBuilderOpen ? (
            <section className="mt-4 rounded-[1.75rem] border border-fuchsia-500/20 bg-[radial-gradient(circle_at_top,_rgba(217,70,239,0.14),_rgba(15,23,42,0.86)_52%,_rgba(2,6,23,0.96)_100%)] p-4 sm:p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-fuchsia-200/80">
                    Puzzle Builder
                  </p>
                  <h3 className="mt-1 text-lg font-bold text-white">
                    Lock the start, then add the exact line
                  </h3>
                  <p className="mt-1 text-sm leading-relaxed text-slate-300">
                    Keep the current board on the solver position after the
                    opponent's last move. Then either drag the continuation on
                    the preview board or paste the SAN line here.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={closeQuickPuzzleBuilder}
                  className="rounded-full border border-white/[0.08] bg-white/[0.04] px-3 py-1.5 text-xs font-semibold text-slate-300 transition hover:text-white"
                >
                  Close
                </button>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={startPuzzleModeFromCurrentPosition}
                  disabled={moveHistory.length === 0}
                  className="rounded-full border border-fuchsia-500/25 bg-fuchsia-500/12 px-3 py-1.5 text-xs font-semibold text-fuchsia-100 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {puzzleBuilder
                    ? "Restart from current board"
                    : "Use current board as puzzle start"}
                </button>
                {puzzleBuilder ? (
                  <button
                    type="button"
                    onClick={clearPuzzleMode}
                    className="rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-1.5 text-xs font-semibold text-slate-300 transition hover:text-white"
                  >
                    Clear puzzle line
                  </button>
                ) : null}
                <button
                  type="button"
                  onClick={revertQuickPuzzleBuilder}
                  className="rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-1.5 text-xs font-semibold text-slate-300 transition hover:text-white"
                >
                  Use regular post instead
                </button>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-white/[0.08] bg-black/15 px-4 py-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                    Puzzle start
                  </p>
                  {puzzleBuilder && puzzlePreviousMove ? (
                    <>
                      <p className="mt-2 text-sm font-semibold text-white">
                        {puzzleSideToMove} to move after{" "}
                        {formatCommunityLineMove(
                          serializePuzzleLineMove(puzzlePreviousMove),
                        )}
                      </p>
                      <p className="mt-1 break-all font-mono text-[11px] text-slate-400">
                        {puzzleBuilder.startFen}
                      </p>
                    </>
                  ) : (
                    <p className="mt-2 text-sm leading-relaxed text-slate-400">
                      Load a PGN or make the opponent's last move on the preview
                      board first, then lock this exact board as the puzzle
                      start.
                    </p>
                  )}
                </div>

                <div className="rounded-2xl border border-white/[0.08] bg-black/15 px-4 py-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                    Recorded solution
                  </p>
                  {puzzleSolutionMoves.length > 0 ? (
                    <>
                      <p className="mt-2 text-sm font-semibold text-white">
                        {puzzleSolutionMoves.length}{" "}
                        {puzzleSolutionMoves.length === 1 ? "ply" : "plies"}{" "}
                        captured
                      </p>
                      <p className="mt-1 text-xs leading-relaxed text-slate-400">
                        {puzzleSolutionMoves
                          .map((move) =>
                            formatCommunityLineMove(
                              serializePuzzleLineMove(move),
                            ),
                          )
                          .join(" · ")}
                      </p>
                    </>
                  ) : (
                    <p className="mt-2 text-sm leading-relaxed text-slate-400">
                      No continuation yet. Record it on the preview board or
                      paste the SAN line below.
                    </p>
                  )}
                </div>
              </div>

              <label className="mt-4 block space-y-2">
                <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                  Solution line in SAN
                </span>
                <textarea
                  rows={3}
                  value={quickPuzzleSanInput}
                  onChange={(event) =>
                    setQuickPuzzleSanInput(event.target.value)
                  }
                  placeholder="Qh5+ Kd7 Qf7#"
                  className="w-full rounded-2xl border border-white/[0.08] bg-black/20 px-4 py-3 font-mono text-sm text-white placeholder:text-slate-500 focus:border-fuchsia-500/40 focus:outline-none"
                />
              </label>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={applyQuickPuzzleSanLine}
                  disabled={!puzzleBuilder}
                  className="rounded-full border border-fuchsia-500/25 bg-fuchsia-500/12 px-4 py-2 text-sm font-semibold text-fuchsia-100 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Apply SAN line
                </button>
                <p className="text-xs leading-relaxed text-slate-400">
                  Board moves and SAN input both update the same saved solution
                  line.
                </p>
              </div>

              {quickPuzzleSanError ? (
                <p className="mt-3 text-sm text-red-400">
                  {quickPuzzleSanError}
                </p>
              ) : null}
            </section>
          ) : null}

          <div className="flex flex-wrap gap-2 text-xs">
            <span className="rounded-full border border-fuchsia-500/20 bg-fuchsia-500/10 px-3 py-1 text-fuchsia-200">
              {COMMUNITY_KIND_LABELS[kind]}
            </span>
            <span className="rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-1 text-slate-300">
              {COMMUNITY_SOURCE_LABELS[sourceType]}
            </span>
          </div>

          <div className="mt-6 grid gap-4">
            <label className="space-y-2">
              <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                Title
              </span>
              <input
                type="text"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder={titlePlaceholder}
                className="w-full rounded-2xl border border-white/[0.08] bg-black/20 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-orange-500/40 focus:outline-none"
              />
            </label>

            <label className="space-y-2">
              <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                Caption
              </span>
              <textarea
                rows={4}
                value={prompt}
                onChange={(event) => setPrompt(event.target.value)}
                placeholder={promptPlaceholder}
                className="w-full rounded-2xl border border-white/[0.08] bg-black/20 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-orange-500/40 focus:outline-none"
              />
            </label>

            <label className="space-y-2">
              <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                Optional notes
              </span>
              <textarea
                rows={4}
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder={descriptionPlaceholder}
                className="w-full rounded-2xl border border-white/[0.08] bg-black/20 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-orange-500/40 focus:outline-none"
              />
            </label>

            <details className="rounded-[1.5rem] border border-white/[0.08] bg-black/15 px-4 py-3">
              <summary className="cursor-pointer list-none text-sm font-semibold text-slate-200">
                Optional metadata
              </summary>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <label className="space-y-2">
                  <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                    Opening name
                  </span>
                  <input
                    type="text"
                    value={openingName}
                    onChange={(event) => setOpeningName(event.target.value)}
                    placeholder="Italian Game"
                    className="w-full rounded-2xl border border-white/[0.08] bg-black/20 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-orange-500/40 focus:outline-none"
                  />
                </label>

                <label className="space-y-2">
                  <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                    Tags
                  </span>
                  <input
                    type="text"
                    value={tags}
                    onChange={(event) => setTags(event.target.value)}
                    placeholder="fork, rapid, opening"
                    className="w-full rounded-2xl border border-white/[0.08] bg-black/20 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-orange-500/40 focus:outline-none"
                  />
                </label>
              </div>
            </details>
          </div>

          <div className="mt-5 grid gap-3 rounded-[1.5rem] border border-white/[0.08] bg-black/15 p-4 sm:grid-cols-2">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                Snapshot
              </p>
              <p className="mt-1 text-sm font-semibold text-white">
                {COMMUNITY_KIND_LABELS[kind]} ·{" "}
                {COMMUNITY_SOURCE_LABELS[sourceType]}
              </p>
              <p className="mt-1 text-xs text-slate-400">{boardStatus}</p>
              {kind === "puzzle" && puzzlePreviousMove ? (
                <p className="mt-1 text-xs text-slate-400">
                  Previous move:{" "}
                  {formatCommunityLineMove(
                    serializePuzzleLineMove(puzzlePreviousMove),
                  )}
                </p>
              ) : null}
              {kind === "puzzle" && puzzleSolutionMoves.length > 0 ? (
                <p className="mt-1 text-xs text-slate-400">
                  Solution:{" "}
                  {puzzleSolutionMoves
                    .map((move) =>
                      formatCommunityLineMove(serializePuzzleLineMove(move)),
                    )
                    .join(" · ")}
                </p>
              ) : null}
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                Board FEN
              </p>
              <p className="mt-1 break-all font-mono text-[11px] text-slate-400">
                {kind === "puzzle"
                  ? (puzzleBuilder?.startFen ?? currentFen)
                  : currentFen}
              </p>
            </div>
          </div>

          {streamlinedWorkbenchMode ? (
            <details className="mt-5 rounded-[1.5rem] border border-white/[0.08] bg-black/15 px-4 py-3">
              <summary className="cursor-pointer list-none text-sm font-semibold text-slate-200">
                Advanced tools
              </summary>

              <div className="mt-4 space-y-4">
                <div className="grid gap-4 xl:grid-cols-2">
                  <div className="rounded-2xl border border-cyan-500/15 bg-cyan-500/[0.04] p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h4 className="text-sm font-bold text-white">
                          Analysis report
                        </h4>
                        <p className="mt-1 text-xs leading-relaxed text-slate-400">
                          Send this PGN into the full analyzer when you want the
                          long-form report.
                        </p>
                      </div>
                      <span
                        className={`rounded-full border px-3 py-1 text-[11px] font-semibold ${
                          analysisReady
                            ? "border-cyan-500/30 bg-cyan-500/10 text-cyan-300"
                            : "border-white/[0.08] bg-white/[0.03] text-slate-400"
                        }`}
                      >
                        {analysisReady ? "Ready" : "Need PGN"}
                      </span>
                    </div>

                    <div className="mt-3 grid gap-3 sm:grid-cols-3">
                      <div className="rounded-2xl border border-white/[0.08] bg-black/20 px-3 py-3">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                          Line
                        </p>
                        <p className="mt-1 text-sm font-semibold text-white">
                          {moveHistory.length}{" "}
                          {moveHistory.length === 1 ? "ply" : "plies"}
                        </p>
                      </div>
                      <div className="rounded-2xl border border-white/[0.08] bg-black/20 px-3 py-3">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                          Root
                        </p>
                        <p className="mt-1 text-sm font-semibold text-white">
                          {lineSourceLabel}
                        </p>
                      </div>
                      <div className="rounded-2xl border border-white/[0.08] bg-black/20 px-3 py-3">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                          Engine
                        </p>
                        <p className="mt-1 text-sm font-semibold text-white">
                          {engineEnabled ? "Live" : "Manual"}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={runAnalysisReport}
                      disabled={!analysisReady}
                      className="mt-4 w-full rounded-2xl bg-gradient-to-r from-cyan-500 to-sky-500 px-4 py-3 text-sm font-semibold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {analysisReady
                        ? "Run analysis report"
                        : "Load PGN to analyze"}
                    </button>
                  </div>

                  <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4">
                    <div className="mb-4 flex items-center justify-between gap-3">
                      <div>
                        <h4 className="text-sm font-bold text-white">Engine</h4>
                        <p className="mt-1 text-xs text-slate-400">
                          Turn on live eval only when you want extra guidance.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setEngineEnabled((value) => !value)}
                        className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
                          engineEnabled
                            ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                            : "border-white/[0.08] bg-white/[0.03] text-slate-400 hover:text-white"
                        }`}
                      >
                        {engineEnabled ? "Engine On" : "Engine Off"}
                      </button>
                    </div>

                    <div className="mb-4 flex items-center gap-3">
                      <label className="min-w-0 flex-1 space-y-2">
                        <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                          Depth
                        </span>
                        <select
                          value={engineDepth}
                          onChange={(event) =>
                            setEngineDepth(Number(event.target.value))
                          }
                          disabled={!engineEnabled}
                          className="w-full rounded-2xl border border-white/[0.08] bg-black/20 px-4 py-3 text-sm text-white focus:border-orange-500/40 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {[8, 10, 12, 14, 16].map((depth) => (
                            <option key={depth} value={depth}>
                              Depth {depth}
                            </option>
                          ))}
                        </select>
                      </label>
                      <div className="rounded-2xl border border-white/[0.08] bg-black/15 px-4 py-3 text-right">
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                          Eval
                        </p>
                        <p className="mt-1 text-lg font-black text-white">
                          {formatEval(engineEvalWhite)}
                        </p>
                      </div>
                    </div>

                    {engineError ? (
                      <p className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                        {engineError}
                      </p>
                    ) : !engineEnabled ? (
                      <p className="rounded-2xl border border-white/[0.08] bg-black/15 px-4 py-3 text-sm text-slate-400">
                        The board stays fully interactive with the engine off.
                      </p>
                    ) : engineBusy ? (
                      <div className="space-y-2">
                        {Array.from({ length: 2 }).map((_, index) => (
                          <div
                            key={index}
                            className="animate-pulse rounded-2xl border border-white/[0.06] bg-black/15 px-4 py-3"
                          >
                            <div className="h-4 w-20 rounded bg-white/[0.08]" />
                            <div className="mt-2 h-3 w-full rounded bg-white/[0.05]" />
                          </div>
                        ))}
                      </div>
                    ) : engineLines.length > 0 ? (
                      <div className="space-y-2.5">
                        {engineLines.slice(0, 2).map((line, index) => (
                          <div
                            key={line.key}
                            className="rounded-2xl border border-white/[0.06] bg-black/15 px-4 py-3"
                          >
                            <div className="flex items-center justify-between gap-3">
                              <div>
                                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                                  {index === 0
                                    ? "Top line"
                                    : `Line ${index + 1}`}
                                </p>
                                <p className="mt-1 font-mono text-sm font-semibold text-white">
                                  {line.move}
                                </p>
                              </div>
                              <span className="text-sm font-bold text-orange-300">
                                {line.eval}
                              </span>
                            </div>
                            <p className="mt-2 text-xs leading-relaxed text-slate-400">
                              {line.pv || "No principal variation returned."}
                            </p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="rounded-2xl border border-white/[0.08] bg-black/15 px-4 py-3 text-sm text-slate-400">
                        No engine line available for this position yet.
                      </p>
                    )}
                  </div>
                </div>

                <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <div>
                      <h4 className="text-sm font-bold text-white">
                        Current line
                      </h4>
                      <p className="mt-1 text-xs text-slate-400">
                        Move grades and line history stay here when you need
                        them.
                      </p>
                    </div>
                    {latestMove?.classification ? (
                      <span
                        className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold ${CLASSIFICATION_STYLES[latestMove.classification].chip}`}
                      >
                        <img
                          src={
                            CLASSIFICATION_BADGE_ASSETS[
                              latestMove.classification
                            ]
                          }
                          alt=""
                          aria-hidden="true"
                          className="h-4 w-4 shrink-0"
                        />
                        {CLASSIFICATION_STYLES[latestMove.classification].label}
                      </span>
                    ) : null}
                  </div>

                  {moveHistory.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-white/[0.08] bg-white/[0.02] px-4 py-5 text-sm text-slate-500">
                      The workbench is live. Start moving pieces or load a PGN
                      to begin building a line.
                    </div>
                  ) : (
                    <div className="max-h-[18rem] space-y-2 overflow-y-auto pr-1">
                      {moveHistory.map((move) => {
                        const badge = move.classification
                          ? CLASSIFICATION_STYLES[move.classification]
                          : null;

                        return (
                          <div
                            key={move.id}
                            className="flex items-center justify-between gap-3 rounded-2xl border border-white/[0.06] bg-white/[0.02] px-3 py-2.5"
                          >
                            <div className="min-w-0">
                              <p className="truncate font-mono text-sm text-white">
                                {move.color === "w"
                                  ? `${move.moveNumber}. ${move.san}`
                                  : `${move.moveNumber}... ${move.san}`}
                              </p>
                              <p className="mt-0.5 truncate text-[11px] text-slate-500">
                                {move.bestMoveSan &&
                                move.bestMoveSan !== move.san
                                  ? `Engine preferred ${move.bestMoveSan}`
                                  : "Current line"}
                              </p>
                            </div>
                            <div className="text-right">
                              {badge ? (
                                <span
                                  className={`inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${badge.chip}`}
                                >
                                  <img
                                    src={
                                      CLASSIFICATION_BADGE_ASSETS[
                                        move.classification!
                                      ]
                                    }
                                    alt=""
                                    aria-hidden="true"
                                    className="h-4 w-4 shrink-0"
                                  />
                                  {badge.label}
                                </span>
                              ) : (
                                <span className="inline-flex rounded-full border border-white/[0.08] bg-white/[0.03] px-2.5 py-1 text-[11px] font-semibold text-slate-400">
                                  {engineEnabled ? "Pending" : "Manual"}
                                </span>
                              )}
                              <p className="mt-1 text-[11px] text-slate-500">
                                {formatLoss(move.cpLoss)}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </details>
          ) : null}

          <div className="mt-6 flex flex-col gap-4 border-t border-white/[0.08] pt-5 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs leading-relaxed text-slate-500">
              {streamlinedWorkbenchMode ? (
                "Advanced tools stay tucked away above so the workbench feels closer to the quick composer."
              ) : (
                <>
                  Need the full analyzer or a heavier board workflow? Open the{" "}
                  <a
                    href="/board"
                    className="font-semibold text-cyan-300 underline underline-offset-2 hover:text-cyan-200"
                  >
                    full board workbench
                  </a>
                  .
                </>
              )}
            </p>

            <button
              type="button"
              onClick={publishPost}
              disabled={submitting}
              className="rounded-full bg-gradient-to-r from-orange-500 to-amber-500 px-6 py-3 text-sm font-semibold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {authenticated
                ? submitting
                  ? "Publishing..."
                  : kind === "puzzle"
                    ? "Publish Puzzle"
                    : "Publish Post"
                : kind === "puzzle"
                  ? "Sign In to Publish Puzzle"
                  : "Sign In to Publish"}
            </button>
          </div>

          {publishError ? (
            <p className="mt-3 text-sm text-red-400">{publishError}</p>
          ) : null}
        </section>
      </div>
    );
  }

  return (
    <div
      className={`grid gap-6 ${quickPostMode ? "xl:grid-cols-[280px_minmax(0,1fr)]" : minimal ? "lg:grid-cols-[minmax(0,1fr)_340px]" : "lg:grid-cols-[minmax(0,1.2fr)_360px]"}`}
    >
      <section
        ref={boardSectionRef}
        className="rounded-3xl border border-white/[0.08] bg-white/[0.03] p-5 sm:p-6"
      >
        <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-3">
            <h2 className="text-2xl font-bold tracking-tight text-white">
              {quickPostMode
                ? "Quick community post"
                : minimal
                  ? "New Community Post"
                  : "Board Workbench"}
            </h2>
            <p className="max-w-2xl text-sm leading-relaxed text-slate-400">
              {quickPostMode
                ? "Use the small board preview, add a short caption, and publish. If you need puzzle setup or heavier editing, jump to the full board workbench."
                : minimal
                  ? "Start from the sample board, switch into puzzle mode only if you need it, and publish without the heavier workbench extras."
                  : "Build the line directly on the board, grade moves live, and send the finished PGN into the full analyzer when you want the report."}
            </p>
            <div className="flex flex-wrap gap-2 text-xs text-slate-300">
              <span className="rounded-full border border-cyan-500/20 bg-cyan-500/10 px-3 py-1 text-cyan-300">
                {analysisReady
                  ? "PGN ready"
                  : quickPostMode
                    ? "Preview ready"
                    : minimal
                      ? "Sample board live"
                      : "Sandbox mode"}
              </span>
              <span className="rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-1">
                {moveHistory.length}{" "}
                {moveHistory.length === 1 ? "ply" : "plies"}
              </span>
              <span className="rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-1">
                {lineSourceLabel}
              </span>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {quickPostMode ? (
              <>
                <button
                  type="button"
                  onClick={openPuzzleBuilder}
                  className="rounded-full border border-fuchsia-500/20 bg-fuchsia-500/10 px-4 py-2 text-sm font-semibold text-fuchsia-200 transition hover:border-fuchsia-400/40 hover:text-white"
                >
                  Puzzle Builder
                </button>
                <button
                  type="button"
                  onClick={() => scrollSectionIntoView(loadSectionRef.current)}
                  className="rounded-full border border-cyan-500/20 bg-cyan-500/10 px-4 py-2 text-sm font-semibold text-cyan-200 transition hover:border-cyan-400/40 hover:text-white"
                >
                  Change board
                </button>
                <button
                  type="button"
                  onClick={undoLastMove}
                  disabled={moveHistory.length === 0}
                  className="rounded-full border border-white/[0.08] bg-white/[0.03] px-4 py-2 text-sm font-semibold text-slate-200 transition hover:border-white/[0.16] hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Undo
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setOrientation((value) =>
                      value === "white" ? "black" : "white",
                    )
                  }
                  className="rounded-full border border-white/[0.08] bg-white/[0.03] px-4 py-2 text-sm font-semibold text-slate-200 transition hover:border-white/[0.16] hover:text-white"
                >
                  Flip
                </button>
                <button
                  type="button"
                  onClick={resetToStartPosition}
                  className="rounded-full border border-white/[0.08] bg-white/[0.03] px-4 py-2 text-sm font-semibold text-slate-200 transition hover:border-white/[0.16] hover:text-white"
                >
                  Reset
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={openPuzzleBuilder}
                  className="rounded-full border border-fuchsia-500/20 bg-fuchsia-500/10 px-4 py-2 text-sm font-semibold text-fuchsia-200 transition hover:border-fuchsia-400/40 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {puzzleBuilder ? "Review Puzzle Builder" : "Puzzle Builder"}
                </button>
                {puzzleBuilder ? (
                  <button
                    type="button"
                    onClick={clearPuzzleMode}
                    className="rounded-full border border-white/[0.08] bg-white/[0.03] px-4 py-2 text-sm font-semibold text-slate-200 transition hover:border-white/[0.16] hover:text-white"
                  >
                    Clear Puzzle
                  </button>
                ) : null}
                <button
                  type="button"
                  onClick={undoLastMove}
                  disabled={moveHistory.length === 0}
                  className="rounded-full border border-white/[0.08] bg-white/[0.03] px-4 py-2 text-sm font-semibold text-slate-200 transition hover:border-white/[0.16] hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Undo
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setOrientation((value) =>
                      value === "white" ? "black" : "white",
                    )
                  }
                  className="rounded-full border border-white/[0.08] bg-white/[0.03] px-4 py-2 text-sm font-semibold text-slate-200 transition hover:border-white/[0.16] hover:text-white"
                >
                  Flip
                </button>
                <button
                  type="button"
                  onClick={resetToStartPosition}
                  className="rounded-full border border-white/[0.08] bg-white/[0.03] px-4 py-2 text-sm font-semibold text-slate-200 transition hover:border-white/[0.16] hover:text-white"
                >
                  Start Position
                </button>
              </>
            )}
          </div>
        </div>

        <div
          ref={boardRef}
          className={`${quickPostMode ? "mx-auto max-w-[280px] rounded-3xl border border-white/[0.06] bg-black/15 p-3" : "rounded-3xl border border-white/[0.06] bg-black/15 p-3 sm:p-4"}`}
        >
          {quickPostMode ? (
            <div className="mx-auto min-w-0 overflow-hidden rounded-2xl border border-white/[0.08] shadow-2xl shadow-black/35">
              <Chessboard
                id={`community-workbench-${boardInstanceId}`}
                position={currentFen}
                boardOrientation={orientation}
                boardWidth={previewBoardSize}
                arePiecesDraggable
                showBoardNotation={false}
                customDarkSquareStyle={{
                  backgroundColor: boardTheme.darkSquare,
                }}
                customLightSquareStyle={{
                  backgroundColor: boardTheme.lightSquare,
                }}
                customPieces={customPieces}
                customSquareStyles={customSquareStyles}
                customSquare={workbenchCustomSquare}
                customArrows={[]}
                onPieceDrop={handleDrop}
                onSquareClick={handleSquareClick}
              />
            </div>
          ) : (
            <div className="flex items-start gap-2 sm:gap-3">
              <EvalBar
                evalCp={engineEnabled ? engineEvalWhite : null}
                height={boardSize}
              />
              <div className="min-w-0 overflow-hidden rounded-2xl border border-white/[0.08] shadow-2xl shadow-black/35">
                <Chessboard
                  id={`community-workbench-${boardInstanceId}`}
                  position={currentFen}
                  boardOrientation={orientation}
                  boardWidth={boardSize}
                  arePiecesDraggable
                  showBoardNotation={showCoordinates}
                  customDarkSquareStyle={{
                    backgroundColor: boardTheme.darkSquare,
                  }}
                  customLightSquareStyle={{
                    backgroundColor: boardTheme.lightSquare,
                  }}
                  customPieces={customPieces}
                  customSquareStyles={customSquareStyles}
                  customSquare={workbenchCustomSquare}
                  customArrows={bestMoveArrow}
                  onPieceDrop={handleDrop}
                  onSquareClick={handleSquareClick}
                />
              </div>
            </div>
          )}
        </div>

        <div
          className={`mt-4 flex flex-col gap-3 rounded-2xl border border-white/[0.06] bg-black/10 px-4 py-3 ${quickPostMode ? "" : "sm:flex-row sm:items-center sm:justify-between"}`}
        >
          <div>
            <p className="text-sm font-semibold text-white">{boardStatus}</p>
            <p className="text-xs text-slate-500">
              {moveHistory.length} {moveHistory.length === 1 ? "ply" : "plies"}
              {generatedPgn
                ? " loaded into the current line"
                : " in the current line"}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
            {quickPostMode ? (
              <>
                <span className="rounded-full border border-fuchsia-500/20 bg-fuchsia-500/10 px-3 py-1 text-fuchsia-200">
                  {COMMUNITY_KIND_LABELS[kind]}
                </span>
                <span className="rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-1">
                  {COMMUNITY_SOURCE_LABELS[sourceType]}
                </span>
              </>
            ) : (
              <>
                <span className="rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-1">
                  Engine {engineEnabled ? "on" : "off"}
                </span>
                <span className="rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-1">
                  Eval {formatEval(engineEvalWhite)}
                </span>
                {bestMoveSan ? (
                  <span className="rounded-full border border-orange-500/25 bg-orange-500/10 px-3 py-1 text-orange-300">
                    Best move {bestMoveSan}
                  </span>
                ) : null}
              </>
            )}
          </div>
        </div>

        {!quickPostMode ? (
          <section className="mt-5 rounded-3xl border border-white/[0.06] bg-black/10 p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-bold text-white">
                  Live move grades
                </h3>
                <p className="text-xs text-slate-500">
                  The board uses the same badge language as the full analysis
                  report while you build the line.
                </p>
              </div>
              {latestMove?.classification && (
                <span
                  className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold ${CLASSIFICATION_STYLES[latestMove.classification].chip}`}
                >
                  <img
                    src={CLASSIFICATION_BADGE_ASSETS[latestMove.classification]}
                    alt=""
                    aria-hidden="true"
                    className="h-4 w-4 shrink-0"
                  />
                  {CLASSIFICATION_STYLES[latestMove.classification].label}
                </span>
              )}
            </div>

            <div className="mb-4 flex flex-wrap gap-2">
              {LIVE_ANALYSIS_BADGES.map((badge) => (
                <span
                  key={badge.label}
                  className={`inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${badge.chip}`}
                >
                  <img
                    src={badge.iconSrc}
                    alt=""
                    aria-hidden="true"
                    className="h-4 w-4 shrink-0"
                  />
                  {badge.label}
                </span>
              ))}
            </div>

            {moveHistory.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-white/[0.08] bg-white/[0.02] px-4 py-6 text-sm text-slate-500">
                The workbench is live. Start moving pieces or load a PGN to
                begin building a line.
              </div>
            ) : (
              <div className="max-h-[22rem] space-y-2 overflow-y-auto pr-1">
                {moveHistory.map((move) => {
                  const badge = move.classification
                    ? CLASSIFICATION_STYLES[move.classification]
                    : null;

                  return (
                    <div
                      key={move.id}
                      className="flex items-center justify-between gap-3 rounded-2xl border border-white/[0.06] bg-white/[0.02] px-3 py-2.5"
                    >
                      <div className="min-w-0">
                        <p className="truncate font-mono text-sm text-white">
                          {move.color === "w"
                            ? `${move.moveNumber}. ${move.san}`
                            : `${move.moveNumber}... ${move.san}`}
                        </p>
                        <p className="mt-0.5 truncate text-[11px] text-slate-500">
                          {move.bestMoveSan && move.bestMoveSan !== move.san
                            ? `Engine preferred ${move.bestMoveSan}`
                            : "Current line"}
                        </p>
                      </div>
                      <div className="text-right">
                        {badge ? (
                          <span
                            className={`inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${badge.chip}`}
                          >
                            <img
                              src={
                                CLASSIFICATION_BADGE_ASSETS[
                                  move.classification!
                                ]
                              }
                              alt=""
                              aria-hidden="true"
                              className="h-4 w-4 shrink-0"
                            />
                            {badge.label}
                          </span>
                        ) : (
                          <span className="inline-flex rounded-full border border-white/[0.08] bg-white/[0.03] px-2.5 py-1 text-[11px] font-semibold text-slate-400">
                            {engineEnabled ? "Pending" : "Manual"}
                          </span>
                        )}
                        <p className="mt-1 text-[11px] text-slate-500">
                          {formatLoss(move.cpLoss)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        ) : null}
      </section>

      <aside className="space-y-5">
        {!quickPostMode ? (
          <section className="rounded-3xl border border-fuchsia-500/15 bg-[radial-gradient(circle_at_top,_rgba(217,70,239,0.14),_rgba(15,23,42,0.86)_52%,_rgba(2,6,23,0.96)_100%)] p-5">
            <div ref={puzzleBuilderSectionRef} />
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-bold text-white">Puzzle Builder</h3>
                <p className="text-sm leading-relaxed text-slate-300">
                  Mark the current board as the solver's start position, then
                  enter the winning line on the live board. FireChess saves the
                  opponent's last move plus verified SAN for the full solution.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setPuzzleGuideOpen((value) => !value)}
                  className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
                    puzzleGuideOpen
                      ? "border-fuchsia-500/30 bg-fuchsia-500/10 text-fuchsia-200"
                      : "border-white/[0.08] bg-white/[0.03] text-slate-300 hover:text-white"
                  }`}
                >
                  {puzzleGuideOpen ? "Hide steps" : "Show steps"}
                </button>
                <button
                  type="button"
                  onClick={startPuzzleModeFromCurrentPosition}
                  disabled={moveHistory.length === 0}
                  className="rounded-full border border-fuchsia-500/25 bg-fuchsia-500/12 px-3 py-1.5 text-xs font-semibold text-fuchsia-100 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {puzzleBuilder ? "Restart from current" : "Start puzzle mode"}
                </button>
              </div>
            </div>

            {puzzleBuilder && puzzlePreviousMove && (
              <div className="mt-4 rounded-2xl border border-fuchsia-500/20 bg-black/20 px-4 py-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-fuchsia-200/80">
                      Puzzle Start Locked
                    </p>
                    <p className="mt-1 text-sm font-semibold text-white">
                      {puzzleSideToMove} to move after{" "}
                      {formatCommunityLineMove(
                        serializePuzzleLineMove(puzzlePreviousMove),
                      )}
                    </p>
                  </div>
                  <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-[11px] font-semibold text-emerald-300">
                    SAN verified
                  </span>
                </div>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] px-3 py-3">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                      Start FEN
                    </p>
                    <p className="mt-1 break-all font-mono text-[11px] text-slate-300">
                      {puzzleBuilder.startFen}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] px-3 py-3">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                      Solution Line
                    </p>
                    <p className="mt-1 text-sm font-semibold text-white">
                      {puzzleSolutionMoves.length}{" "}
                      {puzzleSolutionMoves.length === 1 ? "ply" : "plies"}
                    </p>
                    <p className="mt-1 text-xs text-slate-400">
                      Every move below is generated and verified by chess.js
                      SAN.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {puzzleGuideOpen ? (
              <div className="mt-4 space-y-3">
                <div
                  className={`rounded-2xl border px-4 py-3 ${
                    puzzleSetupReady
                      ? "border-emerald-500/20 bg-emerald-500/[0.06]"
                      : "border-white/[0.08] bg-black/15"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                        Step 1
                      </p>
                      <p className="mt-1 text-sm font-semibold text-white">
                        Reach the puzzle start, then press Start Puzzle Mode
                      </p>
                      <p className="mt-1 text-xs leading-relaxed text-slate-400">
                        The board should be sitting on the exact solver
                        position, after the opponent's last move. Load a PGN or
                        play moves until that previous move is in the line, then
                        lock this board as the puzzle start.
                      </p>
                    </div>
                    <span
                      className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                        puzzleSetupReady
                          ? "bg-emerald-500/15 text-emerald-300"
                          : "bg-white/[0.06] text-slate-300"
                      }`}
                    >
                      {puzzleSetupReady ? "Done" : "Next"}
                    </span>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        scrollSectionIntoView(boardSectionRef.current)
                      }
                      className="rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-1.5 text-xs font-semibold text-slate-300 transition hover:text-white"
                    >
                      Jump to board
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        scrollSectionIntoView(loadSectionRef.current)
                      }
                      className="rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-1.5 text-xs font-semibold text-slate-300 transition hover:text-white"
                    >
                      Open FEN / PGN loader
                    </button>
                    <button
                      type="button"
                      onClick={startPuzzleModeFromCurrentPosition}
                      disabled={moveHistory.length === 0}
                      className="rounded-full border border-fuchsia-500/25 bg-fuchsia-500/10 px-3 py-1.5 text-xs font-semibold text-fuchsia-200 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Lock this as the puzzle start
                    </button>
                  </div>
                </div>

                <div
                  className={`rounded-2xl border px-4 py-3 ${
                    puzzleLineReady
                      ? "border-emerald-500/20 bg-emerald-500/[0.06]"
                      : "border-white/[0.08] bg-black/15"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                        Step 2
                      </p>
                      <p className="mt-1 text-sm font-semibold text-white">
                        Enter the correct line on the board for both sides
                      </p>
                      <p className="mt-1 text-xs leading-relaxed text-slate-400">
                        Once puzzle mode is active, every move you make after
                        that point becomes the saved solution line. FireChess
                        keeps the verified SAN notation for every move and
                        reply.
                      </p>
                    </div>
                    <span
                      className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                        puzzleLineReady
                          ? "bg-emerald-500/15 text-emerald-300"
                          : "bg-white/[0.06] text-slate-300"
                      }`}
                    >
                      {puzzleLineReady ? "Done" : "Next"}
                    </span>
                  </div>
                  <div className="mt-3 space-y-2">
                    {puzzleSolutionMoves.length === 0 ? (
                      <p className="text-xs text-slate-400">
                        No solution moves recorded yet. Start puzzle mode, then
                        play the correct continuation on the live board.
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {puzzleSolutionMoves.map((move) => (
                          <div
                            key={move.id}
                            className="flex items-center justify-between gap-3 rounded-2xl border border-white/[0.08] bg-white/[0.03] px-3 py-2"
                          >
                            <p className="font-mono text-sm text-white">
                              {formatCommunityLineMove(
                                serializePuzzleLineMove(move),
                              )}
                            </p>
                            <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-semibold text-emerald-300">
                              Verified SAN
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div
                  className={`rounded-2xl border px-4 py-3 ${
                    puzzlePromptReady && puzzleNotesReady
                      ? "border-emerald-500/20 bg-emerald-500/[0.06]"
                      : "border-white/[0.08] bg-black/15"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                        Step 3
                      </p>
                      <p className="mt-1 text-sm font-semibold text-white">
                        Write the prompt and explanation, then publish
                      </p>
                      <p className="mt-1 text-xs leading-relaxed text-slate-400">
                        The prompt is what solvers see first. Keep the full line
                        and the theme in the solution box so players can solve,
                        then review the explanation afterward.
                      </p>
                    </div>
                    <span
                      className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                        puzzlePromptReady && puzzleNotesReady
                          ? "bg-emerald-500/15 text-emerald-300"
                          : "bg-white/[0.06] text-slate-300"
                      }`}
                    >
                      {puzzlePromptReady && puzzleNotesReady ? "Ready" : "Next"}
                    </span>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={applyPuzzleDefaults}
                      className="rounded-full border border-fuchsia-500/25 bg-fuchsia-500/10 px-3 py-1.5 text-xs font-semibold text-fuchsia-200 transition hover:brightness-110"
                    >
                      Use puzzle defaults
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        scrollSectionIntoView(publishSectionRef.current)
                      }
                      className="rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-1.5 text-xs font-semibold text-slate-300 transition hover:text-white"
                    >
                      Review publish panel
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <p className="mt-4 text-xs leading-relaxed text-slate-400">
                Show the steps whenever you want a reminder of the puzzle flow.
              </p>
            )}
          </section>
        ) : null}

        {!minimal && (
          <>
            <section className="rounded-3xl border border-cyan-500/15 bg-[radial-gradient(circle_at_top,_rgba(34,211,238,0.16),_rgba(15,23,42,0.82)_55%,_rgba(2,6,23,0.96)_100%)] p-5">
              <div className="mb-4 flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-lg font-bold text-white">
                    Analysis report
                  </h3>
                  <p className="text-sm leading-relaxed text-slate-300">
                    Open the long-form analyzer with this PGN loaded and jump
                    straight into the report flow.
                  </p>
                </div>
                <span
                  className={`rounded-full border px-3 py-1 text-[11px] font-semibold ${
                    analysisReady
                      ? "border-cyan-500/30 bg-cyan-500/10 text-cyan-300"
                      : "border-white/[0.08] bg-white/[0.03] text-slate-400"
                  }`}
                >
                  {analysisReady ? "Report ready" : "Need PGN"}
                </span>
              </div>

              <div className="flex flex-wrap gap-2">
                {REPORT_FEATURE_BADGES.map((badge) => (
                  <span
                    key={badge.label}
                    className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${badge.chip}`}
                  >
                    {badge.label}
                  </span>
                ))}
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
                <div className="rounded-2xl border border-white/[0.08] bg-black/20 px-4 py-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                    Line
                  </p>
                  <p className="mt-1 text-sm font-semibold text-white">
                    {moveHistory.length}{" "}
                    {moveHistory.length === 1 ? "ply" : "plies"}
                  </p>
                </div>
                <div className="rounded-2xl border border-white/[0.08] bg-black/20 px-4 py-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                    Root
                  </p>
                  <p className="mt-1 text-sm font-semibold text-white">
                    {lineSourceLabel}
                  </p>
                </div>
                <div className="rounded-2xl border border-white/[0.08] bg-black/20 px-4 py-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                    Engine
                  </p>
                  <p className="mt-1 text-sm font-semibold text-white">
                    {engineEnabled ? "Live" : "Manual"}
                  </p>
                </div>
              </div>

              <p className="mt-4 text-xs leading-relaxed text-slate-300/80">
                {analysisReady
                  ? "The analyzer will load this PGN and auto-run the report so you land on the full breakdown, not an empty form."
                  : "Load a PGN or play through the game here first. Once the workbench has PGN context, the full report unlocks."}
              </p>

              <button
                type="button"
                onClick={runAnalysisReport}
                disabled={!analysisReady}
                className="mt-4 w-full rounded-2xl bg-gradient-to-r from-cyan-500 to-sky-500 px-4 py-3 text-sm font-semibold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {analysisReady ? "Run analysis report" : "Load PGN to analyze"}
              </button>
            </section>

            <section className="rounded-3xl border border-white/[0.08] bg-white/[0.03] p-5">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-lg font-bold text-white">Engine</h3>
                  <p className="text-sm text-slate-400">
                    Live analysis for the current board state.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setEngineEnabled((value) => !value)}
                  className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
                    engineEnabled
                      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                      : "border-white/[0.08] bg-white/[0.03] text-slate-400 hover:text-white"
                  }`}
                >
                  {engineEnabled ? "Engine On" : "Engine Off"}
                </button>
              </div>

              <div className="mb-4 flex items-center gap-3">
                <label className="min-w-0 flex-1 space-y-2">
                  <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                    Depth
                  </span>
                  <select
                    value={engineDepth}
                    onChange={(event) =>
                      setEngineDepth(Number(event.target.value))
                    }
                    disabled={!engineEnabled}
                    className="w-full rounded-2xl border border-white/[0.08] bg-black/20 px-4 py-3 text-sm text-white focus:border-orange-500/40 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {[8, 10, 12, 14, 16].map((depth) => (
                      <option key={depth} value={depth}>
                        Depth {depth}
                      </option>
                    ))}
                  </select>
                </label>
                <div className="rounded-2xl border border-white/[0.08] bg-black/15 px-4 py-3 text-right">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                    Eval
                  </p>
                  <p className="mt-1 text-lg font-black text-white">
                    {formatEval(engineEvalWhite)}
                  </p>
                </div>
              </div>

              {engineError ? (
                <p className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                  {engineError}
                </p>
              ) : !engineEnabled ? (
                <p className="rounded-2xl border border-white/[0.08] bg-black/15 px-4 py-3 text-sm text-slate-400">
                  The board stays fully interactive with the engine off. Turn it
                  back on when you want best lines and move badges.
                </p>
              ) : engineBusy ? (
                <div className="space-y-2">
                  {Array.from({ length: 3 }).map((_, index) => (
                    <div
                      key={index}
                      className="animate-pulse rounded-2xl border border-white/[0.06] bg-black/15 px-4 py-3"
                    >
                      <div className="h-4 w-20 rounded bg-white/[0.08]" />
                      <div className="mt-2 h-3 w-full rounded bg-white/[0.05]" />
                    </div>
                  ))}
                </div>
              ) : engineLines.length > 0 ? (
                <div className="space-y-2.5">
                  {engineLines.map((line, index) => (
                    <div
                      key={line.key}
                      className="rounded-2xl border border-white/[0.06] bg-black/15 px-4 py-3"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                            {index === 0 ? "Top line" : `Line ${index + 1}`}
                          </p>
                          <p className="mt-1 font-mono text-sm font-semibold text-white">
                            {line.move}
                          </p>
                        </div>
                        <span className="text-sm font-bold text-orange-300">
                          {line.eval}
                        </span>
                      </div>
                      <p className="mt-2 text-xs leading-relaxed text-slate-400">
                        {line.pv || "No principal variation returned."}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="rounded-2xl border border-white/[0.08] bg-black/15 px-4 py-3 text-sm text-slate-400">
                  No engine line available for this position yet.
                </p>
              )}
            </section>
          </>
        )}

        <section
          ref={loadSectionRef}
          className="rounded-3xl border border-white/[0.08] bg-white/[0.03] p-5"
        >
          {quickPostMode ? (
            <details className="rounded-2xl border border-white/[0.08] bg-black/15">
              <summary className="cursor-pointer list-none px-4 py-4">
                <p className="text-sm font-semibold text-white">
                  Change board preview
                </p>
                <p className="mt-1 text-xs leading-relaxed text-slate-500">
                  Paste a FEN or PGN only when you want to replace the sample
                  board.
                </p>
              </summary>

              <div className="border-t border-white/[0.08] px-4 py-4">
                <div className="mb-4 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setInputMode("fen")}
                    className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${inputMode === "fen" ? "bg-white text-black" : "bg-white/[0.05] text-slate-300 hover:bg-white/[0.08] hover:text-white"}`}
                  >
                    FEN
                  </button>
                  <button
                    type="button"
                    onClick={() => setInputMode("pgn")}
                    className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${inputMode === "pgn" ? "bg-white text-black" : "bg-white/[0.05] text-slate-300 hover:bg-white/[0.08] hover:text-white"}`}
                  >
                    PGN
                  </button>
                </div>

                {inputMode === "fen" ? (
                  <label className="space-y-2">
                    <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                      FEN
                    </span>
                    <textarea
                      rows={4}
                      value={fenInput}
                      onChange={(event) => setFenInput(event.target.value)}
                      placeholder="r1bq1rk1/pp1nbppp/2p1pn2/3p4/2PP4/2N1PN2/PPQ2PPP/R1B1KB1R w KQ - 0 8"
                      className="w-full rounded-2xl border border-white/[0.08] bg-black/20 px-4 py-3 font-mono text-sm text-white placeholder:text-slate-500 focus:border-orange-500/40 focus:outline-none"
                    />
                  </label>
                ) : (
                  <label className="space-y-2">
                    <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                      PGN
                    </span>
                    <textarea
                      rows={6}
                      value={pgnInput}
                      onChange={(event) => setPgnInput(event.target.value)}
                      placeholder="1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6"
                      className="w-full rounded-2xl border border-white/[0.08] bg-black/20 px-4 py-3 font-mono text-sm text-white placeholder:text-slate-500 focus:border-orange-500/40 focus:outline-none"
                    />
                  </label>
                )}

                <div className="mt-4 flex items-center justify-between gap-3">
                  <p className="text-xs leading-relaxed text-slate-500">
                    The publish action uses the live board preview on the left.
                  </p>
                  <button
                    type="button"
                    onClick={loadIntoWorkbench}
                    className="rounded-full bg-gradient-to-r from-cyan-500 to-sky-500 px-4 py-2 text-sm font-semibold text-white transition hover:brightness-110"
                  >
                    Update board
                  </button>
                </div>

                {loadError ? (
                  <p className="mt-3 text-sm text-red-400">{loadError}</p>
                ) : null}
              </div>
            </details>
          ) : (
            <>
              <div className="mb-4">
                <h3 className="text-lg font-bold text-white">
                  {minimal ? "Swap the sample board" : "Load a position"}
                </h3>
                <p className="text-sm text-slate-400">
                  {minimal
                    ? "The sample board is live by default. Paste a FEN or PGN only when you want to replace it."
                    : "Paste a FEN or PGN, then continue editing from that exact board."}
                </p>
              </div>

              <div className="mb-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setInputMode("fen")}
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${inputMode === "fen" ? "bg-white text-black" : "bg-white/[0.05] text-slate-300 hover:bg-white/[0.08] hover:text-white"}`}
                >
                  FEN
                </button>
                <button
                  type="button"
                  onClick={() => setInputMode("pgn")}
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${inputMode === "pgn" ? "bg-white text-black" : "bg-white/[0.05] text-slate-300 hover:bg-white/[0.08] hover:text-white"}`}
                >
                  PGN
                </button>
              </div>

              {inputMode === "fen" ? (
                <label className="space-y-2">
                  <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                    FEN
                  </span>
                  <textarea
                    rows={5}
                    value={fenInput}
                    onChange={(event) => setFenInput(event.target.value)}
                    placeholder="r1bq1rk1/pp1nbppp/2p1pn2/3p4/2PP4/2N1PN2/PPQ2PPP/R1B1KB1R w KQ - 0 8"
                    className="w-full rounded-2xl border border-white/[0.08] bg-black/20 px-4 py-3 font-mono text-sm text-white placeholder:text-slate-500 focus:border-orange-500/40 focus:outline-none"
                  />
                </label>
              ) : (
                <label className="space-y-2">
                  <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                    PGN
                  </span>
                  <textarea
                    rows={8}
                    value={pgnInput}
                    onChange={(event) => setPgnInput(event.target.value)}
                    placeholder="1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6"
                    className="w-full rounded-2xl border border-white/[0.08] bg-black/20 px-4 py-3 font-mono text-sm text-white placeholder:text-slate-500 focus:border-orange-500/40 focus:outline-none"
                  />
                </label>
              )}

              <div className="mt-4 flex items-center justify-between gap-3">
                <p className="text-xs leading-relaxed text-slate-500">
                  The publish action uses the live board state on the left, not
                  the raw text box.
                </p>
                <button
                  type="button"
                  onClick={loadIntoWorkbench}
                  className="rounded-full bg-gradient-to-r from-cyan-500 to-sky-500 px-4 py-2 text-sm font-semibold text-white transition hover:brightness-110"
                >
                  Load onto board
                </button>
              </div>

              {loadError ? (
                <p className="mt-3 text-sm text-red-400">{loadError}</p>
              ) : null}
            </>
          )}
        </section>

        <section
          ref={publishSectionRef}
          className="rounded-3xl border border-white/[0.08] bg-white/[0.03] p-5"
        >
          {quickPostMode ? (
            <>
              <div className="mb-4 flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-lg font-bold text-white">
                    {kind === "puzzle"
                      ? "Quick puzzle details"
                      : "Quick post details"}
                  </h3>
                  <p className="text-sm text-slate-400">
                    {kind === "puzzle"
                      ? "Keep the solver prompt short. FireChess saves the puzzle start, previous move, and exact solution line from the builder above."
                      : "Keep it short. FireChess will use the board preview on the left and fill in sane defaults if you leave fields blank."}
                  </p>
                </div>
                <span className="rounded-full border border-fuchsia-500/20 bg-fuchsia-500/10 px-3 py-1 text-xs font-semibold text-fuchsia-200">
                  {COMMUNITY_KIND_LABELS[kind]}
                </span>
              </div>

              <div className="grid gap-4">
                <label className="space-y-2">
                  <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                    Title
                  </span>
                  <input
                    type="text"
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                    placeholder={titlePlaceholder}
                    className="w-full rounded-2xl border border-white/[0.08] bg-black/20 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-orange-500/40 focus:outline-none"
                  />
                </label>

                <label className="space-y-2">
                  <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                    Caption
                  </span>
                  <textarea
                    rows={3}
                    value={prompt}
                    onChange={(event) => setPrompt(event.target.value)}
                    placeholder={promptPlaceholder}
                    className="w-full rounded-2xl border border-white/[0.08] bg-black/20 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-orange-500/40 focus:outline-none"
                  />
                </label>

                <label className="space-y-2">
                  <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                    Optional notes
                  </span>
                  <textarea
                    rows={3}
                    value={description}
                    onChange={(event) => setDescription(event.target.value)}
                    placeholder={descriptionPlaceholder}
                    className="w-full rounded-2xl border border-white/[0.08] bg-black/20 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-orange-500/40 focus:outline-none"
                  />
                </label>

                <details className="rounded-2xl border border-white/[0.08] bg-black/15 px-4 py-3">
                  <summary className="cursor-pointer list-none text-sm font-semibold text-slate-200">
                    Optional metadata
                  </summary>
                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    <label className="space-y-2">
                      <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                        Opening name
                      </span>
                      <input
                        type="text"
                        value={openingName}
                        onChange={(event) => setOpeningName(event.target.value)}
                        placeholder="Italian Game"
                        className="w-full rounded-2xl border border-white/[0.08] bg-black/20 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-orange-500/40 focus:outline-none"
                      />
                    </label>

                    <label className="space-y-2">
                      <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                        Tags
                      </span>
                      <input
                        type="text"
                        value={tags}
                        onChange={(event) => setTags(event.target.value)}
                        placeholder="fork, rapid, opening"
                        className="w-full rounded-2xl border border-white/[0.08] bg-black/20 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-orange-500/40 focus:outline-none"
                      />
                    </label>
                  </div>
                </details>
              </div>

              <div className="mt-5 rounded-2xl border border-white/[0.08] bg-black/15 px-4 py-3 text-xs text-slate-400">
                <p>
                  <span className="font-semibold text-slate-200">Board:</span>{" "}
                  {boardStatus}
                </p>
                <p className="mt-1">
                  <span className="font-semibold text-slate-200">Source:</span>{" "}
                  {COMMUNITY_SOURCE_LABELS[sourceType]} · {lineSourceLabel}
                </p>
                {kind === "puzzle" && puzzlePreviousMove ? (
                  <p className="mt-1">
                    <span className="font-semibold text-slate-200">
                      Previous move:
                    </span>{" "}
                    {formatCommunityLineMove(
                      serializePuzzleLineMove(puzzlePreviousMove),
                    )}
                  </p>
                ) : null}
                {kind === "puzzle" && puzzleSolutionMoves.length > 0 ? (
                  <p className="mt-1">
                    <span className="font-semibold text-slate-200">
                      Solution SAN:
                    </span>{" "}
                    {puzzleSolutionMoves
                      .map((move) =>
                        formatCommunityLineMove(serializePuzzleLineMove(move)),
                      )
                      .join(" · ")}
                  </p>
                ) : null}
              </div>

              <div className="mt-5 flex items-center justify-between gap-3">
                <p className="text-xs leading-relaxed text-slate-500">
                  Need the full analyzer or a heavier board workflow? Use the{" "}
                  <a
                    href="/board"
                    className="font-semibold text-cyan-300 underline underline-offset-2 hover:text-cyan-200"
                  >
                    full board workbench
                  </a>
                  .
                </p>
                <button
                  type="button"
                  onClick={publishPost}
                  disabled={submitting}
                  className="rounded-full bg-gradient-to-r from-orange-500 to-amber-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {authenticated
                    ? submitting
                      ? "Publishing..."
                      : kind === "puzzle"
                        ? "Publish Puzzle"
                        : "Publish Post"
                    : kind === "puzzle"
                      ? "Sign In to Publish Puzzle"
                      : "Sign In to Publish"}
                </button>
              </div>

              {publishError ? (
                <p className="mt-3 text-sm text-red-400">{publishError}</p>
              ) : null}
            </>
          ) : (
            <>
              <div className="mb-4">
                <h3 className="text-lg font-bold text-white">
                  Publish snapshot
                </h3>
                <p className="text-sm text-slate-400">
                  {kind === "puzzle"
                    ? "Puzzle mode publishes the marked start position, the opponent's last move, and the verified SAN solution line."
                    : "Turn the live board into a position, opening, or puzzle post with real board data."}
                </p>
              </div>

              {kind === "puzzle" ? (
                <div className="mb-4 rounded-2xl border border-fuchsia-500/20 bg-fuchsia-500/[0.06] px-4 py-3 text-sm text-slate-200">
                  <p className="font-semibold text-fuchsia-200">
                    Puzzle recipe
                  </p>
                  <div className="mt-2 grid gap-1.5 text-xs leading-relaxed text-slate-300">
                    <p>
                      <span className="font-semibold text-white">1.</span> Stop
                      the board on the solver position after the opponent's last
                      move.
                    </p>
                    <p>
                      <span className="font-semibold text-white">2.</span> Press
                      Start Puzzle Mode, then enter the correct line on the
                      board.
                    </p>
                    <p>
                      <span className="font-semibold text-white">3.</span>{" "}
                      Publish the puzzle start, previous move, and verified SAN
                      sequence.
                    </p>
                  </div>
                </div>
              ) : null}

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="space-y-2">
                  <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                    Post Kind
                  </span>
                  <select
                    value={kind}
                    onChange={(event) =>
                      setKind(event.target.value as CommunityPostKind)
                    }
                    className="w-full rounded-2xl border border-white/[0.08] bg-black/20 px-4 py-3 text-sm text-white focus:border-orange-500/40 focus:outline-none"
                  >
                    {Object.entries(COMMUNITY_KIND_LABELS).map(
                      ([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ),
                    )}
                  </select>
                </label>

                <label className="space-y-2">
                  <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                    Source
                  </span>
                  <select
                    value={sourceType}
                    onChange={(event) =>
                      setSourceType(event.target.value as CommunitySourceType)
                    }
                    className="w-full rounded-2xl border border-white/[0.08] bg-black/20 px-4 py-3 text-sm text-white focus:border-orange-500/40 focus:outline-none"
                  >
                    {Object.entries(COMMUNITY_SOURCE_LABELS).map(
                      ([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ),
                    )}
                  </select>
                </label>

                <label className="space-y-2 sm:col-span-2">
                  <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                    Title
                  </span>
                  <input
                    type="text"
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                    placeholder={titlePlaceholder}
                    className="w-full rounded-2xl border border-white/[0.08] bg-black/20 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-orange-500/40 focus:outline-none"
                  />
                </label>

                <label className="space-y-2 sm:col-span-2">
                  <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                    {kind === "puzzle" ? "Prompt for solvers" : "Prompt"}
                  </span>
                  <textarea
                    rows={3}
                    value={prompt}
                    onChange={(event) => setPrompt(event.target.value)}
                    placeholder={promptPlaceholder}
                    className="w-full rounded-2xl border border-white/[0.08] bg-black/20 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-orange-500/40 focus:outline-none"
                  />
                </label>

                <label className="space-y-2 sm:col-span-2">
                  <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                    {kind === "puzzle"
                      ? "Solution / explanation"
                      : "Notes or solution"}
                  </span>
                  <textarea
                    rows={5}
                    value={description}
                    onChange={(event) => setDescription(event.target.value)}
                    placeholder={descriptionPlaceholder}
                    className="w-full rounded-2xl border border-white/[0.08] bg-black/20 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-orange-500/40 focus:outline-none"
                  />
                </label>

                <label className="space-y-2">
                  <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                    Board orientation
                  </span>
                  <select
                    value={orientation}
                    onChange={(event) =>
                      setOrientation(event.target.value as "white" | "black")
                    }
                    className="w-full rounded-2xl border border-white/[0.08] bg-black/20 px-4 py-3 text-sm text-white focus:border-orange-500/40 focus:outline-none"
                  >
                    <option value="white">White</option>
                    <option value="black">Black</option>
                  </select>
                </label>

                <label className="space-y-2">
                  <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                    Opening name
                  </span>
                  <input
                    type="text"
                    value={openingName}
                    onChange={(event) => setOpeningName(event.target.value)}
                    placeholder="Italian Game"
                    className="w-full rounded-2xl border border-white/[0.08] bg-black/20 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-orange-500/40 focus:outline-none"
                  />
                </label>

                <label className="space-y-2 sm:col-span-2">
                  <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                    Tags
                  </span>
                  <input
                    type="text"
                    value={tags}
                    onChange={(event) => setTags(event.target.value)}
                    placeholder="fork, endgame, italian, rapid"
                    className="w-full rounded-2xl border border-white/[0.08] bg-black/20 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-orange-500/40 focus:outline-none"
                  />
                </label>
              </div>

              <div className="mt-5 rounded-2xl border border-white/[0.08] bg-black/15 px-4 py-3 text-sm text-slate-300">
                <p className="font-semibold text-white">Current snapshot</p>
                <div className="mt-2 grid gap-2 text-xs text-slate-400">
                  <p>
                    <span className="font-semibold text-slate-200">
                      Collection:
                    </span>{" "}
                    {collectionKey}
                  </p>
                  <p>
                    <span className="font-semibold text-slate-200">
                      Board FEN:
                    </span>{" "}
                    <span className="font-mono text-[11px] text-slate-500">
                      {kind === "puzzle"
                        ? (puzzleBuilder?.startFen ?? currentFen)
                        : currentFen}
                    </span>
                  </p>
                  <p>
                    <span className="font-semibold text-slate-200">PGN:</span>{" "}
                    {kind === "puzzle"
                      ? puzzleContextPgn
                        ? "Context PGN ends on the opponent's last move. The solution line is saved separately with verified SAN."
                        : "No puzzle context PGN yet. Start puzzle mode after the opponent's last move is in the line."
                      : generatedPgn
                        ? "Line will be saved with PGN context."
                        : "No PGN context for this snapshot yet."}
                  </p>
                  {kind === "puzzle" && puzzlePreviousMove ? (
                    <p>
                      <span className="font-semibold text-slate-200">
                        Previous move:
                      </span>{" "}
                      {formatCommunityLineMove(
                        serializePuzzleLineMove(puzzlePreviousMove),
                      )}
                    </p>
                  ) : null}
                  {kind === "puzzle" && puzzleSolutionMoves.length > 0 ? (
                    <p>
                      <span className="font-semibold text-slate-200">
                        Solution SAN:
                      </span>{" "}
                      {puzzleSolutionMoves
                        .map((move) =>
                          formatCommunityLineMove(
                            serializePuzzleLineMove(move),
                          ),
                        )
                        .join(" · ")}
                    </p>
                  ) : null}
                  {normalizedTags.length > 0 ? (
                    <p>
                      <span className="font-semibold text-slate-200">
                        Tags:
                      </span>{" "}
                      {normalizedTags.map((tag) => `#${tag}`).join(" ")}
                    </p>
                  ) : null}
                </div>
              </div>

              <div className="mt-5 flex items-center justify-between gap-3">
                <p className="text-xs leading-relaxed text-slate-500">
                  {kind === "puzzle"
                    ? "Publish saves the puzzle start, the opponent's last move, the verified SAN solution line, and your written explanation to the real community API."
                    : "Publish sends the current board, the current line, and the written notes to the real community API."}
                </p>
                <button
                  type="button"
                  onClick={publishPost}
                  disabled={submitting}
                  className="rounded-full bg-gradient-to-r from-orange-500 to-amber-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {authenticated
                    ? submitting
                      ? "Publishing..."
                      : kind === "puzzle"
                        ? "Publish Puzzle"
                        : "Publish Post"
                    : kind === "puzzle"
                      ? "Sign In to Publish Puzzle"
                      : "Sign In to Publish"}
                </button>
              </div>

              {publishError ? (
                <p className="mt-3 text-sm text-red-400">{publishError}</p>
              ) : null}
            </>
          )}
        </section>
      </aside>
    </div>
  );
}
