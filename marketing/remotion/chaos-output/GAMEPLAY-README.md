# Chaos Chess — Fifth-rank queen

24-second vertical gameplay promo, 1080 × 1920 at 30 fps, with Gemini Leda narration and an original synthesized soundtrack. No AnarchyChess references.

## Source and accuracy

Public archived match: `976507b5-9db4-44c7-91d9-13680d05fe1d:1`.

Replay: https://chaos.firechess.com/watch?match=976507b5-9db4-44c7-91d9-13680d05fe1d%3A1

The video animates the actual archived FEN positions using the game's SVG artwork. It is a replay presentation, not a screen recording of the live interface. Player names are omitted. This older archive lacks complete historical cosmetic assignments; the displayed global pawn, bishop and rook upgrades come from recorded power IDs. No draft choices are fabricated.

The b-pawn advances b2–b4 and b4–b5, promoting with Battlefield Promotion. Its queen subsequently travels b5–b3–b4–e7 and delivers the archive's recorded checkmate. Promotion, queen continuity, and the archived result were checked directly. The montage explicitly labels its rewind and later-game cut.

## Edit

| Time | Content |
| --- | --- |
| 0–3 | Immediate b4–b5 promotion: “This pawn becomes a queen.” |
| 3–6 | Freeze on the result: “On the fifth rank.” |
| 6–10.8 | Rewind: actual moves 31–34, follow the b-pawn. |
| 10.8–14.5 | Promotion replay with the power explanation. |
| 14.5–20 | Later in the same game: moves 45–47 and checkmate. |
| 20–24 | Chess with powerups. Play on Discord. |

## Rebuild

From `marketing/remotion`:

```sh
node --env-file=.env gameplay-voice.mjs
python gameplay-soundtrack.py
python mix-gameplay-voice.py
node render-gameplay.mjs
```

The Gemini key stays in the ignored local `.env`. Existing narration clips are cached. Remove only a specific `public/gameplay/leda-ID-raw.wav` to regenerate that cue after editing its text. The audio mixer preserves natural narration speed for all six lines and lowers music while Leda speaks.

Editable composition: `src/GameplayPromo.tsx`. Replay snapshot: `public/gameplay/replay.json`. Use `node render-gameplay.mjs --stills` for review frames. Output: `chaos-output/chaos-chess-gameplay.mp4`.

Suggested caption: “That pawn is a queen already? Draft powers that change the rules. Play Chaos Chess with your Discord friends: chaos.firechess.com”

Prepared for review; not posted to social accounts.
