#!/usr/bin/env python3
"""List files whose working-tree diff contains a firechess.com host swap, and show
the non-host lines for the few that also carry unrelated WIP.

Run: python scripts/seo-commit-scope.py --mine
"""
import re, subprocess, sys

HOST = re.compile(r"firechess\.com")
status = subprocess.run(["git", "status", "--porcelain"], capture_output=True, text=True).stdout
paths = [l[3:].strip().strip('"') for l in status.splitlines() if l.strip()]
mine, mixed = [], []
for p in paths:
    if not p.endswith((".ts", ".tsx", ".md", ".js", ".json", ".xml", ".txt")):
        continue
    d = subprocess.run(["git", "diff", "--no-color", "--", p], capture_output=True, text=True).stdout
    if not d:
        continue
    lines = [l for l in d.splitlines() if l.startswith(("+", "-")) and not l.startswith(("+++", "---"))]
    host = [l for l in lines if HOST.search(l)]
    if not host:
        continue
    mine.append(p)
    other = [l for l in lines if not HOST.search(l)]
    if other:
        mixed.append((p, other))

print(f"HOST-SWAP FILES: {len(mine)}")
print(f"  of which also carrying other WIP: {len(mixed)}\n")
for p, other in mixed:
    print(f"--- {p}  ({len(other)} non-host lines)")
    for l in other[:14]:
        print(f"    {l[:150]}")
