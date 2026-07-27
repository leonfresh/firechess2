import { ImageResponse } from "next/og";
import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { Chess } from "chess.js";
import type { PieceSymbol } from "chess.js";
import { db } from "@/lib/db";
import { scanSessions } from "@/lib/schema";
import { isExpiredScanSession } from "@/lib/scan-session";
import { prepareBoard, renderBoardElement } from "@/lib/share-cards/board";
import {
  CARD_COLORS,
  CARD_KIND_CONFIG,
  SQUARE_SIZE,
  type ShareCardKind,
} from "@/lib/share-cards/theme";
import type { BrilliantMove, MissedTactic, MentalStats } from "@/lib/types";

export const runtime = "nodejs";

const VALID_KINDS: ShareCardKind[] = ["brilliant", "tactic", "mental", "vibe"];

/* ── UCI → SAN + from/to squares ───────────────────────────────────────── */
/** Convert a UCI move (e.g. "g4c8", "e7e8q") against a FEN into SAN + squares. */
function uciToSan(
  fen: string,
  uci: string,
): { san: string; from: string; to: string } | null {
  try {
    const chess = new Chess(fen);
    const mv = chess.move({
      from: uci.slice(0, 2),
      to: uci.slice(2, 4),
      promotion: (uci.slice(4, 5) || undefined) as PieceSymbol | undefined,
    });
    if (!mv) return null;
    return { san: mv.san, from: mv.from, to: mv.to };
  } catch {
    return null;
  }
}

/** Fallback arrow when SAN conversion fails: raw UCI squares. */
function uciArrow(uci: string): [string, string] | null {
  if (uci.length < 4) return null;
  return [uci.slice(0, 2), uci.slice(2, 4)];
}

/* ── Small presentational bits ─────────────────────────────────────────── */
function StatChip({
  value,
  label,
  color,
}: {
  value: string;
  label: string;
  color?: string;
}) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        padding: "16px 22px",
        borderRadius: 14,
        border: `1px solid ${CARD_COLORS.border}`,
        background: CARD_COLORS.panel,
        minWidth: 120,
      }}
    >
      <span
        style={{
          fontSize: 36,
          fontWeight: 900,
          color: color ?? CARD_COLORS.text,
          fontFamily: "system-ui, sans-serif",
        }}
      >
        {value}
      </span>
      <span
        style={{
          fontSize: 13,
          color: CARD_COLORS.textFaint,
          letterSpacing: "0.1em",
          marginTop: 4,
          fontFamily: "system-ui, sans-serif",
        }}
      >
        {label}
      </span>
    </div>
  );
}

function Header({ kind, username }: { kind: ShareCardKind; username: string }) {
  const cfg = CARD_KIND_CONFIG[kind];
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        width: "100%",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <span style={{ fontSize: 40 }}>{cfg.emoji}</span>
        <span
          style={{
            fontSize: 24,
            fontWeight: 900,
            color: cfg.color,
            letterSpacing: "0.14em",
            fontFamily: "system-ui, sans-serif",
          }}
        >
          {cfg.label}
        </span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ fontSize: 28 }}>{"\u{1F525}"}</span>
        <span
          style={{
            fontSize: 24,
            fontWeight: 900,
            color: CARD_COLORS.brand,
            letterSpacing: "0.1em",
            fontFamily: "system-ui, sans-serif",
          }}
        >
          FIRECHESS
        </span>
      </div>
    </div>
  );
}

function Footer({ tag }: { tag?: string }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        width: "100%",
      }}
    >
      <span
        style={{
          fontSize: 22,
          color: CARD_COLORS.textFaint,
          fontFamily: "system-ui, sans-serif",
        }}
      >
        {tag ?? "Stockfish 18 deep scan"}
      </span>
      <span
        style={{
          fontSize: 26,
          fontWeight: 800,
          color: CARD_COLORS.brand,
          fontFamily: "system-ui, sans-serif",
        }}
      >
        firechess.com
      </span>
    </div>
  );
}

/** Shared square-card shell */
function Shell({
  kind,
  children,
}: {
  kind: ShareCardKind;
  children: React.ReactNode;
}) {
  const cfg = CARD_KIND_CONFIG[kind];
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        background: `linear-gradient(150deg, ${CARD_COLORS.bgDeep} 0%, ${CARD_COLORS.bg} 55%, ${CARD_COLORS.bgDeep} 100%)`,
        padding: "52px 56px",
        position: "relative",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `radial-gradient(ellipse at 16% 10%, ${cfg.glow} 0%, transparent 55%), radial-gradient(ellipse at 90% 94%, rgba(251,146,60,0.12) 0%, transparent 55%)`,
          display: "flex",
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 18,
          border: `1px solid ${CARD_COLORS.border}`,
          borderRadius: 26,
          display: "flex",
        }}
      />
      {children}
    </div>
  );
}

/* ── Card builders ─────────────────────────────────────────────────────── */
async function boardCard(
  kind: ShareCardKind,
  username: string,
  move: BrilliantMove | MissedTactic,
  topTag?: string,
) {
  const cfg = CARD_KIND_CONFIG[kind];
  const orientation = move.userColor ?? "white";
  const isBrilliant = kind === "brilliant";
  const uci = isBrilliant ? move.userMove : (move as MissedTactic).bestMove;
  const conv = uciToSan(move.fenBefore, uci);
  const arrow = conv ? [conv.from, conv.to] as [string, string] : uciArrow(uci);

  const prep = await prepareBoard(move.fenBefore, {
    orientation,
    arrow,
    highlight: arrow,
    checkSquare: null,
    badge:
      isBrilliant && arrow
        ? { square: arrow[1], text: "!!", color: CARD_COLORS.cyan }
        : null,
  });

  const boardEl = renderBoardElement(prep, {
    squareSize: 84,
    lightSq: CARD_COLORS.lightSq,
    darkSq: CARD_COLORS.darkSq,
    orientation,
    glowColor: cfg.glow,
  });

  const playedUci = move.userMove;
  const bestUci = (move as MissedTactic).bestMove;
  const mateIn = (move as MissedTactic).mateIn;
  const cpLoss = (move as MissedTactic).cpLoss;

  const playedSan = uciToSan(move.fenBefore, playedUci)?.san ?? playedUci;
  const bestSan = uciToSan(move.fenBefore, bestUci)?.san ?? bestUci;

  return (
    <Shell kind={kind}>
      <Header kind={kind} username={username} />
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 48,
          width: "100%",
          flex: 1,
        }}
      >
        {boardEl}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            flex: 1,
            minWidth: 0,
            justifyContent: "center",
            gap: 22,
          }}
        >
          <div
            style={{
              fontSize: 52,
              fontWeight: 900,
              color: CARD_COLORS.text,
              lineHeight: 1.05,
              display: "flex",
              fontFamily: "system-ui, sans-serif",
            }}
          >
            {username}
          </div>
          <div
            style={{
              fontSize: 26,
              color: cfg.color,
              fontWeight: 700,
              display: "flex",
              fontFamily: "system-ui, sans-serif",
              lineHeight: 1.25,
            }}
          >
            {isBrilliant
              ? "found a brilliant move"
              : "missed a winning tactic"}
          </div>

          <div style={{ display: "flex", gap: 14, marginTop: 6, flexWrap: "wrap" }}>
            <StatChip
              value={isBrilliant ? playedSan : bestSan}
              label={isBrilliant ? "BRILLIANT" : "BEST MOVE"}
              color={isBrilliant ? CARD_COLORS.cyan : CARD_COLORS.green}
            />
            {!isBrilliant && (
              <StatChip value={playedSan} label="PLAYED" color={CARD_COLORS.red} />
            )}
            <StatChip value={`#${move.moveNumber}`} label="MOVE" />
          </div>

          {!isBrilliant && (typeof mateIn === "number" && mateIn > 0 || cpLoss > 2000) ? (
            <div
              style={{
                fontSize: 22,
                color: CARD_COLORS.textDim,
                display: "flex",
                fontFamily: "system-ui, sans-serif",
              }}
            >
              {bestSan} was a forced win{typeof mateIn === "number" && mateIn > 0 ? ` (mate in ${mateIn})` : ""}
            </div>
          ) : !isBrilliant && typeof cpLoss === "number" && cpLoss > 0 ? (
            <div
              style={{
                fontSize: 22,
                color: CARD_COLORS.textDim,
                display: "flex",
                fontFamily: "system-ui, sans-serif",
              }}
            >
              {(cpLoss / 100).toFixed(1)} pawns of advantage slipped away
            </div>
          ) : null}
        </div>
      </div>
      <Footer tag={topTag ? `Biggest leak: ${topTag}` : undefined} />
    </Shell>
  );
}

function mentalCard(
  username: string,
  mental: MentalStats,
  rating?: number,
  topTag?: string,
) {
  const archetype = mental.archetype ?? "The Grinder";
  const stability = Math.round(mental.stability ?? 0);
  const tilt = Math.round(mental.tiltRate ?? 0);
  const streak = mental.maxStreak ?? 0;
  const streakType = mental.streakType === "loss" ? "losses" : "wins";

  return (
    <Shell kind="mental">
      <Header kind="mental" username={username} />
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
          gap: 20,
          marginTop: 6,
        }}
      >
        <div
          style={{
            fontSize: 30,
            color: CARD_COLORS.textDim,
            fontWeight: 700,
            letterSpacing: "0.16em",
            display: "flex",
            fontFamily: "system-ui, sans-serif",
          }}
        >
          {username} IS
        </div>
        <div
          style={{
            fontSize: 92,
            fontWeight: 900,
            color: CARD_COLORS.purple,
            lineHeight: 1.02,
            display: "flex",
            fontFamily: "system-ui, sans-serif",
            padding: "0 40px",
          }}
        >
          {archetype}
        </div>
        <div style={{ display: "flex", gap: 18, marginTop: 20, flexWrap: "wrap", justifyContent: "center" }}>
          <StatChip value={`${stability}`} label="STABILITY" color={CARD_COLORS.purple} />
          <StatChip value={`${tilt}%`} label="TILT RATE" color={tilt > 40 ? CARD_COLORS.red : CARD_COLORS.text} />
          {streak > 0 && (
            <StatChip value={`${streak}`} label={`MAX ${streakType.toUpperCase()} STREAK`} />
          )}
          {typeof rating === "number" && (
            <StatChip value={`~${rating}`} label="EST. RATING" />
          )}
        </div>
      </div>
      <Footer tag={topTag ? `Biggest leak: ${topTag}` : undefined} />
    </Shell>
  );
}

function vibeCard(
  username: string,
  vibe: string,
  accuracy?: number,
  rating?: number,
  games?: number,
  topTag?: string,
) {
  return (
    <Shell kind="vibe">
      <Header kind="vibe" username={username} />
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
          gap: 18,
          marginTop: 4,
        }}
      >
        <div
          style={{
            fontSize: 28,
            color: CARD_COLORS.textDim,
            fontWeight: 700,
            letterSpacing: "0.16em",
            display: "flex",
            fontFamily: "system-ui, sans-serif",
          }}
        >
          {username}&apos;S PLAYING STYLE
        </div>
        <div
          style={{
            fontSize: 76,
            fontWeight: 900,
            color: CARD_COLORS.brand,
            lineHeight: 1.06,
            display: "flex",
            fontFamily: "system-ui, sans-serif",
            padding: "0 36px",
          }}
        >
          {vibe}
        </div>
        <div style={{ display: "flex", gap: 18, marginTop: 22, flexWrap: "wrap", justifyContent: "center" }}>
          {typeof accuracy === "number" && (
            <StatChip value={`${accuracy.toFixed(1)}%`} label="ACCURACY" color={CARD_COLORS.green} />
          )}
          {typeof rating === "number" && (
            <StatChip value={`~${rating}`} label="EST. RATING" />
          )}
          {typeof games === "number" && games > 0 && (
            <StatChip value={`${games}`} label="GAMES" />
          )}
        </div>
      </div>
      <Footer tag={topTag ? `Biggest leak: ${topTag}` : undefined} />
    </Shell>
  );
}

/* ── Route handler ─────────────────────────────────────────────────────── */
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  const kindParam = url.searchParams.get("type") as ShareCardKind | null;

  if (!id || !kindParam || !VALID_KINDS.includes(kindParam)) {
    return NextResponse.json(
      { error: "Missing or invalid params. Use ?id=<reportId>&type=brilliant|tactic|mental|vibe" },
      { status: 400 },
    );
  }
  const kind = kindParam;

  const [scan] = await db
    .select()
    .from(scanSessions)
    .where(eq(scanSessions.id, id))
    .limit(1);

  if (!scan || isExpiredScanSession(scan)) {
    return NextResponse.json({ error: "Report not found" }, { status: 404 });
  }

  const username = scan.chessUsername;
  const meta = scan.reportMeta;
  const result = scan.result;
  const topTag = meta?.topTag;

  let element: React.ReactElement | null = null;

  if (kind === "brilliant") {
    const move: BrilliantMove | undefined = result?.brilliantMoves?.[0];
    if (!move) {
      return NextResponse.json({ error: "No brilliant move found" }, { status: 404 });
    }
    element = await boardCard("brilliant", username, move, topTag);
  } else if (kind === "tactic") {
    // Biggest missed tactic by centipawn loss
    const tactics = result?.missedTactics ?? [];
    const move: MissedTactic | undefined = tactics.reduce<MissedTactic | undefined>(
      (best, t) => (!best || t.cpLoss > best.cpLoss ? t : best),
      undefined,
    );
    if (!move) {
      return NextResponse.json({ error: "No missed tactic found" }, { status: 404 });
    }
    element = await boardCard("tactic", username, move, topTag);
  } else if (kind === "mental") {
    const mental = result?.mentalStats;
    if (!mental) {
      return NextResponse.json({ error: "No mental stats found" }, { status: 404 });
    }
    element = mentalCard(username, mental, meta?.estimatedRating, topTag);
  } else if (kind === "vibe") {
    const vibe = meta?.vibeTitle ?? "Full Chess Analysis";
    element = vibeCard(
      username,
      vibe,
      meta?.estimatedAccuracy,
      meta?.estimatedRating,
      result?.gamesAnalyzed,
      topTag,
    );
  }

  if (!element) {
    return NextResponse.json({ error: "Could not build card" }, { status: 500 });
  }

  return new ImageResponse(element, { ...SQUARE_SIZE });
}
