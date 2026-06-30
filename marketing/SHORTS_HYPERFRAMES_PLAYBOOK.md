# FireChess Shorts — Hyperframes Playbook

> Operating manual for generating short-form chess videos (YouTube Shorts / TikTok / Reels) that drive **branded search**, not link clicks. Written for Claude to execute: when the user says *"make a roast short about X"* or *"stat-bomb short on Y,"* follow this file.

---

## 0. The one rule that changes everything

**Shorts do not convert via links. They convert via memory → branded search.**

A viewer will *never* click the side-link. They *will* Google "firechess" three hours later if the video made them feel something and the name stuck. So every short is optimized for **one job: make the viewer want FireChess pointed at their *own* games**, and burn the name in. We measure success in **GSC branded-impression lift**, not click-throughs.

Consequence: the **product's output must be on screen as the payoff.** No generic puzzle with a logo in the corner. The FireChess roast / scan / Elo-guess *is the content.*

---

## 1. Format spec (every short)

| Field | Value |
| --- | --- |
| Aspect | 9:16 vertical, 1080×1920 |
| Length | 15–34s (sweet spot 22s). Shorter = higher completion = more reach. |
| Safe zone | Keep text/key visuals within center 1080×1420. Bottom 320px = UI/caption clutter on TikTok; top 220px = profile. |
| Caption style | Big, bold, 2–5 words per beat, high-contrast white with dark stroke. Word-by-word "karaoke" pop. |
| Pacing | A visual change **every 1.2–2.0s**. No static shot longer than 2s before move 3. |
| Audio | Trending sound OR punchy VO. First 0.5s must have an audio hook (whip/impact) synced to the visual. |
| Brand burn | FireChess wordmark visible in ≥3 frames, always on the final frame + spoken once in VO. |
| End card | Last 2s: the result + "FireChess" + a *curiosity* line ("scan yours — link in bio"). The link is a formality; the curiosity is the point. |

### What a "hyperframe" is
One full-screen 9:16 designed moment. I generate a short as an **ordered list of hyperframes**, each with these fields:

```
- id:         f1
  duration:   0.0–1.4s
  bg:         dark gradient / board / roast-card
  headline:   the big on-screen text (the HOOK on f1)
  subtext:    secondary line (optional)
  visual:     board FEN / eval bar / roast output / number counter
  caption:    spoken/karaoke words for this beat
  beat:       audio cue (impact, whoosh, ding, silence)
  transition: cut / whip / zoom-punch
```

**Delivery:** I render the sequence as an auto-playing **9:16 HTML widget** (via the visualize tool) that you screen-record at full height — or as **static SVG frames** you drop into CapCut and add your own VO. Default to the animated widget unless you ask for frames.

---

## 2. The viral framework

### 2.1 The hook (frame 1 — you live or die here)
You have **~0.8 seconds.** The first frame must do ONE of these, with text on screen *before* the first word is spoken:

- **Stakes + curiosity:** "This move loses at EVERY rating."
- **Callout / mild conflict:** "This 700 thinks they're winning."
- **Impossible claim:** "I analyzed 1.5 million games to find this."
- **Personal threat (the strongest for tools):** "You blunder every 8 moves. Watch."
- **Number shock:** "97% of players get this wrong."

Hook rules: no slow intro, no "hey guys," no logo-first. Open ON the payoff or the question. Put the single most shocking word *first*.

### 2.2 Retention (frames 2–N)
- **Open loop immediately:** pose the question on f1, *delay the answer* to the last frames.
- **Pattern interrupts** every ~2s: zoom-punch, color flash, the eval bar swinging, a number ticking up.
- **Re-hook at ~60% mark** (the "second hook") so swipe-aways drop: "but here's the part nobody expects…"
- **No dead air.** Every frame advances the loop or escalates.

### 2.3 The payoff + brand burn (final 3 frames)
- Resolve the loop (the answer / the roast verdict / the real Elo).
- Show **FireChess output** as the resolver — the verdict came *from the tool*.
- Final frame: wordmark + "Scan your games free" + a curiosity tag. Spoken name once.

### 2.4 CTA that drives branded search (not clicks)
Never say "click the link." Say things that trigger *self-directed search*:
- "Find your worst move — it's free, just search FireChess."
- "I'm not telling you your rating. The tool will."
- "Try it on your own games. You won't like what it finds."

---

## 3. The three short templates

### TEMPLATE A — The Roast (highest conversion)
*Why it works: the viewer instantly wants it aimed at themselves. Conflict + humor + personal relevance.*

**Hook bank (frame 1):**
- "I let an AI roast a 700's chess. It was brutal."
- "This player has a 71% blunder rate. Let's read the autopsy."
- "Asked AI to roast my chess. I have not recovered."

**Storyboard (8 hyperframes, ~24s):**
1. `0–1.2s` — HOOK text full-screen over a blurred messy board. *"I let AI roast this 800."* | beat: impact
2. `1.2–3s` — The board, one obvious blunder highlighted in red, eval bar tanks. *"Move 11. Hung the queen."* | zoom-punch
3. `3–6s` — **FireChess roast card on screen**, the savage line typing out. VO reads it. | ding
4. `6–9s` — Stat strip from the scan: blunders / accuracy / "most repeated leak." Numbers tick up. | whoosh
5. `9–13s` — Second-hook: *"But here's the part that hurts…"* → the *recurring* leak ("you lose this exact way 5x"). | silence→impact
6. `13–18s` — The fix in one line (the tool's advice). | cut
7. `18–21s` — *"It does this for YOUR games."* mock scan of "your username". | zoom
8. `21–24s` — End card: roast verdict + **FireChess** + "Scan yours free — search FireChess." | outro hit

### TEMPLATE B — Guess the Elo
*Why it works: proven viral chess format; the comment section argues = engagement = reach.*

**Hook bank:**
- "97% guess this player's rating wrong."
- "One of these moves is 2200. One is 800. Same position."
- "Guess the Elo — but the AI already knows."

**Storyboard (7 hyperframes, ~20s):**
1. HOOK + "Guess the Elo 👇" over a live position. | impact
2. Play 2–3 moves of the game, fast. *"Watch how they handle this."* | per-move ding
3. The telling move (good or terrible). Freeze + arrow. *"This tells you everything."* | zoom-punch
4. "Comment your guess NOW" — countdown 3-2-1 bar. (drives comments = algo) | tick
5. Second-hook: *"Most people are 400 points off."* | silence
6. Reveal the real Elo big + **FireChess "Guess the Elo" UI** as the source. | reveal hit
7. End card: *"Play Guess the Elo free — search FireChess."* | outro

### TEMPLATE C — Stat Bomb (use the 1.5M-game data)
*Why it works: counterintuitive truth = authority + shareability. Doubles as promo for the blog posts.*

**Real, sourced hooks (all from `scripts/chess-stats/out/`):**
- "The 3rd most popular opening on Lichess secretly loses for White at EVERY rating." (Van't Kruijs / 1.e3)
- "You blunder every 8 moves. A master? Every 19. I counted 60,000 games."
- "Draws are basically extinct under 2000. Here's what that means for you."
- "Below 1000, the Caro-Kann destroys White. The data is brutal."

**Storyboard (7 hyperframes, ~22s):**
1. HOOK: the shocking claim, full-screen, number first. *"This move loses at every rating."* | impact
2. *"I analyzed 1.5 million games to be sure."* — flash the dataset/animated counter. | whoosh
3. The move/opening on a board, labeled. *"It's 1.e3. The Van't Kruijs."* | zoom
4. **The chart** (heatmap/bars from the blog post) animates in, the losing row glowing red. | reveal
5. Second-hook: *"And almost nobody realizes they're playing it."* | silence
6. The takeaway / fix in one line. | cut
7. End card: *"Full breakdown + scan your openings free — search FireChess."* (points to the blog post too) | outro

---

## 4. Hook library (steal these)

Personal-threat (best for a tool):
- "You blunder every 8 moves. Want proof?"
- "Your opening is leaking 200 rating points. Watch."
- "I know your worst move and we haven't met."

Number-shock:
- "1.5 million games. One move that always loses."
- "97% of players get this wrong."
- "11.9 vs 5.1 — the only stat that explains your rating."

Conflict/callout:
- "This 700 thinks they're cooking. They are not."
- "Comment your rating before this move. You'll be wrong."

Curiosity-gap:
- "The most popular opening on Lichess is a trap."
- "There's a move so bad even masters lose with it."

---

## 5. Production checklist (before posting)
- [ ] First frame readable & shocking with sound OFF (most viewers start muted).
- [ ] Hook word #1 is the most surprising word.
- [ ] A visual change every <2s; nothing static >2s pre-payoff.
- [ ] Open loop on f1, resolved only in final 3 frames.
- [ ] Second-hook placed at ~60%.
- [ ] FireChess output is the payoff (not a corner logo).
- [ ] Brand name spoken once + on final frame.
- [ ] CTA triggers *search*, not click.
- [ ] Any stat shown is real and traceable to `scripts/chess-stats/out/` or a live scan. **Never fabricate numbers.**
- [ ] Caption file (.srt) or burned karaoke captions included.
- [ ] 3–5 hashtags: #chess #chesstok #guesstheelo + the topic.

---

## 6. How to ask Claude to make one

Say e.g.:
- *"Make a roast short — input: a 900-rated Scandinavian player who hangs the queen on move 9."*
- *"Stat-bomb short on the Van't Kruijs finding."*
- *"Guess-the-Elo short from this PGN: [paste]."*

I will output the ordered hyperframes (rendered as a 9:16 animated widget by default, or static SVG frames on request), a tight VO script with timestamps, an on-screen caption track, and the hashtags. Then you record/stitch and post.

**Cadence to actually move branded search:** 3–5 shorts/week, same format repeated (consistency > variety for the algorithm and for name recall). Track GSC "firechess" impressions weekly — that's the scoreboard.
