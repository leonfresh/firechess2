import { ImageResponse } from "next/og";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { scanSessions } from "@/lib/schema";
import { isExpiredScanSession } from "@/lib/scan-session";
import { SAMPLE_REPORTS } from "@/lib/sample-reports";
import { prepareBoard, renderBoardElement } from "@/lib/share-cards/board";
import { CARD_COLORS, OG_SIZE } from "@/lib/share-cards/theme";
import { Chess } from "chess.js";
import type { PieceSymbol } from "chess.js";

export const runtime = "nodejs";
export const alt = "FireChess chess analysis report";
export const size = OG_SIZE;
export const contentType = "image/png";

const SAMPLE_REPORT_IDS = new Set(
  SAMPLE_REPORTS.map((r) => r.reportId).filter(Boolean),
);

function fmtCpLoss(cp: number): string {
  return (cp / 100).toFixed(2);
}

/** Convert UCI (e.g. "g4c8") to SAN against a FEN. Falls back to the raw UCI. */
function uciToSan(fen: string, uci: string): string {
  try {
    const chess = new Chess(fen);
    const mv = chess.move({
      from: uci.slice(0, 2),
      to: uci.slice(2, 4),
      promotion: (uci.slice(4, 5) || undefined) as PieceSymbol | undefined,
    });
    return mv?.san ?? uci;
  } catch {
    return uci;
  }
}

export default async function OgImage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [scan] = await db
    .select()
    .from(scanSessions)
    .where(eq(scanSessions.id, id))
    .limit(1);

  // Fallback generic card if the scan is missing / expired
  if (!scan || (!SAMPLE_REPORT_IDS.has(id) && isExpiredScanSession(scan))) {
    return new ImageResponse(
      (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: CARD_COLORS.bg,
            color: CARD_COLORS.text,
            fontFamily: "system-ui, sans-serif",
            fontSize: 44,
            fontWeight: 800,
          }}
        >
          FireChess Report
        </div>
      ),
      { ...OG_SIZE },
    );
  }

  const username = scan.chessUsername;
  const meta = scan.reportMeta;
  const result = scan.result;

  const vibe = meta?.vibeTitle ?? "Full Chess Analysis";
  const accuracy = meta?.estimatedAccuracy;
  const rating = meta?.estimatedRating;
  const games = result?.gamesAnalyzed ?? 0;
  const topTag = meta?.topTag;

  // Pick the most shareable position: best brilliant move, else biggest tactic
  const brilliant = result?.brilliantMoves?.[0] ?? null;
  const tactic = result?.missedTactics?.[0] ?? null;
  const featured = brilliant ?? tactic;
  const featuredKind = brilliant ? "brilliant" : "tactic";
  const featuredColor =
    featuredKind === "brilliant" ? CARD_COLORS.cyan : CARD_COLORS.red;

  let boardEl: React.ReactElement | null = null;
  if (featured) {
    const orientation = featured.userColor ?? "white";
    const prep = await prepareBoard(featured.fenBefore, {
      orientation,
      arrow: null,
      highlight: null,
      checkSquare: null,
    });
    boardEl = renderBoardElement(prep, {
      squareSize: 54,
      lightSq: CARD_COLORS.lightSq,
      darkSq: CARD_COLORS.darkSq,
      orientation,
      glowColor: `${featuredColor}33`,
    });
  }

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          background: `linear-gradient(135deg, ${CARD_COLORS.bgDeep} 0%, ${CARD_COLORS.bg} 55%, ${CARD_COLORS.bgDeep} 100%)`,
          fontFamily: "system-ui, sans-serif",
          padding: "44px 52px",
          position: "relative",
        }}
      >
        {/* Accent glows */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: `radial-gradient(ellipse at 18% 12%, ${featuredColor}22 0%, transparent 55%), radial-gradient(ellipse at 88% 92%, rgba(251,146,60,0.14) 0%, transparent 55%)`,
            display: "flex",
          }}
        />
        {/* Frame */}
        <div
          style={{
            position: "absolute",
            inset: 18,
            border: `1px solid ${CARD_COLORS.border}`,
            borderRadius: 24,
            display: "flex",
          }}
        />

        {/* LEFT: board */}
        {boardEl && featured ? (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              marginRight: 48,
            }}
          >
            {boardEl}
            <div
              style={{
                display: "flex",
                marginTop: 14,
                alignItems: "center",
                gap: 10,
              }}
            >
              <span style={{ fontSize: 22 }}>
                {featuredKind === "brilliant" ? "\u{1F48E}" : "\u{1F3AF}"}
              </span>
              <span
                style={{
                  fontSize: 24,
                  fontWeight: 800,
                  color: featuredColor,
                  fontFamily: "monospace",
                }}
              >
                {uciToSan(featured.fenBefore, featured.userMove)}
              </span>
              <span style={{ fontSize: 16, color: CARD_COLORS.textFaint }}>
                move {featured.moveNumber}
              </span>
            </div>
          </div>
        ) : null}

        {/* RIGHT: text */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            flex: 1,
            justifyContent: "space-between",
            minWidth: 0,
          }}
        >
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                marginBottom: 10,
              }}
            >
              <span style={{ fontSize: 34 }}>{"\u{1F525}"}</span>
              <span
                style={{
                  fontSize: 22,
                  fontWeight: 900,
                  color: CARD_COLORS.brand,
                  letterSpacing: "0.12em",
                }}
              >
                FIRECHESS REPORT
              </span>
            </div>
            <div
              style={{
                fontSize: 54,
                fontWeight: 900,
                color: CARD_COLORS.text,
                lineHeight: 1.05,
                display: "flex",
              }}
            >
              {username}
            </div>
            <div
              style={{
                fontSize: 30,
                fontWeight: 700,
                color: featuredColor,
                marginTop: 8,
                display: "flex",
                lineHeight: 1.2,
              }}
            >
              {vibe}
            </div>
          </div>

          {/* Stat chips */}
          <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
            {typeof accuracy === "number" && (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  padding: "14px 20px",
                  borderRadius: 14,
                  border: `1px solid ${CARD_COLORS.border}`,
                  background: CARD_COLORS.panel,
                }}
              >
                <span style={{ fontSize: 30, fontWeight: 900, color: CARD_COLORS.green }}>
                  {accuracy.toFixed(1)}%
                </span>
                <span style={{ fontSize: 13, color: CARD_COLORS.textFaint, letterSpacing: "0.08em" }}>
                  ACCURACY
                </span>
              </div>
            )}
            {typeof rating === "number" && (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  padding: "14px 20px",
                  borderRadius: 14,
                  border: `1px solid ${CARD_COLORS.border}`,
                  background: CARD_COLORS.panel,
                }}
              >
                <span style={{ fontSize: 30, fontWeight: 900, color: CARD_COLORS.text }}>
                  ~{rating}
                </span>
                <span style={{ fontSize: 13, color: CARD_COLORS.textFaint, letterSpacing: "0.08em" }}>
                  EST. RATING
                </span>
              </div>
            )}
            {games > 0 && (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  padding: "14px 20px",
                  borderRadius: 14,
                  border: `1px solid ${CARD_COLORS.border}`,
                  background: CARD_COLORS.panel,
                }}
              >
                <span style={{ fontSize: 30, fontWeight: 900, color: CARD_COLORS.text }}>
                  {games}
                </span>
                <span style={{ fontSize: 13, color: CARD_COLORS.textFaint, letterSpacing: "0.08em" }}>
                  GAMES
                </span>
              </div>
            )}
          </div>

          {/* Footer */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginTop: 16,
            }}
          >
            <span style={{ fontSize: 18, color: CARD_COLORS.textFaint }}>
              {topTag ? `Biggest leak: ${topTag}` : "Stockfish 18 deep scan"}
            </span>
            <span style={{ fontSize: 20, fontWeight: 800, color: CARD_COLORS.brand }}>
              firechess.com
            </span>
          </div>
        </div>
      </div>
    ),
    { ...OG_SIZE },
  );
}
