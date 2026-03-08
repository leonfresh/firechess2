import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

export const runtime = "edge";

/**
 * GET /api/roast/moment-card?move=Qxf7&moveNum=24&classification=blunder&comment=...&elo=1200
 *
 * Generates a shareable "moment" card for a specific dramatic move.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  const move = searchParams.get("move") ?? "???";
  const moveNum = searchParams.get("moveNum") ?? "?";
  const classification = searchParams.get("classification") ?? "blunder";
  const comment = searchParams.get("comment") ?? "";
  const elo = searchParams.get("elo") ?? "";

  const classConfig: Record<string, { color: string; label: string; emoji: string; bg: string }> = {
    blunder: { color: "#f87171", label: "BLUNDER", emoji: "💀", bg: "rgba(239,68,68,0.08)" },
    brilliant: { color: "#22d3ee", label: "BRILLIANT", emoji: "💎", bg: "rgba(34,211,238,0.08)" },
    mistake: { color: "#fb923c", label: "MISTAKE", emoji: "😬", bg: "rgba(251,146,60,0.08)" },
    best: { color: "#4ade80", label: "BEST MOVE", emoji: "🎯", bg: "rgba(74,222,128,0.08)" },
    great: { color: "#a78bfa", label: "GREAT MOVE", emoji: "⚡", bg: "rgba(167,139,250,0.08)" },
  };
  const config = classConfig[classification] ?? classConfig.blunder;

  const trimmedComment = comment.length > 180 ? comment.slice(0, 177) + "..." : comment;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background: "linear-gradient(160deg, #0c0c14 0%, #18102a 40%, #0f0a1a 100%)",
          fontFamily: "system-ui, sans-serif",
          position: "relative",
          overflow: "hidden",
          padding: "48px 60px",
        }}
      >
        {/* Top glow matching classification color */}
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
            inset: "16px",
            border: `2px solid ${config.color}33`,
            borderRadius: "24px",
            display: "flex",
          }}
        />

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "32px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <span style={{ fontSize: "52px" }}>{config.emoji}</span>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ fontSize: "42px", fontWeight: 900, color: config.color, letterSpacing: "0.08em", textTransform: "uppercase" as const }}>
                {config.label}
              </span>
              <span style={{ fontSize: "18px", color: "#64748b", marginTop: "4px" }}>
                Move {moveNum}
              </span>
            </div>
          </div>
          {/* The move itself */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              padding: "16px 32px",
              borderRadius: "20px",
              border: `3px solid ${config.color}55`,
              background: config.bg,
            }}
          >
            <span style={{ fontSize: "40px", fontWeight: 900, color: "white", fontFamily: "monospace" }}>
              {move}
            </span>
          </div>
        </div>

        {/* Commentary */}
        {trimmedComment && (
          <div
            style={{
              display: "flex",
              flex: 1,
              alignItems: "center",
              padding: "32px 40px",
              borderRadius: "20px",
              border: `2px solid ${config.color}22`,
              background: `${config.color}08`,
            }}
          >
            <div style={{ display: "flex", alignItems: "flex-start", gap: "20px" }}>
              <span style={{ fontSize: "40px", flexShrink: 0, lineHeight: 1 }}>🐸</span>
              <span style={{ fontSize: "28px", color: "#e2e8f0", lineHeight: 1.5, fontStyle: "italic" }}>
                &ldquo;{trimmedComment}&rdquo;
              </span>
            </div>
          </div>
        )}

        {/* Footer */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "24px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ fontSize: "20px" }}>🔥</span>
            <span style={{ fontSize: "20px", fontWeight: 900, color: "#fb923c", letterSpacing: "0.1em" }}>
              ROAST THE ELO
            </span>
            <span style={{ color: "#475569", fontSize: "16px", marginLeft: "8px" }}>firechess.app/roast</span>
          </div>
          {elo && (
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "16px", color: "#64748b" }}>Elo:</span>
              <span style={{ fontSize: "24px", fontWeight: 900, color: "white" }}>{elo}</span>
            </div>
          )}
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    },
  );
}
