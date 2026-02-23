"use client";

import { useEffect } from "react";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Unhandled error:", error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-6 text-center">
      <div className="glass-card max-w-md space-y-5 p-8">
        <span className="text-5xl">💥</span>
        <h1 className="text-2xl font-extrabold text-white">Something went wrong</h1>
        <p className="text-sm text-slate-400">
          An unexpected error occurred. This has been logged and we&apos;ll look into it.
        </p>
        {error.digest && (
          <p className="font-mono text-xs text-slate-600">Error ID: {error.digest}</p>
        )}
        <button
          onClick={reset}
          className="rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 px-6 py-2.5 text-sm font-semibold text-slate-950 transition-shadow hover:shadow-glow-sm"
        >
          Try Again
        </button>
      </div>
    </div>
  );
}
