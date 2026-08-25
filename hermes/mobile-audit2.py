import asyncio, json
from playwright.async_api import async_playwright

REPORT = "d88ee0a8-2686-4c9a-9100-cb5c7c6a0068"
BASE = "http://localhost:3100"

AUDIT_JS = """
() => {
  const vw = document.documentElement.clientWidth;
  const issues = [];
  for (const el of document.querySelectorAll('*')) {
    const r = el.getBoundingClientRect();
    if (r.width === 0 && r.height === 0) continue;
    const cs = getComputedStyle(el);
    // skip decorations & carousel off-screen slides
    if (cs.position === 'absolute' || cs.position === 'fixed') continue;
    if (String(el.className).includes('snap-center')) continue;
    if (el.closest('[class*="snap-center"]')) continue;
    let bad = r.right > vw + 1 || r.left < -1 || r.width > vw + 1;
    if (!bad) continue;
    // breadcrumb of ancestors
    const chain = [];
    let node = el;
    while (node && chain.length < 4) {
      chain.push(node.tagName + (String(node.className).slice(0, 60) ? '.' + String(node.className).slice(0, 60) : ''));
      node = node.parentElement;
    }
    issues.push({
      tag: el.tagName,
      cls: String(el.className).slice(0, 110),
      left: Math.round(r.left), right: Math.round(r.right), width: Math.round(r.width),
      text: (el.textContent || '').trim().replace(/\\s+/g, ' ').slice(0, 90),
      chain: chain,
    });
  }
  return { viewport: vw, count: issues.length, issues: issues.slice(0, 80) };
}
"""

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page(viewport={"width": 390, "height": 844})
        await page.goto(f"{BASE}/report/{REPORT}", wait_until="domcontentloaded", timeout=120000)
        await page.wait_for_timeout(12000)
        for i in range(40):
            await page.mouse.wheel(0, 800)
            await page.wait_for_timeout(300)
        await page.wait_for_timeout(2000)
        result = await page.evaluate(AUDIT_JS)
        print(json.dumps(result, indent=1)[:9000])
        await browser.close()

asyncio.run(main())
