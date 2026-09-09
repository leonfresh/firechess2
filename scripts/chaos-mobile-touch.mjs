// Touch smoke check against an isolated agent-browser session's CDP endpoint.
import { WebSocket } from 'ws';
import { once } from 'node:events';
const socket = new WebSocket(process.env.CHAOS_MOBILE_CDP);
await once(socket, 'open');
let sequence = 0;
const pending = new Map();
socket.on('message', raw => {
  const message = JSON.parse(raw);
  const entry = pending.get(message.id);
  if (entry) { pending.delete(message.id); message.error ? entry.reject(new Error(message.error.message)) : entry.resolve(message.result); }
});
const send = (method, params = {}, sessionId) => new Promise((resolve, reject) => {
  const id = ++sequence; pending.set(id, { resolve, reject });
  socket.send(JSON.stringify({ id, method, params, sessionId }));
});
try {
  const { targetInfos } = await send('Target.getTargets');
  const target = targetInfos.find(t => t.type === 'page' && t.url.startsWith('http://localhost:3001/chaos'));
  if (!target) throw new Error('Open the isolated local Activity first');
  const { sessionId } = await send('Target.attachToTarget', { targetId: target.targetId, flatten: true });
  await send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 }, sessionId);
  const evaluate = async expression => (await send('Runtime.evaluate', { expression, returnByValue: true }, sessionId)).result.value;
  for (const square of process.argv.slice(2)) {
    if (!/^[a-h][1-8]$/.test(square)) throw new Error('Expected square');
    const point = await evaluate(`(()=>{const e=document.querySelector('[data-square="${square}"]');e.scrollIntoView({block:'center'});const r=e.getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2};})()`);
    await send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ ...point, radiusX: 2, radiusY: 2, force: 1 }] }, sessionId);
    await send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }, sessionId);
  }
  console.log(JSON.stringify(await evaluate(`({width:innerWidth,scrollWidth:document.documentElement.scrollWidth,touch:navigator.maxTouchPoints,squares:Array.from(document.querySelectorAll('[data-square]')).filter(e=>['e2','e3','e4'].includes(e.dataset.square)).map(e=>({square:e.dataset.square,html:e.innerHTML,style:e.getAttribute('style')}))})`)));
} finally { socket.close(); }
