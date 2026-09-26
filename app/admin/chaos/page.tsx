"use client";

/**
 * /admin/chaos — Chaos Chess health: growth, where players drop off, retention, streaks, economy and
 * power balance. Admin only. Data: /api/admin/chaos (lib/chaos-admin-stats.ts); the same numbers
 * print in a terminal with `node scripts/chaos-report.mjs [days]`.
 */

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useSession } from "@/components/session-provider";
import type { ChaosAdminStats } from "@/lib/chaos-admin-stats";

const RANGES = [7, 14, 30, 90];
/** Minimum games before a power's score is worth reading. */
const MIN_SAMPLE = 20;
const JOURNEY: [string, string][] = [
  ["lobby_view", "Saw the lobby"], ["tutorial_start", "Started the tutorial"], ["tutorial_done", "Finished the tutorial"], ["practice_start", "Started a practice game"], ["queue_start", "Joined the queue"],
  ["wait_ai", "Played AI while waiting"], ["invite", "Invited a friend"], ["queue_cancel", "Cancelled the queue"],
  ["match_found", "Found a match"], ["shop_offer_seen", "Saw a gold offer"], ["shop_offer_bought", "Bought from an offer"],
];

const pct = (a: number, b: number) => (b ? `${Math.round((100 * a) / b)}%` : "—");
const fmt = (n: number) => n.toLocaleString("en-US");

export default function AdminChaosPage() {
  const { loading, isAdmin } = useSession();
  const router = useRouter();
  const [days, setDays] = useState(30);
  const [stats, setStats] = useState<ChaosAdminStats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (!loading && !isAdmin) router.replace("/");
  }, [loading, isAdmin, router]);

  useEffect(() => {
    if (loading || !isAdmin) return;
    const controller = new AbortController();
    setFetching(true);
    setError(null);
    fetch(`/api/admin/chaos?days=${days}`, { signal: controller.signal, cache: "no-store" })
      .then(async (r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        setStats(await r.json());
      })
      .catch((e) => {
        if (!controller.signal.aborted) setError(String(e.message ?? e));
      })
      .finally(() => {
        if (!controller.signal.aborted) setFetching(false);
      });
    return () => controller.abort();
  }, [loading, isAdmin, days]);

  if (loading || !isAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-400">
        Loading...
      </div>
    );
  }

  const s = stats;
  const last7 = s?.daily.slice(-7) ?? [];
  const perDay7 = last7.length ? last7.reduce((a, d) => a + d.games, 0) / last7.length : 0;
  const cohortPlayers = s?.retention.cohorts.reduce((a, c) => a + c.players, 0) ?? 0;
  const cohortReturned = s?.retention.cohorts.reduce((a, c) => a + c.returned, 0) ?? 0;

  return (
    <div className="mx-auto min-h-screen site-width bg-slate-950 px-4 py-12 text-slate-300">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white">Chaos Chess health</h1>
          <p className="mt-1 text-xs text-slate-500">
            Sydney calendar days · {s ? `updated ${new Date(s.generatedAt).toLocaleTimeString()}` : "loading"} · terminal:{" "}
            <code className="text-slate-400">node scripts/chaos-report.mjs {days}</code>
          </p>
        </div>
        <div className="flex items-center gap-1" role="group" aria-label="Time range">
          {RANGES.map((r) => (
            <button
              key={r}
              onClick={() => setDays(r)}
              aria-pressed={days === r}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition ${
                days === r ? "bg-emerald-500/20 text-emerald-300" : "bg-white/5 text-slate-400 hover:bg-white/10"
              }`}
            >
              {r}d
            </button>
          ))}
          <Link href="/admin/users" className="ml-3 text-xs text-emerald-400 hover:underline">
            Users →
          </Link>
        </div>
      </div>

      {error && (
        <p role="alert" className="mb-6 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          Couldn&apos;t load metrics ({error}).
        </p>
      )}
      {fetching && !s && <p className="text-xs text-slate-500">Loading metrics…</p>}

      {s && (
        <div className={`space-y-8 ${fetching ? "opacity-60" : ""}`}>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            <Tile label="Finished games" value={fmt(s.summary.games)} sub={`${perDay7.toFixed(1)}/day last 7d`} />
            <Tile label="Players" value={fmt(s.summary.players)} sub={`${fmt(s.summary.signedInPlayers)} signed in`} />
            <Tile label="New players" value={fmt(s.summary.newPlayers)} sub={`first game in ${s.days}d`} />
            <Tile label="Came back another day" value={pct(cohortReturned, cohortPlayers)} sub={`${cohortReturned} of ${cohortPlayers} new players`} />
            <Tile label="Rematches" value={pct(s.summary.rematches, s.summary.games)} sub={`${fmt(s.summary.rematches)} games`} />
            <Tile label="Lost on time" value={pct(s.summary.timeouts, s.summary.games)} sub={`${fmt(s.summary.timeouts)} games`} />
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Tile label="New players brought in by players" value={fmt(s.viral.brought)} sub={`${pct(s.viral.brought, s.viral.newPlayers)} of ${fmt(s.viral.newPlayers)} new players`} />
            <Tile label="Brought in per active player" value={s.viral.perActive.toFixed(2)} sub="Above 1.00 means it spreads on its own" />
            <Tile label="Arrived on their own" value={fmt(Math.max(0, s.viral.newPlayers - s.viral.brought))} sub="Discovery, search, direct" />
          </div>

          <DailyChart daily={s.daily} />

          <div className="grid gap-6 lg:grid-cols-2">
            <Card title="Where players drop off" note="Rooms created in the range. A room with no opponent is a player who waited and left.">
              <Funnel
                steps={[
                  { label: "Rooms created", value: s.funnel.created },
                  { label: "Opponent joined", value: s.funnel.joined },
                  { label: "First move played", value: s.funnel.moved },
                  { label: "Game decided", value: s.funnel.decided },
                ]}
              />
              <dl className="mt-4 grid grid-cols-2 gap-3 text-xs">
                <Stat label="Room creators who never played" value={`${fmt(s.funnel.hostsNeverPlayed)} of ${fmt(s.funnel.hosts)} (${pct(s.funnel.hostsNeverPlayed, s.funnel.hosts)})`} />
                <Stat label="Aborted before a result" value={fmt(s.funnel.aborted)} />
                <Stat label="Discord launches → played" value={`${fmt(s.launches.launchersWhoPlayed)} of ${fmt(s.launches.players)} (${pct(s.launches.launchersWhoPlayed, s.launches.players)})`} />
                <Stat label="Launches · servers" value={`${fmt(s.launches.launches)} · ${fmt(s.launches.guilds)}`} />
              </dl>
              <p className="mt-3 text-[11px] text-slate-500">Launch tracking began 20 Sep 2026.</p>
            </Card>

            <Card title="Player journey" note="Distinct players reaching each step after opening Chaos. Practice includes AI games started while waiting in the queue.">
              <Table
                head={["Step", "Activity", "Website", "Events"]}
                rows={JOURNEY.map(([event, label]) => {
                  const r = s.journey.steps.find((x) => x.event === event);
                  return [label, fmt(r?.activity ?? 0), fmt(r?.website ?? 0), fmt(r?.events ?? 0)];
                })}
              />
              <dl className="mt-4 grid grid-cols-2 gap-3 text-xs">
                <Stat label="Saw the lobby, did nothing" value={`${fmt(s.journey.lobbyOnly)} of ${fmt(s.journey.players)} (${pct(s.journey.lobbyOnly, s.journey.players)})`} />
                <Stat label="Practised, never queued" value={`${fmt(s.journey.practiceOnly)} (${pct(s.journey.practiceOnly, s.journey.players)})`} />
                <Stat label="Queued, never matched" value={`${fmt(s.journey.queuedUnmatched)} (${pct(s.journey.queuedUnmatched, s.journey.players)})`} />
                <Stat label="Median wait before cancelling" value={`${Math.round(s.journey.medianCancelWait)}s`} />
              </dl>
              <p className="mt-3 text-[11px] text-slate-500">{s.journey.trackingSince ? `Tracking since ${s.journey.trackingSince}.` : "No events yet: tracking starts with this deploy."}</p>
            </Card>

            <Card title="Retention" note="Weekly cohorts by first game. Recent cohorts have had less time to return.">
              <Table
                head={["First week", "Players", "Came back", "Within 7 days"]}
                rows={s.retention.cohorts.map((c) => [
                  c.cohort,
                  fmt(c.players),
                  `${c.returned} (${pct(c.returned, c.players)})`,
                  `${c.returned7d} (${pct(c.returned7d, c.players)})`,
                ])}
              />
              <p className="mb-2 mt-5 text-[10px] font-semibold uppercase tracking-wider text-slate-500">Games per player</p>
              <Table
                head={["Games", "Players", "Share of players", "Share of games"]}
                rows={s.retention.buckets.map((b) => [
                  b.bucket,
                  fmt(b.players),
                  pct(b.players, s.summary.players),
                  pct(b.games, s.retention.buckets.reduce((a, x) => a + x.games, 0)),
                ])}
              />
            </Card>

            <Card title="Where players come from" note="Discord launches: 'joined a friend' means someone else started that game instance first. Invite links and website first-touch fill in once migrations/chaos-attribution.sql has run.">
              <Table
                head={["Discord launch", "Launches", "Players", "Played a game"]}
                rows={s.sources.launches.map((r) => [r.source, fmt(r.launches), fmt(r.players), `${fmt(r.played)} (${pct(r.played, r.players)})`])}
              />
              <p className="mb-2 mt-5 text-[10px] font-semibold uppercase tracking-wider text-slate-500">Top inviters (Discord share links)</p>
              <Table
                head={["Inviter", "Brought in", "Played", "From lobby invite"]}
                rows={s.sources.inviters.map((r) => [r.name, fmt(r.invited), fmt(r.played), fmt(r.lobbyInvites)])}
              />
              <p className="mb-2 mt-5 text-[10px] font-semibold uppercase tracking-wider text-slate-500">First touch (website and Activity)</p>
              <Table
                head={["Source", "Surface", "Players", "Played"]}
                rows={s.sources.firstTouch.map((r) => [r.source, r.surface, fmt(r.players), `${fmt(r.played)} (${pct(r.played, r.players)})`])}
              />
            </Card>

            <Card title="Streaks" note="Consecutive Sydney days with a gold-paying game. Live = played today or yesterday.">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                <Tile label="Live streaks" value={fmt(s.streaks.live)} />
                <Tile label="2+ days" value={fmt(s.streaks.live2)} />
                <Tile label="3+ days" value={fmt(s.streaks.live3)} />
                <Tile label="7+ days" value={fmt(s.streaks.live7)} />
                <Tile label="Best ever" value={`${s.streaks.bestEver}d`} />
                <Tile label="Streak gold paid" value={fmt(s.streaks.streakGold)} sub={`in ${s.days}d`} />
              </div>
            </Card>

            <Card title="How games end" note={`Average ${s.summary.avgMoves} moves. ${pct(s.summary.discordGames, s.summary.games)} Discord vs Discord, ${pct(s.summary.rated, s.summary.games)} rated.`}>
              <Table
                head={["Reason", "Games", "Share"]}
                rows={s.endings.map((e) => [e.reason, fmt(e.games), pct(e.games, s.summary.games)])}
              />
            </Card>

            <Card title="Gold economy" note="Ledger movements in the range. Negative = spent.">
              <Table
                head={["Reason", "Entries", "Gold"]}
                rows={s.economy.ledger.map((l) => [l.reason, fmt(l.entries), fmt(l.gold)])}
              />
              {s.economy.purchases.length > 0 && (
                <>
                  <p className="mb-2 mt-5 text-[10px] font-semibold uppercase tracking-wider text-slate-500">Shop purchases</p>
                  <Table head={["Item", "Bought", "Gold"]} rows={s.economy.purchases.map((p) => [p.item, fmt(p.bought), fmt(p.gold)])} />
                </>
              )}
            </Card>

            <Card title="Anomalies" note={`Score = (wins + draws/2) ÷ games for the side that picked it. Under ${MIN_SAMPLE} games is noise.`}>
              <BalanceTable rows={s.balance.anomalies.map((a) => ({ ...a, name: a.id }))} />
            </Card>
          </div>

          <Card title="Power balance" note={`Score = (wins + draws/2) ÷ games for the side holding the power; 0.50 is even. ⚑ marks scores outside 0.40–0.60 with at least ${MIN_SAMPLE} games.`}>
            <BalanceTable rows={s.balance.powers} />
          </Card>
        </div>
      )}
    </div>
  );
}

function Tile({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.03] px-4 py-3">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-bold text-white">{value}</p>
      {sub && <p className="mt-0.5 text-[11px] text-slate-500">{sub}</p>}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-slate-500">{label}</dt>
      <dd className="mt-0.5 font-semibold text-white">{value}</dd>
    </div>
  );
}

function Card({ title, note, children }: { title: string; note?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
      <h2 className="text-sm font-bold text-white">{title}</h2>
      {note && <p className="mb-4 mt-1 text-[11px] text-slate-500">{note}</p>}
      {children}
    </section>
  );
}

function Table({ head, rows }: { head: string[]; rows: (string | number)[][] }) {
  if (!rows.length) return <p className="text-xs text-slate-500">No data in this range.</p>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-xs">
        <thead>
          <tr>
            {head.map((h, i) => (
              <th key={h} className={`pb-2 font-semibold text-slate-500 ${i ? "text-right" : ""}`}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-t border-white/[0.06]">
              {r.map((c, j) => (
                <td key={j} className={`py-1.5 ${j ? "text-right tabular-nums text-slate-300" : "text-white"}`}>{c}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Funnel({ steps }: { steps: { label: string; value: number }[] }) {
  const top = steps[0]?.value || 1;
  return (
    <ol className="space-y-2">
      {steps.map((step, i) => (
        <li key={step.label} className="text-xs">
          <div className="mb-1 flex justify-between gap-2">
            <span className="text-slate-300">{step.label}</span>
            <span className="tabular-nums text-white">
              {fmt(step.value)} <span className="text-slate-500">({pct(step.value, top)}{i > 0 ? `, ${pct(step.value, steps[i - 1].value)} of previous` : ""})</span>
            </span>
          </div>
          <div className="h-2 rounded-full bg-white/[0.06]">
            <div className="h-2 rounded-full bg-[#3987e5]" style={{ width: `${(100 * step.value) / top}%` }} />
          </div>
        </li>
      ))}
    </ol>
  );
}

type BalanceRow = { id: string; name: string; games: number; wins: number; draws: number; score: number };

function BalanceTable({ rows }: { rows: BalanceRow[] }) {
  if (!rows.length) return <p className="text-xs text-slate-500">No data in this range.</p>;
  return (
    <div className="max-h-[32rem] overflow-auto">
      <table className="w-full text-left text-xs">
        <thead className="sticky top-0 bg-slate-950">
          <tr>
            {["Name", "Games", "Wins", "Draws", "Score"].map((h, i) => (
              <th key={h} className={`pb-2 font-semibold text-slate-500 ${i ? "text-right" : ""}`}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            const enough = r.games >= MIN_SAMPLE;
            const flagged = enough && (r.score < 0.4 || r.score > 0.6);
            return (
              <tr key={r.id} className={`border-t border-white/[0.06] ${enough ? "" : "text-slate-500"}`}>
                <td className={`py-1.5 ${enough ? "text-white" : ""}`}>{r.name}</td>
                <td className="py-1.5 text-right tabular-nums">{r.games}</td>
                <td className="py-1.5 text-right tabular-nums">{r.wins}</td>
                <td className="py-1.5 text-right tabular-nums">{r.draws}</td>
                <td className="py-1.5 text-right tabular-nums">
                  {flagged && <span className="mr-1 text-amber-300" aria-label={r.score > 0.6 ? "Check: strong" : "Check: weak"}>⚑ {r.score > 0.6 ? "strong" : "weak"}</span>}
                  {r.score.toFixed(2)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

type Day = ChaosAdminStats["daily"][number];

/** Games per Sydney day: single series, so the title names it and there is no legend. */
function DailyChart({ daily }: { daily: Day[] }) {
  const [active, setActive] = useState<number | null>(null);
  const [showTable, setShowTable] = useState(false);
  const max = Math.max(1, ...daily.map((d) => d.games));
  const hovered = active !== null ? daily[active] : daily[daily.length - 1];
  const label = (d: string) => new Date(`${d}T00:00:00Z`).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });

  return (
    <Card title="Finished games per day" note="Hover or focus a day for players, new players and Discord launches.">
      {daily.length === 0 ? (
        <p className="text-xs text-slate-500">No games in this range.</p>
      ) : (
        <>
          <p className="mb-3 min-h-[1rem] text-xs text-slate-400" aria-live="polite">
            {hovered && (
              <>
                <span className="font-semibold text-white">{label(hovered.day)}</span> · {hovered.games} games · {hovered.active} players ·{" "}
                {hovered.newPlayers} new · {hovered.launches} launches
              </>
            )}
          </p>
          <div className="relative flex h-40 items-end gap-[2px] border-b border-white/15" onMouseLeave={() => setActive(null)}>
            <span className="pointer-events-none absolute left-0 top-0 w-full border-t border-dashed border-white/10 text-[10px] text-slate-500">
              <span className="relative -top-2 bg-slate-950 pr-1">{max}</span>
            </span>
            {daily.map((d, i) => (
              <button
                key={d.day}
                type="button"
                aria-label={`${label(d.day)}: ${d.games} games, ${d.active} players, ${d.newPlayers} new`}
                onMouseEnter={() => setActive(i)}
                onFocus={() => setActive(i)}
                onBlur={() => setActive(null)}
                className="group flex h-full min-w-0 flex-1 items-end justify-center focus:outline-none"
              >
                <span
                  className={`block w-full max-w-[24px] rounded-t-[4px] transition-opacity ${
                    active === null || active === i ? "opacity-100" : "opacity-50"
                  } bg-[#3987e5] group-focus-visible:outline group-focus-visible:outline-2 group-focus-visible:outline-offset-2 group-focus-visible:outline-emerald-400`}
                  style={{ height: `${(100 * d.games) / max}%`, minHeight: d.games ? 2 : 0 }}
                />
              </button>
            ))}
          </div>
          <div className="mt-1 flex justify-between text-[10px] text-slate-500">
            <span>{label(daily[0].day)}</span>
            {daily.length > 2 && <span>{label(daily[Math.floor(daily.length / 2)].day)}</span>}
            <span>{label(daily[daily.length - 1].day)}</span>
          </div>
          <button onClick={() => setShowTable((v) => !v)} aria-expanded={showTable} className="mt-3 text-[11px] text-emerald-400 hover:underline">
            {showTable ? "Hide table" : "Show as table"}
          </button>
          {showTable && (
            <div className="mt-3">
              <Table
                head={["Day", "Games", "Players", "New", "Launches"]}
                rows={daily.map((d) => [d.day, d.games, d.active, d.newPlayers, d.launches])}
              />
            </div>
          )}
        </>
      )}
    </Card>
  );
}
