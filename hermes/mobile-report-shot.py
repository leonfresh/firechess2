import asyncio, sys
from playwright.async_api import async_playwright

REPORT = "d88ee0a8-2686-4c9a-9100-cb5c7c6a0068"
BASE = "http://localhost:3100"

async def shot(page, path, wait=2500):
    await page.wait_for_timeout(wait)
    await page.screenshot(path=path, full_page=False)

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page(viewport={"width": 390, "height": 844})
        await page.goto(f"{BASE}/report/{REPORT}", wait_until="domcontentloaded", timeout=120000)
        await page.wait_for_timeout(12000)
        # top of page (loading shell -> header + toggle)
        await shot(page, "mobile-1-top.png")
        # scroll through in steps to mount all sections
        for i in range(40):
            await page.mouse.wheel(0, 800)
            await page.wait_for_timeout(350)
            if i in (4, 10, 16, 22, 28, 34):
                await shot(page, f"mobile-2-scroll-{i}.png")
        await page.wait_for_timeout(1500)
        # full page capture
        await page.screenshot(path="mobile-3-full.png", full_page=True)
        print("done full report pass")
        await browser.close()

asyncio.run(main())
