"""QA: sparring hands over to Stockfish seamlessly, with no prompt.

The local box can't reach explorer.lichess.org, so the database phase returns
nothing immediately — which makes this the perfect harness for the handover:
the opponent must reply ANYWAY (Stockfish), with no "Opening book exhausted"
screen and no button to press.

Also proves the game keeps flowing for several turns afterwards.
Run: python scripts/sparring-seamless-qa.py
"""
import asyncio, os, re
from playwright.async_api import async_playwright

BASE = os.environ.get("QA_BASE", "http://127.0.0.1:3106")
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
          return Math.abs(r.width - r.height) < 2 && r.width > 240 && r.width < 1400;
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
    await page.wait_for_timeout(350)


async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page(viewport={"width": 1440, "height": 1000})
        page.on("pageerror", lambda e: log(f"PAGEERROR: {str(e)[:300]}"))

        await page.goto(f"{BASE}/sparring", wait_until="domcontentloaded", timeout=90000)
        await page.wait_for_timeout(2500)
        await page.get_by_role("button", name="Start Sparring").click()
        await page.wait_for_timeout(3000)
        log(f"1. started; header: {(await body(page))[60:220]}")

        moves = [("e2", "e4"), ("g1", "f3"), ("f1", "c4")]
        prompt_seen = False
        for idx, (frm, to) in enumerate(moves, start=1):
            rect = await board_rect(page)
            await click_square(page, rect, frm)
            await click_square(page, rect, to)

            # The opponent must reply on its own — watch for our turn to return
            replied = False
            for _ in range(60):  # up to 30s per reply
                await page.wait_for_timeout(500)
                b = await body(page)
                if "Opening book exhausted" in b:
                    prompt_seen = True
                if "your turn" in b and "thinking" not in b:
                    replied = True
                    break
            state = await body(page)
            header = re.search(r"vs \d+ · ([^|]{0,80}?) assisted|vs \d+ · ([^\n]{0,80})", state)
            log(
                f"2.{idx} move {frm}{to}: replied={replied} prompt={'YES' if prompt_seen else 'no'} | "
                f"opponent status: {(header.group(2) if header else 'n/a').strip()[:70]!r}"
            )
            status = re.search(
                r"(Opponent played[^|]{0,90}|Stockfish takes over[^|]{0,60})", state
            )
            log(f"     status line: {status.group(0) if status else 'n/a'!r}")

        final = await body(page)
        log(f"3. header after 3 exchanges: {'Stockfish depth' in final}")
        log(f"4. 'Opening book exhausted' ever shown: {prompt_seen}")
        plies = re.findall(r"\b[1-3]\.\s*(\S+)\s+(\S+)", final)
        log(f"5. move list: {plies[:4]}")

        await page.screenshot(path=os.path.join(OUT, "10-seamless.png"))
        await browser.close()

    with open(os.path.join(OUT, "findings-seamless.txt"), "w", encoding="utf-8") as f:
        f.write("\n".join(FINDINGS))


asyncio.run(main())
