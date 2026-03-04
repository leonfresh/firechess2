"use client";

/**
 * React hooks for the coin economy and board themes.
 * Listens for custom events so all components update in sync.
 */

import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { getBalance, getLog, syncCoinsFromDb, type CoinTransaction } from "@/lib/coins";
import {
  getActiveTheme,
  getActiveTitle,
  getActiveEvalSkin,
  getShowCoordinates,
  getActivePieceTheme,
  getCustomPieces,
  type BoardTheme,
  type ProfileTitle,
  type EvalBarSkin,
  type PieceTheme,
} from "@/lib/board-themes";

/* ------------------------------------------------------------------ */
/*  useCoinBalance — reactive coin counter                              */
/* ------------------------------------------------------------------ */

export function useCoinBalance(): number {
  const [balance, setBalance] = useState(0);
  const syncedRef = useRef(false);

  useEffect(() => {
    setBalance(getBalance());

    // Sync from DB on first mount (fire-and-forget)
    if (!syncedRef.current) {
      syncedRef.current = true;
      syncCoinsFromDb().catch(() => {});
    }

    const handler = (e: Event) => {
      setBalance((e as CustomEvent).detail as number);
    };
    window.addEventListener("fc-coins-changed", handler);
    return () => window.removeEventListener("fc-coins-changed", handler);
  }, []);

  return balance;
}

/* ------------------------------------------------------------------ */
/*  useCoinLog — reactive transaction history                           */
/* ------------------------------------------------------------------ */

export function useCoinLog(): CoinTransaction[] {
  const [log, setLog] = useState<CoinTransaction[]>([]);

  useEffect(() => {
    setLog(getLog());
    const handler = () => setLog(getLog());
    window.addEventListener("fc-coins-changed", handler);
    return () => window.removeEventListener("fc-coins-changed", handler);
  }, []);

  return log;
}

/* ------------------------------------------------------------------ */
/*  useBoardTheme — reactive board theme                                */
/* ------------------------------------------------------------------ */

export function useBoardTheme(): BoardTheme {
  const [theme, setTheme] = useState<BoardTheme>(() => getActiveTheme());

  useEffect(() => {
    setTheme(getActiveTheme());
    const handler = () => setTheme(getActiveTheme());
    window.addEventListener("fc-theme-changed", handler);
    return () => window.removeEventListener("fc-theme-changed", handler);
  }, []);

  return theme;
}

/* ------------------------------------------------------------------ */
/*  useProfileTitle — reactive profile title                            */
/* ------------------------------------------------------------------ */

export function useProfileTitle(): ProfileTitle | null {
  const [title, setTitle] = useState<ProfileTitle | null>(null);

  useEffect(() => {
    setTitle(getActiveTitle());
    const handler = () => setTitle(getActiveTitle());
    window.addEventListener("fc-title-changed", handler);
    return () => window.removeEventListener("fc-title-changed", handler);
  }, []);

  return title;
}

/* ------------------------------------------------------------------ */
/*  useEvalBarSkin — reactive eval bar skin                             */
/* ------------------------------------------------------------------ */

export function useEvalBarSkin(): EvalBarSkin {
  const [skin, setSkin] = useState<EvalBarSkin>(() => getActiveEvalSkin());

  useEffect(() => {
    setSkin(getActiveEvalSkin());
    const handler = () => setSkin(getActiveEvalSkin());
    window.addEventListener("fc-eval-skin-changed", handler);
    return () => window.removeEventListener("fc-eval-skin-changed", handler);
  }, []);

  return skin;
}

/* ------------------------------------------------------------------ */
/*  useShowCoordinates — reactive board notation toggle                  */
/* ------------------------------------------------------------------ */

export function useShowCoordinates(): boolean {
  const [show, setShow] = useState(true);

  useEffect(() => {
    setShow(getShowCoordinates());
    const handler = (e: Event) => setShow((e as CustomEvent).detail as boolean);
    window.addEventListener("fc-coords-changed", handler);
    return () => window.removeEventListener("fc-coords-changed", handler);
  }, []);

  return show;
}

/* ------------------------------------------------------------------ */
/*  usePieceTheme — reactive piece set                                  */
/* ------------------------------------------------------------------ */

export function usePieceTheme(): PieceTheme {
  const [pt, setPt] = useState<PieceTheme>(() => getActivePieceTheme());

  useEffect(() => {
    setPt(getActivePieceTheme());
    const handler = () => setPt(getActivePieceTheme());
    window.addEventListener("fc-piece-theme-changed", handler);
    return () => window.removeEventListener("fc-piece-theme-changed", handler);
  }, []);

  return pt;
}

/* ------------------------------------------------------------------ */
/*  useCustomPieces — memoised customPieces prop for react-chessboard   */
/* ------------------------------------------------------------------ */

export function useCustomPieces() {
  const pt = usePieceTheme();
  return useMemo(() => getCustomPieces(pt.setName), [pt.setName]);
}
