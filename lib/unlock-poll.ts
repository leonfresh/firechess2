/**
 * The polling loop behind the $9 report unlock. Both the modern report and the
 * classic scan page run exactly this: poll /api/report/unlock while the Stripe
 * webhook may still be in flight, mirror the flag on every response (so a later
 * false clears stale access), and once entitlement is confirmed run one
 * follow-up (re-fetch the scan / refresh the server data).
 *
 * Dependency-injected and free of React so the real loop is testable without a
 * DOM; the effects are thin wiring around it.
 */
export type UnlockPoll = {
  /** Maximum checks before giving up. */
  attempts: number;
  /** Resolves the unlock decision, or null when the request failed. */
  checkUnlock: () => Promise<boolean | null>;
  /** Delay between attempts, in ms. */
  delayMs: number;
  sleep: (ms: number) => Promise<void>;
  /** Called with the resolved decision on every check. */
  onFlag: (unlocked: boolean) => void;
  /** Called once when entitlement is first confirmed. */
  onUnlocked: () => void | Promise<void>;
  /** Returns false once the owning effect has been cleaned up. */
  isActive: () => boolean;
};

export async function pollUnlock(deps: UnlockPoll): Promise<void> {
  let remaining = Math.max(1, deps.attempts);
  for (;;) {
    if (!deps.isActive()) return;
    let unlocked: boolean | null = null;
    try {
      unlocked = await deps.checkUnlock();
    } catch {
      unlocked = null; // a failed check is "not confirmed", never "unlocked"
    }
    if (!deps.isActive()) return;
    deps.onFlag(Boolean(unlocked));
    if (unlocked) {
      await deps.onUnlocked();
      return;
    }
    if (--remaining <= 0) return;
    await deps.sleep(deps.delayMs);
  }
}
