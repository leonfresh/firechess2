"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useSession } from "@/components/session-provider";

interface GiftLinkInfo {
  label: string;
  planType: "pro" | "lifetime";
  durationDays: number | null;
  usesRemaining: number;
  status: "valid" | "expired" | "revoked" | "exhausted";
}

interface Props {
  token: string;
  info: GiftLinkInfo;
}

export function GiftClaim({ token, info }: Props) {
  const { authenticated } = useSession();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [claimed, setClaimed] = useState(false);

  const planLabel = info.planType === "lifetime" ? "Lifetime Pro" : "Pro";
  const durationLabel =
    info.durationDays
      ? info.durationDays >= 365
        ? `${Math.round(info.durationDays / 365)} year${info.durationDays >= 730 ? "s" : ""}`
        : info.durationDays >= 30
        ? `${Math.round(info.durationDays / 30)} month${info.durationDays >= 60 ? "s" : ""}`
        : `${info.durationDays} days`
      : "permanently";

  async function handleClaim() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/gift/${token}`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong.");
      } else {
        setClaimed(true);
        setTimeout(() => { window.location.href = "/dashboard"; }, 2500);
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (info.status !== "valid") {
    const messages: Record<string, string> = {
      revoked: "This gift link has been revoked.",
      expired: "This gift link has expired.",
      exhausted: "This gift link has reached its maximum uses.",
    };
    return (
      <div className="text-center">
        <div className="text-5xl mb-4">❌</div>
        <p className="text-gray-400 text-lg">{messages[info.status]}</p>
      </div>
    );
  }

  if (claimed) {
    return (
      <div className="text-center">
        <div className="text-5xl mb-4">🎉</div>
        <h2 className="text-2xl font-bold text-white mb-2">You&apos;re now {planLabel}!</h2>
        <p className="text-gray-400">Redirecting you to your dashboard…</p>
      </div>
    );
  }

  return (
    <div className="text-center">
      <div className="text-5xl mb-4">🎁</div>
      <h2 className="text-2xl font-bold text-white mb-2">
        You&apos;ve been gifted <span className="text-amber-400">{planLabel}</span> access
      </h2>
      <p className="text-gray-400 mb-1">
        Unlock all {planLabel} features {durationLabel}.
      </p>
      <p className="text-gray-600 text-sm mb-6">
        {info.usesRemaining} use{info.usesRemaining !== 1 ? "s" : ""} remaining
      </p>

      {error && (
        <p className="text-red-400 text-sm mb-4 bg-red-900/30 border border-red-700 rounded px-4 py-2">
          {error}
        </p>
      )}

      {authenticated ? (
        <button
          onClick={handleClaim}
          disabled={loading}
          className="bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-black font-bold px-8 py-3 rounded-lg text-lg transition"
        >
          {loading ? "Claiming…" : "Claim Free Pro Access"}
        </button>
      ) : (
        <button
          onClick={() =>
            signIn(undefined, { callbackUrl: `/gift/${token}` })
          }
          className="bg-amber-500 hover:bg-amber-400 text-black font-bold px-8 py-3 rounded-lg text-lg transition"
        >
          Sign in to Claim
        </button>
      )}
    </div>
  );
}
