#!/usr/bin/env python3
"""Audit apex-vs-www URL usage across the FireChess repo.

Context: the live site serves on www.firechess.com while the apex
(firechess.com) 307-redirects to it — but canonicals, the sitemap and OG tags
all point at the APEX. Every canonical target is therefore a temporary
redirect, and GSC splits impressions between the two hostnames.

This script lists every place that would need to change to make ONE host
canonical. Read-only.

Run: python scripts/seo-host-audit.py
"""
import os, re, sys
from collections import defaultdict

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SCAN_DIRS = ["app", "lib", "components", "content", "i18n", "public"]
EXTS = {".ts", ".tsx", ".js", ".jsx", ".mjs", ".md", ".json", ".xml", ".txt"}

APEX = re.compile(r"(?<!www\.)https://firechess\.com")
WWW = re.compile(r"https://www\.firechess\.com")

hits = defaultdict(lambda: {"apex": 0, "www": 0, "files": set()})

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
            a, w = len(APEX.findall(text)), len(WWW.findall(text))
            if not a and not w:
                continue
            rel = os.path.relpath(p, ROOT).replace("\\", "/")
            group = rel.split("/")[0] + "/" + (rel.split("/")[1] if "/" in rel[rel.find("/") + 1:] else "")
            g = hits[rel]
            g["apex"] += a
            g["www"] += w
            g["files"].add(rel)

apex_files = {k: v for k, v in hits.items() if v["apex"]}
www_files = {k: v for k, v in hits.items() if v["www"]}

print(f"repo: {ROOT}")
print(f"files referencing APEX (https://firechess.com): {len(apex_files)}")
print(f"files referencing WWW  (https://www.firechess.com): {len(www_files)}")
print()

def show(title, d):
    print(f"=== {title} ===")
    rows = sorted(d.items(), key=lambda kv: -kv[1]["apex"] - kv[1]["www"])
    for path, v in rows:
        print(f"  apex:{v['apex']:>3} www:{v['www']:>3}  {path}")
    print()

# Code that generates URLs (canonicals, sitemap, OG, JSON-LD)
code = {k: v for k, v in hits.items() if k.split("/")[0] in {"app", "lib", "components", "i18n"}}
show("CODE (canonical / sitemap / OG generators)", code)

# Blog post frontmatter canonicals
content = {k: v for k, v in hits.items() if k.startswith("content/")}
show("CONTENT (blog markdown)", content)

# Environment-level, if any
blank = {k: v for k, v in hits.items() if k.split("/")[0] in {"public"}}
if blank:
    show("PUBLIC", blank)

apex_total = sum(v["apex"] for v in hits.values())
www_total = sum(v["www"] for v in hits.values())
print(f"TOTAL references: apex={apex_total}  www={www_total}")
print()
print("Decision needed: pick ONE canonical host, then either")
print("  (a) keep apex canonicals + flip the redirect so www -> apex (301/308), or")
print("  (b) move canonicals/sitemap/OG to www + make the apex redirect permanent.")
sys.exit(0)
