import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';

const endpoint = `${process.env.PARTYKIT_TEST_ORIGIN || 'ws://127.0.0.1:1999'}/parties/chaos/check-${randomUUID()}`;
const white = new WebSocket(endpoint);
const black = new WebSocket(endpoint);
function wait(socket, event, predicate = () => true) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => finish(new Error(`Timed out waiting for ${event}`)), 10000);
    const listener = value => { if (predicate(value)) finish(null, value); };
    const error = () => finish(new Error('WebSocket connection failed'));
    function finish(reason, value) {
      clearTimeout(timer);
      socket.removeEventListener(event, listener);
      socket.removeEventListener('error', error);
      reason ? reject(reason) : resolve(value);
    }
    socket.addEventListener(event, listener);
    socket.addEventListener('error', error);
  });
}
try {
  await Promise.all([wait(white, 'open'), wait(black, 'open')]);
  white.send(JSON.stringify({ type: 'register', color: 'white' }));
  black.send(JSON.stringify({ type: 'register', color: 'black' }));
  const blackReceives = wait(black, 'message', e => JSON.parse(e.data).type === 'move');
  white.send(JSON.stringify({ type: 'move', from: 'e2', to: 'e4' }));
  assert.match(JSON.parse((await blackReceives).data).fen, / b /);
  const whiteReceives = wait(white, 'message', e => JSON.parse(e.data).type === 'move');
  black.send(JSON.stringify({ type: 'move', from: 'e7', to: 'e5' }));
  assert.match(JSON.parse((await whiteReceives).data).fen, / w /);
  console.log('PASS: two clients connect to the chaos party and exchange legal moves in both directions.');
} finally { white.close(); black.close(); }
// This CLI owns both sockets. End after successful assertions instead of waiting
// indefinitely for the development worker's WebSocket close handshake.
process.exit(0);
