"""Grep the JS a live page actually runs — the only way to verify client-side changes here.

Next.js lazy chunks are not in the served HTML, so a static fetch finds nothing; this drives a real
browser, captures every script response, then reports which bundles contain each needle.

Usage:
    python scripts/verify-live-bundles.py https://chaos.firechess.com "Toll Gate" "rank 6 for White"
    python scripts/verify-live-bundles.py https://chaos.firechess.com --absent="Forced En Passant"

Positional arguments must appear in some live bundle; --absent=NEEDLE (repeatable) must appear in none.
"""
import sys
from playwright.sync_api import sync_playwright


def main() -> int:
    args = sys.argv[1:]
    if not args:
        print(__doc__)
        return 2
    url, *rest = args
    present = [a for a in rest if not a.startswith("--absent=")]
    absent = [a[len("--absent="):] for a in rest if a.startswith("--absent=")]
    if not present and not absent:
        print(__doc__)
        return 2

    bodies: dict[str, str] = {}
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page(viewport={"width": 1280, "height": 900})
        seen: set[str] = set()
        page.on("response", lambda r: seen.add(r.url))
        page.goto(url, wait_until="load", timeout=90000)
        page.wait_for_timeout(10000)
        print("title:", page.title()[:70])
        for u in seen:
            if ".js" in u:
                try:
                    bodies[u] = page.request.get(u).text()
                except Exception:
                    bodies[u] = ""
        browser.close()

    loaded = sum(1 for v in bodies.values() if v)
    print(f"js bundles loaded: {loaded}")
    if loaded == 0:
        print("VERDICT: FAIL — no bundles captured")
        return 1
    failures = 0
    for needle in present:
        hits = [u.rsplit("/", 1)[-1][:30] for u, body in bodies.items() if body and needle in body]
        print(f"  {needle!r}: {len(hits)} bundle(s) {hits[:2]}")
        if not hits:
            failures += 1
    for needle in absent:
        hits = [u.rsplit("/", 1)[-1][:30] for u, body in bodies.items() if body and needle in body]
        print(f"  absent {needle!r}: {len(hits)} bundle(s) {hits[:2]}")
        if hits:
            failures += 1
    if failures:
        print(f"VERDICT: FAIL — {failures} check(s) wrong")
        return 1
    print("VERDICT: PASS")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
