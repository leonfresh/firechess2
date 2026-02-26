export type PlayerColor = "white" | "black";

export type MoveSquare = {
  from: string;
  to: string;
  promotion?: string;
};

export type AggregatedPosition = {
  fenBefore: string;
  totalReachCount: number;
  moveCounts: Record<string, number>;
  chosenMove: string;
  chosenMoveCount: number;
};

export type RepeatedOpeningLeak = {
  fenBefore: string;
  fenAfter: string;
  userMove: string;
  bestMove: string | null;
  tags?: string[];
  reachCount: number;
  moveCount: number;
  cpLoss: number;
  evalBefore: number;
  evalAfter: number;
  sideToMove: PlayerColor;
  userColor: PlayerColor;
  /** True when the Lichess DB considers this a known line with decent win rate */
  dbApproved?: boolean;
  /** DB win rate (0-1) when dbApproved */
  dbWinRate?: number;
  /** DB game count when dbApproved */
  dbGames?: number;
  /** User's personal wins/draws/losses with this move */
  userWins?: number;
  userDraws?: number;
  userLosses?: number;
};

export type GameOpeningTrace = {
  gameIndex: number;
  userColor: PlayerColor;
  openingMoves: string[];
};

/** Per-game opening summary for the Opening Rankings component */
export type OpeningSummary = {
  /** Representative FEN after ~8 opening plies */
  fen: string;
  /** User's color in this game */
  userColor: PlayerColor;
  /** Game outcome from the user's perspective */
  result: "win" | "draw" | "loss";
};

export type PositionEvalTrace = {
  fenBefore: string;
  userMove: string;
  bestMove: string | null;
  reachCount: number;
  moveCount: number;
  evalBefore: number | null;
  evalAfter: number | null;
  cpLoss: number | null;
  flagged: boolean;
  skippedReason?: "invalid_move" | "missing_eval" | "db_approved";
};

export type AnalysisDiagnostics = {
  gameTraces: GameOpeningTrace[];
  positionTraces: PositionEvalTrace[];
};

export type AnalysisReport = {
  estimatedAccuracy: number;
  estimatedRating: number;
  weightedCpLoss: number;
  severeLeakRate: number;
};

export type MissedTactic = {
  fenBefore: string;
  fenAfter: string;
  userMove: string;
  bestMove: string;
  cpBefore: number;
  cpAfter: number;
  cpLoss: number;
  sideToMove: PlayerColor;
  userColor: PlayerColor;
  gameIndex: number;
  moveNumber: number;
  tags: string[];
  /** Seconds remaining on the clock when the tactic was missed (null if unknown) */
  timeRemainingSec: number | null;
};

export type EndgameType =
  | "Pawn"
  | "Rook"
  | "Rook + Bishop"
  | "Rook + Knight"
  | "Rook + Minor"
  | "Knight vs Knight"
  | "Bishop vs Bishop"
  | "Knight vs Bishop"
  | "Bishop vs Knight"
  | "Bishop + Knight"
  | "Two Bishops"
  | "Two Knights"
  | "Minor Piece"
  | "Queen"
  | "Queen + Rook"
  | "Queen + Minor"
  | "Opposite Bishops"
  | "Complex";

export type EndgameMistake = {
  fenBefore: string;
  fenAfter: string;
  userMove: string;
  bestMove: string;
  cpBefore: number;
  cpAfter: number;
  cpLoss: number;
  sideToMove: PlayerColor;
  userColor: PlayerColor;
  gameIndex: number;
  moveNumber: number;
  endgameType: EndgameType;
  tags: string[];
};

export type EndgameStats = {
  /** Total endgame positions analysed */
  totalPositions: number;
  /** Average cpLoss per endgame move */
  avgCpLoss: number;
  /** Conversion rate: % of won positions actually won */
  conversionRate: number | null;
  /** Hold rate: % of slightly worse endgames held to draw */
  holdRate: number | null;
  /** Breakdown per endgame type */
  byType: {
    type: EndgameType;
    count: number;
    avgCpLoss: number;
    mistakes: number;
  }[];
  /** The endgame type with the worst average performance */
  weakestType: EndgameType | null;
};

export type MentalStats = {
  /** Overall mental stability score 0-100 */
  stability: number;
  /** Tilt rate: % of losses immediately followed by another loss */
  tiltRate: number;
  /** Post-loss bounce-back: win % in the game immediately after a loss */
  postLossWinRate: number;
  /** % of games lost on time */
  timeoutRate: number;
  /** Longest consecutive win or loss streak */
  maxStreak: number;
  /** Whether maxStreak is wins or losses */
  streakType: "win" | "loss";
  /** % of losses that ended in resignation */
  resignRate: number;
  /** Total games used for mental stats */
  totalGames: number;
  /** Total wins */
  wins: number;
  /** Total losses */
  losses: number;
  /** Total draws */
  draws: number;

  /* ── Pro-only advanced breakdowns ── */
  /** Win rate as white (0-100) */
  whiteWinRate?: number;
  /** Win rate as black (0-100) */
  blackWinRate?: number;
  /** Games played as white */
  whiteGames?: number;
  /** Games played as black */
  blackGames?: number;
  /** % of losses that ended in ≤20 moves (early collapse) */
  earlyLossRate?: number;
  /** Draw rate: % of games that ended in a draw */
  drawRate?: number;
  /** Post-win win rate: % of games won immediately after a previous win */
  postWinWinRate?: number;
  /** Average move count in wins */
  avgMovesWin?: number;
  /** Average move count in losses */
  avgMovesLoss?: number;
  /** Longest win streak */
  maxWinStreak?: number;
  /** Longest loss streak */
  maxLossStreak?: number;
  /** Comeback rate: % of games where user was losing based on move count but still won (wins in long games) */
  comebackRate?: number;
  /** Decisiveness: % of games that ended decisively (not a draw) */
  decisiveness?: number;
  /** Emotional archetype label */
  archetype?: string;
  /** Rolling form: result of the last 10 games as W/L/D array */
  recentForm?: ("W" | "L" | "D")[];
  /** Mate finish rate: % of wins that ended in checkmate (vs resignation/timeout) */
  mateFinishRate?: number;
};

export type AnalyzeResponse = {
  username: string;
  gamesAnalyzed: number;
  repeatedPositions: number;
  leaks: RepeatedOpeningLeak[];
  oneOffMistakes: RepeatedOpeningLeak[];
  missedTactics: MissedTactic[];
  /** Total tactics found (may exceed missedTactics.length when capped) */
  totalTacticsFound: number;
  endgameMistakes: EndgameMistake[];
  endgameStats: EndgameStats | null;
  playerRating?: number | null;
  /** Time management score 0-100 computed from move clock data */
  timeManagementScore?: number | null;
  /** Mental / psychology stats computed from game outcomes */
  mentalStats?: MentalStats | null;
  /** Per-game opening summaries for the Opening Rankings view */
  openingSummaries?: OpeningSummary[];
  diagnostics?: AnalysisDiagnostics;
  report?: AnalysisReport;
};
