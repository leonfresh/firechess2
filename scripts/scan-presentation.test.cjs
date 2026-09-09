const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const ts = require('typescript');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');

// Exercise the real scan page's render branch. SSR leaves its network/engine
// effects idle; account, routing and unrelated report widgets are test seams.
let query = '';
const empty = () => null;
function load(file) {
  const filename = path.resolve(file);
  const mod = new Module(filename, module);
  mod.filename = filename;
  mod.paths = module.paths;
  mod.require = id => {
    if (id === 'next/link') return ({ children, href, ...props }) => React.createElement('a', { href, ...props }, children);
    if (id === 'next/dynamic') return () => () => React.createElement('div', { 'data-testid': 'completed-report' });
    if (id === 'next/navigation') return { useSearchParams: () => new URLSearchParams(query) };
    if (id === '@/components/session-provider') return { useSession: () => ({ authenticated: true, user: { id: 'owner' }, plan: 'free', isAdmin: false }) };
    if (id === '@/lib/scan-session') return { computeScanReportMeta: () => null };
    if (id.includes('modern-preview/scan-status')) return load('components/modern-preview/scan-status.tsx');
    if (id.endsWith('.module.css')) return { __esModule: true, default: new Proxy({}, { get: (_, key) => String(key) }) };
    if (id.startsWith('@/')) return new Proxy({}, { get: () => empty });
    return require(id);
  };
  mod._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true } }).outputText, filename);
  return mod.exports;
}
const { ScanSessionPage } = load('components/scan-session-page.tsx');
const scan = { id: 'test-scan', userId: 'owner', chessUsername: 'TestPlayer', source: 'lichess', scanMode: 'both', status: 'processing', config: { source: 'lichess', scanMode: 'both', maxGames: 50, maxMoves: 30, engineDepth: 12, cpThreshold: 50, speed: ['all'] }, result: null, reportMeta: null, savedReportId: null, expiresAt: null, error: null };
test('a processing scan renders modern progress instead of the classic report shell', () => {
  const html = renderToStaticMarkup(React.createElement(ScanSessionPage, { initialScan: scan }));
  assert.match(html, /data-testid="modern-scan-status"/);
  assert.match(html, /role="progressbar"/);
  assert.doesNotMatch(html, /Report for/);
});
test('a failed scan renders modern error and retry controls', () => {
  const html = renderToStaticMarkup(React.createElement(ScanSessionPage, { initialScan: { ...scan, status: 'failed', error: 'Could not fetch games' } }));
  assert.match(html, /data-testid="modern-scan-status"/);
  assert.match(html, /Could not fetch games/);
  assert.match(html, /Retry scan/);
});
test('explicit classic view remains available', () => {
  query = 'view=classic';
  try {
    const html = renderToStaticMarkup(React.createElement(ScanSessionPage, { initialScan: scan }));
    assert.match(html, /Report for/);
    assert.doesNotMatch(html, /data-testid="modern-scan-status"/);
  } finally { query = ''; }
});
test('partial findings stay in modern progress until the scan is ready', () => {
  const result = { leaks: [], missedTactics: [], endgameMistakes: [], gamesAnalyzed: 1 };
  const pending = renderToStaticMarkup(React.createElement(ScanSessionPage, { initialScan: { ...scan, result } }));
  assert.match(pending, /data-testid="modern-scan-status"/);
  assert.doesNotMatch(pending, /data-testid="completed-report"/);
  const ready = renderToStaticMarkup(React.createElement(ScanSessionPage, { initialScan: { ...scan, result, status: 'ready' } }));
  assert.match(ready, /data-testid="completed-report"/);
  assert.doesNotMatch(ready, /data-testid="modern-scan-status"/);
});
test('section status uses reported progress and the selected scan mode', () => {
  const { ModernScanStatus } = load('components/modern-preview/scan-status.tsx');
  const html = renderToStaticMarkup(React.createElement(ModernScanStatus, {
    scan: { ...scan, scanMode: 'tactics' }, progress: { phase: 'tactics', message: 'Analyzing tactics', percent: 42 },
    perPhaseProgress: { tactics: { phase: 'tactics', message: 'Analyzing tactics', current: 3, total: 8, percent: 42 } },
    sectionsReady: new Set(), isOwner: true, retryState: 'idle', onRetry: empty,
  }));
  assert.match(html, /aria-valuenow="42"/);
  assert.match(html, /3 of 8/);
  assert.doesNotMatch(html, /<h3>Openings/);
});
