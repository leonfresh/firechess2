/**
 * Chaos Chess share cards (satori / ImageResponse). Typography-only on purpose:
 * no remote font or image fetches at render time, so cards never break in prod
 * and never depend on a board renderer. Layout rules that matter in satori:
 * every multi-child container declares display:flex, and no reliance on inline
 * flow for chips or badges.
 */
import { CHAOS_TIER_STYLE, type ChaosBadge, type ChaosTier } from "./chaos-score";

const BG = "#0d1726";
const PANEL = "linear-gradient(120deg,#29445a,#192639)";
const GOLD = "#c69a54";
const CREAM = "#fff0c7";
const MUTED = "#9fb6c6";
const LIME = "#d7fa64";

const clip = (value: string, max: number) => {
  const text = String(value ?? "").replace(/\s+/g, " ").trim();
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
};

function Chip({ icon, name, detail, accent }: { icon: string; name: string; detail?: string; accent: string }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        border: `2px solid ${accent}44`,
        background: `${accent}18`,
        borderRadius: 16,
        padding: "10px 16px",
      }}
    >
      <div style={{ display: "flex", fontSize: 26 }}>{icon}</div>
      <div style={{ display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", fontSize: 22, fontWeight: 700, color: CREAM }}>{clip(name, 28)}</div>
        {detail ? <div style={{ display: "flex", fontSize: 17, color: MUTED }}>{clip(detail, 44)}</div> : null}
      </div>
    </div>
  );
}

function ScoreBlock({ score, tier, square }: { score: number; tier: ChaosTier; square?: boolean }) {
  const style = CHAOS_TIER_STYLE[tier] ?? CHAOS_TIER_STYLE.QUIET;
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minWidth: square ? 0 : 250,
        border: `3px solid ${style.color}66`,
        background: `${style.color}14`,
        borderRadius: 28,
        padding: square ? "24px 32px" : "26px 30px",
      }}
    >
      <div style={{ display: "flex", fontSize: 18, letterSpacing: 3, color: MUTED }}>CHAOS SCORE</div>
      <div style={{ display: "flex", fontSize: square ? 92 : 84, fontWeight: 900, color: style.color, lineHeight: 1 }}>
        {score}
      </div>
      <div style={{ display: "flex", fontSize: 24, fontWeight: 800, letterSpacing: 4, color: style.color }}>
        {style.label}
      </div>
    </div>
  );
}

export type MatchCardData = {
  headline: string;
  blurb: string;
  white: string;
  black: string;
  winner: string;
  reason: string;
  rated: boolean;
  timeControl: string;
  platform?: string;
  score: number;
  tier: ChaosTier;
  badges: ChaosBadge[];
  events?: { icon: string; label: string }[];
  plies: number;
  siteUrl: string;
};

function Shell({ children }: { children: any }) {
  return (
    <div
      style={{
        display: "flex",
        width: "100%",
        height: "100%",
        background: BG,
        padding: 34,
        color: CREAM,
        fontFamily: "sans-serif",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          width: "100%",
          height: "100%",
          border: `3px solid ${GOLD}`,
          borderRadius: 34,
          padding: 40,
          background: PANEL,
        }}
      >
        {children}
      </div>
    </div>
  );
}

function Header({ tag, right }: { tag: string; right: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 24, fontWeight: 700 }}>
      <div style={{ display: "flex", color: LIME, letterSpacing: 2 }}>{tag}</div>
      <div style={{ display: "flex", color: MUTED, fontSize: 21 }}>{right}</div>
    </div>
  );
}

function Chips({ badges, max = 3 }: { badges: ChaosBadge[]; max?: number }) {
  const accents = [LIME, "#7dd3fc", "#f0b354", "#f87171"];
  const list = badges.slice(0, max);
  if (!list.length) return null;
  return (
    <div style={{ display: "flex", gap: 14, marginTop: 26, flexWrap: "wrap" }}>
      {list.map((badge, index) => (
        <Chip key={`${badge.icon}-${index}`} icon={badge.icon} name={badge.name} detail={badge.detail} accent={accents[index % accents.length]} />
      ))}
    </div>
  );
}

/** "Big card" shown after a win or a loss — drop it in Discord, X or a group chat. */
export function MatchCard({ data, square }: { data: MatchCardData; square?: boolean }) {
  const resultWord = data.winner === "draw" ? "DRAW" : data.winner === "white" ? `${data.white} WINS` : `${data.black} WINS`;
  return (
    <Shell>
      <Header
        tag="CHAOS CHESS"
        right={`${data.rated ? "RATED" : "FRIENDLY"} · ${data.timeControl}${data.platform ? ` · ${data.platform}` : ""}`}
      />
      {square ? (
        <div style={{ display: "flex", flexDirection: "column", flex: 1, justifyContent: "center", gap: 20 }}>
          <div style={{ display: "flex", fontSize: 30, fontWeight: 800, color: LIME, letterSpacing: 2 }}>{resultWord}</div>
          <div style={{ display: "flex", fontSize: 54, fontWeight: 900, lineHeight: 1.1 }}>{clip(data.headline, 90)}</div>
          <div style={{ display: "flex", fontSize: 26, color: MUTED }}>{clip(data.blurb, 120)}</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 4 }}>
            {(data.events ?? []).slice(0, 3).map((event, index) => (
              <div key={`${event.label}-${index}`} style={{ display: "flex", fontSize: 25, color: CREAM }}>
                {event.icon} <span style={{ display: "flex", marginLeft: 10 }}>{clip(event.label, 46)}</span>
              </div>
            ))}
          </div>
          <ScoreBlock score={data.score} tier={data.tier} square />
          <Chips badges={data.badges} max={3} />
        </div>
      ) : (
        <div style={{ display: "flex", flex: 1, marginTop: 28, gap: 34 }}>
          <div style={{ display: "flex", flexDirection: "column", flex: 1, maxWidth: 760 }}>
            <div style={{ display: "flex", fontSize: 26, fontWeight: 800, color: LIME, letterSpacing: 2 }}>{resultWord}</div>
            <div style={{ display: "flex", fontSize: 52, fontWeight: 900, lineHeight: 1.08, marginTop: 12 }}>
              {clip(data.headline, 92)}
            </div>
            <div style={{ display: "flex", fontSize: 24, color: MUTED, marginTop: 16 }}>{clip(data.blurb, 130)}</div>
            <Chips badges={data.badges} max={2} />
          </div>
          <div style={{ display: "flex", flexDirection: "column", justifyContent: "center" }}>
            <ScoreBlock score={data.score} tier={data.tier} />
          </div>
        </div>
      )}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginTop: "auto",
          paddingTop: 22,
          borderTop: `2px solid ${GOLD}33`,
          fontSize: 22,
          color: MUTED,
        }}
      >
        <div style={{ display: "flex" }}>{clip(`${data.white} vs ${data.black} · ${data.plies} plies`, 64)}</div>
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <div style={{ display: "flex", color: MUTED }}>{data.siteUrl}</div>
          <div style={{ display: "flex", background: LIME, color: BG, padding: "12px 22px", borderRadius: 14, fontWeight: 800 }}>
            Watch the replay →
          </div>
        </div>
      </div>
    </Shell>
  );
}

export type WeekCardData = {
  weekLabel: string;
  gamesScored: number;
  headline: string;
  blurb: string;
  white: string;
  black: string;
  winner: string;
  reason: string;
  score: number;
  tier: ChaosTier;
  badges: ChaosBadge[];
  siteUrl: string;
};

/** Game of the Week card: the single best Chaos game of the last seven days. */
export function WeekCard({ data }: { data: WeekCardData }) {
  const resultWord = data.winner === "draw" ? "DRAW" : data.winner === "white" ? `${data.white} WINS` : `${data.black} WINS`;
  return (
    <Shell>
      <Header tag="CHAOS CHESS · GAME OF THE WEEK" right={`${data.weekLabel} · ${data.gamesScored} games scored`} />
      <div style={{ display: "flex", flex: 1, marginTop: 28, gap: 34 }}>
        <div style={{ display: "flex", flexDirection: "column", flex: 1, maxWidth: 770 }}>
          <div style={{ display: "flex", fontSize: 26, fontWeight: 800, color: LIME, letterSpacing: 2 }}>{resultWord}</div>
          <div style={{ display: "flex", fontSize: 50, fontWeight: 900, lineHeight: 1.08, marginTop: 12 }}>
            {clip(data.headline, 92)}
          </div>
          <div style={{ display: "flex", fontSize: 24, color: MUTED, marginTop: 14 }}>{clip(data.blurb, 130)}</div>
          <Chips badges={data.badges} max={2} />
        </div>
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <ScoreBlock score={data.score} tier={data.tier} />
        </div>
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginTop: "auto",
          paddingTop: 22,
          borderTop: `2px solid ${GOLD}33`,
          fontSize: 22,
          color: MUTED,
        }}
      >
        <div style={{ display: "flex" }}>{clip(`${data.white} vs ${data.black}`, 56)}</div>
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <div style={{ display: "flex" }}>{data.siteUrl}</div>
          <div style={{ display: "flex", background: LIME, color: BG, padding: "12px 22px", borderRadius: 14, fontWeight: 800 }}>
            Watch the replay →
          </div>
        </div>
      </div>
    </Shell>
  );
}
