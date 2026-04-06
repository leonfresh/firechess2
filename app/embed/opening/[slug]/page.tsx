/**
 * Embeddable Opening Widget — /embed/opening/[slug]
 *
 * A self-contained, iframe-friendly page that chess coaches can embed on
 * their websites. It shows the opening's key ideas, main traps, and a
 * link back to firechess.com for the full analysis.
 *
 * Usage:
 *   <iframe src="https://firechess.com/embed/opening/italian-game"
 *           width="400" height="520" frameborder="0" loading="lazy"></iframe>
 */

import { OPENING_GUIDES } from "@/lib/opening-guides";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return OPENING_GUIDES.map((g) => ({ slug: g.id }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const guide = OPENING_GUIDES.find((g) => g.id === slug);
  if (!guide) return {};
  return {
    title: `${guide.name} — firechess.com`,
    robots: "noindex",
  };
}

const DIFFICULTY_LABEL: Record<string, string> = {
  beginner: "Beginner",
  intermediate: "Intermediate",
  advanced: "Advanced",
};

const DIFFICULTY_COLOR: Record<string, string> = {
  beginner: "#4ade80",
  intermediate: "#fb923c",
  advanced: "#f87171",
};

export default async function EmbedOpeningPage({ params }: Props) {
  const { slug } = await params;
  const guide = OPENING_GUIDES.find((g) => g.id === slug);
  if (!guide) notFound();

  return (
    <div
      style={{
        fontFamily: "'Inter', system-ui, sans-serif",
        background: "linear-gradient(135deg, #0f1117 0%, #1a1f2e 100%)",
        color: "#e2e8f0",
        minHeight: "100vh",
        padding: "16px",
        boxSizing: "border-box",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          marginBottom: "12px",
        }}
      >
        <div>
          <div
            style={{
              fontSize: "10px",
              fontWeight: 700,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: "#f97316",
              marginBottom: "4px",
            }}
          >
            {guide.eco} · {guide.category.toUpperCase()}
          </div>
          <h1
            style={{
              fontSize: "18px",
              fontWeight: 800,
              margin: 0,
              color: "#fff",
              lineHeight: 1.2,
            }}
          >
            {guide.name}
          </h1>
          <p
            style={{
              fontSize: "11px",
              color: "#94a3b8",
              margin: "4px 0 0",
            }}
          >
            {guide.tagline}
          </p>
        </div>
        <span
          style={{
            fontSize: "10px",
            fontWeight: 700,
            padding: "2px 8px",
            borderRadius: "999px",
            background: "rgba(255,255,255,0.07)",
            color: DIFFICULTY_COLOR[guide.difficulty] ?? "#94a3b8",
            whiteSpace: "nowrap",
            marginLeft: "8px",
            flexShrink: 0,
          }}
        >
          {DIFFICULTY_LABEL[guide.difficulty] ?? guide.difficulty}
        </span>
      </div>

      {/* Moves */}
      <div
        style={{
          fontSize: "11px",
          color: "#64748b",
          marginBottom: "14px",
          fontFamily: "monospace",
        }}
      >
        {guide.moves}
      </div>

      {/* Key Ideas */}
      <section style={{ marginBottom: "14px" }}>
        <div
          style={{
            fontSize: "10px",
            fontWeight: 700,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: "#475569",
            marginBottom: "6px",
          }}
        >
          Key Ideas
        </div>
        <ul style={{ margin: 0, padding: 0, listStyle: "none" }}>
          {guide.keyIdeas.slice(0, 3).map((idea, i) => (
            <li
              key={i}
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: "6px",
                fontSize: "12px",
                color: "#cbd5e1",
                marginBottom: "5px",
                lineHeight: 1.4,
              }}
            >
              <span
                style={{ color: "#f97316", flexShrink: 0, marginTop: "1px" }}
              >
                ♟
              </span>
              {idea}
            </li>
          ))}
        </ul>
      </section>

      {/* Main Trap */}
      {guide.traps.length > 0 && (
        <section style={{ marginBottom: "14px" }}>
          <div
            style={{
              fontSize: "10px",
              fontWeight: 700,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "#475569",
              marginBottom: "6px",
            }}
          >
            Featured Trap
          </div>
          <div
            style={{
              borderRadius: "10px",
              border: "1px solid rgba(251,146,60,0.2)",
              background: "rgba(251,146,60,0.05)",
              padding: "10px 12px",
            }}
          >
            <div
              style={{
                fontSize: "12px",
                fontWeight: 700,
                color: "#fb923c",
                marginBottom: "4px",
              }}
            >
              ⚠ {guide.traps[0].name}
            </div>
            <p
              style={{
                fontSize: "11px",
                color: "#94a3b8",
                margin: 0,
                lineHeight: 1.5,
              }}
            >
              {guide.traps[0].description}
            </p>
          </div>
        </section>
      )}

      {/* Famous Players */}
      {guide.players.length > 0 && (
        <div
          style={{
            fontSize: "10px",
            color: "#475569",
            marginBottom: "14px",
          }}
        >
          <span style={{ fontWeight: 700 }}>Played by: </span>
          {guide.players.slice(0, 3).join(", ")}
        </div>
      )}

      {/* Footer CTA */}
      <a
        href={`https://firechess.com/openings/${guide.id}`}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderRadius: "10px",
          border: "1px solid rgba(249,115,22,0.25)",
          background: "rgba(249,115,22,0.08)",
          padding: "10px 14px",
          textDecoration: "none",
          color: "#fb923c",
          fontSize: "12px",
          fontWeight: 700,
          transition: "background 0.15s",
        }}
      >
        <span>🔥 Full guide + interactive traps</span>
        <span style={{ fontSize: "10px", color: "#64748b" }}>
          firechess.com →
        </span>
      </a>
    </div>
  );
}
