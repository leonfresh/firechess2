#!/usr/bin/env python3
"""Ember & Ink token sweep for the support/feedback pages (old zinc palette)."""
import sys, re

FILES = [
    r"C:\Users\leonf\NextJs\firechess2\app\support\page.tsx",
    r"C:\Users\leonf\NextJs\firechess2\app\feedback\page.tsx",
    r"C:\Users\leonf\NextJs\firechess2\app\support\[id]\page.tsx",
]

REPLACEMENTS = [
    # canvas
    ("bg-[#0a0a0a]", "bg-[#070608]"),
    # CTAs: gradient orange->amber -> solid ember
    ("bg-gradient-to-r from-orange-500 to-amber-500", "bg-[#ff5a1f]"),
    ("shadow-lg shadow-orange-500/20 transition hover:shadow-orange-500/30",
     "shadow-lg shadow-black/30 transition hover:-translate-y-0.5"),
    # old white sign-in buttons -> solid ember
    ("bg-white px-5 py-2.5 text-sm font-semibold text-black transition hover:bg-zinc-200",
     "bg-[#ff5a1f] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#ff8c42]"),
    # surfaces
    ("bg-zinc-900/80", "bg-[#181520]"),
    ("bg-zinc-900/60", "bg-[#121015]"),
    ("bg-zinc-900/50", "bg-[#121015]"),
    ("bg-zinc-900", "bg-[#121015]"),
    ("bg-zinc-800/40", "bg-[#121015]"),
    ("bg-zinc-800", "bg-[#1e1a24]"),
    # borders
    ("border-zinc-700/60", "border-[#2a2434]"),
    ("border-zinc-700", "border-[#2a2434]"),
    ("hover:border-zinc-700", "hover:border-[#3a3444]"),
    ("hover:border-zinc-600", "hover:border-[#3a3444]"),
    ("border-zinc-800", "border-[#1e1a24]"),
    # text
    ("text-zinc-200", "text-[#f0edf2]"),
    ("text-zinc-300", "text-[#f0edf2]"),
    ("text-zinc-400", "text-[#8d8696]"),
    ("text-zinc-500", "text-[#565061]"),
    ("text-zinc-600", "text-[#565061]"),
    ("placeholder-zinc-500", "placeholder-[#565061]"),
    # ember accents (active/focus/admin-owner states)
    ("border-orange-500/60 bg-orange-500/10 text-orange-300",
     "border-[#ff5a1f]/40 bg-[#ff5a1f]/[0.08] text-[#ff8c42]"),
    ("focus:border-orange-500/60 focus:outline-none focus:ring-1 focus:ring-orange-500/40",
     "focus:border-[#ff5a1f]/50 focus:outline-none focus:ring-1 focus:ring-[#ff5a1f]/30"),
    ("border-orange-500/20 bg-orange-500/5", "border-[#ff5a1f]/20 bg-[#ff5a1f]/[0.05]"),
    ("bg-orange-500/20 text-orange-400", "bg-[#ff5a1f]/20 text-[#ff8c42]"),
]

def sweep(path: str, apply: bool) -> int:
    with open(path, encoding="utf-8") as f:
        c = f.read()
    orig = c
    for old, new in REPLACEMENTS:
        c = c.replace(old, new)
    if apply:
        with open(path, "w", encoding="utf-8", newline="") as f:
            f.write(c)
    return c != orig

if __name__ == "__main__":
    apply = "--apply" in sys.argv
    for p in FILES:
        changed = sweep(p, apply)
        print(f"{'APPLIED ' if apply else 'DRY-RUN '} {p.split(chr(92))[-1]}: {'changed' if changed else 'no changes'}")
