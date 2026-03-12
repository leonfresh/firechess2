"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import PartySocket from "partysocket";

/* ------------------------------------------------------------------ */
/*  Types                                                               */
/* ------------------------------------------------------------------ */

export type PartyMessageType =
  | "move"         // A player made a move
  | "draft"        // A player completed their draft pick
  | "draft_freeze" // Opponent entered draft phase — freeze board immediately
  | "join"         // A guest joined the room
  | "resign"       // A player resigned
  | "presence"     // Connection count changed
  | "draw-offer"   // A player offered a draw
  | "draw-accept"  // A player accepted the draw offer
  | "draw-decline" // A player declined the draw offer
  | "rematch";     // A player requested a rematch

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

export type PartyMessage =
  | PartyMoveMessage
  | PartyDraftMessage
  | PartyDraftFreezeMessage
  | PartyJoinMessage
  | PartyResignMessage
  | PartyPresenceMessage
  | PartyDrawOfferMessage
  | PartyDrawAcceptMessage
  | PartyDrawDeclineMessage
  | PartyRematchMessage;

/* ------------------------------------------------------------------ */
/*  Hook                                                                */
/* ------------------------------------------------------------------ */

export const PARTYKIT_HOST = (
  process.env.NEXT_PUBLIC_PARTYKIT_HOST ?? "localhost:1999"
).replace(/^https?:\/\//, "");

/**
 * Connect to a PartyKit room for real-time Chaos Chess sync.
 *
 * @param roomId  - The game room ID (null = not connected)
 * @param onMessage - Callback for incoming messages
 * @returns { send, disconnect, isConnected }
 */
export function usePartyRoom(
  roomId: string | null,
  onMessage: (msg: PartyMessage) => void,
) {
  const socketRef = useRef<PartySocket | null>(null);
  const onMessageRef = useRef(onMessage);
  onMessageRef.current = onMessage;
  const [isConnected, setIsConnected] = useState(false);

  // Connect when roomId changes
  useEffect(() => {
    if (!roomId) {
      setIsConnected(false);
      return;
    }

    const socket = new PartySocket({
      host: PARTYKIT_HOST,
      room: roomId,
      party: "chaos",
    });

    socket.addEventListener("open", () => setIsConnected(true));
    socket.addEventListener("close", () => setIsConnected(false));
    socket.addEventListener("error", () => setIsConnected(false));

    socket.addEventListener("message", (evt) => {
      try {
        const msg = JSON.parse(evt.data) as PartyMessage;
        onMessageRef.current(msg);
      } catch {
        // Malformed message — ignore
      }
    });

    socketRef.current = socket;

    return () => {
      socket.close();
      socketRef.current = null;
      setIsConnected(false);
    };
  }, [roomId]);

  const send = useCallback((msg: PartyMessage) => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify(msg));
    }
  }, []);

  const disconnect = useCallback(() => {
    socketRef.current?.close();
    socketRef.current = null;
  }, []);

  return { send, disconnect, isConnected };
}
