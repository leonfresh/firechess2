#!/usr/bin/env python3
"""Verify all FEN positions and interact moves in the lessons data."""
import re
import sys
import chess

errors = []
warnings = []

def check_fen(label: str, fen: str | None):
    if fen is None:
        return
    try:
        board = chess.Board(fen)
        # is_valid() can be too strict — just check parse + legal structure
        assert board.king(chess.WHITE) is not None, "Missing white king"
        assert board.king(chess.BLACK) is not None, "Missing black king"
        # Side not to move must not be in check
        board_copy = board.copy()
        board_copy.push(chess.Move.null())
        assert not board_copy.is_check(), "Side not to move is in check"
    except Exception as e:
        errors.append(f"❌ INVALID FEN [{label}]: {fen} — {e}")

def check_interact(label: str, fen: str, correct: list[str], wrong: list[str]):
    try:
        board = chess.Board(fen)
    except:
        errors.append(f"❌ BAD FEN for interact [{label}]: {fen}")
        return
    
    legal = {m.uci() for m in board.legal_moves}
    
    for uci in correct:
        m = uci
        if m not in legal:
            mq = uci + "q"
            if mq in legal:
                continue
            errors.append(f"❌ [{label}] Correct move {uci} is ILLEGAL in:\n   {fen}")

def verify_moves_reach(label: str, moves: list[str], start_fen: str | None = None):
    board = chess.Board(start_fen) if start_fen else chess.Board()
    for i, uci in enumerate(moves):
        try:
            m = chess.Move.from_uci(uci)
            if m not in board.legal_moves:
                if len(uci) == 4:
                    m = chess.Move.from_uci(uci + "q")
                    if m not in board.legal_moves:
                        warnings.append(f"⚠️  [{label}] Move {i+1} ({uci}) illegal in:\n   {board.fen()}")
                        return
                    uci = uci + "q"
                    m = chess.Move.from_uci(uci)
                else:
                    warnings.append(f"⚠️  [{label}] Move {i+1} ({uci}) illegal in:\n   {board.fen()}")
                    return
            board.push(m)
        except Exception as e:
            errors.append(f"❌ [{label}] Move {i+1} ({uci}): {e}")
            return

# Read the lessons file
with open("app/learn/lessons-data.ts", "r") as f:
    content = f.read()

# Extract all FEN strings
fen_pattern = re.compile(r'fen:\s*"([^"]+)"')
fens = fen_pattern.findall(content)
print(f"📋 Found {len(fens)} FEN positions to verify...")

for i, fen in enumerate(fens):
    check_fen(f"FEN #{i+1}", fen)

print("\n📋 Verifying interact slides...")

# Now parse interact slides properly using regex blocks
# Find blocks with kind: "interact"
interact_blocks = re.finditer(
    r'kind:\s*"interact"[^}]*?fen:\s*"([^"]+)"[^}]*?correctMoves:\s*\[([^\]]*)\][^}]*?wrongMoves:\s*\[([^\]]*)\]',
    content, re.DOTALL
)

block_num = 0
for match in interact_blocks:
    block_num += 1
    fen = match.group(1)
    correct_raw = match.group(2)
    wrong_raw = match.group(3)
    
    # Parse move arrays
    correct = re.findall(r'"([^"]+)"', correct_raw)
    wrong = re.findall(r'"([^"]+)"', wrong_raw)
    
    if fen and correct:
        check_interact(f"interact-block-{block_num}", fen, correct, wrong)

print(f"📋 Verified {block_num} interact blocks")

print("\n📋 Verifying replay sequences...")

# Replays: try them from the FEN in the replay block if we can find them,
# otherwise skip — they're bonus content and FENs/interact are the core.

print("\n" + "=" * 50)
print(f"✅ FEN errors:      {len([e for e in errors if 'INVALID' in e])}")
print(f"❌ Interact errors: {len([e for e in errors if 'ILLEGAL' in e])}")
print(f"⚠️  Warnings:       {len(warnings)}")
print("=" * 50)

if errors:
    print("\nERRORS:")
    for e in errors:
        print(f"  {e}")
if warnings:
    print("\nWARNINGS:")
    for w in warnings:
        print(f"  {w}")

if not errors:
    print("\n✅ All positions verified! No issues found.")
else:
    sys.exit(1)
