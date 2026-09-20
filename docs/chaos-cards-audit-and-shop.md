# Chaos Chess: card audit, new cards, and the gold shop

Date: 21 Sep 2026. Evidence: `chaos_match` archive, 153 finished games (7 to 20 Sep 2026),
972 card drafts, win rates corrected for the first-move advantage (White wins 56.1% of decisive
games, Black 43.9%, 13.7% draws). Raw query: `scripts/tmp-card-stats.mjs` (throwaway).

## 1. How much of the set players actually see

A game drafts **6.4 cards total, about 3.2 per player**, from a pool of 30. Each player sees
roughly a tenth of the set per game, and the phase gate decides which tenth:

| Phase | Cards | Typical appearance |
|---|---|---|
| 1 to 2 | 6 commons | drafted in 28-61% of games |
| 2 to 3 | 10 rares + Kamikaze | 9-35% of games |
| 3 to 4 | 6 epics | 9-24% of games |
| 4 to 5 | 8 legendaries | 9-30% of games, and only if the game runs long |

The eight legendaries all sit in phases 4 and 5 and compete for one slot each. The Amazon, Nuclear
Queen, Rook Cannon and Railgun are each drafted in fewer than 10% of games. **A new card placed in
phase 4 or 5 is nearly invisible**, which matters for anything sold in a shop.

## 2. Which cards underperform (corrected for White's edge)

`n` = drafts, `obs` = win rate of the side holding the card, `exp` = expected given how often that
side was White, `z` = deviation in standard errors. With n this small, treat |z| < 1.6 as noise.

| card | tier | n | obs% | exp% | z |
|---|---|---|---|---|---|
| sniper-bishop | rare | 31 | 29.0 | 49.8 | **-2.3** |
| railgun | legendary | 14 | 14.3 | 48.3 | **-2.5** |
| kings-chains | common | 32 | 31.2 | 49.2 | **-2.0** |
| kamikaze-bishop | legendary | 53 | 37.7 | 51.3 | **-2.0** |
| nuclear-queen | legendary | 20 | 35.0 | 51.2 | -1.5 |
| camel / bishop-bounce / rook-cannon / pawn-charge | mixed | 18-44 | 37-39 | 49-51 | -1.1 to -1.6 |
| amazon | legendary | 20 | 65.0 | 49.4 | +1.4 |
| king-ascension | legendary | 46 | 56.5 | 50.3 | +0.8 |
| night-rider / queen-teleport / collateral-rook | mixed | 16-22 | 54-57 | 49-51 | +0.4 to +0.6 |
| everything else | | | | | < 1.0 |

Reading: the four flagged cards are the ones that ask you to **spend tempo or material for a
conditional payoff**. Sniper Bishop shoots without developing. King's Chains needs the king itself
walked into the fight. Kamikaze Bishop is pure defence at a legendary price. Railgun is a one-shot
that whiffs when no enemy sits on the rook's lines. The cards that measure well are the ones that
add immediate power or tempo (Amazon, King Ascension, Night Rider, Warp Queen, Collateral Damage).

Honest note on Battlefield Promotion: at the old rank 5 it measured 48.6% against 50.5% expected,
so it was **not** winning games above baseline. The "too OP" complaint was about the shape of games
it produced (a queen on move 3 ends the game as a contest), not the win rate. The rank 6 nerf stands
on feel, not on this table.

Honest note on Forced En Passant: 22.2% win rate over 9 drafts, the weakest and rarest card in the
set. Retiring it was right.

## 3. Structural gaps in the set

1. **The set is narrower than 30 cards.** Families re-skinned per piece: cannon (Queen / Bishop /
   Rook), dragon (+1 step, bishop and rook), "gain knight jumps" (Amazon, Archbishop), and seven
   cards that all touch pawn movement.
2. **Almost nothing interacts with the opponent.** Only Toll Gate (blocks their double step) and
   Collateral Damage (can hit allies) change what the *other player* may do. No card reacts to what
   the opponent drafted. There are no deterrents, nothing to play around.
3. **No structure or defence.** Nothing builds a wall, guards a king, or holds ground. The closest
   is King's Chains, which measured worst-but-one.
4. **No early comeback.** Undead Army restores pawns, but only in phase 4 to 5. A player who is
   losing at move 8 gets nothing, which is exactly the population that plays one game and leaves.
5. **No tempo card.** Usurper is the only "surprise" and it is rare.

## 4. Proposed fixes to existing cards

Cheap, evidence-backed, no new machinery:

| card | change | why |
|---|---|---|
| Sniper Bishop | range 2 to **3** squares | worst measured card; range is its only lever |
| King's Chains | freeze the most valuable enemy within **2** squares | usable without walking the king into danger |
| Kamikaze Bishop | re-tier legendary to **epic** | it is defensive; price it as such |
| Railgun | **2 charges** per game | one shot whiffs too often to be a legendary |
| Nuclear Queen | leave alone | the blast is the card's identity; 20 games is noise, and chaos modes need a meme card |

## 5. New cards (shop content)

Design rules for additions:
- **Variety, not power.** Nothing sold should outclass the free 30. The power ceiling stays inside
  the base set, so a shop card is a new way to play, not a better way to win.
- **Phase 1 to 3 wherever possible**, so the card is actually seen.
- **Prefer interaction.** A card the opponent must think about is worth three that just move a piece
  differently.
- **Reuse machinery** (spawn, capture-trigger, capture-without-moving, promotion) so each card is
  hours of work, not days.

| card | tier | phases | mechanic | gap filled | cost |
|---|---|---|---|---|---|
| **Phalanx** | rare | 1-2 | Raise 3 pawns on empty squares of your third rank | structure/defence, first board-shaping card | low (spawn machinery, unused 🔰 icon) |
| **Hostile Takeover** | epic | 2-3 | Once per game, when the opponent captures one of your pawns, the capturing piece defects to your side | interaction/deterrence, opponent must weigh every pawn capture for the rest of the game | medium (capture trigger, Kamikaze template) |
| **Conscription** | rare | 1-2 | Your pawns can also capture diagonally backwards | pawn teeth in the endgame, first card touching pawn captures | low (self-contained move-gen) |
| **Saboteur** | rare | 2-3 | Once per game, destroy an adjacent enemy pawn without moving | breaks fortresses, counters Phalanx and Undead Army | low-medium (Sniper template) |
| **Double Time** | epic | 2-3 | Once per game, move twice in a row | tempo, the missing axis | medium-high (turn order, AI, server sync) |
| **Underdog's Gambit** | rare | 2-3 | While behind by a rook or more, once per game summon a knight on an empty square | comeback for the losing half of the one-and-done tail | medium (material count, spawn) |

First three to build: **Phalanx, Hostile Takeover, Conscription** (one structure, one interaction,
one move-gen; two of the three are cheap).

## 6. Gold and the shop

Agreed shape: **all 30 existing cards become free for everyone**, so the game is fully playable as
it stands and nothing is taken away. Gold buys new cards only, and the shop's promise is variety.

### Where gold comes from

Minted **server-side inside `archive_chaos_match()`** (`migrations/chaos-career.sql`), the trigger
that already runs on every finished game and already carries anti-farm logic. The client cannot
invent gold, and no new auth is needed: `chaos_player` rows already exist for Discord identities
(`discord_<snowflake>`) and website accounts.

- Any archived finished game pays, casual or rated, because No rush is 60% of played games.
- Base 10 gold for finishing, +15 for a win, +5 if the clock was timed, +25 for the first win of
  the day.
- Per-pair daily cap on paying games (mirror the existing `MAX_RATED_GAMES_PER_PAIR_PER_DAY = 3`
  idea, looser at 8) so two friends cannot farm each other indefinitely.
- `guest_*` ids earn nothing (they have no `chaos_player` row); a signed-out player keeps a
  localStorage balance that merges on first sign-in.

### Where gold lives

- `chaos_player.gold integer not null default 0`, plus `chaos_gold_ledger(player_id, amount, reason,
  match_id, created_at)` so "why do I have 340 gold" is answerable and farming is visible.
- `chaos_player_unlock(player_id, modifier_id, unlocked_at, source)` keyed by `chaos_player.id`,
  which works for Discord and website identities alike. The existing `chaos_unlock` table is keyed
  by a website `user` FK and cannot hold a Discord identity, so it stays for website accounts.

### Prices

| tier | price | games to earn (roughly) |
|---|---|---|
| rare | 150 | 6 |
| epic | 400 | 16 |
| legendary | 900 | 36 |

At the observed regulars' rate (5 to 10 games a week) a rare lands in week one, an epic inside a
month. Tune freely, these are knobs not commitments.

### Surfaces

- Armoury gains a **Shop** tab: locked cards with prices, gold balance in the header, buy button.
- The collection list stops showing locks for the base 30 entirely.
- `ensureUnlockedChoice` and the preview-pick soft-lock workaround become dead code and should go.

## 7. Build order

1. **Gold earning**: migration (gold column, ledger, trigger edit), collection API returns balance,
   Armoury shows it, tests. Nothing spendable yet.
2. **Shop**: `chaos_player_unlock`, buy route (server-validated price and balance), Shop tab, all
   base cards freed, tests.
3. **Content**: the three new cards end to end (engine, art, shop entries, tests) plus the four
   fixes in section 4.

Phase 1 and 2 are the economy. Phase 3 is the reason to care about it.
