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
  skippedReason?: "invalid_move" | "missing_eval";
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

export type AnalyzeResponse = {
  username: string;
  gamesAnalyzed: number;
  repeatedPositions: number;
  leaks: RepeatedOpeningLeak[];
  missedTactics: MissedTactic[];
  diagnostics?: AnalysisDiagnostics;
  report?: AnalysisReport;
};
