# Brilliant classification review

Research checked 2026-09-09 against Chess.com Help Center:
https://support.chess.com/en/articles/8572705-how-are-moves-classified-what-is-a-blunder-or-brilliant-etc

Chess.com describes a best or nearly best piece sacrifice that leaves a playable position, without an easy win available even without that move. Its generosity depends on player rating. It does not publish enough detail to reproduce its classifier exactly.

## FireChess approximation (version 2)

- Require a legal capture of the offered non-pawn piece. Illegal captures by pinned pieces or kings do not count.
- Require at least two pawn units invested after the strongest immediate recapture on that square. This also excludes ordinary equal trades.
- Reject losses over 10cp; non-best moves need to be within 5cp. Resulting evaluation must be at least -50cp.
- In batch scans, confirm with analysis at depth 12 or the requested higher depth and two engine candidates. Reject when a distinct alternative is already +300cp or better; with missing alternative evidence, do not award the badge.
- No evaluation-gain requirement: an optimal move should normally preserve the evaluation, not magically improve it.
- Save the continuation starting with the actual played move.

These numerical thresholds are local conservative choices, not Chess.com thresholds. Rating-sensitive expected-points modeling is not implemented. The material test covers direct offers, not all quiet/indirect sacrifices or long exchange sequences. The generic move-quality caller uses the original-position evaluation as a conservative fallback when alternative evaluations are unavailable.

Existing saved reports are not reanalyzed or rewritten. The new report labels pre-version-2 highlights as legacy and explains that a fresh scan is required. Regression tests: node scripts/brilliant-classification.test.cjs.
