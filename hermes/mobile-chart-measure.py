import asyncio, json
from playwright.async_api import async_playwright

REPORT = "d88ee0a8-2686-4c9a-9100-cb5c7c6a0068"
BASE = "http://localhost:3100"

MEASURE_JS = """
() => {
  const out = [];
  const vw = document.documentElement.clientWidth;
  out.push({ what: 'viewport', width: vw });

  // 1. Chart y-axis / x-axis labels (recharts renders .recharts-cartesian-axis-tick text)
  const ticks = document.querySelectorAll('.recharts-cartesian-axis-tick text');
  ticks.forEach((t) => {
    const r = t.getBoundingClientRect();
    out.push({
      what: 'chart-tick', text: t.textContent,
      left: Math.round(r.left), right: Math.round(r.right),
      width: Math.round(r.width),
    });
  });

  // 2. The cards containing the two bar charts
  document.querySelectorAll('section#section-overview div').forEach((c, i) => {
    if (!String(c.className).includes('rounded-[1.75rem]')) return;
    const r = c.getBoundingClientRect();
    out.push({ what: 'overview-card-' + i, left: Math.round(r.left), right: Math.round(r.right), width: Math.round(r.width) });
  });

  // 3. Paragraph clipping claims in openings/tactics sections
  const checks = [
    ['Recurring leaks card', 'section#section-openings p'],
    ['Tactics intro', 'section#section-tactics p'],
  ];
  for (const [label, sel] of checks) {
    const el = document.querySelector(sel);
    if (el) {
      const r = el.getBoundingClientRect();
      const card = el.closest('div');
      const cr = card ? card.getBoundingClientRect() : null;
      out.push({
        what: label,
        text: el.textContent.trim().replace(/\\s+/g, ' ').slice(0, 70),
        left: Math.round(r.left), right: Math.round(r.right),
        cardRight: cr ? Math.round(cr.right) : null,
        clipped: cr ? r.right > cr.right + 1 : null,
      });
    }
  }
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
        # go to overview section
        await page.evaluate("document.getElementById('section-overview')?.scrollIntoView({block:'start'})")
        await page.wait_for_timeout(3000)
        # also open the brilliant board (it's below; scroll a bit more)
        result = await page.evaluate(MEASURE_JS)
        print(json.dumps(result, indent=1))
        await browser.close()

asyncio.run(main())
