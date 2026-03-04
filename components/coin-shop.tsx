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
  PIECE_THEMES,
  AVATAR_FRAMES,
  getActiveThemeId,
  setActiveTheme,
  getActiveTitleId,
  setActiveTitle,
  getActiveEvalSkinId,
  setActiveEvalSkin,
  getActivePieceThemeId,
  setActivePieceTheme,
  getActiveFrameId,
  setActiveFrame,
  getPieceImageUrl,
  getShowCoordinates,
  setShowCoordinates,
  type BoardTheme,
  type ProfileTitle,
  type EvalBarSkin,
  type PieceTheme,
  type AvatarFrame,
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
  const [activePieceTheme, setActivePieceThemeState] = useState("piece-default");
  const [activeFrame, setActiveFrameState] = useState("frame-none");
  const [purchased, setPurchased] = useState<string[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [showCoords, setShowCoordsState] = useState(true);

  useEffect(() => {
    setActiveThemeState(getActiveThemeId());
    setActiveTitleState(getActiveTitleId());
    setActiveEvalSkinState(getActiveEvalSkinId());
    setActivePieceThemeState(getActivePieceThemeId());
    setActiveFrameState(getActiveFrameId());
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
    for (const t of PIECE_THEMES) {
      if (t.price === 0 || hasPurchased(t.id)) p.push(t.id);
    }
    for (const f of AVATAR_FRAMES) {
      if (f.price === 0 || hasPurchased(f.id)) p.push(f.id);
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

  const handleBuyPieceTheme = useCallback(
    (pt: PieceTheme) => {
      if (pt.price === 0) {
        setActivePieceTheme(pt.id);
        setActivePieceThemeState(pt.id);
        return;
      }
      if (hasPurchased(pt.id)) {
        setActivePieceTheme(pt.id);
        setActivePieceThemeState(pt.id);
        showToast(`Equipped: ${pt.name}`);
        return;
      }
      const ok = spendCoins(pt.price, pt.id);
      if (!ok) {
        showToast("Not enough coins!");
        return;
      }
      setPurchased((p) => [...p, pt.id]);
      setActivePieceTheme(pt.id);
      setActivePieceThemeState(pt.id);
      showToast(`Purchased & equipped: ${pt.name}`);
    },
    [showToast]
  );

  const handleBuyFrame = useCallback(
    (frame: AvatarFrame) => {
      if (frame.price === 0) {
        setActiveFrame(frame.id);
        setActiveFrameState(frame.id);
        return;
      }
      if (hasPurchased(frame.id)) {
        setActiveFrame(frame.id);
        setActiveFrameState(frame.id);
        showToast(`Equipped: ${frame.name}`);
        return;
      }
      const ok = spendCoins(frame.price, frame.id);
      if (!ok) {
        showToast("Not enough coins!");
        return;
      }
      setPurchased((p) => [...p, frame.id]);
      setActiveFrame(frame.id);
      setActiveFrameState(frame.id);
      showToast(`Purchased & equipped: ${frame.name}`);
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

      {/* ─── Live Preview ─── */}
      {(() => {
        const bt = BOARD_THEMES.find((t) => t.id === activeTheme) ?? BOARD_THEMES[0];
        const es = EVAL_BAR_SKINS.find((s) => s.id === activeEvalSkin) ?? EVAL_BAR_SKINS[0];
        const pt = PIECE_THEMES.find((t) => t.id === activePieceTheme) ?? PIECE_THEMES[0];
        const previewPieces = pt.setName
          ? ["wK", "wQ", "wB", "wN", "wR", "wP", "bK", "bQ", "bB", "bN", "bR", "bP"]
          : null;
        return (
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-white">Preview</h3>
            <div className="flex items-stretch gap-3 rounded-xl border border-white/5 bg-white/[0.02] p-4">
              {/* Eval Bar preview */}
              <div className="flex w-5 shrink-0 overflow-hidden rounded-md" title={`Eval: ${es.name}`}>
                <div className="flex w-full flex-col">
                  <div className="flex-1" style={{ background: `linear-gradient(to bottom, ${es.whiteGradient[0]}, ${es.whiteGradient[1]})` }} />
                  <div className="flex-1" style={{ background: `linear-gradient(to bottom, ${es.blackGradient[0]}, ${es.blackGradient[1]})` }} />
                </div>
              </div>

              {/* Mini board preview */}
              <div className="grid grid-cols-4 grid-rows-4 overflow-hidden rounded-lg" style={{ width: 120, height: 120 }}>
                {Array.from({ length: 16 }).map((_, i) => {
                  const row = Math.floor(i / 4);
                  const col = i % 4;
                  const isLight = (row + col) % 2 === 0;

                  // Place some pieces on the mini board
                  let piece: string | null = null;
                  if (row === 0 && col === 0) piece = "bR";
                  if (row === 0 && col === 1) piece = "bN";
                  if (row === 0 && col === 2) piece = "bB";
                  if (row === 0 && col === 3) piece = "bQ";
                  if (row === 1 && col === 0) piece = "bP";
                  if (row === 1 && col === 2) piece = "bP";
                  if (row === 2 && col === 1) piece = "wN";
                  if (row === 2 && col === 3) piece = "wP";
                  if (row === 3 && col === 0) piece = "wR";
                  if (row === 3 && col === 1) piece = "wB";
                  if (row === 3 && col === 2) piece = "wQ";
                  if (row === 3 && col === 3) piece = "wK";

                  return (
                    <div
                      key={i}
                      className="relative flex items-center justify-center"
                      style={{
                        width: 30,
                        height: 30,
                        backgroundColor: isLight ? bt.lightSquare : bt.darkSquare,
                      }}
                    >
                      {piece && previewPieces && (
                        <img
                          src={getPieceImageUrl(pt.setName!, piece)}
                          alt={piece}
                          className="h-[26px] w-[26px] object-contain"
                          loading="lazy"
                        />
                      )}
                      {piece && !previewPieces && (
                        <span className="text-lg leading-none" style={{ filter: piece.startsWith("b") ? "invert(0)" : "invert(0)", opacity: 0.85 }}>
                          {({
                            wK: "♔", wQ: "♕", wR: "♖", wB: "♗", wN: "♘", wP: "♙",
                            bK: "♚", bQ: "♛", bR: "♜", bB: "♝", bN: "♞", bP: "♟",
                          } as Record<string, string>)[piece]}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Labels */}
              <div className="flex flex-col justify-center gap-1.5">
                <div>
                  <p className="text-[10px] font-medium uppercase tracking-wider text-white/30">Board</p>
                  <p className="text-xs text-white">{bt.name}</p>
                </div>
                <div>
                  <p className="text-[10px] font-medium uppercase tracking-wider text-white/30">Pieces</p>
                  <p className="text-xs text-white">{pt.name}</p>
                </div>
                <div>
                  <p className="text-[10px] font-medium uppercase tracking-wider text-white/30">Eval Bar</p>
                  <p className="text-xs text-white">{es.name}</p>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

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
        <h3 className="text-sm font-semibold text-white">Piece Sets</h3>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {PIECE_THEMES.map((pt) => {
            const owned = pt.price === 0 || purchased.includes(pt.id);
            const active = activePieceTheme === pt.id;
            return (
              <button
                key={pt.id}
                onClick={() => handleBuyPieceTheme(pt)}
                className={`group relative overflow-hidden rounded-xl border p-3 text-left transition-all ${
                  active
                    ? "border-emerald-500/40 bg-emerald-500/[0.06]"
                    : "border-white/5 bg-white/[0.02] hover:border-white/10 hover:bg-white/[0.04]"
                }`}
              >
                {/* Preview — 4 piece images */}
                {pt.setName ? (
                  <div className="mb-2 grid grid-cols-4 gap-0.5">
                    {(["wK", "wQ", "bN", "bR"] as const).map((piece) => (
                      <img
                        key={piece}
                        src={getPieceImageUrl(pt.setName!, piece)}
                        alt={piece}
                        className="h-7 w-7 object-contain"
                        loading="lazy"
                      />
                    ))}
                  </div>
                ) : (
                  <div className="mb-2 flex h-7 items-center justify-center">
                    <span className="text-xs text-white/30">Default</span>
                  </div>
                )}

                <p className="text-xs font-medium text-white">{pt.name}</p>
                <p className="text-[10px] text-white/25">{pt.style}</p>

                <div className="mt-1">
                  {active ? (
                    <span className="text-[10px] font-bold text-emerald-400">Active</span>
                  ) : owned ? (
                    <span className="text-[10px] text-white/30">Owned</span>
                  ) : (
                    <span className="flex items-center gap-1 text-[10px] text-amber-400">
                      <span>🪙</span> {pt.price}
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

      {/* ─── Avatar Frames ─── */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-white">Avatar Frames</h3>
        <p className="text-[11px] text-white/40">Glowing borders and effects for your profile avatar</p>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-6">
          {AVATAR_FRAMES.map((frame) => {
            const owned = purchased.includes(frame.id);
            const equipped = activeFrame === frame.id;
            return (
              <button
                key={frame.id}
                type="button"
                onClick={() => handleBuyFrame(frame)}
                className={`group relative flex flex-col items-center gap-2 rounded-xl border p-3 text-center transition-all ${
                  equipped
                    ? "border-emerald-500/40 bg-emerald-500/10"
                    : "border-white/5 bg-white/[0.02] hover:border-white/10 hover:bg-white/[0.04]"
                }`}
              >
                {/* Preview circle */}
                <div
                  className={`relative flex h-10 w-10 items-center justify-center rounded-full bg-slate-700 text-lg ${frame.frameClass}`}
                  style={frame.frameStyle}
                >
                  👤
                </div>
                <span className="text-[11px] font-medium text-white/70 leading-tight">{frame.name}</span>
                {frame.price === 0 ? (
                  <span className="text-[10px] text-emerald-400">Free</span>
                ) : owned ? (
                  equipped ? (
                    <span className="text-[10px] font-bold text-emerald-400">Equipped ✓</span>
                  ) : (
                    <span className="text-[10px] text-white/30">Owned</span>
                  )
                ) : (
                  <span className="text-[10px] font-bold text-amber-400">🪙 {frame.price}</span>
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
