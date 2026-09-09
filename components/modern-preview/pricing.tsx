"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Check, LoaderCircle } from "lucide-react";
import { useSession } from "@/components/session-provider";
import { PRICING_TIERS } from "@/components/home/pricing-teaser";
import { PreviewHeader } from "./shared";
import s from "./modern.module.css";

const FREE_FEATURES = ["50 games per scan · depth 12","Full overview and finding counts","3 openings, 3 tactics and 3 endgames","1 brilliant, clock and positional example","Review and practice unlocked positions"];
const COMPARISON = [
  ["Games per scan","50","Larger scans"], ["Engine depth","Up to 12","Up to 24"],
  ["Report overview & section totals","Included","Included"], ["Openings, tactics & endgames","3 examples each","All findings"],
  ["Brilliants, clock & positional examples","1 each","All findings"], ["Interactive boards & practice","Unlocked examples","All findings"],
  ["Detailed repertoire & coaching","Limited examples","Full breakdown"], ["Report history & comparisons","Latest report","Full history"],
];
export function ModernPricing() {
  const { authenticated, loading, plan } = useSession();
  const [pending,setPending] = useState<string | null>(null);
  const [error,setError] = useState("");
  async function checkout(tier:"pro"|"lifetime") {
    if (pending || loading) return;
    if (!authenticated) { window.location.href="/auth/signin?callbackUrl=%2Fnewpricing"; return; }
    setPending(tier);setError("");
    try {
      const response=await fetch("/api/checkout",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(tier==="lifetime"?{plan:"lifetime"}:{})});
      const data=await response.json();
      if (!response.ok) throw new Error(data.error??"Could not start checkout. Please try again.");
      if (typeof data.url !== "string") throw new Error("Checkout did not return a payment link.");
      const url=new URL(data.url);
      if (url.protocol !== "https:" || url.hostname !== "checkout.stripe.com") throw new Error("Checkout returned an unexpected payment link.");
      window.location.assign(url.href);
    } catch (issue) {setError(issue instanceof Error?issue.message:"Could not connect to checkout.");setPending(null);}
  }
  return <div className={s.root}><PreviewHeader /><div className={s.dashboardContainer}>
    <header className={s.pricingHeading}><span className={s.eyebrow}>INVEST IN YOUR NEXT MOVE</span><h1>Find your patterns.<br /><em>Choose how deep to go.</em></h1><p>Start with a complete practice experience. Upgrade for every finding and a fuller picture of your game.</p></header>
    {error && <p role="alert" className={s.formError}>{error}</p>}
    <div className={s.pricingGrid}>{PRICING_TIERS.map(tier=>{const id=tier.name.toLowerCase() as "free"|"pro"|"lifetime";const current=authenticated&&plan===id;return <article key={id} className={`${s.priceCard} ${tier.highlight?s.priceFeatured:""}`}><span className={s.eyebrow}>{tier.name}</span>{tier.badge&&<span className={s.priceBadge}>{tier.badge}</span>}<div className={s.priceAmount}><strong>{tier.price}</strong><span>{tier.suffix??(id==="lifetime"?"once":"forever")}</span>{tier.was&&<del>{tier.was}</del>}</div><p>{tier.blurb}</p>{id==="free"?<Link href="/#scan" className={s.secondaryButton}>Start a free scan <ArrowRight size={16}/></Link>:<button className={tier.highlight?s.primaryButton:s.secondaryButton} disabled={loading||!!pending||current||plan==="lifetime"} onClick={()=>checkout(id)}>{pending===id?<><LoaderCircle size={16} className={s.spinner}/>Opening checkout…</>:current?"Your current plan":plan==="lifetime"?"Included in Lifetime":tier.cta}</button>}<ul>{(id==="free"?FREE_FEATURES:tier.features).map(feature=><li key={feature}><Check size={16}/><span>{feature}</span></li>)}</ul></article>;})}</div>
    <section className={s.pricingComparison}><div className={s.sectionHeading}><div><span className={s.eyebrow}>THE DETAILS, SIDE BY SIDE</span><h2>What’s included?</h2></div><span className={s.muted}>Lifetime includes all Pro features.</span></div><div className={s.tableScroll}><table className={s.dataTable}><caption>Compare Free, Pro and Lifetime features</caption><thead><tr><th scope="col">Feature</th><th scope="col">Free</th><th scope="col">Pro & Lifetime</th></tr></thead><tbody>{COMPARISON.map(([feature,free,pro])=><tr key={feature}><th scope="row">{feature}</th><td>{free}</td><td>{pro}</td></tr>)}</tbody></table></div></section>
    <section className={s.faqSection}><div><span className={s.eyebrow}>BEFORE YOU CHOOSE</span><h2>Keep it simple.</h2><Link href="/account" className={s.textLink}>Manage an existing subscription →</Link></div><div className={s.faqList}>{[["Can I try the report first?","Yes. Explore a public sample report or start a free scan. The free examples include a board, move comparison and practice."],["What happens when I upgrade?","Payments are handled securely through Stripe. Pro and Lifetime unlock the paid features supported by your account."],["Is Lifetime a subscription?","No. Lifetime is a one-time payment for Pro access. Monthly Pro is a recurring subscription."],["Will upgrading generate a new report?","Upgrading changes access; it does not automatically reanalyze your games. Run a fresh scan to analyze new games or use a different engine depth."]].map(([question,answer])=><details key={question}><summary>{question}<span>+</span></summary><p>{answer}</p></details>)}</div></section>
  </div></div>;
}
