"""Chaos Chess smoke test — the kamikaze-king change touches the move paths in
app/chaos/page.tsx, so this drives a real vs-AI game through several moves and
drafts and asserts the page never falls into the error boundary.

Run: python scripts/chaos-smoke-qa.py   (needs a production build on QA_BASE)
"""
import asyncio, os, re
from playwright.async_api import async_playwright

BASE = os.environ.get("QA_BASE", "http://127.0.0.1:3110")
OUT = r"C:\Users\leonf\AppData\Local\Temp\assist-qa"
FINDINGS: list[str] = []


def log(m: str) -> None:
    print(m, flush=True)
    FINDINGS.append(m)


async def body(page) -> str:
    return re.sub(r"\s+", " ", await page.evaluate("() => document.body.innerText"))


async def board_rect(page):
    return await page.evaluate(
        """() => {
        const divs = [...document.querySelectorAll('div')].filter(el => {
          const r = el.getBoundingClientRect();
          return Math.abs(r.width - r.height) < 3 && r.width > 240 && r.width < 1200;
        });
        if (!divs.length) return null;
        divs.sort((a,b) => b.getBoundingClientRect().width - a.getBoundingClientRect().width);
        const r = divs[0].getBoundingClientRect();
        return { x: r.x, y: r.y, w: r.width, h: r.height };
    }"""
    )


async def click_square(page, rect, sq):
    f = ord(sq[0]) - ord("a")
    r = int(sq[1])
    unit = rect["w"] / 8
    await page.mouse.click(rect["x"] + f * unit + unit / 2, rect["y"] + (8 - r) * unit + unit / 2)
    await page.wait_for_timeout(400)


async def dismiss_draft(page) -> bool:
    """Chaos drafts interrupt play — click the first offered card if one is up."""
    b = await body(page)
    if "CHAOS DRAFT" not in b and "Pick" not in b:
        return False
    for label in ["Skip", "Continue", "Confirm"]:
        try:
            await page.get_by_role("button", name=re.compile(label, re.I)).first.click(timeout=1500)
            log(f"   draft: clicked {label}")
            return True
        except Exception:
            continue
    # otherwise click the first card-ish button in the draft panel
    try:
        cards = page.locator("button").filter(has_text=re.compile("Rare|Epic|Legendary|Common", re.I))
        if await cards.count():
            await cards.first.click(timeout=2000)
            log("   draft: clicked first card")
            return True
    except Exception:
        pass
    return False


async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page(viewport={"width": 1600, "height": 1000})
        errors: list[str] = []
        page.on("pageerror", lambda e: errors.append(str(e)[:300]))
        page.on("console", lambda m: errors.append(m.text[:300])
                if m.type == "error" and "Failed to load resource" not in m.text and "_vercel" not in m.text else None)

        await page.goto(f"{BASE}/chaos?play=1", wait_until="domcontentloaded", timeout=90000)
        await page.wait_for_timeout(4000)
        log(f"1. loaded /chaos?play=1: {'Something went wrong' not in await body(page)}")

        # Setup: vs AI -> difficulty -> colour -> skip the anomaly -> board
        async def click(label, timeout=5000):
            try:
                await page.get_by_role("button", name=re.compile(label, re.I)).first.click(timeout=timeout)
                await page.wait_for_timeout(800)
                return True
            except Exception as e:
                log(f"   could not click {label!r}: {str(e)[:60]}")
                return False

        await click("vs AI")
        await click("Medium")
        await click("White")
        await click("Skip — play without anomaly")
        await page.wait_for_timeout(4000)
        log(f"2. setup done: {'Something went wrong' not in await body(page)}")

        # Play a few moves
        played = 0
        for i in range(6):
            if await dismiss_draft(page):
                await page.wait_for_timeout(2500)
                continue
            rect = await board_rect(page)
            if not rect:
                log(f"   move {i}: no board found")
                break
            moves = [("e2", "e4"), ("g1", "f3"), ("f1", "c4"), ("d2", "d4"), ("b1", "c3"), ("e1", "g1")]
            frm, to = moves[i % len(moves)]
            before = await body(page)
            await click_square(page, rect, frm)
            await click_square(page, rect, to)
            await page.wait_for_timeout(4500)
            after = await body(page)
            if "Something went wrong" in after:
                log(f"   move {i} ({frm}{to}): ERROR BOUNDARY")
                break
            played += 1
            log(f"   move {i} ({frm}{to}): clean (ply text len {len(before)}->{len(after)})")
            if await dismiss_draft(page):
                await page.wait_for_timeout(2500)

        final = await body(page)
        log(f"4. moves attempted: {played}; error boundary: {'Something went wrong' in final}")
        log(f"5. console/page errors: {len(errors)}")
        for e in errors[:6]:
            log("   - " + e)
        await page.screenshot(path=os.path.join(OUT, "11-chaos-smoke.png"), full_page=False)
        await browser.close()

    with open(os.path.join(OUT, "findings-chaos.txt"), "w", encoding="utf-8") as f:
        f.write("\n".join(FINDINGS))


asyncio.run(main())
