# FireChess UI/UX proposal

Reviewed 9 September 2026: the live homepage, the Gothamchess sample report, and the local homepage/report entry points. This is a design proposal, not an implemented redesign. Mockup data and board positions are illustrative.

## Direction

Keep the recognizable orange brand, but build a clearer journey: scan games, understand one recurring problem, practice the relevant positions, then rescan. Use warm ivory for the public homepage and a charcoal workspace for concentrated analysis. The same typography, spacing, buttons and board palette connect the two.

## What the current experience reveals

- The homepage has a distinctive headline and product preview, but its actual username form sits below the hero. Put the form at the point of interest.
- The homepage competes with itself: scanning, opponent scouting, an app launcher, testimonials, pricing and community all demand attention. Keep scanning dominant and group the additional tools into a secondary exploration section.
- The full report repeats statistics, summary prose and section navigation. A reader must absorb a lot before reaching a position they can practice.
- The biggest takeaway already gives the report a useful starting point. Attach a direct practice action to it and preserve the supporting evidence nearby.
- Some visible report labels undermine confidence: missed tactics appears as both 135 and 366; an 89% conversion rate is described as both 'only 89%' and reliable conversion. Investigate the underlying definitions and make the wording consistent before emphasizing these figures in a new design.
- Very large pawn-loss values appear in tactical and positional summaries. Verify mate-score handling and units; show forced mate separately from ordinary pawn loss rather than presenting potentially misleading averages.
- The signed-in admin view exposes maintenance panels in the primary reading flow. Put those controls in an admin drawer.
- The homepage renders both its custom footer and the global footer. Consolidate them.

## Homepage layout

1. Simple header: brand, How it works, Sample report, Pricing, account entry. Put the broader product directory under Explore.
2. Hero: 'Find the mistakes you keep making.' Follow with one sentence explaining analysis across games.
3. Inline scan form: platform selector, visibly labeled username field, Analyze my games button. Keep PGN available as an alternate import. Move depth, move limits and other technical settings into Advanced settings.
4. Adjacent product preview: a concrete pattern, a position, and the practice action. Avoid an animation that hides the outcome while scanning.
5. Three-step explanation: scan, find patterns, practice.
6. Curated sample reports with a concise takeaway, including a representative club player if an appropriate public report is available.
7. Compact pricing, FAQ and single footer. Use only substantiated testimonials and outcome statistics.

Scanning states: validate usernames inline; preserve the input on errors; distinguish no games, private/unavailable games, platform failures and active analysis. Show actual progress stages and only display time estimates supported by real measurements.

## Report layout

- Compact report header: player, source, games/date range, scan status, save/share menu. Explain the scope of accuracy rather than implying it always covers every move.
- A single persistent desktop sidebar: Overview, Openings, Tactics, Endgames, Time & habits, Training. Keep advanced cross-references and positional breakdowns inside relevant sections.
- Overview: one short coach takeaway, three supporting metrics, and a prioritized queue of up to three training targets. Keep deeper profile charts behind a details action.
- Analysis: position list, large board and adjacent explanation. Selecting a pattern updates the board and evidence together. Show frequency and sample size, played move, better move, and one concise reason.
- One primary action: Practice this pattern. Secondary actions: Show best line and Open analysis. Put FEN, exports and technical details in a menu.
- Keep brilliant moves available as a positive highlight without placing them ahead of the report's main training priority.
- Explain locked content once in context, accurately separating detected results from available results.
- After practice, return to the same pattern and preserve filters/scroll position. Only show completion/progress that the app actually records.

## Mobile behavior

Stack the homepage form before the product preview. Use a compact section picker in reports, a full-width board, then the explanation and practice action. Provide a sticky practice action only when it does not cover board controls or content. Use at least 44px touch targets and avoid horizontal page scrolling. Preserve a user's chosen position when switching sections.

## Visual system

| Element | Proposal |
| --- | --- |
| Homepage canvas | Warm ivory #F6F4EF |
| Workspace canvas | Charcoal #151719 |
| Workspace surface | #202326 |
| Primary accent | Vermilion #F05A32 |
| Main dark-mode text | #F4F3EE |
| Typography | One clean sans-serif family; tabular numerals for metrics |
| Layout | 8px spacing rhythm, 12px card corners, thin borders |
| Board | Cream and muted olive, crisp familiar chess pieces |

Check actual color combinations for WCAG AA contrast, including button labels. Use a darker orange when needed for small text on ivory. Status must have text/icon cues as well as color. Add visible keyboard focus, keyboard-operable navigation and reduced-motion support. Remove full-page grain/vignettes that reduce small-text clarity.

## Implementation order and validation

First resolve metric definitions, conflicting copy and duplicate navigation. Then restructure the report around its first practice action. Next move homepage scanning into the hero and simplify the page. Finally apply shared visual tokens and responsive layouts.

Validate with task-based sessions: can a new visitor start a scan without guidance; can a report reader name the main weakness and start the matching drill; can they explain what a displayed metric measures? Track scan-start/completion rates, time to first practice and return-to-practice behavior. Compare against the current experience rather than assuming cosmetic changes improve conversion.
