/**
 * Tag a shared Chaos Chess link so the visitor it brings is counted as coming from a share
 * (lib/chaos-first-touch.ts records utm_source; /admin/chaos shows it). `medium` names the surface:
 * replay, week, achievement, watch. Existing utm tags are left alone.
 */
export function tagShareUrl(url: string, medium: string): string {
  try {
    const parsed = new URL(url, "https://chaos.firechess.com");
    if (!parsed.searchParams.has("utm_source")) {
      parsed.searchParams.set("utm_source", "share");
      parsed.searchParams.set("utm_medium", medium);
    }
    return /^https?:\/\//.test(url) ? parsed.href : parsed.pathname + parsed.search + parsed.hash;
  } catch {
    return url;
  }
}
