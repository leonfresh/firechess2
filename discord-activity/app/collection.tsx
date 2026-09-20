"use client";
import { ChaosNavLink } from "@/components/chaos-nav-link";
import { useActivityDialog } from "./use-activity-dialog";
import { useEffect, useId, useState } from "react";
import { ACTIVE_MODIFIERS, type ModifierTier } from "@/lib/chaos-chess";
import { ALL_ANOMALIES } from "@/lib/chaos-anomalies";
import { GUEST_UNLOCKED_IDS } from "@/lib/chaos-collection";
import { chaosIdentityHeaders } from "@/lib/chaos-client-identity";
import { getGuestId } from "@/lib/guest-id";
import { ChaosHubIcon } from "@/components/chaos-hub-icon";
import { ShopPowerPreview } from "./shop-power-preview";
import { PowerArt } from "./power-art";

/** Persistent fairy-piece identities, each linked to the power that explains it. */
const PIECE_IDS = ["camel","dragon-rook","knook","archbishop","amazon","night-rider","rook-cannon","pawn-capture-forward","railgun","vaulting-knight","bank-shot"] as const;

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

/** Shared collection and gold shop, available from the lobby without leaving the game. */
export function ActivityCollection({ card = false, shopEntry = false, page = false }: { card?: boolean; shopEntry?: boolean; page?: boolean }) {
  const [open, setOpen] = useState(page),
    [tab, setTab] = useState<Tab>(shopEntry ? "shop" : "powers");
  const [unlocked, setUnlocked] = useState<Set<string> | null>(null);
  /** Gold balance from the collection API: null when the player has no earning identity yet. */
  const [gold, setGold] = useState<{ total: number; week: number } | null>(null);
  /** Shop cards with prices and ownership, straight from the collection API. */
  const [shop, setShop] = useState<ShopCard[] | null>(null);
  const [buying, setBuying] = useState<string | null>(null);
  const [confirmBuy, setConfirmBuy] = useState<string | null>(null);
  const [notice, setNotice] = useState("");
  const [retry, setRetry] = useState(0);
  const [shopError, setShopError] = useState<string | null>(null);
  const { ref: dialog, onBackdropClick } = useActivityDialog(page ? false : open, () => setOpen(false));
  useEffect(() => {
    if (!open) return;
    let active = true;
    const headers = { "X-Guest-Id": getGuestId(), ...chaosIdentityHeaders() };
    setUnlocked(null);
    setGold(null);
    setShop(null);
    setShopError(null);
    setConfirmBuy(null);
    setNotice("");
    void (async () => {
      try {
        const r = await fetch("/api/chaos/collection", {
          headers,
          cache: "no-store",
        });
        if (!r.ok) throw new Error("Collection unavailable");
        const d = await r.json();
        if (active)
          setUnlocked(new Set<string>(d?.unlockedIds ?? GUEST_UNLOCKED_IDS));
        if (active && typeof d?.gold === "number")
          setGold({
            total: d.gold,
            week: typeof d.goldWeek === "number" ? d.goldWeek : 0,
          });
        if (active && Array.isArray(d?.shop)) setShop(d.shop as ShopCard[]);
      } catch {
        if (active) { setUnlocked(new Set<string>(GUEST_UNLOCKED_IDS)); setShopError("The Armoury could not load. Please try again."); }
      }
    })();
    return () => {
      active = false;
    };
  }, [open, retry]);
  /** Buy a shop card. The server decides the price; the UI only shows what it reports back. */
  const buy = async (cardId: string) => {
    if (buying) return;
    setBuying(cardId);
    setShopError(null);
    try {
      const r = await fetch("/api/chaos/shop", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "X-Guest-Id": getGuestId(),
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
      setConfirmBuy(null);
      setNotice(`${ACTIVE_MODIFIERS.find(m => m.id === cardId)?.name ?? "Power"} unlocked. It can now appear in future drafts.`);
      window.dispatchEvent(new Event("chaos-collection-changed"));
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
    ACTIVE_MODIFIERS.filter((m) => m.tier === tier && has(m.id) === owned).length;
  const collected = unlocked
    ? ACTIVE_MODIFIERS.filter((m) => has(m.id)).length
    : null;
  const shopCards = shop ?? [];
  const shopLocked = shopCards.filter((c) => !c.owned).length;
  const titleId = useId();
  const row = (id: string) => {
    const mod = ACTIVE_MODIFIERS.find((m) => m.id === id);
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
  const Heading = page ? "h1" : "h2";
  const content = <>
        <header className="career-heading">
          <div>
            <span className="eyebrow">THE ARMOURY</span>
            <Heading id={titleId}>{tab === "shop" ? "The power shop" : "Your collection"}</Heading>
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
          {!page && <button
            className="sound-button modal-close"
            autoFocus
            onClick={() => setOpen(false)}
            aria-label="Close collection"
          >
            ✕
          </button>}
        </header>
        <p className="career-note" role="status">
          {collected === null
            ? "Counting your kit…"
            : `${collected} of ${ACTIVE_MODIFIERS.length} powers in your kit.`}
          {shopLocked > 0
            ? ` ${shopLocked} card${shopLocked === 1 ? "" : "s"} still in the shop.`
            : shop ? " All shop powers owned." : ""}
        </p>
        <nav className="career-tabs" aria-label="Collection sections">
          {(
            [
              ["shop", "Power shop"],
              ["powers", `Powers (${ACTIVE_MODIFIERS.length})`],
              ["pieces", `Pieces (${PIECE_IDS.length})`],
              ["anomalies", `Anomalies (${ALL_ANOMALIES.length})`],
            ] as [Tab, string][]
          ).map(([id, label]) => id === "shop" && !page ? <ChaosNavLink key={id} href="/shop">{label} ↗</ChaosNavLink> : (
            <button
              key={id}
              aria-pressed={tab === id}
              onClick={() => { setTab(id); setConfirmBuy(null); }}
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
                  {ACTIVE_MODIFIERS.filter((m) => m.tier === tier.id).map((m) =>
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
          <section className="power-shop" aria-label="Power shop">
            <div className="shop-intro"><span className="eyebrow">NEW TRICKS. PERMANENT UNLOCKS.</span><p>Buy a power once with earned gold. It joins your drafts—not your opponent’s.</p></div>
            {shop && gold === null && <p className="shop-signin"><a href="https://www.firechess.com/api/chaos/website-login">Sign in to earn gold</a><span>Or play signed in through Discord. 26 starter powers are free.</span></p>}
            {notice && <p className="shop-success" role="status">✓ {notice}</p>}
            {shopError && <div className="shop-error" role="alert">{shopError} {!shop && <button className="sound-button" onClick={() => setRetry(r => r + 1)}>Try again</button>}</div>}
            {!shop && !shopError && <p className="shop-loading" role="status">Opening the Armoury…</p>}
            {shop && !shop.length && <p className="career-empty">New powers are on their way. Your existing collection is ready to play.</p>}
            <div className="shop-grid">
              {shopCards.map(item => {
                const affordable = gold !== null && gold.total >= item.price;
                return <article className="shop-power" data-tier={item.tier} data-owned={item.owned} key={item.id}>
                  <div className="shop-power-visual"><PowerArt id={item.id} /><span className="shop-rarity">{item.tier}</span>{item.owned && <span className="shop-owned">✓ Owned</span>}</div>
                  <div className="shop-power-copy"><h3>{item.name}</h3><p>{item.description}</p><small>{({"vaulting-knight":"All knights · stacks with hybrids", "bank-shot":"All rooks · one turn at the edge", "night-rider":"One knight · repeated L-jumps", "phantom-rook":"All rooks · pass through allies", "bishop-bounce":"All bishops · ricochet movement", "queen-teleport":"Queen · once per match"} as Record<string,string>)[item.id] ?? "Permanent draft unlock"}</small></div>
                  <div className="shop-power-action">
                    {item.owned ? <p className="shop-ready">✓ Ready for your drafts</p> : confirmBuy === item.id ? <div className="shop-confirm"><p>Unlock for <strong>{item.price} gold</strong>?</p><button className="primary-action" disabled={!!buying || !affordable} onClick={() => buy(item.id)}>{buying === item.id ? "Unlocking…" : "Confirm unlock"}</button><button className="shop-cancel" disabled={!!buying} onClick={() => setConfirmBuy(null)}>Not now</button></div> : <><button className="shop-buy" disabled={!!buying || !affordable} onClick={() => setConfirmBuy(item.id)}><span>Unlock power</span><b>◈ {item.price}</b></button><small>{gold === null ? "Sign in to earn and spend gold" : !affordable ? `${item.price - gold.total} more gold needed` : "Yours to keep"}</small></>}
                  </div>
                  <ShopPowerPreview id={item.id} />
                </article>;
              })}
            </div>
            <div className="shop-earn"><div><span className="eyebrow">PLAY YOUR WAY TO MORE</span><h3>Every finished game counts.</h3></div><ul><li><b>+10</b> Finish a game</li><li><b>+15</b> Win bonus</li><li><b>+5</b> Timed game</li><li><b>+25</b> First daily win</li></ul></div>
          </section>
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
          26 starter powers are unlocked. Shop cards are bought once with earned gold and
          then drafted like any other. Anomalies are never locked — Pro players
          just see more choices at the start of a match.
        </p>
  </>;
  return <>
{!page && !shopEntry && (      <button
        className={shopEntry ? "armoury-entry" : card ? "lobby-destination" : "sound-button"}
        data-tone="mint"
        onClick={() => { setTab(shopEntry ? "shop" : "powers"); setOpen(true); }}
      >
        {shopEntry ? (<><span className="armoury-entry-art"><PowerArt id="bank-shot" /></span><span><small>THE ARMOURY</small><strong>Power shop</strong><span>Earn gold. Add new tricks to your drafts.</span></span><b aria-hidden="true">↗</b></>) : card ? (
          <>
            <span className="destination-icon">
              <ChaosHubIcon kind="collection" />
            </span>
            <strong>Collection</strong>
            <small>Every power &amp; piece</small>
          </>
        ) : (
          "Collection"
        )}
      </button>
)}{!page && shopEntry && <ChaosNavLink href="/shop" className="armoury-entry"><span className="armoury-entry-art"><PowerArt id="bank-shot" /></span><span><small>THE ARMOURY</small><strong>Power shop</strong><span>Find your next trick.</span></span><b aria-hidden="true">↗</b></ChaosNavLink>}
    {page ? <section className="armoury-page" aria-labelledby={titleId}>{content}</section> : !shopEntry &&
      <dialog className="career-dialog collection-dialog" ref={dialog} onClick={onBackdropClick}
        onCancel={() => setOpen(false)} aria-labelledby={titleId}>{content}</dialog>}
  </>;
}
