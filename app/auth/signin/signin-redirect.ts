/**
 * Post-sign-in redirect allow-list.
 *
 * Fixed hand-off paths plus a same-origin `/report/<id>` link. Anything with a
 * scheme or host (absolute URLs, protocol-relative `//host`) is rejected, so
 * `callbackUrl` can never become an open redirect.
 */
export const ALLOWED_CALLBACK_PATHS = [
  "/newdashboard",
  "/newpricing",
  "/newtraining",
  "/api/chaos/website-login",
] as const;

export function isAllowedCallbackUrl(
  target: string | null | undefined,
): boolean {
  if (!target) return false;
  if ((ALLOWED_CALLBACK_PATHS as readonly string[]).includes(target)) {
    return true;
  }
  // Strict prefix match for a report: no scheme, not protocol-relative, and no
  // backslashes or whitespace that could smuggle a different target.
  if (!target.startsWith("/report/")) return false;
  if (target.startsWith("//")) return false;
  if (target.includes("\\") || /\s/.test(target)) return false;
  return target.length > "/report/".length;
}
