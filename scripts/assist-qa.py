"""QA for the Engine Assist mode (/assist + /sparring mode toggle).

Drives the real production build on :3100 — starts a game, peeks, plays an
assisted move and a solo move, then reads the end-of-game split card.
Run: python scripts/assist-qa.py
"""
import asyncio, json, os, pathlib, re
from playwright.async_api import async_playwright

BASE = os.environ.get("QA_BASE", "http://127.0.0.1:3100")
OUT = pathlib.Path(os.environ.get("QA_OUT", r"C:\Users\leonf\AppData\Local\Temp\assist-qa"))
OUT.mkdir(parents=True, exist_ok=True)
FINDINGS: list[str] = []
SHOTS: list[str] = []


def log(msg: str) -> None:
    print(msg, flush=True)
    FINDINGS.append(msg)


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


async def square_xy(page, rect, square: str):
    file = ord(square[0]) - ord("a")
    rank = int(square[1])
    sq = rect["w"] / 8
    x = rect["x"] + file * sq + sq / 2
    y = rect["y"] + (8 - rank) * sq + sq / 2
    return x, y


async def click_square(page, rect, square: str):
    x, y = await square_xy(page, rect, square)
    await page.mouse.click(x, y)
    await page.wait_for_timeout(300)


async def shot(page, name: str):
    p = OUT / f"{name}.png"
    await page.screenshot(path=str(p), full_page=False)
    SHOTS.append(str(p))


async def wait_for_text(page, needle: str, timeout_s: int = 60) -> bool:
    needle_n = re.sub(r"\s+", " ", needle)
    for _ in range(int(timeout_s / 0.5)):
        body = await page.evaluate("() => document.body.innerText")
        if needle_n in re.sub(r"\s+", " ", body):
            return True
        await page.wait_for_timeout(500)
    return False


async def handle_out_of_book(page) -> bool:
    """The local box can't always reach the Lichess Explorer — continue vs Stockfish."""
    body = await page.evaluate("() => document.body.innerText")
    if "Opening book exhausted" in body:
        await page.get_by_role("button", name="Continue with Stockfish").click()
        await page.wait_for_timeout(1500)
        return True
    return False


async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page(viewport={"width": 1440, "height": 1000})

        console_errors: list[str] = []
        page.on("console", lambda m: console_errors.append(m.text) if m.type == "error" else None)

        # ---------- 1. Setup screen ----------
        await page.goto(f"{BASE}/assist", wait_until="domcontentloaded", timeout=90000)
        await page.wait_for_timeout(2500)
        body = await page.evaluate("() => document.body.innerText")
        h1 = await page.evaluate("() => document.querySelector('h1')?.textContent")
        log(f"1. setup h1: {h1!r}")
        for expect in ["Engine Assist", "Opening Sparring", "Peeks per game", "Unlimited", "Start Engine Assist"]:
            log(f"   setup contains {expect!r}: {expect in body}")
        await shot(page, "01-setup")

        # ---------- 2. Start the game ----------
        await page.get_by_role("button", name="Start Engine Assist").click()
        ok = await wait_for_text(page, "Show engine moves", timeout_s=30)
        log(f"2. game started, assist panel visible: {ok}")
        rect = await board_rect(page)
        log(f"   board rect: {rect}")
        if rect:
            vh = await page.evaluate("() => window.innerHeight")
            log(f"   viewport height {vh} → board {rect['w']:.0f}px (cap rule: min(avail, vh-300))")
        await shot(page, "02-playing-closed")

        # ---------- 3. Peek ----------
        await page.get_by_role("button", name="Show engine moves").click()
        got_lines = await wait_for_text(page, "#2", timeout_s=45)
        panel = await page.evaluate(
            """() => {
              const sec = [...document.querySelectorAll('section')].find(s => s.innerText.includes('Engine Assist'));
              return sec ? sec.innerText : '';
          }"""
        )
        log(f"3. assist panel after peek (lines={got_lines}):\n{panel}")
        arrow_hex = await page.evaluate(
            """() => {
               const html = document.body.innerHTML;
               const hits = (html.match(/255,\\s*140,\\s*66/g) || []).length;
               return hits;
           }"""
        )
        log(f"   ember arrow colour occurrences in DOM: {arrow_hex}")
        await shot(page, "03-peek-open")

        # ---------- 4. Play an ASSISTED move ----------
        rect = await board_rect(page)
        await click_square(page, rect, "e2")
        await click_square(page, rect, "e4")
        await page.wait_for_timeout(1200)
        oob = await handle_out_of_book(page)
        log(f"4. after assisted move — out-of-book prompt handled: {oob}")
        got = await wait_for_text(page, "assisted 1", timeout_s=60)
        log(f"   assisted move logged: {got}")
        await page.wait_for_timeout(8000)
        counters = await page.evaluate(
            """() => {
              const el = [...document.querySelectorAll('span')].find(s => s.innerText.startsWith('assisted'));
              return el ? el.innerText.replace(/\\n/g,' ') : 'n/a';
           }"""
        )
        log(f"   counters after assisted move: {counters!r}")
        await shot(page, "04-after-assisted-move")

        # ---------- 5. Play a SOLO move (panel stays closed) ----------
        rect = await board_rect(page)
        log(f"   board rect before solo move: {rect}")
        await click_square(page, rect, "d2")
        await click_square(page, rect, "d4")
        await page.wait_for_timeout(1200)
        oob = await handle_out_of_book(page)
        log(f"5. after solo move — out-of-book prompt handled: {oob}")
        got = await wait_for_text(page, "solo 1", timeout_s=60)
        log(f"   solo move logged: {got}")
        await page.wait_for_timeout(8000)
        counters = await page.evaluate(
            """() => {
              const el = [...document.querySelectorAll('span')].find(s => s.innerText.startsWith('assisted'));
              return el ? el.innerText.replace(/\\n/g,' ') : 'n/a';
           }"""
        )
        log(f"   counters after solo move: {counters!r}")
        await shot(page, "05-after-solo-move")

        # ---------- 6. End → summary ----------
        await page.get_by_role("button", name="End", exact=True).click()
        await page.wait_for_timeout(1500)
        summary = await page.evaluate("() => document.body.innerText")
        summary = re.sub(r"\s+", " ", summary)
        for needle in ["What the engine was worth", "Assisted", "Solo", "matched the top line", "peek"]:
            log(f"6. summary contains {needle!r}: {needle in summary}")
        m = re.search(r"What the engine was worth(.{0,700})", summary, re.S)
        log("   split card text:\n" + (m.group(1) if m else "NOT FOUND"))
        await shot(page, "06-summary")

        # ---------- 7. Peek budget path ----------
        await page.get_by_role("button", name="New Game").click()
        await page.wait_for_timeout(1200)
        await page.get_by_role("button", name="1 peek", exact=True).click()
        await page.wait_for_timeout(300)
        await page.get_by_role("button", name="Start Engine Assist").click()
        await wait_for_text(page, "1 of 1 peeks left", timeout_s=30)
        await page.get_by_role("button", name="Show engine moves").click()
        await wait_for_text(page, "#1", timeout_s=45)
        await page.get_by_role("button", name="Hide").click()
        await page.wait_for_timeout(500)
        disabled = await page.evaluate(
            """() => {
              const b = [...document.querySelectorAll('button')].find(x => x.innerText.includes('No peeks left'));
              return b ? { found: true, disabled: b.disabled } : { found: false };
           }"""
        )
        log(f"7. budget=1 exhaustion state: {disabled}")
        await shot(page, "07-budget-exhausted")

        # ---------- 8. Console errors ----------
        errs = [e for e in console_errors if "favicon" not in e.lower()]
        log(f"8. console errors: {len(errs)}")
        for e in errs[:8]:
            log("   - " + e[:220])

        await browser.close()

    (OUT / "findings.txt").write_text("\n".join(FINDINGS), encoding="utf-8")
    print("\nSCREENSHOTS:")
    for s in SHOTS:
        print(" ", s)


asyncio.run(main())
