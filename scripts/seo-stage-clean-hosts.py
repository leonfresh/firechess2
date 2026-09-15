#!/usr/bin/env python3
"""Stage the clean host-swap files (tracked files whose only diff is the apex->www swap).

Untracked new files are deliberately left alone: they are pipeline WIP, not part of
this change set. Mixed files are excluded here and handled by seo-stage-host-only.py.

Run: python scripts/seo-stage-clean-hosts.py
"""
import re, subprocess

HOST = re.compile(r"firechess\.com")
EXCLUDE = {
    "app/api/checkout/route.ts",
    "app/openings/[slug]/page.tsx",  # mixed, but every added line is mine — staged explicitly
}
status = subprocess.run(["git", "status", "--porcelain"], capture_output=True, text=True).stdout
staged, mixed = [], []
for line in status.splitlines():
    if not line.strip():
        continue
    code, path = line[:2], line[3:].strip().strip('"')
    if code.strip() not in {"M", "D", "R"}:  # skip untracked / staged-only entries
        continue
    if path in EXCLUDE or not path.endswith((".ts", ".tsx", ".js", ".jsx", ".md")):
        continue
    d = subprocess.run(["git", "diff", "--no-color", "--", path], capture_output=True, text=True).stdout
    if not d:
        continue
    lines = [l for l in d.splitlines() if l.startswith(("+", "-")) and not l.startswith(("+++", "---"))]
    if not any(HOST.search(l) for l in lines):
        continue
    if all(HOST.search(l) for l in lines):
        subprocess.run(["git", "add", "--", path], check=True)
        staged.append(path)
    else:
        mixed.append(path)

print(f"staged clean host swaps: {len(staged)}")
if mixed:
    print(f"needs hunk-level staging: {len(mixed)}")
    for m in mixed:
        print(f"   {m}")
