"use client";

/**
 * /admin/affiliates — Manage affiliate creators and track referral commissions.
 *
 * Create an affiliate → paste their Stripe Promo Code ID → send them the code.
 * Every sale through that code is tracked here automatically via the webhook.
 */

import { useEffect, useState } from "react";
import { useSession } from "@/components/session-provider";
import { useRouter } from "next/navigation";
import Link from "next/link";

type Affiliate = {
  id: string;
  name: string;
  email: string | null;
  stripePromoCodeId: string | null;
  stripePromoCode: string | null;
  commissionPct: number;
  notes: string | null;
  active: boolean;
  createdAt: string;
  totalReferrals: number;
  totalRevenueCents: number;
  totalCommissionCents: number;
  unpaidCommissionCents: number;
};

const EMPTY_FORM = {
  name: "",
  email: "",
  stripePromoCodeId: "",
  stripePromoCode: "",
  commissionPct: "20",
  notes: "",
};

function cents(n: number) {
  return `$${(n / 100).toFixed(2)}`;
}

export default function AdminAffiliatesPage() {
  const { loading, isAdmin } = useSession();
  const router = useRouter();

  const [list, setList] = useState<Affiliate[]>([]);
  const [fetching, setFetching] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [actionId, setActionId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !isAdmin) router.replace("/");
  }, [loading, isAdmin, router]);

  const fetchList = () => {
    if (!isAdmin) return;
    setFetching(true);
    fetch("/api/admin/affiliates")
      .then((r) => r.json())
      .then((d) => setList(d.affiliates ?? []))
      .catch(() => setError("Failed to load"))
      .finally(() => setFetching(false));
  };

  useEffect(() => {
    if (!loading) fetchList();
  }, [loading, isAdmin]); // eslint-disable-line

  const openCreate = () => {
    setEditId(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
  };

  const openEdit = (a: Affiliate) => {
    setEditId(a.id);
    setForm({
      name: a.name,
      email: a.email ?? "",
      stripePromoCodeId: a.stripePromoCodeId ?? "",
      stripePromoCode: a.stripePromoCode ?? "",
      commissionPct: String(a.commissionPct),
      notes: a.notes ?? "",
    });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) { setError("Name is required"); return; }
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/affiliates", {
        method: editId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: editId, ...form }),
      });
      if (!res.ok) throw new Error("Save failed");
      setShowForm(false);
      fetchList();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (a: Affiliate) => {
    setActionId(a.id);
    await fetch("/api/admin/affiliates", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: a.id, active: !a.active }),
    });
    fetchList();
    setActionId(null);
  };

  const markPaid = async (a: Affiliate) => {
    if (!confirm(`Mark all unpaid commission for ${a.name} as paid?`)) return;
    setActionId(a.id);
    await fetch("/api/admin/affiliates", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: a.id, action: "mark_paid" }),
    });
    fetchList();
    setActionId(null);
  };

  const handleDelete = async (a: Affiliate) => {
    if (!confirm(`Delete affiliate "${a.name}"? This removes all referral records.`)) return;
    setActionId(a.id);
    await fetch("/api/admin/affiliates", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: a.id }),
    });
    fetchList();
    setActionId(null);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-violet-500 border-t-transparent" />
      </div>
    );
  }

  // Totals summary
  const totalUnpaid = list.reduce((s, a) => s + a.unpaidCommissionCents, 0);
  const totalAllTime = list.reduce((s, a) => s + a.totalRevenueCents, 0);
  const totalReferrals = list.reduce((s, a) => s + a.totalReferrals, 0);

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-10 text-white">
      <div className="mx-auto max-w-6xl space-y-6">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-slate-500 text-sm mb-1">
              <Link href="/admin" className="hover:text-slate-300 transition-colors">Admin</Link>
              <span>/</span>
              <span className="text-slate-300">Affiliates</span>
            </div>
            <h1 className="text-2xl font-bold">Affiliate Program</h1>
            <p className="mt-1 text-sm text-slate-400">
              Track YouTubers, streamers, and creators who refer users to FireChess Pro.
            </p>
          </div>
          <button
            onClick={openCreate}
            className="rounded-xl bg-violet-600 px-4 py-2 text-sm font-bold shadow-lg shadow-violet-500/20 transition-all hover:bg-violet-500 active:scale-95"
          >
            + Add Affiliate
          </button>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {[
            { label: "Total Affiliates", value: list.length, color: "text-violet-400" },
            { label: "Total Referrals", value: totalReferrals, color: "text-cyan-400" },
            { label: "All-time Revenue", value: cents(totalAllTime), color: "text-emerald-400" },
            { label: "Commissions Owed", value: cents(totalUnpaid), color: "text-amber-400" },
          ].map((c) => (
            <div key={c.label} className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-4">
              <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">{c.label}</p>
              <p className={`mt-1 text-2xl font-bold tabular-nums ${c.color}`}>{c.value}</p>
            </div>
          ))}
        </div>

        {error && (
          <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        )}

        {/* Table */}
        {fetching ? (
          <div className="flex justify-center py-16">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-violet-500 border-t-transparent" />
          </div>
        ) : list.length === 0 ? (
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] py-16 text-center text-slate-500">
            No affiliates yet. Click <strong className="text-slate-400">+ Add Affiliate</strong> to get started.
          </div>
        ) : (
          <div className="space-y-3">
            {list.map((a) => (
              <div
                key={a.id}
                className={`rounded-xl border bg-white/[0.03] p-5 transition-colors ${
                  a.active ? "border-white/[0.06]" : "border-white/[0.03] opacity-60"
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  {/* Left: name + badges */}
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-base font-bold">{a.name}</span>
                      {a.stripePromoCode && (
                        <span className="rounded-md bg-cyan-500/10 border border-cyan-500/20 px-2 py-0.5 font-mono text-[11px] font-bold text-cyan-400 tracking-widest">
                          {a.stripePromoCode}
                        </span>
                      )}
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                          a.active
                            ? "bg-emerald-500/10 text-emerald-400"
                            : "bg-slate-500/10 text-slate-500"
                        }`}
                      >
                        {a.active ? "Active" : "Inactive"}
                      </span>
                    </div>
                    {a.email && <p className="text-xs text-slate-500">{a.email}</p>}
                    {a.notes && <p className="text-xs text-slate-400 italic">{a.notes}</p>}
                    {a.stripePromoCodeId && (
                      <p className="font-mono text-[10px] text-slate-600">
                        Stripe ID: {a.stripePromoCodeId}
                      </p>
                    )}
                  </div>

                  {/* Right: stats */}
                  <div className="flex flex-wrap gap-4 text-right">
                    <div>
                      <p className="text-[10px] uppercase tracking-wide text-slate-600">Referrals</p>
                      <p className="text-lg font-bold text-white tabular-nums">{a.totalReferrals}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-wide text-slate-600">Revenue</p>
                      <p className="text-lg font-bold text-emerald-400 tabular-nums">
                        {cents(a.totalRevenueCents)}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-wide text-slate-600">
                        Commission ({a.commissionPct}%)
                      </p>
                      <p className="text-lg font-bold tabular-nums text-amber-400">
                        {cents(a.totalCommissionCents)}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-wide text-slate-600">Owed</p>
                      <p
                        className={`text-lg font-bold tabular-nums ${
                          a.unpaidCommissionCents > 0 ? "text-red-400" : "text-slate-500"
                        }`}
                      >
                        {cents(a.unpaidCommissionCents)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-white/[0.05] pt-3">
                  <button
                    onClick={() => openEdit(a)}
                    className="rounded-lg border border-white/10 px-3 py-1.5 text-xs font-medium text-slate-300 transition-colors hover:bg-white/[0.06]"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => toggleActive(a)}
                    disabled={actionId === a.id}
                    className="rounded-lg border border-white/10 px-3 py-1.5 text-xs font-medium text-slate-300 transition-colors hover:bg-white/[0.06] disabled:opacity-40"
                  >
                    {a.active ? "Deactivate" : "Activate"}
                  </button>
                  {a.unpaidCommissionCents > 0 && (
                    <button
                      onClick={() => markPaid(a)}
                      disabled={actionId === a.id}
                      className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-400 transition-colors hover:bg-emerald-500/20 disabled:opacity-40"
                    >
                      Mark {cents(a.unpaidCommissionCents)} Paid
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(a)}
                    disabled={actionId === a.id}
                    className="ml-auto rounded-lg border border-red-500/20 px-3 py-1.5 text-xs font-medium text-red-500 transition-colors hover:bg-red-500/10 disabled:opacity-40"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* How-to box */}
        <div className="rounded-xl border border-violet-500/10 bg-violet-500/[0.04] p-5 text-sm text-slate-400 space-y-2">
          <p className="font-semibold text-slate-300">How to set up a new affiliate</p>
          <ol className="list-decimal list-inside space-y-1">
            <li>In Stripe Dashboard → <strong className="text-slate-200">Coupons</strong> → create a % discount coupon (e.g. 10% off first month).</li>
            <li>Under <strong className="text-slate-200">Promotion Codes</strong> → attach it to a code like <code className="text-cyan-400">GOTHAM</code>.</li>
            <li>Copy the <strong className="text-slate-200">Promotion Code ID</strong> (starts with <code className="text-violet-400">promo_</code>).</li>
            <li>Click <strong className="text-slate-200">+ Add Affiliate</strong> here, paste the ID and set the commission %.</li>
            <li>Email the creator their code. Every sale using it auto-appears here.</li>
          </ol>
        </div>
      </div>

      {/* Create / Edit modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-slate-900 p-6 shadow-2xl space-y-4">
            <h2 className="text-lg font-bold">{editId ? "Edit Affiliate" : "New Affiliate"}</h2>

            {error && (
              <p className="rounded-lg bg-red-500/10 border border-red-500/20 px-3 py-2 text-xs text-red-400">
                {error}
              </p>
            )}

            {[
              { key: "name", label: "Creator Name *", placeholder: "GothamChess" },
              { key: "email", label: "Payment Email", placeholder: "creator@email.com" },
              { key: "stripePromoCode", label: "Promo Code (what users type)", placeholder: "GOTHAM" },
              { key: "stripePromoCodeId", label: "Stripe Promo Code ID", placeholder: "promo_XXXXXXXXXXXXXXXX" },
              { key: "commissionPct", label: "Commission %", placeholder: "20" },
            ].map(({ key, label, placeholder }) => (
              <div key={key}>
                <label className="mb-1 block text-xs font-medium text-slate-400">{label}</label>
                <input
                  type={key === "commissionPct" ? "number" : "text"}
                  value={form[key as keyof typeof form]}
                  onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                  placeholder={placeholder}
                  className="w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white placeholder-slate-600 outline-none focus:border-violet-500/60"
                />
              </div>
            ))}

            <div>
              <label className="mb-1 block text-xs font-medium text-slate-400">Notes (optional)</label>
              <textarea
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                placeholder="e.g. PayPal: creator@email.com — reached out March 2026"
                rows={2}
                className="w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white placeholder-slate-600 outline-none focus:border-violet-500/60 resize-none"
              />
            </div>

            <div className="flex gap-2 pt-1">
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 rounded-xl bg-violet-600 py-2.5 text-sm font-bold transition-all hover:bg-violet-500 disabled:opacity-50"
              >
                {saving ? "Saving…" : editId ? "Save Changes" : "Create Affiliate"}
              </button>
              <button
                onClick={() => { setShowForm(false); setError(null); }}
                className="flex-1 rounded-xl border border-white/10 py-2.5 text-sm font-medium text-slate-400 transition-colors hover:bg-white/[0.05]"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
