"use client";

import { useEffect, useRef, useCallback } from "react";
import PartySocket from "partysocket";

/* ------------------------------------------------------------------ */
/*  Types                                                               */
/* ------------------------------------------------------------------ */

export type PartyMessageType =
  | "move"       // A player made a move
  | "draft"      // A player completed their draft pick
  | "join"       // A guest joined the room
  | "resign"     // A player resigned
  | "presence";  // Connection count changed

export type PartyMoveMessage = {
  type: "move";
  fen: string;
  chaosState: unknown;
  lastMoveFrom: string;
  lastMoveTo: string;
  capturedPawnsWhite: number;
  capturedPawnsBlack: number;
  status: string;
};

export type PartyDraftMessage = {
  type: "draft";
  chaosState: unknown;
  fen: string;
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

export type PartyMessage =
  | PartyMoveMessage
  | PartyDraftMessage
  | PartyJoinMessage
  | PartyResignMessage
  | PartyPresenceMessage;

/* ------------------------------------------------------------------ */
/*  Hook                                                                */
/* ------------------------------------------------------------------ */

const PARTYKIT_HOST =
  process.env.NEXT_PUBLIC_PARTYKIT_HOST ?? "localhost:1999";

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

  // Connect when roomId changes
  useEffect(() => {
    if (!roomId) return;

    const socket = new PartySocket({
      host: PARTYKIT_HOST,
      room: roomId,
      party: "chaos",
    });

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

  return { send, disconnect };
}
