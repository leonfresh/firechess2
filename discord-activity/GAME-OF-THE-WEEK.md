# Game of the Week scoring

The weekly selection requires two distinct signed-in player accounts at match time. Guest-versus-guest and account-versus-guest matches cannot qualify, even after a later login. Casual and friend games can qualify when both players are signed in. Guest replays remain available in the archive and through shared links. If no eligible game exists, the homepage invites players to earn the spotlight; it never falls back to a guest game.

The archive is ranked for replay entertainment, not standard-chess engine accuracy.

- Captures: capped at 16 points.
- Multi-piece removal turns: capped at 18 points.
- Material lead changes (at least a minor-piece advantage): capped at 12 points.
- Eventual winner's largest material deficit: capped at 18 points.
- Decisive finish: 22 points; resignation 10; stalemate/repetition 8.
- Timeouts lose 15 points; abandoned/disconnected games are excluded from weekly selection.
- Signature powers, total powers and an activated anomaly add small capped bonuses.
- Rare decisive endings add at most 4 points. Rated status and extra game length add nothing.
- Results are scaled to 0–100; short/incomplete replays are penalized.

Material uses conventional piece values as a descriptive replay signal, not a claim that a powered piece is objectively worth that amount. A draft that adds pieces may alter the material balance. Only net piece removals count toward capture/destruction signals; duplicated frames do not inflate the score.

The feature shows the largest multi-piece removal position when available, otherwise the finish. Replays link to the exact archive ID so rematches cannot replace the featured game. On equal scores, existing signature diversity breaks ties, then a shorter replay, earlier finish and stable ID.

Validation: six regression tests in scripts/chaos-replay-drama.test.cjs, scoring sampled against 94 recent eligible archives, desktop and 390px mobile preview checked.
