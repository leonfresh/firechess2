import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

export const runtime = "edge";

const LICHESS_PIECE_CDN = "https://raw.githubusercontent.com/lichess-org/lila/master/public/piece";
const DEFAULT_PIECE_SET = "cburnett";

/* ── Unicode fallback pieces ── */
const PIECE_CHAR: Record<string, string> = {
  K: "\u2654", Q: "\u2655", R: "\u2656", B: "\u2657", N: "\u2658", P: "\u2659",
  k: "\u265A", q: "\u265B", r: "\u265C", b: "\u265D", n: "\u265E", p: "\u265F",
};

/** Map FEN char → piece key for Lichess CDN (e.g. "K" → "wK", "q" → "bQ") */
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

/** Fetch an image and return as base64 data URI */
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

/**
 * GET /api/roast/moment-card?move=Qxf7&moveNum=24&classification=blunder
 *     &comment=...&fen=...&orientation=white&pepeImg=...
 *     &lightSq=%23f0d9b5&darkSq=%23b58863&pieceSet=cburnett
 *
 * Generates a shareable OG-style "moment" card with the chess board,
 * current Pepe commentator avatar, classification, and commentary.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const origin = new URL(req.url).origin;

  const move = searchParams.get("move") ?? "???";
  const moveNum = searchParams.get("moveNum") ?? "?";
  const classification = searchParams.get("classification") ?? "blunder";
  const comment = searchParams.get("comment") ?? "";
  const fenRaw = searchParams.get("fen") ?? "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR";
  const orientationParam = searchParams.get("orientation") ?? "white";
  const pepeImg = searchParams.get("pepeImg") ?? "/pepe-emojis/3959-hmm.png";
  const lightSq = searchParams.get("lightSq") ?? "#f0d9b5";
  const darkSq = searchParams.get("darkSq") ?? "#b58863";
  const pieceSet = searchParams.get("pieceSet") ?? DEFAULT_PIECE_SET;

  const board = parseFen(fenRaw, orientationParam === "black");

  // Collect unique pieces on the board and fetch their SVGs in parallel
  const uniquePieces = new Set<string>();
  for (const row of board) {
    for (const cell of row) {
      if (cell) uniquePieces.add(cell);
    }
  }

  // Fetch all piece SVGs + pepe image in parallel
  const pieceKeys = Array.from(uniquePieces);
  const fetchPromises = pieceKeys.map((ch) =>
    fetchAsDataUri(`${LICHESS_PIECE_CDN}/${pieceSet}/${fenCharToPieceKey(ch)}.svg`)
  );
  fetchPromises.push(fetchAsDataUri(`${origin}${pepeImg}`));

  const results = await Promise.all(fetchPromises);
  const pieceDataUris: Record<string, string> = {};
  pieceKeys.forEach((ch, i) => {
    if (results[i]) pieceDataUris[ch] = results[i]!;
  });
  const pepeDataUri = results[results.length - 1] ?? "";

  const classConfig: Record<string, { color: string; label: string; emoji: string; bg: string }> = {
    blunder:   { color: "#f87171", label: "BLUNDER",    emoji: "\uD83D\uDC80", bg: "rgba(239,68,68,0.08)" },
    brilliant: { color: "#22d3ee", label: "BRILLIANT",  emoji: "\uD83D\uDC8E", bg: "rgba(34,211,238,0.08)" },
    mistake:   { color: "#fb923c", label: "MISTAKE",    emoji: "\uD83D\uDE2C", bg: "rgba(251,146,60,0.08)" },
    best:      { color: "#4ade80", label: "BEST MOVE",  emoji: "\uD83C\uDFAF", bg: "rgba(74,222,128,0.08)" },
    great:     { color: "#a78bfa", label: "GREAT MOVE", emoji: "\u26A1",       bg: "rgba(167,139,250,0.08)" },
  };
  const config = classConfig[classification] ?? classConfig.blunder;

  const trimmedComment = comment.length > 160 ? comment.slice(0, 157) + "..." : comment;
  const SQ = 44; // square size for the mini board

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          background: "linear-gradient(160deg, #0c0c14 0%, #18102a 40%, #0f0a1a 100%)",
          fontFamily: "system-ui, sans-serif",
          position: "relative",
          overflow: "hidden",
          padding: "36px 48px",
        }}
      >
        {/* Top glow */}
        <div
          style={{
            position: "absolute",
            top: "-80px",
            left: "50%",
            transform: "translateX(-50%)",
            width: "900px",
            height: "400px",
            background: `radial-gradient(ellipse, ${config.color}18 0%, transparent 60%)`,
            display: "flex",
          }}
        />
        {/* Border frame */}
        <div
          style={{
            position: "absolute",
            inset: "14px",
            border: `2px solid ${config.color}33`,
            borderRadius: "24px",
            display: "flex",
          }}
        />

        {/* ── LEFT: Chess Board ── */}
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", marginRight: "40px", flexShrink: 0 }}>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              borderRadius: "16px",
              overflow: "hidden",
              border: "3px solid rgba(255,255,255,0.15)",
              boxShadow: `0 0 40px ${config.color}22, 0 8px 32px rgba(0,0,0,0.6)`,
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
                        backgroundColor: isLight ? lightSq : darkSq,
                      }}
                    >
                      {piece && pieceUri ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={pieceUri} width={SQ - 4} height={SQ - 4} style={{ objectFit: "contain" }} alt="" />
                      ) : piece ? (
                        <span style={{ fontSize: "32px", lineHeight: 1, opacity: 0.85 }}>
                          {PIECE_CHAR[piece] ?? ""}
                        </span>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        {/* ── RIGHT: Info ── */}
        <div style={{ display: "flex", flexDirection: "column", flex: 1, justifyContent: "space-between", minWidth: 0 }}>
          {/* Header row */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
              <span style={{ fontSize: "46px" }}>{config.emoji}</span>
              <div style={{ display: "flex", flexDirection: "column" }}>
                <span style={{ fontSize: "38px", fontWeight: 900, color: config.color, letterSpacing: "0.08em" }}>
                  {config.label}
                </span>
                <span style={{ fontSize: "16px", color: "#64748b", marginTop: "2px" }}>
                  Move {moveNum}
                </span>
              </div>
            </div>
            {/* Move badge */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                padding: "12px 28px",
                borderRadius: "16px",
                border: `3px solid ${config.color}55`,
                background: config.bg,
              }}
            >
              <span style={{ fontSize: "36px", fontWeight: 900, color: "white", fontFamily: "monospace" }}>
                {move}
              </span>
            </div>
          </div>

          {/* Commentary with Pepe avatar */}
          <div
            style={{
              display: "flex",
              flex: 1,
              alignItems: "center",
              padding: "20px 24px",
              borderRadius: "16px",
              border: `2px solid ${config.color}22`,
              background: `${config.color}08`,
            }}
          >
            <div style={{ display: "flex", alignItems: "flex-start", gap: "16px", width: "100%" }}>
              {pepeDataUri && (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={pepeDataUri}
                  width={72}
                  height={72}
                  style={{ borderRadius: "12px", flexShrink: 0, objectFit: "contain" }}
                  alt=""
                />
              )}
              <span style={{ fontSize: trimmedComment.length > 120 ? "22px" : "26px", color: "#e2e8f0", lineHeight: 1.45, fontStyle: "italic" }}>
                {trimmedComment ? `\u201C${trimmedComment}\u201D` : "\u201CNo words.\u201D"}
              </span>
            </div>
          </div>

          {/* Footer */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "16px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <span style={{ fontSize: "20px" }}>{"\uD83D\uDD25"}</span>
              <span style={{ fontSize: "20px", fontWeight: 900, color: "#fb923c", letterSpacing: "0.1em" }}>
                ROAST THE ELO
              </span>
              <span style={{ color: "#475569", fontSize: "15px", marginLeft: "8px" }}>firechess.com/roast</span>
            </div>
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    },
  );
}
