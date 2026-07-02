#!/usr/bin/env python3
"""Verify FEN positions and moves used in chess lessons."""
import chess

def verify_fen(label: str, fen: str, moves: list[str] | None = None) -> str:
    """Verify a FEN is legal and optionally that a move sequence reaches it."""
    board = chess.Board()
    try:
        board.set_fen(fen)
        assert board.is_valid(), f"Invalid FEN: {fen}"
    except Exception as e:
        return f"❌ {label}: Invalid FEN — {e}"

    if moves:
        board2 = chess.Board()
        for m in moves:
            try:
                board2.push_san(m)
            except Exception as e:
                return f"❌ {label}: Invalid move '{m}' in sequence — {e}"
        # The FEN from moves should match (excluding halfmove/fullmove counters)
        if board2.fen().split(" ")[0] != fen.split(" ")[0]:
            # Show the real FEN for comparison
            return f"❌ {label}: FEN mismatch.\n  Expected: {fen}\n  Got:      {board2.fen()}"

    # Verify specific move is legal
    return f"✅ {label}: OK"

def verify_move(label: str, fen: str, move_uci: str, should_be_legal: bool = True) -> str:
    """Verify a move is legal (or illegal) in a position."""
    board = chess.Board(fen)
    try:
        m = chess.Move.from_uci(move_uci)
        if m in board.legal_moves:
            if should_be_legal:
                return f"✅ {label}: {move_uci} is legal ✓"
            else:
                return f"❌ {label}: {move_uci} should be illegal but it's legal"
        else:
            if should_be_legal:
                return f"❌ {label}: {move_uci} should be legal but it's illegal"
            else:
                return f"✅ {label}: {move_uci} is correctly illegal"
    except Exception as e:
        return f"❌ {label}: {move_uci} — {e}"

if __name__ == "__main__":
    # Test a few positions
    results = []

    # Basic back rank mate position
    results.append(verify_fen(
        "Back rank mate (Black to move)",
        "6k1/5ppp/8/8/8/8/5PPP/R5K1 b - - 0 1",
    ))
    results.append(verify_move(
        "Back rank mate check",
        "6k1/5ppp/8/8/8/8/5PPP/R5K1 b - - 0 1",
        "a1a8",
        True,
    ))

    for r in results:
        print(r)
