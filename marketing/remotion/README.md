# FireChess Shorts — Remotion workspace

Vertical (1080×1920) chess shorts built with [Remotion](https://www.remotion.dev/), reusing the **real `react-chessboard`** board so the chess matches the website exactly (no hand-drawn pieces).

Isolated workspace — its own `package.json` and `node_modules`, so it can't affect the Next app's build.

## Why Remotion (not HyperFrames) for these
Remotion is React-native: you `import { Chessboard } from "react-chessboard"` and animate with `useCurrentFrame()`. HyperFrames is HTML/GSAP-native, so reusing React components there is awkward. For shorts that must look like the product, Remotion wins. (The earlier HyperFrames version lives in `../shorts/ai-roast-700/` as a reference.)

**License:** Remotion is free for individuals and companies ≤3 people, commercial use included. Solo dev = free tier.

## Run it
```bash
cd marketing/remotion
npm install              # first time (~40s)

npm run studio           # live editor at localhost:3000 — scrub the timeline
npm run render           # -> out.mp4 (1080×1920, 30fps, 30s)

# one still frame to a PNG (handy for thumbnails / QA):
npx remotion still src/index.ts roast frame.png --frame=100
```
Render is ~1–2 min for 900 frames. Verified output: 1080×1920, 30.0s, H.264 MP4.

## Structure
- `src/Root.tsx` — registers the `roast` composition (1080×1920, 30fps, 900 frames).
- `src/Roast.tsx` — the 9 scenes; all motion via `useCurrentFrame` + `interpolate`/`spring`.
- `src/Board.tsx` — wraps the real `react-chessboard` v5 (`animationDurationInMs: 0` for deterministic frames; site square colors `#779952`/`#edeed1`).

## Voiceover (Gemini TTS, Leda voice)
VO clips are generated with `gemini-3.1-flash-tts-preview` (Leda voice) into `public/vo-*.wav`, one per scene, and wired in via Remotion `<Audio>` for tight sync.

```bash
# needs GEMINI_API_KEY in .env (gitignored)
node gen-vo.mjs            # generates any missing clips (skips existing)
node gen-vo.mjs hook --force   # regenerate one clip
```
Scene durations in `Roast.tsx` (`SCENES`) are sized to each clip's length. If you change a line, regenerate and re-check the duration (TTS length varies per run), then nudge `dur`.

> ⚠️ The `.env` key was shared in chat — rotate it. `.env` is gitignored; never commit it.

## Real Stockfish analysis (eval bar, badges, accuracy)
`analyze-game.ts` drives the bundled `stockfish` (npm) engine over every position and writes `src/game-analysis.json`:
- `evalWhite[]` — real centipawn eval per position → the **eval bar** (`evalToPct`).
- `moves[].classification` — each move tagged via the app's `lib/move-quality.ts` (`classifyMoveQuality`) → Chess.com-style **badges** (💀 ??, ❌ ?, ⚠️ ?!, ✅ !, …).
- `whiteAccuracy / whiteBlunders / whiteMistakes` — the **real single-game report** using the app's accuracy formula (`100·exp(−avgCpLoss/180)`), shown in the stats scene. (No more fake 41%.)

```bash
# regenerate after changing the game (run from REPO ROOT — needs root node_modules for stockfish):
npx tsx marketing/remotion/analyze-game.ts
```

## The game
`Roast.tsx` plays a real, chess.js-validated game move-by-move (~0.7s/move) with a live SAN label and last-move highlight (queen moves in amber). The line is a realistic ~700 disaster: a Scholar's-mate attempt fizzles, the queen wanders (h5→f3→f4→g3), then `...Nd4` and `...Ne2+` fork the king + queen (validated: White's only legal reply is Kh1). Swap the `FENS`/`SANS`/`MOVES` arrays for a different game — regenerate with `validate-game.mjs` (chess.js) from any PGN.

The hook scene is intentionally high-energy: a "700 ELO?!" slam, a flash of the fork position, and bouncing reaction emojis (💀🤡😬). Those emojis are royalty-free stand-ins for meme GIFs — to use real GIFs, drop files in `public/` and render with `@remotion/gif`'s `<Gif>` (mind licensing).

## Make it real / variants
- **Real stats:** `41% / 7 blunders` (`S_Stats`) are placeholders — wire to a real FireChess scan before posting. Never post fabricated numbers.
- **Length:** this cut is ~56s (VO-paced). For higher completion, tighten the VO (`ffmpeg ... atempo=1.12`) or shorten lines, then re-fit `SCENES` durations.
- **Batch:** promote `username / rating / accuracy / blunders` to composition `defaultProps` + `inputProps`, then render many variants in a loop (`--props='{...}'`).

See `../SHORTS_HYPERFRAMES_PLAYBOOK.md` for the viral framework, hooks, and the other two short templates (Guess-the-Elo, Stat-Bomb).
