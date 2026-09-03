"""Visual QA for the /daily wizard redesign. Fakes an authed session via route
interception so the fullscreen session + completion states are reachable."""
import asyncio, json, os, pathlib, re
from playwright.async_api import async_playwright

OUT = pathlib.Path(os.environ.get("QA_OUT", r"C:\Users\leonf\AppData\Local\Temp\daily-qa"))
OUT.mkdir(exist_ok=True)

REPORT = {
    "reports": [
        {
            "missedTactics": [
                {
                    "fenBefore": "7k/8/5r2/8/8/8/8/5R1K w - - 0 1",
                    "fenAfter": "7k/8/5r2/8/8/8/8/6K1 w - - 0 1",
                    "userMove": "f1f2",
                    "bestMove": "f1a1",
                    "cpBefore": 0,
                    "cpAfter": -500,
                    "cpLoss": 500,
                    "sideToMove": "w",
                    "userColor": "w",
                    "gameIndex": 0,
                    "moveNumber": 12,
                    "tags": ["Hanging Piece"],
                    "timeRemainingSec": None,
                    "initialTimeSec": None,
                }
            ],
            "leaks": [],
            "diagnostics": {},
            "playerRating": 1500,
        }
    ]
}


def add_fakes(route, extra=""):
    async def handler(r):
        url = r.request.url
        if url.endswith("/api/me"):
            await r.fulfill(
                status=200,
                content_type="application/json",
                body=json.dumps(
                    {
                        "authenticated": True,
                        "plan": "pro",
                        "subscriptionStatus": "active",
                        "user": {"id": "qa", "name": "QA Tester", "email": None, "image": None},
                        "isAdmin": False,
                    }
                ),
            )
        elif "/api/reports" in url:
            await r.fulfill(status=200, content_type="application/json", body=json.dumps(REPORT))
        elif "/api/puzzles" in url:
            await r.fulfill(status=200, content_type="application/json", body=json.dumps({"puzzles": []}))
        elif url.endswith(extra):
            await r.fulfill(status=200, content_type="application/json", body="{}")
        else:
            await r.continue_()

    return handler


async def session_shot(page, name, preseed=None, click_start=False):
    if preseed:
        await page.add_init_script(
            f"localStorage.setItem('fc-daily-routine', JSON.stringify({json.dumps(preseed)}))"
        )
    await page.goto("http://localhost:3100/daily", wait_until="domcontentloaded", timeout=90000)
    await page.wait_for_timeout(4500)
    if click_start:
        try:
            await page.get_by_role("button", name="Start").first.click(timeout=8000)
            await page.wait_for_timeout(2500)
        except Exception as e:
            print(f"start click failed: {e}")
    await page.screenshot(path=str(OUT / f"{name}.png"))
    # measure board if present
    info = await page.evaluate(
        """() => {
            const board = document.querySelector('[id^="daily-"], [id^="memory-"]');
            const r = board ? board.getBoundingClientRect() : null;
            const main = document.querySelector('main');
            return {
                board: r ? { w: Math.round(r.width), h: Math.round(r.height) } : null,
                scrollH: main ? main.scrollHeight : null,
                innerH: window.innerHeight,
                bodyOverflow: document.body.style.overflow,
            };
        }"""
    )
    print(f"[{name}] {json.dumps(info)}")
    # dump visible text for sanity
    txt = await page.evaluate("() => document.body.innerText.slice(0, 700)")
    print(f"[{name}] text: {txt[:350]!r}")


async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch()

        # 1. Unauthenticated gate (no interception)
        ctx = await browser.new_context(viewport={"width": 1440, "height": 900})
        pg = await ctx.new_page()
        await session_shot(pg, "1-unauth")
        await ctx.close()

        # 2. Session intro — desktop 1440
        ctx = await browser.new_context(viewport={"width": 1440, "height": 900})
        await ctx.route("**/api/**", add_fakes(ctx))
        pg = await ctx.new_page()
        await session_shot(pg, "2-session-intro-1440")
        await ctx.close()

        # 3. Session playing — desktop 1920 (board size check)
        ctx = await browser.new_context(viewport={"width": 1920, "height": 1080})
        await ctx.route("**/api/**", add_fakes(ctx))
        pg = await ctx.new_page()
        await session_shot(pg, "3-session-playing-1920", click_start=True)
        await ctx.close()

        # 4. Session intro — mobile
        ctx = await browser.new_context(viewport={"width": 390, "height": 844}, device_scale_factor=2)
        await ctx.route("**/api/**", add_fakes(ctx))
        pg = await ctx.new_page()
        await session_shot(pg, "4-session-mobile")
        await ctx.close()

        # 5. Completion (preseed routine = already done today)
        import datetime

        today = datetime.date.today().strftime("%a %b %d %Y").replace("  ", " ")
        ctx = await browser.new_context(viewport={"width": 1440, "height": 900})
        await ctx.route("**/api/**", add_fakes(ctx))
        pg = await ctx.new_page()
        await session_shot(
            pg,
            "5-complete",
            preseed={
                "date": today,
                "lastCompleted": today,
                "streak": 4,
                "correctCount": 5,
                "totalCount": 6,
            },
        )
        await ctx.close()

        await browser.close()
        print(f"\nDONE → {OUT}")


asyncio.run(main())
