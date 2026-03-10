import type * as Party from "partykit/server";

/**
 * Chaos Chess real-time relay server.
 *
 * Each room corresponds to a game (roomId).
 * The server is stateless — it only broadcasts messages between
 * the two connected players. The DB remains the source of truth.
 */
export default class ChaosRoom implements Party.Server {
  constructor(readonly room: Party.Room) {}

  onConnect(conn: Party.Connection) {
    // Announce player count to everyone in the room
    const count = Array.from(this.room.getConnections()).length;
    this.room.broadcast(
      JSON.stringify({ type: "presence", count }),
    );
  }

  onClose(conn: Party.Connection) {
    const count = Array.from(this.room.getConnections()).length;
    this.room.broadcast(
      JSON.stringify({ type: "presence", count }),
    );
  }

  onMessage(message: string, sender: Party.Connection) {
    // Broadcast to all OTHER connections in this room
    this.room.broadcast(message, [sender.id]);
  }
}
