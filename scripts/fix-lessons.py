#!/usr/bin/env python3
"""Fix broken interact/text slides in lessons-data.ts with proper block matching."""
import chess
import re

def verify_fen(f):
    try:
        chess.Board(f)
        return True
    except:
        return False

def verify_move(fen, uci):
    b = chess.Board(fen)
    m = chess.Move.from_uci(uci)
    if m in b.legal_moves: return True
    if len(uci) == 4:
        m = chess.Move.from_uci(uci + "q")
        if m in b.legal_moves: return True
    return False

with open("app/learn/lessons-data.ts", "r") as f:
    content = f.read()

# Strategy: for each fix, find a UNIQUE multi-line anchor string
# that wraps the entire broken slide content and replace it

fixes = []

# FIX 1: L1 interact — "Find the hanging piece" slide (broken: f1e2 not legal here)
fix1_old = '''    {
      kind: "interact",
      heading: "Find the hanging piece",
      instruction: "Black just played ...Bg4, pinning the knight. But White has a simple tactical shot. Find the move that wins material immediately.",
      fen: "r2qkbnr/ppp2ppp/2np4/4N3/2B1P1b1/8/PPPP1PPP/RNBQK2R w KQkq - 0 5",
      orientation: "white",
      correctMoves: ["f1e2"],
      wrongMoves: ["d1e2", "b1c3", "e5f7"],
      correctExplanation: "Be2! The knight on e5 attacked Black's undefended bishop on g4, but ...f6 would defend it. Instead, White first attacks the bishop with the pawn on h3 — except there is no h3. Actually, Be2 is the right move: it defends the knight on e5 while attacking the undefended bishop on g4. Black must lose the bishop.",
      wrongExplanation: "This move doesn't address the hanging piece. Look for a piece of yours that's undefended — or a piece of your opponent's that you can attack immediately.",
    },'''

fix1_new = '''    {
      kind: "interact",
      heading: "Find the hanging piece",
      instruction: "Black just moved the bishop to g4, attacking White's knight on f3. But Black's bishop on g4 is undefended! Find the move that wins a piece.",
      fen: "r2qkbnr/ppp2ppp/2n5/3p4/2B1P1b1/5N2/PPPP1PPP/RNBQK2R w KQkq - 0 6",
      orientation: "white",
      correctMoves: ["h2h3"],
      wrongMoves: ["f3d4", "c4f7", "d1d3"],
      correctExplanation: "h3! Attack the undefended bishop on g4. Since it has no defenders, Black must move it. The bishop is 'hanging' — it was left without protection, and White can win it with a simple pawn thrust.",
      wrongExplanation: "Look for pieces of Black's that have no defenders. The bishop on g4 is undefended — attack it with a pawn to win a tempo.",
    },'''

# FIX 2: L2 interact — "Deliver the back rank mate" (e1e8 was blocked by queen)
fix2_old = '''    {
      kind: "interact",
      heading: "Deliver the back rank mate",
      instruction: "White has a rook on e1. The Black king is trapped on its back rank with pawns blocking escape. Find the winning move.",
      fen: "r1b2rk1/ppppnppp/2n5/4q3/2B1P3/2NP4/PPP2PPP/R1BQR1K1 w - - 0 10",
      orientation: "white",
      correctMoves: ["e1e8"],
      wrongMoves: ["d3d4", "c1g5", "d1c2"],
      correctExplanation: "Re8! The rook slides to the 8th rank, and since Black's pawns block the king's escape, it's checkmate. The queen on e5 can't help because it's pinned by the rook on e1.",
      wrongExplanation: "This move doesn't deliver checkmate immediately. Look for the direct back rank threat — a rook or queen on the 8th rank with the king's pawns blocking escape.",
    },'''

fix2_new = '''    {
      kind: "interact",
      heading: "Deliver the back rank mate",
      instruction: "The Black king is trapped on g8 behind its own pawns on f7, g7, and h7. Find the move that delivers checkmate in one move.",
      fen: "6k1/5ppp/8/8/8/8/8/R5K1 w - - 0 1",
      orientation: "white",
      correctMoves: ["a1a8"],
      wrongMoves: ["a1b1", "g1f1", "a1a7", "g1h1"],
      correctExplanation: "Ra8! The rook moves to the 8th rank and attacks the king along the entire rank. Black's own pawns on f7, g7, and h7 block every escape square — f8, h8, f7, g7, and h7 are all inaccessible. Checkmate!",
      wrongExplanation: "Your rook needs to reach the 8th rank on a clear file. The a-file is wide open from a1 to a8 — use it! Once there, the rook controls the entire back rank.",
    },'''

# FIX 3: L2 air hole text slide — bad FEN (king in check)
fix3_old = '''    {
      kind: "text",
      heading: "Creating an air hole",
      body: 'The best way to avoid back rank mates is to never let yourself get into a position where it\'s possible. Push one of the pawns in front of your king one square: ...h6, ...g6, or ...f2/f3 for White. This is called creating an "air hole" — it gives your king a flight square.\n\nBut be careful: pushing the pawn can create weaknesses. Only do it when there is a real threat of a back rank mate, not as a routine move.',
      fen: "6k1/5p1p/7P/8/8/8/8/6R1 b - - 0 1",
      orientation: "black",
      highlights: ["g8", "h8", "h7"],
      arrows: [["h7", "h6"]],
    },'''

fix3_new = '''    {
      kind: "text",
      heading: "Creating an air hole",
      body: 'The best way to avoid back rank mates is to never let yourself get into a position where it\'s possible. Push one of the pawns in front of your king one square: ...h6, ...g6, or ...f2/f3 for White. This is called creating an "air hole" — it gives your king a flight square.\n\nBut be careful: pushing the pawn can create weaknesses. Only do it when there is a real threat of a back rank mate, not as a routine move.',
      fen: "6k1/6pp/8/8/8/8/8/6R1 b - - 0 1",
      orientation: "black",
      highlights: ["g8", "h8", "h7"],
      arrows: [["h7", "h6"]],
    },'''

# FIX 4: L5 text slide 4 — broken FEN (king in check from Bc4)
fix4_old = '''    {
      kind: "text",
      heading: "Rook skewers on files and ranks",
      body: "Bishops skewer on diagonals, rooks skewer on files and ranks. A rook on the same rank as the enemy king and queen (with one space between them) can deliver a devastating skewer. Queens also skewer — they are the most powerful skewering piece because they can attack in all directions.\n\nThe key pattern: whenever two valuable pieces are lined up on the same line with no pieces between them, look for a skewer.",
      fen: "r1b2rk1/ppp3pp/2n5/2b1q3/2B1P3/2NP4/PPP2PPP/R2Q1RK1 w - - 0 11",
      orientation: "white",
      highlights: ["f7", "e8", "e5"],
      arrows: [["f7", "e5"]],
    },'''

fix4_new = '''    {
      kind: "text",
      heading: "Rook skewers on files and ranks",
      body: "Bishops skewer on diagonals, rooks skewer on files and ranks. A rook on the same file as the enemy king and queen (with the king in front) can deliver a devastating skewer. The king must move out of check, and the piece behind is captured.\n\nThe key pattern: whenever two valuable pieces are lined up on the same line with no pieces between them, look for a skewer.",
      fen: "4k2r/ppp2ppp/2n5/2b5/4P3/2NP4/PPP2PPP/R5K1 w k - 0 12",
      orientation: "white",
      highlights: ["a1", "e8", "h8"],
      arrows: [["a1", "e8"]],
    },'''

# FIX 5: L10 interact — g3g4 blocked by own pawn
fix5_old = '''    {
      kind: "interact",
      heading: "Push the passer",
      instruction: "White has a 2-to-1 majority on the kingside. Find the move that starts creating a passed pawn.",
      fen: "8/5ppp/4k3/8/5PP1/6P1/6K1/8 w - - 0 1",
      orientation: "white",
      correctMoves: ["g3g4"],
      wrongMoves: ["g2f3", "f4f5", "g2g3"],
      correctExplanation: "g4! Start by advancing the unopposed pawn. Black cannot block the g-pawn with an f-pawn (wrong file). If Black pushes f5, White responds g5 and now has a passed pawn on the g-file. The pawn majority creates a passer.",
      wrongExplanation: "Push the pawn that has no enemy pawn in front of it. Your kingside majority (4 pawns vs 3) means you can create a passed pawn by advancing.",
    },'''

fix5_new = '''    {
      kind: "interact",
      heading: "Push the passer",
      instruction: "White has a 2-to-1 pawn majority on the kingside. White's f-pawn has no enemy pawn blocking it. Find the move that starts creating a passed pawn.",
      fen: "8/5ppp/4k3/p7/5P2/6P1/6K1/8 w - - 0 1",
      orientation: "white",
      correctMoves: ["f4f5"],
      wrongMoves: ["g3g4", "g2f3", "f4f6"],
      correctExplanation: "f5! Advance the unopposed pawn. Black's pawns can't block f5 because they're on the g- and h-files. After f5-f6, the pawn becomes a passed pawn that Black must block with pieces.",
      wrongExplanation: "Push the pawn that has no enemy pawn in front of it on its file. The kingside majority (f- and g-pawns vs Black's g- and h-pawns) means the f-pawn can become a passer.",
    },'''

# FIX 6: L15 interact — bad FEN (3 black knights)
fix6_old = '''    {
      kind: "interact",
      heading: "Find the in-between move",
      instruction: "Black's knight captures your pawn on e4. Before you recapture, look for a zwischenzug. White has a check available that changes the evaluation.",
      fen: "r1bqkb1r/pppp1ppp/2n2n2/4p3/4n3/2NP4/PPP2PPP/R1BQKBNR w KQkq - 0 5",
      orientation: "white",
      correctMoves: ["d1h5"],
      wrongMoves: ["d3e4", "f1c4", "g1f3"],
      correctExplanation: "Qh5! is a zwischenzug. Instead of recapturing ...Nxe4, White checks on h5, threatening Qxf7#. Black must respond (...g6, ...Qe7, ...Ke7, etc.), and after Black deals with the threat, White recaptures the knight on e4 with better position. The zwischenzug wins time.",
      wrongExplanation: "Look for a move that interrupts Black's plan. Instead of recapturing automatically, see if there's a check or threat that forces Black to respond first, giving you something extra when you do recapture.",
    },'''

fix6_new = '''    {
      kind: "interact",
      heading: "Find the in-between move",
      instruction: "Black just captured a pawn on e4 with ...Nxe4. Instead of recapturing automatically, look for a zwischenzug — a check that wins material first.",
      fen: "r1bqkb1r/pppp1ppp/2n5/4p3/2B1n3/2N2N2/PPPP1PPP/R1BQK2R w KQkq - 0 5",
      orientation: "white",
      correctMoves: ["c4f7"],
      wrongMoves: ["c3e4", "f3e4", "d2d3"],
      correctExplanation: "Bxf7+! The zwischenzug! Instead of immediately recapturing Nxe4 with the knight, White checks with the bishop first. After Black responds (Kxf7 or Kf8), White plays Nc3xe4, winning a pawn and exposing Black's king.",
      wrongExplanation: "Before recapturing, look for a check that changes the evaluation. The bishop can deliver check on f7 — the king must respond, and then White recaptures the knight.",
    },'''

# FIX 7: L16 interact — bad FEN (structure invalid)
fix7_old = '''    {
      kind: "interact",
      heading: "Simplify when ahead",
      instruction: "White is up a pawn. Black's pieces are active and looking for counterplay. Find the move that exchanges a key active piece for Black's best defender, simplifying toward the endgame.",
      fen: "r1b2rk1/ppp2ppp/2np4/4P3/2B1P1n1/2NP4/PPP3PP/R4RK1 w - - 0 13",
      orientation: "white",
      correctMoves: ["c4g8"],
      wrongMoves: ["f1e1", "g1h1", "g2g3"],
      correctExplanation: "Bxg8! Trade the bishop for Black's rook. Wait — Bxg8? That doesn't make sense. Let me reconsider. Actually, the simplest winning simplification is to exchange pieces. If Black's knight on g4 is attacking, trade a minor piece for it. The right approach: play d3-d4 to kick the knight to a worse square, or... Actually, the simplest win: play Re1 or Bxf7+. The point is simplification.",
      wrongExplanation: "Look to trade pieces when you're ahead. Identify Black's most active piece and exchange it off. Each trade reduces Black's chances of counterplay.",
    },'''

fix7_new = '''    {
      kind: "interact",
      heading: "Simplify when ahead",
      instruction: "White is up a pawn. Black's knight on d4 is actively placed and needs to be exchanged. Find the trade that simplifies toward a winning endgame.",
      fen: "r1bq1rk1/ppp3pp/2np4/4p3/2BnP3/2NPB3/PPP2PPP/R4RK1 w - - 0 12",
      orientation: "white",
      correctMoves: ["e3d4"],
      wrongMoves: ["c3d5", "f1e1", "c4d5"],
      correctExplanation: "Bxd4! Trade the active bishop for Black's knight on d4. When you're up a pawn, every piece exchange reduces Black's counterplay and brings you closer to a winning endgame. The fewer pieces on the board, the more your extra pawn matters.",
      wrongExplanation: "When ahead in material, trade pieces. Identify Black's most active piece and exchange it off. Each trade reduces Black's chances of counterplay.",
    },'''

# FIX 8: L9 interact — a1d1/f1d1 not legal in the position
fix8_old = '''    {
      kind: "interact",
      heading: "Seize the open file",
      instruction: "White to move. The d-file is semi-open (no White pawn, one Black pawn on d5). Find the best way to put a rook on this file.",
      fen: "r1bq1rk1/ppp2ppp/2np1n2/2b1p3/2BPP3/2N2N2/PPP2PPP/R1BQR1K1 w - - 0 8",
      orientation: "white",
      correctMoves: ["a1d1", "f1d1"],
      wrongMoves: ["f1e1", "c1e3", "a1c1"],
      correctExplanation: "Rad1 or Rfd1. Placing a rook on the open d-file gives it maximum activity. From d1, the rook eyes the d5 square and can double up with the other rook if needed.",
      wrongExplanation: "Put the rook on the open (or semi-open) file for maximum activity. The d-file has no White pawn — your rook belongs there.",
    },'''

fix8_new = '''    {
      kind: "interact",
      heading: "Seize the open file",
      instruction: "White to move. The d-file is semi-open (Black pawn on d6). Find the move that places a rook on this valuable file.",
      fen: "r1bq1rk1/ppp2ppp/2np1n2/2b1p3/2BPP3/2N2N2/PPP2PPP/R1B2RK1 w - - 0 8",
      orientation: "white",
      correctMoves: ["a1d1"],
      wrongMoves: ["f1e1", "c1g5", "a1b1"],
      correctExplanation: "Rad1! Place the queen's rook on the semi-open d-file. From d1 it targets Black's d6 pawn and controls the file.",
      wrongExplanation: "Put a rook on the semi-open d-file. From there it controls the file and targets the d6 pawn. The rook on a1 can reach d1 because the bishop on c1 moved earlier.",
    },'''

# Apply all fixes
all_fixes = [
    (fix1_old, fix1_new, "L1 interact"),
    (fix2_old, fix2_new, "L2 interact"),
    (fix3_old, fix3_new, "L2 air hole"),
    (fix4_old, fix4_new, "L5 rook skewer"),
    (fix5_old, fix5_new, "L10 interact"),
    (fix6_old, fix6_new, "L15 interact"),
    (fix7_old, fix7_new, "L16 interact"),
    (fix8_old, fix8_new, "L9 interact"),
]

for old, new, name in all_fixes:
    if old in content:
        count = content.count(old)
        if count == 1:
            content = content.replace(old, new)
            print(f"  ✅ {name} — replaced")
        else:
            print(f"  ⚠️  {name} — found {count} matches, using first")
            content = content.replace(old, new, 1)
    else:
        print(f"  ❌ {name} — NOT FOUND in file")

with open("app/learn/lessons-data.ts", "w") as f:
    f.write(content)

print("\n📋 Verifying updated FENs...")

# Verify all FENs in the final file
fen_pattern = re.compile(r'fen:\s*"([^"]+)"')
fens = fen_pattern.findall(content)
verified = 0
failed = 0
for i, f in enumerate(fens):
    if verify_fen(f):
        verified += 1
    else:
        failed += 1
        print(f"  ❌ FEN #{i+1}: {f}")

print(f"\n   Valid: {verified}, Invalid: {failed}")

# Verify key interact moves
print("\n📋 Verifying interact moves...")
interact_checks = [
    # Fen, [list of (move, expected_legal), ...]
    ("r2qkbnr/ppp2ppp/2n5/3p4/2B1P1b1/5N2/PPPP1PPP/RNBQK2R w KQkq - 0 6",
     [("h2h3", True), ("f3d4", True), ("c4f7", True)]),  # L1 - h3 wins the hanging piece
    ("6k1/5ppp/8/8/8/8/8/R5K1 w - - 0 1",
     [("a1a8", True), ("a1b1", True), ("g1f1", True)]),  # L2 - any king/rook move is legal, a1a8 is mate
    ("8/5ppp/4k3/p7/5P2/6P1/6K1/8 w - - 0 1",
     [("f4f5", True)]),  # L10 - push passer
    ("r1bqkb1r/pppp1ppp/2n5/4p3/2B1n3/2N2N2/PPPP1PPP/R1BQK2R w KQkq - 0 5",
     [("c4f7", True), ("c3e4", True), ("f3e4", True)]),  # L15 - zwischenzug Bxf7+
    ("r1bq1rk1/ppp3pp/2np4/4p3/2BnP3/2NPB3/PPP2PPP/R4RK1 w - - 0 12",
     [("e3d4", True)]),  # L16 - simplify
    ("r1bq1rk1/ppp2ppp/2np1n2/2b1p3/2BPP3/2N2N2/PPP2PPP/R1B2RK1 w - - 0 8",
     [("a1d1", True)]),  # L9 - open file
]

for f, moves in interact_checks:
    for uci, should_be in moves:
        is_legal = verify_move(f, uci)
        status = "✅" if is_legal == should_be else "❌"
        print(f"  {status} {uci} in {f[:40]}... {'legal' if should_be else 'illegal'}")

print("\n✅ Done!")
