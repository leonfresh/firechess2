# Power card artwork

All 30 draft modifiers now have distinct rendered illustrations. Eight already had artwork; this pass added the remaining 22, including every missing epic and legendary card.

The shared `PowerArt` component uses these images in power picks, the opponent reveal and both power collections. Board pieces remain their existing SVGs.

- Original images: `assets/<modifier-id>.png`; Railgun uses `assets/railgun-v2.png` after removing an extra barrel from the first render.
- Tool: built-in `image_gen`, one generation per missing illustration, plus one targeted Railgun edit.
- Exact generation prompts: `base + ' Subject: ' + subjects[id]` in `scripts/power-art-prompts.json`; the targeted Railgun edit is recorded there too.
- Railgun edit prompt: remove only the fifth, front-center barrel and its lightning; restore the ivory torso, preserving the other four barrels, background, lighting, pedestal, battlements and jewel.
- Runtime registry: `app/power-art-catalog.ts`.
- Mobile assets: `prepare:assets` builds 640px WebP thumbnails at quality 85; the four-image atlas uses 1280px. Original PNGs are preserved.
- Visual audit: `node scripts/review-chaos-art.cjs`, then open `http://127.0.0.1:3015`.
- Coverage check: `node --test scripts/chaos-power-art.test.cjs` verifies every draft modifier has unique art and an existing, small deployable thumbnail.

![All 30 illustrations](art/power-art-overview.png)

## Newly illustrated powers

| Tier | Powers |
| --- | --- |
| Rare | Night Rider, Phantom Rook, Sniper Bishop, Pawn Fortress, En Passant Everywhere, Regicide, Knook, Archbishop, Usurper, Toll Gate |
| Epic | Queen Cannon, Warp Queen, Collateral Damage, Ricochet Bishop, Battlefield Promotion, Bishop Cannon |
| Legendary | Kamikaze Bishop, Knight Horde, Undead Army, King Ascension, Rook Cannon, Railgun |

The earlier Amazon and Nuclear Queen artwork remains in use. Opening anomaly artwork is a separate catalogue and was not replaced in this pass.

## Toll Gate

Toll Gate replaced Forced En Passant in Sep 2026 (rare, phases 2-3). It reuses the retired card's
illustration — `assets/toll-gate.png` / `public/activity/toll-gate.webp`, renamed from
`forced-en-passant-v2.png` — which already shows an ivory pawn stopping a navy pawn's two-square
advance with a red alert marker. That is the new rule exactly, so no new generation was needed.
The orphaned `forced-en-passant*.png/webp` files left in `assets/` and `public/activity/` are
unreferenced and can be deleted.
