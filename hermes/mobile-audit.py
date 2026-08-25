import asyncio, json
from playwright.async_api import async_playwright

REPORT = "d88ee0a8-2686-4c9a-9100-cb5c7c6a0068"
BASE = "http://localhost:3100"

AUDIT_JS = """
() => {
  const vw = document.documentElement.clientWidth;
  const issues = [];
  const seen = new Set();
  for (const el of document.querySelectorAll('*')) {
    const r = el.getBoundingClientRect();
    if (r.width === 0 && r.height === 0) continue;
    let bad = false;
    if (r.right > vw + 1 || r.left < -1) bad = true;
    if (r.width > vw + 1) bad = true;
    if (bad) {
      const key = el.tagName + '.' + (el.className?.toString?.().slice(0,80) || '');
      if (seen.has(key)) continue;
      seen.add(key);
      const cs = getComputedStyle(el);
      issues.push({
        tag: el.tagName,
        cls: String(el.className).slice(0, 100),
        left: Math.round(r.left), right: Math.round(r.right),
        width: Math.round(r.width), overflowX: cs.overflowX,
        pos: cs.position,
      });
    }
  }
  return {
    viewport: vw,
    scrollWidth: document.documentElement.scrollWidth,
    overflowCount: issues.length,
    issues: issues.slice(0, 60),
  };
}
"""

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page(viewport={"width": 390, "height": 844})
        await page.goto(f"{BASE}/report/{REPORT}", wait_until="domcontentloaded", timeout=120000)
        await page.wait_for_timeout(12000)
        # scroll through everything so lazy sections mount, then audit
        for i in range(40):
            await page.mouse.wheel(0, 800)
            await page.wait_for_timeout(300)
        await page.wait_for_timeout(2000)
        result = await page.evaluate(AUDIT_JS)
        print(json.dumps(result, indent=1)[:6000])
        # also audit the top of page only (before scrolling) for the shell/header
        await page.evaluate("window.scrollTo(0,0)")
        await page.wait_for_timeout(1200)
        top = await page.evaluate(AUDIT_JS)
        print("TOP-ONLY:", json.dumps({k: top[k] for k in ("viewport","scrollWidth","overflowCount")}))
        await browser.close()

asyncio.run(main())
