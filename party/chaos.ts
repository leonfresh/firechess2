import type * as Party from "partykit/server";
import { Chess } from "chess.js";

/**
 * Chaos Chess — authoritative real-time server.
 *
 * Responsibilities:
 *  - Validate and apply standard chess moves server-side (chess.js)
 *  - Relay chaos moves (non-standard FEN mutations) after basic sanity checks
 *  - Enforce turn order — reject moves from the wrong player
 *  - Broadcast the canonical game state after every move
 *
 * Message protocol:
 *
 *  Client → Server:
 *    { type: "register", role: "host"|"guest", color: "white"|"black" }
 *    { type: "move", from, to, promotion?, fen, chaosState, lastMoveFrom, lastMoveTo, ... }
 *    { type: "chaos_move", newFen, chaosState, lastMoveFrom, lastMoveTo, ... }
 *    { type: "draft" | "draft_freeze" | "resign" | "draw-offer" | "draw-accept" | "draw-decline" | "rematch" | ... }
 *
 *  Server → Client (broadcast):
 *    { type: "move", fen: <authoritative>, chaosState, lastMoveFrom, lastMoveTo, ... }
 *    { type: "move_rejected", reason: string }   ← only to sender
 *    All other messages are relayed as-is to the other connection.
 */

interface RoomState {
  /** Authoritative Chess instance */
  chess: Chess;
  /** connectionId → color */
  colorMap: Map<string, "white" | "black">;
}

export default class ChaosRoom implements Party.Server {
  private state: RoomState = {
    chess: new Chess(),
    colorMap: new Map(),
  };

  constructor(readonly room: Party.Room) {}

  onConnect(conn: Party.Connection) {
    const count = Array.from(this.room.getConnections()).length;
    this.room.broadcast(JSON.stringify({ type: "presence", count }));
  }

  onClose(conn: Party.Connection) {
    this.state.colorMap.delete(conn.id);
    const count = Array.from(this.room.getConnections()).length;
    this.room.broadcast(JSON.stringify({ type: "presence", count }));
  }

  onMessage(message: string, sender: Party.Connection) {
    let msg: Record<string, unknown>;
    try {
      msg = JSON.parse(message) as Record<string, unknown>;
    } catch {
      return; // malformed — drop
    }

    // ── Registration: client tells us which color they are ──
    if (msg.type === "register") {
      const color = msg.color as string;
      if (color === "white" || color === "black") {
        this.state.colorMap.set(sender.id, color);
      }
      return;
    }

    // ── New game / rematch: reset authoritative state ──
    if (msg.type === "rematch") {
      this.state.chess = new Chess();
      this.room.broadcast(message, [sender.id]);
      return;
    }

    // ── Standard chess move (validate server-side) ──
    if (msg.type === "move") {
      const from = msg.from as string;
      const to   = msg.to   as string;
      const promotion = msg.promotion as string | undefined;

      // Turn check
      const senderColor = this.state.colorMap.get(sender.id);
      const turn = this.state.chess.turn(); // "w" | "b"
      const expectedColor = turn === "w" ? "white" : "black";
      if (senderColor && senderColor !== expectedColor) {
        sender.send(JSON.stringify({ type: "move_rejected", reason: "not_your_turn" }));
        return;
      }

      // Validate and apply
      let moveResult: ReturnType<Chess["move"]> | null = null;
      try {
        moveResult = this.state.chess.move({ from, to, promotion });
      } catch {
        // Illegal move
      }

      if (!moveResult) {
        // Move was rejected by chess.js (illegal).
        // Fall through: relay the message anyway if the client sent a FEN
        // override (chaos moves may come as type:"move" with non-standard FEN).
        // Check if the client sent a FEN that differs from our state — if so,
        // treat it as a chaos/override move and update our state.
        const clientFen = msg.fen as string | undefined;
        if (clientFen && this.isValidFenAdvance(clientFen)) {
          try {
            this.state.chess = new Chess(clientFen);
          } catch { /* invalid FEN — ignore */ }
        }
        // Relay message as-is to opponent
        this.room.broadcast(message, [sender.id]);
        return;
      }

      // Authoritative FEN after validated move
      const authFen = this.state.chess.fen();
      // Build relay message using authoritative FEN, keeping all other fields
      const relay = { ...msg, fen: authFen };
      this.room.broadcast(JSON.stringify(relay), [sender.id]);
      return;
    }

    // ── Chaos move (arbitrary FEN mutation — client-authoritative) ──
    if (msg.type === "chaos_move") {
      const newFen = msg.newFen as string | undefined;
      if (newFen && this.isValidFenAdvance(newFen)) {
        try {
          this.state.chess = new Chess(newFen);
        } catch { /* invalid FEN — ignore */ }
      }
      // Relay to opponent, converting to "move" type so the receiver handles it uniformly
      const relay = { ...msg, type: "move", fen: newFen ?? this.state.chess.fen() };
      this.room.broadcast(JSON.stringify(relay), [sender.id]);
      return;
    }

    // ── Draft messages: relay as-is ──
    // (draft logic is client-side; server just passes them through)
    this.room.broadcast(message, [sender.id]);
  }

  /**
   * Sanity-check that a client-provided FEN represents a valid (if exotic)
   * board position, and that the game isn't going backwards in move count.
   */
  private isValidFenAdvance(fen: string): boolean {
    try {
      const next = new Chess(fen);
      // Accept if full-move number is >= current (not going backwards)
      const currentFull = this.state.chess.moveNumber();
      const nextFull    = next.moveNumber();
      return nextFull >= currentFull - 1; // allow -1 tolerance for en-passant/chaos weirdness
    } catch {
      return false;
    }
  }
}
