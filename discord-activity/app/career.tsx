"use client";
import { useActivityDialog } from "./use-activity-dialog";
import { useEffect, useState } from "react";
import { ChaosWatchButton } from "@/components/chaos-watch";
import { ChaosHubIcon } from "@/components/chaos-hub-icon";
import { chaosIdentityHeaders } from "@/lib/chaos-client-identity";
import { getGuestId } from "@/lib/guest-id";
type Game = {
  id: string;
  color: string;
  winner: string;
  opponent: string;
  reason: string;
  rated: boolean;
  delta: number | null;
  ended_at: string;
};
type Standing = {
  name: string;
  rating?: number;
  games: number;
  wins: number;
  losses: number;
  draws: number;
};
type Career = { profile: Standing | null; games: Game[]; hasMore: boolean };
/** A row of the gold board: lifetime gold earned vs the balance still in hand. */
type GoldRow = {
  name: string;
  gold: number;
  games: number;
  earned: number;
  spent: number;
};
type Standings = {
  ranked: Standing[];
  community: Standing[];
  gold: GoldRow[];
  goldTotals: { players: number; earned: number };
};
export function ActivityCareer({ card = false }: { card?: boolean }) {
  const [open, setOpen] = useState(false),
    [tab, setTab] = useState<"community" | "ranked" | "gold" | "history">(
      "community",
    ),
    [page, setPage] = useState(0),
    [retry, setRetry] = useState(0);
  const [standings, setStandings] = useState<Standings | null>(null),
    [career, setCareer] = useState<Career | null>(null);
  const [publicError, setPublicError] = useState(""),
    [personalError, setPersonalError] = useState(""),
    [personalLoading, setPersonalLoading] = useState(false);
  const { ref: dialog, onBackdropClick } = useActivityDialog(open, () => setOpen(false));
  useEffect(() => {
    if (!open) return;
    let active = true;
    setPublicError("");
    setStandings(null);
    fetch("/api/chaos/standings")
      .then(async (r) => {
        if (!r.ok) throw Error();
        return r.json();
      })
      .then((d) => {
        if (active) setStandings(d);
      })
      .catch(() => {
        if (active) setPublicError("Could not load standings. Try again.");
      });
    return () => {
      active = false;
    };
  }, [open, retry]);
  const history = tab === "history";
  useEffect(() => {
    if (!open || !history) return;
    let active = true;
    setPersonalLoading(true);
    setPersonalError("");
    fetch(`/api/chaos/career?page=${page}`, {
      headers: { "X-Guest-Id": getGuestId(), ...chaosIdentityHeaders() },
      cache: "no-store",
    })
      .then(async (r) => {
        if (!r.ok) throw Error();
        return r.json();
      })
      .then((d) => {
        if (active) setCareer(d);
      })
      .catch(() => {
        if (active)
          setPersonalError(
            "Your game history is unavailable. Try again, or reopen the Activity to refresh your sign-in.",
          );
      })
      .finally(() => {
        if (active) setPersonalLoading(false);
      });
    return () => {
      active = false;
    };
  }, [open, history, page, retry]);
  const rows = tab === "ranked" ? standings?.ranked : standings?.community;
  const error = history ? personalError : publicError;
  return (
    <>
      <button
        className={card ? "lobby-destination" : "sound-button"}
        data-tone="gold"
        onClick={() => setOpen(true)}
      >
        {card ? (
          <>
            <span className="destination-icon">
              <ChaosHubIcon kind="leaderboard" />
            </span>
            <strong>Leaderboard</strong>
            <small>See who’s on top</small>
          </>
        ) : (
          "Leaderboard"
        )}
      </button>
      <dialog
        className="career-dialog"
        ref={dialog}
        onClick={onBackdropClick}
        onCancel={() => setOpen(false)}
        aria-labelledby={card ? "lobby-career-title" : "nav-career-title"}
      >
        <header className="career-heading">
          <div>
            <span className="eyebrow">THE ROYAL RECORD</span>
            <h2 id={card ? "lobby-career-title" : "nav-career-title"}>
              The leaderboard
            </h2>
          </div>
          <button
            className="sound-button"
            onClick={() => setOpen(false)}
            aria-label="Close leaderboard"
          >
            ✕
          </button>
        </header>
        <div className="career-tabs" aria-label="Leaderboard views">
          <button
            aria-pressed={tab === "community"}
            onClick={() => setTab("community")}
          >
            Community
          </button>
          <button
            aria-pressed={tab === "ranked"}
            onClick={() => setTab("ranked")}
          >
            Rated ladder
          </button>
          <button aria-pressed={tab === "gold"} onClick={() => setTab("gold")}>
            Gold
          </button>
          <button aria-pressed={history} onClick={() => setTab("history")}>
            My games
          </button>
        </div>
        <p className="career-note">
          {history
            ? career?.profile
              ? `${career.profile.name} · ${career.profile.rating} rating · ${career.profile.games} rated games`
              : "Your completed multiplayer matches, with replays."
            : tab === "ranked"
              ? "Competitive ratings from timed matchmaking. New players start at 1200."
              : tab === "gold"
                ? standings && standings.goldTotals.earned > 0
                  ? `Lifetime gold earned in Chaos Chess — ${standings.goldTotals.earned.toLocaleString()} by ${standings.goldTotals.players.toLocaleString()} players. Finishing a game pays 10, a win +15, a timed clock +5, the first win of the day +25. Buying powers spends gold but never removes you from this board.`
                  : "Finish a Chaos game to earn gold — 10 a game, +15 for a win, +5 on a clock and +25 for your first win of the day. Buying powers spends gold but never removes you from this board."
                : "All-time wins from casual and rated games. Both players must have moved. Sorted by wins, then draws."}
        </p>
        {error ? (
          <div className="career-empty" role="alert">
            <p>{error}</p>
            <button
              className="primary-action"
              onClick={() => setRetry((r) => r + 1)}
            >
              Try again <span aria-hidden="true">↻</span>
            </button>
          </div>
        ) : history ? (
          personalLoading ? (
            <p role="status">Loading your games…</p>
          ) : (
            <>
              <ul className="career-list">
                {career?.games.map((g) => (
                  <li key={g.id}>
                    <span
                      className="career-result"
                      data-result={
                        g.winner === "draw"
                          ? "draw"
                          : g.winner === g.color
                            ? "win"
                            : "loss"
                      }
                    >
                      {g.winner === "draw"
                        ? "½"
                        : g.winner === g.color
                          ? "W"
                          : "L"}
                    </span>
                    <span>
                      <strong>vs {g.opponent}</strong>
                      <small>
                        {g.reason} · {new Date(g.ended_at).toLocaleDateString()}
                      </small>
                    </span>
                    <b>
                      {g.rated
                        ? `${(g.delta ?? 0) >= 0 ? "+" : ""}${g.delta}`
                        : "Casual"}
                    </b>
                    <ChaosWatchButton matchId={g.id} label="Replay" />
                  </li>
                ))}
              </ul>
              {career && !career.games.length && (
                <div className="career-empty">
                  <h3>Your first story awaits.</h3>
                  <p>
                    Completed matches appear here. Sign in with FireChess or Discord to
                    keep your record across devices.
                  </p>
                </div>
              )}
              <div className="career-pagination">
                <button
                  className="sound-button"
                  disabled={page === 0}
                  onClick={() => setPage((p) => p - 1)}
                >
                  Newer
                </button>
                <button
                  className="sound-button"
                  disabled={!career?.hasMore}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Older
                </button>
              </div>
            </>
          )
        ) : tab === "gold" ? (
          !standings ? (
            <p role="status">Loading standings…</p>
          ) : standings.gold.length ? (
            <>
              <div className="career-columns">
                <span>PLAYER</span>
                <span>GOLD EARNED</span>
              </div>
              <ol className="career-list">
                {standings.gold.map((g, i) => (
                  <li key={`${g.name}-${i}`} data-podium={i < 3 ? i + 1 : undefined}>
                    <span className="career-rank">{i + 1}</span>
                    <span>
                      <strong>{g.name}</strong>
                      <small>
                        {g.gold.toLocaleString()} in hand · {g.games}{" "}
                        {g.games === 1 ? "game" : "games"}
                      </small>
                    </span>
                    <b>{g.earned.toLocaleString()}</b>
                  </li>
                ))}
              </ol>
            </>
          ) : (
            <div className="career-empty">
              <span className="career-empty-icon">
                <ChaosHubIcon kind="leaderboard" />
              </span>
              <h3>No gold earned yet.</h3>
              <p>
                Finish a Chaos game to earn gold — 10 a game, +15 for a win,
                +5 on a clock and +25 for your first win of the day. Buying
                powers spends gold but never leaves this board.
              </p>
            </div>
          )
        ) : !standings ? (
          <p role="status">Loading standings…</p>
        ) : rows?.length ? (
          <>
            <div className="career-columns">
              <span>PLAYER</span>
              <span>{tab === "ranked" ? "RATING" : "WINS"}</span>
            </div>
            <ol className="career-list">
              {rows.map((p, i) => (
                <li
                  key={`${p.name}-${i}`}
                  data-podium={i < 3 ? i + 1 : undefined}
                >
                  <span className="career-rank">{i + 1}</span>
                  <span>
                    <strong>{p.name}</strong>
                    <small>
                      {p.games} games · {p.wins}W / {p.draws}D / {p.losses}L
                    </small>
                  </span>
                  <b>{tab === "ranked" ? p.rating : p.wins}</b>
                </li>
              ))}
            </ol>
          </>
        ) : (
          <div className="career-empty">
            <span className="career-empty-icon">
              <ChaosHubIcon kind="leaderboard" />
            </span>
            <h3>
              {tab === "ranked"
                ? "The rated ladder is waiting."
                : "Be the first on the board."}
            </h3>
            <p>
              {tab === "ranked"
                ? "No eligible rated matches have finished yet. Play a timed match with both players signed in with FireChess or Discord, and both make a move. No rush games count in Community instead."
                : "Finish a multiplayer match while signed in with FireChess or Discord. Friend matches count here too."}
            </p>
            {tab === "ranked" && (
              <button
                className="primary-action"
                onClick={() => setTab("community")}
              >
                See community standings <span aria-hidden="true">↗</span>
              </button>
            )}
          </div>
        )}
      </dialog>
    </>
  );
}
