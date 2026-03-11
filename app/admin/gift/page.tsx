"use client";

import { useEffect, useState } from "react";

interface GiftLink {
  id: string;
  label: string;
  token: string;
  maxUses: number;
  usedCount: number;
  planType: "pro" | "lifetime";
  durationDays: number | null;
  expiresAt: string | null;
  revokedAt: string | null;
  createdAt: string | null;
}

const BASE = typeof window !== "undefined" ? window.location.origin : "";

function linkStatus(l: GiftLink): { label: string; color: string } {
  if (l.revokedAt) return { label: "Revoked", color: "text-red-400" };
  if (l.expiresAt && new Date(l.expiresAt) < new Date()) return { label: "Expired", color: "text-gray-500" };
  if (l.usedCount >= l.maxUses) return { label: "Exhausted", color: "text-orange-400" };
  return { label: "Active", color: "text-green-400" };
}

function durationLabel(days: number | null) {
  if (!days) return "Permanent";
  if (days >= 365) return `${Math.round(days / 365)}y`;
  if (days >= 30) return `${Math.round(days / 30)}mo`;
  return `${days}d`;
}

export default function AdminGiftPage() {
  const [links, setLinks] = useState<GiftLink[]>([]);
  const [listError, setListError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  // Form state
  const [label, setLabel] = useState("");
  const [maxUses, setMaxUses] = useState(50);
  const [planType, setPlanType] = useState<"pro" | "lifetime">("pro");
  const [durationDays, setDurationDays] = useState<string>("");
  const [expiresAt, setExpiresAt] = useState<string>("");

  async function fetchLinks() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/gift");
      if (!res.ok) throw new Error("Failed to load");
      const data = await res.json();
      setLinks(data.giftLinks ?? []);
    } catch (e: any) {
      setListError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchLinks(); }, []);

  function openModal() {
    setLabel("");
    setMaxUses(50);
    setPlanType("pro");
    setDurationDays("");
    setExpiresAt("");
    setError(null);
    setModalOpen(true);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/gift", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          label,
          maxUses,
          planType,
          durationDays: durationDays ? parseInt(durationDays) : null,
          expiresAt: expiresAt || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Failed to create"); return; }
      setModalOpen(false);
      fetchLinks();
    } catch {
      setError("Network error");
    } finally {
      setSaving(false);
    }
  }

  async function handleRevoke(id: string, revoke: boolean) {
    await fetch("/api/admin/gift", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, action: revoke ? "revoke" : "unrevoke" }),
    });
    fetchLinks();
  }

  async function handleDelete(id: string, label: string) {
    if (!confirm(`Delete gift link "${label}"? This cannot be undone.`)) return;
    await fetch("/api/admin/gift", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    fetchLinks();
  }

  function copyLink(token: string) {
    navigator.clipboard.writeText(`${BASE}/gift/${token}`);
    setCopied(token);
    setTimeout(() => setCopied(null), 1500);
  }

  return (
    <div className="min-h-screen bg-[#0e0e0e] text-white p-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Gift Links</h1>
            <p className="text-gray-400 mt-1">Create multi-use gift links that grant Pro access.</p>
          </div>
          <button
            onClick={openModal}
            className="bg-amber-500 hover:bg-amber-400 text-black font-bold px-5 py-2 rounded-lg transition"
          >
            + New Gift Link
          </button>
        </div>

        {listError && (
          <p className="text-red-400 bg-red-900/30 border border-red-700 rounded px-4 py-2 mb-6">
            {listError}
          </p>
        )}

        {loading ? (
          <p className="text-gray-500">Loading…</p>
        ) : links.length === 0 ? (
          <div className="text-center py-16 text-gray-500">
            <p className="text-4xl mb-3">🎁</p>
            <p>No gift links yet. Create one to get started.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 text-gray-400">
                  <th className="text-left pb-3 pr-4">Label</th>
                  <th className="text-left pb-3 pr-4">Link</th>
                  <th className="text-center pb-3 pr-4">Uses</th>
                  <th className="text-center pb-3 pr-4">Plan</th>
                  <th className="text-center pb-3 pr-4">Duration</th>
                  <th className="text-center pb-3 pr-4">Expires</th>
                  <th className="text-center pb-3 pr-4">Status</th>
                  <th className="text-right pb-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {links.map((link) => {
                  const status = linkStatus(link);
                  return (
                    <tr key={link.id} className="border-b border-white/5 hover:bg-white/[0.03]">
                      <td className="py-3 pr-4 font-medium">{link.label}</td>
                      <td className="py-3 pr-4">
                        <button
                          onClick={() => copyLink(link.token)}
                          className="font-mono text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1"
                          title={`${BASE}/gift/${link.token}`}
                        >
                          {link.token}
                          <span className="text-gray-500">{copied === link.token ? "✓" : "⧉"}</span>
                        </button>
                      </td>
                      <td className="py-3 pr-4 text-center">
                        <span className={link.usedCount >= link.maxUses ? "text-orange-400" : ""}>
                          {link.usedCount}/{link.maxUses}
                        </span>
                      </td>
                      <td className="py-3 pr-4 text-center capitalize">{link.planType}</td>
                      <td className="py-3 pr-4 text-center text-gray-400">
                        {durationLabel(link.durationDays)}
                      </td>
                      <td className="py-3 pr-4 text-center text-gray-400 text-xs">
                        {link.expiresAt ? new Date(link.expiresAt).toLocaleDateString() : "—"}
                      </td>
                      <td className={`py-3 pr-4 text-center font-medium ${status.color}`}>
                        {status.label}
                      </td>
                      <td className="py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleRevoke(link.id, !link.revokedAt)}
                            className="text-xs px-2 py-1 rounded border border-white/20 hover:border-white/50 transition"
                          >
                            {link.revokedAt ? "Restore" : "Revoke"}
                          </button>
                          <button
                            onClick={() => handleDelete(link.id, link.label)}
                            className="text-xs px-2 py-1 rounded border border-red-800 text-red-400 hover:border-red-500 transition"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 px-4">
          <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl p-8 w-full max-w-md shadow-2xl">
            <h2 className="text-xl font-bold mb-6">New Gift Link</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Label *</label>
                <input
                  className="w-full bg-[#111] border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                  placeholder="e.g. YouTube Outreach March"
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Max Uses</label>
                  <input
                    type="number"
                    min={1}
                    className="w-full bg-[#111] border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                    value={maxUses}
                    onChange={(e) => setMaxUses(parseInt(e.target.value) || 1)}
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Plan</label>
                  <select
                    className="w-full bg-[#111] border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                    value={planType}
                    onChange={(e) => setPlanType(e.target.value as "pro" | "lifetime")}
                  >
                    <option value="pro">Pro</option>
                    <option value="lifetime">Lifetime</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Duration (days)</label>
                  <input
                    type="number"
                    min={1}
                    className="w-full bg-[#111] border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                    placeholder="Leave blank = permanent"
                    value={durationDays}
                    onChange={(e) => setDurationDays(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Link Expires</label>
                  <input
                    type="date"
                    className="w-full bg-[#111] border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                    value={expiresAt}
                    onChange={(e) => setExpiresAt(e.target.value)}
                  />
                </div>
              </div>
              <p className="text-gray-600 text-xs">
                Duration = how long each user&apos;s Pro lasts after claiming. Leave blank for permanent access.
              </p>

              {error && (
                <p className="text-red-400 text-sm bg-red-900/30 border border-red-700 rounded px-3 py-2">
                  {error}
                </p>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-black font-bold py-2 rounded-lg transition"
                >
                  {saving ? "Creating…" : "Create Link"}
                </button>
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="flex-1 bg-white/5 hover:bg-white/10 py-2 rounded-lg transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
