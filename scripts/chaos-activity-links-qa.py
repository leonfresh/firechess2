"""Activity navigation links must be visible — regression guard for the blanket anchor rule.

    python scripts/chaos-activity-links-qa.py

activity.css carries a broad rule that hides stray anchors leaking into the game view:

    .chaos-activity :where(a:not(.lobby-destination):not(.sound-button):not(.discord-launch-link)){display:none}

Every link the Activity itself renders has to be exempted there, or it silently disappears while the
rest of the UI looks fine (the Leaderboard card is a <button>, so it survived and masked the bug).
`:where()` keeps the rule at low specificity so component-styled links (the rated-status sign-in)
still win. This script asserts the visible set in the lobby at desktop and phone widths.
"""
import sys

from playwright.sync_api import sync_playwright

URL = "https://chaos.firechess.com/"
REQUIRED = {
    "Watch live": (60, 60),          # lobby destination card -> /watch
    "Replays": (60, 60),             # lobby destination card -> /watch?tab=archive
    "Play on Discord": (60, 24),
    "Sign in with FireChess": (60, 24),
}
WIDTHS = [(1200, 900), (390, 800)]


def check(page, width, height):
    page.set_viewport_size({"width": width, "height": height})
    page.goto(URL, wait_until="load", timeout=60000)
    page.wait_for_timeout(5000)
    return page.eval_on_selector_all(
        "a",
        """els => els.map(e => {
             const box = e.getBoundingClientRect();
             return {text: (e.innerText || '').trim().split('\\n')[0], display: getComputedStyle(e).display,
                     w: Math.round(box.width), h: Math.round(box.height)};
           })""",
    )


failures = []
with sync_playwright() as p:
    browser = p.chromium.launch()
    page = browser.new_page()
    for width, height in WIDTHS:
        found = {row["text"]: row for row in check(page, width, height)}
        for label, (min_w, min_h) in REQUIRED.items():
            row = found.get(label)
            if not row:
                failures.append(f"{width}px: {label!r} missing from the DOM")
            elif row["display"] == "none" or row["w"] < min_w or row["h"] < min_h:
                failures.append(f"{width}px: {label!r} hidden or too small ({row['display']}, {row['w']}x{row['h']})")
            else:
                print(f"  ok {width:>5}px  {label:<24} {row['display']:10} {row['w']}x{row['h']}")
    browser.close()

if failures:
    print("\nFAIL: activity links hidden — exempt them in activity.css:")
    for failure in failures:
        print("  -", failure)
    sys.exit(1)
print("\nPASS: lobby destination cards and nav links are visible at desktop and phone widths.")
