import Link from "next/link";

import { ArrowRight, BookOpen, Check, Clock3, Crosshair, Flag, Sparkles, TrendingUp } from "lucide-react";

import { PRICING_TIERS } from "@/components/home/pricing-teaser";

import s from "./modern.module.css";



export function LandingDetails() {

  return <>

    <section className={s.featuresSection}><div className={s.sectionHeading}><div><span className={s.eyebrow}>MORE THAN A BLUNDER CHECK</span><h2>Your whole game.<br />A clearer picture.</h2></div><p>Go from a quick overview to the exact positions behind each insight.</p></div><div className={s.featureGrid}>{[

      { icon: BookOpen, title: "Build a better repertoire", text: "Find recurring opening leaks, compare your results by opening and review the alternatives." },

      { icon: Crosshair, title: "Recognize tactical themes", text: "Explore missed mates, hanging pieces and forcing moves from your own games." },

      { icon: Flag, title: "Finish what you started", text: "Break down endgame mistakes by piece type, with conversion and defensive hold rates." },

      { icon: Clock3, title: "Make your clock work for you", text: "See where you rushed a complex position or spent too long on a simple one." },

      { icon: TrendingUp, title: "Understand your habits", text: "Look at pawn structures, mental-game trends and how your results change after a loss." },

      { icon: Sparkles, title: "Remember your best chess", text: "Revisit brilliant moves and practice the ideas worth carrying into your next game." },

    ].map(feature => <article key={feature.title}><span className={s.featureIcon}><feature.icon size={23} /></span><h3>{feature.title}</h3><p>{feature.text}</p></article>)}</div></section>

    <section id="pricing" className={s.pricingSection}><div className={s.sectionHeading}><div><span className={s.eyebrow}>ROOM TO GROW</span><h2>Start free. Go deeper when you’re ready.</h2></div><Link href="/newpricing" className={s.textLink}>Full plan comparison <ArrowRight size={16} /></Link></div><p className={s.pricingIntro}>Find your first patterns with a free scan. Choose Pro for deeper analysis and the complete set of insights.</p><div className={s.pricingGrid}>{PRICING_TIERS.map(tier => <article key={tier.name} className={`${s.priceCard} ${tier.highlight ? s.priceFeatured : ""}`}>{tier.badge && <span className={s.priceBadge}>{tier.badge}</span>}<span className={s.eyebrow}>{tier.name}</span><div className={s.priceAmount}><strong>{tier.price}</strong><span>{tier.suffix ?? (tier.name === "Lifetime" ? "once" : "forever")}</span>{tier.was && <del>{tier.was}</del>}</div><p>{tier.blurb}</p><Link href={tier.name === "Free" ? "#scan" : "/newpricing"} className={tier.highlight ? s.primaryButton : s.secondaryButton}>{tier.cta}<ArrowRight size={16} /></Link><ul>{(tier.name === "Free" ? ["50 games per scan · engine depth 12", "Full overview and finding counts", "3 openings, 3 tactics + 3 endgames", "1 clock, positional + brilliant example", "Review and practice included"] : tier.features).map(feature => <li key={feature}><Check size={16} /><span>{feature === "10 tactics + 10 endgames per scan" ? "Tactics + endgame previews" : feature}</span></li>)}</ul></article>)}</div></section>

    <section className={s.faqSection} id="faq"><div><span className={s.eyebrow}>A FEW GOOD QUESTIONS</span><h2>Before your first scan.</h2><p>Everything starts with games you’ve already played.</p><Link href="/support" className={s.textLink}>Get in touch <ArrowRight size={15} /></Link></div><div className={s.faqList}>{[

      ["How is this different from reviewing one game?", "FireChess looks across your game history to find recurring positions, opening leaks and habits. You can then study the individual positions behind those findings."],

      ["Do I need to connect my account?", "Enter your public Chess.com or Lichess username. You don’t need to share your chess account password. You can also paste or upload a PGN."],

      ["What can I change in the scan settings?", "Choose how many games to scan, the opening move limit and engine depth. Expand Customize your scan for date ranges, time controls, analysis focus and the mistake threshold."],

      ["Why might a report show hundreds of findings?", "Each finding is a position or event worth reviewing. A single game can contain several findings, and themes can overlap. The report organizes them into sections so you can focus on one idea at a time."],

      ["Can I try it before paying?", "Yes. Start with a free scan, or open one of the sample reports above. Paid plans expand the analysis limits and the insights available to review."],

      ["How long does a scan take?", "It depends on the number of games, engine depth and your device. A smaller scan at the default depth is a useful starting point. The report shows progress while analysis runs."],

    ].map(([question,answer]) => <details key={question}><summary>{question}<span>+</span></summary><p>{answer}</p></details>)}</div></section>

  </>;

}

