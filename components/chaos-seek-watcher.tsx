"use client";

/**
 * Keeps a matchmaking seek open while its owner plays the AI ("Play the AI while you wait" in
 * ChaosLobby). Polls the open room; when an opponent joins it shows a short countdown and hands the
 * match to the page. Seeks expire server-side after MATCHMAKING_WINDOW_MS, so the watcher re-lists
 * before then, first joining anyone else who is waiting and re-checking the old room so a late
 * joiner is never stranded. Gives up after MAX_BACKGROUND_MS. Leaving or closing the page cancels
 * the seek (DELETE only ever touches a room that is still waiting).
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { chaosHeaders, type ChaosMatchFound, type ChaosOpenSeek } from "@/components/chaos-lobby";

const POLL_MS = 2_000;
/** Re-list comfortably inside the server's 300s MATCHMAKING_WINDOW_MS. */
const RELIST_AFTER_MS = 240_000;
const MAX_BACKGROUND_MS = 600_000;
const JOIN_COUNTDOWN_S = 3; // short: the opening-pick deadline may already be running

type Props = {
  seek: ChaosOpenSeek;
  unlimitedTime: boolean;
  timeControlSeconds: number;
  incrementSeconds: number;
  onFound: (match: ChaosMatchFound) => void;
  onStop: () => void;
};

export function ChaosSeekWatcher({ seek, unlimitedTime, timeControlSeconds, incrementSeconds, onFound, onStop }: Props) {
  const room = useRef(seek);
  const listedAt = useRef(Date.now());
  const startedAt = useRef(Date.now());
  const busy = useRef(false);
  const done = useRef(false);
  const [found, setFound] = useState<ChaosMatchFound | null>(null);
  const [countdown, setCountdown] = useState(JOIN_COUNTDOWN_S);
  const [now, setNow] = useState(Date.now());
  const [gaveUp, setGaveUp] = useState(false);

  const query = `base=${unlimitedTime ? -1 : timeControlSeconds}&inc=${unlimitedTime ? 0 : incrementSeconds}&draftProtocol=2`;

  const cancelRoom = useCallback((roomId: string) =>
    fetch("/api/chaos/matchmake", { method: "DELETE", headers: chaosHeaders(true), credentials: "include", keepalive: true, body: JSON.stringify({ roomId }) }).catch(() => {}), []);

  /** True (and reports the match) when an opponent has taken the seat in our room. */
  const checkJoined = useCallback(async (current: ChaosOpenSeek) => {
    const res = await fetch(`/api/chaos/move?roomId=${current.roomId}`, { headers: chaosHeaders(), credentials: "include" });
    if (!res.ok) return { joined: false, open: false };
    const data = await res.json();
    if (data.status === "playing" && data.guestId) {
      done.current = true;
      setFound({ ...current, joined: false, unlimitedTime, timeControlSeconds, incrementSeconds });
      return { joined: true, open: false };
    }
    return { joined: false, open: data.status === "waiting" };
  }, [unlimitedTime, timeControlSeconds, incrementSeconds]);

  const relist = useCallback(async () => {
    const old = room.current;
    // Close our room first (DELETE only hits a still-waiting room), then look once more: anyone who
    // took the seat before the cancel landed gets their match. Only after that is it safe to take a
    // seat elsewhere, because GET /api/chaos/matchmake joins the room it finds.
    await cancelRoom(old.roomId);
    if ((await checkJoined(old)).joined) return;
    const other = await fetch(`/api/chaos/matchmake?${query}`, { headers: chaosHeaders(), credentials: "include" }).then((r) => r.json()).catch(() => null);
    if (other?.roomId) {
      done.current = true;
      setFound({ roomId: other.roomId, roomCode: other.roomCode, hostColor: other.hostColor, joined: true,
        unlimitedTime: (other.timeControlSeconds ?? 0) === -1, timeControlSeconds: other.timeControlSeconds, incrementSeconds: other.incrementSeconds });
      return;
    }
    const created = await fetch("/api/chaos/matchmake", { method: "POST", headers: chaosHeaders(true), credentials: "include",
      body: JSON.stringify({ unlimitedTime, timeControlSeconds, incrementSeconds, draftProtocol: 2 }) }).then((r) => r.json()).catch(() => null);
    if (!created?.roomId) { done.current = true; setGaveUp(true); return; }
    room.current = { roomId: created.roomId, roomCode: created.roomCode, hostColor: created.hostColor };
    listedAt.current = Date.now();
  }, [query, cancelRoom, checkJoined, unlimitedTime, timeControlSeconds, incrementSeconds]);

  // Poll the open room; re-list before it expires; give up after MAX_BACKGROUND_MS.
  useEffect(() => {
    const timer = setInterval(async () => {
      setNow(Date.now());
      if (done.current || busy.current) return;
      busy.current = true;
      try {
        if (Date.now() - startedAt.current > MAX_BACKGROUND_MS) {
          done.current = true;
          cancelRoom(room.current.roomId);
          setGaveUp(true);
          return;
        }
        const state = await checkJoined(room.current);
        if (!done.current && (!state.open || Date.now() - listedAt.current > RELIST_AFTER_MS)) await relist();
      } catch {
        // Try again on the next tick.
      } finally {
        busy.current = false;
      }
    }, POLL_MS);
    return () => clearInterval(timer);
  }, [checkJoined, relist, cancelRoom]);

  // Leaving the page, or this watcher, cancels a seek nobody has joined. The unmount cancel waits a
  // tick so a remount (React Strict Mode runs effects twice in development) calls it off instead of
  // cancelling the seek it was just handed.
  const pendingLeave = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (pendingLeave.current) { clearTimeout(pendingLeave.current); pendingLeave.current = null; }
    const leave = () => { if (!done.current) void cancelRoom(room.current.roomId); };
    window.addEventListener("pagehide", leave);
    return () => {
      window.removeEventListener("pagehide", leave);
      pendingLeave.current = setTimeout(leave, 0);
    };
  }, [cancelRoom]);

  // Short countdown so the switch from the AI game is not a surprise.
  useEffect(() => {
    if (!found) return;
    if (countdown <= 0) { onFound(found); return; }
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [found, countdown, onFound]);

  const stop = () => { done.current = true; cancelRoom(room.current.roomId); onStop(); };
  const waited = Math.floor((now - startedAt.current) / 1000);

  return (
    <div className="pointer-events-none fixed inset-x-0 z-[10001] flex justify-center px-4" style={{ bottom: "calc(16px + env(safe-area-inset-bottom, 0px))" }}>
      <div role="status" aria-live="polite"
        className={`pointer-events-auto flex max-w-md flex-wrap items-center gap-3 rounded-2xl border px-4 py-3 text-sm shadow-2xl backdrop-blur ${
          found ? "border-emerald-400/60 bg-emerald-950/90 text-emerald-100" : "border-slate-500/40 bg-slate-900/90 text-slate-200"}`}>
        {found ? (
          <>
            <span className="font-semibold">Opponent found! Joining in {countdown}…</span>
            <button type="button" onClick={() => onFound(found)} className="rounded-lg bg-emerald-400 px-3 py-1.5 text-xs font-bold text-emerald-950">
              Join now
            </button>
          </>
        ) : gaveUp ? (
          <>
            <span>No opponent turned up. Keep practising, or search again later.</span>
            <button type="button" onClick={onStop} className="rounded-lg border border-slate-400/40 px-3 py-1.5 text-xs">OK</button>
          </>
        ) : (
          <>
            <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-emerald-300 border-t-transparent" aria-hidden="true" />
            <span>Still looking for an opponent · {Math.floor(waited / 60)}:{String(waited % 60).padStart(2, "0")}</span>
            <button type="button" onClick={stop} className="rounded-lg border border-slate-400/40 px-3 py-1.5 text-xs">Stop</button>
          </>
        )}
      </div>
    </div>
  );
}
