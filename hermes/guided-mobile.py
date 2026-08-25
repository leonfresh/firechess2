import asyncio
from playwright.async_api import async_playwright

REPORT = "d88ee0a8-2686-4c9a-9100-cb5c7c6a0068"
BASE = "http://localhost:3100"

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page(viewport={"width": 390, "height": 844})
        await page.goto(f"{BASE}/report/{REPORT}", wait_until="domcontentloaded", timeout=120000)
        await page.wait_for_timeout(14000)
        # Enter the guided tour
        try:
            await page.click("button:has-text('Take the guided tour')", timeout=8000)
            await page.wait_for_timeout(2500)
            print("entered guided tour")
        except Exception as e:
            print("no entry:", e)
        # walk through steps: capture each step; advance with right arrow / next
        for i in range(12):
            await page.screenshot(path=f"guided-{i:02d}.png")
            # try keyboard right arrow
            try:
                await page.keyboard.press("ArrowRight")
                await page.wait_for_timeout(1500)
            except Exception:
                break
        await browser.close()

asyncio.run(main())
