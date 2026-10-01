/**
 * The follow-ups the $9 unlock runs once entitlement is confirmed, extracted so
 * the real callbacks can be executed without a DOM.
 *
 * The modern report renders from server data, so it refreshes the server
 * component; the classic scan page owns the scan in state, so it re-fetches the
 * now-entitled full payload and applies it. A failed classic fetch must never
 * throw: the Free view stays until a reload / later attempt recovers.
 */
export type ScanFetch = (
  url: string,
  init?: any,
) => Promise<{ ok: boolean; json: () => Promise<unknown> }>;

export async function applyEntitledScan(
  scanId: string,
  deps: {
    fetch: ScanFetch;
    apply: (scan: any) => void;
    isActive?: () => boolean;
  },
): Promise<boolean> {
  try {
    const res = await deps.fetch(`/api/scans/${scanId}`, { cache: "no-store" });
    const json = res.ok
      ? ((await res.json()) as { scan?: unknown } | null)
      : null;
    const scan = json?.scan;
    if (scan && (!deps.isActive || deps.isActive())) {
      deps.apply(scan);
      return true;
    }
  } catch {
    /* keep the Free view; a reload will pick up the unlock */
  }
  return false;
}

/** Refresh the server data so the entitled full result is fetched. */
export function refreshReportData(router: { refresh: () => void }): void {
  router.refresh();
}
