# Chess stats pipeline

Real-data crunchers for the FireChess **statistical blog series**. The whole point
is that "we analyzed N games and found X" stays *true* — these scripts compute the
numbers from public data instead of inventing them.

## Data source

The [Lichess open database](https://database.lichess.org/) — free monthly dumps of
every rated game played on Lichess (tens of millions per month), `.pgn.zst`
compressed. Each game's headers include `WhiteElo`, `BlackElo`, `Opening`, `ECO`,
and `Result`, which is all most stats need.

Optional: blend in FireChess's own aggregate scan data once volume is there, for an
angle nobody else can publish.

## Quick start

```bash
# 1. grab a dump (a single month is plenty — these are multi-GB)
curl -O https://database.lichess.org/standard/lichess_db_standard_rated_2026-05.pgn.zst

# 2. crunch it (needs `zstd` on PATH; streams in constant memory)
zstdcat lichess_db_standard_rated_2026-05.pgn.zst \
  | node scripts/chess-stats/analyze-openings.mjs \
  > scripts/chess-stats/out/openings-by-rating.json

# fast smoke test on the first 200k games:
zstdcat *.pgn.zst | node scripts/chess-stats/analyze-openings.mjs --limit 200000
```

Verify the parser without any download:

```bash
node scripts/chess-stats/analyze-openings.mjs < scripts/chess-stats/sample.pgn
```

## Scripts

| Script | Produces | Blog post it feeds |
| --- | --- | --- |
| `analyze-openings.mjs` | Opening popularity + white/draw/black win % per rating band | "The most-played (and most-punishing) openings at every rating" |

### Planned additions
- `analyze-blunders.mjs` — parse `%eval` comments (the *evals* dump) to get blunder/mistake rate by rating → heatmap of "how often each rating hangs a piece."
- `analyze-time.mjs` — clock data → "the rating where players start losing on time."
- `analyze-castling.mjs` — when/whether each rating castles → king-safety story.

## From JSON → blog heatmap

The output JSON drops straight into an inline SVG heatmap in a `content/blog/*.md`
post (the renderer supports raw SVG — see `how-to-play-chaos-chess.md` for the
pattern). One cell per `band × opening`, colored by win %.
