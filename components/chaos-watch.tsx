"use client";
import { ChaosNavLink } from "./chaos-nav-link";
import { useEffect, useMemo, useRef, useState } from "react";
import { Chess } from "chess.js";
import { Chessboard } from "./chessboard-compat";
import { buildChaosCustomPieces } from "./chaos-pieces";
import { describeWatchFrame, describeWatchAnomaly, expandVisual, type WatchFrame } from "@/lib/chaos-watch";
import { getChaosMoves } from "@/lib/chaos-moves";
import { chaosMoveDecal } from "@/lib/chaos-move-decals";
import { getAnomalyById } from "@/lib/chaos-anomalies";
import type { MatchClock } from "@/lib/chaos-clock";
import { ChaosHubIcon } from "./chaos-hub-icon";
import { getSoundVolume, playSound, setSoundVolume } from "@/lib/sounds";
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
  platform?: string;
  clock?: MatchClock | null;
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
  moveCount?: number | null;
  platform?: string;
  base?: number;
  increment?: number;
  result?: { winner: string; reason: string };
};
const control = (base: number, inc: number) =>
  base > 0 ? `${base / 60}+${inc ?? 0}` : "No rush";
const clockText = (ms: number) => {
  const sec = Math.ceil(Math.max(0, ms) / 1000);
  return `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, "0")}`;
};
/** Clocks are game state, not decoration: the side on the move is highlighted
 * and a side inside its last 30 seconds is visibly at risk before it flags. */
const clockState = (ms: number, active: boolean) =>
  [
    styles.clock,
    active ? styles.clockActive : "",
    ms <= 0 ? styles.clockOut : ms <= 30000 ? styles.clockLow : "",
  ]
    .filter(Boolean)
    .join(" ");
/** Button and page share one target: the Watchtower is a page, never a modal. */
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
  const href = matchId
    ? `/watch?match=${encodeURIComponent(matchId)}`
    : initialTab === "archive"
      ? "/watch?tab=archive"
      : "/watch";
  return (
    <ChaosNavLink
      className={card ? "lobby-destination" : "sound-button"}
      data-tone={initialTab === "live" ? "mint" : "violet"}
      href={href}
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
    </ChaosNavLink>
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
  /** Square the pointer is over: hovering a piece shows where it can go. */
  const [hover, setHover] = useState<string | null>(null);
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
        } else {
          setList(d);
          setReceived(Date.now());
        }
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
  /** Picks revealed so far: the rail fills in one by one as the replay advances. */
  const pickFrames = useMemo(
    () =>
      frames
        .map((f, i) => ({ frame: f, at: i }))
        .filter(({ frame, at }) => at <= index && / (picked|chose) /.test(frame.label)),
    [frames, index],
  );
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
  /**
   * Hover a piece to see where it can go, with the same decals the game board draws: a check for a
   * quiet move, a bracket for a capture, a bolt for a power. The side to move reads as "yours", so
   * the colours match what the players saw.
   */
  const hoverHints = useMemo(() => {
    const styles: Record<
      string,
      {
        backgroundColor?: string;
        background?: string;
        boxShadow?: string;
        backgroundImage?: string;
        backgroundSize?: string;
        backgroundRepeat?: string;
      }
    > = {};
    if (!hover || !frame) return styles;
    let game: Chess;
    let piece: { color: "w" | "b" } | undefined;
    try {
      game = new Chess(frame.fen);
      piece = game.get(hover as any) as { color: "w" | "b" } | undefined;
    } catch {
      return styles;
    }
    if (!piece) return styles;
    const ours = game.turn() === piece.color;
    const decal = (chaos: boolean, capture: boolean) => ({
      backgroundImage: chaosMoveDecal(chaos, capture, !ours),
      backgroundSize: "100% 100%",
      backgroundRepeat: "no-repeat",
    });
    for (const m of game.moves({ square: hover as any, verbose: true }))
      styles[m.to] = decal(false, !!m.captured);
    try {
      const s = expandVisual(frame.state);
      const own = piece.color === "w" ? s.playerModifiers : s.aiModifiers;
      const foe = piece.color === "w" ? s.aiModifiers : s.playerModifiers;
      for (const m of getChaosMoves(game, own, piece.color, s.assignedSquares, foe))
        if (m.from === hover) styles[m.to] = decal(true, m.type === "capture");
    } catch {
      /* A power that cannot resolve in this position just contributes no squares. */
    }
    styles[hover] = {
      ...(styles[hover] ?? {}),
      backgroundColor: ours ? "#69d9ff55" : "#ffad6855",
      boxShadow: ours ? "inset 0 0 0 3px #a6eeff" : "inset 0 0 0 3px #ffd3a6",
    };
    return styles;
  }, [hover, frame]);
  /** Last move plus the hover hints in one style map for the board. */
  const boardStyles = useMemo(() => {
    const styles: Record<
      string,
      { backgroundColor?: string; background?: string; boxShadow?: string }
    > = {};
    for (const s of [frame?.from, frame?.to])
      if (s) styles[s] = { backgroundColor: "#f3ce72" };
    for (const [square, style] of Object.entries(hoverHints))
      styles[square] = { ...(styles[square] ?? {}), ...style };
    return styles;
  }, [frame?.from, frame?.to, hoverHints]);
  const leave = () => {
    setSelected(null);
    setAuto(false);
    setHover(null);
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
  /** Server anchor plus the elapsed time since this payload arrived. */
  const liveClock = (clock: MatchClock | null | undefined, side: "w" | "b") =>
    clock
      ? clock[side] -
        (clock.active === side ? Math.max(0, now - received) : 0)
      : 0;
  const [muted, setMuted] = useState(false);
  const restoreVolume = useRef(0.6);
  useEffect(() => {
    setMuted(getSoundVolume() === 0);
  }, []);
  const toggleSound = () => {
    if (muted) {
      setSoundVolume(restoreVolume.current || 0.6);
      setMuted(false);
    } else {
      const current = getSoundVolume();
      if (current > 0) restoreVolume.current = current;
      setSoundVolume(0);
      setMuted(true);
    }
  };
  /* Cue every position change the viewer sees — live polls and replay stepping alike. */
  const lastFen = useRef("");
  useEffect(() => {
    const fen = frame?.fen ?? "";
    const before = lastFen.current;
    lastFen.current = fen;
    if (!fen || !before || before === fen) return;
    const boardBefore = before.split(" ")[0];
    const boardNow = fen.split(" ")[0];
    // Ignore game switches and archive jumps across different positions.
    if (boardBefore.split("/").length !== boardNow.split("/").length) return;
    const pieceCount = (board: string) => (board.match(/[a-zA-Z]/g) ?? []).length;
    if (fen.includes("#")) playSound("applause");
    else if (pieceCount(boardNow) < pieceCount(boardBefore))
      playSound("capture");
    else if (fen.includes("+")) playSound("check");
    else playSound("move");
  }, [frame?.fen]);
  const clockChip = (clock: MatchClock | null | undefined, side: "w" | "b") =>
    clock ? (
      <b className={clockState(liveClock(clock, side), clock.active === side)}>
        {clockText(liveClock(clock, side))}
      </b>
    ) : null;
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
              : tab === "archive" ? "Match replays" : "Watch live"}
          </h2>
        </div>
        <div className={styles.headingActions}>
          <button
            className={styles.soundToggle}
            onClick={toggleSound}
            aria-pressed={!muted}
            aria-label={muted ? "Turn move sounds on" : "Turn move sounds off"}
          >
            {muted ? "🔇" : "🔊"} <span>{muted ? "Sound off" : "Sound on"}</span>
          </button>
          {onClose ? (
            <button onClick={onClose} aria-label="Close watchtower">
              ✕
            </button>
          ) : (
            <ChaosNavLink href="/">Play Chaos Chess</ChaosNavLink>
          )}
        </div>
      </header>
      {selected ? (
        <button onClick={leave}>← All games</button>
      ) : (
        <>
          <div className={styles.hero}>
            <div><span className={styles.heroLabel}>GOOD SEATS. BAD IDEAS.</span><h1>Watch the board<br/><em>go off script.</em></h1><p>Catch a match live, or rewind the moment everything changed. Every move. Every ridiculous power.</p></div>
            <div className={styles.heroArt} aria-hidden="true"><span>EXPECT THE UNEXPECTED</span><img src="/pieces/fairy/wVK.svg" alt=""/><img src="/pieces/fairy/bBS.svg" alt=""/><b>↗</b></div>
          </div>
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
              Replays
            </button>
          </nav>
          {tab === "archive" && (
            <details className={styles.ratingHelp}><summary>Which matches are rated?</summary><p className={styles.note}>
              Rated games count toward the ladder: both players must sign in with FireChess or Discord, the clock must be timed, and each must make a move. A displayed username alone does not make a game rated. Guest play and No rush games are casual and do not change ratings, and only the first three games between the same two players each day count.
            </p></details>
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
                      <span className={styles.matchBadge}>{tab === "live" ? "● LIVE NOW" : "↶ REPLAY"}</span>
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
                      {tab === "live" && g.clock && (
                        <span className={styles.rowClocks}>
                          <small>White</small>
                          {clockChip(g.clock, "w")}
                          <small>Black</small>
                          {clockChip(g.clock, "b")}
                        </span>
                      )}
                      <small>
                        {tab === "archive"
                          ? new Date(g.date).toLocaleString()
                          : "Read-only spectator"}
                      </small>
                      {tab === "archive" && (
                        <span className={styles.archiveFacts}>
                          <span title="Full moves: one White and Black turn, including an unfinished final pair. Power picks are excluded.">
                            {g.moveCount == null ? "Move count unavailable" : `${g.moveCount} ${g.moveCount === 1 ? "move" : "moves"}`}
                          </span>
                          <span>{g.platform ?? "Platform unavailable"}</span>
                        </span>
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
                <div className={styles.emptyActions}><ChaosNavLink href="/">Start a match ↗</ChaosNavLink>{tab === "live" && <button onClick={() => {setTab("archive"); setPage(0);}}>Explore replays</button>}</div>
              </div>
            )}
            <nav className={styles.tabs} aria-label="Match pages">
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
              <span>
                {selected.live
                  ? detail.result
                    ? `${detail.result.winner === "draw" ? "Draw" : detail.result.winner === "aborted" ? "No contest" : detail.result.winner + " wins"} · ${detail.result.reason}`
                    : detail.phase
                  : frame && describeWatchFrame(frame)}
              </span>
              {typeof detail.base === "number" && (
                <b className={styles.chip} title="Time control">
                  {control(detail.base, detail.increment ?? 0)}
                </b>
              )}
              {deadline !== null && !detail.result && (
                <b className={styles.chipHot} title="Seconds left to choose">
                  ⏱ {deadline}s
                </b>
              )}
            </div>
            {!selected.live && detail.result && (
              <p>
                {detail.result.winner === "draw"
                  ? "Draw"
                  : detail.result.winner + " wins"}{" "}
                · {detail.result.reason}
              </p>
            )}
            {!selected.live && (
              <div className={styles.archiveFacts}>
                <span title="Total full moves in the game, including an unfinished final pair. Power picks are excluded.">
                  {detail.moveCount == null ? "Move count unavailable" : `${detail.moveCount} ${detail.moveCount === 1 ? "move" : "moves"}`}
                </span>
                <span>{detail.platform ?? "Platform unavailable"}</span>
              </div>
            )}
            <div className={styles.game}>
              <div>
                <div className={styles.player}>
                  <strong>{flipped ? detail.white : detail.black}</strong>
                  <span>
                    {flipped ? "White" : "Black"}{" "}
                    {selected.live && clockChip(detail.clock, flipped ? "w" : "b")}
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
                      onMouseOverSquare={(square) => setHover(square)}
                      onMouseOutSquare={() => setHover(null)}
                      customSquareStyles={boardStyles}
                    />
                  ) : (
                    <p>This position is unavailable.</p>
                  )}
                </div>
                <div className={styles.player}>
                  <strong>{flipped ? detail.black : detail.white}</strong>
                  <span>
                    {flipped ? "Black" : "White"}{" "}
                    {selected.live && clockChip(detail.clock, flipped ? "b" : "w")}
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
                            <p>{anomaly.trigger === "passive" ? "Passive effect · applies to this player's side." : anomaly.trigger === "draft-modifier" ? "Draft effect · changes this player's power choices." : anomaly.trigger === "fen-mod" ? "Starting position effect · applied before play begins." : "Activated ability · usable once per game."}</p>
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
                {pickFrames.length > 0 && (
                  <section>
                    <h3>Pick history</h3>
                    <ol>
                      {pickFrames.map(({ frame: f, at }) => (
                        <li key={at}>
                          <button aria-current={index === at ? "step" : undefined} onClick={() => { setAuto(false); setIndex(at); }}>
                            {describeWatchFrame(f).replace(/^(white|black)/, color => `${color === "white" ? detail.white : detail.black} (${color})`)}
                          </button>
                          {describeWatchAnomaly(f) && <p>{describeWatchAnomaly(f)}</p>}
                        </li>
                      ))}
                    </ol>
                  </section>
                )}
              </aside>
            </div>
          </>
        ))}
    </section>
  );
}
