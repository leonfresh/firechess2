import type * as Party from "partykit/server";

/** Retired unversioned relay. Game state now uses /api/chaos/sync. */
export default class ChaosRoom implements Party.Server {
  constructor(readonly room: Party.Room) {}
  onConnect(connection: Party.Connection) {
    connection.close(1008, "Reload Chaos Chess to use the durable room protocol");
  }
  onRequest() {
    return new Response("Use the authenticated room sync endpoint", { status: 410 });
  }
}
