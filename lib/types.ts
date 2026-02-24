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
  | "Rook + Minor"
  | "Minor Piece"
  | "Queen"
  | "Opposite Bishops"
  | "Other";

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
  diagnostics?: AnalysisDiagnostics;
  report?: AnalysisReport;
};
