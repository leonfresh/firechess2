# Chaos Chess — “It got out of hand”

24-second, 1080 × 1920, 30 fps vertical promo for Shorts, Reels, TikTok and Discord sharing. H.264 video with AAC audio. Built in the existing Remotion workspace; no changes to the game or its dependencies.

## Creative

| Time | Beat |
| --- | --- |
| 0–2.5 | We googled en passant. |
| 2.5–5 | Holy hell. It got out of hand. |
| 5–9 | Draft your bad idea: choose the Knook. |
| 9–12.5 | The Knook is real: knight jumps + rook moves. |
| 12.5–15.5 | Torpedo Pawns: two squares from any rank. |
| 15.5–19 | “That’s not a legal move.” / It is now. |
| 19–24 | Chaos Chess. Play on Discord. |

The visuals are stylized motion graphics using the game's existing art and SVG pieces, not a recording of a live match. The two movement demonstrations reflect their actual power rules. Large on-screen copy makes the story readable without audio. Music and tonal effects were synthesized specifically for this video, with no sampled songs or meme clips. No claim of affiliation with r/AnarchyChess.

`chaos-chess-anarchy-leda.mp4` adds Gemini Leda narration with dry, mischievous delivery and music ducking. Eight separately generated lines align to the scene beats. The original `chaos-chess-anarchy-vertical.mp4` retains music and effects without narration. The narrated export is 24 seconds; its audio peaks at -1.66 dBFS. Both exports passed a complete video/audio decode check.

## Suggested post

**Title:** Google en passant. Meet the Knook.

**Caption:** Your opening theory did not prepare you for this. Draft ridiculous powers in Chaos Chess and play with your Discord friends. Send this to the friend who calls every new move illegal.

**Play:** https://chaos.firechess.com

**Community:** https://discord.gg/YS8fc4FtEk

**Tags:** #ChaosChess #AnarchyChess #Chess #Discord

Alternative hook for a follow-up cut: “The knight learned rook moves. Your queen is filing a complaint.”

## Edit / rerender

From `marketing/remotion`:

```sh
python chaos-soundtrack.py
node render-chaos.mjs
```

Then generate and mix the narrated version (requires `GEMINI_API_KEY` in the local ignored `.env`):

```sh
node --env-file=.env chaos-voice.mjs
python mix-chaos-voice.py
```

The voice generator uses `gemini-3.1-flash-tts-preview` with Leda and reuses existing raw clips. To regenerate a changed line, remove only that line's `leda-ID-raw.wav` first. The mixer trims silence, gently fits lines to their slots, ducks music, and copies the original video stream into the narrated export without recompressing the visuals. `public/chaos-promo/narration-only.wav` contains the isolated narration; `voice-cues.json` records the timing and script.

Use `node render-chaos.mjs --stills` for storyboard frames only. The separate entry point is `src/chaos-entry.tsx`; the earlier FireChess roast video remains untouched. Artwork is copied under `public/chaos-promo`. Impact is loaded from the local Windows font for rendering.

The video is prepared for review and posting; it has not been uploaded to social accounts.
