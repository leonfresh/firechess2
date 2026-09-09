const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const ts = require('typescript');
const assert = require('node:assert/strict');
let searches = 0;
let failNextSearch = false;
class Worker {
  listeners = new Set();
  errors = new Set();
  addEventListener(type, fn) { (type === 'error' ? this.errors : type === 'message' ? this.listeners : new Set()).add(fn); }
  removeEventListener(type, fn) { (type === 'error' ? this.errors : type === 'message' ? this.listeners : new Set()).delete(fn); }
  terminate() {}
  postMessage(command) {
    const emit = data => { for (const fn of [...this.listeners]) fn({ data }); };
    if (command === 'uci') queueMicrotask(() => emit('uciok'));
    if (command === 'isready') queueMicrotask(() => emit('readyok'));
    if (command.startsWith('go ')) {
      searches++;
      if (failNextSearch) {
        failNextSearch = false;
        queueMicrotask(() => { for (const fn of [...this.errors]) fn({ message: 'temporary worker failure' }); });
        return;
      }
      setTimeout(() => {
        emit('info depth 12 score cp 20 pv e2e4');
        emit('bestmove e2e4');
      }, 5);
    }
  }
}
global.Worker = Worker;
const file = path.resolve('lib/stockfish-client.ts');
const mod = new Module(file, module);
mod.filename = file;
mod.paths = module.paths;
mod._compile(ts.transpileModule(fs.readFileSync(file, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 }
}).outputText, file);
(async () => {
  const pool = new mod.exports.StockfishPool(4);
  const fen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
  const results = await Promise.all(Array.from({ length: 4 }, () => pool.evaluateFen(fen, 12)));
  console.log(`Four concurrent depth-12 requests for one position: ${searches} engine searches`);
  assert.equal(searches, 1, 'parallel analysis passes must share the same search');
  assert.ok(results.every(result => result.cp === 20));
  await pool.evaluateFen(fen, 10);
  assert.equal(searches, 1, 'completed deeper results remain reusable');
  await Promise.all([pool.evaluateFen(fen, 14), pool.evaluateFen(fen, 14, 5)]);
  assert.equal(searches, 3, 'depth and skill settings must remain distinct');
  failNextSearch = true;
  const failed = await Promise.all([pool.evaluateFen(fen, 9, 3), pool.evaluateFen(fen, 9, 3)]);
  assert.deepEqual(failed, [null, null]);
  assert.equal(searches, 4);
  assert.equal((await pool.evaluateFen(fen, 9, 3)).cp, 20);
  assert.equal(searches, 5, 'failed shared requests must be released for retry');
  pool.destroy();
  console.log('PASS: shared searches, depth reuse, and skill isolation');
})().catch(error => { console.error(error); process.exitCode = 1; });
