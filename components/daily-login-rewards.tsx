"use client";

/**
 * DailyLoginRewards — 7-day streak calendar widget.
 *
 * Two variants:
 *   - "inline" (default): renders as a glass-card for the dashboard
 *   - "popup": renders as a centered modal with backdrop overlay,
 *              auto-opens when there's an unclaimed reward,
 *              auto-closes shortly after claiming.
 */

import { useState, useCallback, useEffect } from "react";
import {
  LOGIN_REWARDS,
  getLoginState,
  claimDailyReward,
  isStreakActive,
  type LoginState,
  type DayReward,
} from "@/lib/daily-login";
import { useCoinBalance } from "@/lib/use-coins";

/* ------------------------------------------------------------------ */
/*  Shared calendar card (used in both variants)                        */
/* ------------------------------------------------------------------ */

function LoginCalendar({
  loginState,
  claimedReward,
  animating,
  showConfetti,
  canClaim,
  displayDay,
  onClaim,
}: {
  loginState: LoginState;
  claimedReward: DayReward | null;
  animating: boolean;
  showConfetti: boolean;
  canClaim: boolean;
  displayDay: number;
  onClaim: () => void;
}) {
  const streakActive = isStreakActive();

  return (
    <div className="glass-card relative overflow-hidden">
      {/* Confetti overlay for day 7 */}
      {showConfetti && (
        <div className="pointer-events-none absolute inset-0 z-10 overflow-hidden">
          {Array.from({ length: 30 }).map((_, i) => (
            <span
              key={i}
              className="absolute animate-bounce text-lg"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 60}%`,
                animationDelay: `${Math.random() * 0.5}s`,
                animationDuration: `${0.6 + Math.random() * 0.8}s`,
                opacity: 0.8 + Math.random() * 0.2,
              }}
            >
              {["✨", "🎉", "⭐", "🪙", "🏆"][Math.floor(Math.random() * 5)]}
            </span>
          ))}
        </div>
      )}

      {/* Header */}
      <div className="border-b border-white/[0.06] px-5 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/15 text-xl">
              📅
            </span>
            <div>
              <h3 className="text-base font-bold text-white">Daily Login Rewards</h3>
              <p className="text-xs text-slate-500">
                {loginState.totalDaysLogged > 0
                  ? `${loginState.totalDaysLogged} total day${loginState.totalDaysLogged !== 1 ? "s" : ""} logged`
                  : "Claim your first reward!"}
                {loginState.cyclesCompleted > 0 && (
                  <span className="ml-1.5 text-violet-400">
                    · {loginState.cyclesCompleted} cycle{loginState.cyclesCompleted !== 1 ? "s" : ""}
                  </span>
                )}
              </p>
            </div>
          </div>
          {streakActive && loginState.currentDay > 0 && (
            <div className="flex items-center gap-1.5 rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1">
              <span className="text-sm">🔥</span>
              <span className="text-xs font-bold text-amber-400">
                {loginState.currentDay} day streak
              </span>
            </div>
          )}
        </div>
      </div>

      {/* 7-Day Calendar */}
      <div className="px-5 py-4">
        <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
          {LOGIN_REWARDS.map((reward) => {
            const isCompleted =
              loginState.claimedToday
                ? reward.day <= loginState.currentDay
                : streakActive
                ? reward.day <= loginState.currentDay
                : false;
            const isCurrent = reward.day === displayDay;
            const isUpcoming = reward.day > displayDay;
            const isDay7 = reward.day === 7;

            return (
              <div
                key={reward.day}
                className={`relative flex flex-col items-center rounded-xl border p-2 transition-all sm:p-3 ${
                  isCompleted
                    ? "border-emerald-500/30 bg-emerald-500/[0.08]"
                    : isCurrent && canClaim
                    ? "border-violet-500/40 bg-violet-500/[0.12] ring-1 ring-violet-500/30"
                    : isCurrent && !canClaim
                    ? "border-emerald-500/30 bg-emerald-500/[0.08]"
                    : isDay7
                    ? "border-amber-500/15 bg-amber-500/[0.04]"
                    : "border-white/[0.06] bg-white/[0.02]"
                }`}
              >
                <p
                  className={`text-[9px] font-bold uppercase tracking-wider sm:text-[10px] ${
                    isCompleted
                      ? "text-emerald-400"
                      : isCurrent
                      ? "text-violet-400"
                      : "text-slate-500"
                  }`}
                >
                  Day {reward.day}
                </p>

                <span
                  className={`my-1 text-lg sm:my-1.5 sm:text-2xl ${
                    isCompleted ? "opacity-60" : isUpcoming ? "opacity-40" : ""
                  }`}
                >
                  {isCompleted ? "✅" : reward.icon}
                </span>

                <div className="flex items-center gap-0.5">
                  <span className="text-xs sm:text-sm">🪙</span>
                  <span
                    className={`text-xs font-bold sm:text-sm ${
                      isCompleted
                        ? "text-emerald-400/60"
                        : isCurrent
                        ? "text-violet-300"
                        : isDay7
                        ? "text-amber-400"
                        : "text-slate-400"
                    }`}
                  >
                    {reward.coins}
                  </span>
                </div>

                {isCompleted && (
                  <div className="pointer-events-none absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-[8px] text-white sm:h-5 sm:w-5 sm:text-[10px]">
                    ✓
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Claim button or status */}
      <div className="border-t border-white/[0.06] px-5 py-4">
        {canClaim ? (
          <button
            type="button"
            onClick={onClaim}
            disabled={animating}
            className={`group relative flex w-full items-center justify-center gap-3 rounded-xl px-6 py-3 text-sm font-bold text-white transition-all ${
              animating
                ? "bg-emerald-500/30 cursor-default"
                : "bg-gradient-to-r from-violet-600 to-fuchsia-600 shadow-lg shadow-violet-500/20 hover:shadow-violet-500/30 hover:scale-[1.01] active:scale-[0.99]"
            }`}
          >
            {animating ? (
              <>
                <span className="animate-bounce text-xl">{claimedReward?.icon}</span>
                <span>+{claimedReward?.coins} coins claimed!</span>
              </>
            ) : (
              <>
                <span className="text-xl">
                  {LOGIN_REWARDS[(displayDay - 1) % 7].icon}
                </span>
                <span>
                  Claim Day {displayDay} Reward — {LOGIN_REWARDS[(displayDay - 1) % 7].coins} coins
                </span>
              </>
            )}
          </button>
        ) : (
          <div className="flex items-center justify-between rounded-xl border border-emerald-500/20 bg-emerald-500/[0.06] px-4 py-3">
            <div className="flex items-center gap-3">
              <span className="text-lg">✅</span>
              <div>
                <p className="text-sm font-semibold text-emerald-400">
                  Day {loginState.currentDay} claimed!
                </p>
                <p className="text-xs text-slate-500">
                  {loginState.currentDay < 7
                    ? `Come back tomorrow for Day ${loginState.currentDay + 1} — ${LOGIN_REWARDS[loginState.currentDay].coins} coins`
                    : "Cycle complete! Come back tomorrow to start a new streak."}
                </p>
              </div>
            </div>
            {loginState.currentDay < 7 && (
              <div className="flex items-center gap-1">
                <span className="text-xs text-slate-500">Next:</span>
                <span className="text-sm">{LOGIN_REWARDS[loginState.currentDay].icon}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Day 7 teaser */}
      {displayDay < 7 && canClaim && (
        <div className="border-t border-white/[0.04] px-5 py-3">
          <div className="flex items-center gap-2">
            <span className="text-sm">🏆</span>
            <p className="text-xs text-slate-500">
              <span className="text-amber-400 font-semibold">Day 7 reward:</span>{" "}
              30 bonus coins!{" "}
              <span className="text-slate-600">{7 - displayDay + 1} day{7 - displayDay + 1 !== 1 ? "s" : ""} to go!</span>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Inline variant (dashboard)                                          */
/* ------------------------------------------------------------------ */

export function DailyLoginRewards() {
  const balance = useCoinBalance();
  const [loginState, setLoginState] = useState<LoginState | null>(null);
  const [claimedReward, setClaimedReward] = useState<DayReward | null>(null);
  const [animating, setAnimating] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    setLoginState(getLoginState());
  }, []);

  const handleClaim = useCallback(() => {
    const result = claimDailyReward();
    if (!result) return;

    setAnimating(true);
    setClaimedReward(result.reward);
    setLoginState(result.state);

    if (result.reward.day === 7) {
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 3000);
    }

    setTimeout(() => setAnimating(false), 1000);
  }, []);

  if (!loginState) return null;

  const streakActive = isStreakActive();
  const canClaim = !loginState.claimedToday;
  const displayDay = loginState.claimedToday
    ? loginState.currentDay
    : streakActive
    ? loginState.currentDay + 1
    : 1;

  return (
    <LoginCalendar
      loginState={loginState}
      claimedReward={claimedReward}
      animating={animating}
      showConfetti={showConfetti}
      canClaim={canClaim}
      displayDay={displayDay}
      onClaim={handleClaim}
    />
  );
}

/* ------------------------------------------------------------------ */
/*  Popup variant (main page)                                           */
/* ------------------------------------------------------------------ */

export function DailyLoginPopup() {
  const balance = useCoinBalance();
  const [loginState, setLoginState] = useState<LoginState | null>(null);
  const [claimedReward, setClaimedReward] = useState<DayReward | null>(null);
  const [animating, setAnimating] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const s = getLoginState();
    setLoginState(s);
    // Auto-open if there's an unclaimed reward
    if (s && !s.claimedToday) {
      setOpen(true);
    }
  }, []);

  const handleClaim = useCallback(() => {
    const result = claimDailyReward();
    if (!result) return;

    setAnimating(true);
    setClaimedReward(result.reward);
    setLoginState(result.state);

    if (result.reward.day === 7) {
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 3000);
    }

    setTimeout(() => {
      setAnimating(false);
      // Auto-close the popup after claim animation
      setTimeout(() => setOpen(false), 800);
    }, 1000);
  }, []);

  if (!loginState || !open) return null;

  const streakActive = isStreakActive();
  const canClaim = !loginState.claimedToday;
  const displayDay = loginState.claimedToday
    ? loginState.currentDay
    : streakActive
    ? loginState.currentDay + 1
    : 1;

  return (
    <div className="fixed inset-0 z-[9998] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in"
        onClick={() => setOpen(false)}
      />

      {/* Modal card */}
      <div className="relative z-10 w-full max-w-md animate-fade-in-up">
        {/* Close button */}
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="absolute -right-2 -top-2 z-20 flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-slate-800 text-slate-400 shadow-lg transition-colors hover:bg-slate-700 hover:text-white"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        <LoginCalendar
          loginState={loginState}
          claimedReward={claimedReward}
          animating={animating}
          showConfetti={showConfetti}
          canClaim={canClaim}
          displayDay={displayDay}
          onClaim={handleClaim}
        />
      </div>
    </div>
  );
}
