#!/usr/bin/env python3
"""De-red the FireChess scan report UI.

Strategy: homepage keeps #ff5a1f as a rare accent. The report page floods
every card with red tints (bg-[#ff5a1f]/[0.03-0.12]), red borders and orange
text. This script converts the flood to the neutral palette used by the
homepage (#121015 cards, #1e1a24 borders, #f0edf2/#8d8696 text), while
preserving red on: primary CTAs, hero stats, live/radar indicators, coach
headlines, active states, glows, and small brand badges.
"""
import re, sys

FILES = [
    r"C:\Users\leonf\NextJs\firechess2\components\scan-session-report.tsx",
    r"C:\Users\leonf\NextJs\firechess2\components\scan-session-page.tsx",
]

# Lines containing any of these are left 100% untouched (red stays).
KEEP_GLOBAL = [
    "shadow-[0_8px_24px_-12px_rgba(255,90,31,0.25)]",   # primary CTAs
    "headlineClass",                                     # coach insight headlines
    "tracking-[0.24em] text-[#ff8c42]",                  # radar ring
    "text-sm font-semibold text-[#ff8c42]",              # radar badge
    "px-3 py-1 text-[#ff8c42]",                          # live badge (follow-up CTA)
    "shadow-md shadow-black/30",                         # active nav pill
    "blur-3xl",                                          # ambient glow
    '? "text-[#ff8c42]"',                                # item emphasis ternaries
    'icon: "bg-[#ff5a1f]/[0.08]',                        # spotlight icon
    "hover:bg-[#ff5a1f]/[0.2]",                          # lesson CTA
    "text-lg font-extrabold text-[#ff8c42]",             # big loading number
    'dot: "bg-[#ff5a1f]"',                               # status dots
]
# scan-session-page.tsx only: hero-area badges / icon keep their red.
KEEP_PAGE = [
    "bg-[#ff5a1f]/[0.08] text-[#ff8c42]",   # hero + plan section badges
    "text-2xl text-[#ff5a1f]",              # plan CTA flame icon
    "bg-[#ff5a1f]/[0.1] text-2xl",          # plan CTA icon circle
]

REPLACEMENTS = [
    # tiny uppercase labels -> muted (must run before generic text rule)
    (r"(?<![-:])text-\[10px\] font-semibold uppercase tracking-\[0\.18em\] text-\[#ff8c42\]",
     "text-[10px] font-semibold uppercase tracking-[0.18em] text-[#8d8696]"),
    (r"(?<![-:])text-\[11px\] font-semibold uppercase tracking-\[0\.18em\] text-\[#ff8c42\]",
     "text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8d8696]"),
    # card washes -> neutral card surface (non-hover only)
    (r"(?<![-:])bg-\[#ff5a1f\]/\[0\.0[3-6]\]", "bg-[#121015]"),
    (r"(?<![-:])bg-\[#ff5a1f\]/\[0\.12\]", "bg-[#121015]"),
    # count pills / small badges -> neutral pill
    (r"(?<![-:])bg-\[#ff5a1f\]/\[0\.08\]", "bg-[#1e1a24]"),
    (r"(?<![-:])bg-\[#ff5a1f\]/10(?=[\s\"])", "bg-[#1e1a24]"),
    # card borders -> neutral (non-hover only)
    (r"(?<![-:])border-\[#ff5a1f\]/25", "border-[#1e1a24]"),
    # remaining orange text -> primary text (non-hover, non-group-hover)
    (r"(?<![-:])text-\[#ff8c42\]", "text-[#f0edf2]"),
]

def transform(path: str, is_page: bool, apply: bool) -> tuple[int, int]:
    with open(path, encoding="utf-8") as f:
        lines = f.readlines()
    kept = changed = 0
    out = []
    for line in lines:
        if any(k in line for k in KEEP_GLOBAL) or (is_page and any(k in line for k in KEEP_PAGE)):
            kept += 1
            out.append(line)
            continue
        new = line
        for pat, rep in REPLACEMENTS:
            new = re.sub(pat, rep, new)
        if new != line:
            changed += 1
        out.append(new)
    if apply:
        with open(path, "w", encoding="utf-8", newline="") as f:
            f.writelines(out)
    return kept, changed

if __name__ == "__main__":
    apply = "--apply" in sys.argv
    total_kept = total_changed = 0
    for p in FILES:
        is_page = p.endswith("scan-session-page.tsx")
        kept, changed = transform(p, is_page, apply)
        total_kept += kept
        total_changed += changed
        print(f"{'APPLIED ' if apply else 'DRY-RUN '} {p.split(chr(92))[-1]}: {changed} lines changed, {kept} lines kept red")
    print(f"TOTAL: {total_changed} changed, {total_kept} kept")
