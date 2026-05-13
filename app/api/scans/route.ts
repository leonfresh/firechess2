import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { scanSessions } from "@/lib/schema";
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
    Array.isArray(config.speed)
  );
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    const body = (await req.json()) as {
      chessUsername?: string;
      config?: ScanSessionConfig;
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
