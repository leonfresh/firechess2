#!/usr/bin/env python3
"""Drop the always-now `lastModified: new Date()` claims from app/sitemap.ts.

Every entry asserting "modified just now" on every request teaches Google to ignore
the sitemap's lastmod signal entirely - including on the blog posts where the date is
real and useful. Keeping lastmod only where an actual date exists restores the signal.

Keeps `lastModified: new Date(post.date)` (blog posts + translations).

Run: python scripts/seo-sitemap-lastmod-fix.py
"""
import os, re, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
path = os.path.join(ROOT, "app", "sitemap.ts")
src = open(path, encoding="utf-8").read()

pattern = re.compile(r"^[ \t]*lastModified: new Date\(\),\r?\n", re.M)
hits = len(pattern.findall(src))
if not hits:
    print("nothing to do — no always-now lastModified left")
    raise SystemExit(0)

new = pattern.sub("", src)
if "--apply" in sys.argv:
    open(path, "w", encoding="utf-8", newline="").write(new)
    kept = len(re.findall(r"lastModified: new Date\(post\.date\)", new))
    print(f"removed {hits} always-now lastModified; kept {kept} real post dates")
else:
    print(f"DRY RUN: would remove {hits} always-now lastModified lines (--apply to write)")
