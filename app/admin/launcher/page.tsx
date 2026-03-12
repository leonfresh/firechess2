"use client";

/**
 * /admin/launcher — Set the global default launcher shown to all users.
 */

import { useEffect, useState } from "react";
import { useSession } from "@/components/session-provider";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { LauncherEditor } from "@/components/launcher-editor";
import { DEFAULT_LAUNCHER, type LauncherConfig } from "@/lib/launcher-apps";

export default function AdminLauncherPage() {
  const { loading, isAdmin } = useSession();
  const router = useRouter();

  const [config, setConfig] = useState<LauncherConfig | null>(null);
  const [fetching, setFetching] = useState(true);

  // Redirect non-admins
  useEffect(() => {
    if (!loading && !isAdmin) router.replace("/");
  }, [loading, isAdmin, router]);

  // Load current admin default
  useEffect(() => {
    if (loading || !isAdmin) return;
    fetch("/api/admin/launcher")
      .then((r) => r.json())
      .then((data) => setConfig(data.config ?? DEFAULT_LAUNCHER))
      .catch(() => setConfig(DEFAULT_LAUNCHER))
      .finally(() => setFetching(false));
  }, [loading, isAdmin]);

  async function handleSave(newConfig: LauncherConfig) {
    const res = await fetch("/api/admin/launcher", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newConfig),
    });
    if (!res.ok) throw new Error("Failed to save");
    setConfig(newConfig);
  }

  async function handleReset() {
    if (!confirm("Reset global default to the hardcoded default? This cannot be undone.")) return;
    await fetch("/api/admin/launcher", { method: "DELETE" });
    setConfig(DEFAULT_LAUNCHER);
  }

  /* ── renders ── */
  if (loading || fetching) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex items-center gap-3 text-white/50">
          <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-20" />
            <path d="M12 2a10 10 0 019.95 9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
          </svg>
          Loading…
        </div>
      </div>
    );
  }

  if (!isAdmin) return null;

  return (
    <div className="min-h-screen px-4 pb-20 pt-8">
      <div className="mx-auto max-w-3xl space-y-6">
        {/* Page header */}
        <div className="flex items-center gap-3">
          <Link
            href="/admin/users"
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.04] text-white/50 transition-colors hover:bg-white/[0.08] hover:text-white"
          >
            <svg viewBox="0 0 16 16" fill="none" className="h-4 w-4">
              <path d="M10 3 L5 8 L10 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
          <div>
            <h1 className="text-xl font-bold text-white">Launcher Default</h1>
            <p className="text-sm text-white/50">
              Set the global default launcher shown to all users on the homepage.
            </p>
          </div>
        </div>

        {/* Info banner */}
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/[0.06] px-4 py-3">
          <p className="text-sm text-amber-300/80">
            <span className="font-semibold text-amber-300">Global default:</span> This layout is shown to
            unauthenticated visitors and users who haven&apos;t customized their own launcher.
            Individual users can override it from their dashboard.
          </p>
        </div>

        {/* Editor */}
        {config && (
          <LauncherEditor
            initialConfig={config}
            onSave={handleSave}
            defaultConfig={DEFAULT_LAUNCHER}
          />
        )}

        {/* Danger zone */}
        <div className="rounded-xl border border-red-500/20 bg-red-500/[0.04] px-4 py-4 space-y-2">
          <p className="text-sm font-semibold text-red-400">Danger Zone</p>
          <p className="text-xs text-white/40">
            Reset the global default back to the hardcoded fallback. This will clear the database entry.
          </p>
          <button
            onClick={handleReset}
            className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-xs font-medium text-red-400 transition-colors hover:bg-red-500/20"
          >
            Reset Global Default
          </button>
        </div>
      </div>
    </div>
  );
}
