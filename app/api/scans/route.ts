import { and, desc, eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { reports, scanSessions } from "@/lib/schema";
import {
  getGuestScanExpiryDate,
  type ScanSessionConfig,
} from "@/lib/scan-session";

function isValidScanConfig(value: unknown): value is ScanSessionConfig {
  if (!value || typeof value !== "object") return false;

  const config = value as Partial<ScanSessionConfig>;
  return (
    typeof config.maxGames === "number" &&
    typeof config.maxMoves === "number" &&
    typeof config.cpThreshold === "number" &&
    typeof config.engineDepth === "number" &&
    (config.source === "lichess" || config.source === "chesscom") &&
    (config.scanMode === "openings" ||
      config.scanMode === "tactics" ||
      config.scanMode === "endgames" ||
      config.scanMode === "time-management" ||
      config.scanMode === "both") &&
    Array.isArray(config.speed) &&
    (config.since === null ||
      config.since === undefined ||
      typeof config.since === "number") &&
    (config.until === null ||
      config.until === undefined ||
      typeof config.until === "number")
  );
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
