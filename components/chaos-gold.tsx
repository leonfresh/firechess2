"use client";
/**
 * Gold you can see and spend. Before this, games paid gold that no screen mentioned, so almost nobody
 * spent it: 27 players could afford a card and no one had bought one since the price cut.
 *
 *  - ChaosGoldReward: result screen. What this game paid (line by line), the balance, and one card the
 *    balance covers with a one-tap unlock.
 *  - ChaosGoldNudge: lobby notice, shown once each time a new card becomes affordable.
 *  - GoldDot: a dot on the shop link while something is affordable.
 *
 * All read /api/chaos/gold. Buying goes through /api/chaos/shop and announces "chaos-collection-changed"
 * so the page's draft pool includes the card from the next game.
 */
import { useCallback, useEffect, useState } from "react";
import { ChaosNavLink } from "@/components/chaos-nav-link";
import { chaosIdentityHeaders } from "@/lib/chaos-client-identity";
import { getGuestId } from "@/lib/guest-id";
import { trackChaos } from "@/lib/chaos-events";
import { GOLD_REASON_LABELS } from "@/lib/chaos-gold-offer";

type Offer = { id: string; name: string; description: string; icon: string; tier: string; price: number };
type GoldStatus =
  | { signedIn: false }
  | { signedIn: true; balance: number; matchId: string | null; earned: { reason: string; amount: number }[] | null; offer: Offer | null; affordable: number };

const headers = () => ({ "X-Guest-Id": getGuestId(), ...chaosIdentityHeaders() });
const fetchGold = (room?: string): Promise<GoldStatus | null> =>
  fetch(`/api/chaos/gold${room ? `?room=${encodeURIComponent(room)}` : ""}`, { headers: headers(), cache: "no-store" })
    .then((r) => (r.ok ? r.json() : null))
    .catch(() => null);

async function buy(card: Offer): Promise<{ ok: true; gold: number } | { ok: false; error: string }> {
  try {
    const res = await fetch("/api/chaos/shop", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...headers() },
      body: JSON.stringify({ cardId: card.id }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return { ok: false, error: data.error ?? "Could not unlock it. Try the shop." };
    window.dispatchEvent(new Event("chaos-collection-changed"));
    window.dispatchEvent(new Event("chaos-gold-changed"));
    return { ok: true, gold: data.gold };
  } catch {
    return { ok: false, error: "Could not unlock it. Try the shop." };
  }
}

/** Balance and offer, refreshed whenever gold or the collection changes anywhere on the page. */
export function useGoldStatus() {
  const [status, setStatus] = useState<GoldStatus | null>(null);
  useEffect(() => {
    let active = true;
    const load = () => void fetchGold().then((s) => { if (active && s) setStatus(s); });
    load();
    window.addEventListener("chaos-gold-changed", load);
    window.addEventListener("chaos-collection-changed", load);
    return () => { active = false; window.removeEventListener("chaos-gold-changed", load); window.removeEventListener("chaos-collection-changed", load); };
  }, []);
  return status;
}

const card: React.CSSProperties = { borderRadius: 14, border: "1px solid #fbd48155", background: "#fbd4810f", padding: "12px 14px", color: "#f8f6ef", textAlign: "left" };
const goldText: React.CSSProperties = { color: "#fbd481", fontWeight: 800 };
const buttonStyle: React.CSSProperties = { border: 0, borderRadius: 10, padding: "8px 14px", fontWeight: 800, cursor: "pointer", background: "#fbd481", color: "#241a05", whiteSpace: "nowrap" };

function OfferRow({ offer, where, onBought }: { offer: Offer; where: "result" | "lobby"; onBought?: (gold: number) => void }) {
  const [state, setState] = useState<"idle" | "buying" | "bought" | string>("idle");
  useEffect(() => { trackChaos("shop_offer_seen", { where, card: offer.id }); }, [offer.id, where]);
  const unlock = async () => {
    setState("buying");
    const result = await buy(offer);
    if (result.ok) { setState("bought"); trackChaos("shop_offer_bought", { where, card: offer.id, price: offer.price }); onBought?.(result.gold); }
    else setState(result.error);
  };
  return (
    <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "8px 12px", marginTop: 10, paddingTop: 10, borderTop: "1px solid #ffffff18" }}>
      <span aria-hidden="true" style={{ fontSize: 26 }}>{offer.icon}</span>
      <span style={{ flex: "1 1 170px", minWidth: 0 }}>
        <strong style={{ display: "block", fontSize: 14 }}>{state === "bought" ? `${offer.name} unlocked!` : `You can afford ${offer.name}`}</strong>
        <span style={{ fontSize: 12, color: "#c2c8dc", overflow: "hidden", textOverflow: "ellipsis", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" } as React.CSSProperties}>
          {state === "bought" ? (offer.id.startsWith("anomaly:") ? "It joins your anomaly picks from the next game." : "It joins your draft pool from the next game.") : state !== "idle" && state !== "buying" ? state : offer.description}
        </span>
      </span>
      {state !== "bought" && (
        <button type="button" onClick={unlock} disabled={state === "buying"} style={buttonStyle}>
          {state === "buying" ? "Unlocking…" : `Unlock · ${offer.price}`}
        </button>
      )}
    </div>
  );
}

/** Result screen panel for an online game. `room` is the finished game's room id. */
export function ChaosGoldReward({ room }: { room: string | null }) {
  const [status, setStatus] = useState<GoldStatus | null>(null);
  const [balance, setBalance] = useState<number | null>(null);
  useEffect(() => {
    if (!room) return;
    let active = true, tries = 0;
    // The archive trigger pays gold when the room is marked finished, which can land a moment after
    // the result screen opens, so retry until this game's ledger lines appear.
    const poll = async () => {
      const s = await fetchGold(room);
      if (!active) return;
      if (s) { setStatus(s); if (s.signedIn) setBalance(s.balance); }
      if (s?.signedIn && s.earned === null && ++tries < 8) setTimeout(poll, 1500);
    };
    void poll();
    return () => { active = false; };
  }, [room]);
  const onBought = useCallback((gold: number) => setBalance(gold), []);
  if (!room || !status) return null;
  if (!status.signedIn) {
    return (
      <div style={card}>
        <span style={goldText}>💰 Online games pay gold</span>
        <span style={{ display: "block", fontSize: 12, color: "#c2c8dc", marginTop: 2 }}>
          Sign in (or play from Discord) to earn it and unlock new powers. <a className="chaos-gold-link" href="https://www.firechess.com/api/chaos/website-login" style={{ color: "#fbd481" }}>Sign in ↗</a>
        </span>
      </div>
    );
  }
  const total = status.earned?.reduce((sum, line) => sum + line.amount, 0) ?? 0;
  return (
    <div style={card} role="status">
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
        <span style={goldText}>{status.earned === null ? "💰 Counting your gold…" : total > 0 ? `💰 +${total} gold` : "💰 No gold this game"}</span>
        <span style={{ fontSize: 12, color: "#c2c8dc" }}>{balance ?? status.balance} gold total</span>
      </div>
      {status.earned && status.earned.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: "4px 12px", marginTop: 4, fontSize: 12, color: "#c2c8dc" }}>
          {status.earned.map((line) => <span key={line.reason}>+{line.amount} {GOLD_REASON_LABELS[line.reason] ?? line.reason}</span>)}
        </div>
      )}
      {status.earned && status.earned.length === 0 && (
        <div style={{ fontSize: 12, color: "#c2c8dc", marginTop: 4 }}>Gold is capped at 8 games a day against the same opponent.</div>
      )}
      {status.offer && <OfferRow offer={status.offer} where="result" onBought={onBought} />}
    </div>
  );
}

const NUDGE_KEY = "chaos-gold-nudge-seen";

/** Lobby notice: once each time the number of affordable cards goes up. */
export function ChaosGoldNudge({ className }: { className?: string }) {
  const status = useGoldStatus();
  const [show, setShow] = useState(false);
  const affordable = status?.signedIn ? status.affordable : null;
  useEffect(() => {
    if (affordable === null) return;
    let seen = 0;
    try { seen = Number(window.localStorage.getItem(NUDGE_KEY)) || 0; } catch {}
    if (affordable > seen) setShow(true);
    // Remember the count even when it drops (a purchase), so the next newly affordable card shows again.
    try { window.localStorage.setItem(NUDGE_KEY, String(affordable)); } catch {}
  }, [affordable]);
  if (!show || !status?.signedIn || !status.offer) return null;
  return (
    <div className={className} style={{ ...card, position: "relative", paddingRight: 40 }}>
      <span style={goldText}>💰 {status.balance} gold: {status.affordable === 1 ? "enough for a new power" : `enough for ${status.affordable} new powers`}</span>
      <OfferRow offer={status.offer} where="lobby" />
      <div style={{ marginTop: 8, fontSize: 12 }}><ChaosNavLink href="/shop" className="chaos-gold-link" style={{ color: "#fbd481" }}>See everything in the shop →</ChaosNavLink></div>
      <button type="button" aria-label="Hide" onClick={() => setShow(false)} style={{ position: "absolute", top: 6, right: 6, width: 30, height: 30, border: 0, borderRadius: 8, background: "transparent", color: "#a8afc7", fontSize: 18, cursor: "pointer" }}>×</button>
    </div>
  );
}

/** A small gold dot for the shop link while something is affordable. */
export function GoldDot() {
  const status = useGoldStatus();
  if (!status?.signedIn || !status.affordable) return null;
  return <span aria-label={`${status.affordable} affordable`} title="You can afford a new power" style={{ display: "inline-block", width: 8, height: 8, borderRadius: "50%", background: "#fbd481", boxShadow: "0 0 0 3px #fbd48133", marginLeft: 6, verticalAlign: "middle" }} />;
}
