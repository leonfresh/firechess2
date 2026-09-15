#!/usr/bin/env python3
"""Align FireChess canonical/OG/sitemap base URLs with the host that actually serves.

Live reality: www.firechess.com serves, firechess.com 308-redirects to it.
The code, however, emitted apex URLs in canonicals, sitemap, JSON-LD and OG tags —
so every canonical target was a redirect, which is why GSC reported the same post
twice (www + apex) and consolidation stalled.

Dry run (default) prints every reference; --apply rewrites them to www.

Run: python scripts/seo-align-canonical-host.py [--apply]
"""
import os, re, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SCAN_DIRS = ["app", "lib", "components", "content", "i18n", "public"]
EXTS = {".ts", ".tsx", ".js", ".jsx", ".mjs", ".md", ".json", ".xml", ".txt"}

# apex URL not already prefixed with www. Negative lookbehind on www. — a
# lookahead on "/" here would silently skip every deep-path URL in a template
# literal (e.g. `https://firechess.com/blog/${slug}`), which is how the blog
# routes escaped the first pass.
APEX = re.compile(r"(?<!www\.)https://firechess\.com")

apply = "--apply" in sys.argv
changed, total = [], 0

for d in SCAN_DIRS:
    base = os.path.join(ROOT, d)
    if not os.path.isdir(base):
        continue
    for dirpath, dirnames, filenames in os.walk(base):
        dirnames[:] = [x for x in dirnames if x not in {"node_modules", ".next", ".git"}]
        for fn in filenames:
            if os.path.splitext(fn)[1] not in EXTS:
                continue
            p = os.path.join(dirpath, fn)
            try:
                text = open(p, encoding="utf-8", errors="ignore").read()
            except OSError:
                continue
            hits = APEX.findall(text)
            if not hits:
                continue
            rel = os.path.relpath(p, ROOT).replace("\\", "/")
            total += len(hits)
            changed.append((rel, len(hits)))
            if apply:
                new = APEX.sub("https://www.firechess.com", text)
                with open(p, "w", encoding="utf-8", newline="") as f:
                    f.write(new)

print(f"{'APPLIED' if apply else 'DRY RUN'}: {total} apex references in {len(changed)} files")
for rel, n in sorted(changed, key=lambda kv: -kv[1]):
    print(f"  {n:>3}  {rel}")
if not apply:
    print("\nre-run with --apply to rewrite them to https://www.firechess.com")
