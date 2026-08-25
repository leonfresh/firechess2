import asyncio, json
from playwright.async_api import async_playwright

REPORT = "d88ee0a8-2686-4c9a-9100-cb5c7c6a0068"
BASE = "http://localhost:3100"

MEASURE_JS = """
() => {
  const vw = document.documentElement.clientWidth;
  const out = [{ what: 'viewport', width: vw }];
  const svgTexts = document.querySelectorAll('section#section-overview svg text');
  svgTexts.forEach((t) => {
    const r = t.getBoundingClientRect();
    out.push({
      what: 'svg-text', text: t.textContent,
      left: Math.round(r.left), right: Math.round(r.right), width: Math.round(r.width),
      clippedLeft: r.left < 0, clippedRight: r.right > vw,
    });
  });
  return out;
}
"""

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page(viewport={"width": 390, "height": 844})
        await page.goto(f"{BASE}/report/{REPORT}", wait_until="domcontentloaded", timeout=120000)
        await page.wait_for_timeout(14000)
        try:
            await page.click("button:has-text('View the full report')", timeout=8000)
            await page.wait_for_timeout(1500)
        except Exception:
            pass
        await page.evaluate("document.getElementById('section-overview')?.scrollIntoView({block:'start'})")
        await page.wait_for_timeout(4000)
        result = await page.evaluate(MEASURE_JS)
        print(json.dumps(result, indent=1))
        await browser.close()

asyncio.run(main())
