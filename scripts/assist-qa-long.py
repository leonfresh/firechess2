"""Long-game QA: verifies the assisted/solo sample gate flips from "not enough
moves" to real numbers once both buckets have >= 5 analysed moves.

Plays a knight-shuffle game (always legal early) peeking every turn, then a
second phase with no peeking, and reads the end-of-game comparison card.
"""
import asyncio, os, re
from playwright.async_api import async_playwright

BASE = os.environ.get("QA_BASE", "http://127.0.0.1:3103")
OUT = r"C:\Users\leonf\AppData\Local\Temp\assist-qa"
FINDINGS: list[str] = []


def log(m: str) -> None:
    print(m, flush=True)
    FINDINGS.append(m)


async def norm_body(page) -> str:
    return re.sub(r"\s+", " ", await page.evaluate("() => document.body.innerText"))


async def board_rect(page):
    return await page.evaluate(
        """() => {
        const divs = [...document.querySelectorAll('div')].filter(el => {
          const r = el.getBoundingClientRect();
          return Math.abs(r.width - r.height) < 2 && r.width > 240 && r.width < 1400;
        });
        if (!divs.length) return null;
        divs.sort((a,b) => b.getBoundingClientRect().width - a.getBoundingClientRect().width);
        const r = divs[0].getBoundingClientRect();
        return { x: r.x, y: r.y, w: r.width, h: r.height };
    }"""
    )


async def click_square(page, rect, square):
    f = ord(square[0]) - ord("a")
    r = int(square[1])
    sq = rect["w"] / 8
    await page.mouse.click(rect["x"] + f * sq + sq / 2, rect["y"] + (8 - r) * sq + sq / 2)
    await page.wait_for_timeout(350)


async def try_move(page, rect, frm, to) -> bool:
    """Attempt a move; returns True if it registered (board FEN changed)."""
    before = await page.evaluate("() => document.body.innerText.length")
    await click_square(page, rect, frm)
    await click_square(page, rect, to)
    await page.wait_for_timeout(700)
    body = await norm_body(page)
    if "Opening book exhausted" in body:
        await page.get_by_role("button", name="Continue with Stockfish").click()
        await page.wait_for_timeout(800)
    return await page.evaluate("() => document.body.innerText.length") != before


async def counters(page) -> str:
    return await page.evaluate(
        """() => {
          const el = [...document.querySelectorAll('span')].find(s => s.innerText.startsWith('assisted'));
          return el ? el.innerText.replace(/\\n/g,' ') : 'n/a';
        }"""
    )


async def wait_idle(page, secs=3.0):
    """Wait until it's our turn again (or the game ended)."""
    for _ in range(int(secs * 4)):
        b = await norm_body(page)
        if "your turn" in b or "Game over" in b or "WHAT THE ENGINE" in b:
            return
        await page.wait_for_timeout(250)


SHUFFLE = [("g1", "f3"), ("f3", "g1"), ("b1", "c3"), ("c3", "b1"),
           ("f1", "e2"), ("e2", "f1"), ("d1", "e2"), ("e2", "d1")]


async def play_moves(page, count: int, peek: bool) -> int:
    """Play up to `count` moves for the user, shuffling pieces to stay legal."""
    made = 0
    i = 0
    while made < count and i < 40:
        # Book prompt can land between turns — clear it before touching the board
        if "Opening book exhausted" in await norm_body(page):
            await page.get_by_role("button", name="Continue with Stockfish").click()
            await page.wait_for_timeout(2500)
        if peek:
            try:
                await page.get_by_role("button", name="Show engine moves").click(timeout=6000)
                await page.wait_for_timeout(2500)
            except Exception:
                pass
        rect = await board_rect(page)
        if not rect:
            await page.wait_for_timeout(3000)
            rect = await board_rect(page)
        if not rect:
            log(f"   board gone at iter {i}: " + (await norm_body(page))[:300])
            break
        frm, to = SHUFFLE[i % len(SHUFFLE)]
        ok = await try_move(page, rect, frm, to)
        if ok:
            made += 1
        i += 1
        await wait_idle(page, 6.0)
        if peek:
            try:
                await page.get_by_role("button", name="Hide").click(timeout=3000)
            except Exception:
                pass
    return made


async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page(viewport={"width": 1440, "height": 1000})
        page.on("pageerror", lambda e: log(f"PAGEERROR: {str(e)[:300]}"))

        await page.goto(f"{BASE}/assist", wait_until="domcontentloaded", timeout=90000)
        await page.wait_for_timeout(2500)
        await page.get_by_role("button", name="Start Engine Assist").click()
        await page.wait_for_timeout(3000)

        log("phase A: 6 peeking moves")
        a = await play_moves(page, 6, peek=True)
        log(f"   assisted moves made: {a}; counters: {await counters(page)}")

        log("phase B: 6 solo moves")
        b = await play_moves(page, 6, peek=False)
        log(f"   moves made: {b}; counters: {await counters(page)}")

        await page.get_by_role("button", name="End", exact=True).click()
        await page.wait_for_timeout(2000)
        summary = await norm_body(page)
        m = re.search(r"WHAT THE ENGINE WAS WORTH(.{0,900}?)MOVE QUALITY", summary, re.S)
        log("summary card:\n" + (m.group(1) if m else "CARD NOT FOUND"))
        await page.screenshot(path=os.path.join(OUT, "08-summary-long.png"))
        await browser.close()

    with open(os.path.join(OUT, "findings-long.txt"), "w", encoding="utf-8") as f:
        f.write("\n".join(FINDINGS))


asyncio.run(main())
