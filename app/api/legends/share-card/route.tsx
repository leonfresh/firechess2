/**
 * GET /api/ghost/share-card
 *
 * Generates a 1200×630 OG share card for a completed Ghost Mode session.
 *
 * Query params:
 *   syncRate    — number 0-100
 *   cookFound   — "1" | "0"
 *   whiteName   — e.g. "Robert James Fischer"
 *   blackName   — e.g. "Mikhail Tal"
 *   playAs      — "white" | "black"
 *   tournament  — e.g. "Candidates Tournament"
 *   eventDate   — e.g. "1959-10-11"
 *   fen         — final board FEN (optional)
 */

import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

export const runtime = "edge";

const LICHESS_PIECE_CDN =
  "https://raw.githubusercontent.com/lichess-org/lila/master/public/piece";
const DEFAULT_PIECE_SET = "cburnett";

const PIECE_CHAR: Record<string, string> = {
  K: "♔",
  Q: "♕",
  R: "♖",
  B: "♗",
  N: "♘",
  P: "♙",
  k: "♚",
  q: "♛",
  r: "♜",
  b: "♝",
  n: "♞",
  p: "♟",
};

function fenCharToPieceKey(ch: string): string {
  const isWhite = ch === ch.toUpperCase();
  return `${isWhite ? "w" : "b"}${ch.toUpperCase()}`;
}

function parseFen(fen: string, flip: boolean): (string | null)[][] {
  const ranks = fen.split(" ")[0].split("/");
  const board: (string | null)[][] = [];
  for (const rank of ranks) {
    const row: (string | null)[] = [];
    for (const ch of rank) {
      if (/\d/.test(ch)) {
        for (let i = 0; i < parseInt(ch); i++) row.push(null);
      } else {
        row.push(ch);
      }
    }
    board.push(row);
  }
  if (flip) {
    board.reverse();
    board.forEach((row) => row.reverse());
  }
  return board;
}

async function fetchAsDataUri(url: string): Promise<string | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const buf = await res.arrayBuffer();
    const base64 = Buffer.from(buf).toString("base64");
    const ct = res.headers.get("content-type") ?? "image/svg+xml";
    return `data:${ct};base64,${base64}`;
  } catch {
    return null;
  }
}

function syncColor(rate: number): string {
  if (rate >= 80) return "#4ade80"; // green
  if (rate >= 50) return "#fbbf24"; // amber
  return "#f87171"; // red
}

function syncLabel(rate: number): string {
  if (rate >= 90) return "PERFECT SYNC";
  if (rate >= 75) return "HIGH SYNC";
  if (rate >= 50) return "PARTIAL SYNC";
  return "LOW SYNC";
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  const syncRate = Math.round(Number(searchParams.get("syncRate") ?? "0"));
  const cookFound = searchParams.get("cookFound") === "1";
  const whiteName = searchParams.get("whiteName") ?? "White";
  const blackName = searchParams.get("blackName") ?? "Black";
  const playAs = searchParams.get("playAs") ?? "white";
  const tournament = searchParams.get("tournament") ?? "";
  const eventDate = searchParams.get("eventDate") ?? "";
  const fenParam = searchParams.get("fen") ?? "";

  const color = syncColor(syncRate);
  const label = syncLabel(syncRate);
  const gmName = playAs === "white" ? whiteName : blackName;
  const opponentName = playAs === "white" ? blackName : whiteName;
  const year = eventDate ? eventDate.slice(0, 4) : "";

  // Build mini board if FEN provided
  let board: (string | null)[][] | null = null;
  let pieceDataUris: Record<string, string> = {};

  if (fenParam) {
    board = parseFen(fenParam, playAs === "black");
    const uniquePieces = new Set<string>();
    for (const row of board) {
      for (const cell of row) {
        if (cell) uniquePieces.add(cell);
      }
    }
    const pieceKeys = Array.from(uniquePieces);
    const results = await Promise.all(
      pieceKeys.map((ch) =>
        fetchAsDataUri(
          `${LICHESS_PIECE_CDN}/${DEFAULT_PIECE_SET}/${fenCharToPieceKey(ch)}.svg`,
        ),
      ),
    );
    pieceKeys.forEach((ch, i) => {
      if (results[i]) pieceDataUris[ch] = results[i]!;
    });
  }

  const SQ = 38;

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        background:
          "linear-gradient(135deg, #06060f 0%, #0f0a2a 40%, #0c0c14 100%)",
        fontFamily: "system-ui, sans-serif",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Ambient glow */}
      <div
        style={{
          position: "absolute",
          top: "-100px",
          left: "50%",
          transform: "translateX(-50%)",
          width: "800px",
          height: "500px",
          background: `radial-gradient(ellipse, ${color}1a 0%, transparent 65%)`,
          display: "flex",
        }}
      />

      {/* Corner glow — bottom right */}
      <div
        style={{
          position: "absolute",
          bottom: "-80px",
          right: "-60px",
          width: "300px",
          height: "300px",
          background:
            "radial-gradient(circle, rgba(139,92,246,0.08) 0%, transparent 70%)",
          display: "flex",
        }}
      />

      {/* Border frame */}
      <div
        style={{
          position: "absolute",
          inset: "14px",
          border: `2px solid ${color}30`,
          borderRadius: "24px",
          display: "flex",
        }}
      />

      {/* Corner accents */}
      {(["tl", "tr", "bl", "br"] as const).map((corner) => {
        const isTop = corner.startsWith("t");
        const isLeft = corner.endsWith("l");
        return (
          <div
            key={corner}
            style={{
              position: "absolute",
              ...(isTop ? { top: "14px" } : { bottom: "14px" }),
              ...(isLeft ? { left: "14px" } : { right: "14px" }),
              width: "32px",
              height: "32px",
              borderTop: isTop ? `2px solid ${color}70` : undefined,
              borderBottom: !isTop ? `2px solid ${color}70` : undefined,
              borderLeft: isLeft ? `2px solid ${color}70` : undefined,
              borderRight: !isLeft ? `2px solid ${color}70` : undefined,
              borderTopLeftRadius: corner === "tl" ? "24px" : undefined,
              borderTopRightRadius: corner === "tr" ? "24px" : undefined,
              borderBottomLeftRadius: corner === "bl" ? "24px" : undefined,
              borderBottomRightRadius: corner === "br" ? "24px" : undefined,
              display: "flex",
            }}
          />
        );
      })}

      {/* Main content */}
      <div
        style={{
          display: "flex",
          width: "100%",
          height: "100%",
          padding: "48px 56px",
          alignItems: "center",
          gap: "48px",
        }}
      >
        {/* Left: mini chess board (if FEN provided) */}
        {board && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              flexShrink: 0,
              borderRadius: "14px",
              overflow: "hidden",
              border: `2px solid ${color}40`,
              boxShadow: `0 0 30px ${color}18, 0 8px 32px rgba(0,0,0,0.6)`,
            }}
          >
            {board.map((row, r) => (
              <div key={r} style={{ display: "flex" }}>
                {row.map((piece, c) => {
                  const isLight = (r + c) % 2 === 0;
                  const pieceUri = piece ? pieceDataUris[piece] : null;
                  return (
                    <div
                      key={c}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        width: SQ,
                        height: SQ,
                        backgroundColor: isLight ? "#f0d9b5" : "#b58863",
                      }}
                    >
                      {piece && pieceUri ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={pieceUri}
                          width={SQ - 4}
                          height={SQ - 4}
                          style={{ objectFit: "contain" }}
                          alt=""
                        />
                      ) : piece ? (
                        <span
                          style={{
                            fontSize: "26px",
                            lineHeight: 1,
                            opacity: 0.85,
                          }}
                        >
                          {PIECE_CHAR[piece] ?? ""}
                        </span>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        )}

        {/* Right: info */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            flex: 1,
            gap: "16px",
          }}
        >
          {/* Mode label */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
            }}
          >
            <span style={{ fontSize: "22px" }}>�</span>
            <span
              style={{
                fontSize: "18px",
                fontWeight: 700,
                color: "#94a3b8",
                letterSpacing: "0.18em",
                textTransform: "uppercase" as const,
              }}
            >
              Legends
            </span>
          </div>

          {/* GM name */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "4px",
            }}
          >
            <span
              style={{
                fontSize: "14px",
                color: "#64748b",
                letterSpacing: "0.15em",
                textTransform: "uppercase" as const,
              }}
            >
              Playing as
            </span>
            <span
              style={{
                fontSize: "38px",
                fontWeight: 900,
                color: "white",
                lineHeight: 1.1,
              }}
            >
              {gmName}
            </span>
            <span
              style={{
                fontSize: "15px",
                color: "#475569",
              }}
            >
              vs {opponentName}
              {tournament ? ` · ${tournament}` : ""}
              {year ? ` (${year})` : ""}
            </span>
          </div>

          {/* Sync rate */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "20px",
              padding: "16px 28px",
              borderRadius: "20px",
              border: `2px solid ${color}40`,
              background: `${color}0f`,
            }}
          >
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "2px",
              }}
            >
              <span
                style={{
                  fontSize: "64px",
                  fontWeight: 900,
                  color,
                  lineHeight: 1,
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {syncRate}%
              </span>
              <span
                style={{
                  fontSize: "14px",
                  fontWeight: 700,
                  color,
                  letterSpacing: "0.14em",
                  textTransform: "uppercase" as const,
                }}
              >
                {label}
              </span>
            </div>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "8px",
                flex: 1,
                borderLeft: "1px solid rgba(255,255,255,0.06)",
                paddingLeft: "20px",
              }}
            >
              <span style={{ fontSize: "14px", color: "#64748b" }}>
                Sync meter with the legend's actual moves
              </span>
              {cookFound && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "8px 14px",
                    borderRadius: "12px",
                    border: "1px solid rgba(139,92,246,0.4)",
                    background: "rgba(139,92,246,0.1)",
                  }}
                >
                  <span style={{ fontSize: "20px" }}>🌀</span>
                  <span
                    style={{
                      fontSize: "14px",
                      fontWeight: 800,
                      color: "#a78bfa",
                      letterSpacing: "0.1em",
                      textTransform: "uppercase" as const,
                    }}
                  >
                    Timeline Divergence!
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* CTA */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              color: "#475569",
              fontSize: "15px",
            }}
          >
            <span>�</span>
            <span style={{ fontWeight: 700, color: "#64748b" }}>
              firechess.com/legends
            </span>
            <span>— Can you match the GOAT?</span>
          </div>
        </div>
      </div>
    </div>,
    { width: 1200, height: 630 },
  );
}
