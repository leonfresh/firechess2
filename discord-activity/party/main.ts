import type * as Party from 'partykit/server';

// The game connects to the named `chaos` party. Keep the default endpoint inert.
export default class ActivityMain implements Party.Server {
  constructor(readonly room: Party.Room) {}
  onRequest() { return new Response('Use the chaos party endpoint.', { status: 404 }); }
}
