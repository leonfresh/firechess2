"use client";

import Link from "next/link";
import { signIn, signOut } from "next-auth/react";
import { useSession } from "@/components/session-provider";
import { useState, useRef, useEffect } from "react";

export function AuthButton() {
  const { loading, authenticated, user, plan } = useSession();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu on click-outside
  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [menuOpen]);

  if (loading) {
    return (
      <div className="h-9 w-20 animate-pulse rounded-xl bg-white/[0.06]" />
    );
  }

  if (!authenticated) {
    return (
      <button
        type="button"
        onClick={() => signIn(undefined, { callbackUrl: "/" })}
        className="btn-secondary text-sm"
      >
        Sign in
      </button>
    );
  }

  return (
    <>
      <Link href="/dashboard" className="btn-secondary text-sm">
        Dashboard
      </Link>
      <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setMenuOpen((prev) => !prev)}
        className="flex items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 py-1.5 text-sm text-white transition-all hover:border-white/[0.15] hover:bg-white/[0.08]"
      >
        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/20 text-xs font-bold text-emerald-400">
          {(user?.name?.[0] ?? user?.email?.[0] ?? "?").toUpperCase()}
        </div>
        <span className="max-w-[120px] truncate">{user?.name ?? user?.email ?? "Account"}</span>
        {plan === "pro" && (
          <span className="rounded bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-400">
            Pro
          </span>
        )}
      </button>

      {menuOpen && (
        <div className="absolute right-0 top-full z-50 mt-2 w-56 overflow-hidden rounded-xl border border-white/[0.08] bg-[#0d1117] shadow-2xl">
          <div className="border-b border-white/[0.06] px-4 py-3">
            <p className="truncate text-sm font-medium text-white">{user?.name ?? "User"}</p>
            <p className="truncate text-xs text-slate-500">{user?.email}</p>
          </div>

          <div className="p-1.5">
            <div className="flex items-center justify-between rounded-lg px-3 py-2 text-sm text-slate-400">
              <span>Plan</span>
              <span className={plan === "pro" ? "font-semibold text-emerald-400" : "text-slate-500"}>
                {plan === "pro" ? "Pro" : "Free"}
              </span>
            </div>

            <Link
              href="/account"
              onClick={() => setMenuOpen(false)}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-slate-400 transition-colors hover:bg-white/[0.06] hover:text-white"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Account &amp; Billing
            </Link>

            <button
              type="button"
              onClick={() => {
                setMenuOpen(false);
                signOut({ callbackUrl: "/" });
              }}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-slate-400 transition-colors hover:bg-white/[0.06] hover:text-white"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Sign out
            </button>
          </div>
        </div>
      )}
    </div>
    </>
  );
}
