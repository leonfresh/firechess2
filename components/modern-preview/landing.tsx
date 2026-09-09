"use client";

import Image from "next/image";
import Link from "next/link";
import { ProductPreview } from "./hero-slideshow";
import { ScanForm } from "./scan-form";
import { LandingDetails } from "./landing-details";
import { ArrowDown, ArrowRight, ArrowUpRight, Crosshair, Layers3, TrendingUp, Zap } from "lucide-react";
import { SAMPLE_REPORTS } from "@/lib/sample-reports";
import { PreviewHeader } from "./shared";
import s from "./modern.module.css";

export function ModernLanding() {
  return <div className={`${s.root} ${s.landingRoot}`}>
    <PreviewHeader />
    <div className={s.landingContainer}>
      <section className={s.hero}>
        <div className={s.heroCopy}><div className={s.heroEyebrow}><span className={s.greenDot} /> YOUR PERSONAL CHESS BREAKDOWN</div><h1>You play the games.<br />We find <span>your edge.</span></h1><p className={s.heroDescription}>Understand the mistakes you keep making.<br className={s.desktopBreak} /> Get a clear plan to turn them into your strengths.</p><ScanForm /><Link className={s.sampleLink} href="/report/8c8d499e-1f04-4121-aabc-71a818b98ce6"><span className={s.playCircle}><ArrowUpRight size={15} /></span>Take a look inside a report <span className={s.muted}>No scan needed</span></Link></div>
        <ProductPreview />
      </section>
      <div className={s.trustRow}><span>Built around the way you play</span><span><Layers3 size={17} /> Analyze across games</span><span><Crosshair size={17} /> Find recurring patterns</span><span><Zap size={17} /> Powered by Stockfish 18</span></div>
      <section className={s.stepsSection} id="how-it-works"><div className={s.sectionHeading}><div><span className={s.eyebrow}>FROM INSIGHT TO INSTINCT</span><h2>A little clarity goes a long way.</h2></div><a href="#scan" className={s.textLink}>Find your first pattern <ArrowRight size={16} /></a></div><div className={s.stepsGrid}>{[
        { icon: Layers3, title: "Bring your games", text: "Connect a username or import a PGN. Your game history is the starting point." },
        { icon: Crosshair, title: "See what repeats", text: "Look beyond individual blunders. Find the openings and habits that keep showing up." },
        { icon: TrendingUp, title: "Make your next move", text: "Practice real positions from your games, with a clear explanation of the better move." },
      ].map((step, i) => <article className={s.step} key={step.title}><div className={s.stepTop}><step.icon size={24} /><span>0{i + 1}</span></div><h3>{step.title}</h3><p>{step.text}</p></article>)}</div></section>
      <section className={s.sampleSection}><div className={s.sectionHeading}><div><span className={s.eyebrow}>EVEN GREAT PLAYERS HAVE PATTERNS</span><h2>Real games. A fresh perspective.</h2></div><Link href="/report/8c8d499e-1f04-4121-aabc-71a818b98ce6" className={s.textLink}>Explore the new report <ArrowRight size={16} /></Link></div><div className={s.playersGrid}>{SAMPLE_REPORTS.slice(0, 3).map((player) => <Link href={player.reportId ? `/report/${player.reportId}` : "/report/8c8d499e-1f04-4121-aabc-71a818b98ce6"} className={s.playerCard} key={player.username}><div className={s.playerTop}><Image src={player.imageUrl!} alt="" width={48} height={48} /><ArrowUpRight size={18} /></div><h3>{player.displayName}</h3><p>{player.label.split("·")[0].trim()} · {player.source === "chess.com" ? "Chess.com" : "Lichess"}</p><div className={s.playerBottom}><span>{player.highlights.gamesScanned} games analyzed</span><span>View report <ArrowRight size={14} /></span></div></Link>)}</div></section>
      <LandingDetails /><section className={s.bottomCta}><div><span className={s.eyebrow}>YOUR NEXT STEP</span><h2>Better chess starts with your chess.</h2><p>Start with a free scan. See what your games are telling you.</p></div><a href="#scan" className={s.primaryButton}>Find my patterns <ArrowDown size={17} /></a></section>
    </div>
  </div>;
}
