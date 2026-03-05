import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "FireChess — Free Chess Analysis & Opening Leak Scanner";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OgImage() {
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
          background: "linear-gradient(135deg, #0a0a0f 0%, #0f172a 50%, #0a0a0f 100%)",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        {/* Accent gradient overlay */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background:
              "radial-gradient(ellipse at 30% 20%, rgba(16, 185, 129, 0.15) 0%, transparent 50%), radial-gradient(ellipse at 70% 80%, rgba(6, 182, 212, 0.1) 0%, transparent 50%)",
            display: "flex",
          }}
        />

        {/* Border */}
        <div
          style={{
            position: "absolute",
            top: 16,
            left: 16,
            right: 16,
            bottom: 16,
            border: "1px solid rgba(255, 255, 255, 0.06)",
            borderRadius: 24,
            display: "flex",
          }}
        />

        {/* Content */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 24,
            padding: "0 80px",
            textAlign: "center",
          }}
        >
          {/* Chess emoji as logo placeholder */}
          <div
            style={{
              fontSize: 72,
              display: "flex",
            }}
          >
            ♟
          </div>

          {/* Title */}
          <div
            style={{
              fontSize: 56,
              fontWeight: 800,
              background: "linear-gradient(90deg, #10b981, #06b6d4)",
              backgroundClip: "text",
              color: "transparent",
              lineHeight: 1.1,
              display: "flex",
            }}
          >
            FireChess
          </div>

          {/* Subtitle */}
          <div
            style={{
              fontSize: 28,
              color: "#94a3b8",
              lineHeight: 1.4,
              maxWidth: 800,
              display: "flex",
            }}
          >
            Free Chess Analysis & Opening Leak Scanner
          </div>

          {/* Feature pills */}
          <div
            style={{
              display: "flex",
              gap: 16,
              marginTop: 8,
            }}
          >
            {["Opening Leaks", "Missed Tactics", "Endgame Blunders", "Stockfish 18"].map(
              (f) => (
                <div
                  key={f}
                  style={{
                    padding: "8px 20px",
                    borderRadius: 9999,
                    border: "1px solid rgba(16, 185, 129, 0.3)",
                    backgroundColor: "rgba(16, 185, 129, 0.1)",
                    color: "#6ee7b7",
                    fontSize: 16,
                    fontWeight: 600,
                    display: "flex",
                  }}
                >
                  {f}
                </div>
              )
            )}
          </div>

          {/* URL */}
          <div
            style={{
              fontSize: 18,
              color: "#475569",
              marginTop: 12,
              display: "flex",
            }}
          >
            firechess.com
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
