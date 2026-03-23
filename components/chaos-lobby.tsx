"use client";

/**
 * ChaosLobby — Real-time matchmaking lobby for Chaos Chess.
 *
 * Features:
 *  - Online player count (heartbeat every 10s)
 *  - 60-second matchmaking timer with auto-cancel
 *  - Live chat for players waiting in the lobby
 *  - Polls chat messages every 2s for real-time feel
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { getGuestId } from "@/lib/guest-id";

/** Build headers for chaos API calls — includes guest ID for unauthenticated players */
function chaosHeaders(json = false): Record<string, string> {
  const h: Record<string, string> = {};
  if (json) h["Content-Type"] = "application/json";
  // Always include guest ID — server prefers session if available
  h["X-Guest-Id"] = getGuestId();
  return h;
}

/* ------------------------------------------------------------------ */
/*  Types                                                               */
/* ------------------------------------------------------------------ */

type LobbyMessage = {
  id: string;
  userId: string;
  userName: string;
  userImage: string | null;
  message: string;
  createdAt: string;
};

type LobbyProps = {
  /** Called when matchmaking finds a match or user cancels */
  onMatchFound: (data: {
    roomId: string;
    roomCode: string;
    hostColor: string;
    joined: boolean; // true = joined existing room, false = opponent joined ours
    unlimitedTime: boolean;
  }) => void;
  onCancel: () => void;
  /** Whether the user is currently signed in */
  isSignedIn: boolean;
  /** When true, only show online count + chat (no search UI) */
  chatOnly?: boolean;
  /** When true, create/join rooms with unlimited time control (no 30s countdown) */
  unlimitedTime?: boolean;
};

/* ------------------------------------------------------------------ */
/*  Constants                                                           */
/* ------------------------------------------------------------------ */

const PRESENCE_INTERVAL = 10_000; // heartbeat every 10s
const CHAT_POLL_INTERVAL = 2_000; // poll chat every 2s
const MAX_SEARCH_TIME = 60; // 60 seconds max search

const PEPE_GIFS = [
  "/pepe-emojis/animated/88627-pepehype.gif",
  "/pepe-emojis/animated/80293-pepeclap.gif",
  "/pepe-emojis/4437-prayge.png",
  "/pepe-emojis/8557-peepodetective.png",
];

/* ------------------------------------------------------------------ */
/*  Component                                                           */
/* ------------------------------------------------------------------ */

export function ChaosLobby({
  onMatchFound,
  onCancel,
  isSignedIn,
  chatOnly,
  unlimitedTime = false,
}: LobbyProps) {
  /* ── State ── */
  const [onlineCount, setOnlineCount] = useState(0);
  const [messages, setMessages] = useState<LobbyMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [sending, setSending] = useState(false);
  const [searchState, setSearchState] = useState<
    "idle" | "searching" | "found"
  >("idle");
  const [elapsed, setElapsed] = useState(0);

  /* ── Refs ── */
  const presenceRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const chatPollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const searchTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const matchPollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const lastMsgCountRef = useRef(0);
  /** Room we created while host-waiting (so we can cancel it) */
  const ownRoomRef = useRef<{
    roomId: string;
    roomCode: string;
    hostColor: string;
  } | null>(null);

  /* ── Cleanup all intervals ── */
  const clearAllIntervals = useCallback(() => {
    if (presenceRef.current) clearInterval(presenceRef.current);
    if (chatPollRef.current) clearInterval(chatPollRef.current);
    if (searchTimerRef.current) clearInterval(searchTimerRef.current);
    if (matchPollRef.current) clearInterval(matchPollRef.current);
    presenceRef.current = null;
    chatPollRef.current = null;
    searchTimerRef.current = null;
    matchPollRef.current = null;
  }, []);

  /* ── Heartbeat: presence ── */
  const sendHeartbeat = useCallback(async () => {
    try {
      const res = await fetch("/api/chaos/presence", {
        method: "POST",
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        setOnlineCount(data.onlineCount);
      }
    } catch {
      // ignore
    }
  }, []);

  /* ── Fetch chat messages ── */
  const fetchMessages = useCallback(async () => {
    try {
      const res = await fetch("/api/chaos/lobby", { credentials: "include" });
      if (!res.ok) return;
      const data = await res.json();
      setMessages(data.messages);
      setOnlineCount(data.onlineCount);
    } catch {
      // ignore
    }
  }, []);

  /* ── Send chat message ── */
  const sendMessage = useCallback(async () => {
    if (!chatInput.trim() || sending) return;
    setSending(true);
    try {
      const res = await fetch("/api/chaos/lobby", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: chatInput.trim() }),
        credentials: "include",
      });
      if (res.ok) {
        setChatInput("");
        // Immediately fetch to show the new message
        fetchMessages();
      }
    } catch {
      // ignore
    } finally {
      setSending(false);
    }
  }, [chatInput, sending, fetchMessages]);

  /* ── Auto-scroll chat on new messages ── */
  useEffect(() => {
    if (messages.length > lastMsgCountRef.current) {
      chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
    lastMsgCountRef.current = messages.length;
  }, [messages.length]);

  /* ── Start presence + chat polling on mount ── */
  useEffect(() => {
    sendHeartbeat();
    fetchMessages();

    presenceRef.current = setInterval(sendHeartbeat, PRESENCE_INTERVAL);
    chatPollRef.current = setInterval(fetchMessages, CHAT_POLL_INTERVAL);

    return () => {
      clearAllIntervals();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ── Matchmaking: start search ── */
  const startSearch = useCallback(async () => {
    if (!isSignedIn || chatOnly) return;
    setSearchState("searching");
    setElapsed(0);

    // Try to find an existing room first
    try {
      const res = await fetch("/api/chaos/matchmake", {
        headers: chaosHeaders(),
        credentials: "include",
      });
      const data = await res.json();
      if (data.roomId) {
        setSearchState("found");
        clearAllIntervals();
        onMatchFound({
          roomId: data.roomId,
          roomCode: data.roomCode,
          hostColor: data.hostColor,
          joined: true,
          unlimitedTime: (data.timeControlSeconds ?? 0) === -1,
        });
        return;
      }
    } catch {
      // continue to create
    }

    // No open room — create one
    try {
      const createRes = await fetch("/api/chaos/matchmake", {
        method: "POST",
        headers: chaosHeaders(true),
        credentials: "include",
        body: JSON.stringify({ unlimitedTime: !!unlimitedTime }),
      });
      const createData = await createRes.json();
      if (createData.error) {
        setSearchState("idle");
        return;
      }

      // Track our room so we can cancel it
      ownRoomRef.current = {
        roomId: createData.roomId,
        roomCode: createData.roomCode,
        hostColor: createData.hostColor,
      };

      // Start countdown timer
      searchTimerRef.current = setInterval(() => {
        setElapsed((prev) => {
          const next = prev + 1;
          if (next >= MAX_SEARCH_TIME) {
            // Timed out — auto-cancel and clean up on server
            clearAllIntervals();
            setSearchState("idle");
            if (ownRoomRef.current) {
              fetch("/api/chaos/matchmake", {
                method: "DELETE",
                headers: chaosHeaders(true),
                body: JSON.stringify({ roomId: ownRoomRef.current.roomId }),
                credentials: "include",
              }).catch(() => {});
              ownRoomRef.current = null;
            }
            onCancel();
            return 0;
          }
          return next;
        });
      }, 1000);

      // Poll for opponent joining our room + periodically re-check for other rooms
      let pollCycle = 0;
      matchPollRef.current = setInterval(async () => {
        pollCycle++;
        try {
          // Every 3rd cycle, also try to find a different room to join
          // This fixes the simultaneous-creation deadlock
          if (pollCycle % 3 === 0 && ownRoomRef.current) {
            const retryRes = await fetch("/api/chaos/matchmake", {
              headers: chaosHeaders(),
              credentials: "include",
            });
            const retryData = await retryRes.json();
            if (retryData.roomId) {
              // Found another room! Cancel ours and join theirs
              const oldRoom = ownRoomRef.current;
              ownRoomRef.current = null;
              fetch("/api/chaos/matchmake", {
                method: "DELETE",
                headers: chaosHeaders(true),
                body: JSON.stringify({ roomId: oldRoom.roomId }),
                credentials: "include",
              }).catch(() => {});

              setSearchState("found");
              if (searchTimerRef.current) clearInterval(searchTimerRef.current);
              if (matchPollRef.current) clearInterval(matchPollRef.current);
              searchTimerRef.current = null;
              matchPollRef.current = null;
              onMatchFound({
                roomId: retryData.roomId,
                roomCode: retryData.roomCode,
                hostColor: retryData.hostColor,
                joined: true,
                unlimitedTime: (retryData.timeControlSeconds ?? 0) === -1,
              });
              return;
            }
          }

          // Normal poll: check if someone joined our room
          if (!ownRoomRef.current) return;
          const pollRes = await fetch(
            `/api/chaos/move?roomId=${ownRoomRef.current.roomId}`,
            { headers: chaosHeaders(), credentials: "include" },
          );
          if (!pollRes.ok) return;
          const pollData = await pollRes.json();
          if (pollData.status === "playing" && pollData.guestId) {
            const room = ownRoomRef.current;
            ownRoomRef.current = null;
            setSearchState("found");
            if (searchTimerRef.current) clearInterval(searchTimerRef.current);
            if (matchPollRef.current) clearInterval(matchPollRef.current);
            searchTimerRef.current = null;
            matchPollRef.current = null;
            onMatchFound({
              roomId: room.roomId,
              roomCode: room.roomCode,
              hostColor: room.hostColor,
              joined: false,
              unlimitedTime: !!unlimitedTime,
            });
          }
        } catch {
          // ignore
        }
      }, 1500);
    } catch {
      setSearchState("idle");
    }
  }, [isSignedIn, chatOnly, unlimitedTime, onMatchFound, onCancel, clearAllIntervals]);

  /* ── Cancel search ── */
  const cancelSearch = useCallback(() => {
    if (searchTimerRef.current) clearInterval(searchTimerRef.current);
    if (matchPollRef.current) clearInterval(matchPollRef.current);
    searchTimerRef.current = null;
    matchPollRef.current = null;
    setSearchState("idle");
    setElapsed(0);

    // Cancel room on server
    if (ownRoomRef.current) {
      fetch("/api/chaos/matchmake", {
        method: "DELETE",
        headers: chaosHeaders(true),
        body: JSON.stringify({ roomId: ownRoomRef.current.roomId }),
        credentials: "include",
      }).catch(() => {});
      ownRoomRef.current = null;
    }

    onCancel();
  }, [onCancel]);

  /* ── Time display ── */
  const timeLeft = MAX_SEARCH_TIME - elapsed;
  const timerLabel = `${Math.floor(timeLeft / 60)}:${String(timeLeft % 60).padStart(2, "0")}`;
  const progressPct = (elapsed / MAX_SEARCH_TIME) * 100;

  return (
    <div className="flex w-full max-w-lg flex-col gap-4">
      {/* ── Online badge ── */}
      <div className="flex items-center justify-center gap-2">
        <span className="relative flex h-2.5 w-2.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
        </span>
        <span className="text-sm font-medium text-emerald-400">
          {onlineCount} player{onlineCount !== 1 ? "s" : ""} online
        </span>
      </div>

      {/* ── Search button / timer ── */}
      {!chatOnly && (
        <div className="flex flex-col items-center gap-3">
          {searchState === "idle" && (
            <button
              type="button"
              onClick={startSearch}
              disabled={!isSignedIn}
              className="rounded-xl border border-purple-500/30 bg-purple-500/10 px-8 py-4 text-lg font-bold text-purple-400 transition-all hover:bg-purple-500/20 hover:scale-105 disabled:opacity-50"
            >
              🎲 Find Opponent
            </button>
          )}

          {searchState === "searching" && (
            <div className="flex w-full max-w-xs flex-col items-center gap-3">
              {/* Timer ring */}
              <div className="relative flex h-24 w-24 items-center justify-center">
                <svg
                  className="absolute h-full w-full -rotate-90"
                  viewBox="0 0 100 100"
                >
                  <circle
                    cx="50"
                    cy="50"
                    r="44"
                    fill="none"
                    stroke="rgba(168,85,247,0.15)"
                    strokeWidth="6"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="44"
                    fill="none"
                    stroke="rgba(168,85,247,0.8)"
                    strokeWidth="6"
                    strokeLinecap="round"
                    strokeDasharray={`${2 * Math.PI * 44}`}
                    strokeDashoffset={`${2 * Math.PI * 44 * (progressPct / 100)}`}
                    className="transition-all duration-1000"
                  />
                </svg>
                <div className="flex flex-col items-center">
                  <span className="text-xl font-bold text-purple-400">
                    {timerLabel}
                  </span>
                  <span className="text-[9px] uppercase tracking-wider text-slate-500">
                    remaining
                  </span>
                </div>
              </div>

              {/* Searching label */}
              <div className="flex items-center gap-2 text-sm text-slate-400">
                <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-purple-400 border-t-transparent" />
                Searching for opponent…
              </div>

              {/* Progress bar */}
              <div className="h-1 w-full overflow-hidden rounded-full bg-white/[0.06]">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-1000"
                  style={{ width: `${progressPct}%` }}
                />
              </div>

              <button
                type="button"
                onClick={cancelSearch}
                className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-xs font-medium text-red-400 transition-all hover:bg-red-500/20"
              >
                Cancel
              </button>
            </div>
          )}

          {searchState === "found" && (
            <div className="flex items-center gap-2 text-lg font-bold text-emerald-400">
              <img
                src={PEPE_GIFS[0]}
                alt=""
                className="h-8 w-8 object-contain"
              />
              Opponent found!
            </div>
          )}

          {!isSignedIn && searchState === "idle" && (
            <p className="text-xs text-slate-600">
              (Sign in required to matchmake)
            </p>
          )}
        </div>
      )}

      {/* ── Lobby Chat ── */}
      <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] overflow-hidden">
        {/* Chat header */}
        <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-2.5">
          <div className="flex items-center gap-2">
            <span className="text-sm">💬</span>
            <span className="text-xs font-bold text-white">Lobby Chat</span>
          </div>
          <span className="text-[10px] text-slate-500">
            {messages.length} message{messages.length !== 1 ? "s" : ""}
          </span>
        </div>

        {/* Messages */}
        <div className="flex h-48 flex-col gap-0.5 overflow-y-auto p-2 scrollbar-thin scrollbar-thumb-white/10">
          {messages.length === 0 && (
            <div className="flex flex-1 flex-col items-center justify-center gap-2 text-center">
              <img
                src={PEPE_GIFS[2]}
                alt=""
                className="h-10 w-10 object-contain opacity-50"
              />
              <p className="text-xs text-slate-600">
                No messages yet. Say hello while you wait!
              </p>
            </div>
          )}
          {messages.map((msg) => (
            <div
              key={msg.id}
              className="group flex items-start gap-2 rounded-lg px-2 py-1 hover:bg-white/[0.03]"
            >
              {msg.userImage ? (
                <img
                  src={msg.userImage}
                  alt=""
                  className="mt-0.5 h-5 w-5 rounded-full object-cover"
                />
              ) : (
                <div className="mt-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-purple-500/20 text-[10px] text-purple-400">
                  {msg.userName[0]?.toUpperCase() ?? "?"}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <span className="text-[11px] font-semibold text-purple-400">
                  {msg.userName}
                </span>
                <span className="ml-1.5 text-[10px] text-slate-600">
                  {formatTime(msg.createdAt)}
                </span>
                <p className="text-xs leading-relaxed text-slate-300 break-words">
                  {msg.message}
                </p>
              </div>
            </div>
          ))}
          <div ref={chatEndRef} />
        </div>

        {/* Input */}
        {isSignedIn ? (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              sendMessage();
            }}
            className="flex gap-1.5 border-t border-white/[0.06] p-2"
          >
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Type a message…"
              maxLength={200}
              className="flex-1 rounded-lg border border-white/[0.08] bg-white/[0.04] px-3 py-1.5 text-xs text-white outline-none placeholder:text-slate-600 focus:border-purple-500/40"
            />
            <button
              type="submit"
              disabled={!chatInput.trim() || sending}
              className="rounded-lg bg-purple-500/20 px-3 py-1.5 text-xs font-medium text-purple-400 transition-all hover:bg-purple-500/30 disabled:opacity-40"
            >
              Send
            </button>
          </form>
        ) : (
          <div className="border-t border-white/[0.06] p-2 text-center text-[10px] text-slate-600">
            Sign in to chat
          </div>
        )}
      </div>
    </div>
  );
}

/* ── helpers ── */

function formatTime(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "";
  }
}
