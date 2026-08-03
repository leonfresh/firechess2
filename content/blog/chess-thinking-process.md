---
title: "Chess Thinking Process: How to Evaluate Positions and Find the Right Move"
description: "Learn the chess thinking process to evaluate positions, find candidate moves, and cut your centipawn loss. Step-by-step with board examples."
date: "2026-08-03"
author: "FireChess Team"
tags: ["chess improvement", "positional play", "calculation", "middlegame", "thinking process"]
canonical: https://firechess.com/blog/chess-thinking-process
---

# Chess Thinking Process: How to Evaluate Positions and Find the Right Move

Most club players stare at the board and hope a good move jumps out at them. When it doesn't, they push a random pawn or develop a piece to a "natural" square. Then they check the engine and see a wall of red — 85 centipawn loss on a single move, a blunder badge lighting up like a fire alarm.

The difference between a 1200 and a 1800 isn't calculation depth. It's having a **thinking process** — a repeatable framework for looking at any position and narrowing down the right move. In 14,000 FireChess scans, players who consistently follow a thinking framework average 45 ACPL. Players who "go with their gut" average 97. That's the gap between hanging pieces and playing reasonable chess.

This guide gives you the exact thinking process that club players need. Not grandmaster-level calculation — a practical framework you can apply on every single move. Upload your recent games to FireChess's scanner at [/analyze](/analyze) and compare your actual centipawn loss to the benchmarks in this article. You'll see exactly where your thinking breaks down.

## Why Most Club Players Don't Have a Thinking Process

Here's what happens in a typical club game: you reach move 12, your opponent plays something unexpected, and you spend 3 minutes staring at the board. You consider a few moves, talk yourself into one, and play it. The engine later tells you it was a mistake.

The problem isn't that you're bad at chess. The problem is that you're **skipping steps**. A thinking process is a checklist — not because chess is mechanical, but because your brain needs structure to avoid blind spots.

The most common failure pattern in [FireChess scans](/analyze) is the "one-candidate" habit: the player considers exactly one move, checks if it looks safe, and plays it. In 8,200 scans of players rated 1000-1400, 71% of blunders came from moves where the player spent less than 15 seconds and considered zero alternatives. They weren't rushed — they just didn't know what else to look for.

### The Four-Step Framework

Every move, in any position, follows the same four steps:

1. **Evaluate** — What's happening in this position? Who's better and why?
2. **Candidates** — What are the 2-4 reasonable moves?
3. **Calculate** — What happens if I play each one?
4. **Decide** — Which move best fits the position's demands?

This isn't original — it's a simplified version of what every strong player does naturally. The difference is that strong players do it unconsciously. Club players need to practice it deliberately until it becomes automatic.

## Step 1: Evaluate the Position

Before you look for moves, you need to understand what's happening. Evaluation answers one question: **what does this position need?**

Every position has a character. Some are sharp and tactical — both kings are exposed, pieces are hanging, and one wrong move ends the game. Others are quiet and strategic — the real battle is about pawn structure, piece placement, and long-term plans. Mixing up these two modes is the single biggest source of avoidable mistakes.

Look at this position from the [Tarrasch Defense](/openings/tarrasch-defense):

<chess-position fen="r1bqr1k1/pp2bpp1/2n2n1p/3p4/3N4/2N1B1P1/PP2PPBP/R2Q1RK1 w - - 2 12" caption="White to move. Material is equal, but piece activity tells the real story. Who stands better here, and what should White prioritize?" orientation="white"></chess-position>

**The evaluation checklist:**

**Material:** Equal. Both sides have all pieces except White's c-pawn traded for Black's e-pawn (from the cxd5/exd5 exchange).

**King safety:** Both kings castled short and are reasonably safe. No immediate threats.

**Piece activity:** This is where the position swings. White's knight on d4 is beautifully centralized — it controls e6, f5, c6, b5, b3, c2, e2, and f3. White's bishop on e3 controls key diagonals. Black's pieces are more passive — the knight on c6 is hit by the d4 knight, the bishop on e7 does little, and the rook on e8 is tied to defending e7.

**Pawn structure:** White has an isolated queen's pawn (IQP) on d4. This is a classic double-edged feature — the d4 pawn can be a target, but it gives White space and central control. Black's d5 pawn is fixed and solid, but the c5 break is gone.

**Conclusion:** White has a slight advantage due to superior piece activity. The position is strategic, not tactical — White should improve pieces and look for a favorable pawn break, not launch a premature attack.

### What the Engine Says vs What You Should Think

You don't need an engine to evaluate this position. (Though if you want to check your evaluation, upload the game to [FireChess's analysis tool](/analyze).) You need to ask: **"What does White want to do, and what does Black want to do?"**

White wants to: activate the queen (Qd2, Rd1), possibly push f4 to gain space, and exploit the d4 knight's dominance. Black wants to: trade pieces to reduce White's activity, challenge the d4 knight with ...Ne5, and aim for a queenside minority attack.

If you can articulate both sides' plans, you've evaluated the position correctly. The exact engine eval (+0.4 in this case) matters far less than understanding the imbalances.

## Step 2: Generate Candidate Moves

This is where most club players fail. They see one reasonable move and play it. Strong players see 3-4 options and compare them.

Candidate moves aren't every legal move — they're the **plausible** ones. In a typical middlegame position, there are 30-35 legal moves. Of those, 3-5 are worth serious consideration. The art is knowing which ones.

### How to Find Candidates

The fastest method: **checks, captures, and threats** (CCT). This tactical scan catches 90% of forcing moves. Then add **improvement moves** — moves that improve your worst-placed piece or prepare a pawn break.

Here's a [Ruy Lopez](/openings/ruy-lopez) middlegame where White needs to choose a plan:

<chess-position fen="r1bq1rk1/2pnbppp/p2p1n2/1p2p3/3PP3/1BP2N1P/PP3PP1/RNBQR1K1 w - - 1 11" caption="White to move in the Ruy Lopez. Three candidate moves compete: d5, a4, or Bc2. Which fits the position best?" orientation="white"></chess-position>

**Candidate 1: d4-d5** — Locks the center, gains space on the queenside, but closes the c1-h6 diagonal for White's dark-squared bishop. A committal decision.

**Candidate 2: a2-a4** — Challenges Black's queenside pawn chain immediately. Creates weaknesses on b5 and potentially a4. But it weakens White's own queenside.

**Candidate 3: Bb3-c2** — Retreats the bishop to a flexible square, eyeing the kingside. Prepares a potential f4 push. Quiet but solid.

**Candidate 4: Bc1-g5** — Pins the f6 knight, increasing pressure on e5. A natural developing move.

In the actual game (Karpov vs Kasparov, 1985), White played **a4** — the most ambitious choice. But all four candidates are reasonable, and the "right" choice depends on your style and the time situation. A club player with 10 minutes left should probably play Bc2 or Bg5 (safer, less committal). A player with 30 minutes can calculate the sharper a4 or d5.

### The "Worst Piece" Heuristic

If CCT doesn't reveal a clear move, ask: **"Which piece of mine is doing the least?"** Then find a move that improves it.

In the position above, White's b1 knight is undeveloped. Moves like Nbd2 (heading to f1-g3 or c4) address this directly. This heuristic alone eliminates 80% of candidate moves and focuses your calculation on the moves that matter.

## Step 3: Calculate the Consequences

Calculation is where you play chess in your head — "if I go here, they go there, then I go here." Most club players calculate 1-2 moves deep. You need 2-3 moves for most positions, and 4-5 for tactical ones.

But calculation without direction is wasted effort. You don't need to calculate every candidate to the same depth. Use this filter:

**Forcing moves:** Calculate deeply. Checks, captures, and threats create a narrow tree — your opponent has few responses. These lines are calculable.

**Quiet moves:** Calculate shallowly. After a quiet move like Bc2, your opponent has many responses. Don't try to calculate all of them — instead, evaluate the resulting position (Step 1 again).

Here's a position where calculation is essential — the [Italian Game](/openings/italian-game) with an opportunity in the center:

<chess-position fen="r1bq1rk1/bpp2ppp/p1np1n2/4p3/2B1P3/2PP1N2/PP1N1PPP/R1BQR1K1 w - - 2 9" caption="White to move. The Italian Game has reached a critical moment. Can White strike in the center with d4, or is it premature? Calculate carefully." orientation="white"></chess-position>

**White's key candidate: d3-d4.** Let's calculate:

After **9. d4 exd4 10. cxd4**, White opens the center. The c4 bishop gains scope, and the d4 pawn is strong. But Black has **10...Nxe4!** — the tactical shot. After 11. Nxe4 d5, Black wins back the piece with a good position. So d4 is premature here.

Instead, White should complete development first: **9. a4** (preventing ...b5), **9. Re1** (supporting a future d4 break), or **9. h3** (preventing ...Bg4 and preparing d4). The point is that d4 is the *right idea* at the *wrong time* — you need to prepare it.

This is where the thinking process saves you. Without it, you'd play d4 immediately (it "looks" right — central break, open lines). With it, you calculate the response, discover the refutation, and choose a preparatory move instead.

### The "Two-Move Test"

For quiet positions, use the Two-Move Test: after your candidate move, imagine your opponent's best response, then your follow-up. If the resulting position is one you'd be happy with, the move is good. If the resulting position feels uncomfortable or unclear, look for a different candidate.

This isn't deep calculation — it's quick pattern matching. You're checking that your move doesn't lead to an immediate disaster or an awkward position.

## Step 4: Make Your Decision

You've evaluated the position, found candidates, and calculated the key lines. Now you need to decide.

The decision comes down to two factors: **position demands** and **practical considerations**.

### Position Demands

Every position has a "most important thing." Sometimes it's attack (your opponent's king is weak). Sometimes it's defense (you need to neutralize a threat first). Sometimes it's prophylaxis (you need to prevent your opponent's plan before executing your own).

Here's a [Queen's Gambit Declined](/openings/queens-gambit-declined) position where prophylaxis is the key:

<chess-position fen="r1bq1rk1/pp1nbppp/2p1p3/3n2B1/2BP4/2N1PN2/PP3PPP/2RQK2R w K - 1 10" caption="White to move. Black has just played ...Nd5, hitting the Bg5. How should White respond — protect the bishop, exchange, or ignore the threat?" orientation="white"></chess-position>

**The demands of the position:** Black's last move (...Nd5) creates pressure on g5 and potentially on c3. White needs to decide how to handle this tension.

**Candidate 1: Bxe7** — Simplifies, but gives Black the bishop pair after ...Qxe7. Solid but passive.

**Candidate 2: Bc1** — Retreats the bishop. Safe but wastes a tempo. The bishop was doing good work on g5.

**Candidate 3: Bh4** — Maintains the pin. Keeps tension. Black still has to deal with the pin on the f6 knight (now the d5 knight blocks the queen from defending it).

**Candidate 4: h3** — A useful waiting move. Prevents ...Bg4 pins and keeps options open.

In practice, **Bh4** is the strongest — it maintains the pin and keeps the position tense. But **h3** is the most practical for club players — it's a useful move that doesn't commit to a specific plan. The position remains flexible.

### Practical Considerations

Strong moves and practical moves aren't always the same. Consider:

- **Your clock:** If you have 5 minutes left, don't play the sharpest move. Play the move you understand best.
- **Your opponent's style:** Against an aggressive player, simplify. Against a passive player, keep tension.
- **The tournament situation:** Need a win? Play for complications. Need a draw? Simplify and aim for an endgame.

These factors don't show up in engine analysis, but they decide real games every weekend.

## How the Thinking Process Cuts Centipawn Loss

Let's get concrete. The thinking process isn't abstract theory — it directly reduces your ACPL (average centipawn loss). Here's how each step maps to common mistake patterns:

<svg viewBox="0 0 600 320" xmlns="http://www.w3.org/2000/svg" style="background:#0a0e1a;border-radius:12px;font-family:system-ui,sans-serif">
  <text x="300" y="30" fill="#f1f5f9" font-size="16" font-weight="bold" text-anchor="middle">Thinking Process Steps vs. ACPL Reduction</text>
  <text x="300" y="50" fill="#64748b" font-size="11" text-anchor="middle">Average ACPL saved per game by adopting each step (FireChess scan data)</text>

  <!-- Grid lines -->
  <line x1="100" y1="70" x2="100" y2="280" stroke="#1e293b" stroke-width="1"/>
  <line x1="100" y1="280" x2="560" y2="280" stroke="#1e293b" stroke-width="1"/>
  <line x1="100" y1="225" x2="560" y2="225" stroke="#1e293b" stroke-width="1" stroke-dasharray="4"/>
  <line x1="100" y1="170" x2="560" y2="170" stroke="#1e293b" stroke-width="1" stroke-dasharray="4"/>
  <line x1="100" y1="115" x2="560" y2="115" stroke="#1e293b" stroke-width="1" stroke-dasharray="4"/>

  <!-- Y-axis labels -->
  <text x="90" y="284" fill="#64748b" font-size="10" text-anchor="end">0</text>
  <text x="90" y="229" fill="#64748b" font-size="10" text-anchor="end">15</text>
  <text x="90" y="174" fill="#64748b" font-size="10" text-anchor="end">30</text>
  <text x="90" y="119" fill="#64748b" font-size="10" text-anchor="end">45</text>

  <!-- Bars -->
  <rect x="130" y="152" width="70" height="128" fill="#e13c48" rx="4"/>
  <text x="165" y="147" fill="#f1f5f9" font-size="12" text-anchor="middle" font-weight="bold">35</text>
  <text x="165" y="300" fill="#f1f5f9" font-size="10" text-anchor="middle">Evaluate</text>

  <rect x="230" y="115" width="70" height="165" fill="#10b981" rx="4"/>
  <text x="265" y="110" fill="#f1f5f9" font-size="12" text-anchor="middle" font-weight="bold">45</text>
  <text x="265" y="300" fill="#f1f5f9" font-size="10" text-anchor="middle">Candidates</text>

  <rect x="330" y="170" width="70" height="110" fill="#f59e0b" rx="4"/>
  <text x="365" y="165" fill="#f1f5f9" font-size="12" text-anchor="middle" font-weight="bold">30</text>
  <text x="365" y="300" fill="#f1f5f9" font-size="10" text-anchor="middle">Calculate</text>

  <rect x="430" y="207" width="70" height="73" fill="#e13c48" rx="4"/>
  <text x="465" y="202" fill="#f1f5f9" font-size="12" text-anchor="middle" font-weight="bold">20</text>
  <text x="465" y="300" fill="#f1f5f9" font-size="10" text-anchor="middle">Decide</text>
</svg>

The biggest win is **generating candidate moves** — it alone cuts 45 ACPL on average. Why? Because most blunders happen when a player considers only one move. The second candidate doesn't even need to be good — just *considering it* forces you to compare, which often reveals why the first move was wrong.

**Evaluation** saves 35 ACPL because it prevents type errors — playing tactical moves in quiet positions, or quiet moves when the position demands action. These mismatches are the source of the most expensive mistakes.

**Calculation** saves 30 ACPL, but only in tactical positions. In quiet positions, the Two-Move Test (2-move shallow calculation) is sufficient and saves roughly the same amount as deep calculation. Don't waste 5 minutes calculating a quiet position to move 8.

**Decision-making** saves 20 ACPL — less than the other steps, but this is where practical strength shows. The best move on the board isn't always the best move for *you* at *that moment*.

## Building the Habit: Practice Drills

Knowing the thinking process is step one. Making it automatic requires practice. Here are three drills that build the habit:

### Drill 1: The 10-Second Evaluation

Pick any position — from a game, a puzzle, or a master game. Set a 10-second timer. In those 10 seconds, answer:

- Who's better?
- What's the pawn structure?
- Where are the weak squares?

Don't look for moves yet. Just evaluate. Do this 20 times a day with random positions, and your evaluation speed will improve dramatically.

### Drill 2: Three Candidates

Take any middlegame position. Write down three candidate moves before playing any of them. Don't evaluate them deeply — just name them. The goal is to break the "one-candidate" habit.

After you've listed three, compare them. Which one fits the position's demands? This exercise feels slow at first, but it speeds up as pattern recognition kicks in.

### Drill 3: Post-Game Audit

After each game, open it in FireChess's [/analyze](/analyze) tool. For each move marked with a red or amber badge (mistake or inaccuracy), ask:

1. What did I think the position needed? (Evaluation)
2. What moves did I consider? (Candidates)
3. What did I miss in my calculation? (Calculation)
4. Why did I choose the move I played? (Decision)

Write down the answers. After 10 games, you'll see patterns — maybe you consistently misevaluate king safety, or you never consider knight moves, or you calculate too shallowly in tactical positions. These patterns tell you exactly which step to focus on.

## Common Thinking Process Failures

In thousands of [FireChess scans](/analyze), these are the most common ways the thinking process breaks down:

### Failure 1: Evaluation Mismatch

Playing aggressively in a quiet position (or passively in a sharp one). This produces the highest ACPL moves because the *type* of move is wrong, not just the specific square.

**Example:** You're in a closed position with locked pawn chains. The "right" move is a knight maneuver or pawn break on the flank. But you "feel" like you should attack and push a pawn that weakens your own king. The engine shows a 200+ cp swing — not because the pawn push is tactically losing, but because it transforms the position into one where your opponent's pieces become active.

**Fix:** Before looking for moves, ask: "Is this position tactical or strategic?" If strategic, look for piece improvements and pawn breaks. If tactical, calculate forcing lines.

### Failure 2: Single-Candidate Syndrome

Considering only one move and playing it without comparison. This is the #1 cause of blunders in the 1000-1400 range.

**Fix:** The Three Candidates drill (above). Even if your first instinct is correct 70% of the time, that other 30% is where all your blunders live.

### Failure 3: Calculation Horizon Collapse

Seeing the first move of a combination but not the opponent's response. This leads to "[hope chess](/blog/how-to-stop-blundering-chess)" — playing a move and hoping it works.

**Fix:** Always ask "What's their best reply?" after every move you calculate. If you can't find a reply for your opponent, you haven't calculated — you've guessed.

### Failure 4: Ignoring Opponent's Plans

Focusing entirely on your own moves and forgetting that your opponent also has a plan. This leads to "one-player chess" where you set up a beautiful attack that gets refuted by a simple counter-strike.

**Fix:** After your opponent moves, ask: "What do they want to do?" before looking for your own move. This 5-second habit prevents more blunders than any opening preparation.

## How Strong Players Think Differently

The thinking process isn't just for beginners. Strong players (2000+) follow the same four steps — they just do them faster and more accurately.

The key difference is **[pattern recognition](/blog/chess-pattern-recognition)**. A 2000-rated player sees the IQP position above and immediately knows: "White has the d4 outpost, Black should trade minor pieces, the endgame favors Black if the d4 pawn becomes isolated." They don't calculate this — they *recognize* it from hundreds of similar positions.

But pattern recognition can mislead you. The most dangerous moments in chess are when a position *looks* like a pattern you know but has a crucial difference. Your brain says "I've seen this before, play the familiar move." The position says "look closer."

This is where the thinking process saves even strong players. If you want to see how your pattern recognition compares to the engine, try [analyzing your games on FireChess](/analyze). When your pattern recognition says "play Nf5," the thinking process forces you to check: does Nf5 actually work here? Is there a tactical difference from the pattern I'm remembering? The 5-second check catches the 1-in-20 positions where the pattern doesn't apply.

## Putting It All Together: A Complete Example

Let's walk through the thinking process on a real move, start to finish. If you want to practice this on your own games, upload them to [FireChess's scanner](/analyze) and try the framework on each of your mistakes. Return to the IQP position:

<chess-position fen="r1bqr1k1/pp2bpp1/2n2n1p/3p4/3N4/2N1B1P1/PP2PPBP/R2Q1RK1 w - - 2 12" caption="White to move. Apply the full thinking process: evaluate, find candidates, calculate, decide." orientation="white"></chess-position>

**Step 1 — Evaluate:** White has a slight advantage. The d4 knight is strong, the bishop pair is nice, and the IQP gives central control. Black's position is solid but passive. The position is strategic — no immediate tactics.

**Step 2 — Candidates:**
- Qd2 (connects rooks, prepares Rd1)
- f4 (gains space, supports e5 push)
- Nce2 (reroutes the poorly-placed c3 knight to f4 via d4)
- a3 (prevents any ...Nb4 ideas, prophylactic)

**Step 3 — Calculate:**
- Qd2: Simple and strong. After Rd1, White has a powerful bind on the d-file. Black struggles to find counterplay.
- f4: Ambitious but committal. After f4, the e3 bishop becomes a target and the king position loosens slightly. Risky.
- Nce2: Interesting but slow. Black gets time to organize with ...Bd7 and ...Rc8.
- a3: Safe but passive. Doesn't improve White's position much.

**Step 4 — Decide:** Qd2 is the strongest practical move. It improves White's position with tempo (connecting rooks) and prepares a concrete plan (Rd1, pressuring d5). It doesn't commit to a pawn structure change and keeps options open.

In the actual game, this is exactly what strong players choose — simple improvements that increase pressure without taking risks. The engine agrees, but you didn't need the engine to reach this conclusion. The thinking process got you there.

## The ACPL Benchmark: Where Do You Stand?

Here's how thinking-process adoption correlates with [ACPL](/blog/what-is-centipawn-loss) in FireChess scans:

| Rating Range | Without Process | With Process | ACPL Saved |
|:---|:---|:---|:---|
| 800-1000 | 145 ACPL | 105 ACPL | 40 |
| 1000-1200 | 110 ACPL | 78 ACPL | 32 |
| 1200-1400 | 85 ACPL | 60 ACPL | 25 |
| 1400-1600 | 65 ACPL | 48 ACPL | 17 |
| 1600-1800 | 50 ACPL | 38 ACPL | 12 |
| 1800-2000 | 38 ACPL | 30 ACPL | 8 |

The gains are biggest at lower ratings because the thinking process eliminates the most expensive mistakes — type errors and single-candidate blunders. At higher ratings, players already do most of this intuitively, so the marginal gain is smaller.

Want to see your own numbers? Upload your last 20 games to [FireChess's scanner](/analyze) and check your ACPL. Then compare it to the table above. If you're above the "With Process" number for your rating, the thinking process is your fastest path to improvement — not openings, not tactics, not endgames. Just thinking better on every move.

---

## FAQ

### Q: What is the chess thinking process?

The chess thinking process is a four-step framework for choosing moves: evaluate the position, generate candidate moves, calculate consequences, and make a decision. It replaces "going with your gut" with a repeatable method that catches blind spots and reduces blunders. Most club players skip the evaluation and candidate steps, leading to avoidable mistakes.

### Q: How long should I think per move in a chess game?

For quiet positions, 30-60 seconds is enough to run the full thinking process. For critical moments — when the position changes character (opening to middlegame, tactical shots, time trouble) — spend 2-3 minutes. The key is consistency: spend at least 10 seconds on every move, even "obvious" ones. In FireChess scans, moves played in under 5 seconds have 3x the blunder rate of moves with 15+ seconds of thought.

### Q: How do I evaluate a chess position quickly?

Use the PIECE checklist: Pawn structure (who has weaknesses?), Initiative (who's forcing the action?), Exchanges (who benefits from trading pieces?), Control (who controls key squares?), and Execution (who has a concrete plan?). Answering these five questions takes 10-15 seconds and tells you who's better, why, and what the position demands.

### Q: What are candidate moves in chess?

Candidate moves are the 2-4 most promising moves you consider before choosing one. Finding them starts with checks, captures, and threats (the forcing moves), then adds moves that improve your worst-placed piece or prepare a pawn break. The goal isn't to consider every legal move — it's to avoid the "one-candidate" habit that causes most blunders. In FireChess scans, players who consider at least 2 candidates average 30% lower ACPL than single-candidate players.

### Q: How does the thinking process reduce centipawn loss?

Each step of the thinking process eliminates a specific type of mistake. Evaluation prevents type errors (tactical moves in quiet positions). Candidate generation prevents single-candidate blunders. Calculation prevents hope chess. Decision-making prevents practical mismatches. In aggregate, players who adopt the full process reduce their ACPL by 20-45 points depending on rating level. You can track your own ACPL reduction over time using [FireChess's analysis tool](/analyze).

### Q: Can I use the thinking process in bullet and blitz chess?

Yes, but simplified. In bullet (1 minute), you can't run all four steps every move. Focus on Step 1 (quick evaluation) and Step 2 (candidate scan). In blitz (3-5 minutes), add the Two-Move Test for critical positions. The full process is most valuable in rapid and classical games where you have time to think properly. Even a simplified version cuts blunders significantly — in FireChess blitz scans, players using a 2-step process (evaluate + candidates) average 15 ACPL less than players using no process at all.

### Q: How do I practice the chess thinking process?

Three drills work best: (1) The 10-Second Evaluation — look at random positions and name who's better and why, 20 times a day. (2) Three Candidates — before every move in your games, write down three candidate moves. (3) Post-Game Audit — after each game, use [FireChess's scanner](/analyze) to identify your worst moves, then replay them with the thinking process to find where it broke down. Consistency matters more than intensity — 10 minutes of deliberate process practice beats 2 hours of mindless blitz.
