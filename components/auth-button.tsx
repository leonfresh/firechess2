"use client";

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
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setMenuOpen((prev) => !prev)}
        className="flex items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 py-1.5 text-sm text-white transition-all hover:border-white/[0.15] hover:bg-white/[0.08]"
      >
        {user?.image ? (
          <img
            src={user.image}
            alt=""
            className="h-6 w-6 rounded-full"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/20 text-xs font-bold text-emerald-400">
            {(user?.name?.[0] ?? user?.email?.[0] ?? "?").toUpperCase()}
          </div>
        )}
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

            <button
              type="button"
              onClick={() => {
                setMenuOpen(false);
                signOut({ callbackUrl: "/" });
              }}
              className="w-full rounded-lg px-3 py-2 text-left text-sm text-slate-400 transition-colors hover:bg-white/[0.06] hover:text-white"
            >
              Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
