"""Visual QA for the modernized /dashboard — fakes an authed session + reports."""
import asyncio, json, os, pathlib
from playwright.async_api import async_playwright

OUT = pathlib.Path(os.environ.get("QA_OUT", r"C:\Users\leonf\AppData\Local\Temp\dashboard-qa"))
OUT.mkdir(exist_ok=True)

NOW = int(asyncio.get_event_loop().time() * 1000) if False else None  # placeholder


def mk_report(overrides, days_ago):
    import datetime

    base = {
        "id": overrides.get("id", "rep-1"),
        "chessUsername": "leonfresh",
        "source": "lichess",
        "scanMode": "full",
        "createdAt": (datetime.datetime.now(datetime.timezone.utc) - datetime.timedelta(days=days_ago)).isoformat(),
        "gamesAnalyzed": 42,
        "engineDepth": 18,
        "estimatedAccuracy": 87.4 if days_ago == 0 else 81.2,
        "estimatedRating": 1520,
        "weightedCpLoss": 38,
        "severeLeakRate": 0.08,
        "leakCount": 4,
        "tacticsCount": 7,
        "reportMeta": {
            "vibeTitle": "Grinder",
            "consistencyScore": 72,
            "p75CpLoss": 55,
            "confidence": 88,
            "topTag": "Knight Fork",
            "sampleSize": 840,
        },
        "missedTactics": [
            {
                "fenBefore": "7k/8/5r2/8/8/8/8/5R1K w - - 0 1",
                "fenAfter": "x",
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
        "leaks": [
            {
                "openingName": "Italian Game",
                "fenBefore": "r1bqkbnr/pppp1ppp/2n5/4p3/4P3/2N2N2/PPPP1PPP/R1BQKB1R w KQkq - 2 3",
                "reachCount": 5,
                "cpLoss": 120,
            }
        ],
        "diagnostics": {},
        "playerRating": 1520,
    }
    base.update(overrides)
    return base


REPORTS = [
    mk_report({"id": "rep-legacy", "scanMode": "full", "chessUsername": "leonfresh", "days": 0}, 0),
    mk_report({"id": "rep-old", "scanMode": "full", "chessUsername": "leonfresh", "days": 12}, 12),
    mk_report(
        {"id": "rep-link", "scanSessionId": "abc-123", "scanMode": "tactics", "chessUsername": "altacc__x", "days": 4},
        4,
    ),
    mk_report({"id": "rep-time", "scanMode": "time-management", "days": 1}, 1),
]


async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch()

        async def fake(r):
            u = r.request.url
            if u.endswith("/api/me"):
                await r.fulfill(status=200, content_type="application/json", body=json.dumps(
                    {"authenticated": True, "plan": "pro", "subscriptionStatus": "active",
                     "user": {"id": "qa", "name": "Leon", "email": "x@x.com", "image": None}, "isAdmin": False}
                ))
            elif "/api/reports" in u:
                await r.fulfill(status=200, content_type="application/json", body=json.dumps({"reports": REPORTS}))
            elif "/api/puzzles" in u:
                await r.fulfill(status=200, content_type="application/json", body=json.dumps({"puzzles": []}))
            else:
                await r.fulfill(status=200, content_type="application/json", body="{}")

        ctx = await b.new_context(viewport={"width": 1440, "height": 1000})
        await ctx.route("**/api/**", fake)
        pg = await ctx.new_page()
        await pg.goto("http://localhost:3100/dashboard", wait_until="domcontentloaded", timeout=90000)
        await pg.wait_for_timeout(7000)

        # dismiss any welcome/onboarding modal (Escape + click close buttons)
        try:
            await pg.keyboard.press("Escape")
            await pg.wait_for_timeout(400)
        except Exception:
            pass
        try:
            closes = pg.locator("button").filter(has_text="✕")
            if await closes.count():
                await closes.first.click(timeout=2000)
        except Exception:
            pass
        try:
            await pg.get_by_role("button", name="Close").first.click(timeout=1500)
        except Exception:
            pass
        try:
            await pg.get_by_role("button", name="Start tour").first.click(timeout=1200)
        except Exception:
            pass
        await pg.keyboard.press("Escape")
        await pg.wait_for_timeout(500)

        # shell sanity + scoped hue census inside <main>
        info = await pg.evaluate(
            """() => {
              const body = document.body.innerText;
              const hasKicker = /COMMAND CENTER/.test(body);
              const hits = [...document.querySelectorAll('main [class]')].filter(el => {
                if (el.closest('[class*="fixed"], [class*="z-[9"], [class*="z-[2"], [class*="z-[1"]')) return false;
                const r = el.getBoundingClientRect();
                if (r.width === 0 && r.height === 0) return false;
                return /cyan-|fuchsia-|violet-|purple-|sky-|indigo-|emerald-|amber-|orange-/.test(el.className || '');
              }).map(el => (el.className || '').toString());
              return {
                hasKicker,
                hueCount: hits.length,
                hueSamples: [...new Set(hits)].slice(0, 14),
                scrollH: document.documentElement.scrollHeight,
              };
            }"""
        )
        print("info:", json.dumps(info, indent=1))
        await pg.screenshot(path=str(OUT / "1-dashboard-top.png"))
        await pg.mouse.wheel(0, 1400)
        await pg.wait_for_timeout(900)
        await pg.screenshot(path=str(OUT / "2-dashboard-mid.png"))

        # JS-click the first expandable report row (bypasses any leftover overlay)
        try:
            await pg.evaluate(
                """() => {
                  const btn = document.querySelector("div[data-tour='reports'] button");
                  if (btn) btn.click();
                }"""
            )
        except Exception as e:
            print("row click:", e)
        await pg.wait_for_timeout(1600)
        await pg.screenshot(path=str(OUT / "3-dashboard-expanded.png"))
        txt = await pg.evaluate("() => document.body.innerText.slice(0, 900)")
        print("text:", txt[:400].replace("\\n", " | "))
        await b.close()
        print(f"DONE → {OUT}")


asyncio.run(main())
