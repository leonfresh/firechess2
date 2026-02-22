import { NextRequest, NextResponse } from "next/server";
import { analyzeOpeningLeaks } from "@/lib/chess-analysis";
import type { AnalyzeResponse } from "@/lib/types";

type HttpError = Error & { status?: number };

export async function GET(request: NextRequest) {
  const username = request.nextUrl.searchParams.get("username")?.trim();
  const maxGamesParam = request.nextUrl.searchParams.get("maxGames");
  const maxMovesParam = request.nextUrl.searchParams.get("maxMoves");
  const cpThresholdParam = request.nextUrl.searchParams.get("cpThreshold");

  if (!username) {
    return NextResponse.json({ error: "Missing username" }, { status: 400 });
  }

  try {
    const maxGames = maxGamesParam ? Number(maxGamesParam) : undefined;
    const maxOpeningMoves = maxMovesParam ? Number(maxMovesParam) : undefined;
    const cpLossThreshold = cpThresholdParam ? Number(cpThresholdParam) : undefined;

    const result = await analyzeOpeningLeaks(username, {
      maxGames,
      maxOpeningMoves,
      cpLossThreshold
    });

    const payload: AnalyzeResponse = {
      username,
      gamesAnalyzed: result.gamesAnalyzed,
      repeatedPositions: result.repeatedPositions,
      leaks: result.leaks
    };

    return NextResponse.json(payload, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    const status =
      error && typeof error === "object" && "status" in error
        ? Number((error as HttpError).status ?? 502)
        : 502;

    return NextResponse.json({ error: message }, { status: Number.isFinite(status) ? status : 502 });
  }
}
