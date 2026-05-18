# Puzzle Tutor Mode — Implementation Plan

An interactive chess puzzle experience narrated by a VRM avatar girl ("girlfriend coach") with voice, lip sync, and cute gestures. No LLM required — template-based commentary driven by puzzle theme tags and Stockfish analysis.

---

## Overview

A new mode toggled from the puzzles page. Instead of solving silently, the avatar:

1. Introduces the position with visual hints (no spoiler)
2. Gives you thinking time
3. Walks through each correct move with explanation
4. Asks about one tempting-but-wrong move per position
5. Covers the most important opponent deviation

---

## Tech Stack (what we're porting/adding)

| What                 | Source                                                      | Notes                              |
| -------------------- | ----------------------------------------------------------- | ---------------------------------- |
| VRM rendering        | `shorts-gen/app/chess-long/_components/VrmAvatarCanvas.tsx` | Port to firechess2                 |
| VRM models           | `shorts-gen/public/vrm/cherry_rose.vrm` or `miu.vrm`        | Copy to `firechess2/public/vrm/`   |
| Three.js + pixiv-vrm | shorts-gen deps                                             | Add to firechess2 package.json     |
| Lip sync             | shorts-gen viseme system                                    | Adapt for real-time (not Remotion) |
| EdgeTTS              | `shorts-gen/lib/tts-edge.ts`                                | New API route in firechess2        |
| Stockfish            | Already in firechess2                                       | `lib/stockfish-client.ts`          |
| Puzzle data          | Already in firechess2                                       | Turso DB with themes tags          |

---

## Phase 1 — VRM Avatar Component

### 1.1 Dependencies

Add to firechess2 `package.json`:

```
@pixiv/three-vrm ^3.5.2
@pixiv/three-vrm-animation ^3.5.2
@react-three/fiber ^9.6.1
@react-three/drei ^10.7.7
three ^0.184.0
msedge-tts ^2.0.5
```

### 1.2 Files to create

- `components/puzzle-avatar/PuzzleAvatar.tsx` — main avatar canvas component
- `components/puzzle-avatar/useVrmLoader.ts` — VRM model loading hook
- `components/puzzle-avatar/useLipSync.ts` — real-time viseme animation hook
- `components/puzzle-avatar/useGestures.ts` — procedural gesture controller
- `components/puzzle-avatar/vrm-expressions.ts` — viseme constants + expression helpers

### 1.3 Model files

Copy to `firechess2/public/vrm/`:

- `cherry_rose.vrm` (or miu.vrm — pick the cuter one for girlfriend vibe)

### 1.4 Rendering approach

- React Three Fiber canvas (not Remotion — this is real-time interactive)
- Transparent background so it overlays the puzzle board
- Camera: `upper_body` shot, fixed (no orbit for interactive use)
- Size: roughly 280×400px panel to the side of or above the board

---

## Phase 2 — Speech + Lip Sync

### 2.1 EdgeTTS API Route

**File**: `app/api/puzzle-speech/route.ts`

```
POST /api/puzzle-speech
Body: { text: string, voice?: string }
Returns: { audioBase64: string, wordTimings: WordTiming[] }
```

Voice: `en-US-AvaNeural` (EdgeTTS — no API key needed via msedge-tts)

Word timing estimation (no Whisper needed for interactive mode):

- Total audio duration estimated from char count (~150 chars/sec average for Ava)
- Each word gets `startTime = elapsed / totalDuration` based on char offsets
- Pauses added at punctuation (comma +0.15s, period/question +0.3s)
- Good enough for lip sync — doesn't need frame-perfect accuracy

### 2.2 Real-time Lip Sync (`useLipSync.ts`)

```typescript
// On each animation frame while audio plays:
// 1. Get currentTime from HTMLAudioElement
// 2. Find active word from wordTimings[]
// 3. Compute wordProgress (0-1) within word duration
// 4. Pick viseme via hash(wordIndex) from pool [aa×5, oh×3, ih×2]
// 5. Apply: mouthAmount = 0.42 + 0.38 * sin(wordProgress * π)
// 6. Zero all other visemes, set active one
```

Audio plays from base64 blob URL. No streaming — generate full clip, then play.

---

## Phase 3 — Gesture System (Cute Procedural Gestures)

No `.vrma` dance files needed — gestures are procedural via VRM humanoid bone access.

### 3.1 Gesture Types

| Gesture      | Description                                 | When used            |
| ------------ | ------------------------------------------- | -------------------- |
| `idle`       | Gentle breathing, slow head sway            | Between speech       |
| `thinking`   | Head tilt left, finger to chin              | Thinking time phase  |
| `excited`    | Lean forward, quick double head nod         | Correct move played  |
| `pointing`   | Right arm extends toward board              | Highlighting a piece |
| `happy`      | Both hands raise slightly, smile expression | Puzzle solved        |
| `concerned`  | Slight head shake, worried expression       | Wrong move played    |
| `explaining` | Subtle hand gesture while talking           | Any speech phase     |

### 3.2 Implementation

Each gesture is a short spring-damper animation on VRM humanoid bones:

```typescript
// Access bones via: vrm.humanoid.getNormalizedBoneNode(boneName)
// Bones: 'head', 'neck', 'rightUpperArm', 'rightLowerArm', 'rightHand', 'spine'
// All gestures lerp to target pose then lerp back to rest
// Expressions: vrm.expressionManager.setValue('happy' | 'sad' | 'surprised' | 'relaxed', amount)
```

Spring params: `stiffness = 8, damping = 0.6` — gives snappy but soft movement

### 3.3 Gesture Controller (`useGestures.ts`)

```typescript
interface GestureController {
  playGesture(name: GestureType): void;
  setIdle(): void;
  // Called each animation frame to update spring state
  update(deltaTime: number): void;
}
```

---

## Phase 4 — Commentary Template Engine

**File**: `lib/puzzle-commentary.ts`

No LLM. Pure template + chess data → natural-feeling script.

### 4.1 Input data available per puzzle

```typescript
{
  themes: string[]          // ["fork", "pin", "sacrifice"] from Lichess tags
  fen: string               // Starting position
  moves: string[]           // Solution moves in UCI
  sideToMove: 'w' | 'b'    // Who solves
  rating: number            // Difficulty
  wrongMove: string         // Top non-solution Stockfish move (computed)
  wrongMoveLoss: number     // Centipawn loss of wrong move
  opponentDeviation: string // Best non-puzzle opponent reply (computed)
}
```

### 4.2 Script phases

```typescript
interface PuzzleScript {
  intro: string; // 1-2 sentences about position/motif hint
  hintLines: string[]; // 2-3 visual/positional hints (no spoiler)
  thinkingPrompt: string; // "Take your time..."
  moveCommentary: string[]; // One line per solution move
  wrongMoveQuestion: string; // "What if you played {move}?"
  wrongMoveAnswer: string; // Why it fails
  opponentDevQuestion: string; // "What if they played {move} instead?"
  opponentDevAnswer: string; // Your response
  conclusion: string; // Wrap-up line
}
```

### 4.3 Template bank (per theme)

Each theme has: intro variants × 4, hint variants × 4, move comment variants × 3, conclusion variants × 3.

**Themes covered (30 most common):**
`fork, pin, skewer, discoveredAttack, doubleCheck, mateIn1, mateIn2, mateIn3, backRankMate, smotheredMate, sacrifice, deflection, attraction, interference, hangingPiece, trappedPiece, promotion, endgame, xRayAttack, zugzwang, quietMove, clearance, crushing, advantage, rookEndgame, pawnEndgame, queenVsRook, bishopEndgame, knightEndgame`

**Example (fork theme):**

```typescript
intro: [
  "This is a classic geometry problem — look at the pieces on the board and where they sit relative to each other.",
  "Sometimes one piece can do two jobs at once. Take a moment and feel out the position.",
  "Notice the spacing between the pieces. Something interesting might be possible here.",
  "Look at all your pieces' potential squares — one of them might have a very special destination.",
];
hint: [
  "Pay attention to the {piece} — where could it jump from here?",
  "Count how many of their pieces are on squares you could threaten at once.",
  "Think about moves that attack two things simultaneously.",
  "What if you could move one piece and threaten two things at the same time?",
];
wrongMoveQuestion: [
  "Before we see the answer — what if you played {move} here? It looks forcing...",
  "A lot of players would be tempted by {move}. What do you think happens?",
  "Someone might try {move} first. Can you see why that doesn't work?",
];
```

### 4.4 Dynamic fill-ins

All templates support these tokens:

- `{piece}` → "Knight", "Bishop", "Queen" etc. (from position analysis)
- `{square}` → "e5", "f7" etc.
- `{move}` → formatted move e.g. "Nxe5" (from Stockfish)
- `{side}` → "you" or "your opponent"
- `{rating}` → difficulty label ("beginner", "intermediate", "advanced")

### 4.5 Variant selection

Random per-session shuffle (Fisher-Yates) so variants don't repeat within a session. Seed from puzzle ID so the same puzzle always gets the same commentary if replayed.

---

## Phase 5 — Stockfish Analysis (for wrong move + deviation)

**File**: `lib/puzzle-analysis.ts`

Uses existing `StockfishClient` from `lib/stockfish-client.ts`.

```typescript
async function analyzePuzzlePosition(
  fen: string,
  solutionFirstMove: string,
): Promise<{
  wrongMove: string; // Best non-solution move
  wrongMoveLoss: number; // How bad it is in centipawns
  opponentDeviation: string; // After move 1, opponent's best non-puzzle reply
}> {
  // Get top 3 moves at depth 15
  // wrongMove = top move that is NOT the puzzle solution
  // Run position after solutionFirstMove to get opponent deviation
}
```

Depth 15 is enough — we just need "tempting wrong moves", not perfect analysis.

---

## Phase 6 — Puzzle Mode Controller

**File**: `lib/use-puzzle-tutor.ts`

State machine controlling the full experience:

```
IDLE
  → [start] → INTRO_SPEECH
  → [intro done] → HINT_DISPLAY (show arrows, highlight pieces)
  → [hints done] → THINKING_TIME (countdown ~10-15s, avatar thinking gesture)
  → [thinking done] → MOVE_N_SPEECH (move commentary, play move on board)
  → [if wrong move position] → WRONG_MOVE_QUESTION (pause, ask question)
  → [player answers or skip] → WRONG_MOVE_ANSWER
  → [continue] → MOVE_N+1_SPEECH
  → [after last move] → OPPONENT_DEV_QUESTION
  → [answered] → CONCLUSION_SPEECH
  → COMPLETE
```

Each state transition:

1. Generates speech text from template
2. Calls `/api/puzzle-speech` for audio + word timings
3. Triggers appropriate avatar gesture
4. Updates board state (play move, show arrows)
5. Advances state when audio ends

---

## Phase 7 — UI Integration

### 7.1 Toggle in puzzles page

Add "Tutor Mode" toggle button in `app/puzzles/page.tsx` header area.

When active: renders `<PuzzleTutorPanel>` alongside the board.

### 7.2 Layout

```
┌──────────────────────────────────────┐
│  [Tutor Mode toggle]                 │
│                                      │
│  ┌─────────────┐  ┌────────────────┐ │
│  │ VRM Avatar  │  │  Chess Board   │ │
│  │  280×400    │  │                │ │
│  │             │  │                │ │
│  │ [speech     │  │                │ │
│  │  bubble]    │  │                │ │
│  └─────────────┘  └────────────────┘ │
│                                      │
│  [phase indicator]  [skip / replay]  │
└──────────────────────────────────────┘
```

### 7.3 Speech bubble

Floating text bubble above/beside avatar showing current spoken line. Highlights active word in sync with audio (same word timing data used for lip sync).

### 7.4 Controls

- **Skip** — jumps to next phase immediately
- **Replay** — replays current speech
- **Speed** — 0.8x / 1x / 1.2x playback (passed to EdgeTTS or audio playback rate)
- **Mute** — silences audio, keeps visual-only mode

---

## Build Order

| Step      | What                                                           | Est. effort |
| --------- | -------------------------------------------------------------- | ----------- |
| 1         | Add VRM deps, copy model files, get avatar rendering on screen | 1 day       |
| 2         | Port lip sync system, connect to dummy audio                   | 0.5 day     |
| 3         | EdgeTTS API route with word timing estimation                  | 0.5 day     |
| 4         | Procedural gesture system (5 gestures)                         | 1 day       |
| 5         | Commentary template engine (top 15 themes)                     | 1 day       |
| 6         | Stockfish wrong-move analysis                                  | 0.5 day     |
| 7         | Puzzle mode state machine + UI integration                     | 1.5 day     |
| **Total** |                                                                | **~6 days** |

---

## Open Decisions

1. **Which VRM model?** cherry_rose vs miu — look at both and pick
2. **Thinking time length** — 10s default? Should it adapt to puzzle rating?
3. **Wrong move question** — auto-advance after N seconds if player doesn't respond, or wait for explicit button?
4. **Speech caching** — cache generated audio per puzzle ID to avoid re-generating on replay
5. **Mobile layout** — avatar above board (stacked) vs hidden on small screens

---

## Files Created/Modified Summary

```
NEW:
  components/puzzle-avatar/PuzzleAvatar.tsx
  components/puzzle-avatar/useVrmLoader.ts
  components/puzzle-avatar/useLipSync.ts
  components/puzzle-avatar/useGestures.ts
  components/puzzle-avatar/vrm-expressions.ts
  lib/puzzle-commentary.ts
  lib/puzzle-analysis.ts
  lib/use-puzzle-tutor.ts
  app/api/puzzle-speech/route.ts
  public/vrm/cherry_rose.vrm  (copied)

MODIFIED:
  app/puzzles/page.tsx  (add tutor mode toggle + panel)
  package.json  (add VRM + Three.js deps)
```
