"""Watchtower timer QA — the live board and the live list must show running clocks.

Reads .vercel/watch-timer-fixture.json (written by scripts/chaos-watch-timer-fixture.mjs),
opens the deployed Watchtower and asserts the clock chips render, the time control is
shown, exactly the side on the move ticks, and the resting clock stays put.

Run: python scripts/chaos-watch-timer-qa.py   (QA_BASE overrides production)
"""
import asyncio, json, os, re, sys
from playwright.async_api import async_playwright

BASE = os.environ.get("QA_BASE", "https://www.firechess.com")
FIXTURE = os.environ.get("QA_FIXTURE", ".vercel/watch-timer-fixture.json")
FINDINGS: list[str] = []


def log(m: str) -> None:
    print(m, flush=True)
    FINDINGS.append(m)


async def clock_chips(page):
    return await page.evaluate(
        """() => [...document.querySelectorAll('b')]
             .map(el => el.textContent.trim())
             .filter(t => /^\\d+:\\d{2}$/.test(t))"""
    )


async def rows(page):
    return await page.evaluate(
        """() => [...document.querySelectorAll('li')].map(el => el.innerText.replace(/\\s+/g,' ').trim())"""
    )


async def main() -> int:
    fixture = json.load(open(FIXTURE))
    room = fixture["roomId"]
    errors: list[str] = []
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page(viewport={"width": 1280, "height": 900})
        page.on("pageerror", lambda e: errors.append(str(e)))

        # 1. The live list carries running clocks, not just the time control.
        await page.goto(f"{BASE}/watch?tab=live", wait_until="domcontentloaded")
        await page.wait_for_timeout(5000)
        listed = [r for r in await rows(page) if "Watchtower Clock" in r]
        assert listed, "The live list must show the fixture room"
        row = listed[0]
        log(f"live row: {row}")
        assert re.search(r"\d+:\d{2}", row), "The live list row must show a running clock"
        assert "5+3" in row, "The live list row must show the 5+3 control"

        # 2. The live board shows both clocks, the control and the side to move.
        await page.goto(f"{BASE}/watch?room={room}", wait_until="domcontentloaded")
        await page.wait_for_timeout(5000)
        status = re.sub(r"\s+", " ", await page.evaluate("() => document.body.innerText"))
        assert "5+3" in status, "The status bar must show the time control"
        assert "white to move" in status.lower(), f"The status bar must name the side to move (got: {status[:160]})"
        first = await clock_chips(page)
        assert len(first) == 2, f"Both clocks must render (got {first})"
        log(f"clocks at t0: {first}")

        # 3. Only the side on the move ticks (top block is Black, White is to move).
        await page.wait_for_timeout(3000)
        second = await clock_chips(page)
        log(f"clocks at t+3s: {second}")
        def secs(t: str) -> int:
            m, s = t.split(":")
            return int(m) * 60 + int(s)
        moved = [i for i in range(2) if secs(second[i]) < secs(first[i])]
        assert moved, "The clock of the side on the move must tick down"
        assert len(moved) == 1, f"Only the moving side may tick (ticked {moved})"
        assert moved[0] == 1, "White is on the move, so White's clock sits below the board and ticks"
        assert not errors, f"Console errors: {errors}"
        await browser.close()
    log("PASS: live list clocks, board clocks, control chip, side-to-move status and a single ticking clock.")
    return 0


if __name__ == "__main__":
    try:
        sys.exit(asyncio.run(main()))
    except AssertionError as exc:
        print(f"FAIL: {exc}", flush=True)
        sys.exit(1)
