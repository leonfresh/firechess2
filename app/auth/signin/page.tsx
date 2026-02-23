"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";

export default function SignInPage() {
  const [loading, setLoading] = useState<string | null>(null);

  const handleSignIn = async (provider: string) => {
    setLoading(provider);
    await signIn(provider, { callbackUrl: "/" });
  };

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4">
      <div className="w-full max-w-md space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500 to-red-500 text-2xl shadow-glow">
            🔥
          </div>
          <h1 className="text-2xl font-bold text-white">Sign in to FireChess</h1>
          <p className="mt-2 text-sm text-slate-400">
            Track your progress, unlock Pro features, and improve your openings.
          </p>
        </div>

        {/* OAuth buttons */}
        <div className="space-y-3">
          <button
            type="button"
            onClick={() => handleSignIn("google")}
            disabled={!!loading}
            className="flex w-full items-center justify-center gap-3 rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-3.5 text-sm font-semibold text-white transition-all hover:border-white/[0.15] hover:bg-white/[0.08] disabled:opacity-50"
          >
            {loading === "google" ? (
              <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
            )}
            Continue with Google
          </button>

          <button
            type="button"
            onClick={() => handleSignIn("lichess")}
            disabled={!!loading}
            className="flex w-full items-center justify-center gap-3 rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-3.5 text-sm font-semibold text-white transition-all hover:border-white/[0.15] hover:bg-white/[0.08] disabled:opacity-50"
          >
            {loading === "lichess" ? (
              <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 45 45" fill="white">
                <path d="M36.24 1.37C36.24 1.37 38.04 6.87 33.74 12.37C29.44 17.87 23.44 18.87 21.44 18.87C19.44 18.87 14.44 17.37 10.74 21.87C7.04 26.37 8.24 34.37 8.24 34.37L1.24 27.87C1.24 27.87 -0.76 17.37 8.24 10.37C17.24 3.37 27.24 5.37 27.24 5.37L36.24 1.37Z" />
                <path d="M36.24 1.37C36.24 1.37 42.24 5.37 42.24 12.37C42.24 19.37 36.24 23.37 36.24 23.37L32.24 27.37L22.24 34.37L14.24 41.37L8.24 34.37C8.24 34.37 16.24 31.37 19.24 27.37C22.24 23.37 22.24 18.87 22.24 18.87" />
              </svg>
            )}
            Continue with Lichess
          </button>
        </div>

        <p className="text-center text-xs text-slate-600">
          By signing in, you agree to our terms of service.
        </p>
      </div>
    </div>
  );
}
