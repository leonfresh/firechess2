import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

export const runtime = "edge";

/**
 * GET /api/roast/share-card?elo=1200&guess=Intermediate&result=PERFECT&blunders=5&mistakes=3&inaccuracies=7&score=6&games=3&streak=2
 *
 * Generates a shareable OG-style card image for Roast the Elo results.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  const elo = searchParams.get("elo") ?? "???";
  const guess = searchParams.get("guess") ?? "???";
  const result = searchParams.get("result") ?? "MISS"; // PERFECT | CLOSE | MISS
  const blunders = searchParams.get("blunders") ?? "0";
  const mistakes = searchParams.get("mistakes") ?? "0";
  const inaccuracies = searchParams.get("inaccuracies") ?? "0";
  const score = searchParams.get("score") ?? "0";
  const games = searchParams.get("games") ?? "1";
  const streak = searchParams.get("streak") ?? "0";

  const resultConfig = {
    PERFECT: { emoji: "🎯", color: "#4ade80", label: "PERFECT", bg: "rgba(34,197,94,0.15)" },
    CLOSE: { emoji: "🔥", color: "#fbbf24", label: "CLOSE", bg: "rgba(251,191,36,0.15)" },
    MISS: { emoji: "💀", color: "#f87171", label: "MISS", bg: "rgba(248,113,113,0.15)" },
  }[result] ?? { emoji: "💀", color: "#f87171", label: "MISS", bg: "rgba(248,113,113,0.15)" };

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #0c0c14 0%, #1a1025 30%, #0f0a1a 70%, #0c0c14 100%)",
          fontFamily: "system-ui, sans-serif",
          position: "relative",
        }}
      >
        {/* Spotlight glow */}
        <div
          style={{
            position: "absolute",
            top: "-100px",
            left: "50%",
            transform: "translateX(-50%)",
            width: "600px",
            height: "400px",
            background: "radial-gradient(ellipse, rgba(251,146,60,0.2) 0%, transparent 70%)",
            display: "flex",
          }}
        />

        {/* Border frame */}
        <div
          style={{
            position: "absolute",
            inset: "16px",
            border: "3px solid rgba(251,146,60,0.3)",
            borderRadius: "24px",
            display: "flex",
          }}
        />

        {/* Title banner */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            marginBottom: "8px",
          }}
        >
          <span style={{ fontSize: "28px" }}>🔥</span>
          <span style={{ fontSize: "32px", fontWeight: 900, color: "#fb923c", letterSpacing: "0.15em", textTransform: "uppercase" as const }}>
            Roast the Elo
          </span>
          <span style={{ fontSize: "28px" }}>🔥</span>
        </div>

        {/* Result badge */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            padding: "12px 36px",
            borderRadius: "999px",
            border: `3px solid ${resultConfig.color}`,
            background: resultConfig.bg,
            marginBottom: "20px",
          }}
        >
          <span style={{ fontSize: "40px" }}>{resultConfig.emoji}</span>
          <span style={{ fontSize: "42px", fontWeight: 900, color: resultConfig.color, letterSpacing: "0.08em" }}>
            {resultConfig.label}
          </span>
        </div>

        {/* Elo reveal */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: "24px" }}>
          <span style={{ fontSize: "18px", color: "#94a3b8", fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase" as const }}>
            The Rating Was
          </span>
          <span
            style={{
              fontSize: "96px",
              fontWeight: 900,
              color: "white",
              lineHeight: 1,
              marginTop: "4px",
              textShadow: "0 0 40px rgba(251,191,36,0.4)",
            }}
          >
            {elo}
          </span>
          <span style={{ fontSize: "20px", color: "#64748b", marginTop: "4px" }}>
            My guess: {guess}
          </span>
        </div>

        {/* Stats row */}
        <div style={{ display: "flex", gap: "24px", marginBottom: "24px" }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "12px 24px", borderRadius: "16px", border: "2px solid rgba(239,68,68,0.3)", background: "rgba(239,68,68,0.08)" }}>
            <span style={{ fontSize: "36px", fontWeight: 900, color: "#f87171" }}>{blunders}</span>
            <span style={{ fontSize: "14px", color: "#f8717180", fontWeight: 700, textTransform: "uppercase" as const }}>Blunders</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "12px 24px", borderRadius: "16px", border: "2px solid rgba(251,146,60,0.3)", background: "rgba(251,146,60,0.08)" }}>
            <span style={{ fontSize: "36px", fontWeight: 900, color: "#fb923c" }}>{mistakes}</span>
            <span style={{ fontSize: "14px", color: "#fb923c80", fontWeight: 700, textTransform: "uppercase" as const }}>Mistakes</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "12px 24px", borderRadius: "16px", border: "2px solid rgba(234,179,8,0.3)", background: "rgba(234,179,8,0.08)" }}>
            <span style={{ fontSize: "36px", fontWeight: 900, color: "#eab308" }}>{inaccuracies}</span>
            <span style={{ fontSize: "14px", color: "#eab30880", fontWeight: 700, textTransform: "uppercase" as const }}>Inaccuracies</span>
          </div>
        </div>

        {/* Score + streak */}
        <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
          <span style={{ fontSize: "18px", color: "#94a3b8" }}>
            Score: <span style={{ color: "#fbbf24", fontWeight: 900 }}>{score}</span>
            <span style={{ color: "#64748b" }}>/{Number(games) * 3}</span>
          </span>
          {Number(streak) >= 2 && (
            <span style={{ fontSize: "18px", display: "flex", alignItems: "center", gap: "4px" }}>
              <span>🔥</span>
              <span style={{ color: "#fb923c", fontWeight: 900 }}>{streak} Streak</span>
            </span>
          )}
        </div>

        {/* CTA */}
        <div style={{ display: "flex", marginTop: "24px", color: "#475569", fontSize: "16px" }}>
          🐸 firechess.app/roast
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    },
  );
}
