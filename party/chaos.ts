import type * as Party from "partykit/server";

/**
 * Chaos Chess — real-time relay server.
 *
 * Relays messages between the two players in a room.
 * Game logic is fully client-side; the server just passes messages through.
 */

export default class ChaosRoom implements Party.Server {
  constructor(readonly room: Party.Room) {}

  onConnect(_conn: Party.Connection) {
    const count = Array.from(this.room.getConnections()).length;
    this.room.broadcast(JSON.stringify({ type: "presence", count }));
  }

  onClose(_conn: Party.Connection) {
    const count = Array.from(this.room.getConnections()).length;
    this.room.broadcast(JSON.stringify({ type: "presence", count }));
  }

  onMessage(message: string, sender: Party.Connection) {
    // Validate JSON but otherwise relay everything to all other connections
    try {
      JSON.parse(message);
    } catch {
      return; // drop malformed messages
    }
    this.room.broadcast(message, [sender.id]);
  }
}
