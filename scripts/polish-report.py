#!/usr/bin/env python3
"""Report page polish: bring scan-session-report.tsx up to the homepage's
nl3 signature details (pill eyebrows, hover-lift cards, deep inner surfaces,
tighter titles). Idempotent-ish: skips lines that already carry the targets."""
import re, sys

PATH = r"C:\Users\leonf\NextJs\firechess2\components\scan-session-report.tsx"

PILL = (
    "inline-flex items-center rounded-full border border-[#ff5a1f]/20 "
    "bg-[#ff5a1f]/[0.08] px-3 py-1 text-[11px] font-semibold uppercase "
    "tracking-[0.15em] text-[#ff8c42]"
)
HOVER = " transition-all duration-300 hover:-translate-y-0.5 hover:border-[#ff5a1f]/20"

def transform(c: str) -> str:
    n_pill = n_lift = n_deep = n_title = 0
    out_lines = []
    for line in c.splitlines(keepends=True):
        new = line

        # D) tighter section titles (homepage uses bold -0.03em, not extrabold)
        if "text-2xl font-extrabold tracking-tight text-white" in new:
            new = new.replace(
                "text-2xl font-extrabold tracking-tight text-white",
                "text-2xl font-bold tracking-[-0.02em] text-white",
            )
            n_title += 1

        # B) hover lift on big section cards (skip skeletons & anything w/ hover)
        m = re.search(
            r'(rounded-\[1\.[57]5rem\] border border-\[#1e1a24\] bg-\[#121015\])(?! )',
            new,
        )
        if (
            m
            and "animate-pulse" not in new
            and "hover:" not in new
            and "transition" not in new
            and "pointer-events-none" not in new
        ):
            new = new.replace(m.group(1), m.group(1) + HOVER, 1)
            n_lift += 1

        # C) small inner boxes get the deeper canvas (homepage inner-demo recipe)
        if "rounded-xl border border-[#1e1a24] bg-[#121015]" in new and "hover:" not in new:
            new = new.replace(
                "rounded-xl border border-[#1e1a24] bg-[#121015]",
                "rounded-xl border border-[#1e1a24] bg-[#070608]",
            )
            n_deep += 1

        out_lines.append(new)
    c2 = "".join(out_lines)

    # A) SectionHeader eyebrow -> ember pill (component-local, single site)
    c2, n_pill = re.subn(
        r'<p className="text-\[11px\] font-semibold uppercase tracking-\[0\.22em\] text-\[#565061\]">',
        f'<p className="{PILL}">',
        c2,
    )
    print(f"pills={n_pill} lift={n_lift} deep={n_deep} titles={n_title}")
    return c2

if __name__ == "__main__":
    with open(PATH, encoding="utf-8") as f:
        c = f.read()
    c2 = transform(c)
    if "--apply" in sys.argv:
        with open(PATH, "w", encoding="utf-8", newline="") as f:
            f.write(c2)
        print("APPLIED")
    else:
        print("DRY-RUN")
