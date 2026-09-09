"use client";

import { chaosIdentityHeaders } from '@/lib/chaos-client-identity';
import { useEffect, useRef, useCallback, useState } from "react";
import { getGuestId } from "./guest-id";

/* ------------------------------------------------------------------ */
/*  Types                                                               */
/* ------------------------------------------------------------------ */

export type PartyMessageType =
  | "move" // A player made a move
  | "draft" // A player completed their draft pick
  | "draft_freeze" // Opponent entered draft phase — freeze board immediately
  | "join" // A guest joined the room
  | "resign" // A player resigned
  | "presence" // Connection count changed
  | "draw-offer" // A player offered a draw
  | "draw-accept" // A player accepted the draw offer
  | "draw-decline" // A player declined the draw offer
  | "rematch" // A player requested a rematch
  | "anomaly_pick" // A player picked (or skipped) their opening anomaly
  | "chat"; // In-game chat message in the bounded room event log

export type PartyMoveMessage = {
  type: "move";
  fen: string;
  chaosState: unknown;
  lastMoveFrom: string;
  lastMoveTo: string;
  capturedPawnsWhite: number;
  capturedPawnsBlack: number;
  status: string;
  /** Timer state synced with each move (ms remaining) */
  timerWhiteMs?: number;
  timerBlackMs?: number;
};

export type PartyDraftMessage = {
  type: "draft";
  chaosState: unknown;
  fen: string;
  /** Move that triggered this draft — bundled for atomic move+pick sync */
  lastMoveFrom?: string;
  lastMoveTo?: string;
};

export type PartyDraftFreezeMessage = {
  type: "draft_freeze";
};

export type PartyJoinMessage = {
  type: "join";
  guestId: string;
};

export type PartyResignMessage = {
  type: "resign";
  winner: string;
};

export type PartyPresenceMessage = {
  type: "presence";
  count: number;
};

export type PartyDrawOfferMessage = {
  type: "draw-offer";
};

export type PartyDrawAcceptMessage = {
  type: "draw-accept";
};

export type PartyDrawDeclineMessage = {
  type: "draw-decline";
};

export type PartyRematchMessage = {
  type: "rematch";
};

export type PartyRegisterMessage = {
  type: "register";
  color: "white" | "black";
};

export type PartyChaosMove = {
  type: "chaos_move";
  newFen: string;
  chaosState: unknown;
  lastMoveFrom: string;
  lastMoveTo: string;
  capturedPawnsWhite: number;
  capturedPawnsBlack: number;
  status: string;
  timerWhiteMs?: number;
  timerBlackMs?: number;
};

export type PartyChatMessage = {
  type: "chat";
  text: string;
  senderName?: string;
};

export type PartyAnomalyPickMessage = {
  type: "anomaly_pick";
  /** The anomaly ID the player chose, or null if they skipped */
  anomalyId: string | null;
};

export type PartyMessage =
  | {type: "chat_sync"; messages: import("./chaos-room-sync").RoomChat[]; actor: "host" | "guest"}
  | {type: "chat_error"; error: string}
  | {type: "power_pick" | "power_reroll"; draftId: string; modifierId: string}
  | {type: "power_picked"; modifierId: string; color: string; phase: number; automatic?: boolean}
  | {type: "room_protocol"; version: number}
  | {type: "opening_sync"; snapshot: any; actor: "host" | "guest"}
  | { type: "clock_sync"; clock: import("./chaos-clock").MatchClock | null; base?: number; inc?: number; openingMove?: import("./chaos-room-sync").OpeningMove | null; serverNow?: number }
  | { type: "ability"; square: string; chaosState?: unknown }
  | { type: "king_capture"; from: string; to: string }
  | { type: "game_over"; winner: "white" | "black" | "draw" | "aborted"; reason: string }
  | { type: "sync_error"; error: string; snapshot?: any }
  | { type: "sync_snapshot"; snapshot: any }
  | PartyMoveMessage
  | PartyChaosMove
  | PartyDraftMessage
  | PartyDraftFreezeMessage
  | PartyJoinMessage
  | PartyResignMessage
  | PartyPresenceMessage
  | PartyDrawOfferMessage
  | PartyDrawAcceptMessage
  | PartyDrawDeclineMessage
  | PartyRematchMessage
  | PartyRegisterMessage
  | PartyChatMessage
  | PartyAnomalyPickMessage;

/* ------------------------------------------------------------------ */
/*  Hook                                                                */
/* ------------------------------------------------------------------ */

export const PARTYKIT_HOST = (
  process.env.NEXT_PUBLIC_PARTYKIT_HOST ?? "localhost:1999"
).replace(/^https?:\/\//, "");

/**
 * Durable room event transport. Commands are authenticated and committed before delivery.
 *
 * @param roomId  - The game room ID (null = not connected)
 * @param onMessage - Callback for incoming messages
 * @param playerColor - Presentation only; the server derives color from room membership.
 * @returns { send, disconnect, isConnected }
 */
export function usePartyRoom(
  roomId: string | null,
  onMessage: (msg: PartyMessage) => void,
  playerColor?: "white" | "black",
) {
  const onMessageRef = useRef(onMessage);
  onMessageRef.current = onMessage;
  const sendRef = useRef<(msg: PartyMessage) => void>(() => {});
  const stopRef = useRef<() => void>(() => {});
  const [isConnected, setIsConnected] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    setIsConnected(false);
    setIsSyncing(false);
    if (!roomId) return;
    const controller = new AbortController();
    let revision = -1, stateRevision = 0, initialized = false;
    let flagAt = Infinity;
    let busy = false, stopped = false;
    let socket: WebSocket | null = null, socketReady = false, refreshPending = false;
    let reconnectTimer: ReturnType<typeof setTimeout>;
    let reconnectDelay = 500;
    let pending: { id: string; resolve: (value: any) => void; reject: (error: Error) => void; timeout: ReturnType<typeof setTimeout> } | null = null;
    let timer: ReturnType<typeof setTimeout>;
    const queue: { id: string; message: PartyMessage; baseRevision: number | null }[] = [];
    const headers = () => ({ "Content-Type": "application/json", "X-Guest-Id": getGuestId(), ...chaosIdentityHeaders() });
    const consume = (data: any) => {
      if (stopped) return;
      const first = !initialized;
      if (Array.isArray(data.snapshot?.chat)) onMessageRef.current({type: "chat_sync", messages: data.snapshot.chat, actor: data.actor});
      initialized = true;
      const boardChanged = first || data.stateRevision !== stateRevision;
      stateRevision = data.stateRevision;
      if (data.snapshot?.draftProtocol === 2) {
        onMessageRef.current({type: "room_protocol", version: 2});
        for (const event of data.events ?? []) {
          if (event.revision > revision && event.actor !== data.actor && event.message.type !== "chat" && !["move", "draft", "ability", "draft_freeze", "anomaly_pick", "join"].includes(event.message.type)) onMessageRef.current(event.message);
        }
        if (first || data.revision !== revision || data.snapshot.opening) onMessageRef.current({type: "opening_sync", snapshot: data.snapshot, actor: data.actor});
        const picks = data.snapshot.openingPicks ?? {};
        if (boardChanged && data.stateRevision > 0 && "host" in picks && "guest" in picks) onMessageRef.current({type: "sync_snapshot", snapshot: {...data.snapshot, actor: data.actor}});
      } else if (data.gap || first && data.stateRevision > 0) {
        onMessageRef.current({ type: "sync_snapshot", snapshot: data.snapshot });
      } else {
        for (const event of data.events ?? []) {
          if (event.revision > revision && event.actor !== data.actor && event.message.type !== "chat") onMessageRef.current(event.message);
        }
      }
      revision = Math.max(revision, data.revision);
      if (data.snapshot && "clock" in data.snapshot) {
        const clock = data.snapshot.clock;
        flagAt = clock?.active ? performance.now() + clock[clock.active] : Infinity;
        if (data.snapshot.draft) flagAt = performance.now() + Math.max(0, data.snapshot.draft.deadline - data.snapshot.serverNow);
        if (data.snapshot.nextDeadline != null) flagAt = performance.now() + Math.max(0, data.snapshot.nextDeadline - data.snapshot.serverNow);
        onMessageRef.current({type: "clock_sync", clock, base: data.snapshot.timeControlSeconds, inc: data.snapshot.incrementSeconds, openingMove: data.snapshot.openingMove ?? null, serverNow: data.snapshot.serverNow});
      }
      // Opening choices are durable, including an explicit null (skip).
      if (first && data.opponentPick !== undefined) onMessageRef.current({ type: "anomaly_pick", anomalyId: data.opponentPick });
    };
    const request = async (path: string, options?: RequestInit) => {
      if (socket && socket.readyState === WebSocket.OPEN && (socketReady || !options?.method)) {
        return new Promise<{ res: { ok: boolean; status: number }; data: any }>((resolve, reject) => {
          const id = crypto.randomUUID();
          const timeout = setTimeout(() => {
            pending = null;
            socketReady = false;
            socket?.close();
            reject(new Error("Live request timed out"));
          }, 10_000);
          pending = { id, resolve, reject, timeout };
          socket!.send(JSON.stringify({ id, type: options?.method ? "command" : "read", roomId,
            guestId: getGuestId(), since: revision,
            action: options?.body ? JSON.parse(options.body as string) : undefined }));
        });
      }
      const res = await fetch(path, { ...options, headers: headers(), cache: "no-store",
        signal: AbortSignal.any([controller.signal, AbortSignal.timeout(10_000)]) });
      const data = await res.json();
      if (res.status >= 500) throw new Error(data.error || "Server unavailable");
      return { res, data };
    };
    const cycle = async () => {
      if (stopped || busy) return;
      busy = true;
      refreshPending = false;
      try {
        if (!initialized || !queue.length || socket && socket.readyState === WebSocket.OPEN && !socketReady) {
          const { res, data } = await request(`/api/chaos/sync?roomId=${encodeURIComponent(roomId)}&since=${revision}`);
          if (!res.ok) throw new Error(data.error);
          consume(data);
        }
        if (queue.length) {
          const action = queue[0];
          action.baseRevision ??= stateRevision;
          const { res, data } = await request("/api/chaos/sync", { method: "POST", body: JSON.stringify({ ...action, roomId, since: revision }) });
          if (data.revision !== undefined) consume(data);
          queue.shift();
          if (!res.ok && action.message.type === "chat") {
            onMessageRef.current({type: "chat_error", error: data.error || "Message could not be sent"});
          } else if (!res.ok) {
            // Do not replay queued board changes built on a rejected position.
            queue.length = 0;
            onMessageRef.current({ type: "sync_error", error: data.error, snapshot: data.snapshot });
          }
        }
        if (!stopped) { setIsConnected(true); setIsSyncing(queue.length > 0); }
      } catch {
        // Retain the exact ID and base revision. A lost acknowledgement must not
        // turn a retry into a second move, pick, or rematch request.
        if (!stopped) { setIsConnected(false); setIsSyncing(queue.length > 0); }
      } finally {
        busy = false;
        if (!stopped) timer = setTimeout(cycle, refreshPending ? 0 : Math.min(queue.length ? 350 : socketReady ? 10_000 : 750, Math.max(100, flagAt - performance.now() + 50)));
      }
    };
    sendRef.current = message => {
      if (stopped || message.type === "register" || message.type === "presence") return;
      queue.push({ id: crypto.randomUUID(), message, baseRevision: initialized ? stateRevision : null });
      setIsSyncing(true);
      clearTimeout(timer);
      void cycle();
    };
    const wake = () => { refreshPending = true; clearTimeout(timer); void cycle(); };
    const connect = async () => {
      if (stopped || typeof WebSocket === "undefined") return;
      let liveOrigin: string | undefined, token: string | undefined;
      if (process.env.NEXT_PUBLIC_CHAOS_CLOUDFLARE_LIVE === "true") {
        try {
          const res = await fetch(`/api/chaos/live-ticket?roomId=${encodeURIComponent(roomId)}`, {
            headers: headers(), cache: "no-store", signal: AbortSignal.any([controller.signal, AbortSignal.timeout(8000)]),
          });
          if (!res.ok) throw new Error("Live credentials unavailable");
          const ticket = await res.json();
          liveOrigin = ticket.origin; token = ticket.token;
        } catch {
          if (!stopped) reconnectTimer = setTimeout(connect, 10_000);
          return;
        }
      }
      if (stopped) return;
      const discord = window.location.hostname?.endsWith(".discordsays.com") || new URL(window.location.href).hostname.endsWith(".discordsays.com");
      const url = new URL(liveOrigin && !discord ? liveOrigin : window.location.href);
      url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
      url.pathname = `${discord ? token ? "/.proxy/live" : "/.proxy" : ""}/api/chaos/live`;
      url.search = ""; url.hash = "";
      if (token) url.searchParams.set("roomId", roomId);
      socket = token ? new WebSocket(url, ["chaos-v1", `chaos-token.${token}`]) : new WebSocket(url);
      socket.onopen = wake;
      socket.onmessage = event => {
        let message;
        try { message = JSON.parse(event.data); } catch { socket?.close(); return; }
        if (message.type === "changed") { wake(); return; }
        if (message.type !== "response" || !pending || message.id !== pending.id) return;
        const request = pending; pending = null; clearTimeout(request.timeout);
        if (message.status >= 500) { request.reject(new Error("Server unavailable")); return; }
        socketReady = message.status >= 200 && message.status < 300;
        if (socketReady) reconnectDelay = 500;
        request.resolve({ res: { ok: message.status >= 200 && message.status < 300, status: message.status }, data: message.data });
      };
      socket.onerror = () => socket?.close();
      socket.onclose = () => {
        socketReady = false;
        if (pending) { clearTimeout(pending.timeout); pending.reject(new Error("Live connection closed")); pending = null; }
        if (stopped) return;
        wake();
        reconnectTimer = setTimeout(connect, reconnectDelay + Math.random() * 250);
        reconnectDelay = Math.min(reconnectDelay * 2, 10_000);
      };
    };
    window.addEventListener("online", wake);
    document.addEventListener("visibilitychange", wake);
    void cycle();
    connect();
    const stop = () => {
      stopped = true; controller.abort(); clearTimeout(timer); clearTimeout(reconnectTimer); queue.length = 0;
      if (pending) { clearTimeout(pending.timeout); pending.reject(new Error("Stopped")); pending = null; }
      socket?.close();
    };
    stopRef.current = stop;
    return () => {
      stop();
      window.removeEventListener("online", wake);
      document.removeEventListener("visibilitychange", wake);
      sendRef.current = () => {};
    };
  }, [roomId]);

  const send = useCallback((msg: PartyMessage) => sendRef.current(msg), []);
  const disconnect = useCallback(() => { stopRef.current(); setIsConnected(false); }, []);
  return { send, disconnect, isConnected, isSyncing };
}
