"use client";

/**
 * CoinShop — dashboard widget where users spend coins on cosmetics.
 *
 * Sections:
 *   1. Balance header + recent earning history
 *   2. Board Themes grid
 *   3. Profile Titles grid
 */

import { useState, useCallback, useEffect } from "react";
import { spendCoins, hasPurchased } from "@/lib/coins";
import {
  BOARD_THEMES,
  PROFILE_TITLES,
  EVAL_BAR_SKINS,
  getActiveThemeId,
  setActiveTheme,
  getActiveTitleId,
  setActiveTitle,
  getActiveEvalSkinId,
  setActiveEvalSkin,
  getShowCoordinates,
  setShowCoordinates,
  type BoardTheme,
  type ProfileTitle,
  type EvalBarSkin,
} from "@/lib/board-themes";
import { useCoinBalance, useCoinLog } from "@/lib/use-coins";

/* ------------------------------------------------------------------ */
/*  Main Component                                                      */
/* ------------------------------------------------------------------ */

export function CoinShop() {
  const balance = useCoinBalance();
  const log = useCoinLog();
  const [activeTheme, setActiveThemeState] = useState("classic");
  const [activeTitle, setActiveTitleState] = useState<string | null>(null);
  const [activeEvalSkin, setActiveEvalSkinState] = useState("eval-default");
  const [purchased, setPurchased] = useState<string[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [showCoords, setShowCoordsState] = useState(true);

  useEffect(() => {
    setActiveThemeState(getActiveThemeId());
    setActiveTitleState(getActiveTitleId());
    setActiveEvalSkinState(getActiveEvalSkinId());
    setShowCoordsState(getShowCoordinates());
    // Build purchased list
    const p: string[] = [];
    for (const t of BOARD_THEMES) {
      if (t.price === 0 || hasPurchased(t.id)) p.push(t.id);
    }
    for (const t of PROFILE_TITLES) {
      if (hasPurchased(t.id)) p.push(t.id);
    }
    for (const t of EVAL_BAR_SKINS) {
      if (t.price === 0 || hasPurchased(t.id)) p.push(t.id);
    }
    setPurchased(p);
  }, []);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2000);
  }, []);

  const handleBuyTheme = useCallback(
    (theme: BoardTheme) => {
      if (theme.price === 0) {
        setActiveTheme(theme.id);
        setActiveThemeState(theme.id);
        return;
      }
      if (hasPurchased(theme.id)) {
        // Already purchased — just equip
        setActiveTheme(theme.id);
        setActiveThemeState(theme.id);
        showToast(`Equipped: ${theme.name}`);
        return;
      }
      // Purchase
      const ok = spendCoins(theme.price, theme.id);
      if (!ok) {
        showToast("Not enough coins!");
        return;
      }
      setPurchased((p) => [...p, theme.id]);
      setActiveTheme(theme.id);
      setActiveThemeState(theme.id);
      showToast(`Purchased & equipped: ${theme.name}`);
    },
    [showToast]
  );

  const handleBuyTitle = useCallback(
    (title: ProfileTitle) => {
      if (hasPurchased(title.id)) {
        // Toggle equip/unequip
        if (activeTitle === title.id) {
          setActiveTitle(null);
          setActiveTitleState(null);
        } else {
          setActiveTitle(title.id);
          setActiveTitleState(title.id);
        }
        return;
      }
      const ok = spendCoins(title.price, title.id);
      if (!ok) {
        showToast("Not enough coins!");
        return;
      }
      setPurchased((p) => [...p, title.id]);
      setActiveTitle(title.id);
      setActiveTitleState(title.id);
      showToast(`Purchased: ${title.name}`);
    },
    [activeTitle, showToast]
  );

  const handleBuyEvalSkin = useCallback(
    (skin: EvalBarSkin) => {
      if (skin.price === 0) {
        setActiveEvalSkin(skin.id);
        setActiveEvalSkinState(skin.id);
        return;
      }
      if (hasPurchased(skin.id)) {
        setActiveEvalSkin(skin.id);
        setActiveEvalSkinState(skin.id);
        showToast(`Equipped: ${skin.name}`);
        return;
      }
      const ok = spendCoins(skin.price, skin.id);
      if (!ok) {
        showToast("Not enough coins!");
        return;
      }
      setPurchased((p) => [...p, skin.id]);
      setActiveEvalSkin(skin.id);
      setActiveEvalSkinState(skin.id);
      showToast(`Purchased & equipped: ${skin.name}`);
    },
    [showToast]
  );

  return (
    <div className="glass-card relative space-y-6 p-6">
      {/* Toast */}
      {toast && (
        <div className="absolute left-1/2 top-4 z-30 -translate-x-1/2 animate-fade-in-up rounded-xl bg-emerald-500/20 px-4 py-2 text-sm font-bold text-emerald-400 backdrop-blur">
          {toast}
        </div>
      )}

      {/* ─── Header ─── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500/20 to-yellow-500/20 text-xl">
            🪙
          </span>
          <div>
            <h2 className="text-lg font-semibold text-white">Coin Shop</h2>
            <p className="text-xs text-white/40">
              Earn coins from activities, spend on cosmetics
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="rounded-lg border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[11px] text-white/40 transition-colors hover:bg-white/[0.08]"
          >
            {showHistory ? "Hide" : "History"}
          </button>
          <div className="flex items-center gap-1.5 rounded-xl bg-amber-500/10 px-3 py-1.5">
            <span className="text-sm">🪙</span>
            <span className="text-sm font-bold text-amber-400">
              {balance.toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* ─── Earning History (collapsible) ─── */}
      {showHistory && (
        <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-white/30">
            Recent Activity
          </h3>
          {log.length === 0 ? (
            <p className="text-xs text-white/20">
              No coins earned yet. Complete challenges and tasks to earn!
            </p>
          ) : (
            <div className="max-h-40 space-y-1.5 overflow-y-auto">
              {log.slice(0, 20).map((tx, i) => (
                <div
                  key={`${tx.timestamp}-${i}`}
                  className="flex items-center justify-between text-xs"
                >
                  <span className="text-white/40">{tx.label}</span>
                  <span
                    className={`font-mono font-bold ${
                      tx.amount > 0 ? "text-emerald-400" : "text-red-400"
                    }`}
                  >
                    {tx.amount > 0 ? "+" : ""}
                    {tx.amount}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ─── Board Themes ─── */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-white">Board Themes</h3>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {BOARD_THEMES.map((theme) => {
            const owned = theme.price === 0 || purchased.includes(theme.id);
            const active = activeTheme === theme.id;
            return (
              <button
                key={theme.id}
                onClick={() => handleBuyTheme(theme)}
                className={`group relative overflow-hidden rounded-xl border p-3 text-left transition-all ${
                  active
                    ? "border-emerald-500/40 bg-emerald-500/[0.06]"
                    : "border-white/5 bg-white/[0.02] hover:border-white/10 hover:bg-white/[0.04]"
                }`}
              >
                {/* Preview squares */}
                <div className="mb-2 flex gap-0.5 overflow-hidden rounded-lg">
                  <div
                    className="h-6 flex-1"
                    style={{ backgroundColor: theme.lightSquare }}
                  />
                  <div
                    className="h-6 flex-1"
                    style={{ backgroundColor: theme.darkSquare }}
                  />
                  <div
                    className="h-6 flex-1"
                    style={{ backgroundColor: theme.lightSquare }}
                  />
                  <div
                    className="h-6 flex-1"
                    style={{ backgroundColor: theme.darkSquare }}
                  />
                </div>

                <p className="text-xs font-medium text-white">{theme.name}</p>

                {/* Price / status */}
                <div className="mt-1">
                  {active ? (
                    <span className="text-[10px] font-bold text-emerald-400">
                      Active
                    </span>
                  ) : owned ? (
                    <span className="text-[10px] text-white/30">Owned</span>
                  ) : (
                    <span className="flex items-center gap-1 text-[10px] text-amber-400">
                      <span>🪙</span> {theme.price}
                    </span>
                  )}
                </div>

                {/* Lock icon */}
                {!owned && (
                  <div className="absolute right-1.5 top-1.5 rounded-full bg-black/30 p-1">
                    <svg
                      className="h-3 w-3 text-white/30"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 1a4.5 4.5 0 00-4.5 4.5V9H5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2h-.5V5.5A4.5 4.5 0 0010 1zm3 8V5.5a3 3 0 10-6 0V9h6z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ─── Eval Bar Skins ─── */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-white">Eval Bar Skins</h3>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {EVAL_BAR_SKINS.map((skin) => {
            const owned = skin.price === 0 || purchased.includes(skin.id);
            const active = activeEvalSkin === skin.id;
            return (
              <button
                key={skin.id}
                onClick={() => handleBuyEvalSkin(skin)}
                className={`group relative overflow-hidden rounded-xl border p-3 text-left transition-all ${
                  active
                    ? "border-emerald-500/40 bg-emerald-500/[0.06]"
                    : "border-white/5 bg-white/[0.02] hover:border-white/10 hover:bg-white/[0.04]"
                }`}
              >
                {/* Preview — mini eval bar */}
                <div className="mx-auto mb-2 flex h-10 w-4 overflow-hidden rounded">
                  <div className="flex w-full flex-col">
                    <div
                      className="flex-1"
                      style={{ background: `linear-gradient(to bottom, ${skin.whiteGradient[0]}, ${skin.whiteGradient[1]})` }}
                    />
                    <div
                      className="flex-1"
                      style={{ background: `linear-gradient(to bottom, ${skin.blackGradient[0]}, ${skin.blackGradient[1]})` }}
                    />
                  </div>
                </div>

                <p className="text-center text-xs font-medium text-white">{skin.name}</p>

                <div className="mt-1 text-center">
                  {active ? (
                    <span className="text-[10px] font-bold text-emerald-400">Active</span>
                  ) : owned ? (
                    <span className="text-[10px] text-white/30">Owned</span>
                  ) : (
                    <span className="flex items-center justify-center gap-1 text-[10px] text-amber-400">
                      <span>🪙</span> {skin.price}
                    </span>
                  )}
                </div>

                {!owned && (
                  <div className="absolute right-1.5 top-1.5 rounded-full bg-black/30 p-1">
                    <svg className="h-3 w-3 text-white/30" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 1a4.5 4.5 0 00-4.5 4.5V9H5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2h-.5V5.5A4.5 4.5 0 0010 1zm3 8V5.5a3 3 0 10-6 0V9h6z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ─── Profile Titles ─── */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-white">Profile Titles</h3>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {PROFILE_TITLES.map((title) => {
            const owned = purchased.includes(title.id);
            const active = activeTitle === title.id;
            return (
              <button
                key={title.id}
                onClick={() => handleBuyTitle(title)}
                className={`relative overflow-hidden rounded-xl border p-3 text-left transition-all ${
                  active
                    ? "border-emerald-500/40 bg-emerald-500/[0.06]"
                    : "border-white/5 bg-white/[0.02] hover:border-white/10 hover:bg-white/[0.04]"
                }`}
              >
                <span className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] font-bold ${title.badgeClass}`}>
                  {title.name}
                </span>

                <div className="mt-2">
                  {active ? (
                    <span className="text-[10px] font-bold text-emerald-400">
                      Equipped
                    </span>
                  ) : owned ? (
                    <span className="text-[10px] text-white/30">Owned — tap to equip</span>
                  ) : (
                    <span className="flex items-center gap-1 text-[10px] text-amber-400">
                      <span>🪙</span> {title.price}
                    </span>
                  )}
                </div>

                {/* Lock icon */}
                {!owned && (
                  <div className="absolute right-1.5 top-1.5 rounded-full bg-black/30 p-1">
                    <svg
                      className="h-3 w-3 text-white/30"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 1a4.5 4.5 0 00-4.5 4.5V9H5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2h-.5V5.5A4.5 4.5 0 0010 1zm3 8V5.5a3 3 0 10-6 0V9h6z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ─── Board Settings ─── */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-white">Board Settings</h3>
        <div className="flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.02] p-4">
          <div className="flex items-center gap-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-500/10 text-sm">🔢</span>
            <div>
              <p className="text-sm font-medium text-white">Board Coordinates</p>
              <p className="text-[11px] text-white/40">Show rank &amp; file labels (a–h, 1–8) on all boards</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              const next = !showCoords;
              setShowCoordsState(next);
              setShowCoordinates(next);
              showToast(next ? "Coordinates shown" : "Coordinates hidden");
            }}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ${
              showCoords ? "bg-emerald-500" : "bg-white/10"
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform duration-200 ${
                showCoords ? "translate-x-5" : "translate-x-0"
              }`}
            />
          </button>
        </div>
      </div>

      {/* ─── How to Earn ─── */}
      <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-white/30">
          How to Earn Coins
        </h3>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <EarnInfo icon="🧩" label="Daily Challenge" amount="+10" />
          <EarnInfo icon="📊" label="Save a Scan" amount="+5" />
          <EarnInfo icon="🏅" label="Achievement" amount="+20" />
          <EarnInfo icon="✅" label="Study Task" amount="+5" />
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Sub-components                                                      */
/* ------------------------------------------------------------------ */

function EarnInfo({
  icon,
  label,
  amount,
}: {
  icon: string;
  label: string;
  amount: string;
}) {
  return (
    <div className="flex items-center gap-2 rounded-lg bg-white/[0.02] p-2">
      <span className="text-base">{icon}</span>
      <div>
        <p className="text-[10px] text-white/40">{label}</p>
        <p className="text-xs font-bold text-amber-400">{amount}</p>
      </div>
    </div>
  );
}
