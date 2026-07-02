"use client";

import {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { Chess } from "chess.js";
import { Chessboard } from "@/components/chessboard-compat";
import { playSound, preloadSounds } from "@/lib/sounds";
import { earnCoins } from "@/lib/coins";
import { stockfishClient } from "@/lib/stockfish-client";
import { EvalBar } from "@/components/eval-bar";
import { MoveBadge } from "@/components/move-badge";
import {
  type MoveClassification,
  classifyMoveQuality,
} from "@/lib/move-quality";
import { useBoardTheme, useCustomPieces } from "@/lib/use-coins";
import { useBoardSize } from "@/lib/use-board-size";
import type {
  Lesson,
  Slide,
  RatingBand,
  TextSlide,
  InteractSlide,
  ChoiceSlide,
  ReplaySlide,
} from "@/lib/lesson-types";
import { NEW_LESSONS } from "./lessons-data";


/* ─────────────────────────────────────────────────────────────── */
/*  Lesson: The Initiative                                          */
/* ─────────────────────────────────────────────────────────────── */

const INITIATIVE_LESSON: Lesson = {
  id: "initiative-2000",
  band: "2000",
  title: "The Initiative",
  subtitle: "When greed loses time, and when practical play takes over",
  icon: "⚡",
  estimatedMinutes: 9,
  tags: ["middlegame", "strategy", "initiative", "sacrifice"],
  slides: [
    {
      kind: "replay",
      heading: "Watch White's plan unfold",
      body: "Every one of White's nine moves pointed at Black's king: rapid development, active bishop pair, the queen and bishop targeting f7. Black reacted move by move, never seeing the whole trap. In the next slides we'll understand each piece of the plan.",
      // Opera Game: 1.e4 e5 2.Nf3 d6 3.d4 Bg4 4.dxe5 Bxf3 5.Qxf3 dxe5 6.Bc4 Nf6 7.Qb3 Qe7 8.Nc3 c6 9.Bg5
      moves: [
        "e2e4",
        "e7e5",
        "g1f3",
        "d7d6",
        "d2d4",
        "c8g4",
        "d4e5",
        "g4f3",
        "d1f3",
        "d6e5",
        "f1c4",
        "g8f6",
        "f3b3",
        "d8e7",
        "b1c3",
        "c7c6",
        "c1g5",
      ],
      orientation: "black",
      intervalMs: 900,
    },
    {
      kind: "text",
      heading: "When the pawns are a trap",
      body: "Paul Morphy reached this position in 1858. Three of Black's pieces – the knight on b8, the bishop on f8, and the rook on h8 – are still on their starting squares. White has the bishop pair fully developed: Bg5 pins the f6 knight to the queen behind it, and Bc4 points directly at f7 threatening Bxf7+ and forking king and rook. Black's king is still in the center with no safe way to castle. This is not a situation to spend time collecting pawns.",
      // Opera Game: 1.e4 e5 2.Nf3 d6 3.d4 Bg4 4.dxe5 Bxf3 5.Qxf3 dxe5 6.Bc4 Nf6 7.Qb3 Qe7 8.Nc3 c6 9.Bg5
      fen: "rn2kb1r/pp2qppp/2p2n2/4p1B1/2B1P3/1QN5/PPP2PPP/R3K2R b KQkq - 1 9",
      orientation: "black",
      highlights: ["b8", "f8", "h8"],
      arrows: [
        ["c4", "f7"],
        ["g5", "f6"],
      ],
    },
    {
      kind: "text",
      heading: "What the initiative actually means",
      body: "The initiative belongs to the side that is making threats and forcing the opponent to react. Every tempo spent answering a threat is a tempo not spent improving your own position. That is why a single pawn can be worthless if the other side gets open lines, quick development, or a vulnerable king to attack. Initiative is time converted into pressure.",
      insight:
        "Every tempo spent defending is a tempo not spent attacking. The side that forces reactions owns the game.",
    },
    {
      kind: "interact",
      heading: "Develop, don't counterattack",
      instruction:
        "Black is in danger with three pieces still asleep. Rather than pushing a pawn to fight back, find the developing move that starts to untangle.",
      // Opera Game after 9.Bg5: Black is behind in development, king uncastled
      fen: "rn2kb1r/pp2qppp/2p2n2/4p1B1/2B1P3/1QN5/PPP2PPP/R3K2R b KQkq - 1 9",
      orientation: "black",
      correctMoves: ["b8a6"],
      wrongMoves: ["b7b5"],
      correctExplanation:
        "Na6 develops the knight and plans ...Nc7 to challenge the powerful Bc4. When behind in development, get pieces off the back rank – don't push pawns.",
      wrongExplanation:
        "...b5 looks active but it hands White a free piece sacrifice: 10.Nxb5! rips open lines while Black is still not castled. Morphy finished this game in 17 moves after Black played this very mistake.",
    },
    {
      kind: "text",
      heading: "What greed does to the attack",
      body: "After 9...b5, Morphy played 10.Nxb5! Black simply captures it: 10...cxb5. But that is exactly what White wanted – the c6 pawn has moved, and now 11.Bxb5+ crashes through along the b5–c6–d7–e8 diagonal. One pawn move opened the line to the king. After 11...Nbd7 12.O-O-O Rd8 13.Rxd7! Rxd7 14.Rd1 Qe6, Morphy offered his queen: 16.Qb8+!! Nxb8 17.Rd8#. Checkmate, while Black's h8 rook never moved.",
      // After 9...b5 10.Nxb5!: knight on b5 will be captured, opening c6 for Bxb5+ check
      fen: "rn2kb1r/p3qppp/2p2n2/1N2p1B1/2B1P3/1Q6/PPP2PPP/R3K2R b KQkq - 0 10",
      orientation: "black",
      highlights: ["b5", "c4", "g5"],
      arrows: [["c4", "b5"]],
    },
    {
      kind: "replay",
      heading: "The queen goes hunting",
      body: "The Poisoned Pawn Najdorf: Black's queen grabs b2 and retreats to a3, looking like a pawn up. But 9.Rb1 and 10.e5 announce the attack. After Nfd7, White doesn't slow down — the f-pawn storms to f5, rips the center open with fxe6, and the rook crashes into b7!! The queen on a3 is a spectator while White's pieces pour into Black's position.",
      moves: [
        "e2e4", // 1.e4
        "c7c5", // 1...c5
        "g1f3", // 2.Nf3
        "d7d6", // 2...d6
        "d2d4", // 3.d4
        "c5d4", // 3...cxd4
        "f3d4", // 4.Nxd4
        "g8f6", // 4...Nf6
        "b1c3", // 5.Nc3
        "a7a6", // 5...a6
        "c1g5", // 6.Bg5
        "e7e6", // 6...e6
        "f2f4", // 7.f4
        "d8b6", // 7...Qb6
        "d1d2", // 8.Qd2
        "b6b2", // 8...Qxb2 — grabs the pawn!
        "a1b1", // 9.Rb1 — rook cuts off the queen
        "b2a3", // 9...Qa3 — forced retreat
        "e4e5", // 10.e5 — White accelerates
        "f6d7", // 10...Nfd7 — natural retreat
        "f4f5", // 11.f5 — pawn storms forward
        "d7e5", // 11...Nxe5 — Black grabs back
        "f5e6", // 12.fxe6 — White tears open the center
        "c8e6", // 12...Bxe6 — Black recaptures
        "b1b7", // 13.Rxb7!! — rook crashes into b7!
      ],
      orientation: "black",
      intervalMs: 950,
      badges: {
        16: { sq: "b2", cls: "best" },
        25: { sq: "b7", cls: "brilliant" },
      },
    },
    {
      kind: "text",
      heading: "The other way greed backfires",
      body: "Now flip the story. In the Poisoned Pawn Najdorf, Black can really grab b2. But after 7...Qb6 8.Qd2 Qxb2 9.Rb1 Qa3 10.e5, White gets exactly what every attacker wants: time. The queen is stranded on a3, Black still has pieces sleeping on b8 and c8, and White is the side accelerating.",
      // Najdorf Poisoned Pawn branch: 1.e4 c5 2.Nf3 d6 3.d4 cxd4 4.Nxd4 Nf6 5.Nc3 a6 6.Bg5 e6 7.f4 Qb6 8.Qd2 Qxb2 9.Rb1 Qa3 10.e5
      fen: "rnb1kb1r/1p3ppp/p2ppn2/4P1B1/3N1P2/q1N5/P1PQ2PP/1R2KB1R b Kkq - 0 10",
      // Najdorf tabiya: 1.e4 c5 2.Nf3 d6 3.d4 cxd4 4.Nxd4 Nf6 5.Nc3 a6 6.Bg5 e6 7.f4
      orientation: "black",
      highlights: ["a3", "e5", "b8", "c8"],
      arrows: [
        ["b1", "b2"],
        ["d4", "e5"],
      ],
    },
    {
      kind: "interact",
      heading: "Play the sober move",
      instruction:
        "Black is tempted by the queen raid ...Qb6 and ...Qxb2. Find the move that develops normally and keeps the king safe.",
      // Najdorf tabiya: 1.e4 c5 2.Nf3 d6 3.d4 cxd4 4.Nxd4 Nf6 5.Nc3 a6 6.Bg5 e6 7.f4
      fen: "rnbqkb1r/1p3ppp/p2ppn2/6B1/3NPP2/2N5/PPP3PP/R2QKB1R b KQkq - 0 7",
      orientation: "black",
      correctMoves: ["f8e7"],
      wrongMoves: ["d8b6"],
      correctExplanation:
        "Exactly. ...Be7 is normal chess: finish development, castle, and only then talk about pawns. The queen raid creates a time debt Black may never repay.",
      wrongExplanation:
        "The pawn is poisoned because the queen loses time and White's attack arrives first. In dynamic positions, loose material is often bait.",
    },
    {
      kind: "choice",
      heading: "The critical decision",
      question:
        "Before taking a free pawn in a dynamic position, what should you ask first?",
      choices: [
        "Can I win the pawn with check?",
        "What forcing threats or tempi do I give my opponent?",
        "Will I still be a pawn up in the endgame?",
        "Is the pawn protected by a rook?",
      ],
      correctIndex: 1,
      explanation:
        "That is the real test. If your capture gives the other side open lines, faster development, or a direct attack, the pawn was never truly free.",
    },
    {
      kind: "text",
      heading: "When the attack has burned out",
      body: "Now compare a quieter position. The queens are off. Both kings are safe. Black has just played ...h5, trying to look active on the kingside, but there is no mating attack here. Once the heavy pieces disappear, initiative matters less and static gains matter more.",
      // Queen's Pawn structure: 1.d4 d5 2.Nf3 Nf6 3.e3 e6 4.Bd3 c5 5.O-O Nc6 6.c3 Bd6 7.Nbd2 O-O 8.dxc5 Bxc5 9.e4 dxe4 10.Nxe4 Nxe4 11.Bxe4 Qxd1 12.Rxd1 h5
      fen: "r1b2rk1/pp3pp1/2n1p3/2b4p/4B3/2P2N2/PP3PPP/R1BR2K1 w - - 0 13",
      orientation: "white",
      highlights: ["c6", "c5", "h5"],
      arrows: [["e4", "c6"]],
    },
    {
      kind: "interact",
      heading: "Play the practical move",
      instruction:
        "With queens off and no direct attack left, improve White's position immediately. Find the practical move.",
      // Queen's Pawn structure after ...h5 from the line above
      fen: "r1b2rk1/pp3pp1/2n1p3/2b4p/4B3/2P2N2/PP3PPP/R1BR2K1 w - - 0 13",
      orientation: "white",
      correctMoves: ["e4c6"],
      correctExplanation:
        "Bxc6. With no direct attack left, White should cash in immediately: eliminate the knight and leave Black with damaged queenside pawns.",
      wrongExplanation:
        "This is not the moment for a ghost attack. When the queens are gone and the king is safe, clean structural gains matter more than flashy ideas.",
    },
    {
      kind: "choice",
      heading: "How do you know the initiative is fading?",
      question:
        "Which detail most clearly tells you the position is no longer about a direct attack?",
      choices: [
        "There is still a pawn you could win",
        "The queens are off and the king is no longer exposed",
        "One side has the bishop pair",
        "A rook is sitting on an open file",
      ],
      correctIndex: 1,
      explanation:
        "Initiative is made of forcing threats. Once the queens are off and the king is safe, those threats shrink, so structural and material gains become the main story.",
    },
    {
      kind: "text",
      heading: "The takeaway",
      body: "Steinitz said 'The right move requires the right moment.' That is the whole lesson.\n\n✓ A pawn is not free if taking it hands your opponent the initiative\n✓ If you fall behind in time, answer with forcing moves, not passive defence\n✓ Sacrificing material is justified when it buys open lines, tempi, or king exposure\n✓ Once the queens come off and the king is safe, stop hunting ghosts and take the practical gain",
    },
  ],
};

/* ─────────────────────────────────────────────────────────────── */
/*  Lesson: Why Natural Moves Lose                                  */
/* ─────────────────────────────────────────────────────────────── */

const OPENINGS_LESSON: Lesson = {
  id: "openings-natural-moves",
  band: "1200",
  title: "Castle Opposite, Attack Everything",
  subtitle:
    "When kings go different ways, every move must contribute to checkmate",
  icon: "♟️",
  estimatedMinutes: 12,
  tags: ["openings", "pawn storm", "checkmate"],
  slides: [
    {
      kind: "replay",
      heading: "A race where normal chess loses",
      body: "When both sides castle on opposite sides, the game becomes a race. There is no balance to maintain, no equality to nurse — whoever reaches checkmate first wins. White castled queenside. Black castled kingside. Watch what White does with that structure: every single move has one job.",
      // 1.Nc3 e5 2.d4 exd4 3.Qxd4 Nc6 4.Qd3 Nf6 5.Bg5 Be7 6.O-O-O O-O 7.e4 d6 8.f4 h6 9.h4
      moves: [
        "b1c3",
        "e7e5",
        "d2d4",
        "e5d4",
        "d1d4",
        "b8c6",
        "d4d3",
        "g8f6",
        "c1g5",
        "f8e7",
        "e1c1",
        "e8g8",
        "e2e4",
        "d7d6",
        "f2f4",
        "h7h6",
        "h2h4",
      ],
      orientation: "white",
      intervalMs: 900,
      badges: {
        15: { sq: "f4", cls: "best" },
        17: { sq: "h4", cls: "brilliant" },
      },
    },
    {
      kind: "text",
      heading: "Good chess wasn't enough",
      body: 'You just watched Black play perfectly normal chess: develop knights, develop bishops, castle early, protect the center. Textbook. Yet Stockfish rates the final position +1.1 for White.\n\nWhen both sides castle opposite, "good" moves aren\'t enough. Every move White plays asks one question: does this help me checkmate? Every move Black plays answers a different question: am I developing normally?\n\nIn a race, only one question matters.',
      insight:
        "In an opposite-side castling race, there is no neutral move. Every tempo either advances your attack or gifts one to your opponent.",
      fen: "r1bq1rk1/ppp1bpp1/2np1n1p/6B1/4PP1P/2NQ4/PPP3P1/2KR1BNR b - h3 0 9",
      orientation: "white",
      highlights: ["c1", "e4", "f4", "h4"],
    },
    {
      kind: "text",
      heading: "One castle announces the whole plan",
      body: "6.O-O-O does two things at once:\n\n• The king steps off the kingside permanently — it will never be in the path of White's own pawn storm\n• The h1 rook is now free to join the attack via h3 or h7\n\nBut the deeper point: by castling queenside, White has announced the structure of the entire game. Every following White move must contribute to what happens on the f, g, and h files. There is no longer any such thing as a neutral move.",
      // After 6.O-O-O — White has castled queenside, Black's turn
      fen: "r1bqk2r/ppp1bppp/2n2n2/6B1/8/2NQ4/PPP1PPPP/2KR1BNR b kq - 3 6",
      orientation: "white",
      highlights: ["c1", "d1"],
      arrows: [["e1", "c1"]],
    },
    {
      kind: "text",
      heading: "Every piece has a mating job",
      body: "Look at each White piece and ask: what does it do for the checkmate?\n\n• King on c1: out of danger, never a liability — ✓\n• Rook on d1: controls the center, stops Black's counterplay — ✓\n• Queen on d3: aims at h7 — ✓\n• Bishop on g5: pins the f6 knight so Black's best defender can't move — ✓\n• Pawn on f4: ready to roll f5, g4, g5 — ✓\n• Pawn on h4: sets a trap; if Black takes the bishop, the h-file tears open for Rh7 — ✓\n\nEvery piece is doing work toward one square: h7. That's what opposite-side castling demands.",
      fen: "r1bq1rk1/ppp1bpp1/2np1n1p/6B1/4PP1P/2NQ4/PPP3P1/2KR1BNR b - h3 0 9",
      orientation: "white",
      arrows: [
        ["d3", "h7"],
        ["f4", "f5"],
        ["h1", "h7"],
      ],
    },
    {
      kind: "interact",
      heading: "Hold the bishop — and dare them",
      instruction:
        "Black just played ...h6 to kick your bishop off g5. The easy move is to retreat. Find the aggressive response instead.",
      fen: "r1bq1rk1/ppp1bpp1/2np1n1p/6B1/4PP2/2NQ4/PPP3PP/2KR1BNR w - - 0 9",
      orientation: "white",
      correctMoves: ["h2h4"],
      wrongMoves: ["g5h4"],
      correctExplanation:
        "h4! keeps the bishop on g5 and dares Black to take it. If Black grabs the bishop with hxg5, the h-file is wide open — no White pawns in the way. White will eventually stack the queen and rook on the h-file, and the mating threats are serious enough that Black usually has to give material back to stop them — ending up worse than before they took the bishop. White just turned a threat into a trap.",
      wrongExplanation:
        "Bh4 retreats and gives Black exactly what they wanted — the bishop is kicked away, the pin on f6 is broken, and the attack loses momentum. In an opposite-side castling race, retreating costs you the initiative.",
      badge: "brilliant",
    },
    {
      kind: "text",
      heading: "The pin: a move that contributes to checkmate",
      body: "The bishop on g5 pins Black's f6 knight to the queen on d8. That knight is Black's best kingside defender — and right now it cannot move.\n\nThis is what it means for every move to contribute to checkmate: Bg5 isn't just developing a bishop, it isn't just creating a pin. It silences the one piece that could block the coming pawn wave.\n\nAsk this about every move you play in an opposite-side castling game: does this help me reach checkmate? Bg5 answers yes. It earns its place.",
      fen: "r1bq1rk1/ppp1bpp1/2np1n1p/6B1/4PP1P/2NQ4/PPP3P1/2KR1BNR b - h3 0 9",
      orientation: "white",
      highlights: ["g5", "f6", "d8"],
      arrows: [["g5", "d8"]],
    },
    {
      kind: "text",
      heading: "The bishop you shouldn't take",
      body: "Black played ...h6 to drive away the bishop — natural. Then White plays h4, and now Black faces a trap.\n\nThe bishop on g5 looks like it can be taken: ...hxg5. But if Black does, White plays hxg5 and the h-file is suddenly wide open — no White pawns left to block it. White will eventually stack the queen and rook on the h-file, and the mating threats are serious enough that Black usually has to give material back just to stop them. Black ends up down material and in a worse position than before they took the bishop.\n\nThe bishop was bait. The h6 pawn was the hook. Taking it doesn't win a piece — it costs one.",
      insight:
        "Sacrificial bishops are bait. The real danger isn't the piece — it's the line that opens when you take it.",
      fen: "r1bq1rk1/ppp1bpp1/2np1n1p/6B1/4PP1P/2NQ4/PPP3P1/2KR1BNR b - h3 0 9",
      orientation: "black",
      highlights: ["g5", "h1", "h6"],
      arrows: [
        ["h6", "g5"],
        ["h1", "h7"],
      ],
    },
    {
      kind: "interact",
      heading: "Don't take the bait",
      instruction:
        "White just played h4. The bishop on g5 looks available. Find the correct response — and resist the temptation.",
      fen: "r1bq1rk1/ppp1bpp1/2np1n1p/6B1/4PP1P/2NQ4/PPP3P1/2KR1BNR b - h3 0 9",
      orientation: "black",
      correctMoves: ["c8g4"],
      wrongMoves: ["h6g5"],
      correctExplanation:
        "Bg4 is the right idea: develop with tempo, attack the queen, and keep the h-file firmly closed. Black ignores the bait and keeps the position solid.",
      wrongExplanation:
        "hxg5 is the trap! After hxg5, White plays hxg5 and the h-file tears open. The queen lands on h3 pointing at h8. One pawn push from Black, the bishop swings to c4 with check — and 13.Qh8# is checkmate. Never open lines toward your own king.",
    },
    {
      kind: "replay",
      heading: "What happens when Black falls for it",
      body: "After ...hxg5 hxg5, the h-file is open and White's queen lands on h3 pointing straight at h8. Black panics with f5, but that was the final mistake — 12.Bc4+ swings the bishop into the c4–g8 diagonal, which is now wide open with the f7 pawn gone. The rook has to block on f7, and 13.Qh8 is checkmate. Five moves from one greedy pawn grab to the end of the game.",
      startFen:
        "r1bq1rk1/ppp1bpp1/2np1n1p/6B1/4PP1P/2NQ4/PPP3P1/2KR1BNR b - - 0 9",
      moves: [
        "h6g5", // 9...hxg5 — falls for the trap
        "h4g5", // 10.hxg5 — h-file tears open
        "f6g4", // 10...Ng4 — Black tries to find counterplay
        "d3h3", // 11.Qh3 — queen lands on h3, eyes h8
        "f7f5", // 11...f5 — panics, but clears the diagonal
        "f1c4", // 12.Bc4+ — bishop swings in, f7 square empty!
        "f8f7", // 12...Rf7 — forced block
        "h3h8", // 13.Qh8# — checkmate!
      ],
      orientation: "black",
      intervalMs: 1300,
      badges: {
        1: { sq: "g5", cls: "blunder" },
        8: { sq: "h8", cls: "brilliant" },
      },
    },
    {
      kind: "choice",
      heading: "Why does ...hxg5 lose?",
      question:
        "If Black takes the bishop with ...hxg5, why is White's attack immediately decisive?",
      choices: [
        "White wins material and enters a better endgame",
        "The h-file opens and White's queen reaches h8 for checkmate in just 4 more moves",
        "Black's king loses the right to castle",
        "White's queen on d3 suddenly controls h7",
      ],
      correctIndex: 1,
      explanation:
        "After ...hxg5 hxg5, White plays Qh3 with the queen aiming at h8. After f5 from Black, Bc4+ opens the diagonal — the rook has to block on f7, and Qh8 is checkmate. From one pawn grab to checkmate in 5 moves. The bishop was bait to open the killing file.",
      fen: "r1bq1rk1/ppp1bpp1/2np1n1p/6B1/4PP1P/2NQ4/PPP3P1/2KR1BNR b - h3 0 9",
      orientation: "black",
      highlights: ["g5", "h6", "h8"],
      arrows: [
        ["h6", "g5"],
        ["h1", "h8"],
      ],
    },
    {
      kind: "choice",
      heading: "Why castle queenside?",
      question:
        "In this system, White castles queenside while attacking the kingside. What is the key reason?",
      choices: [
        "O-O-O activates the a1 rook on the d-file immediately",
        "The king is safer on the queenside when pushing kingside pawns",
        "Queenside castling is faster — fewer pieces block the path",
        "The queen on d3 would be threatened if White castled kingside",
      ],
      correctIndex: 1,
      explanation:
        "When White pushes f4, g4, h4, those pawns cannot also be covering the White king. Castling on the opposite side of the attack keeps the king sheltered while the whole wave rolls forward.",
    },
    {
      kind: "text",
      heading: "The one question to ask every move",
      body: "In any opening built around opposite-side castling, you only need one question: does this move help me checkmate?\n\n• Castle queenside? ✓ Frees the kingside entirely for attack\n• Push f4? ✓ Opens the f-file and launches the wave\n• Pin with Bg5? ✓ Silences Black's best kingside defender\n• Push h4? ✓ Sets a trap to tear open the h-file for the rook\n\nBlack played good moves — normal, principled, sound. But Black's moves had no answer to that question. White's every move did.\n\nWhen kings go to opposite sides, there is no neutral move. Every move either contributes to checkmate or wastes a tempo in a race you cannot afford to lose.",
    },
  ],
};

const TIME_LESSON: Lesson = {
  id: "time-management-1600",
  band: "1600",
  title: "Your Clock Is a Piece Too",
  subtitle: "Time management, pressure, and how to weaponize the clock",
  icon: "⏱",
  estimatedMinutes: 8,
  tags: ["time management", "psychology", "strategy"],
  slides: [
    {
      kind: "replay",
      heading: "Two games at once",
      body: "Both sides played 9 sound, principled moves. White spent an average of 3 minutes per move navigating complex Ruy Lopez theory — moves 5, 7, and 9 alone cost 12 minutes. Black, playing a prepared line, averaged 40 seconds each.\n\nAfter just nine moves: White has 48 minutes. Black has 57. The game hasn't reached its critical phase yet — and White is already a rook worth of time behind.",
      moves: [
        "e2e4",
        "e7e5",
        "g1f3",
        "b8c6",
        "f1b5",
        "a7a6",
        "b5a4",
        "g8f6",
        "e1g1",
        "f8e7",
        "f1e1",
        "b7b5",
        "a4b3",
        "e8g8",
        "c2c3",
        "d7d6",
        "h2h3",
      ],
      orientation: "white",
      intervalMs: 800,
    },
    {
      kind: "text",
      heading: "Where your time goes",
      body: "Opening moves you know should cost under a minute total. The clock killer is any position where you calculate deeply but would have played the same move anyway.\n\nTime disappears most on:\n• Positions that feel 'important' but aren't critical yet\n• Tactical shots you spot but aren't sure are safe\n• Move 20–25, when structure crystallizes and every pawn starts to matter\n\nBy move 30, most players have spent 60% of their time — but the genuinely decisive moment is still ahead.",
      fen: "r1bq1rk1/2p1bppp/p1np1n2/1p2p3/4P3/1BP2N1P/PP1P1PP1/RNBQR1K1 b - - 0 9",
      orientation: "white",
      highlights: ["e4", "e5"],
      insight:
        "Time pressure is a slow leak, not a sudden event. Most players are already in trouble by move 25 — they just don't realize it yet.",
    },
    {
      kind: "text",
      heading: "Bronstein's half-point",
      body: "David Bronstein came within half a point of becoming World Chess Champion in 1951. He was arguably the most creative player of his generation. His downfall wasn't calculation — it was the clock.\n\nBronstein habitually spent 30 minutes on individual moves, even in positions he had prepared at home. In the final decisive game of the match, he reached a winning position with 2 minutes left. He couldn't convert it. The match ended in a 12–12 tie. Botvinnik retained the title.\n\nOne game. One flagfall. Half a point. The chess world changed after that match — time management became not just a skill but a survival requirement at the top.",
      insight:
        "Bronstein could find the best move in any position. He just couldn't always find it fast enough.",
      photo: {
        src: "/chess-legends/bronstein-1963.jpg",
        credit:
          "Eric Koch / Anefo / Dutch National Archives, CC BY-SA 3.0 NL, via Wikimedia Commons (Hoogovens 1963)",
      },
    },
    {
      kind: "choice",
      heading: "The expensive think",
      question:
        "You're on move 20. You've been calculating a pawn sacrifice for 4 minutes. You still can't verify it's sound. What do you do?",
      choices: [
        "Keep calculating — you need to be sure before committing",
        "Play a solid alternative that doesn't require calculation",
        "Play the sacrifice anyway — your intuition says it works",
      ],
      correctIndex: 1,
      explanation:
        "If you haven't found clarity in 4 minutes, the 5th minute rarely helps. Play the safest good move and preserve your clock. The position after the solid alternative isn't lost — but being 8 minutes behind might be.",
    },
    {
      kind: "text",
      heading: "Anand's weapon",
      body: "Vishy Anand prepared the Ruy Lopez so deeply that he could play the first 20 moves in under 90 seconds. His opponents would spend 15 minutes thinking on move 12 while Anand had barely moved his clock.\n\nThis wasn't blitzing — every move was prepared, verified, and committed to memory. The result: Anand routinely arrived at the middlegame with 55+ minutes while his opponents had 42. That 13-minute gap, compounded over 20 more moves, was often the difference.\n\nIn his 2000 World Championship run, Anand demolished opponents partly by being 10 moves ahead on the clock before the real game began.",
      insight:
        "Opening preparation isn't just about knowing the theory — it's about banking time for the endgame.",
      photo: {
        src: "/chess-legends/anand-2000.jpg",
        credit:
          "GFHund, CC BY 3.0, via Wikimedia Commons (Dortmunder Schachtage 2000)",
      },
    },
    {
      kind: "text",
      heading: "The 60-second heuristic",
      body: "After 60 seconds on a single move, ask: 'Would I play a different move with 10 more minutes?'\n\nIf no — play it now. If yes — take the time.\n\nThis filters out the most expensive mistake in time management: spending 6 minutes to confirm what you already knew after 2.\n\nThe other half: calculate on your opponent's time. Every move they think, you plan your response. You can 'buy back' minutes without ever touching the clock.",
      insight:
        "If you can't see the refutation in 60 seconds, neither can your opponent. Play it and make them find it.",
    },
    {
      kind: "interact",
      heading: "Preserve your clock",
      instruction:
        "You have 45 seconds left, your opponent has 8 minutes. Standard Italian — both sides castled. Find the solid, no-calculation move that keeps things stable.",
      fen: "r1bq1rk1/ppp2ppp/2np1n2/2b1p3/2B1P3/2NP1N2/PPP2PPP/R1BQ1RK1 w - - 0 7",
      orientation: "white",
      correctMoves: ["h2h3", "a2a3", "f1e1"],
      wrongMoves: ["d3d4", "f3g5"],
      correctExplanation:
        "h3 (also a3, Re1) costs 10 seconds and zero calculation — it prevents Ng4 pins and is standard Italian theory. d4 looks principled but runs into exd4 Nxd4 Nxe4!, winning a pawn for Black because the c4 bishop and e4 pawn are both attacked. With 45 seconds on the clock, that's not a line you can calculate — so don't play the move that requires it.",
      wrongExplanation:
        "d4 appears to be a principled central push, but it's a pawn sacrifice: after exd4 Nxd4 Nxe4! Black wins material (the c4 bishop and e4 pawn are both hanging). With 45 seconds left, you can't calculate the compensation. Play h3 — zero risk, zero calculation, and your clock stays healthy.",
    },
    {
      kind: "text",
      heading: "Their time trouble is your weapon",
      body: "When your opponent is low on time, your job changes — not to play perfect chess, but to create decisions.\n\n• Avoid exchanges — each piece remaining is a potential blunder for them\n• Push pawns to create new imbalances — each pawn is a new calculation\n• Create threats that require precise calculation — forks, pins, discovered attacks\n• Never simplify unless you're winning and want to close it out\n\nA player with 30 seconds cannot calculate a 4-move sequence. Keep the threats alive and let the clock do the work.",
      insight:
        "In their time trouble, you're not playing chess — you're generating problems. There's a difference.",
    },
    {
      kind: "choice",
      heading: "The increment trap",
      question:
        "Classical game with 30-second increment. Your opponent has 45 seconds left; you have 8 minutes. They just played a move that might be a mistake, but verifying it takes 3–4 minutes of calculation. What do you do?",
      choices: [
        "Take 3–4 minutes to verify the win — don't leave anything to chance",
        "Play a forcing move quickly that creates a new problem they must solve with 45 seconds",
        "Simplify to an endgame where your time advantage matters most",
        "Offer a draw — forcing moves in time trouble is risky for both sides",
      ],
      correctIndex: 1,
      explanation:
        "With 45 seconds and an increment, your opponent is living move-to-move. Every forcing move forces them to respond perfectly under pressure. You don't need to find the refutation — you need to generate one more decision they must get right. Let the clock be the refutation.",
    },
    {
      kind: "choice",
      heading: "Clock warfare",
      question:
        "Your opponent has 30 seconds left. The position is roughly equal. Which approach best exploits their time pressure?",
      choices: [
        "Exchange queens — reach a clean endgame where skill decides",
        "Push a pawn that creates structural imbalances requiring calculation",
        "Play the best objective move and let the position speak for itself",
        "Offer a draw — equal positions with time pressure don't need to be played out",
      ],
      correctIndex: 1,
      explanation:
        "In their time trouble, you want complexity — not clarity. A queen exchange removes half the pieces and half the decisions, which is exactly what your opponent needs. Structural imbalances force them to calculate pawn endgames with 30 seconds on the clock. Their time is your resource.",
    },
    {
      kind: "text",
      heading: "Carlsen's simplification",
      body: "Magnus Carlsen is the best endgame player in the world and he knows it. When he's ahead on the clock, he avoids simplification. When he's behind, he trades into positions he can navigate on feel.\n\nIn his 2016 World Championship match against Karjakin, Carlsen was in time trouble in Game 10. He steered into a knight endgame — not because it was objectively best, but because he'd played thousands of knight endgames and Karjakin hadn't. With 30 seconds left, expertise beats calculation every time.\n\nKnowing which positions you can play on instinct is as important as any opening preparation.",
      insight:
        "When the clock runs low, trade into positions your body knows, not your mind.",
      photo: {
        src: "/chess-legends/carlsen-karjakin-2016.jpg",
        credit:
          "Vladimir Barskij, CC BY-SA 3.0, via ruchess.ru / Wikimedia Commons (WCC 2016 Game 10)",
      },
    },
    {
      kind: "text",
      heading: "The one rule",
      body: "All of time management reduces to a single principle:\n\nSpend time on positions that need it. Blur through the rest.\n\nA move you'd play in 10 seconds should take 10 seconds. A critical junction deserves 5 minutes if you have them. The error isn't spending time — it's spending it on the wrong moves.\n\nMagnus Carlsen plays 5-second moves and 10-minute moves. The 10-minute moves are rarely the ones that look complicated. They're the ones that are complicated.",
      insight:
        "The player with 10 minutes at move 30 has an advantage that doesn't show up on the board.",
    },
  ],
};

/* ─────────────────────────────────────────────────────────────── */
/*  Lesson: The Passed Pawn                                         */
/* ─────────────────────────────────────────────────────────────── */

const PASSED_PAWN_LESSON: Lesson = {
  id: "passed-pawn-1600",
  band: "1600",
  title: "The Pawn That Became a Queen",
  subtitle: "Passed pawns, blockades, and the art of the outside decoy",
  icon: "♟",
  estimatedMinutes: 8,
  tags: ["endgame", "pawns", "strategy", "technique"],
  slides: [
    {
      kind: "text",
      heading: "The prisoner everyone ignores",
      body: "A passed pawn is a pawn with no enemy pawns on its own file or the adjacent files between it and the promotion square. Nothing can stop it with a pawn — only pieces can.\n\nThat sounds modest. But a passed pawn is also a ticking clock. Every tempo the opponent spends blockading it is a tempo not spent improving their position. Every piece forced to guard the promotion square is a piece that can't attack.\n\nA well-advanced passed pawn doesn't threaten mate. It threatens to become a queen — and queens win games.",
      fen: "8/8/8/8/3P4/8/8/8 w - - 0 1",
      insight:
        "A passed pawn is not just a pawn — it's a threat that never goes away.",
    },
    {
      kind: "text",
      heading: "Creating the passer: pawn breaks",
      body: "Most passed pawns don't start out that way. They're created through pawn exchanges — 'pawn breaks' — where you sacrifice or advance one pawn to clear the path for another.\n\nThe classic queenside majority: White has three pawns (a, b, c) against Black's two (a, b). Push c5! Black can take on c5, but then b-pawn advances and becomes a passer. Or Black ignores it, and c6 is suddenly a monster pawn two squares from queening.\n\nThe key insight: in any pawn majority, there is always at least one passer waiting to be born. Your job is to find which pawn break brings it to life.",
      fen: "8/4k3/8/pp6/1PP5/P7/3K4/8 w - - 0 1",
      orientation: "white",
      highlights: ["c4", "c5"],
      arrows: [["c4", "c5"]],
    },
    {
      kind: "interact",
      heading: "Create a passed pawn",
      instruction:
        "White has three queenside pawns vs. Black's two. One pawn break gives White an immediate passed pawn. Find it.",
      fen: "8/4k3/8/pp6/1PP5/P7/3K4/8 w - - 0 1",
      orientation: "white",
      correctMoves: ["c4c5"],
      wrongMoves: ["a3a4", "b4b5"],
      correctExplanation:
        "c5! creates an instant passed c-pawn — Black has no c-pawn to oppose it. After bxc5, the b4-pawn advances to b5 and creates a passed b-pawn. After cxb4... the a-pawn recaptures and again White has a passer. The break works because Black's pawn structure can't cover all three files.",
      wrongExplanation:
        "a4 just creates a blocked pawn (Black has a5 in the way) and doesn't improve the structure. b5 is illegal — Black already occupies b5. The only productive break is c5!, which exploits the fact that Black has no c-pawn.",
    },
    {
      kind: "text",
      heading: "Fischer's clinical precision",
      body: "Bobby Fischer turned passed pawns into wins with terrifying efficiency. His endgame technique in the 1972 World Championship match was described by Spassky's team as 'inhuman.'\n\nGame after game, Fischer converted what appeared to be drawn positions into wins — not through tactics, but through microscopic pawn advances. He understood that a passed pawn, even one move from promotion, ties down an entire rook to guard the back rank.\n\nHis philosophy: if you have a passed pawn and your opponent does not, you are already winning. The technique is just a formality.",
      insight:
        "Fischer: 'A passed pawn increases in strength as the number of pieces on the board diminishes.'",
      photo: {
        src: "/chess-legends/fischer-1960.jpg",
        credit:
          "Bundesarchiv, CC BY-SA 3.0 DE, via Wikimedia Commons (Leipzig Chess Olympiad, 1960)",
      },
    },
    {
      kind: "text",
      heading: "The protected vs. the lone runner",
      body: "Not all passed pawns are created equal. The protected passed pawn — supported from behind or beside by another pawn — is the most dangerous. It can advance without requiring its king to escort it.\n\nThe isolated passer, by contrast, needs a bodyguard. Send the king forward to shield it, and your opponent can often create a counter-threat elsewhere.\n\nThe blockader is the passed pawn's natural enemy: a piece placed directly in front of it, defusing its promotion threat. The ideal blockader? A knight — it sits in front of the pawn with no fear of being chased by it, while remaining active attacking in all directions. Nimzowitsch called the knight 'the born blockader.'",
      fen: "8/8/8/3kp3/3P4/3K4/8/8 w - - 0 1",
      orientation: "white",
      insight:
        "The knight in front of a passed pawn is the most effective blockader: immune to pawn attack, yet full of threats.",
    },
    {
      kind: "text",
      heading: "The outside passed pawn: the great decoy",
      body: "The most powerful passed pawn is often the one furthest from where the real battle is happening.\n\nWhen you have an outside passed pawn — one far from the main pawn cluster — it forces the enemy king to go chase it. While the king runs to the corner to stop the passer, your king walks into the center and gobbles up all the remaining pawns.\n\nThe outside passer doesn't need to queen. It just needs to make the opponent's king spend four or five moves running across the board — four or five moves your king uses to conquer the kingside.",
      fen: "8/8/4k3/4Ppp1/P4PP1/8/4K3/8 w - - 0 1",
      orientation: "white",
      arrows: [
        ["a4", "a8"],
        ["e2", "f4"],
      ],
    },
    {
      kind: "interact",
      heading: "Use the outside passed pawn",
      instruction:
        "White has an outside passed pawn on the a-file while all central pawns are locked. The passed pawn is White's winning weapon. Activate it.",
      fen: "8/8/4k3/4Ppp1/P4PP1/8/4K3/8 w - - 0 1",
      orientation: "white",
      correctMoves: ["a4a5"],
      wrongMoves: ["e2d3", "e2f3", "e2e3"],
      correctExplanation:
        "a5! starts the decoy. After a5 Kd6, White advances to a6! and the Black king must sprint to catch it — leaving the kingside pawns undefended. White's king then walks to f5, captures g5, and the kingside pawns queen. The a-pawn doesn't need to promote: it just needs to pull the Black king out of position.",
      wrongExplanation:
        "Moving the king without advancing the a-pawn wastes the advantage. The Black king is perfectly placed in the center. The only plan that wins is to create an immediate crisis with a5!, forcing the Black king to react.",
    },
    {
      kind: "replay",
      heading: "Réti's immortal study (1921)",
      body: "White king on g8, White pawn on c6. Black king on a5, Black pawn on h5. White appears hopelessly lost — the c6 pawn is about to be captured, and the h-pawn is racing to queen. But Réti showed that White can DRAW with a single elegant idea.\n\n1.Kg7! (the king heads toward both goals at once — it threatens to support c6→c7 AND to catch the h-pawn if needed)\n1...h4 2.Kf6 Kb6 3.Ke5!! (the key diagonal move — from e5, the king covers BOTH the h-pawn via Kf4 AND supports c7 via Kd6)\n3...Kxc6 4.Kf4 — draw. White catches the h-pawn, neutralizing Black's passer.",
      startFen: "6K1/8/2P5/k6p/8/8/8/8 w - - 0 1",
      moves: ["g8g7", "h5h4", "g7f6", "a5b6", "f6e5", "b6c6", "e5f4"],
      orientation: "white",
      intervalMs: 1000,
      badges: {
        1: { sq: "g7", cls: "brilliant" },
        5: { sq: "e5", cls: "brilliant" },
      },
    },
    {
      kind: "choice",
      heading: "The promotion clock",
      question:
        "You have a passed pawn on d6, your opponent has a passed pawn on a5. Both kings are equidistant from each pawn. What's the most important factor?",
      choices: [
        "Which pawn is closer to its promotion square",
        "Whose king is closer to the center of the board",
        "Which side has more pieces defending the passer",
        "Whose pawn is on a more central file",
      ],
      correctIndex: 0,
      explanation:
        "The number of moves to promotion is the decisive factor in a race. d6 is one square from queening (d7, d8); a5 needs three more moves (a4 is irrelevant — it needs a6, a7, a8 from a5). If it's White's turn and d6 needs 2 moves, Black's a5 needs 3 — White wins the race. Count the moves, not the position.",
      fen: "8/8/k2P4/p7/8/8/8/3K4 w - - 0 1",
      orientation: "white",
      highlights: ["d6", "a5", "d8", "a1"],
      arrows: [
        ["d6", "d8"],
        ["a5", "a1"],
      ],
    },
    {
      kind: "choice",
      heading: "The ideal blockader",
      question:
        "Your opponent has a dangerous passed pawn on d5. Which piece is the BEST to use as a blockader?",
      choices: [
        "A rook — it controls the entire d-file",
        "A bishop — it stays safely behind and pressures the pawn",
        "A knight — it sits in front of the pawn and remains active",
        "The king — it's free in the endgame and very strong on d4",
      ],
      correctIndex: 2,
      explanation:
        "The knight on d4 (in front of the d5 pawn) is the ideal blockader. A pawn cannot attack a knight on the same file, so the knight sits there permanently while attacking up to 8 squares. A rook blockader is 'wasted' — a rook's power is on open files, not sitting in front of a pawn. The king is a good blockader in pure king+pawn endings, but the knight is superior when pieces remain.",
      fen: "3k4/8/8/3p4/3N4/8/8/3K4 w - - 0 1",
      orientation: "white",
      highlights: ["d4", "d5"],
      arrows: [["d5", "d4"]],
    },
    {
      kind: "text",
      heading: "Capablanca's endgame artistry",
      body: "José Raúl Capablanca was considered the greatest endgame player of the early 20th century. His passed pawn technique was described by his contemporaries as 'effortless' — he made winning look inevitable.\n\nAt New York 1924, Capablanca converted a trivial-looking rook endgame against Tartakower that most masters would have drawn. The key: he used his king aggressively, marched a passed pawn up the board, and used the outside passed pawn as a decoy to win the kingside pawns. Alekhine, watching the game, reportedly said: 'That ending was not won by Capablanca — it was inevitable.'",
      insight:
        "Capablanca's rule: 'In the endgame, the king is a strong piece. Use it!'",
      photo: {
        src: "/chess-legends/capablanca-1920s.jpg",
        credit:
          "Public domain — José Raúl Capablanca, World Chess Champion 1921–27 (Wikimedia Commons)",
      },
    },
    {
      kind: "text",
      heading: "The one rule",
      body: "All passed pawn strategy reduces to one principle:\n\nAdvance it, escort it, or use it to drag the enemy king out of position.\n\nA passed pawn that sits still is a potential queen. A passed pawn that advances is a crisis. A passed pawn on the seventh rank, protected, is a game-ender.\n\nNever let a passed pawn be blockaded permanently. Trade the blockader. Bring the king up. Make the opponent prove they can stop it — because most of the time, they cannot.",
      insight:
        "Philidor's rule: 'Passed pawns must be pushed!' Every move they don't advance, they lose value.",
    },
  ],
};

/* ─────────────────────────────────────────────────────────────── */
/*  Lesson: Open Files and the Rook                                 */
/* ─────────────────────────────────────────────────────────────── */

const OPEN_FILES_LESSON: Lesson = {
  id: "open-files-1200",
  band: "1200",
  title: "Rooks Love Open Files",
  subtitle: "Seize the file, invade the 7th, and let the rook do the talking",
  icon: "🏰",
  estimatedMinutes: 8,
  tags: ["rooks", "open files", "middlegame", "strategy"],
  slides: [
    {
      kind: "text",
      heading: "A rook on a closed file is sleeping",
      body: "A rook behind locked pawns controls nothing. Behind pawns on e4 and e5, a rook on e1 might as well be a spectator. But give that rook an open file — a file with no pawns of either color — and suddenly it threatens to penetrate to the 7th rank, double with its partner rook, and dominate the entire board.\n\nThe first rule of rook play: control open files. The side that occupies an open file first forces the opponent into a passive defense. Rooks don't just sit on open files — they control what happens there.",
      fen: "r4rk1/pppq1ppp/2n1pn2/3p4/3P4/2N1PN2/PPP2PPP/R2QR1K1 w - - 0 10",
      orientation: "white",
      highlights: ["e1", "e3", "d4", "d5"],
      arrows: [
        ["e1", "e3"],
        ["d4", "d5"],
      ],
      insight:
        "Before you plan any middlegame attack, ask: which file will open? Get there first.",
    },
    {
      kind: "replay",
      heading: "The fight for the d-file",
      body: "In the Scotch Game, the d-file opens immediately after 3.d4 exd4 4.Nxd4 — no delays, no slow center trades. Watch how White uses queenside castling to place a rook on d1 in a single move, instantly claiming the file and seizing the initiative.",
      moves: [
        "e2e4",
        "e7e5",
        "g1f3",
        "b8c6",
        "d2d4",
        "e5d4",
        "f3d4",
        "g8f6",
        "b1c3",
        "f8c5",
        "c1e3",
        "c5b6",
        "d1d2",
        "e8g8",
        "e1c1",
      ],
      orientation: "white",
      intervalMs: 800,
      badges: {
        15: { sq: "d1", cls: "best" },
      },
    },
    {
      kind: "interact",
      heading: "Seize the open file",
      instruction:
        "Both d-pawns were just traded. The d-file is wide open. White has rooks on a1 and f1. Claim the open file before Black does.",
      fen: "r2q1rk1/pp3ppp/2nb1n2/8/4P3/2NQB3/PP3PPP/R4RK1 w - - 0 11",
      orientation: "white",
      correctMoves: ["a1d1", "f1d1"],
      wrongMoves: ["e4e5", "d3d6", "g1h1"],
      correctExplanation:
        "Rd1! claims the d-file immediately. The rook on d1 controls the entire d-file and threatens to enter via d7 or d8. If Black gets there first with Rd8, White must fight for the file. The first rook to an open file has the initiative — it didn't matter which rook you used, both ideas are correct.",
      wrongExplanation:
        "Piece attacks and king moves don't address the position's key issue: the open d-file. The most important principle: an open file is a prize — and the first player to claim it wins it. Get a rook to d1.",
    },
    {
      kind: "text",
      heading: "Capablanca's poetry in rook endgames",
      body: "José Raúl Capablanca was the undisputed master of rook endgames. His technique was so clean that opponents would resign in positions where other grandmasters would fight on for hours.\n\nAt New York 1924, Capablanca-Tartakower became one of the most analyzed endgames in chess history. Capablanca activated both rooks on open files, doubled them on the 7th rank (the 'pig' formation), and used the resulting pressure to create a passed pawn that Tartakower couldn't stop. Lasker called it 'the most instructive endgame of the 20th century.'\n\nThe secret? Capablanca never moved a rook without a clear plan for where it was going.",
      insight:
        "Capablanca: 'In order to improve your game, you must study the endgame before everything else.'",
      photo: {
        src: "/chess-legends/capablanca-1920s.jpg",
        credit:
          "Public domain — José Raúl Capablanca, World Chess Champion 1921–27 (Wikimedia Commons)",
      },
    },
    {
      kind: "text",
      heading: "Semi-open files and how to open a file",
      body: "A semi-open file has one side's pawns but not both. If White has no pawn on the c-file but Black does, White has a 'semi-open c-file' — a road that's half-built.\n\nYou can convert a semi-open file into a fully open one by:\n• Exchanging pawns: advance your pawn to attack Black's pawn on the file, then trade\n• Sacrificing to open it: sometimes a pawn sacrifice to blow open a file is worth the material\n• Waiting for your opponent to advance: many players open their own files without realizing it\n\nRemember: once a file is open, the rook already there wins the race.",
      fen: "r1b1r1k1/pp3ppp/2nqpn2/8/1PPp4/P2P1N2/4BPPP/R1BQR1K1 w - - 0 13",
      orientation: "white",
      highlights: ["b4", "c4", "c6"],
      arrows: [["c4", "c5"]],
      insight:
        "Before every rook move, ask: 'Can I open the file I'm on?' A semi-open file is one pawn break away from being decisive.",
    },
    {
      kind: "text",
      heading: "Doubling rooks: the battery",
      body: "One rook on an open file is good. Two rooks on the same open file — a 'rook battery' — is devastating.\n\nWhen rooks are doubled on an open file, the opponent cannot place a piece there without it being captured. The rooks can advance in tandem, one covering the other. They create a highway into the opponent's position.\n\nThe classic sequence: Rd1 → Rfd1 (if the rook on f1 joins the d-file). Now White controls d1, d2, d3... all the way to d8, and any piece that enters the d-file becomes a target.",
      fen: "r4rk1/pp3ppp/2nq1n2/3p4/8/2N1RN2/PPQ2PPP/3R2K1 w - - 0 15",
      orientation: "white",
      highlights: ["d1", "e3"],
      arrows: [["e3", "d3"]],
    },
    {
      kind: "text",
      heading: "Nimzowitsch's 'pigs': rooks on the 7th",
      body: "Aaron Nimzowitsch coined the term 'pigs' for rooks on the 7th rank — because they devour everything in sight.\n\nA rook on the 7th rank (White's perspective: the rank where Black's pawns start) is enormously powerful:\n• It attacks all undeveloped pawns at their roots\n• It cuts the enemy king off from the rest of the board\n• Two rooks on the 7th (called 'two pigs') can deliver checkmate against a lone king with little support\n\nThis was Nimzowitsch's discovery, formalized in his 1925 masterpiece 'My System': the rook on the 7th is worth a 'psychological premium' beyond its material value.",
      insight:
        "Two rooks on the 7th rank vs. a lone king = checkmate in a few moves, regardless of other material.",
    },
    {
      kind: "interact",
      heading: "Invade the 7th rank",
      instruction:
        "White's rook has a clear highway to the 7th rank. The move is obvious if you know the principle. Find it.",
      fen: "2r3k1/p4ppp/1pq5/8/8/2NQ4/PPP2PPP/1K2R3 w - - 0 1",
      orientation: "white",
      correctMoves: ["e1e7"],
      wrongMoves: ["d3d6", "d3e3", "c3d5"],
      correctExplanation:
        "Re7! invades the 7th rank with devastating effect. The rook on e7 attacks f7, g7, h7, threatens a second rook doubling on the 7th, and puts immediate pressure on the Black position. Black cannot defend all the 7th-rank pawns at once.",
      wrongExplanation:
        "Qd6 invades but can be chased away and threatens nothing concrete. Qe3 and Nd5 are positional moves with no immediate teeth. The winning move is Re7 — the rook crashes to the 7th rank, simultaneously targets f7, g7, and h7, and there is nothing Black can do to meet all threats at once.",
    },
    {
      kind: "choice",
      heading: "Open file quiz",
      question:
        "After a pawn exchange, the d-file is open. Both sides have a rook on d1 (or d8). White plays Rd2, Black plays Rd7. White then plays Rfd1 (second rook). What has White just achieved?",
      choices: [
        "A pin on the d7 rook against the Black king",
        "A rook battery on the d-file, controlling all of d-file",
        "A mating threat on the back rank",
        "Nothing — Black can just play Rfd8 and equalize",
      ],
      correctIndex: 1,
      explanation:
        "White now has a rook battery on the d-file (Rd1 and Rd2 control d1 through d8). No Black piece can safely enter the d-file. If Black plays Rfd8, White can force a favorable trade or penetrate further. The battery is the key strategic achievement — controlling a file completely rather than just occupying it.",
      fen: "3r2k1/3r4/8/8/8/8/3R4/3R2K1 w - - 0 1",
      orientation: "white",
      highlights: ["d1", "d2", "d7", "d8"],
    },
    {
      kind: "choice",
      heading: "Rook activation",
      question:
        "You just castled kingside. You have Ra1 and Rf1. The c-file is semi-open (you have no c-pawn, Black has a c-pawn on c5). What's the most active plan for your rooks?",
      choices: [
        "Keep both rooks behind your pawns for now — wait for the position to clarify",
        "Move Rf1 to c1 to pressure Black's c5 pawn on the semi-open file",
        "Double both rooks on the e-file since e4 is your most advanced pawn",
        "Move Ra1 to b1 to support a b4 pawn advance",
      ],
      correctIndex: 1,
      explanation:
        "Rc1 on the semi-open c-file is immediately active — it pressures Black's c5 pawn and threatens to penetrate via c6 or c7 once the c5 pawn moves. Semi-open files are almost as good as fully open files. Waiting with your rooks is a common mistake — rooks belong on open or semi-open files, and the sooner they get there, the better.",
      fen: "r1bq1rk1/pp3ppp/2np1n2/2p5/4P3/2NB1N2/PP3PPP/R2Q1RK1 w - - 0 1",
      orientation: "white",
      highlights: ["c5", "f1", "c1"],
      arrows: [["f1", "c1"]],
    },
    {
      kind: "text",
      heading: "Which rook, which file?",
      body: "When two open or semi-open files are available, you face a harder question: which rook covers which file? This requires thinking two or three moves ahead — not just 'what is active now', but 'where will BOTH rooks be in three moves?'\n\nThe core principle: before you move a rook, ask what its partner will do. If you send Ra1 to the d-file, that rook is committed. If the a-file opens next move — from a pawn trade or break — you have no rook to exploit it.\n\nLook at the position to the right. White has a queenside pawn majority (a4 and b4). The plan is a4-a5 — and if Black plays bxa5 or axb5, the a-file opens and Ra1 becomes a battering ram. Meanwhile the c-file is already fully open. Before moving, picture the ideal formation: Ra1 on the future open a-file, and the other rook already on c1.",
      fen: "r2qr1k1/pp3ppp/2n2n2/3p4/PP2P3/2N1BN2/3Q1PPP/R4RK1 w - - 0 12",
      orientation: "white",
      highlights: ["a1", "f1", "c1", "a4"],
      arrows: [
        ["f1", "c1"],
        ["a4", "a5"],
      ],
      insight:
        "Always picture your ideal rook formation first, then work backwards to find the right move order.",
    },
    {
      kind: "interact",
      heading: "Which rook to the open file?",
      instruction:
        "The c-file is fully open and a rook belongs there. But White also plans a4-a5 to create a queenside passer. Which rook goes to c1? Think about where both rooks will be in two moves.",
      fen: "r2qr1k1/pp3ppp/2n2n2/3p4/PP2P3/2N1BN2/3Q1PPP/R4RK1 w - - 0 12",
      orientation: "white",
      correctMoves: ["f1c1"],
      wrongMoves: ["a1c1", "d2d3", "a4a5"],
      correctExplanation:
        "Rfc1! White sends the f1 rook to the open c-file — not the a1 rook. The Ra1 stays where it is. When White pushes a4-a5, Ra1 is the perfect rook to support the advance: it can swing to a8 after the a-file opens, invading the 7th or 8th rank. Both rooks end up perfectly placed — Rc1 on the c-file now, Ra1 on the future open a-file.",
      wrongExplanation:
        "Rac1 puts a rook on the right file, but the wrong rook. Ra1 has a specific future: after a4-a5, the a-file opens and Ra1 becomes a powerful passed-pawn support rook or invader via a7-a8. Sending Ra1 to c1 abandons that plan and forces you to waste tempos later. Rfc1 achieves the same immediate goal while keeping Ra1 in reserve for the queenside break.",
    },
    {
      kind: "text",
      heading: "The one rule",
      body: "Rook activity reduces to one principle:\n\nGet your rooks to open files, and keep them there.\n\nBefore castling, ask: which file will open? After castling, ask: how do I double my rooks on it? After doubling, ask: can one rook penetrate to the 7th?\n\nThe rook doesn't need to capture anything to be powerful. A rook on d7 that attacks f7 and h7 ties down two Black pieces purely by existing there. That's positional chess: pressure that costs your opponent time, space, and eventually material.",
      insight:
        "Alekhine's rule: 'Before moving your rook, find the file. Before finding the file, open it.'",
    },
  ],
};

/* ─────────────────────────────────────────────────────────────── */
/*  Lesson: The Knight Outpost                                      */
/* ─────────────────────────────────────────────────────────────── */

const KNIGHT_OUTPOST_LESSON: Lesson = {
  id: "knight-outpost-2000",
  band: "2000",
  title: "The Square That Belongs to No Pawn",
  subtitle: "Knight outposts, blockades, and the art of prophylaxis",
  icon: "♞",
  estimatedMinutes: 9,
  tags: ["knights", "outpost", "middlegame", "strategy", "positional"],
  slides: [
    {
      kind: "text",
      heading: "What is an outpost?",
      body: "An outpost is a square that an enemy pawn can never attack. To qualify, two conditions must be met:\n1. No enemy pawn occupies the square's file or can advance to attack it\n2. The square is supported by at least one of your own pawns\n\nA knight on an outpost is uniquely powerful. Unlike bishops (blocked by same-colored pawns) or rooks (need open files), a knight on an outpost simply sits — controlling up to 8 squares, immune to pawn attack, a constant thorn that cannot be removed without conceding something.\n\nNimzowitsch called it 'the square that belongs to you forever.'",
      fen: "r1bq1rk1/pp3ppp/2nb1n2/3pN3/3P4/2NB4/PPP1QPPP/R1B2RK1 w - - 0 12",
      orientation: "white",
      highlights: ["e5"],
      insight:
        "An outpost knight in the center can be worth more than a bishop — it's a permanent stronghold that ties down the opponent.",
    },
    {
      kind: "replay",
      heading: "The French Defence: an outpost built to last",
      body: "In the French Advanced with 4.e5 and 5.f4, after Black plays c5 and White recaptures with Nxd4 — the knight lands on d4, a square that no Black pawn can EVER attack. Black's c-pawn was traded away, and the e5 pawn blocks any pawn counterplay on the e-file. This is a truly permanent outpost.",
      moves: [
        "d2d4",
        "e7e6",
        "e2e4",
        "d7d5",
        "b1c3",
        "g8f6",
        "e4e5",
        "f6d7",
        "f2f4",
        "c7c5",
        "g1f3",
        "b8c6",
        "c1e3",
        "c5d4",
        "f3d4",
      ],
      orientation: "white",
      intervalMs: 800,
      badges: {
        15: { sq: "d4", cls: "brilliant" },
      },
    },
    {
      kind: "text",
      heading: "Karpov: the master of positional suffocation",
      body: "Anatoly Karpov won the World Championship in 1975 without playing a single game — Fischer refused to defend. He then held the title for a decade through sheer positional mastery.\n\nKarpov's trademark was the knight outpost. Game after game, he would maneuver a knight to c5 or e5, and then systematically restrict his opponent's pieces until they had no useful moves. His opponents called it 'the boa constrictor' — they weren't being attacked, just slowly squeezed to death.\n\nHis most famous technique: plant a knight on an outpost, prevent all counterplay, then trade it for the opponent's most important defensive piece — leaving a winning endgame.",
      insight:
        "Karpov: 'Chess is not about tactics — it's about which side has no good moves.'",
      photo: {
        src: "/chess-legends/karpov-2011.jpg",
        credit:
          "Ahsoous, CC BY-SA 3.0, via Wikimedia Commons (Anatoly Karpov, 2011)",
      },
    },
    {
      kind: "text",
      heading: "When the knight beats the bishop",
      body: "In closed positions, knights are often stronger than bishops — and an outpost knight on the right square can be worth far more than even a pair of bishops.\n\nA bishop is limited to squares of one color. If your opponent's pawns are fixed on the same color as their bishop (say, light squares), their bishop is blocked by its own pawns. Your knight laughs at pawn color — it jumps from dark to light square freely.\n\nThe rule of thumb: if the game has many locked pawn chains with no open files, knights dominate. If the board is open with diagonal highways, bishops rule. Choose your pieces — and your outpost — accordingly.",
      fen: "4k3/3p1pp1/1n1Pp3/3pN3/3P4/4K3/5PPP/8 w - - 0 1",
      orientation: "white",
      highlights: ["e5", "b6"],
      insight:
        "Knight on e5 vs. knight on b6: one is in the center, active, outposted. The other is on the rim, passive. Same piece, wildly different value.",
    },
    {
      kind: "interact",
      heading: "Find the outpost square",
      instruction:
        "White has a perfect outpost square waiting. Black's pawn structure has no way to challenge it. Find the knight move that establishes permanent dominance.",
      fen: "r1bq1rk1/pp2bppp/4pn2/3p4/3P4/2N2NP1/PP3PBP/R2Q1RK1 w - - 0 12",
      orientation: "white",
      correctMoves: ["f3e5"],
      wrongMoves: ["f3g5", "f3d2", "c3b5"],
      correctExplanation:
        "Ne5! is the dream outpost. From e5, the knight controls d3, f3, c4, c6, d7, f7, g4, g6. Black's Pe6 and Pd5 cannot attack e5 (pawns only attack diagonally forward — from e6 Black attacks d5 and f5, never e5; from d5 Black attacks c4 and e4, never e5). The outpost is permanent.",
      wrongExplanation:
        "Ng5 attacks h7 but has no future outpost and Black plays h6. Nb5 attacks c7 but Black plays a6 and the knight retreats. The long-term winning move is Ne5 — it lands on the most powerful square in the position and stays there forever.",
    },
    {
      kind: "text",
      heading: "Nimzowitsch and the art of blockade",
      body: "Aaron Nimzowitsch revolutionized chess strategy with his 1925 book 'My System.' His central idea: the blockade.\n\nA pawn that cannot advance is worthless. The way to make it worthless is to plant a piece — ideally a knight — directly in front of it. The blockader doesn't just stop the pawn; it gains a permanent stronghold square from which it attacks in all directions.\n\nNimzowitsch took this further: he argued that a knight blockading a passed pawn on d6 was actively restricting an entire position, forcing the opponent's rooks and bishops into passive defense roles. The blockade is both defensive and offensive at the same time.",
      insight:
        "Nimzowitsch: 'The pawn on d6 is weak. But it is the knight on d5, sitting in front of it, that is strong.'",
      photo: {
        src: "/chess-legends/nimzowitsch-1930.jpg",
        credit:
          "Public domain — Aron Nimzowitsch, circa 1930 (Wikimedia Commons)",
      },
    },
    {
      kind: "replay",
      heading: "The knight that couldn't be moved",
      body: "White maneuvers a knight via b5 to d6 — deep inside Black's camp. The knight on d6 blocks the d5 pawn, attacks c8 and f7, and permanently buries Black's bishop on c8. No Black pawn can ever challenge d6: the c-pawn was traded away on move 7, and the d5 and f7 pawns don't attack that square.",
      moves: [
        "d2d4",
        "d7d5",
        "c2c4",
        "e7e6",
        "b1c3",
        "g8f6",
        "g1f3",
        "c7c5",
        "c4d5",
        "e6d5",
        "g2g3",
        "b8c6",
        "f1g2",
        "c5d4",
        "f3d4",
        "f8b4",
        "e1g1",
        "e8g8",
        "d4b5",
        "f8e8",
        "b5d6",
      ],
      orientation: "white",
      intervalMs: 800,
      badges: {
        21: { sq: "d6", cls: "brilliant" },
      },
    },
    {
      kind: "interact",
      heading: "Challenge the outpost",
      instruction:
        "Black has an aggressive knight planted on e5. You must displace it — or allow Black to dominate the center forever. Find the correct challenge.",
      fen: "r1bq1rk1/ppp2ppp/2n2n2/4n3/3PP3/2N2N2/PPP2PPP/R1BQ1RK1 w - - 0 9",
      orientation: "white",
      correctMoves: ["f2f4"],
      wrongMoves: ["d4d5", "f3e5", "c3e2"],
      correctExplanation:
        "f4! directly attacks the Black Ne5 and forces it to move. After Nxf3+ Qxf3 or Nd3 Qe3, White recentralizes and the outpost is gone. This is the key anti-outpost strategy: use your own pawn structure to threaten the knight, forcing a retreat or an exchange that relieves your positional pressure.",
      wrongExplanation:
        "d5 attacks the Nc6 but ignores the Ne5 outpost — the real danger. Nxe5 trades the knight but lets Black recapture and keep the e5 outpost concept alive. f4 is the direct, principled challenge: attack the outpost with a pawn, the only piece a knight can't capture back.",
    },
    {
      kind: "choice",
      heading: "Outpost or not?",
      question:
        "White has a knight on e5. Black's pawn structure is: pawns on d5, f7, g6, h7. Is this a true outpost?",
      choices: [
        "Yes — Black has no pawn that can attack e5",
        "No — Black can play f6 next move to attack the knight",
        "Yes — but only if White has a pawn on d4 supporting it",
        "No — the knight can be traded off by Nd4 or similar pieces",
      ],
      correctIndex: 0,
      explanation:
        "Black's Pd5 attacks c4 and e4 — NOT e5 (pawns only attack diagonally forward, and e5 is behind d5 from Black's perspective). Black's Pf7 could eventually advance to f6 to attack the knight, but right now e5 IS a true outpost. Black would have to weaken the kingside with f6 to dislodge it — and that weakness is often permanent. A square is an outpost if no enemy pawn currently attacks it.",
      fen: "r1bq1rk1/pp3p1p/3p2p1/3pN3/4P3/2NB4/PP3PPP/R2QK2R w KQ - 0 1",
      orientation: "white",
      highlights: ["e5", "d5", "f7"],
      arrows: [
        ["d5", "c4"],
        ["d5", "e4"],
      ],
    },
    {
      kind: "choice",
      heading: "Prophylaxis: prevent the outpost",
      question:
        "You notice your opponent is planning Ne4→c5, landing the knight on an outpost on c5. Your c4-pawn was just captured. What's the prophylactic response?",
      choices: [
        "Attack the knight on e4 immediately with d3 to force it back",
        "Play b4 to reclaim the c5 square and deny the outpost before it forms",
        "Ignore it and focus on your own attack — the outpost isn't dangerous yet",
        "Trade the knight with Nxe4 to simplify the position",
      ],
      correctIndex: 1,
      explanation:
        "b4! is prophylaxis — Petrosian's great contribution to chess. By advancing b4, you deny the c5 square: after b4, the b4-pawn attacks c5, making Nc5 impossible (the knight would be immediately captured by bxc5). Petrosian taught that the best time to stop a plan is BEFORE it happens. 'An ounce of prevention is worth a pound of cure' — and in chess, an ounce of prophylaxis is worth a rook.",
      fen: "r2q1rk1/pp3ppp/2p1p3/8/4n3/3B1N2/PP3PPP/R1BQR1K1 w - - 0 1",
      orientation: "white",
      highlights: ["e4", "c5", "b2"],
      arrows: [
        ["e4", "c5"],
        ["b2", "b4"],
      ],
    },
    {
      kind: "text",
      heading: "Petrosian's invisible hand",
      body: "Tigran Petrosian became World Champion in 1963 not by attacking, but by preventing. His concept of 'prophylaxis' meant identifying and eliminating every threat BEFORE it materialized.\n\nHis opponents would find, move after move, that their best plans were no longer possible — not because Petrosian attacked them, but because he'd quietly placed pawns and pieces to make those plans impossible. By the time they realized what had happened, their position was already lost.\n\nHis greatest achievement: making chess feel inevitable. If Karpov was the boa constrictor, Petrosian was the cage. You couldn't even begin to fight back.",
      insight:
        "Petrosian: 'The beauty of a move lies not in its appearance but in the thought behind it.'",
    },
    {
      kind: "text",
      heading: "The one rule",
      body: "All outpost strategy reduces to one principle:\n\nFind the square that no enemy pawn can attack, put your knight there, and make it permanent.\n\nIf you're attacking: establish the outpost early, support it with pawns, and then use it as a launching pad for your other pieces.\n\nIf you're defending: identify which square your opponent is targeting before the knight gets there. A pawn advance that denies the square costs almost nothing. A knight on that square for 30 moves costs everything.",
      insight:
        "Nimzowitsch's golden rule: 'An outpost is only useful if you can maintain it.' Fight to keep your knight there — and fight to keep theirs out.",
    },
  ],
};

const LESSONS: Lesson[] = [
  INITIATIVE_LESSON,
  OPENINGS_LESSON,
  TIME_LESSON,
  PASSED_PAWN_LESSON,
  OPEN_FILES_LESSON,
  KNIGHT_OUTPOST_LESSON,
  ...NEW_LESSONS,
];

/* ─────────────────────────────────────────────────────────────── */
/*  ELO band metadata                                               */
/* ─────────────────────────────────────────────────────────────── */

const BAND_LABELS: Record<RatingBand, string> = {
  "800": "800 – 1200",
  "1200": "1200 – 1600",
  "1600": "1600 – 2000",
  "2000": "2000+",
};

const BAND_DESCRIPTIONS: Record<RatingBand, string> = {
  "800": "Fundamentals — basic tactics and piece safety",
  "1200": "Patterns — pawn structure and coordination",
  "1600": "Strategy — planning and complex positions",
  "2000": "Mastery — initiative, dynamics, and compensation",
};

const BAND_COLORS: Record<
  RatingBand,
  { bg: string; text: string; ring: string; pill: string }
> = {
  "800": {
    bg: "bg-emerald-500/[0.08]",
    text: "text-emerald-300",
    ring: "ring-emerald-500/30",
    pill: "bg-emerald-500/20 text-emerald-300",
  },
  "1200": {
    bg: "bg-sky-500/[0.08]",
    text: "text-sky-300",
    ring: "ring-sky-500/30",
    pill: "bg-sky-500/20 text-sky-300",
  },
  "1600": {
    bg: "bg-amber-500/[0.08]",
    text: "text-amber-300",
    ring: "ring-amber-500/30",
    pill: "bg-amber-500/20 text-amber-300",
  },
  "2000": {
    bg: "bg-purple-500/[0.08]",
    text: "text-purple-300",
    ring: "ring-purple-500/30",
    pill: "bg-purple-500/20 text-purple-300",
  },
};

/* ─────────────────────────────────────────────────────────────── */
/*  LessonProgress                                                  */
/* ─────────────────────────────────────────────────────────────── */

function LessonProgress({
  current,
  total,
}: {
  current: number;
  total: number;
}) {
  return (
    <div className="flex gap-1">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={`h-1 flex-1 rounded-full transition-all duration-300 ${
            i < current
              ? "bg-purple-500"
              : i === current
                ? "bg-purple-400/70"
                : "bg-white/[0.08]"
          }`}
        />
      ))}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────── */
/*  LessonBoard                                                     */
/* ─────────────────────────────────────────────────────────────── */

function LessonBoard({
  fen,
  orientation = "white",
  highlights = [],
  arrows = [],
  onDrop,
  onSquareClick,
  draggable = false,
  customSquareStyles = {},
  showEval = false,
  badgeSquare,
  badgeClassification,
}: {
  fen: string;
  orientation?: "white" | "black";
  highlights?: string[];
  arrows?: [string, string][];
  onDrop?: (from: string, to: string) => boolean;
  onSquareClick?: (sq: string) => void;
  draggable?: boolean;
  customSquareStyles?: Record<string, React.CSSProperties>;
  showEval?: boolean;
  badgeSquare?: string;
  badgeClassification?: MoveClassification;
}) {
  const boardTheme = useBoardTheme();
  const customPieces = useCustomPieces();
  const { ref, size } = useBoardSize(480);
  const [evalCp, setEvalCp] = useState<number | null>(null);

  useEffect(() => {
    if (!showEval) return;
    let cancelled = false;
    stockfishClient.evaluateFen(fen, 16).then((e) => {
      if (!cancelled) {
        // Stockfish returns cp from side-to-move perspective; normalize to White's perspective
        const turn = fen.split(" ")[1]; // "w" or "b"
        const cp = e?.cp ?? null;
        setEvalCp(cp !== null && turn === "b" ? -cp : cp);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [fen, showEval]);

  const hlStyles: Record<string, React.CSSProperties> = {};
  for (const sq of highlights) {
    hlStyles[sq] = { backgroundColor: "rgba(251,191,36,0.38)" };
  }

  const cbArrows = arrows.map(
    ([f, t]) => [f, t, "rgba(139,92,246,0.7)"] as [string, string, string],
  );

  const squareRenderer = useMemo(() => {
    if (!badgeSquare || !badgeClassification) return undefined;
    return (props: any) => (
      <div style={props?.style} className="relative h-full w-full">
        {props?.children}
        {props?.square === badgeSquare && (
          <MoveBadge classification={badgeClassification} variant="corner" />
        )}
      </div>
    );
  }, [badgeSquare, badgeClassification]);

  return (
    <div className="flex gap-2 items-start">
      {showEval && <EvalBar evalCp={evalCp} height={size} />}
      <div
        ref={ref}
        className="relative flex-1 overflow-hidden rounded-2xl ring-1 ring-white/[0.08]"
      >
        <Chessboard
          position={fen}
          boardOrientation={orientation}
          boardWidth={size}
          arePiecesDraggable={draggable}
          onPieceDrop={onDrop}
          onSquareClick={onSquareClick}
          customArrows={cbArrows}
          customSquareStyles={{ ...hlStyles, ...customSquareStyles }}
          customDarkSquareStyle={{ backgroundColor: boardTheme.darkSquare }}
          customLightSquareStyle={{ backgroundColor: boardTheme.lightSquare }}
          customPieces={customPieces}
          animationDuration={200}
          customSquare={squareRenderer as any}
        />
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────── */
/*  TextSlideView                                                   */
/* ─────────────────────────────────────────────────────────────── */

function TextSlideView({
  slide,
  onNext,
}: {
  slide: TextSlide;
  onNext: () => void;
}) {
  const handleAdvance = useCallback(() => {
    playSound("select");
    onNext();
  }, [onNext]);

  if (slide.fen) {
    return (
      <div className="mx-auto w-full max-w-5xl grid lg:grid-cols-2 gap-8 lg:items-center">
        {/* Content: first in DOM so heading shows above board on mobile */}
        <div className="flex flex-col gap-5 lg:order-last">
          <h2 className="text-2xl font-black tracking-tight text-white leading-snug">
            {slide.heading}
          </h2>
          <p className="text-[15px] leading-7 text-slate-300 whitespace-pre-line">
            {slide.body}
          </p>
          {slide.insight && (
            <div className="rounded-2xl border border-purple-500/25 bg-purple-500/[0.07] px-5 py-4">
              <p className="text-[11px] font-black uppercase tracking-widest text-purple-400 mb-1.5">
                💡 Key insight
              </p>
              <p className="text-sm leading-relaxed text-purple-200/80">
                {slide.insight}
              </p>
            </div>
          )}
          <button
            type="button"
            onClick={handleAdvance}
            className="w-full rounded-2xl bg-gradient-to-r from-purple-600 to-violet-500 py-3.5 text-base font-bold text-white shadow-lg shadow-purple-500/20 hover:brightness-110 active:scale-[0.98] transition-all"
          >
            Got it →
          </button>
        </div>
        <LessonBoard
          fen={slide.fen}
          orientation={slide.orientation}
          highlights={slide.highlights}
          arrows={slide.arrows}
          draggable={false}
          showEval
        />
      </div>
    );
  }

  if (slide.photo) {
    return (
      <div className="mx-auto w-full max-w-5xl grid lg:grid-cols-2 gap-8 lg:items-center">
        {/* Text: first in DOM so heading appears above photo on mobile */}
        <div className="flex flex-col gap-5 lg:order-last">
          <h2 className="text-2xl font-black tracking-tight text-white leading-snug">
            {slide.heading}
          </h2>
          <p className="text-[15px] leading-7 text-slate-300 whitespace-pre-line">
            {slide.body}
          </p>
          {slide.insight && (
            <div className="rounded-2xl border border-purple-500/25 bg-purple-500/[0.07] px-5 py-4">
              <p className="text-[11px] font-black uppercase tracking-widest text-purple-400 mb-1.5">
                💡 Key insight
              </p>
              <p className="text-sm leading-relaxed text-purple-200/80">
                {slide.insight}
              </p>
            </div>
          )}
          <button
            type="button"
            onClick={handleAdvance}
            className="w-full rounded-2xl bg-gradient-to-r from-purple-600 to-violet-500 py-3.5 text-base font-bold text-white shadow-lg shadow-purple-500/20 hover:brightness-110 active:scale-[0.98] transition-all"
          >
            Got it →
          </button>
        </div>
        {/* Photo */}
        <div className="flex flex-col gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={slide.photo.src}
            alt={slide.heading}
            className="w-full rounded-2xl object-cover"
          />
          <p className="text-[10px] leading-relaxed text-slate-500 px-0.5">
            {slide.photo.credit}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="mx-auto flex max-w-lg flex-col gap-5 cursor-pointer select-none"
      onClick={handleAdvance}
    >
      <h2 className="text-2xl font-black tracking-tight text-white leading-snug">
        {slide.heading}
      </h2>

      <p className="text-[15px] leading-7 text-slate-300 whitespace-pre-line">
        {slide.body}
      </p>

      {slide.insight && (
        <div className="rounded-2xl border border-purple-500/25 bg-purple-500/[0.07] px-5 py-4">
          <p className="text-[11px] font-black uppercase tracking-widest text-purple-400 mb-1.5">
            💡 Key insight
          </p>
          <p className="text-sm leading-relaxed text-purple-200/80">
            {slide.insight}
          </p>
        </div>
      )}

      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          handleAdvance();
        }}
        className="w-full rounded-2xl bg-gradient-to-r from-purple-600 to-violet-500 py-3.5 text-base font-bold text-white shadow-lg shadow-purple-500/20 hover:brightness-110 active:scale-[0.98] transition-all"
      >
        I see it →
      </button>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────── */
/*  ReplaySlideView — animated move sequence                        */
/* ─────────────────────────────────────────────────────────────── */

function ReplaySlideView({
  slide,
  onNext,
}: {
  slide: ReplaySlide;
  onNext: () => void;
}) {
  const START_FEN =
    slide.startFen ??
    "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

  // Pre-compute all positions + SAN labels once
  const [frames] = useState<
    {
      fen: string;
      san: string | null;
      from: string | null;
      to: string | null;
    }[]
  >(() => {
    const result: {
      fen: string;
      san: string | null;
      from: string | null;
      to: string | null;
    }[] = [{ fen: START_FEN, san: null, from: null, to: null }];
    const chess = new Chess(START_FEN);
    for (const uci of slide.moves) {
      try {
        const from = uci.slice(0, 2);
        const to = uci.slice(2, 4);
        const promotion = (uci[4] as "q" | "r" | "b" | "n") ?? "q";
        const m = chess.move({ from, to, promotion });
        if (m) result.push({ fen: chess.fen(), san: m.san, from, to });
      } catch {
        break;
      }
    }
    return result;
  });

  const [idx, setIdx] = useState(0);
  const [playing, setPlaying] = useState(true);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [frameEvals, setFrameEvals] = useState<Map<string, number | null>>(
    () => new Map(),
  );
  const done = idx >= frames.length - 1;

  useEffect(() => {
    preloadSounds();
  }, []);

  // Pre-fetch Stockfish evals for every frame so badges resolve as animation plays.
  // Skip entirely if the slide already has pre-baked badges for all non-zero frames.
  useEffect(() => {
    const prebaked = slide.badges ?? {};
    const needsEval = frames.some((_, i) => i > 0 && prebaked[i] == null);
    if (!needsEval) return; // all badges pre-baked — no Stockfish needed

    let cancelled = false;
    frames.forEach((f, i) => {
      if (i > 0 && prebaked[i] != null) return; // skip pre-baked frames
      stockfishClient.evaluateFen(f.fen, 10).then((e) => {
        if (cancelled) return;
        const turn = f.fen.split(" ")[1];
        const cp = e?.cp ?? null;
        const normalized = cp !== null && turn === "b" ? -cp : cp;
        setFrameEvals((prev) => {
          const next = new Map(prev);
          next.set(f.fen, normalized ?? null);
          return next;
        });
      });
    });
    return () => {
      cancelled = true;
    };
  }, [frames, slide.badges]);

  // Auto-advance
  useEffect(() => {
    if (!playing || done) {
      if (done) setPlaying(false);
      return;
    }
    const nextSan = frames[idx + 1]?.san ?? "";
    timerRef.current = setTimeout(() => {
      setIdx((i) => i + 1);
      playSound(nextSan.includes("x") ? "capture" : "move");
    }, slide.intervalMs ?? 900);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [playing, idx, done, slide.intervalMs]);

  const frame = frames[idx];
  const sqStyles: Record<string, React.CSSProperties> = {};
  if (frame.from)
    sqStyles[frame.from] = { backgroundColor: "rgba(255,170,0,0.30)" };
  if (frame.to)
    sqStyles[frame.to] = { backgroundColor: "rgba(255,170,0,0.45)" };

  const moveLabel = (() => {
    if (idx === 0) return "Starting position";
    const moveNum = Math.ceil(idx / 2);
    const isWhite = idx % 2 === 1;
    return `${moveNum}${isWhite ? "." : "..."} ${frames[idx].san ?? ""}`;
  })();

  // Auto-classify the current move using pre-fetched Stockfish evals
  const autoBadge = useMemo(():
    | { sq: string; cls: MoveClassification }
    | undefined => {
    if (idx === 0 || !frame.to || !frame.from) return undefined;
    const prevFrame = frames[idx - 1];
    if (!prevFrame) return undefined;
    const evalBefore = frameEvals.get(prevFrame.fen);
    const evalAfter = frameEvals.get(frame.fen);
    if (evalBefore == null || evalAfter == null) return undefined;
    const turn = prevFrame.fen.split(" ")[1]; // side that moved
    const cpLoss = Math.max(
      0,
      turn === "w" ? evalBefore - evalAfter : evalAfter - evalBefore,
    );
    const evalBeforeMover = turn === "w" ? evalBefore : -evalBefore;
    const evalAfterMover = turn === "w" ? evalAfter : -evalAfter;
    const cls = classifyMoveQuality({
      cpLoss,
      isBestMove: cpLoss < 5,
      evalBeforeMover,
      evalAfterMover,
      fenBefore: prevFrame.fen,
      moveUci: `${frame.from}${frame.to}`,
      moveIndex: idx - 1,
    });
    return { sq: frame.to, cls };
  }, [idx, frames, frame, frameEvals]);

  // Manual badge overrides (slide.badges) take priority over auto-classification
  const badge = slide.badges?.[idx] ?? autoBadge;

  return (
    <div className="mx-auto w-full max-w-5xl grid lg:grid-cols-2 gap-8 lg:items-start">
      {/* Right col: heading + body (visible once replay ends) */}
      <div className="flex flex-col gap-5 lg:order-last">
        <h2 className="text-2xl font-black tracking-tight text-white leading-snug">
          {slide.heading}
        </h2>
        {done ? (
          <>
            <p className="text-[15px] leading-7 text-slate-300 whitespace-pre-line">
              {slide.body}
            </p>
            <button
              type="button"
              onClick={() => {
                playSound("select");
                onNext();
              }}
              className="w-full rounded-2xl bg-gradient-to-r from-purple-600 to-violet-500 py-3.5 text-base font-bold text-white shadow-lg shadow-purple-500/20 hover:brightness-110 active:scale-[0.98] transition-all"
            >
              Got it →
            </button>
          </>
        ) : (
          <p className="text-sm text-slate-500">
            Watch the moves play out, then continue when ready.
          </p>
        )}
      </div>

      {/* Left col: board + move label + controls */}
      <div className="flex flex-col gap-4">
        <LessonBoard
          fen={frame.fen}
          orientation={slide.orientation ?? "white"}
          draggable={false}
          customSquareStyles={sqStyles}
          showEval
          badgeSquare={badge?.sq}
          badgeClassification={badge?.cls}
        />

        {/* Move label + counter */}
        <div className="flex items-center justify-between px-1">
          <span className="text-[13px] font-semibold text-slate-300">
            {moveLabel}
          </span>
          <span className="text-[11px] text-slate-600">
            {idx} / {frames.length - 1}
          </span>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-2">
          <button
            type="button"
            onClick={() => {
              playSound("select");
              setPlaying(false);
              setIdx(0);
            }}
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/[0.06] text-slate-400 hover:bg-white/[0.10] transition-colors"
            title="Reset"
          >
            ⏮
          </button>
          <button
            type="button"
            onClick={() => {
              playSound("select");
              setPlaying(false);
              setIdx((i) => Math.max(0, i - 1));
            }}
            disabled={idx <= 0}
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/[0.06] text-slate-400 hover:bg-white/[0.10] disabled:opacity-30 transition-colors"
            title="Previous move"
          >
            ◀
          </button>
          <button
            type="button"
            onClick={() => {
              playSound("select");
              if (done) {
                setIdx(0);
                setPlaying(true);
              } else {
                setPlaying((p) => !p);
              }
            }}
            className="flex h-11 w-11 items-center justify-center rounded-2xl bg-purple-600 text-white hover:brightness-110 transition-all shadow-lg shadow-purple-500/20"
            title={playing ? "Pause" : done ? "Replay" : "Play"}
          >
            {playing ? "⏸" : done ? "↺" : "▶"}
          </button>
          <button
            type="button"
            onClick={() => {
              const nextIdx = Math.min(frames.length - 1, idx + 1);
              playSound(
                frames[nextIdx]?.san?.includes("x") ? "capture" : "move",
              );
              setPlaying(false);
              setIdx(nextIdx);
            }}
            disabled={done}
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/[0.06] text-slate-400 hover:bg-white/[0.10] disabled:opacity-30 transition-colors"
            title="Next move"
          >
            ▶
          </button>
          <button
            type="button"
            onClick={() => {
              playSound("select");
              setPlaying(false);
              setIdx(frames.length - 1);
            }}
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/[0.06] text-slate-400 hover:bg-white/[0.10] transition-colors"
            title="Skip to end"
          >
            ⏭
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────── */
/*  LiveInteractSlide — fetches a real Lichess puzzle              */
/* ─────────────────────────────────────────────────────────────── */

function LiveInteractSlide({
  slide,
  onNext,
}: {
  slide: InteractSlide;
  onNext: () => void;
}) {
  const [loadState, setLoadState] = useState<"fetching" | "error" | "ready">(
    "fetching",
  );
  const [fen, setFen] = useState("");
  const [triggerPlayed, setTriggerPlayed] = useState(false);
  const [solutionMoves, setSolutionMoves] = useState<string[]>([]);
  const [orientation, setOrientation] = useState<"white" | "black">("white");
  const [moveIdx, setMoveIdx] = useState(0);
  const [solveState, setSolveState] = useState<"playing" | "correct">(
    "playing",
  );
  const [attempts, setAttempts] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [legalSqs, setLegalSqs] = useState<string[]>([]);
  const [hintSq, setHintSq] = useState<string | null>(null);
  const [lastMove, setLastMove] = useState<{ from: string; to: string } | null>(
    null,
  );
  const fetched = useRef(false);
  const gameRef = useRef(new Chess());
  const preFenRef = useRef("");
  const triggerRef = useRef<{ from: string; to: string } | null>(null);

  useEffect(() => {
    preloadSounds();
  }, []);

  useEffect(() => {
    if (fetched.current || !slide.fetchTheme) return;
    fetched.current = true;
    fetch(`/api/puzzles?themes=${slide.fetchTheme}&count=1`)
      .then((r) => r.json())
      .then((data) => {
        const p = data.puzzles?.[0];
        if (!p) {
          setLoadState("error");
          return;
        }
        const pgn: string = p.game?.pgn ?? "";
        const initialPly: number = p.puzzle?.initialPly ?? 0;
        const solution: string[] = p.puzzle?.solution ?? [];
        if (!pgn || solution.length === 0) {
          setLoadState("error");
          return;
        }
        const full = new Chess();
        full.loadPgn(pgn);
        const history = full.history({ verbose: true });
        const board = new Chess();
        for (let i = 0; i < Math.min(initialPly, history.length); i++) {
          board.move(history[i].san);
        }
        preFenRef.current = board.fen();
        let tFrom: string | null = null,
          tTo: string | null = null;
        if (initialPly < history.length) {
          const m = history[initialPly];
          tFrom = m.from;
          tTo = m.to;
          board.move(m.san);
        }
        gameRef.current = new Chess(board.fen());
        if (tFrom && tTo) triggerRef.current = { from: tFrom, to: tTo };
        setFen(preFenRef.current);
        setSolutionMoves(solution);
        setOrientation(board.turn() === "w" ? "white" : "black");
        setLoadState("ready");
      })
      .catch(() => setLoadState("error"));
  }, [slide.fetchTheme]);

  // Animate the opponent's trigger move before handing control to the player
  useEffect(() => {
    if (loadState !== "ready" || triggerPlayed) return;
    const t = setTimeout(() => {
      setFen(gameRef.current.fen());
      if (triggerRef.current) setLastMove(triggerRef.current);
      playSound("move");
      setTriggerPlayed(true);
    }, 700);
    return () => clearTimeout(t);
  }, [loadState, triggerPlayed]);

  const uciParts = (uci: string) => ({
    from: uci.slice(0, 2),
    to: uci.slice(2, 4),
    promotion: (uci[4] || "q") as "q" | "r" | "b" | "n",
  });

  const handleDrop = useCallback(
    (from: string, to: string): boolean => {
      if (
        !triggerPlayed ||
        solveState !== "playing" ||
        moveIdx >= solutionMoves.length
      )
        return false;
      const exp = uciParts(solutionMoves[moveIdx]);
      if (from !== exp.from || to !== exp.to) {
        playSound("wrong");
        const a = attempts + 1;
        setAttempts(a);
        if (a >= 2) setHintSq(exp.from);
        return false;
      }
      const newGame = new Chess(gameRef.current.fen());
      let m;
      try {
        m = newGame.move({ from, to, promotion: exp.promotion });
      } catch {
        return false;
      }
      playSound(
        newGame.isCheck() ? "check" : m?.captured ? "capture" : "correct",
      );
      gameRef.current = new Chess(newGame.fen());
      setFen(newGame.fen());
      setLastMove({ from, to });
      setHintSq(null);
      setSelected(null);
      setLegalSqs([]);
      const nextIdx = moveIdx + 1;
      if (nextIdx >= solutionMoves.length) {
        setSolveState("correct");
        setTimeout(onNext, 1400);
        return true;
      }
      // Play the opponent's response automatically
      const opp = uciParts(solutionMoves[nextIdx]);
      setTimeout(() => {
        const g2 = new Chess(gameRef.current.fen());
        let oppMove;
        try {
          oppMove = g2.move({
            from: opp.from,
            to: opp.to,
            promotion: opp.promotion,
          });
        } catch {
          /* ignore */
        }
        playSound(
          g2.isCheck() ? "check" : oppMove?.captured ? "capture" : "move",
        );
        gameRef.current = new Chess(g2.fen());
        setFen(g2.fen());
        setLastMove({ from: opp.from, to: opp.to });
        setMoveIdx(nextIdx + 1);
      }, 600);
      setMoveIdx(nextIdx);
      return true;
    },
    [triggerPlayed, solveState, moveIdx, solutionMoves, attempts, onNext],
  );

  const handleSquareClick = useCallback(
    (sq: string) => {
      if (!triggerPlayed || solveState !== "playing") return;
      if (!selected) {
        const piece = gameRef.current.get(sq as any);
        if (piece && piece.color === gameRef.current.turn()) {
          setSelected(sq);
          setLegalSqs(
            gameRef.current
              .moves({ square: sq as any, verbose: true })
              .map((m) => m.to),
          );
        }
      } else {
        if (sq === selected) {
          setSelected(null);
          setLegalSqs([]);
          return;
        }
        const moved = handleDrop(selected, sq);
        if (!moved) {
          const piece = gameRef.current.get(sq as any);
          if (piece && piece.color === gameRef.current.turn()) {
            setSelected(sq);
            setLegalSqs(
              gameRef.current
                .moves({ square: sq as any, verbose: true })
                .map((m) => m.to),
            );
            return;
          }
        }
        setSelected(null);
        setLegalSqs([]);
      }
    },
    [triggerPlayed, solveState, selected, handleDrop],
  );

  const sqStyles: Record<string, React.CSSProperties> = {};
  if (lastMove) {
    sqStyles[lastMove.from] = { backgroundColor: "rgba(255,170,0,0.30)" };
    sqStyles[lastMove.to] = { backgroundColor: "rgba(255,170,0,0.45)" };
  }
  if (hintSq)
    sqStyles[hintSq] = {
      boxShadow: "inset 0 0 18px 6px rgba(251,191,36,0.55)",
      borderRadius: "4px",
    };
  if (selected)
    sqStyles[selected] = { backgroundColor: "rgba(255,210,0,0.45)" };
  if (selected && solveState === "playing") {
    for (const sq of legalSqs) {
      const hasPiece = gameRef.current.get(sq as any);
      sqStyles[sq] = hasPiece
        ? {
            background:
              "radial-gradient(circle, transparent 55%, rgba(0,0,0,0.28) 55%)",
            borderRadius: "50%",
          }
        : {
            background:
              "radial-gradient(circle, rgba(0,0,0,0.28) 26%, transparent 26%)",
            borderRadius: "50%",
          };
    }
  }

  if (loadState === "fetching")
    return (
      <div className="flex flex-col items-center gap-3 py-16">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-purple-500 border-t-transparent" />
        <p className="text-sm text-slate-500">Loading position…</p>
      </div>
    );
  if (loadState === "error")
    return (
      <div className="flex flex-col items-center gap-4 py-12 text-center">
        <p className="text-sm text-slate-500">
          Couldn't load puzzle. Try refreshing.
        </p>
        <button
          type="button"
          onClick={() => {
            playSound("select");
            onNext();
          }}
          className="rounded-xl bg-white/[0.06] px-6 py-2.5 text-sm font-semibold text-slate-300 hover:bg-white/[0.1]"
        >
          Skip →
        </button>
      </div>
    );

  const toMoveLabel = orientation === "white" ? "White" : "Black";
  return (
    <div className="mx-auto w-full max-w-5xl grid lg:grid-cols-2 gap-8 lg:items-start">
      {/* Right col: heading + instruction */}
      <div className="flex flex-col gap-4 lg:order-last">
        <div>
          <h2 className="text-2xl font-black tracking-tight text-white">
            {slide.heading}
          </h2>
          <p className="mt-2 text-sm text-slate-400">{slide.instruction}</p>
          <p className="mt-1 text-[11px] font-semibold uppercase tracking-widest text-slate-600">
            {!triggerPlayed ? "Opponent is moving…" : `${toMoveLabel} to move`}
          </p>
        </div>
      </div>

      {/* Left col: board + attempt dots + hint */}
      <div className="flex flex-col gap-3">
        <LessonBoard
          fen={
            fen || "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"
          }
          orientation={orientation}
          onDrop={handleDrop}
          onSquareClick={handleSquareClick}
          draggable={triggerPlayed && solveState === "playing"}
          customSquareStyles={sqStyles}
        />
        {triggerPlayed && solveState === "playing" && (
          <div className="flex items-center justify-center gap-2">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className={`h-2 w-2 rounded-full transition-colors ${i < attempts ? "bg-red-500" : "bg-white/[0.10]"}`}
              />
            ))}
            {hintSq && (
              <span className="ml-2 text-xs text-amber-400">
                💡 Move the highlighted piece
              </span>
            )}
          </div>
        )}
        {!triggerPlayed && (
          <p className="text-center text-xs text-slate-600">
            Opponent&apos;s move is coming…
          </p>
        )}
        {triggerPlayed && solveState === "playing" && (
          <p className="text-center text-xs text-slate-600">
            Find the best move — drag or click
          </p>
        )}
      </div>

      {/* Correct modal */}
      {solveState === "correct" && (
        <>
          <div className="fixed inset-0 z-40 bg-black/50" />
          <div className="fixed bottom-0 left-0 right-0 z-50 rounded-t-3xl border-t border-emerald-500/30 bg-[#060f0a] px-6 pb-10 pt-5">
            <p className="text-[11px] font-black uppercase tracking-widest text-emerald-500 mb-1.5">
              ✓ Correct
            </p>
            <p className="text-sm leading-relaxed text-slate-200">
              {slide.correctExplanation}
            </p>
          </div>
        </>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────── */
/*  InteractSlideView                                               */
/* ─────────────────────────────────────────────────────────────── */

function InteractSlideView({
  slide,
  onNext,
}: {
  slide: InteractSlide;
  onNext: () => void;
}) {
  const [state, setState] = useState<
    "idle" | "evaluating" | "correct" | "wrong"
  >("idle");
  const [attempts, setAttempts] = useState(0);
  const [fen, setFen] = useState(slide.fen ?? "");
  const [selected, setSelected] = useState<string | null>(null);
  const [legalSqs, setLegalSqs] = useState<string[]>([]);
  const [lastMoveTo, setLastMoveTo] = useState<string | null>(null);
  const [moveClassification, setMoveClassification] = useState<
    MoveClassification | undefined
  >(undefined);
  const [showFeedback, setShowFeedback] = useState(false);
  const feedbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const orientation = slide.orientation ?? "white";

  useEffect(() => {
    preloadSounds();
    // Pre-warm Stockfish cache so evaluation is fast when the user plays
    if (slide.fen) stockfishClient.evaluateFen(slide.fen, 14);
    return () => {
      if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
    };
  }, [slide.fen]);

  const schedulePopup = useCallback((delayMs: number) => {
    if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
    setShowFeedback(false);
    feedbackTimerRef.current = setTimeout(() => setShowFeedback(true), delayMs);
  }, []);

  const resetToIdle = useCallback(() => {
    setFen(slide.fen ?? "");
    setState("idle");
    setShowFeedback(false);
    setMoveClassification(undefined);
  }, [slide.fen]);

  const tryMove = useCallback(
    (from: string, to: string): boolean => {
      if (state !== "idle") return false;
      const chess = new Chess(slide.fen ?? "");
      let move;
      try {
        move = chess.move({ from, to, promotion: "q" });
      } catch {
        return false;
      }
      if (!move) return false;

      const uci = from + to;
      const newFen = chess.fen();
      const isCorrect = (slide.correctMoves ?? []).some(
        (m) =>
          m === uci ||
          m === uci + "q" ||
          (m.startsWith(from) && m.slice(2, 4) === to),
      );
      const isExplicitlyWrong = (slide.wrongMoves ?? []).some(
        (m) => m === uci || m === uci + "q",
      );

      // Always land the piece on the board first
      setFen(newFen);
      setLastMoveTo(to);
      setSelected(null);
      setLegalSqs([]);

      if (isCorrect) {
        setMoveClassification(slide.badge ?? "best");
        setState("correct");
        playSound(move.captured ? "capture" : "correct");
        schedulePopup(700);
      } else if (isExplicitlyWrong) {
        setAttempts((a) => a + 1);
        setState("wrong");
        playSound("wrong");
        schedulePopup(400);
      } else {
        // Unknown move — let Stockfish decide
        setState("evaluating");
        const startFen = slide.fen ?? "";
        Promise.all([
          stockfishClient.evaluateFen(startFen, 14),
          stockfishClient.evaluateFen(newFen, 14),
        ])
          .then(([beforeEval, afterEval]) => {
            // cp is from the side-to-move's perspective; cpLoss = before.cp + after.cp
            const cpLoss = (beforeEval?.cp ?? 0) + (afterEval?.cp ?? 0);
            const isBestMove =
              beforeEval?.bestMove != null &&
              beforeEval.bestMove.slice(0, 4) === uci.slice(0, 4);

            if (isBestMove || cpLoss < 10) {
              setMoveClassification("best");
              setState("correct");
              playSound(move.captured ? "capture" : "correct");
              schedulePopup(700);
            } else if (cpLoss < 50) {
              setMoveClassification("good");
              setState("correct");
              playSound(move.captured ? "capture" : "correct");
              schedulePopup(700);
            } else {
              setState("wrong");
              setFen(startFen);
              setAttempts((a) => a + 1);
              playSound("wrong");
              schedulePopup(400);
            }
          })
          .catch(() => {
            setState("wrong");
            setFen(startFen);
            setAttempts((a) => a + 1);
            playSound("wrong");
            schedulePopup(400);
          });
      }
      return true;
    },
    [
      state,
      slide.fen,
      slide.correctMoves,
      slide.wrongMoves,
      slide.badge,
      schedulePopup,
    ],
  );

  const handleDrop = useCallback(
    (from: string, to: string): boolean => {
      const ok = tryMove(from, to);
      setSelected(null);
      setLegalSqs([]);
      return ok;
    },
    [tryMove],
  );

  const handleSquareClick = useCallback(
    (sq: string) => {
      if (state !== "idle") return;
      if (!selected) {
        const chess = new Chess(fen);
        const piece = chess.get(sq as Parameters<typeof chess.get>[0]);
        if (piece && piece.color === chess.turn()) {
          setSelected(sq);
          const moves = chess.moves({ square: sq as any, verbose: true });
          setLegalSqs(moves.map((m) => m.to));
        }
      } else {
        if (sq === selected) {
          setSelected(null);
          setLegalSqs([]);
          return;
        }
        const moved = tryMove(selected, sq);
        if (!moved) {
          const chess = new Chess(fen);
          const piece = chess.get(sq as Parameters<typeof chess.get>[0]);
          if (piece && piece.color === chess.turn()) {
            setSelected(sq);
            const moves = chess.moves({ square: sq as any, verbose: true });
            setLegalSqs(moves.map((m) => m.to));
            return;
          }
        }
        setSelected(null);
        setLegalSqs([]);
      }
    },
    [state, fen, selected, tryMove],
  );

  const squareStyles: Record<string, React.CSSProperties> = {};
  if (selected)
    squareStyles[selected] = { backgroundColor: "rgba(255,210,0,0.45)" };
  if (selected && state === "idle") {
    const chess = new Chess(fen);
    for (const sq of legalSqs) {
      const hasPiece = chess.get(sq as any);
      squareStyles[sq] = hasPiece
        ? {
            background:
              "radial-gradient(circle, transparent 55%, rgba(0,0,0,0.28) 55%)",
            borderRadius: "50%",
          }
        : {
            background:
              "radial-gradient(circle, rgba(0,0,0,0.28) 26%, transparent 26%)",
            borderRadius: "50%",
          };
    }
  }
  if (attempts >= 2 && state === "idle") {
    const hintFrom = (slide.correctMoves ?? [])[0]?.slice(0, 2);
    if (hintFrom)
      squareStyles[hintFrom] = { backgroundColor: "rgba(251,191,36,0.45)" };
  }

  const toMove = (slide.fen ?? "").split(" ")[1] === "b" ? "Black" : "White";

  return (
    <div className="mx-auto w-full max-w-5xl grid lg:grid-cols-2 gap-8 lg:items-start">
      {/* Right col: heading + instruction */}
      <div className="flex flex-col gap-4 lg:order-last">
        <div>
          <h2 className="text-2xl font-black tracking-tight text-white">
            {slide.heading}
          </h2>
          <p className="mt-2 text-sm text-slate-400">{slide.instruction}</p>
          <p className="mt-1 text-[11px] font-semibold uppercase tracking-widest text-slate-600">
            {toMove} to move
          </p>
        </div>
      </div>

      {/* Left col: board + hint */}
      <div className="flex flex-col gap-3">
        <LessonBoard
          fen={fen}
          orientation={orientation}
          onDrop={handleDrop}
          onSquareClick={handleSquareClick}
          draggable={state === "idle"}
          customSquareStyles={squareStyles}
          badgeSquare={
            state === "correct" && lastMoveTo && moveClassification
              ? lastMoveTo
              : undefined
          }
          badgeClassification={
            state === "correct" ? moveClassification : undefined
          }
        />
        <p className="text-center text-xs text-slate-600">
          {state === "evaluating"
            ? "Analysing…"
            : attempts >= 2 && state === "idle"
              ? "💡 Move the highlighted piece"
              : "Drag a piece or click to select"}
        </p>
      </div>

      {/* Feedback modal */}
      {showFeedback && state !== "idle" && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/50"
            onClick={() => {
              if (state === "wrong") resetToIdle();
            }}
          />
          <div
            className={`fixed bottom-0 left-0 right-0 z-50 rounded-t-3xl px-6 pb-10 pt-5 border-t ${
              state === "correct"
                ? "border-emerald-500/30 bg-[#060f0a]"
                : "border-red-500/30 bg-[#0f0606]"
            }`}
          >
            <p
              className={`text-[11px] font-black uppercase tracking-widest mb-1.5 ${
                state === "correct" ? "text-emerald-500" : "text-red-500"
              }`}
            >
              {state === "correct" ? "✓ Correct" : "✗ Not quite"}
            </p>
            <p className="text-sm leading-relaxed text-slate-200">
              {state === "correct"
                ? slide.correctExplanation
                : slide.wrongExplanation}
            </p>
            {state === "correct" ? (
              <button
                type="button"
                onClick={() => {
                  playSound("select");
                  onNext();
                }}
                className="mt-5 w-full rounded-2xl bg-gradient-to-r from-purple-600 to-violet-500 py-3.5 text-base font-bold text-white shadow-lg shadow-purple-500/20 hover:brightness-110 active:scale-[0.98] transition-all"
              >
                Continue →
              </button>
            ) : (
              <button
                type="button"
                onClick={resetToIdle}
                className="mt-5 w-full rounded-2xl border border-red-500/30 bg-red-500/10 py-3.5 text-base font-bold text-red-400 hover:bg-red-500/20 active:scale-[0.98] transition-all"
              >
                Try again →
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────── */
/*  ChoiceSlideView                                                 */
/* ─────────────────────────────────────────────────────────────── */

function ChoiceSlideView({
  slide,
  onNext,
}: {
  slide: ChoiceSlide;
  onNext: () => void;
}) {
  const [selected, setSelected] = useState<number | null>(null);
  const answered = selected !== null;

  const choicesBlock = (
    <div className="flex flex-col gap-2.5">
      {slide.choices.map((choice, i) => {
        const isSelected = selected === i;
        const isCorrect = i === slide.correctIndex;
        let cls =
          "rounded-2xl border px-5 py-4 text-left text-sm font-semibold transition-all duration-200 ";
        if (!answered) {
          cls +=
            "border-white/[0.08] bg-white/[0.03] text-slate-200 hover:border-purple-500/40 hover:bg-purple-500/[0.06] cursor-pointer";
        } else if (isCorrect) {
          cls +=
            "border-emerald-500/40 bg-emerald-500/[0.08] text-emerald-200 cursor-default lesson-choice-correct";
        } else if (isSelected && !isCorrect) {
          cls +=
            "border-red-500/40 bg-red-500/[0.08] text-red-300 cursor-default";
        } else {
          cls +=
            "border-white/[0.04] bg-white/[0.01] text-slate-600 cursor-default";
        }

        return (
          <button
            key={i}
            type="button"
            className={cls}
            onClick={() => {
              if (!answered) {
                playSound(i === slide.correctIndex ? "correct" : "select");
                setSelected(i);
              }
            }}
            disabled={answered}
          >
            <span className="mr-2 font-black text-slate-600">
              {answered
                ? isCorrect
                  ? "✓"
                  : isSelected
                    ? "✗"
                    : String.fromCharCode(65 + i)
                : String.fromCharCode(65 + i)}
              .
            </span>
            {choice}
          </button>
        );
      })}
    </div>
  );

  const explanationAndNext = answered ? (
    <>
      <div className="rounded-2xl border border-purple-500/20 bg-purple-500/[0.06] px-5 py-4">
        <p className="text-sm leading-relaxed text-purple-200/80">
          {slide.explanation}
        </p>
      </div>
      <button
        type="button"
        onClick={() => {
          playSound("select");
          onNext();
        }}
        className="w-full rounded-2xl bg-gradient-to-r from-purple-600 to-violet-500 py-3.5 text-base font-bold text-white shadow-lg shadow-purple-500/20 hover:brightness-110 active:scale-[0.98] transition-all"
      >
        Next →
      </button>
    </>
  ) : null;

  if (slide.fen) {
    return (
      <div className="mx-auto w-full max-w-5xl grid lg:grid-cols-2 gap-8 lg:items-start">
        <div className="flex flex-col gap-5 lg:order-last">
          <div>
            <h2 className="text-2xl font-black tracking-tight text-white">
              {slide.heading}
            </h2>
            <p className="mt-3 text-[15px] leading-7 text-slate-200">
              {slide.question}
            </p>
          </div>
          {choicesBlock}
          {explanationAndNext}
        </div>
        <LessonBoard
          fen={slide.fen}
          orientation={slide.orientation}
          highlights={slide.highlights}
          arrows={slide.arrows}
          draggable={false}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-5">
      <div>
        <h2 className="text-2xl font-black tracking-tight text-white">
          {slide.heading}
        </h2>
        <p className="mt-3 text-[15px] leading-7 text-slate-200">
          {slide.question}
        </p>
      </div>
      {choicesBlock}
      {explanationAndNext}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────── */
/*  Confetti                                                        */
/* ─────────────────────────────────────────────────────────────── */

const CONFETTI_COLORS = [
  "#a855f7",
  "#ec4899",
  "#22c55e",
  "#f59e0b",
  "#3b82f6",
  "#ef4444",
  "#06b6d4",
];

function Confetti() {
  const [particles] = useState(() =>
    Array.from({ length: 36 }).map((_, i) => ({
      id: i,
      left: `${(i / 36) * 100 + (i % 2 === 0 ? 1.5 : -1.5)}%`,
      color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
      dur: `${0.9 + (i % 5) * 0.18}s`,
      delay: `${(i % 7) * 0.07}s`,
      size: `${6 + (i % 4) * 2}px`,
      shape: i % 3 === 0 ? "50%" : "2px",
    })),
  );

  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute confetti-particle"
          style={
            {
              left: p.left,
              top: "-12px",
              width: p.size,
              height: p.size,
              backgroundColor: p.color,
              borderRadius: p.shape,
              "--cf-dur": p.dur,
              "--cf-delay": p.delay,
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────── */
/*  LessonRunner                                                    */
/* ─────────────────────────────────────────────────────────────── */

function LessonRunner({
  lesson,
  onBack,
  onComplete,
}: {
  lesson: Lesson;
  onBack: () => void;
  onComplete: () => void;
}) {
  const [idx, setIdx] = useState(0);
  const [done, setDone] = useState(false);
  const slide = lesson.slides[idx];
  const total = lesson.slides.length;

  const handleNext = useCallback(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    if (idx + 1 >= total) {
      setDone(true);
      earnCoins("study_task");
      playSound("correct");
    } else {
      setIdx((i) => i + 1);
    }
  }, [idx, total]);

  if (done) {
    return (
      <div className="mx-auto flex max-w-sm flex-col items-center gap-6 py-12 text-center">
        <Confetti />
        <div className="flex h-28 w-28 items-center justify-center rounded-3xl bg-gradient-to-br from-amber-400 to-orange-500 text-6xl shadow-2xl shadow-amber-500/30">
          🏆
        </div>
        <div>
          <h2 className="text-3xl font-black tracking-tight text-white">
            Lesson Complete!
          </h2>
          <p className="mt-2 text-sm text-slate-400">{lesson.title}</p>
        </div>
        <div className="w-full rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.06] px-5 py-4">
          <p className="text-sm font-black text-emerald-400">
            +10 coins earned
          </p>
          <p className="mt-0.5 text-[11px] text-emerald-300/50">
            Keep practicing daily
          </p>
        </div>
        <div className="flex w-full flex-col gap-2.5">
          <button
            type="button"
            onClick={() => {
              playSound("select");
              onComplete();
            }}
            className="w-full rounded-2xl bg-gradient-to-r from-purple-600 to-violet-500 py-4 text-sm font-bold text-white hover:brightness-110"
          >
            Back to Lessons →
          </button>
          <Link
            href="/train"
            className="block w-full rounded-2xl border border-white/[0.08] bg-white/[0.02] py-3.5 text-sm font-semibold text-slate-400 hover:bg-white/[0.05] transition-colors text-center"
          >
            Training Hub
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => {
            playSound("select");
            onBack();
          }}
          className="flex items-center gap-1.5 text-xs text-slate-600 hover:text-slate-400 transition-colors"
        >
          ← Back
        </button>
        <div className="flex-1">
          <LessonProgress current={idx} total={total} />
        </div>
        <span className="text-[11px] text-slate-600">
          {idx + 1} / {total}
        </span>
      </div>

      {/* Slide */}
      <div key={idx} className="lesson-slide">
        {slide?.kind === "text" && (
          <TextSlideView slide={slide} onNext={handleNext} />
        )}
        {slide?.kind === "interact" &&
          (slide.fetchTheme ? (
            <LiveInteractSlide key={idx} slide={slide} onNext={handleNext} />
          ) : (
            <InteractSlideView key={idx} slide={slide} onNext={handleNext} />
          ))}
        {slide?.kind === "choice" && (
          <ChoiceSlideView key={idx} slide={slide} onNext={handleNext} />
        )}
        {slide?.kind === "replay" && (
          <ReplaySlideView key={idx} slide={slide} onNext={handleNext} />
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────── */
/*  LessonCatalog                                                   */
/* ─────────────────────────────────────────────────────────────── */

function LessonCatalog({ onSelect }: { onSelect: (lesson: Lesson) => void }) {
  const bands: RatingBand[] = ["800", "1200", "1600", "2000"];

  return (
    <div className="mx-auto max-w-lg space-y-10">
      <div className="pt-2 text-center">
        <p className="text-[11px] font-black uppercase tracking-widest text-purple-400">
          ✦ Learn Chess
        </p>
        <h1 className="mt-1 text-3xl font-black tracking-tight text-white">
          Lessons
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          Structured lessons on the topics that matter most at your level.
        </p>
      </div>

      {bands.map((band) => {
        const bandLessons = LESSONS.filter((l) => l.band === band);
        const colors = BAND_COLORS[band];
        return (
          <div key={band} className="space-y-3">
            <div
              className={`flex items-center gap-2.5 rounded-xl px-4 py-2.5 ring-1 ${colors.bg} ${colors.ring}`}
            >
              <div>
                <p
                  className={`text-xs font-black uppercase tracking-widest ${colors.text}`}
                >
                  {BAND_LABELS[band]}
                </p>
                <p className="text-[11px] text-slate-500">
                  {BAND_DESCRIPTIONS[band]}
                </p>
              </div>
            </div>
            {bandLessons.length === 0 ? (
              <div className="rounded-2xl border border-white/[0.04] bg-white/[0.01] px-5 py-4 text-center">
                <p className="text-[12px] text-slate-700">
                  More lessons coming soon
                </p>
              </div>
            ) : (
              bandLessons.map((lesson) => (
                <button
                  key={lesson.id}
                  type="button"
                  onClick={() => {
                    playSound("select");
                    onSelect(lesson);
                  }}
                  className={`group w-full flex items-center gap-4 rounded-2xl px-5 py-4 text-left transition-all hover:brightness-110 active:scale-[0.99] ring-1 ${colors.bg} ${colors.ring}`}
                >
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/[0.06] text-2xl">
                    {lesson.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-white">{lesson.title}</p>
                    <p className="mt-0.5 text-[12px] text-slate-500 line-clamp-1">
                      {lesson.subtitle}
                    </p>
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      <span
                        className={`rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${colors.pill}`}
                      >
                        {lesson.estimatedMinutes} min
                      </span>
                      {lesson.tags.slice(0, 2).map((tag) => (
                        <span
                          key={tag}
                          className="rounded-md bg-white/[0.05] px-2 py-0.5 text-[10px] text-slate-500"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                  <svg
                    className="h-4 w-4 shrink-0 text-slate-600 group-hover:text-slate-400 transition-colors"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </button>
              ))
            )}
          </div>
        );
      })}

      <p className="text-center text-[11px] text-slate-700">
        🧪 Early preview ·{" "}
        <a
          href="https://discord.gg/YS8fc4FtEk"
          target="_blank"
          rel="noopener noreferrer"
          className="text-slate-600 hover:text-slate-400 underline"
        >
          give feedback in Discord
        </a>
      </p>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────── */
/*  Page                                                            */
/* ─────────────────────────────────────────────────────────────── */

function LearnPageInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [phase, setPhase] = useState<"catalog" | "lesson">("catalog");
  const [activeLesson, setActiveLesson] = useState<Lesson | null>(null);

  // Sync state from URL on mount and when searchParams change
  useEffect(() => {
    const lessonId = searchParams.get("lesson");
    if (lessonId) {
      const lesson = LESSONS.find((l) => l.id === lessonId);
      if (lesson) {
        setActiveLesson(lesson);
        setPhase("lesson");
      }
    } else {
      setPhase("catalog");
      setActiveLesson(null);
    }
  }, [searchParams]);

  const handleSelect = useCallback(
    (lesson: Lesson) => {
      router.push(`/learn?lesson=${lesson.id}`);
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
    [router],
  );

  const handleBack = useCallback(() => {
    router.push("/learn");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [router]);

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Top bar */}
      <div className="sticky top-0 z-10 flex items-center justify-between border-b border-white/[0.05] bg-[#0a0a0a]/90 px-4 py-3 backdrop-blur sm:px-6">
        {phase === "catalog" ? (
          <Link
            href="/train"
            className="flex items-center gap-1.5 text-xs text-slate-600 hover:text-slate-400 transition-colors"
          >
            ← Training Hub
          </Link>
        ) : (
          <button
            type="button"
            onClick={() => {
              playSound("select");
              handleBack();
            }}
            className="flex items-center gap-1.5 text-xs text-slate-600 hover:text-slate-400 transition-colors"
          >
            ← Lessons
          </button>
        )}
        {activeLesson && phase === "lesson" && (
          <p className="text-xs font-semibold text-slate-500 truncate max-w-[60%]">
            {activeLesson.title}
          </p>
        )}
        <div className="w-24" />
      </div>

      {/* Content */}
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        {phase === "catalog" && <LessonCatalog onSelect={handleSelect} />}
        {phase === "lesson" && activeLesson && (
          <LessonRunner
            lesson={activeLesson}
            onBack={handleBack}
            onComplete={handleBack}
          />
        )}
      </div>
    </div>
  );
}

export default function LearnPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0a0a0a]" />}>
      <LearnPageInner />
    </Suspense>
  );
}
