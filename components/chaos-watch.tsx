"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { Chess } from "chess.js";
import { Chessboard } from "./chessboard-compat";
import { buildChaosCustomPieces } from "./chaos-pieces";
import { describeWatchFrame, expandVisual, type WatchFrame } from "@/lib/chaos-watch";
import { getAnomalyById } from "@/lib/chaos-anomalies";
import type { MatchClock } from "@/lib/chaos-clock";
import { ChaosHubIcon } from "./chaos-hub-icon";
import styles from "./chaos-watch.module.css";
type Entry = {
  id: string;
  white: string;
  black: string;
  date: string;
  base: number;
  increment: number;
  winner?: string;
  reason?: string;
  rated?: boolean;
  moveCount?: number | null;
};
type Detail = {
  id: string;
  white: string;
  black: string;
  status?: string;
  phase?: string;
  pickDeadline?: number;
  serverNow?: number;
  clock?: MatchClock | null;
  gameNumber?: number;
  frame?: WatchFrame;
  frames?: WatchFrame[];
  legacy?: boolean;
  result?: { winner: string; reason: string };
};
const control = (base: number, inc: number) =>
  base > 0 ? `${base / 60}+${inc ?? 0}` : "No rush";
const clockText = (ms: number) => {
  const sec = Math.ceil(Math.max(0, ms) / 1000);
  return `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, "0")}`;
};
export function ChaosWatchButton({
  matchId,
  label = "Watch & replays",
  initialTab = "live",
  card = false,
}: {
  matchId?: string;
  label?: string;
  initialTab?: "live" | "archive";
  card?: boolean;
} = {}) {
  const [open, setOpen] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    if (open) dialog.current?.showModal();
    else dialog.current?.close();
  }, [open]);
  return (
    <>
      <button
        className={card ? "lobby-destination" : "sound-button"}
        data-tone={initialTab === "live" ? "mint" : "violet"}
        onClick={() => setOpen(true)}
      >
        {card ? (
          <>
            <span className="destination-icon">
              <ChaosHubIcon kind={initialTab === "live" ? "live" : "replay"} />
            </span>
            <strong>{label}</strong>
            <small>
              {initialTab === "live" ? "Drop into a match" : "Relive the chaos"}
            </small>
            <span className="destination-arrow" aria-hidden="true">
              ↗
            </span>
          </>
        ) : (
          label
        )}
      </button>
      <dialog
        ref={dialog}
        className={styles.dialog}
        onCancel={() => setOpen(false)}
        aria-label="Watch Chaos Chess"
      >
        {open && (
          <ChaosWatch
            initialTab={initialTab}
            initialMatch={matchId}
            onClose={() => setOpen(false)}
          />
        )}
      </dialog>
    </>
  );
}
export function ChaosWatch({
  onClose,
  initialMatch,
  initialRoom,
  initialTab = "live",
}: {
  onClose?: () => void;
  initialMatch?: string;
  initialRoom?: string;
  initialTab?: "live" | "archive";
}) {
  const [tab, setTab] = useState<"live" | "archive">(
      initialMatch ? "archive" : initialTab,
    ),
    [page, setPage] = useState(0);
  const [selected, setSelected] = useState<{
    id: string;
    live: boolean;
  } | null>(
    initialMatch
      ? { id: initialMatch, live: false }
      : initialRoom
        ? { id: initialRoom, live: true }
        : null,
  );
  const [list, setList] = useState<{ games: Entry[]; hasMore: boolean } | null>(
      null,
    ),
    [detail, setDetail] = useState<Detail | null>(null);
  const [error, setError] = useState(""),
    [index, setIndex] = useState(0),
    [auto, setAuto] = useState(false),
    [flipped, setFlipped] = useState(false),
    [now, setNow] = useState(Date.now()),
    [received, setReceived] = useState(0),
    [copied, setCopied] = useState(false);
  const [width, setWidth] = useState(320);
  const board = useRef<HTMLDivElement>(null);
  useEffect(() => {
    setError("");
    setDetail(null);
    setList(null);
    setIndex(0);
    setAuto(false);
    setCopied(false);
    let active = true;
    let timer: ReturnType<typeof setTimeout>;
    const load = async () => {
      if (!active) return;
      if (document.visibilityState !== "visible") {
        timer = setTimeout(load, 10000);
        return;
      }
      try {
        const query = selected
          ? `${selected.live ? "room" : "match"}=${encodeURIComponent(selected.id)}`
          : `tab=${tab}&page=${page}`;
        const r = await fetch(`/api/chaos/watch?${query}`, {
          cache: "no-store",
        });
        if (!r.ok)
          throw Error("Could not load games. Reopen this view to retry.");
        const d = await r.json();
        if (!active) return;
        if (selected) {
          setDetail(d);
          setReceived(Date.now());
        } else setList(d);
        setError("");
      } catch (e) {
        if (active)
          setError(e instanceof Error ? e.message : "Could not load games.");
      } finally {
        if (active && (!selected || selected.live))
          timer = setTimeout(
            () => {
              if (document.visibilityState === "visible") void load();
              else timer = setTimeout(load, 10000);
            },
            selected?.live ? 3000 : 10000,
          );
      }
    };
    void load();
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [selected, tab, page]);
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(timer);
  }, []);
  useEffect(() => {
    if (!auto || !detail?.frames?.length) return;
    if (index >= detail.frames.length - 1) {
      setAuto(false);
      return;
    }
    const timer = setTimeout(() => setIndex((i) => Math.min(i + 1, detail.frames!.length - 1)), 1000);
    return () => clearTimeout(timer);
  }, [auto, index, detail]);
  const frames = detail?.frames ?? [];
  useEffect(() => {
    if (!board.current) return;
    const observer = new ResizeObserver((entries) =>
      setWidth(Math.min(520, entries[0].contentRect.width)),
    );
    observer.observe(board.current);
    return () => observer.disconnect();
  }, [!!detail]);
  const frame = selected?.live
    ? detail?.frame
    : frames[Math.min(index, frames.length - 1)];
  const rendered = useMemo(() => {
    if (!frame) return null;
    try {
      const game = new Chess(frame.fen),
        s = expandVisual(frame.state);
      return {
        state: s,
        pieces: buildChaosCustomPieces(
          "chaos-toy",
          s.playerModifiers,
          s.aiModifiers,
          "white",
          game,
          s.assignedSquares,
          undefined,
          undefined,
          Math.max(0, s.playerNuclearCooldownUntil - game.moveNumber()),
          Math.max(0, s.aiNuclearCooldownUntil - game.moveNumber()),
          s.playerAnomaly,
          s.aiAnomaly,
          s.playerMoonUnlocked || s.currentPhase >= 2,
          s.aiMoonUnlocked || s.currentPhase >= 2,
        ),
      };
    } catch {
      return null;
    }
  }, [frame]);
  const leave = () => {
    setSelected(null);
    setAuto(false);
  };
  const share = async () => {
    try {
      const url = new URL(selected!.live ? "/watch" : "/share", "https://chaos.firechess.com");
      url.searchParams.set(selected!.live ? "room" : "match", selected!.id);
      await navigator.clipboard.writeText(url.toString());
      setCopied(true);
    } catch {
      setError("Copy is unavailable in this browser.");
    }
  };
  const remaining = (side: "w" | "b") =>
    detail?.clock
      ? detail.clock[side] -
        (detail.clock.active === side ? Math.max(0, now - received) : 0)
      : 0;
  const deadline = detail?.pickDeadline
    ? Math.max(
        0,
        Math.ceil(
          (detail.pickDeadline - (detail.serverNow ?? now) - (now - received)) /
            1000,
        ),
      )
    : null;
  return (
    <section className={styles.shell}>
      <header className={styles.heading}>
        <div>
          <small>THE WATCHTOWER</small>
          <h2>
            {selected
              ? selected.live
                ? "Ringside seats"
                : "Run it back"
              : "Every game has a story."}
          </h2>
        </div>
        {onClose ? (
          <button onClick={onClose} aria-label="Close watchtower">
            ✕
          </button>
        ) : (
          <a href="/">Play Chaos Chess</a>
        )}
      </header>
      {selected ? (
        <button onClick={leave}>← All games</button>
      ) : (
        <>
          <p>
            Watch live matches or replay completed games. Friend matches are
            included.
          </p>
          <nav className={styles.tabs}>
            <button
              aria-pressed={tab === "live"}
              onClick={() => {
                setTab("live");
                setPage(0);
              }}
            >
              Live games
            </button>
            <button
              aria-pressed={tab === "archive"}
              onClick={() => {
                setTab("archive");
                setPage(0);
              }}
            >
              Game archive
            </button>
          </nav>
          {tab === "archive" && (
            <p className={styles.note}>
              Rated games count toward the ladder: both players must sign in through Discord before joining timed matchmaking and each make a move. Guest play, friend rooms and No rush games are casual and do not change ratings.
            </p>
          )}
        </>
      )}
      {error && (
        <p role="alert" className={styles.error}>
          {error}
        </p>
      )}
      {!selected &&
        (!list ? (
          <p role="status">Finding games…</p>
        ) : (
          <>
            <ul className={styles.list}>
              {list.games.map((g) => (
                <li key={g.id}>
                  <button
                    onClick={() =>
                      setSelected({ id: g.id, live: tab === "live" })
                    }
                  >
                    <span className={styles.matchNames}>
                      <strong>{g.white}</strong>
                      <small>vs</small>
                      <strong>{g.black}</strong>
                    </span>
                    <span>
                      <b>{control(g.base, g.increment)}</b>
                      <small>
                        {tab === "live"
                          ? "● LIVE · Watch"
                          : `${g.winner === "draw" ? "Draw" : g.winner + " won"} · ${g.rated ? "Rated" : "Casual"}`}
                      </small>
                      <small>
                        {tab === "archive"
                          ? new Date(g.date).toLocaleString()
                          : "Read-only spectator"}
                      </small>
                      {tab === "archive" && (
                        <small title="Full moves: one White and Black turn, including an unfinished final pair. Power picks are excluded.">
                          {g.moveCount == null ? "Move count unavailable" : `${g.moveCount} ${g.moveCount === 1 ? "move" : "moves"}`}
                        </small>
                      )}
                    </span>
                    <span aria-hidden>↗</span>
                  </button>
                </li>
              ))}
            </ul>
            {!list.games.length && (
              <div className={styles.empty}>
                <h3>
                  {tab === "live"
                    ? "The arena is quiet."
                    : "The story starts here."}
                </h3>
                <p>
                  {tab === "live"
                    ? "Matches will appear here once two players join. This list refreshes automatically."
                    : "Completed multiplayer matches will appear here."}
                </p>
              </div>
            )}
            <nav className={styles.tabs}>
              <button
                disabled={page === 0}
                onClick={() => setPage((p) => p - 1)}
              >
                Previous
              </button>
              <button
                disabled={!list.hasMore}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </button>
            </nav>
          </>
        ))}
      {selected &&
        (!detail ? (
          <p role="status">Loading the board…</p>
        ) : (
          <>
            <div className={styles.status} role="status">
              {selected.live
                ? detail.result
                  ? `${detail.result.winner === "draw" ? "Draw" : detail.result.winner === "aborted" ? "No contest" : detail.result.winner + " wins"} · ${detail.result.reason}`
                  : detail.phase
                : frame && describeWatchFrame(frame)}
              {deadline !== null && !detail.result && ` · ${deadline}s`}
            </div>
            {!selected.live && detail.result && (
              <p>
                {detail.result.winner === "draw"
                  ? "Draw"
                  : detail.result.winner + " wins"}{" "}
                · {detail.result.reason}
              </p>
            )}
            <div className={styles.game}>
              <div>
                <div className={styles.player}>
                  <strong>{flipped ? detail.white : detail.black}</strong>
                  <span>
                    {flipped ? "White" : "Black"}{" "}
                    {selected.live &&
                      detail.clock &&
                      clockText(remaining(flipped ? "w" : "b"))}
                  </span>
                </div>
                <div className={styles.board} ref={board}>
                  {frame && rendered ? (
                    <Chessboard
                      id="spectator-board"
                      animationDuration={0}
                      position={frame.fen}
                      boardWidth={width}
                      boardOrientation={flipped ? "black" : "white"}
                      arePiecesDraggable={false}
                      customPieces={rendered.pieces}
                      customLightSquareStyle={{ background: "#efe4c5" }}
                      customDarkSquareStyle={{ background: "#7e9da5" }}
                      customSquareStyles={Object.fromEntries(
                        [frame.from, frame.to]
                          .filter(Boolean)
                          .map((s) => [s!, { backgroundColor: "#f3ce72" }]),
                      )}
                    />
                  ) : (
                    <p>This position is unavailable.</p>
                  )}
                </div>
                <div className={styles.player}>
                  <strong>{flipped ? detail.black : detail.white}</strong>
                  <span>
                    {flipped ? "Black" : "White"}{" "}
                    {selected.live &&
                      detail.clock &&
                      clockText(remaining(flipped ? "b" : "w"))}
                  </span>
                </div>
                {!selected.live && frames.length > 0 && (
                  <div className={styles.controls}>
                    <div>
                      <button
                        disabled={index === 0}
                        onClick={() => {
                          setAuto(false);
                          setIndex(0);
                        }}
                        aria-label="First position"
                      >
                        ⏮
                      </button>
                      <button
                        disabled={index === 0}
                        onClick={() => {
                          setAuto(false);
                          setIndex((i) => i - 1);
                        }}
                        aria-label="Previous position"
                      >
                        ◀
                      </button>
                      <button
                        disabled={frames.length < 2}
                        onClick={() => {
                          if (!auto && index >= frames.length - 1) setIndex(0);
                          setAuto((a) => !a);
                        }}
                      >
                        {auto ? "Pause" : index >= frames.length - 1 ? "Play again" : "Play"}
                      </button>
                      <button
                        disabled={index >= frames.length - 1}
                        onClick={() => {
                          setAuto(false);
                          setIndex((i) => i + 1);
                        }}
                        aria-label="Next position"
                      >
                        ▶
                      </button>
                      <button
                        disabled={index >= frames.length - 1}
                        onClick={() => {
                          setAuto(false);
                          setIndex(frames.length - 1);
                        }}
                        aria-label="Final position"
                      >
                        ⏭
                      </button>
                    </div>
                    <input
                      aria-label="Replay position"
                      type="range"
                      min={0}
                      max={frames.length - 1}
                      value={Math.min(index, frames.length - 1)}
                      onChange={(e) => {
                        setAuto(false);
                        setIndex(Number(e.target.value));
                      }}
                    />
                    <small>
                      Position {Math.min(index + 1, frames.length)} /{" "}
                      {frames.length}
                    </small>
                  </div>
                )}
                <div className={styles.tabs}>
                  <button onClick={() => setFlipped((f) => !f)}>
                    Flip board
                  </button>
                  <button onClick={share}>
                    {copied ? "Link copied" : "Share game"}
                  </button>
                </div>
                <p className={styles.note}>
                  {selected.live
                    ? "Read-only · refreshes every 3 seconds. Player chat stays private."
                    : detail.legacy
                      ? "Older recording: some opening positions and historical piece transformations were not saved."
                      : "Recorded board positions, power picks and abilities."}
                </p>
              </div>
              <aside className={styles.powers}>
                {!selected.live && frames.some(f => / (picked|chose) /.test(f.label)) && (
                  <section>
                    <h3>Pick history</h3>
                    <ol>
                      {frames.map((f, i) => / (picked|chose) /.test(f.label) && (
                        <li key={i}>
                          <button aria-current={index === i ? "step" : undefined} onClick={() => { setAuto(false); setIndex(i); }}>
                            {describeWatchFrame(f).replace(/^(white|black)/, color => `${color === "white" ? detail.white : detail.black} (${color})`)}
                          </button>
                        </li>
                      ))}
                    </ol>
                  </section>
                )}
                {rendered &&
                  (["white", "black"] as const).map((color) => {
                    const mods =
                      color === "white"
                        ? rendered.state.playerModifiers
                        : rendered.state.aiModifiers;
                    const anomaly = getAnomalyById(
                      (color === "white"
                        ? rendered.state.playerAnomaly
                        : rendered.state.aiAnomaly) as any,
                    );
                    return (
                      <section key={color}>
                        <h3>{color === "white" ? detail.white : detail.black} · {color === "white" ? "White" : "Black"}</h3>
                        <small>Powers at this position</small>
                        {anomaly && (
                          <div>
                            <p><b>{anomaly.icon} {anomaly.name}</b> · Opening anomaly</p>
                            <p>{anomaly.description}</p>
                            {anomaly.trigger === "once-per-game" && <p>{(color === "white" ? rendered.state.playerAnomalyUsed : rendered.state.aiAnomalyUsed) === undefined ? "Ability usage was not recorded." : (color === "white" ? rendered.state.playerAnomalyUsed : rendered.state.aiAnomalyUsed) ? "Ability used" : "Ability available"}</p>}
                          </div>
                        )}
                        {!anomaly && <p>{detail.legacy ? "Opening anomaly was not recorded for this position." : "No opening anomaly at this position."}</p>}
                        {!mods.length && <p>No powers at this position.</p>}
                        {mods.map((m) => (
                          <details key={m.id} open>
                            <summary>
                              {m.name} <small>{m.tier}</small>
                            </summary>
                            <p>{m.description}</p>
                          </details>
                        ))}
                      </section>
                    );
                  })}
              </aside>
            </div>
          </>
        ))}
    </section>
  );
}
