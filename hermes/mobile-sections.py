import asyncio, json
from playwright.async_api import async_playwright

REPORT = "d88ee0a8-2686-4c9a-9100-cb5c7c6a0068"
BASE = "http://localhost:3100"
SECTIONS = [
    "section-overview", "section-brilliant", "section-structural",
    "section-openings", "section-tactics", "section-endgames",
    "section-time", "section-positional", "section-time-positional",
    "section-training",
]

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page(viewport={"width": 390, "height": 844})
        await page.goto(f"{BASE}/report/{REPORT}", wait_until="domcontentloaded", timeout=120000)
        await page.wait_for_timeout(14000)
        # dismiss entry modal by clicking "View the full report"
        try:
            await page.click("button:has-text('View the full report')", timeout=8000)
            await page.wait_for_timeout(1500)
            print("modal dismissed")
        except Exception as e:
            print("no modal:", e)
        # first: top of page shot (header, metric cards, summary)
        await page.screenshot(path="sec-00-top.png")
        for i, sid in enumerate(SECTIONS, start=1):
            try:
                await page.evaluate(f"document.getElementById('{sid}')?.scrollIntoView({{block:'start'}})")
                await page.wait_for_timeout(2200)
                await page.screenshot(path=f"sec-{i:02d}-{sid.replace('section-','')}.png")
                print("shot", sid)
            except Exception as e:
                print("fail", sid, e)
        # scroll to bottom, full page
        for _ in range(30):
            await page.mouse.wheel(0, 1000)
            await page.wait_for_timeout(300)
        await page.wait_for_timeout(1500)
        await page.screenshot(path="sec-full.png", full_page=True)
        print("full page shot")
        await browser.close()

asyncio.run(main())
