/**
 * Watchtower polish: hovering a piece shows where it can go, the pick rail fills in as the replay
 * plays, and the lobby puts its two modal destinations side by side without external arrows.
 */
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const watch = () => fs.readFileSync('components/chaos-watch.tsx', 'utf8');

test('hovering a piece shows where it can go, powers included', () => {
  const src = watch();
  assert.ok(src.includes('onMouseOverSquare={(square) => setHover(square)}'), 'the board must report the hovered square');
  assert.ok(src.includes('onMouseOutSquare={() => setHover(null)}'), 'and clear it on the way out');
  assert.ok(src.includes('getChaosMoves('), 'hover targets must include the powers in play, not just standard moves');
  assert.ok(src.includes('customSquareStyles={boardStyles}'), 'the highlight rides on the board styles');
  assert.ok(src.includes('const hoverTargets = useMemo'), 'targets are computed per hover, not per render');
  assert.ok(/styles\[hover\] = \{ \.\.\.\(styles\[hover\] \?\? \{\}\)/.test(src), 'hovering a last-move square must keep its move highlight');
});

test('the pick history fills in as the replay plays, at the bottom of the rail', () => {
  const src = watch();
  assert.ok(/at <= index &&/.test(src), 'a pick is listed only once the replay has reached it');
  const rail = src.indexOf('<aside className={styles.powers}>');
  const powers = src.indexOf('Powers at this position');
  const picks = src.lastIndexOf('<h3>Pick history</h3>');
  assert.ok(rail > -1 && powers > rail, 'the rail still lists the powers');
  assert.ok(picks > powers, 'pick history belongs at the bottom of the rail');
  assert.ok(src.includes('const pickFrames = useMemo'), 'the rail derives its picks from the current position');
});

test('the lobby puts the two modals side by side and drops their external arrows', () => {
  const lobby = fs.readFileSync('discord-activity/app/game-presentation.tsx', 'utf8');
  const grid = lobby.match(/<nav className="destination-grid"[^>]*>([\s\S]*?)<\/nav>/);
  assert.ok(grid, 'the destination grid must exist');
  const order = grid[1];
  assert.ok(order.indexOf('ActivityCareer') < order.indexOf('ActivityCollection'), 'Collection follows the Leaderboard');
  assert.ok(order.indexOf('ActivityCollection') < order.indexOf('ChaosWatchButton'), 'and the two page cards come after them');
  for (const file of ['discord-activity/app/career.tsx', 'discord-activity/app/collection.tsx']) {
    const src = fs.readFileSync(file, 'utf8');
    assert.ok(!src.includes('destination-arrow'), `${file} opens a modal, so it must not wear the external arrow`);
  }
  assert.ok(watch().includes('destination-arrow'), 'the watch and replay cards are real pages and keep theirs');
});
