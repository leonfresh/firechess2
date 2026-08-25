import asyncio, json
from playwright.async_api import async_playwright

REPORT = "d88ee0a8-2686-4c9a-9100-cb5c7c6a0068"
BASE = "http://localhost:3100"

MEASURE_JS = """
() => {
  const out = [];
  const card = document.querySelector('.fixed.inset-0 .max-w-lg');
  if (!card) return { error: 'no modal card found' };
  const cr = card.getBoundingClientRect();
  out.push({ what: 'modal card', left: cr.left, right: cr.right, width: cr.width, clientWidth: card.clientWidth, scrollWidth: card.scrollWidth });
  for (const el of card.querySelectorAll('h2, p, button')) {
    const r = el.getBoundingClientRect();
    const style = getComputedStyle(el);
    out.push({
      what: el.tagName,
      text: (el.textContent || '').trim().replace(/\\s+/g, ' ').slice(0, 60),
      left: Math.round(r.left), right: Math.round(r.right),
      width: Math.round(r.width),
      scrollWidth: el.scrollWidth, clientWidth: el.clientWidth,
      overflowX: style.overflowX, whiteSpace: style.whiteSpace,
      font: style.fontSize + '/' + style.lineHeight,
      padRight: style.paddingRight,
    });
  }
  // viewport
  out.push({ what: 'viewport', width: document.documentElement.clientWidth, bodyScrollW: document.body.scrollWidth });
  return out;
}
"""

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page(viewport={"width": 390, "height": 844})
        await page.goto(f"{BASE}/report/{REPORT}", wait_until="domcontentloaded", timeout=120000)
        await page.wait_for_timeout(14000)
        result = await page.evaluate(MEASURE_JS)
        print(json.dumps(result, indent=1))
        await browser.close()

asyncio.run(main())
