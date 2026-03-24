"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function RecruitError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Recruit Chess error:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white flex flex-col items-center justify-center p-6">
      <div className="max-w-lg w-full text-center">
        <div className="text-5xl mb-4">💥</div>
        <h1 className="text-2xl font-bold mb-3">Something went wrong</h1>
        <p className="text-sm text-gray-400 mb-4">
          {error.message || "An unexpected error occurred in Recruit Chess."}
        </p>
        {error.stack && (
          <pre className="text-left text-xs text-red-400 bg-gray-900/80 rounded-lg p-4 mb-4 overflow-auto max-h-64 whitespace-pre-wrap border border-red-900/50">
            {error.stack}
          </pre>
        )}
        {error.digest && (
          <p className="font-mono text-xs text-gray-600 mb-4">
            ID: {error.digest}
          </p>
        )}
        <div className="flex gap-3 justify-center">
          <button
            onClick={reset}
            className="rounded-xl bg-gradient-to-r from-red-600 to-orange-500 px-6 py-2.5 text-sm font-semibold transition-all hover:scale-[1.01]"
          >
            Try Again
          </button>
          <Link
            href="/"
            className="rounded-xl bg-gray-800 border border-gray-700 px-6 py-2.5 text-sm font-semibold hover:bg-gray-700 transition-colors"
          >
            ← Home
          </Link>
        </div>
      </div>
    </div>
  );
}
