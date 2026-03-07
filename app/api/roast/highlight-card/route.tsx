import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

export const runtime = "edge";

/**
 * GET /api/roast/highlight-card?elo=1200&result=MISS&lines=line1||line2||line3&opening=Sicilian+Defense
 *
 * Generates a "Best Roast Moments" highlight card with top commentary lines.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  const elo = searchParams.get("elo") ?? "???";
  const result = searchParams.get("result") ?? "MISS";
  const opening = searchParams.get("opening") ?? "";
  const linesRaw = searchParams.get("lines") ?? "";
  const lines = linesRaw.split("||").filter(Boolean).slice(0, 3);

  const resultConfig = {
    PERFECT: { color: "#4ade80", label: "NAILED IT", emoji: "🎯" },
    CLOSE: { color: "#fbbf24", label: "CLOSE CALL", emoji: "🔥" },
    MISS: { color: "#f87171", label: "NOT EVEN CLOSE", emoji: "💀" },
  }[result] ?? { color: "#f87171", label: "NOT EVEN CLOSE", emoji: "💀" };

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
        {/* Top glow */}
        <div
          style={{
            position: "absolute",
            top: "-60px",
            left: "50%",
            transform: "translateX(-50%)",
            width: "800px",
            height: "300px",
            background: "radial-gradient(ellipse, rgba(251,146,60,0.12) 0%, transparent 65%)",
            display: "flex",
          }}
        />

        {/* Border frame */}
        <div
          style={{
            position: "absolute",
            inset: "16px",
            border: "2px solid rgba(251,146,60,0.2)",
            borderRadius: "24px",
            display: "flex",
          }}
        />

        {/* Header row */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <span style={{ fontSize: "28px" }}>🔥</span>
            <span style={{ fontSize: "28px", fontWeight: 900, color: "#fb923c", letterSpacing: "0.12em", textTransform: "uppercase" as const }}>
              Best Roast Moments
            </span>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "6px 20px",
              borderRadius: "999px",
              border: `2px solid ${resultConfig.color}`,
              background: `${resultConfig.color}15`,
            }}
          >
            <span style={{ fontSize: "20px" }}>{resultConfig.emoji}</span>
            <span style={{ fontSize: "18px", fontWeight: 900, color: resultConfig.color }}>{resultConfig.label}</span>
          </div>
        </div>

        {/* Elo + opening subtitle */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "28px" }}>
          <span style={{ fontSize: "16px", color: "#64748b" }}>
            Elo: <span style={{ color: "white", fontWeight: 900, fontSize: "22px" }}>{elo}</span>
          </span>
          {opening && (
            <>
              <span style={{ color: "#334155", fontSize: "14px" }}>·</span>
              <span style={{ fontSize: "14px", color: "#475569" }}>📋 {opening.length > 40 ? opening.slice(0, 38) + "…" : opening}</span>
            </>
          )}
        </div>

        {/* Roast lines */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px", flex: 1 }}>
          {lines.map((line, i) => {
            const trimmed = line.length > 140 ? line.slice(0, 137) + "..." : line;
            const colors = ["#f87171", "#fb923c", "#eab308"];
            const borders = ["rgba(239,68,68,0.25)", "rgba(251,146,60,0.25)", "rgba(234,179,8,0.25)"];
            const bgs = ["rgba(239,68,68,0.06)", "rgba(251,146,60,0.06)", "rgba(234,179,8,0.06)"];
            const emojis = ["💀", "🔥", "🗿"];
            return (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "16px",
                  padding: "18px 24px",
                  borderRadius: "16px",
                  border: `2px solid ${borders[i]}`,
                  background: bgs[i],
                }}
              >
                <span style={{ fontSize: "28px", flexShrink: 0, lineHeight: 1 }}>{emojis[i]}</span>
                <span style={{ fontSize: "20px", color: "#e2e8f0", lineHeight: 1.5, fontStyle: "italic" }}>
                  &ldquo;{trimmed}&rdquo;
                </span>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "20px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#64748b", fontSize: "16px" }}>
            <span>🐸</span>
            <span style={{ fontWeight: 700 }}>firechess.app/roast</span>
          </div>
          <span style={{ color: "#475569", fontSize: "14px" }}>Can you survive the roast?</span>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    },
  );
}
