import { Chess } from "chess.js";
import { StockfishPool, type LocalEngineLine } from "./stockfish-client";

export interface PuzzleAnalysis {
  wrongMove: string | null;
  wrongMoveLoss: number;
  opponentDeviation: string | null;
  opponentDeviationResponse: string | null;
}

const pool = new StockfishPool(2);

function pickAlternateLine(
  lines: LocalEngineLine[],
  mainLineMove: string | undefined,
): LocalEngineLine | null {
  const secondLine = lines[1];
  if (secondLine?.bestMove && secondLine.bestMove !== mainLineMove) {
    return secondLine;
  }

  return (
    lines
      .slice(1)
      .find((line) => line.bestMove && line.bestMove !== mainLineMove) ??
    lines.find((line) => line.bestMove && line.bestMove !== mainLineMove) ??
    null
  );
}

export async function analyzePuzzleForTutor(
  fen: string,
  solutionMoves: string[],
): Promise<PuzzleAnalysis> {
  const solutionFirst = solutionMoves[0];
  if (!solutionFirst)
    return {
      wrongMove: null,
      wrongMoveLoss: 0,
      opponentDeviation: null,
      opponentDeviationResponse: null,
    };

  try {
    // Get top 3 moves from the starting position
    const topMoves = await pool.getTopMoves(fen, 3, 13);

    // Prefer the second engine line for "what if" content when it differs.
    const solutionLine =
      topMoves.find((line) => line.bestMove === solutionFirst) ?? topMoves[0];
    const wrongMoveLine = pickAlternateLine(topMoves, solutionFirst);
    const wrongMove = wrongMoveLine?.bestMove ?? null;
    const solutionScore = solutionLine?.cp ?? 0;
    const wrongMoveScore = wrongMoveLine?.cp ?? 0;
    const wrongMoveLoss = Math.abs(solutionScore - wrongMoveScore);

    // Opponent deviation: after the first solution move, get opponent's best non-puzzle reply
    let opponentDeviation: string | null = null;
    let opponentDeviationResponse: string | null = null;
    if (solutionMoves.length >= 2) {
      const chess = new Chess(fen);
      try {
        chess.move({
          from: solutionFirst.slice(0, 2),
          to: solutionFirst.slice(2, 4),
          promotion: solutionFirst[4],
        });
        const afterFirstMove = chess.fen();
        const puzzleOpponentMove = solutionMoves[1];
        const opponentTopMoves = await pool.getTopMoves(afterFirstMove, 3, 12);
        const devLine = pickAlternateLine(opponentTopMoves, puzzleOpponentMove);
        opponentDeviation = devLine?.bestMove ?? null;
        opponentDeviationResponse = devLine?.pvMoves[1] ?? null;
      } catch {
        // Position or move parse failed — skip deviation
      }
    }

    return {
      wrongMove,
      wrongMoveLoss,
      opponentDeviation,
      opponentDeviationResponse,
    };
  } catch {
    return {
      wrongMove: null,
      wrongMoveLoss: 0,
      opponentDeviation: null,
      opponentDeviationResponse: null,
    };
  }
}
