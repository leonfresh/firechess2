"use client";

import { CoinShop } from "@/components/coin-shop";
import { useSession } from "@/components/session-provider";
import Link from "next/link";

export default function ShopPage() {
  const { authenticated, loading } = useSession();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
      </div>
    );
  }

  if (!authenticated) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-950 px-4 text-center">
        <span className="text-4xl">🪙</span>
        <h1 className="text-xl font-bold text-white">Coin Shop</h1>
        <p className="max-w-sm text-sm text-slate-400">
          Sign in to access the Coin Shop and unlock board themes, piece sets, eval bar skins, and profile titles.
        </p>
        <Link
          href="/auth/signin"
          className="rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 px-6 py-2.5 text-sm font-semibold text-white shadow-lg transition hover:shadow-emerald-500/25"
        >
          Sign In
        </Link>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 px-4 pb-20 pt-24 sm:px-6">
      <div className="mx-auto max-w-4xl">
        <CoinShop />
      </div>
    </main>
  );
}
