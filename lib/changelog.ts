/* ─────────────────────────────────────────────
 * Changelog data — add newest entries at the TOP.
 * Bump LATEST_VERSION in lib/constants.ts whenever you add a new entry.
 * ───────────────────────────────────────────── */

export type ChangeType = "feature" | "improvement" | "fix" | "design";

export interface ChangeEntry {
  version: number;
  date: string;
  title: string;
  description: string;
  changes: { type: ChangeType; text: string }[];
}

export const CHANGELOG: ChangeEntry[] = [
  {
    version: 25,
    date: "Mar 14, 2026",
    title: "Chaos Chess — Opening Anomalies",
    description:
      "A new pre-game layer for Chaos Chess: before the first move, each player secretly chooses one of four Tarot-inspired Opening Anomalies — a permanent passive power that shapes the entire match. 22 anomalies across all tiers, each with unique mechanics and a once-per-game activation ability.",
    changes: [
      { type: "feature", text: "Opening Anomaly picker — before the game starts, pick one of 4 Tarot-themed anomalies (free players choose from 2; Pro unlocks all 4)" },
      { type: "feature", text: "22 anomaly cards across 4 tiers: The Fool (wanderer pawns), The Emperor (king leaps), The High Priestess (hidden queen), The Hermit (invisible bishop), The Chariot (sprint rook), Strength (titan king), The Hierophant (pillar bishop), Wheel of Fortune (swap), The Lovers (linked pawns), Justice (mirror capture), The Hanged Man (transform), Death (pawn spawner), Temperance (partial move), The Devil (sacrifice), The Tower (fortress), The Star (camel knight), The Moon (ghost queen), The Sun (surge), Judgement (resurrection), The World (all pieces), The Magician (pawn boost), and The Hermit (phantom bishop)" },
      { type: "feature", text: "Anomaly activation abilities — each anomaly grants a one-time in-game power (e.g. Sun Surge: add a random modifier, Judgement: revive a captured piece, Strength: move king up to queen range)" },
      { type: "feature", text: "Death passive — every 5 turns, a pawn spawns on a random empty square on your second rank" },
      { type: "feature", text: "Moon auto-unlock — Moon anomaly's ghost queen becomes available after Phase 2 (turn 10) without needing manual activation" },
      { type: "feature", text: "Anomaly cards shown in the sidebar during the game — see your anomaly and its activation status at a glance" },
      { type: "improvement", text: "Anomaly picker timer reduced from 20s to 15s — auto-picks a random unlocked anomaly when time runs out instead of skipping" },
      { type: "improvement", text: "Anomaly picker timer upgraded to match the draft modal UX — countdown pill with colour-coded urgency (purple → red with pulse at ≤7s)" },
      { type: "fix", text: "Nuclear Queen Stockfish blindness — the AI now correctly factors in the 8-square blast value when evaluating player queen captures, fixing a critical threat-scoring gap" },
      { type: "fix", text: "Anomaly moves Stockfish blindness — Stockfish now accounts for anomaly-powered moves (Fool diagonal pawns, Emperor king leaps, Star camel leaps, Moon ghost captures) when choosing defensive moves" },
    ],
  },
  {
    version: 24,
    date: "Mar 13, 2026",
    title: "Guess the Move — EnhancedEdition",
    description:
      "Major upgrades to the Guess the Move experience: a larger game library, deeper engine ratings, per-collection leaderboards, and a revamped score breakdown screen.",
    changes: [
      { type: "improvement", text: "Game library expanded — more collections and games across all difficulty tiers" },
      { type: "improvement", text: "Score breakdown screen after finishing a game — accuracy %, move-by-move rating distribution chart, best and worst moves highlighted" },
      { type: "feature", text: "Per-collection high scores saved locally — your best score for each collection is persisted and shown in the collection picker" },
      { type: "feature", text: "Keyboard shortcuts — arrow keys step through moves, spacebar toggles autoplay, H shows a hint" },
      { type: "improvement", text: "Move commentary now distinguishes between master move and your guess — shows both ratings side by side after each guess" },
      { type: "fix", text: "Autoplay no longer continues past the last move — stops cleanly and shows the result screen" },
    ],
  },
  {
    version: 23,
    date: "Mar 13, 2026",
    title: "Roast My Elo",
    description:
      "Watch real Lichess games move by move with Gotham Chess / AnarchyChess-style roast commentary powered by Stockfish, then guess the players' Elo rating. Features a 600+ line commentary pool, animated roast avatar that reacts to blunders, autoplay, and a shareable result card.",
    changes: [
      { type: "feature", text: "Roast My Elo page (/roast) — watch real Lichess games with live Stockfish analysis and AnarchyChess-style commentary after every move" },
      { type: "feature", text: "600+ unique roast lines across 6 categories — opening roasts, blunder roasts, Elo flavor lines, guess comments, closing roasts, and positional shade" },
      { type: "feature", text: "Animated roast avatar — reacts with different moods (hyped, shocked, crying, smug, confused) based on blunder count, best-move streaks, and Elo bracket" },
      { type: "feature", text: "Elo bracket guessing — after watching the game, pick a bracket (e.g. 600–800, 1200–1400, 2000+) and find out how far off you were" },
      { type: "feature", text: "Autoplay with adjustable speed — 0.5×, 1×, 2×, 4× — commentary triggers on each move automatically" },
      { type: "feature", text: "Roast leaderboard (/roast/leaderboard) — top scores ranked by Elo-guess accuracy across all games" },
      { type: "feature", text: "Shareable result card — shows your Elo guess, actual Elo, roast grade, and a copy-to-clipboard share link" },
      { type: "improvement", text: "Added 🔥 Roast My Elo link to the navbar More dropdown and mobile menu" },
    ],
  },
  {
    version: 22,
    date: "Mar 12, 2026",
    title: "Chaos Chess — Roguelike Multiplayer",
    description:
      "A full roguelike chess mode where every 5 turns the game freezes and both players draft permanent modifiers that mutate how pieces move — fairy pieces, explosive captures, ghost rooks, and more. Play against Stockfish AI, invite a friend with a room code, or find a random opponent through matchmaking.",
    changes: [
      { type: "feature", text: "Chaos Chess page (/chaos) — roguelike chess against Stockfish AI, a friend via invite code, or a random opponent through 60-second auto-matchmaking" },
      { type: "feature", text: "5 draft phases at move milestones (turns 5, 10, 15, 20, 25) — the game freezes and each player picks one of 3 offered modifiers; the AI drafts its own counter-modifiers" },
      { type: "feature", text: "40+ modifiers across 4 tiers (Common 🟢, Rare 🔵, Epic 🟣, Legendary 🟡) — each modifier permanently adds new legal moves or passive effects to your pieces" },
      { type: "feature", text: "Custom move engine layered on top of chess.js — generates extra legal moves the base library doesn't know about, applied transparently to both sides" },
      { type: "feature", text: "Fairy pieces with custom SVG piece art — Knook (knight+rook hybrid), Archbishop (bishop+knight hybrid), Amazon (queen+knight), Pegasus (flying knight), War Pawn (charge + bayonet combo)" },
      { type: "feature", text: "Modifier overlays on pieces — emoji badges, SVG decorations, pulsing glows, and full piece-image replacement for transformative modifiers visible at a glance" },
      { type: "feature", text: "ELO rating system for Chaos Chess — all players start at 1200, standard ELO with variable K-factor (K=40 provisional, K=20 below 2000, K=10 above 2000)" },
      { type: "feature", text: "5 time control presets — Unlimited, Bullet (3+0), Blitz (5+3), Rapid (10+5), Rapid (15+10) — clocks run during draft phases too" },
      { type: "feature", text: "Real-time multiplayer lobby — live online player count, lobby chat with Pepe emotes, and 60-second matchmaking timer with auto-cancel" },
      { type: "feature", text: "Chaos Chess Leaderboard (/leaderboard/chaos) — top 50 players ranked by ELO with rating tier badges (1200 Challenger, 1400 Expert, 1600 Master, 2000+ Elite)" },
      { type: "feature", text: "PartyKit real-time sync — moves, draft picks, clock values, and game results all sync in real time between players without polling" },
      { type: "feature", text: "AI draft strategy — Stockfish's modifier choices are weighted by phase: early phases favour movement buffs, late phases favour heavy hitters like Nuclear Queen and King Ascension" },
      { type: "improvement", text: "Added ⚡ Chaos Chess link to the navbar More dropdown and mobile menu" },
    ],
  },
  {
    version: 21,
    date: "Mar 12, 2026",
    title: "My Opening Tree",
    description:
      "A personal opening explorer that fetches all your games from Lichess or Chess.com and builds a live interactive move tree — see every opening path you've ever played, your win rate at each branch, and click any node to see the board position.",
    changes: [
      { type: "feature", text: "My Opening Tree page (/my-openings) — fetches up to 500 of your Lichess or Chess.com games and builds a personal opening move tree" },
      { type: "feature", text: "SVG visual tree layout — nodes arranged as a scrollable branching diagram with proportional edge widths based on how often each line is played" },
      { type: "feature", text: "W/D/L stats on every node — win-rate-coloured cards (green ≥55%, red ≤40%, gray otherwise) showing count, wins, draws, and losses" },
      { type: "feature", text: "Interactive board preview — click any node in the tree to see the exact board position at that point in the opening" },
      { type: "feature", text: "Color filter — view your tree as White, Black, or both sides combined" },
      { type: "feature", text: "8 plies deep by default with click-to-expand for deeper lines — top 3 moves per position sorted by frequency" },
      { type: "feature", text: "Lichess and Chess.com support — automatically detects your platform and streams games via the ndjson API for fast incremental loading with a live progress counter" },
      { type: "improvement", text: "Added 🌳 My Opening Tree link to the navbar More dropdown and mobile menu" },
    ],
  },
  {
    version: 20,
    date: "Mar 5, 2026",
    title: "Opening Cheat Sheets, Daily Tips & Avatar Frames",
    description:
      "30 opening cheat sheets, 400 daily chess tips, and 12 avatar frames for the coin shop — plus a coin shop preview page.",
    changes: [
      { type: "feature", text: "Opening Cheat Sheets page (/openings) — 30 curated guides across 5 categories: e4-e5, Semi-Open, d4, Indian Systems, and Flank Openings" },
      { type: "feature", text: "Each cheat sheet includes key ideas, plans for White & Black, common traps with explanations, critical positions with FEN, and famous practitioners" },
      { type: "feature", text: "Category filter pills, search bar, and difficulty badges (Beginner / Intermediate / Advanced) on the Openings page" },
      { type: "feature", text: "Daily Chess Tips widget on the dashboard — 400 entries (quotes, tips, facts, and patterns) rotating by day of year with prev/next browsing" },
      { type: "feature", text: "Avatar Frames in the Coin Shop — 12 cosmetic border effects for your profile avatar (Emerald Glow, Fire Ring, Frozen Aura, Royal Purple, Gold Crown, Prismatic Rainbow, Neon Pink, Dark Shadow, Diamond, Rose Gold, Toxic Green)" },
      { type: "feature", text: "Animated avatar frames — Rainbow cycles through three colours, Diamond pulses with a white glow" },
      { type: "feature", text: "Avatar frames display on the navbar profile picture (desktop & mobile)" },
      { type: "feature", text: "Coin Shop standalone page (/shop) with live 4×4 board preview for piece themes" },
      { type: "feature", text: "24 Lichess piece themes in the Coin Shop — quality-based pricing from 20 to 250 coins" },
      { type: "improvement", text: "Added 📖 Openings link to the More dropdown in the navbar and mobile menu" },
      { type: "improvement", text: "Added 🪙 Coin Shop link to the More dropdown for quick access to /shop" },
    ],
  },
  {
    version: 19,
    date: "Mar 4, 2026",
    title: "Guess the Move & Game Library",
    description:
      "A full Guess the Move experience with 100 GM games across 10 themed collections, a Game Library modal for the analyzer, engine-rated guesses, and board UX upgrades throughout.",
    changes: [
      { type: "feature", text: "Guess the Move page (/guess) — play through 100 famous GM games and try to find each move. Supports click-to-move, drag-and-drop, hints, and keyboard controls" },
      { type: "feature", text: "10 game collections — World Championship Classics, Bobby Fischer Brilliancies, Kasparov's Immortals, Tal's Sacrifices, Capablanca's Technique, Modern Masterpieces, Romantic Era, Endgame Artistry, Attacking Masterclasses, and Defensive Masterpieces" },
      { type: "feature", text: "Side selection — guess as White, Black, or Both sides with auto-play for opponent moves" },
      { type: "feature", text: "Game Library modal on the main page — browse and load any of the 100 games into the PGN Analyzer with folder categories and tag filters" },
      { type: "feature", text: "Input method tabs on the Control Center — switch between Input PGN, Lichess/Chess.com, and Load Library" },
      { type: "feature", text: "Engine-rated moves — after each guess, Stockfish (depth 12) rates both your move and the master's move (Best ✅, Excellent 💎, Good 👍, Inaccuracy ⚠️, Mistake ❌, Blunder 💀)" },
      { type: "feature", text: "Emoji result badges on pieces — ✅/⚠️/❌ badge appears on the top-right of the destination square after each guess, matching the analyze page style" },
      { type: "feature", text: "Opponent last-move highlighting — from/to squares of the opponent's auto-played move are highlighted in amber" },
      { type: "improvement", text: "Bigger board on desktop for Guess the Move — increased from 400px to 560px for a more immersive experience" },
      { type: "improvement", text: "Positional patterns explain modal now uses the best continuation animation instead of the mistake line — matches the openings modal behaviour" },
      { type: "improvement", text: "Positional patterns switched to 2-column desktop layout with bigger 280px boards (up from 180px 3-column)" },
      { type: "improvement", text: "Move history log shows engine ratings inline — emoji next to each SAN, hover to reveal 'You: Good · GM: Best' detail row" },
      { type: "fix", text: "Gambit sideline detection improved — Budapest Gambit, Vienna Gambit, and other popular gambits no longer flagged as inaccuracies (lower win-rate threshold, popularity bonus, auto-approve 50K+ game lines)" },
      { type: "fix", text: "Guess the Move sidebar no longer overlaps the board — fixed with sticky positioning, scroll overflow, and text wrapping" },
      { type: "fix", text: "Error modal for failed game loads — if a PGN can't be parsed, a descriptive error dialog appears instead of a silent failure" },
      { type: "design", text: "Removed 'All' scan mode button from the UI — scan modes are now Openings, Tactics, Endgames, and Time Management" },
    ],
  },
  {
    version: 18,
    date: "Mar 4, 2026",
    title: "Patterns Standalone Section & Time Management CTA",
    description:
      "Positional Patterns is now its own collapsible section instead of a tab, and every scan mode cross-sells Time Management.",
    changes: [
      { type: "improvement", text: "Positional Patterns moved out of the Opening Analysis folder tabs into a standalone collapsible section with its own header — easier to find and always visible" },
      { type: "feature", text: "Time Management CTA — after any non-time scan (openings, tactics, endgames, or all) a card suggests running a time management scan" },
      { type: "improvement", text: "Time Management results no longer appear inside openings/tactics/endgames scans — it has its own dedicated scan mode now" },
      { type: "improvement", text: "Training page tagged as BETA with a feedback CTA linking to /feedback" },
      { type: "fix", text: "Dashboard progress charts and radar now only include openings/both scans — tactics-only and endgame-only scans no longer drag accuracy down to 0" },
    ],
  },
  {
    version: 17,
    date: "Mar 3, 2026",
    title: "Time Management Scan Mode & Clock Insights",
    description:
      "A dedicated Time Management scan mode that analyses your clock usage across games — finds rushed moves, wasted thinks, justified pauses, and time scrambles.",
    changes: [
      { type: "feature", text: "Time Management scan mode — analyses clock data to find rushed moves, wasted time, justified thinks, and time scrambles" },
      { type: "feature", text: "Time Management score (0–100), avg time per move, and per-moment breakdown with verdict cards" },
      { type: "feature", text: "Time Card grid layout — score, avg/move, justified thinks, wasted time, rushed moves, and time scramble count" },
      { type: "feature", text: "Missed tactics now show clock info — time remaining (mm:ss) and percentage of game time left when the tactic was missed" },
      { type: "feature", text: "Time Pressure Training mode in Training Center — replay rushed and overthought positions under simulated clock pressure" },
      { type: "improvement", text: "Dashboard report history shows time management score, avg/move, and key stats for time-management reports" },
      { type: "fix", text: "Time management reports excluded from progress-over-time charts and radar (no accuracy/cpLoss data)" },
    ],
  },
  {
    version: 16,
    date: "Mar 3, 2026",
    title: "PGN Game Analyzer",
    description:
      "Paste or upload a PGN file to analyze any chess game — your own games, famous historical games, or tournament games. Full move-by-move analysis with the same engine.",
    changes: [
      { type: "feature", text: "PGN Game Analyzer page (/analyze) — paste PGN text or upload .pgn files for full move-by-move analysis" },
      { type: "feature", text: "Chess.com-style move badges — !! Brilliant, ! Great, ✓ Best, ⊘ Inaccuracy, ? Mistake, ?? Blunder on every move" },
      { type: "feature", text: "Interactive analysis board with eval bar, move list, and navigable move history" },
      { type: "feature", text: "Sample PGNs — Fischer–Spassky 1972 Game 6 and other classic games available as one-click presets" },
      { type: "feature", text: "Lichess / Chess.com game loader modal — paste a game URL to import and analyze it directly" },
      { type: "fix", text: "PGN parser handles SAN disambiguation with look-ahead — correctly parses complex games like Fischer–Spassky" },
      { type: "fix", text: "Aggressive inaccuracy threshold fixed — minor eval shifts no longer flagged as inaccuracies" },
    ],
  },
  {
    version: 15,
    date: "Mar 3, 2026",
    title: "Share Your Results & Board Upgrades",
    description:
      "Viral Elo Report share modal, accuracy badges on board pieces, bigger boards everywhere, and multiple UI polish fixes.",
    changes: [
      { type: "feature", text: "Viral Elo Report modal — shareable card with your estimated rating, accuracy grade, and key stats" },
      { type: "feature", text: "Share buttons — post your report to X (Twitter) and Facebook with one click" },
      { type: "feature", text: "Accuracy badges on board pieces — each piece shows its move classification (!!, !, ?, ??) directly on the board" },
      { type: "feature", text: "Folder tab UI for Opening Analysis — Mistakes, Patterns, and Rankings organized into a clean tabbed layout" },
      { type: "improvement", text: "Analysis board 1.5× bigger with a narrower move list — more space for the position" },
      { type: "improvement", text: "Arrow colors fixed — red for your move, green for best move consistently across all boards" },
      { type: "fix", text: "Save button now works for all scan modes (tactics-only, endgames-only, time-management)" },
      { type: "fix", text: "firechess.club links updated to firechess.com throughout the app" },
      { type: "fix", text: "Opening Explorer fallback fix — no longer crashes when Lichess API returns empty data" },
    ],
  },
  {
    version: 14,
    date: "Mar 2, 2026",
    title: "Positional Pattern Detector & Training Fixes",
    description:
      "The analysis engine now detects positional mistakes — not just tactical blunders — and pairs each pattern with a GM quote to explain the concept.",
    changes: [
      { type: "feature", text: "Positional pattern detector — identifies Unnecessary Captures, Premature Trades, Released Tension, Passive Retreats, Greedy Pawn Grabs, and more" },
      { type: "feature", text: "GM wisdom quotes on each pattern — Igor Smirnov, Kasparov, Nimzowitsch, Capablanca, Tarrasch, and others" },
      { type: "feature", text: "\"Greedy Pawn Grab\" detector — flags when you snatch a pawn with a piece and lose critical tempo" },
      { type: "improvement", text: "Positional patterns appear in the motif breakdown on the homepage and feed into training puzzles" },
      { type: "fix", text: "Training coin rewards reduced to 2 per puzzle (was 5) with a daily cap of 20 — no more infinite coin farming" },
      { type: "fix", text: "Coin counter now shows actual coins earned instead of total balance" },
      { type: "fix", text: "Correct moves in training now keep the piece on the destination square instead of reverting" },
      { type: "fix", text: "After 3 wrong tries, the correct move animates on the board so you can learn from it" },
      { type: "fix", text: "Correct / Wrong sound effects now play in training puzzles" },
    ],
  },
  {
    version: 13,
    date: "Mar 2, 2026",
    title: "Training Center",
    description:
      "A dedicated Training page with 5 modes that target your weaknesses — practice puzzles, drill openings, spot your own blunders, and sharpen endgames.",
    changes: [
      { type: "feature", text: "Weakness Trainer — puzzles targeting your worst tactical motifs from scan reports" },
      { type: "feature", text: "Speed Drill — timed puzzle rush (3 or 5 min) to build pattern recognition under pressure" },
      { type: "feature", text: "Blunder Spotter — find the best move in positions from your own games" },
      { type: "feature", text: "Opening Trainer — practice the correct moves in your recurring opening leaks" },
      { type: "feature", text: "Endgame Gym — targeted puzzles for your weakest endgame types" },
      { type: "improvement", text: "3 retry attempts per puzzle — wrong moves shake the board and cost a life instead of instant fail" },
      { type: "improvement", text: "Bigger board (480px), turn indicator, hearts UI for remaining tries" },
      { type: "improvement", text: "Training is accessible without login — Speed Drill works for everyone, other modes unlock after a scan" },
    ],
  },
  {
    version: 12,
    date: "Mar 1, 2026",
    title: "Game Cache Fix",
    description:
      "Switching from a lower to higher game count (e.g. 300 → 2000) now correctly fetches the additional games instead of silently reusing the smaller cache.",
    changes: [
      { type: "fix", text: "Increasing game count no longer skips older games — cache is only reused when it already covers the requested count" },
      { type: "fix", text: "Cache merge logic no longer backfills stale games when a full re-fetch was performed" },
      { type: "fix", text: "Game cache limit raised from 1,000 to 5,000 to match Pro tier max games" },
    ],
  },
  {
    version: 11,
    date: "Mar 1, 2026",
    title: "Puzzle Promotion Fix & Hint Button",
    description:
      "Personalized puzzles now handle promotions correctly and include a hint button to nudge you toward the right move.",
    changes: [
      { type: "fix", text: "Promotion puzzles now auto-queen when the solution expects a queen promotion — promo dialog only appears for underpromotion puzzles" },
      { type: "feature", text: "Hint button highlights the source square of the expected move with a green glow" },
    ],
  },
  {
    version: 10,
    date: "Mar 1, 2026",
    title: "Personalized Puzzles",
    description:
      "Practice puzzles generated from your own missed tactics. Positions are pulled from your Lichess puzzle history and presented inline with drag-and-drop solving.",
    changes: [
      { type: "feature", text: "Personalized Puzzles section — solve tactics from your own games directly in the report" },
      { type: "feature", text: "Puzzles fetched from Lichess puzzle activity API based on your username" },
      { type: "feature", text: "Inline expandable board with drag-and-drop moves, move validation, and success/fail feedback" },
      { type: "feature", text: "Puzzle counter and navigation — work through your set one by one" },
    ],
  },
  {
    version: 9,
    date: "Feb 27, 2026",
    title: "Collapsible Sections & Mate Eval Fix",
    description:
      "Report sections are now collapsible in list view to save vertical space, and eval displays throughout the app correctly show \"Mate in X\" instead of nonsensical 999+ values.",
    changes: [
      { type: "improvement", text: "Opening Leaks, Missed Tactics, and Endgame Analysis sections are now collapsible — click the header to toggle open/closed" },
      { type: "improvement", text: "Chevron icon on each section header rotates to indicate open/closed state with a smooth animation" },
      { type: "fix", text: "Opening leak cards no longer show \"990.0\" or \"999+\" for mate scores — now correctly displays \"+M3\", \"-Mate\", etc." },
      { type: "fix", text: "Eval bar label now shows \"M3\" / \"Mate\" for mate positions instead of raw centipawn values like \"+990.0\"" },
      { type: "fix", text: "Endgame \"Worst Blunder\" stat now shows \"Mate\" when the worst miss was a missed mate (matches the tactics section behaviour)" },
    ],
  },
  {
    version: 8,
    date: "Feb 27, 2026",
    title: "Endgame & Tactics Fixes, Opening Quality-of-Life",
    description:
      "Major endgame stat fix, ranked category breakdowns for both endgames and tactics, improved opening name coverage, bigger Opening Rankings boards, and hero/card design upgrades.",
    changes: [
      { type: "fix", text: "Endgame conversion rate & hold rate fixed — was showing ~11% even for GMs because game outcomes from resignation/timeout were silently ignored (only checkmate/stalemate were counted)" },
      { type: "fix", text: "Endgame start eval now captured regardless of whose turn it is — previously skipped ~50% of endgames" },
      { type: "improvement", text: "Endgame categories now ranked worst \u2192 best with numbered badges (#1, #2\u2026), red/amber/green color gradient, and WEAKEST / BEST labels" },
      { type: "improvement", text: "Tactic motif patterns now ranked worst \u2192 best by average CP loss (instead of by count) with the same numbered badge + color gradient system" },
      { type: "improvement", text: "Opening leak cards now show the opening name immediately from source data (Lichess/Chess.com) instead of waiting for the Explorer API" },
      { type: "improvement", text: "Opening Rankings boards enlarged from 72px to 120px with a 2-column grid layout on desktop" },
      { type: "design", text: "Hero demo board enlarged and redesigned with Pattern Detected callout, Eval Shift section, and horizontal badge row" },
      { type: "design", text: "Opening leak cards redesigned with hero-style Pattern Detected gradient callout and Before/After eval comparison" },
      { type: "fix", text: "Opening Rankings no longer stuck on loading — removed serial Lichess Explorer API calls, now renders instantly from scan data" },
      { type: "fix", text: "Opening Rankings boards no longer clip pieces (removed rounded corners) and use the user\u2019s board theme" },
      { type: "improvement", text: "Opening Rankings require at least 5 games per opening to appear (filters out noise)" },
    ],
  },
  {
    version: 7,
    date: "Feb 27, 2026",
    title: "Study Plans, Opening Rankings & Retention Upgrades",
    description:
      "Personalised study plans, opening rankings with mini boards, mental-game stats saved to your dashboard, plus a full retention suite: achievements, goals, rescan reminders, shareable report cards, weekly email digests, daily challenge puzzles, progress highlights, opening repertoire, percentile comparison, and a coin economy with a cosmetic shop.",
    changes: [
      { type: "feature", text: "Coin Economy — earn virtual coins from scans (+5, up to 3×/day), daily challenges (+10/+3), study tasks (+5), achievements (+20), and repertoire saves (+2)" },
      { type: "feature", text: "Coin Shop — spend earned coins on 10 board colour themes (Ocean, Midnight, Coral, Walnut, Ice, Royal, Neon, Candy, Ember) and 6 profile titles" },
      { type: "feature", text: "Board Themes — purchased themes apply instantly to every chessboard across the app (drill mode, tactic cards, mistake cards, endgame cards, daily challenge, repertoire, hero board)" },
      { type: "feature", text: "Profile Titles — equippable titles (Chess Student, Tactician, Strategist, Master Analyst, Elite Scholar, Grandmaster) shown as a badge on the dashboard header" },
      { type: "feature", text: "Coin balance badge in the navbar — shows your current coin count next to the Dashboard link" },
      { type: "feature", text: "Daily Challenge — a daily puzzle from your own missed tactics, with streak tracking and answer reveal, right on the dashboard" },
      { type: "feature", text: "Progress Highlights — celebratory banners show what improved since your last scan (accuracy, rating, fewer leaks, sharper tactics, etc.)" },
      { type: "feature", text: "Opening Repertoire — save correct moves from any leak card to build a personal opening repertoire you can review on the dashboard" },
      { type: "feature", text: "Percentile Comparison — see how your accuracy and rating rank against all FireChess users with visual progress bars and motivational messages" },
      { type: "feature", text: "Study Plan system — after every scan a weekly study plan is generated with targeted tasks based on your weaknesses" },
      { type: "feature", text: "Per-player study plans — each chess username gets its own independent study plan with separate streaks and progress" },
      { type: "feature", text: "Opening Rankings — new section showing all your openings with mini chessboards, colour badges, W/D/L record, sorted by win-rate (lowest first)" },
      { type: "feature", text: "Mental Game stats now saved to dashboard — composure, tilt score, and archetype persist across sessions" },
      { type: "feature", text: "Tactics toggle in Openings mode — flip a switch to also scan for missed tactics without leaving openings mode" },
      { type: "feature", text: "Achievements & Badges — 22 unlockable badges on the dashboard based on scan count, accuracy milestones, ratings, streaks, and more" },
      { type: "feature", text: "Goal Setting widget — set a target rating or accuracy goal and track your progress on the dashboard with a visual progress bar" },
      { type: "feature", text: "Rescan Reminder — dashboard banner nudges you to rescan if your last analysis is more than 7 days old" },
      { type: "feature", text: "Share Report Card — Canvas-generated 600×400 PNG image of your report card that you can share on social or download" },
      { type: "feature", text: "Weekly Email Digest — opt-in weekly email summary with scan activity, study plan streak, and motivational prompt (Vercel Cron, Resend)" },
      { type: "design", text: "Save-to-Dashboard CTA redesigned — feature pills replaced with a 2×2 card grid (Study Plan, Progress Charts, Daily Streaks, Track Accuracy)" },
      { type: "improvement", text: "Study plans fully ungated — all users get full weekly tasks, streaks, and progress tracking (better for retention)" },
      { type: "improvement", text: "Dashboard player filter now persists to localStorage and auto-selects your username on first visit" },
      { type: "improvement", text: "Drill button cards replaced plain text buttons — each drill option is now a styled card with icon + description" },
      { type: "improvement", text: "Free user opening move cap raised from 15 to 30 moves" },
      { type: "improvement", text: "Endgame categories expanded — \"Minor Piece\" replaced with specific types: Knight vs Bishop, Bishop vs Knight, Two Bishops, Two Knights, Bishop + Knight, Knight vs Knight, Bishop vs Bishop" },
      { type: "improvement", text: "\"Other\" endgame category replaced with Queen + Rook, Queen + Minor, Rook + Bishop, Rook + Knight, and Complex — every endgame now gets a meaningful label" },
      { type: "improvement", text: "Endgame cards now show a contextual coaching tip specific to each endgame type (e.g. Lucena/Philidor for rook endings, opposition for pawn endings)" },
      { type: "improvement", text: "Endgame overview adds Mistake Rate, Worst Blunder, and Failed Conversions stats plus detailed advice for your weakest endgame type" },
      { type: "improvement", text: "Tactics overview now shows Total Eval Lost, Worst Miss, Time Pressure correlation, and a diagnostic coaching insight" },
      { type: "improvement", text: "Tactic cards now show contextual tips based on the mistake type — CCT checklist, time pressure advice, pin/skewer awareness, and more" },
      { type: "fix", text: "Study plan now generates correctly even when a duplicate report is saved" },
      { type: "fix", text: "Tactical Eye radar dimension no longer shows NaN when no tactics are found" },
    ],
  },
  {
    version: 6,
    date: "Feb 26, 2026",
    title: "Feedback System + Admin Panel",
    description:
      "Users can now submit feedback directly from the app. Admin panel added for reviewing and managing submissions.",
    changes: [
      { type: "feature", text: "New /feedback page with category picker (Bug, Feature Request, Question, Other) and message form" },
      { type: "feature", text: "Admin-only feedback viewer at /admin/feedback with status management (New → Read → Resolved)" },
      { type: "improvement", text: "Feedback link added to navbar, profile dropdown, and mobile menu" },
      { type: "improvement", text: "Admin users see an Admin Panel link in the profile dropdown" },
    ],
  },
  {
    version: 5,
    date: "Feb 26, 2026",
    title: "Deep Analysis Cards Redesign",
    description:
      "The expanded insight cards got a complete visual overhaul — each section is now its own card with better hierarchy, and every dimension shows your personal key stat at the top.",
    changes: [
      { type: "design", text: "Detailed Analysis and What This Means are now separate bordered cards with emoji icons (🔍 / 💡)" },
      { type: "design", text: "Study Plan steps are individual cards — step 1 gets an accent gradient border to highlight priority" },
      { type: "feature", text: "Key Stat pill at the top of each expanded card shows your personal metric at a glance" },
      { type: "improvement", text: "Quick Tip renamed to Quick Win with ⚡ icon — styled as an accent-colored action card" },
    ],
  },
  {
    version: 4,
    date: "Feb 26, 2026",
    title: "Save Report CTA + Dashboard Incentive",
    description:
      "Big call-to-action card at the end of every report to save results to your dashboard and track improvement over time.",
    changes: [
      { type: "feature", text: "New gradient CTA card after the report with progress tracking pitch and feature pills" },
      { type: "feature", text: "Card shows contextual copy for signed-in vs anonymous users" },
      { type: "improvement", text: "After saving, the card swaps to a confirmation state with a View Dashboard link" },
    ],
  },
  {
    version: 3,
    date: "Feb 26, 2026",
    title: "Magic Link Sign-in & Lifetime Plan",
    description:
      "You can now sign in with just your email — no password needed. Plus a new one-time Lifetime plan for founding members.",
    changes: [
      { type: "feature", text: "Email magic link sign-in via Resend — enter your email, click the link, you're in" },
      { type: "feature", text: "Lifetime Pro plan ($59 one-time) — full Pro features forever with no recurring fees" },
      { type: "improvement", text: "Pricing page redesigned with 3-column layout and launch pricing card" },
      { type: "improvement", text: "Account page shows Lifetime badge and \"Active forever\" status" },
      { type: "fix", text: "Lifetime users are now protected from accidental Stripe subscription downgrades" },
    ],
  },
  {
    version: 2,
    date: "Feb 26, 2026",
    title: "Promotion Codes & Free Tier Improvements",
    description:
      "Stripe checkout now supports promotion codes, and the free tier got more generous sample limits.",
    changes: [
      { type: "feature", text: "Promo code field now appears at Stripe checkout" },
      { type: "improvement", text: "Free tier now shows 10 sample tactics and 10 sample endgames per scan" },
    ],
  },
  {
    version: 1,
    date: "Feb 24, 2026",
    title: "Initial Release — Stop Making the Same Mistakes",
    description:
      "The first public release of FireChess. Scan hundreds of your Lichess or Chess.com games and discover the patterns holding you back — all powered by Stockfish 18 running privately in your browser.",
    changes: [
      { type: "feature", text: "Opening Leak Detection — find repeated positions where you consistently play the wrong move, with drill mode to practice the correct lines" },
      { type: "feature", text: "Missed Tactics Scanner — surface forks, pins, skewers, and combinations you overlooked across your games, with motif tagging" },
      { type: "feature", text: "Endgame Mistake Scanner — catch losing moves in rook, pawn, and minor piece endgames with position-by-position breakdowns" },
      { type: "feature", text: "Strengths & Weaknesses Radar — six-dimension profile (Accuracy, Opening Prep, Tactical Eye, Composure, Time Mgmt, Resilience) with tiered insight cards" },
      { type: "feature", text: "Report Card — letter grades (S/A/B/C/D/F) for overall accuracy with estimated rating, centipawn loss, and severe leak rate" },
      { type: "feature", text: "Mental Game Stats — composure score, tilt detection, post-loss performance tracking, and player archetype classification" },
      { type: "feature", text: "Interactive Drill Mode — practice your opening leaks with a real board, move-by-move hints, and sound effects" },
      { type: "feature", text: "Opening Explorer integration — every mistake card links to the Lichess opening database for that position" },
      { type: "feature", text: "Move Explanations — see Best Move, Your Move, and Database Move with plain-English reasoning for each flagged position" },
      { type: "feature", text: "Eval Bar — real-time engine evaluation bar on every interactive board" },
      { type: "feature", text: "Scan Modes — choose between Openings, Tactics, Endgames, or scan everything at once" },
      { type: "feature", text: "Dashboard — save reports and track your progress over time with comparison charts" },
      { type: "feature", text: "Lichess + Chess.com support — works with both platforms, fetches games from public APIs" },
      { type: "feature", text: "Stockfish 18 WASM — all analysis runs client-side in your browser via WebAssembly, no data sent to servers" },
      { type: "feature", text: "Multi-worker scanning — parallel Stockfish workers for faster analysis (auto-scales to device cores)" },
      { type: "feature", text: "Google + Lichess OAuth sign-in — authenticate with your existing accounts" },
      { type: "feature", text: "Free + Pro tiers with Stripe billing — free tier for up to 300 games, Pro for up to 5,000 with deeper analysis" },
    ],
  },
];
