# AI Roast a 700 — HyperFrames short

A 30s, 1080×1920 vertical chess-roast short, built as a [HyperFrames](https://github.com/heygen-com/hyperframes) composition (HTML + GSAP timeline → deterministic MP4).

> Note: HyperFrames is **Node/`npx`-based, not Python.** The only Python in the project is an optional local-TTS provider. Requirements: **Node 22+** and **FFmpeg** on PATH.

## Files
- `index.html` — the composition. All motion is driven by the GSAP timeline registered on `window.__timelines["main"]` (the renderer seeks it frame-by-frame, so **never use CSS keyframes/transitions for motion** — they won't survive deterministic seeking).
- `roast-700.mp4` — last render (draft quality).

## Preview / render
```bash
cd marketing/shorts/ai-roast-700

npx hyperframes preview            # live preview in the browser
npx hyperframes render . -o roast-700.mp4               # standard quality
npx hyperframes render . -o roast-700.mp4 -q high       # post-ready
```
Render is ~37s on 6 workers for the 900-frame (30s @ 30fps) clip.

## Storyboard (9 scenes, 30s)
1. `0.0s` Hook — "I let an AI roast a 700-rated player's chess"
2. `2.4s` Board — Qh5 on move 2
3. `4.6s` Queen tour — 5-square path animates in
4. `7.2s` The blunder — board cross-fades to Nxh5, eval bar swings, red flash
5. `10.6s` Roast card — lines stagger in
6. `16.0s` Stats — accuracy/blunders count up
7. `20.0s` Second hook — "he loses this exact way every game"
8. `23.2s` Your games — "@yourname" scan line
9. `25.8s` End card — FireChess + CTA

## Make it real / make variants
- **Real stats:** the `41% / 7 blunders / M9` numbers are placeholders. Swap them for a true FireChess scan (edit the `#numAcc` / `#numBl` text + the count-up targets in the timeline). Per the playbook: never post fabricated stats.
- **Voiceover:** add an `<audio>` clip on its own `data-track-index`, or generate TTS with `npx hyperframes tts`. The timed VO script lives in `../../SHORTS_HYPERFRAMES_PLAYBOOK.md`.
- **Music:** drop `<audio src="music.mp3" data-start="0" data-duration="30" data-track-index="9" data-volume="0.5">` inside `#root`.
- **Batch variants:** promote `username`, `rating`, `accuracy`, `blunders` to `data-composition-variables` and render many at once with `--batch rows.json` — one short per row, different player each time.

See `../../SHORTS_HYPERFRAMES_PLAYBOOK.md` for the full viral framework and the other two templates (Guess-the-Elo, Stat-Bomb).
