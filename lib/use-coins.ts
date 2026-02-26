"use client";

/**
 * React hooks for the coin economy and board themes.
 * Listens for custom events so all components update in sync.
 */

import { useEffect, useState, useCallback } from "react";
import { getBalance, getLog, type CoinTransaction } from "@/lib/coins";
import {
  getActiveTheme,
  getActiveTitle,
  type BoardTheme,
  type ProfileTitle,
} from "@/lib/board-themes";

/* ------------------------------------------------------------------ */
/*  useCoinBalance — reactive coin counter                              */
/* ------------------------------------------------------------------ */

export function useCoinBalance(): number {
  const [balance, setBalance] = useState(0);

  useEffect(() => {
    setBalance(getBalance());
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
