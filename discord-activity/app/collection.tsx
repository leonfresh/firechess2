"use client";
import { useEffect, useRef, useState } from "react";
import { ALL_MODIFIERS, type ModifierTier } from "@/lib/chaos-chess";
import { ALL_ANOMALIES } from "@/lib/chaos-anomalies";
import { GUEST_UNLOCKED_IDS } from "@/lib/chaos-collection";
import { chaosIdentityHeaders } from "@/lib/chaos-client-identity";
import { getGuestId } from "@/lib/guest-id";
import { ChaosHubIcon } from "@/components/chaos-hub-icon";
import { PowerArt } from "./power-art";

/** The nine fairy pieces, in board-art order. Every one has a modifier entry that explains it. */
const PIECE_IDS = ["camel","dragon-rook","knook","archbishop","amazon","night-rider","rook-cannon","pawn-capture-forward","railgun"] as const;

const TIERS: { id: ModifierTier; label: string; blurb: string }[] = [
  { id: "common", label: "Common", blurb: "Everyday kit" },
  { id: "rare", label: "Rare", blurb: "Sharp edges" },
  { id: "epic", label: "Epic", blurb: "Table-flippers" },
  { id: "legendary", label: "Legendary", blurb: "Game-warping" },
];

type Tab = "powers" | "pieces" | "anomalies" | "shop";

/** One row of the shop, as the collection API reports it. */
type ShopCard = {
  id: string;
  name: string;
  description: string;
  icon: string;
  tier: string;
  price: number;
  owned: boolean;
};

/**
 * The Armoury: every power, fairy piece and tarot anomaly in one place, with what the player has
 * collected so far. Unlocks come from the collection API (guest set for Discord players, the full
 * set for a signed-in FireChess account) and the next unlock is measured in games played.
 */
export function ActivityCollection({ card = false }: { card?: boolean }) {
  const [open, setOpen] = useState(false),
    [tab, setTab] = useState<Tab>("powers");
  const [unlocked, setUnlocked] = useState<Set<string> | null>(null);
  const [games, setGames] = useState<number | null>(null);
  /** Gold balance from the collection API: null when the player has no earning identity yet. */
  const [gold, setGold] = useState<{ total: number; week: number } | null>(null);
  /** Shop cards with prices and ownership, straight from the collection API. */
  const [shop, setShop] = useState<ShopCard[] | null>(null);
  const [buying, setBuying] = useState<string | null>(null);
  const [shopError, setShopError] = useState<string | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    if (open) dialog.current?.showModal();
    else dialog.current?.close();
  }, [open]);
  useEffect(() => {
    if (!open) return;
    let active = true;
    const headers = { "X-Guest-Id": getGuestId(), ...chaosIdentityHeaders() };
    setUnlocked(null);
    setGames(null);
    setGold(null);
    setShop(null);
    setShopError(null);
    void (async () => {
      try {
        const r = await fetch("/api/chaos/collection", {
          headers,
          cache: "no-store",
        });
        const d = r.ok ? await r.json() : null;
        if (active)
          setUnlocked(new Set<string>(d?.unlockedIds ?? GUEST_UNLOCKED_IDS));
        if (active && typeof d?.gold === "number")
          setGold({
            total: d.gold,
            week: typeof d.goldWeek === "number" ? d.goldWeek : 0,
          });
        if (active && Array.isArray(d?.shop)) setShop(d.shop as ShopCard[]);
      } catch {
        if (active) setUnlocked(new Set<string>(GUEST_UNLOCKED_IDS));
      }
      try {
        const r = await fetch("/api/chaos/career?page=0", {
          headers,
          cache: "no-store",
        });
        const d = r.ok ? await r.json() : null;
        if (active)
          setGames(typeof d?.profile?.games === "number" ? d.profile.games : 0);
      } catch {
        if (active) setGames(0);
      }
    })();
    return () => {
      active = false;
    };
  }, [open]);
  /** Buy a shop card. The server decides the price; the UI only shows what it reports back. */
  const buy = async (cardId: string) => {
    setBuying(cardId);
    setShopError(null);
    try {
      const r = await fetch("/api/chaos/shop", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          ...chaosIdentityHeaders(),
        },
        body: JSON.stringify({ cardId }),
      });
      const d = await r.json().catch(() => null);
      if (!r.ok) {
        setShopError(typeof d?.error === "string" ? d.error : "Purchase failed");
        return;
      }
      setShop((prev) =>
        prev
          ? prev.map((c) => (c.id === cardId ? { ...c, owned: true } : c))
          : prev,
      );
      setUnlocked((prev) => new Set([...(prev ?? []), cardId]));
      if (typeof d?.gold === "number")
        setGold((g) => ({ total: d.gold, week: g?.week ?? 0 }));
    } catch {
      setShopError("Could not reach the shop");
    } finally {
      setBuying(null);
    }
  };
  const has = (id: string) => unlocked?.has(id) ?? false;
  const badge = (id: string) =>
    unlocked === null ? "…" : has(id) ? "✓" : "🔒";
  const inTier = (tier: ModifierTier, owned: boolean) =>
    ALL_MODIFIERS.filter((m) => m.tier === tier && has(m.id) === owned).length;
  const collected = unlocked
    ? ALL_MODIFIERS.filter((m) => has(m.id)).length
    : null;
  const shopCards = shop ?? [];
  const shopLocked = shopCards.filter((c) => !c.owned).length;
  const titleId = card ? "lobby-collection-title" : "nav-collection-title";
  const row = (id: string) => {
    const mod = ALL_MODIFIERS.find((m) => m.id === id);
    if (!mod) return null;
    return (
      <li key={mod.id} data-locked={unlocked ? !has(mod.id) : false}>
        <PowerArt id={mod.id} piece={mod.piece || "p"} />
        <span>
          <strong>{mod.name}</strong>
          <small>{mod.description}</small>
        </span>
        <b className="collection-badge" data-owned={has(mod.id)}>
          {badge(mod.id)}
        </b>
      </li>
    );
  };
  return (
    <>
      <button
        className={card ? "lobby-destination" : "sound-button"}
        data-tone="mint"
        onClick={() => setOpen(true)}
      >
        {card ? (
          <>
            <span className="destination-icon">
              <ChaosHubIcon kind="collection" />
            </span>
            <strong>Collection</strong>
            <small>Every power &amp; piece</small>
            <span className="destination-arrow" aria-hidden="true">
              ↗
            </span>
          </>
        ) : (
          "Collection"
        )}
      </button>
      <dialog
        className="career-dialog collection-dialog"
        ref={dialog}
        onCancel={() => setOpen(false)}
        aria-labelledby={titleId}
      >
        <header className="career-heading">
          <div>
            <span className="eyebrow">THE ARMOURY</span>
            <h2 id={titleId}>Your collection</h2>
          </div>
          {gold ? (
            <span
              className="collection-gold"
              role="status"
              aria-label={`${gold.total} gold${gold.week > 0 ? `, ${gold.week} earned this week` : ""}`}
            >
              <span aria-hidden="true">🪙</span>
              <strong>{gold.total.toLocaleString()}</strong>
              {gold.week > 0 ? <small>+{gold.week} this week</small> : null}
            </span>
          ) : null}
          <button
            className="sound-button"
            onClick={() => setOpen(false)}
            aria-label="Close collection"
          >
            ✕
          </button>
        </header>
        <p className="career-note" role="status">
          {collected === null
            ? "Counting your kit…"
            : `${collected} of ${ALL_MODIFIERS.length} powers in your kit.`}
          {games ? ` ${games} ${games === 1 ? "game" : "games"} played.` : ""}
          {shopLocked > 0
            ? ` ${shopLocked} card${shopLocked === 1 ? "" : "s"} still in the shop.`
            : " Everything is unlocked."}
        </p>
        <nav className="career-tabs" aria-label="Collection sections">
          {(
            [
              ["powers", `Powers (${ALL_MODIFIERS.length})`],
              ["pieces", `Pieces (${PIECE_IDS.length})`],
              ["anomalies", `Anomalies (${ALL_ANOMALIES.length})`],
              ["shop", shop ? `Shop (${shopCards.length})` : "Shop"],
            ] as [Tab, string][]
          ).map(([id, label]) => (
            <button
              key={id}
              aria-pressed={tab === id}
              onClick={() => setTab(id)}
            >
              {label}
            </button>
          ))}
        </nav>
        {tab === "powers" ? (
          <div>
            {TIERS.map((tier) => (
              <section key={tier.id}>
                <div className="collection-tier">
                  <h3>{tier.label}</h3>
                  <small>
                    {tier.blurb} ·{" "}
                    {unlocked
                      ? `${inTier(tier.id, true)}/${inTier(tier.id, true) + inTier(tier.id, false)}`
                      : "…"}
                  </small>
                </div>
                <ul className="career-list collection-list">
                  {ALL_MODIFIERS.filter((m) => m.tier === tier.id).map((m) =>
                    row(m.id),
                  )}
                </ul>
              </section>
            ))}
          </div>
        ) : tab === "pieces" ? (
          <ul className="career-list collection-list">
            {PIECE_IDS.map((id) => row(id))}
          </ul>
        ) : tab === "shop" ? (
          <div>
            {shopError ? (
              <p className="career-note" role="alert">
                {shopError}
              </p>
            ) : null}
            <ul className="career-list collection-list">
              {shopCards.map((card) => (
                <li key={card.id} data-locked={!card.owned}>
                  <PowerArt id={card.id} />
                  <span>
                    <strong>
                      {card.icon} {card.name}
                    </strong>
                    <small>
                      {card.tier} ·{" "}
                      {card.owned ? "In your collection" : `${card.price} gold`}
                    </small>
                    <small>{card.description}</small>
                  </span>
                  {card.owned ? (
                    <b className="collection-badge" data-owned="true">
                      ✓
                    </b>
                  ) : (
                    <button
                      className="sound-button"
                      disabled={buying === card.id}
                      onClick={() => buy(card.id)}
                    >
                      {buying === card.id ? "Buying…" : `Buy · ${card.price}`}
                    </button>
                  )}
                </li>
              ))}
            </ul>
            <p className="career-note">
              Gold is earned by finishing games: 10 a game, +15 for a win, +5 on a
              clock, and +25 for your first win each day.
            </p>
          </div>
        ) : (
          <ul className="career-list collection-list">
            {ALL_ANOMALIES.map((a) => (
              <li key={a.id}>
                <img
                  className="anomaly-art"
                  src={`/activity/anomalies/${a.id}.webp`}
                  alt=""
                  width={640}
                  height={640}
                  loading="lazy"
                  decoding="async"
                />
                <span>
                  <strong>
                    {a.icon} {a.name}
                  </strong>
                  <small>
                    {a.tarotRoman} · {a.tarotName} ·{" "}
                    {a.trigger === "once-per-game"
                      ? "Once per match"
                      : "Match ability"}
                  </small>
                  <small>{a.description}</small>
                </span>
              </li>
            ))}
          </ul>
        )}
        <p className="career-note">
          Every base card is unlocked. Shop cards are bought once with gold and
          then drafted like any other. Anomalies are never locked — Pro players
          just see more choices at the start of a match.
        </p>
      </dialog>
    </>
  );
}
