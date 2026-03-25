"use client";

/**
 * /chaos/collection — Chaos Chess Modifier Collection Dashboard
 *
 * Shows all 30 modifiers as cards.
 *  - Unlocked cards are shown in full colour.
 *  - Locked cards are greyed out with a lock icon.
 *  - Supports tier filtering: All | Common | Rare | Epic | Legendary
 *  - Shareable link: /chaos/collection?user=username
 *  - Authenticated users see their personal collection after OAuth.
 *  - Guests see the 13 default-unlocked modifiers.
 */

import React, { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useSession } from "@/components/session-provider";
import {
  ALL_MODIFIERS,
  TIER_COLORS,
  TIER_LABELS,
  type ChaosModifier,
  type ModifierTier,
} from "@/lib/chaos-chess";
import { GUEST_UNLOCKED_IDS, getProgressionInfo } from "@/lib/chaos-collection";

/* ── Twemoji helper (same as chaos page) ── */
function _twemojiUrl(emoji: string): string {
  const pts = [...emoji]
    .map((c) => c.codePointAt(0)!.toString(16))
    .filter((cp) => cp !== "fe0f");
  return `https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/${pts.join("-")}.svg`;
}
function Emoji({ emoji, className }: { emoji: string; className?: string }) {
  return (
    <img
      src={_twemojiUrl(emoji)}
      alt={emoji}
      className={className}
      style={{ display: "inline-block", verticalAlign: "-0.125em" }}
      draggable={false}
    />
  );
}

const TIER_ORDER: ModifierTier[] = ["common", "rare", "epic", "legendary"];
const TIER_FILTER_LABELS: Record<ModifierTier | "all", string> = {
  all: "All",
  common: "Common",
  rare: "Rare",
  epic: "Epic",
  legendary: "Legendary",
};

function ChaosCollectionInner() {
  const searchParams = useSearchParams();
  const username = searchParams.get("user");
  const { authenticated } = useSession();

  const [unlockedIds, setUnlockedIds] =
    useState<Set<string>>(GUEST_UNLOCKED_IDS);
  const [profileName, setProfileName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<ModifierTier | "all">("all");
  const [gamesPlayed, setGamesPlayed] = useState<number | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const url = username
          ? `/api/chaos/collection?user=${encodeURIComponent(username)}`
          : "/api/chaos/collection";
        const res = await fetch(url);
        if (res.ok) {
          const data: {
            unlockedIds: string[];
            username?: string;
            gamesPlayed?: number;
          } = await res.json();
          setUnlockedIds(new Set(data.unlockedIds));
          if (data.username) setProfileName(data.username);
          if (typeof data.gamesPlayed === "number")
            setGamesPlayed(data.gamesPlayed);
        }
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [username, authenticated]);

  const filtered = ALL_MODIFIERS.filter(
    (m) => activeFilter === "all" || m.tier === activeFilter,
  );

  const unlockedCount = ALL_MODIFIERS.filter((m) =>
    unlockedIds.has(m.id),
  ).length;
  const viewingOwn = !username;

  // Copy share link
  const handleCopyLink = async () => {
    const name = profileName ?? (authenticated ? "me" : null);
    if (!name) return;
    const url = `${window.location.origin}/chaos/collection?user=${encodeURIComponent(name)}`;
    await navigator.clipboard.writeText(url);
  };

  return (
    <main className="min-h-screen bg-[#07090f] text-white">
      {/* Header */}
      <div className="border-b border-purple-500/20 bg-[#0a0f1a]/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="mx-auto max-w-5xl px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/chaos"
              className="text-xs text-slate-500 hover:text-purple-400 transition-colors"
            >
              ← Chaos Chess
            </Link>
            <span className="text-slate-700">|</span>
            <h1 className="text-sm font-bold text-white">
              {profileName ? `${profileName}'s Collection` : "My Collection"}
            </h1>
          </div>
          {viewingOwn && authenticated && (
            <button
              type="button"
              onClick={handleCopyLink}
              className="flex items-center gap-1.5 rounded-lg border border-purple-500/30 bg-purple-500/10 px-3 py-1.5 text-xs font-medium text-purple-300 hover:bg-purple-500/20 transition-all"
            >
              🔗 Share Collection
            </button>
          )}
          {!authenticated && viewingOwn && (
            <Link
              href="/auth/signin"
              className="rounded-lg border border-purple-500/40 bg-purple-600/20 px-3 py-1.5 text-xs font-bold text-purple-300 hover:bg-purple-600/30 transition-all"
            >
              🔐 Sign in to unlock more
            </Link>
          )}
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-4 py-8">
        {/* Stats bar */}
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-2xl font-black text-white">
              {loading ? "…" : unlockedCount}
              <span className="text-slate-500 text-base font-normal">
                /{ALL_MODIFIERS.length} unlocked
              </span>
            </p>
            {/* Progress bar */}
            <div className="mt-1.5 h-2 w-48 rounded-full bg-slate-800 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-purple-600 to-violet-400 transition-all duration-500"
                style={{
                  width: `${loading ? 0 : (unlockedCount / ALL_MODIFIERS.length) * 100}%`,
                }}
              />
            </div>
          </div>

          {/* Tier breakdown */}
          <div className="flex gap-3 flex-wrap">
            {TIER_ORDER.map((tier) => {
              const total = ALL_MODIFIERS.filter((m) => m.tier === tier).length;
              const got = ALL_MODIFIERS.filter(
                (m) => m.tier === tier && unlockedIds.has(m.id),
              ).length;
              const tc = TIER_COLORS[tier];
              return (
                <div key={tier} className="text-center">
                  <div className={`text-xs font-bold ${tc.text}`}>
                    {got}/{total}
                  </div>
                  <div className="text-[10px] text-slate-600 capitalize">
                    {tier}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Next Unlock infographic — only for authenticated own-collection */}
        {authenticated &&
          viewingOwn &&
          !loading &&
          (() => {
            const info = getProgressionInfo(gamesPlayed ?? 0);

            if (!info) {
              return (
                <div className="mb-6 rounded-2xl border border-emerald-500/25 bg-emerald-500/[0.06] p-4 flex items-center gap-3">
                  <span className="text-2xl">🏆</span>
                  <div>
                    <p className="text-sm font-bold text-emerald-300">
                      All progression powerups unlocked!
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      You&apos;ve earned every modifier through gameplay.
                    </p>
                  </div>
                </div>
              );
            }

            const nextMod = ALL_MODIFIERS.find((m) => m.id === info.nextModId);
            if (!nextMod) return null;

            const {
              remaining,
              gamesInWindow,
              windowSize,
              pct,
              nextIdx,
              total,
            } = info;
            const tc = TIER_COLORS[nextMod.tier];

            return (
              <div className="mb-6 rounded-2xl border border-purple-500/20 bg-gradient-to-r from-purple-950/40 to-slate-900/40 p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-purple-400">
                      Next Unlock
                    </span>
                    <span className="text-[10px] text-slate-600">
                      {nextIdx + 1}/{total}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-500">
                    {remaining} game{remaining !== 1 ? "s" : ""} to go
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  {/* Modifier preview card */}
                  <div
                    className={`relative flex-shrink-0 w-14 h-14 rounded-xl border flex items-center justify-center ${tc.border} ${tc.bg}`}
                  >
                    <Emoji emoji={nextMod.icon} className="w-8 h-8" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-bold text-white truncate">
                        {nextMod.name}
                      </span>
                      <span
                        className={`text-[8px] font-bold uppercase tracking-wider rounded-full px-1.5 py-0.5 flex-shrink-0 ${tc.text} ${tc.bg}`}
                      >
                        {TIER_LABELS[nextMod.tier]}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-500 leading-relaxed line-clamp-2 mb-2">
                      {nextMod.description}
                    </p>
                    {/* Progress bar */}
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 rounded-full bg-white/[0.07] overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-700"
                          style={{
                            width: `${pct}%`,
                            background: {
                              common:
                                "linear-gradient(to right, #6b7280, #9ca3af)",
                              rare: "linear-gradient(to right, #3b82f6, #60a5fa)",
                              epic: "linear-gradient(to right, #a855f7, #c084fc)",
                              legendary:
                                "linear-gradient(to right, #f59e0b, #fcd34d)",
                            }[nextMod.tier],
                          }}
                        />
                      </div>
                      <span className="text-[10px] font-bold tabular-nums text-slate-400">
                        {gamesInWindow}/{windowSize}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}

        {/* Tier filter tabs */}
        <div className="mb-6 flex gap-2 flex-wrap">
          {(["all", ...TIER_ORDER] as const).map((tier) => (
            <button
              key={tier}
              type="button"
              onClick={() => setActiveFilter(tier)}
              className={`rounded-full px-3 py-1.5 text-xs font-bold transition-all ${
                activeFilter === tier
                  ? "bg-purple-600 text-white"
                  : "border border-slate-700 text-slate-400 hover:border-purple-500/50 hover:text-purple-300"
              }`}
            >
              {TIER_FILTER_LABELS[tier]}
            </button>
          ))}
        </div>

        {/* Card grid */}
        {loading ? (
          <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {Array.from({ length: 12 }).map((_, i) => (
              <div
                key={i}
                className="h-44 rounded-xl bg-slate-800/40 animate-pulse"
              />
            ))}
          </div>
        ) : (
          <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {filtered.map((mod) => (
              <ModifierCard
                key={mod.id}
                mod={mod}
                unlocked={unlockedIds.has(mod.id)}
              />
            ))}
          </div>
        )}

        {/* Guest CTA */}
        {!authenticated && viewingOwn && (
          <div className="mt-10 rounded-2xl border border-purple-500/20 bg-purple-500/5 p-6 text-center">
            <p className="text-lg font-bold text-white mb-1">
              Unlock all 30 modifiers
            </p>
            <p className="text-sm text-slate-400 mb-4">
              Create a free account to track your collection and earn new
              modifiers by playing.
            </p>
            <Link
              href="/auth/signin"
              className="inline-block rounded-xl border border-purple-500/60 bg-purple-600/30 px-6 py-3 text-sm font-bold text-white hover:bg-purple-600/50 transition-all"
            >
              🔐 Sign Up — It&apos;s Free
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}

export default function ChaosCollectionPage() {
  return (
    <Suspense>
      <ChaosCollectionInner />
    </Suspense>
  );
}

function ModifierCard({
  mod,
  unlocked,
}: {
  mod: ChaosModifier;
  unlocked: boolean;
}) {
  const tier = TIER_COLORS[mod.tier];

  return (
    <div
      className={`relative flex flex-col rounded-xl border p-3 text-center transition-all ${
        unlocked
          ? `${tier.bg} ${tier.border}`
          : "border-slate-800 bg-slate-900/50"
      } ${unlocked ? "" : "opacity-50"}`}
    >
      {/* Lock icon for locked cards */}
      {!unlocked && (
        <div className="absolute top-2 right-2 text-slate-600 text-xs">🔒</div>
      )}

      <div className="mb-2 flex justify-center">
        <Emoji
          emoji={mod.icon}
          className={`w-10 h-10 ${unlocked ? "" : "grayscale opacity-50"}`}
        />
      </div>

      <span
        className={`mb-1 inline-block rounded-full px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wider ${
          unlocked ? `${tier.text} ${tier.bg}` : "text-slate-600 bg-slate-800"
        }`}
      >
        {TIER_LABELS[mod.tier]}
      </span>

      <h3
        className={`text-[11px] font-bold leading-tight ${
          unlocked ? "text-white" : "text-slate-600"
        }`}
      >
        {mod.name}
      </h3>

      {mod.piece && (
        <span className="mt-0.5 text-[9px] text-slate-600 capitalize">
          {
            {
              p: "Pawns",
              n: "Knights",
              b: "Bishops",
              r: "Rooks",
              q: "Queen",
              k: "King",
            }[mod.piece]
          }
        </span>
      )}

      {unlocked && (
        <p className="mt-1 text-[9px] leading-relaxed text-slate-400 line-clamp-3">
          {mod.description}
        </p>
      )}
    </div>
  );
}
