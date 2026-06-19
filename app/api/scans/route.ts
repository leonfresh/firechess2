import { and, desc, eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { reports, scanSessions } from "@/lib/schema";
import {
  getGuestScanExpiryDate,
  type ScanSessionConfig,
} from "@/lib/scan-session";

/** Hard limits for the pasted-PGN source. */
const PGN_MAX_BYTES = 2 * 1024 * 1024; // 2 MB
const PGN_MAX_GAMES = 250;

function countPgnGames(text: string): number {
  // Cheap pre-split count: number of top-level `[Event ` markers, with a
  // fallback to blank-line-separated blocks when there are no tag headers.
  const eventCount = (text.match(/^\[Event\s/gm) || []).length;
  if (eventCount > 0) return eventCount;
  return text
    .split(/\n\s*\n+/)
    .map((g) => g.trim())
    .filter(Boolean).length;
}

function isValidScanConfig(value: unknown): value is ScanSessionConfig {
  if (!value || typeof value !== "object") return false;

  const config = value as Partial<ScanSessionConfig>;
  const sourceValid =
    config.source === "lichess" ||
    config.source === "chesscom" ||
    config.source === "pgn";

  if (
    typeof config.maxGames !== "number" ||
    typeof config.maxMoves !== "number" ||
    typeof config.cpThreshold !== "number" ||
    typeof config.engineDepth !== "number" ||
    !sourceValid ||
    !(
      config.scanMode === "openings" ||
      config.scanMode === "tactics" ||
      config.scanMode === "endgames" ||
      config.scanMode === "time-management" ||
      config.scanMode === "both"
    ) ||
    !Array.isArray(config.speed) ||
    !(
      config.since === null ||
      config.since === undefined ||
      typeof config.since === "number"
    ) ||
    !(
      config.until === null ||
      config.until === undefined ||
      typeof config.until === "number"
    )
  ) {
    return false;
  }

  // PGN source requires non-empty text within size/game limits.
  if (config.source === "pgn") {
    const text = config.pgnText;
    if (typeof text !== "string" || !text.trim()) return false;
    if (Buffer.byteLength(text, "utf8") > PGN_MAX_BYTES) return false;
    if (countPgnGames(text) > PGN_MAX_GAMES) return false;
  }

  return true;
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    const body = (await req.json()) as {
      chessUsername?: string;
      config?: ScanSessionConfig;
      reuseSignature?: string | null;
    };

    const chessUsername = body.chessUsername?.trim();
    if (!chessUsername) {
      return NextResponse.json(
        { error: "Chess username is required." },
        { status: 400 },
      );
    }

    if (!isValidScanConfig(body.config)) {
      return NextResponse.json(
        { error: "Invalid scan configuration." },
        { status: 400 },
      );
    }

    if (session?.user?.id && typeof body.reuseSignature === "string") {
      const [latestReport] = await db
        .select({
          id: reports.id,
          contentHash: reports.contentHash,
        })
        .from(reports)
        .where(eq(reports.userId, session.user.id))
        .orderBy(desc(reports.createdAt))
        .limit(1);

      if (latestReport?.contentHash === body.reuseSignature) {
        const [reusedSession] = await db
          .select({ id: scanSessions.id })
          .from(scanSessions)
          .where(
            and(
              eq(scanSessions.userId, session.user.id),
              eq(scanSessions.savedReportId, latestReport.id),
              eq(scanSessions.status, "ready"),
            ),
          )
          .orderBy(desc(scanSessions.updatedAt))
          .limit(1);

        if (reusedSession) {
          return NextResponse.json({
            id: reusedSession.id,
            guestToken: null,
            reused: true,
          });
        }
      }
    }

    const isGuest = !session?.user?.id;
    const guestToken = isGuest ? crypto.randomUUID() : null;
    const now = new Date();

    const [created] = await db
      .insert(scanSessions)
      .values({
        userId: session?.user?.id ?? null,
        guestToken,
        chessUsername,
        source: body.config.source,
        scanMode: body.config.scanMode,
        status: "processing",
        config: body.config,
        expiresAt: isGuest ? getGuestScanExpiryDate(now) : null,
        updatedAt: now,
      })
      .returning({ id: scanSessions.id });

    return NextResponse.json({ id: created.id, guestToken });
  } catch (error) {
    console.error("[scans POST]", error);
    return NextResponse.json(
      { error: "Failed to create scan session." },
      { status: 500 },
    );
  }
}
