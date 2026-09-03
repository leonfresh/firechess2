"""QA the /coach "why engine": analyze a PGN, then step through every move
(dumping chips + narration for bad moves, sampling good ones) + screenshots."""
import asyncio, json, re, os, pathlib
from playwright.async_api import async_playwright

PGN = os.environ.get(
    "QA_PGN",
    """[Event "San Luis WCT 2005"]
[Site "San Luis ARG"]
[Date "2005.09.30"]
[White "Anand, Viswanathan"]
[Black "Topalov, Veselin"]
[Result "*"]

1. e4 c5 2. Nf3 d6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 a6 6. Be2 e6 7. O-O Be7 8. a4 Nc6 9. Be3 O-O 10. f4 Qc7 11. Kh1 Re8 12. Bf3 Bd7 13. Nb3 b6 14. g4 Bc8 15. g5 Nd7 16. Bg2 Bb7 17. Rf3 Rac8 18. Rh3 Nf8 *
""",
)

OUT = pathlib.Path(os.environ.get("QA_OUT", r"C:\Users\leonf\AppData\Local\Temp\coach-qa"))
OUT.mkdir(exist_ok=True)

def safe(name: str) -> str:
    return re.sub(r"[^\w.-]", "_", name)


async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page(viewport={"width": 1440, "height": 1000})
        await page.goto("http://localhost:3100/coach", wait_until="domcontentloaded", timeout=90000)
        await page.wait_for_timeout(3000)

        await page.get_by_role("button", name="Import PGN").click()
        await page.wait_for_timeout(400)
        await page.locator("textarea").fill(PGN)
        await page.get_by_role("button", name="Start Lesson").click()

        print("waiting for analysis...", flush=True)
        try:
            await page.wait_for_selector("[data-move-idx]", timeout=1800000)
        except Exception:
            print("TIMEOUT waiting for analysis")
            await page.screenshot(path=str(OUT / "timeout.png"))
            return
        print("analysis done", flush=True)
        await page.screenshot(path=str(OUT / "done-full.png"))

        # All moves with their classification icons
        moves = await page.eval_on_selector_all(
            "button[data-move-idx]",
            "els => els.map(e => ({ idx: e.getAttribute('data-move-idx'), san: e.textContent.trim() }))",
        )
        bad = [m for m in moves if "?" in m["san"]]
        good = [m for m in moves if "?" not in m["san"]]
        print(f"total moves: {len(moves)}, bad: {len(bad)}", flush=True)

        # Sample up to 3 good moves too (sanity: nothing broke on the happy path)
        interesting = bad + good[:: max(1, len(good) // 3)][:3]

        results = []
        seen = set()
        page_errors = []
        page.on("pageerror", lambda e: page_errors.append(str(e)))
        for b in interesting:
            idx = b["idx"]
            if idx in seen:
                continue
            seen.add(idx)
            await page.locator(f"button[data-move-idx='{idx}']").click()
            await page.wait_for_timeout(2200)
            chips = await page.eval_on_selector_all(
                "div.mb-2 > span", "els => els.map(e => e.textContent.trim())"
            )
            narration = ""
            try:
                narration = await page.eval_on_selector(
                    "p.text-sm.leading-relaxed.text-slate-200",
                    "e => e ? e.textContent.trim() : ''",
                )
            except Exception:
                pass
            variation = ""
            try:
                variation = await page.eval_on_selector(
                    "p.text-xs.leading-relaxed.text-slate-300",
                    "e => e ? e.textContent.trim() : ''",
                )
            except Exception:
                pass
            badge = ""
            try:
                badge = await page.eval_on_selector(
                    "div.pointer-events-none.absolute.inset-x-0.bottom-0.z-20 div",
                    "e => e ? e.textContent.trim() : ''",
                )
            except Exception:
                pass
            entry = {
                "idx": idx,
                "san": b["san"],
                "badge": badge,
                "chips": chips,
                "narration": narration,
                "variation": variation,
            }
            meas = await page.evaluate(
                """() => {
                  const img = document.querySelector('img[src*="/move-badges/"]');
                  const box = img && img.parentElement ? img.parentElement.getBoundingClientRect() : null;
                  const anyCanvas = document.querySelector('canvas, .cg-board, [class*="cg-board"]');
                  return {
                    board: box ? { w: Math.round(box.width), h: Math.round(box.height) } : null,
                    boardCanvas: !!anyCanvas,
                    cornerBadges: document.querySelectorAll('img[src*="/move-badges/"]').length,
                    pills: [...document.querySelectorAll('button[data-move-idx] span')].filter(s => /inaccuracy|mistake|blunder/i.test(s.textContent || '')).length,
                  };
                }"""
            )
            entry["meas"] = meas
            results.append(entry)
            print("meas:", meas, flush=True)
            rowbadge = await page.eval_on_selector(
                f"button[data-move-idx='{idx}']",
                "e => e ? e.textContent.trim() : ''",
            )
            print("rowbadge:", rowbadge, flush=True)
            if page_errors:
                print("pageerrors:", page_errors[-2:], flush=True)
            print(f"\n--- move {b['san']} ---", flush=True)
            print("badge:", badge, flush=True)
            print("chips:", chips, flush=True)
            print("narration:", narration, flush=True)
            if variation:
                print("variation:", variation, flush=True)
            await page.screenshot(path=str(OUT / f"move-{idx}-{safe(b['san'])}.png"))

        with open(OUT / "results.json", "w") as f:
            json.dump(results, f, indent=2)
        print(f"\nDONE — {len(results)} moves captured → {OUT}", flush=True)
        await browser.close()


asyncio.run(main())
