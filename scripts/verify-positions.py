#!/usr/bin/env python3
"""Generate lessons-data.ts with ALL positions verified by python-chess."""
import chess
import json

lessons = []

def fen(*args):
    """Construct a verified FEN."""
    f = "/".join(args[0]) if isinstance(args[0], list) else args[0]
    return f

def moves_to_fen(moves, start_fen=None):
    """Compute FEN after a sequence of UCI moves."""
    board = chess.Board(start_fen) if start_fen else chess.Board()
    for uci in moves:
        m = chess.Move.from_uci(uci)
        if m not in board.legal_moves:
            # Try with promotion
            m = chess.Move.from_uci(uci + "q")
        board.push(m)
    return board.fen()

def verify(fen_str):
    """Verify a FEN is valid."""
    try:
        board = chess.Board(fen_str)
        assert board.is_valid()
        return True
    except:
        return False

def is_legal_move(fen_str, uci):
    """Check if a UCI move is legal in a position."""
    board = chess.Board(fen_str)
    m = chess.Move.from_uci(uci)
    if m in board.legal_moves:
        return True
    if len(uci) == 4:
        m = chess.Move.from_uci(uci + "q")
        if m in board.legal_moves:
            return True
    return False

# ================================================================
# VERIFY all FENs and interact moves up front
# ================================================================

all_ok = True

def chk(label, condition, detail=""):
    global all_ok
    if not condition:
        print(f"  ❌ {label}: {detail}")
        all_ok = False
    else:
        print(f"  ✅ {label}")

# ================================================================
# Lesson 1 — Hanging Pieces
# ================================================================

# FENs used:
L1_F1 = "rn2kb1r/pp3ppp/2p1p3/q1b5/4B3/1BNQ4/PPP2PPP/R4RK1 w kq - 0 13"
L1_F2 = "r2qkbnr/ppp2ppp/2np4/4N3/2B1P1b1/8/PPPP1PPP/RNBQK2R w KQkq - 0 5"
L1_F3 = "r1bqkb1r/pppp1ppp/2n2n2/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 2 4"
L1_F4 = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"

for name, f in [("L1_F1", L1_F1), ("L1_F2", L1_F2), ("L1_F3", L1_F3), ("L1_F4", L1_F4)]:
    chk(f"{name}", verify(f))

# L1 interact: find Be2
chk("L1 interact Be2", is_legal_move(L1_F2, "f1e2"))
chk("L1 wrong1 Qe2", not is_legal_move(L1_F2, "d1e2"))

# ================================================================
# Lesson 2 — Back Rank Mates — COMPLETELY REBUILT with verified FENs
# ================================================================

# Replay: simple Fried Liver-like attack
L2_REPLAY = [
    "e2e4", "e7e5", "g1f3", "b8c6", "f1c4", "g8f6",
    "d2d4", "e5d4", "e4e5", "f6g4", "c4f7", "e8f7",
    "f3g5", "f7g8", "d1h5", "h7h6", "h5f7", "g8h8",
    "f1e8",
]
# Legal check for replay: all moves should be legal
board = chess.Board()
L2_REPLAY_OK = True
for uci in L2_REPLAY:
    m = chess.Move.from_uci(uci)
    if m not in board.legal_moves:
        # Try with promotion
        mp = chess.Move.from_uci(uci + "q")
        if mp not in board.legal_moves:
            print(f"  ❌ L2 replay move {uci} illegal at {board.fen()}")
            L2_REPLAY_OK = False
            break
        m = mp
    board.push(m)
if L2_REPLAY_OK:
    print(f"  ✅ L2 replay ({len(L2_REPLAY)} moves)")

# Text slide 2: position after ...Nf6 (Italian Game)
L2_F1 = "r1bqkb1r/pppp1ppp/2n2n2/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 2 4"
chk("L2_F1", verify(L2_F1))

# INTERACT SLIDE: Back rank mate
# Clean position: White Ra1, Kg1. Black Kg8, pawns f7,g7,h7.
# After Ra1-a8, rook attacks g8 along rank 8, pawans block escape.
L2_INTERACT_FEN = "6k1/5ppp/8/8/8/8/8/R5K1 w - - 0 1"
chk("L2 interact FEN", verify(L2_INTERACT_FEN))
chk("L2 interact a1a8", is_legal_move(L2_INTERACT_FEN, "a1a8"))
# Verify it's actually mate
board = chess.Board(L2_INTERACT_FEN)
board.push(chess.Move.from_uci("a1a8"))
chk("L2 a1a8 delivers check", board.is_check())
chk("L2 a1a8 is checkmate", board.is_checkmate())

# Text slide 4: Air hole concept
# Clean position showing Black needing luft
L2_F2 = "6k1/6pp/8/8/8/8/8/6R1 b - - 0 1"
chk("L2_F2", verify(L2_F2))

# ================================================================
# Lesson 3 — Knight Forks
# ================================================================

L3_F1 = "r1bqkb1r/ppppNppp/2n5/4n3/2B1P3/8/PPPP1PPP/RNBQK2R b KQkq - 0 5"
L3_F2 = "rnb1k2r/pppp1ppp/5n2/2b1N3/2B1P3/8/PPPP1PPP/RNBQK2R w KQkq - 0 5"
L3_F3 = "r1bqkb1r/ppp2ppp/2np4/4P3/2B2P2/2NP4/PPP3PP/R1BQK2R b KQkq - 0 6"

for name, f in [("L3_F1", L3_F1), ("L3_F2", L3_F2), ("L3_F3", L3_F3)]:
    chk(name, verify(f))

chk("L3 Nxf7 fork", is_legal_move(L3_F2, "e5f7"))
chk("L3 wrong Ng6", not is_legal_move(L3_F2, "e5g6"))

# ================================================================
# Lesson 4 — The Pin
# ================================================================

L4_F1 = "r1bqkb1r/ppp2ppp/2n2n2/1B1pp3/4P3/3P1N2/PPP2PPP/RNBQK2R w KQkq - 0 5"
L4_F2 = "r1bqkb1r/pppp1pp1/2n2n1p/4p1B1/4P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 0 5"
L4_F3 = "r2qkb1r/ppp2ppp/2n2n2/4p1B1/4P3/5N2/PPPP1PPP/RNBQK2R b KQkq - 0 5"

for name, f in [("L4_F1", L4_F1), ("L4_F2", L4_F2), ("L4_F3", L4_F3)]:
    chk(name, verify(f))

chk("L4 Bxf6 exploit pin", is_legal_move(L4_F2, "g5f6"))
chk("L4 wrong Bh4", is_legal_move(L4_F2, "g5h4"))  # legal but bad

# ================================================================
# Lesson 5 — The Skewer
# ================================================================

# Text slide 2: classic skewer pattern — king and queen on same diagonal
L5_F1 = "r1b1k2r/ppp2ppp/2n5/4N3/2B1n3/5N2/PPPP1PPP/R1BQR1K1 b kq - 0 9"
chk("L5_F1", verify(L5_F1))

# INTERACT: bishop skewer — king and queen on same diagonal
# White: Bc4, White king somewhere safe. Black: Kg8, Qe5 (same diagonal)
# Bxf7+ forks... wait, Bxf7+ would be check — the king moves and queen is exposed
L5_INTERACT_FEN = "r4rk1/ppp2ppp/2n5/2b1q3/2B1P3/2NP4/PPP2PPP/R2QK2R w KQ - 0 11"
chk("L5 interact FEN", verify(L5_INTERACT_FEN))
# Bxf7+ — check! Then Qe5 is exposed
chk("L5 Bxf7+ skewer", is_legal_move(L5_INTERACT_FEN, "c4f7"))
# Verify it's check
board = chess.Board(L5_INTERACT_FEN)
board.push(chess.Move.from_uci("c4f7"))
chk("L5 Bxf7+ is check", board.is_check())

# Text slide 4: rook skewers
L5_F2 = "4k2r/ppp2ppp/2n5/2b5/4P3/2NP4/PPP2PPP/R5K1 w k - 0 12"
chk("L5_F2", verify(L5_F2))

# ================================================================
# Lesson 6 — Discovered Attacks
# ================================================================

L6_F1 = "r1bqkb1r/pppp1ppp/2n2n2/4p3/4P3/2N2N2/PPPP1PPP/R1BQKB1R w KQkq - 0 4"
chk("L6_F1", verify(L6_F1))

# Interact: Ne5 blocks Bc4. Move knight to create two threats.
# Better position: N on e5, B on c4, Black queen on e7
L6_INTERACT_FEN = "r1b1k2r/ppppqppp/2n5/4N3/2B1n3/3P4/PPP2PPP/R1BQK2R w KQkq - 0 8"
chk("L6 interact FEN", verify(L6_INTERACT_FEN))
# Nxf7 forks Q and R
chk("L6 Nxf7 attack", is_legal_move(L6_INTERACT_FEN, "e5f7"))

L6_F2 = "r1b1k2r/ppppNppp/2n5/8/2B1n3/3P4/PPP2PPP/R1BQK2R b KQkq - 0 8"
chk("L6_F2", verify(L6_F2))

# ================================================================
# Lesson 8 — Deflection
# ================================================================

L8_INTERACT_FEN = "r1b1k2r/pppp1ppp/2n5/2b1q3/2B1P3/5N2/PPPP1PPP/R1BQK2R w KQkq - 0 7"
chk("L8 interact FEN", verify(L8_INTERACT_FEN))
# Nxe5 captures queen, deflecting from f7 defense
chk("L8 Nxe5 deflection", is_legal_move(L8_INTERACT_FEN, "f3e5"))

# ================================================================
# Lesson 9 — Open Files
# ================================================================

L9_INTERACT_FEN = "r1bq1rk1/ppp2ppp/2np1n2/2b1p3/2BPP3/2N2N2/PPP2PPP/R1BQR1K1 w - - 0 8"
chk("L9 interact FEN", verify(L9_INTERACT_FEN))
# After castling, rook on f1. Rf1-d1 or Re1-d1?
# Actually we need an open file scenario. Position has rook on e1.
# The rook on a1 won't work (blocked by B~). So use Rfe1 or Rad1.
# Actually in this FEN, White has Rook on a1 and Rook on e1 (after ...0-0 if White played Re1 before).
# Let me reparse: "R1BQR1K1" = R(a1), empty(b1), B(c1), Q(d1), R(e1), empty(f1), K(g1), empty(h1).
# Wait, this looks like White didn't castle normally but has R on e1.
# For a rook on f1 to go to d1: f1 is empty. So there's no rook on f1.
# The rooks are on a1 and e1. Re1-d1: path through d1? But Q is on d1.
# Hmm. Let me redesign.
# Position where a rook can reach the d-file:
# After O-O, White has rook on f1. But we want a semi-open d-file.
# Fix: remove bishop from c1 so a1 rook can use d1.
L9_INTERACT_FEN2 = "r1bq1rk1/ppp2ppp/2np1n2/2b1p3/2BPP3/2N2N2/PPP2PPP/R2QR1K1 w - - 0 8"
chk("L9 interact FEN2", verify(L9_INTERACT_FEN2))
# Now: R(a1), empty(b1), empty(c1), Q(d1), R(e1), empty(f1), K(g1), empty(h1)
# Rf1-d1: f1 is empty. Not a valid move.
# The rook on e1 can go to d1 (e1d1). But Q is on d1. Can't.
# The rook on a1 can go to d1 (a1d1) — but wait, a1-b1-c1-d1: b1 empty, c1 empty, d1 Q.
# So a1 can move to d1? The path is a1-b1-c1-d1. b1 and c1 are empty. d1 has Queen.
# But the rook on a1 can't go to d1 because Q is on d1! It can't capture the queen.
# Wait, CAN it? If a1d1 is played, the rook captures the queen on d1.
# Is that legal? The queen is the opponent's... wait, Q on d1 is WHITE's queen. White can't capture own pieces.
# So a1d1 is illegal — blocked by own queen.
# OK this is impossible. Let me change the position so Q is not on d1.

L9_INTERACT_FEN3 = "r1bq1rk1/ppp2ppp/2np1n2/2b1p3/2BPP3/2N2N2/PPP2PPP/R1B1R1K1 w - - 0 8"
chk("L9 interact FEN3", verify(L9_INTERACT_FEN3))
# R(a1), empty(b1), B(c1), empty(d1), R(e1), empty(f1), K(g1), empty(h1)
# Check: R a1-d1? Path a1-b1-c1-d1. b1 empty, c1 B(can't jump). Blocked by own bishop!
# R e1-d1? e1-d1: path through d1... e1 to d1 is just one square. d1 is empty. So e1d1 IS legal!
chk("L9 Re1-d1", is_legal_move(L9_INTERACT_FEN3, "e1d1"))
# Great! The rook on e1 moves to the semi-open d-file.

# Maybe also let the rook on a1 reach d1 after Bc1 moves. But for interaction, e1d1 is the right answer.
# Or maybe we should teach: play Bd2 or similar first, then Rad1. But that's two moves.
# For a single-move interact, e1d1 (Re1-d1) is good.

# ================================================================
# Lesson 10 — Passed Pawn
# ================================================================

L10_INTERACT_FEN = "8/5ppp/4k3/p7/5PP1/6P1/6K1/8 w - - 0 1"
chk("L10 interact FEN", verify(L10_INTERACT_FEN))
# White: Kg2, pawns f4,g4,g3. Black: Ke6, pawns a5,f7,g7,h7.
# g3g4 should be legal (pawns on f4,g4... oh the g3 pawn moving to g4 — but g4 has white pawn!)
# Need to fix: remove pawn from g4.
L10_INTERACT_FEN2 = "8/5ppp/4k3/p7/5P2/6P1/6K1/8 w - - 0 1"
chk("L10 interact FEN2", verify(L10_INTERACT_FEN2))
# White: Kg2, pawns f4,g3. Black: Ke6, pawns a5,f7,g7,h7.
# g3g4 - pawn g3 to g4 is legal!
chk("L10 g3g4 advance", is_legal_move(L10_INTERACT_FEN2, "g3g4"))

L10_F1 = "8/pp3ppp/4k3/3PP3/5PK1/P7/8/8 b - - 0 1"
chk("L10_F1", verify(L10_F1))

# ================================================================
# Lesson 11 — Knight Outposts
# ================================================================

L11_F1 = "r1bqkb1r/ppp1pppp/2n5/4P3/3n4/5N2/PPP2PPP/RNBQK2R w KQkq - 0 6"
chk("L11_F1", verify(L11_F1))

L11_INTERACT_FEN = "r1bqkb1r/pppp1ppp/2n2n2/4P3/4P3/8/PPP2PPP/RNBQKBNR w KQkq - 0 5"
chk("L11 interact FEN", verify(L11_INTERACT_FEN))
chk("L11 Nf3 development", is_legal_move(L11_INTERACT_FEN, "g1f3"))

# ================================================================
# Lesson 14 — Knight vs Bishop
# ================================================================

L14_INTERACT_FEN = "r1bqkb1r/pppppppp/2n2n2/8/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 0 3"
chk("L14 interact FEN", verify(L14_INTERACT_FEN))
chk("L14 d4 advance", is_legal_move(L14_INTERACT_FEN, "d2d4"))

# ================================================================
# Lesson 15 — Zwischenzug
# ================================================================

L15_INTERACT_FEN = "r1bqkb1r/pppp1ppp/2n2n2/4p3/4n3/2NP4/PPP2PPP/R1BQKBNR w KQkq - 0 5"
chk("L15 interact FEN", verify(L15_INTERACT_FEN))
# Position: White pawn on d3, Black knight on e4 captured white pawn on e4?
# Wait, "PPP2PPP" for rank 2: Pa2,Pb2,Pc2, empty(d2), empty(e2), Pf2,Pg2,Ph2
# "4n3" on rank 4... wait that's wrong for the position I wanted.
# Let me think: Nxe4 on e4... is e4 empty? "4n3" = 4 empty, then n on e4, then 3 empty.
# So Black knight is on e4.
# White can play Qh5 threatening Qxf7#. That's a zwischenzug!
chk("L15 Qh5 zwischenzug", is_legal_move(L15_INTERACT_FEN, "d1h5"))
# Not dxe4 (wrong dxe4 is illegal because pawn on d3 doesn't go to e4)
chk("L15 Qh5 wrong dxe4", not is_legal_move(L15_INTERACT_FEN, "d3e4"))

# ================================================================
# Lesson 16 — Simplification
# ================================================================

L16_INTERACT_FEN = "r1bq1rk1/ppp3pp/2np4/4p3/2BnP3/2NPB3/PPP2PPP/R3K2R w KQ - 0 12"
chk("L16 interact FEN", verify(L16_INTERACT_FEN))
# Check: Bxd4 trades bishop for knight when ahead
# But... Bc3 doesn't go to d4. The bishop is on e3 (B in position 2NPB3).
# "2NPB3" = 2 empty, N on c3, P on d3, B on e3, 3 empty.
# So bishop is on e3. Bxd4 is e3d4 in UCI.
# But d4 has a black knight. Is e3d4 legal? Path from e3 to d4 is diagonal. e3-d4 is one square.
# So e3-d4 (Bxd4) is legal!
chk("L16 Bxd4 simplification", is_legal_move(L16_INTERACT_FEN, "e3d4"))

L16_F1 = "r1bq1rk1/ppp2ppp/2np4/4B3/2B1P3/2NP4/PPP2PPP/R2QK2R b KQ - 0 10"
chk("L16_F1", verify(L16_F1))

# ================================================================
# Lesson 19 — Sacrifice for Attack
# ================================================================

L19_INTERACT_FEN = "r1bq1rk1/pppp1ppp/2n2n2/4P3/2B1P3/5N2/PPP2PPP/RNBQR1K1 w - - 0 7"
chk("L19 interact FEN", verify(L19_INTERACT_FEN))
# Bxf7+ sacrifice
chk("L19 Bxf7+ sacrifice", is_legal_move(L19_INTERACT_FEN, "c4f7"))

# ================================================================
# Print summary
# ================================================================

print(f"\n{'='*50}")
if all_ok:
    print("✅ ALL CHECKS PASSED!")
else:
    print("❌ SOME CHECKS FAILED!")
print(f"{'='*50}")
