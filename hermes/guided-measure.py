import asyncio, json
from playwright.async_api import async_playwright

REPORT = "d88ee0a8-2686-4c9a-9100-cb5c7c6a0068"
BASE = "http://localhost:3100"

MEASURE_JS = """
() => {
  const vw = document.documentElement.clientWidth;
  const out = [{ what: 'viewport', width: vw }];
  try {
  for (const el of document.querySelectorAll('h1, h2, h3, p, span, div, button')) {
    const r = el.getBoundingClientRect();
    if (r.width === 0) continue;
    const cs = getComputedStyle(el);
    // only elements that actually overflow their own box or the viewport
    const overflowsBox = el.scrollWidth > el.clientWidth + 1 && (cs.overflowX === 'hidden' || cs.whiteSpace === 'nowrap');
    const crossesScreen = r.right > vw + 1 || r.left < -1;
    if (!overflowsBox && !crossesScreen) continue;
    out.push({
      tag: el.tagName,
      cls: String(el.className).slice(0, 90),
      text: (el.textContent || '').trim().replace(/\\s+/g, ' ').slice(0, 50),
      left: Math.round(r.left), right: Math.round(r.right), width: Math.round(r.width),
      scrollW: el.scrollWidth, clientW: el.clientWidth,
      whiteSpace: cs.whiteSpace, overflowX: cs.overflowX,
      pos: cs.position,
    });
  }
  } catch (e) { out.push({ error: String(e) }); }
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
            await page.click("button:has-text('Take the guided tour')", timeout=8000)
            await page.wait_for_timeout(2500)
        except Exception as e:
            print("no entry:", e)
        for step in range(10):
            result = await page.evaluate(MEASURE_JS)
            if not isinstance(result, list):
                print("RAW:", json.dumps(result)[:2000])
                break
            real = [x for x in result if x.get('what') != 'viewport']
            print(f"--- step {step}: {len(real)} overflow elements")
            for x in real[:12]:
                print("   ", json.dumps(x))
            # advance
            try:
                await page.keyboard.press("ArrowRight")
                await page.wait_for_timeout(1600)
            except Exception:
                break
        await browser.close()

asyncio.run(main())
