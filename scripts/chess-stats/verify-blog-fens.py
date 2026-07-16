#!/usr/bin/env python3
"""Verify all FEN positions in blog posts using python-chess."""
import re, sys, glob, os

os.chdir(os.path.join(os.path.dirname(__file__), "..", "content", "blog"))
import chess

fens = []
for f in sorted(glob.glob("*.md")):
    with open(f) as fh:
        content = fh.read()
    matches = re.findall(r'fen="([^"]+)"', content)
    for fen in matches:
        fens.append((f, fen))

print(f"Found {len(fens)} FEN references across {len(set(f[0] for f in fens))} posts")

errors = []
for name, fen in fens:
    try:
        b = chess.Board(fen)
        if not b.is_valid():
            wk = b.king(chess.WHITE)
            bk = b.king(chess.BLACK)
            diag = []
            if wk is None: diag.append("missing white king")
            if bk is None: diag.append("missing black king")
            if b.is_check(): diag.append("side to move in check")
            errors.append(f"{name}: INVALID {fen}  ({'; '.join(diag)})")
    except Exception as e:
        errors.append(f"{name}: PARSE ERROR {fen} — {e}")

if errors:
    print(f"\n❌ {len(errors)} FEN ERROR(S):")
    for e in errors:
        print(f"  {e}")
else:
    print("\n✅ All FENs valid!")
