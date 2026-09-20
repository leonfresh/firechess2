# Chaos Chess: Camel short + one-minute showcase

## Audio remix

Latest correction: the 10.78-second whoosh is removed, all effects are cleared from 9.8–11.2 seconds, and the music bed is softened across that region. The finishing sequence (34–42 seconds) now uses Black's orientation with upright pieces and reversed coordinates.

The finish was rechecked with the actual current `chaosOutcome` engine, expanding the archive's final power IDs and preserving its assigned squares and Judgement anomalies. Result: `{winner: 'black', reason: 'Checkmate'}`. White is in check; standard chess offers only `Kd1`, which fails because the Camel on g2 attacks d1. White has zero special-move escapes. This verifies the position beyond the archive's result label.

The latest audio versions are `chaos-chess-camel-short-remix.mp4` and `chaos-chess-showcase-remix.mp4`. They use the user's `shorts-gen/public/music/ChessOverdrive.mp3` and existing meme/effect library. The score switches between lighter explanations and fuller gameplay sections, ducks beneath Leda, and briefly stops for the reactions. “Wait, what?” follows the opening capture; “bruh” follows the Knook's loss in the showcase. Vine boom, record scratch, whoosh, capture clicks, and a correct-answer accent punctuate selected beats.

Spoken reactions are checked not to overlap narration. Both exports passed complete video/audio decoding. The original video streams are copied unchanged into the remixes. Matching `-remix.srt` and `-remix.vtt` files include the reactions.

Rebuild with `python remix-video-audio.py camel-short` or `python remix-video-audio.py showcase`. Selected library assets are copied into `public/audio-remix`; the originals in `shorts-gen` are untouched. Source sections, effect times, and speech windows are recorded in `public/<video>/remix-cues.json`.

## Deliverables

- `chaos-chess-camel-short.mp4`: 18 seconds, vertical 1080 × 1920, 30 fps. Opens with a Camel capturing a rook. No rewind or repeated move. Explains the power, shows other draft options, and ends with Play on Discord.
- `chaos-chess-showcase.mp4`: 60 seconds, landscape 1920 × 1080, 30 fps. A fuller introduction for interested players.
- Matching `.srt` and `.vtt` subtitle tracks use the actual mixed narration clip timings.

Both videos use Gemini Leda narration, an original synthesized score, and movement sounds. Music ducks during speech. The earlier Battlefield Promotion edit and all other exports remain available.

## Landscape chapters

| Time | Subject |
| --- | --- |
| 00:00–00:05 | Camel rook capture: the gameplay hook |
| 00:05–00:11 | Find a player, challenge a friend, practice with AI |
| 00:11–00:17 | Optional opening anomalies |
| 00:17–00:25 | Three-option power drafts every five turns |
| 00:25–00:34 | Knook attack and the opponent's capture: counterplay |
| 00:34–00:42 | Later sequence ending in Camel checkmate |
| 00:42–00:49 | Time controls and clocks pausing during drafts |
| 00:49–00:55 | Leaderboard, live watching, and replays |
| 00:55–01:00 | Play on Discord / chaos.firechess.com |

## Source and accuracy

Gameplay comes from public archive `e3af55a1-82fb-46ad-9e12-7effa0b1e5c8:0`, using exact recorded FEN positions and the game's SVG pieces. The Camel c6–f5 rook capture, Knook d3–d7 pawn capture, queen d8–d7 recapture, rook h1–h8 queen capture, Camel f5–g2 bishop capture, and archive's black checkmate result were verified against that snapshot.

This is an animated replay presentation, not a live screen recording. Historical Camel and Knook cosmetic identities were reconstructed from their observed movement paths because the older archive lacks those assignments per frame. The real lobby and replay interface screenshots were captured from the live website. Anomaly and draft cards illustrate current game options; their displayed choices are examples, not the original game's hidden draft offer.

Power descriptions were checked against the current code. Time controls and play modes were also checked against the live lobby. The showcase is an overview rather than an exhaustive rule reference.

## Rebuild

From `marketing/remotion`, substitute `camel-short` or `showcase`:

```sh
node --env-file=.env generate-video-voices.mjs showcase
python video-soundtrack.py showcase
python mix-video-voices.py showcase
node render-showcase.mjs showcase
```

The Gemini key stays in the ignored local `.env`. Existing raw voice clips are cached. Remove a specific `public/<video>/leda-ID-raw.wav` only when regenerating that line. Narration scripts and cue timing live in `video-briefs.json`; composition and replay rendering live in `src/Showcase.tsx`.

Use `--stills` with the renderer to export review frames without an MP4. Caption timings correspond to the current voice assets and must be refreshed if those assets change.

Prepared for review. Nothing has been posted to social accounts or deployed to the website.
