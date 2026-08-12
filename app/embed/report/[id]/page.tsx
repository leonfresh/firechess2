import { db } from "@/lib/db";
import { scanSessions } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

export const metadata: Metadata = { robots: "noindex" };

export default async function EmbedReportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [scan] = await db.select().from(scanSessions).where(eq(scanSessions.id, id)).limit(1);
  if (!scan?.result) notFound();

  const r = scan.result as any;
  const meta = scan.reportMeta as any;
  const accuracy = meta?.estimatedAccuracy?.toFixed(1) ?? "—";
  const rating = meta?.estimatedRating ?? "—";
  const vibe = meta?.vibeTitle ?? "Chess report";
  const leaks = r.leaks?.length ?? 0;
  const tactics = r.missedTactics?.length ?? 0;
  const endgames = r.endgameMistakes?.length ?? 0;
  const games = r.gamesAnalyzed ?? "?";
  const topLeak = r.leaks?.[0];
  const topTag = meta?.topTag ?? "";
  const biggestTactic = r.missedTactics?.reduce?.((a: any, b: any) => (b.cpLoss > a.cpLoss ? b : a), r.missedTactics[0]);

  const shareUrl = `https://firechess.com/report/${id}`;
  const bg = "#0a0a0a";
  const cardBg = "#111113";
  const border = "#1f1f22";
  const accent = "#f59e0b";
  const green = "#4ade80";
  const red = "#f87171";
  const muted = "#5c5c64";
  const text = "#a1a1aa";
  const white = "#e4e4e7";

  return (
    <div style={{
      background: bg, color: text, fontFamily: "system-ui, sans-serif",
      padding: "20px 16px", maxWidth: "400px", margin: "0 auto", minHeight: "320px",
      display: "flex", flexDirection: "column", gap: "14px",
    }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <p style={{ fontSize: "11px", color: muted, textTransform: "uppercase", letterSpacing: "0.1em", margin: 0 }}>
            {scan.chessUsername}'s report
          </p>
          <p style={{ fontSize: "16px", fontWeight: 700, color: white, margin: "2px 0 0" }}>{vibe}</p>
        </div>
        <a href={shareUrl} target="_blank" rel="noopener" style={{
          fontSize: "11px", color: accent, textDecoration: "none",
          padding: "4px 10px", borderRadius: "6px", border: `1px solid ${accent}30`,
          background: `${accent}10`,
        }}>
          Full report →
        </a>
      </div>

      {/* Stats row */}
      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
        {[
          { label: "Accuracy", value: `${accuracy}%`, color: green },
          { label: "Rating", value: `~${rating}`, color: accent },
          { label: "Games", value: games, color: muted },
        ].map((s) => (
          <div key={s.label} style={{
            flex: "1 1 auto", minWidth: "80px", padding: "10px 8px",
            borderRadius: "10px", border: `1px solid ${border}`, background: cardBg, textAlign: "center",
          }}>
            <p style={{ fontSize: "10px", color: muted, margin: 0, textTransform: "uppercase" }}>{s.label}</p>
            <p style={{ fontSize: "18px", fontWeight: 700, color: s.color, margin: "2px 0 0" }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Issues found */}
      <div style={{ display: "flex", gap: "6px" }}>
        {[
          { label: "Leaks", count: leaks, color: "#f59e0b" },
          { label: "Tactics", count: tactics, color: red },
          { label: "Endgames", count: endgames, color: "#a78bfa" },
        ].map((i) => (
          <div key={i.label} style={{
            flex: 1, textAlign: "center", padding: "6px 4px",
            borderRadius: "8px", border: `1px solid ${border}`, background: cardBg,
          }}>
            <p style={{ fontSize: "10px", color: muted, margin: 0 }}>{i.label}</p>
            <p style={{ fontSize: "14px", fontWeight: 700, color: i.color, margin: "1px 0 0" }}>{i.count}</p>
          </div>
        ))}
      </div>

      {/* Top finding */}
      {topTag && (
        <div style={{ padding: "10px 12px", borderRadius: "10px", border: `1px solid ${accent}20`, background: `${accent}08` }}>
          <p style={{ fontSize: "10px", color: muted, margin: 0, textTransform: "uppercase" }}>Biggest signal</p>
          <p style={{ fontSize: "13px", fontWeight: 600, color: white, margin: "3px 0 0" }}>{topTag}</p>
          {topLeak && (
            <p style={{ fontSize: "11px", color: muted, margin: "2px 0 0" }}>
              Reached {topLeak.reachCount}x · lost ~{(topLeak.cpLoss / 100).toFixed(1)} pawns avg
            </p>
          )}
        </div>
      )}

      {/* Powered by */}
      <div style={{ marginTop: "auto", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <p style={{ fontSize: "10px", color: muted, margin: 0 }}>
          Powered by FireChess · Stockfish 18
        </p>
        <a href={shareUrl} target="_blank" rel="noopener" style={{
          fontSize: "10px", color: accent, textDecoration: "none",
          padding: "3px 8px", borderRadius: "5px", border: `1px solid ${accent}20`,
        }}>
          View full
        </a>
      </div>
    </div>
  );
}
