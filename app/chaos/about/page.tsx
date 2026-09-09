import type { Metadata } from "next";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Chaos Chess — Chess with a few unfair advantages",
  description: "Draft wild powers, transform your pieces and challenge a friend. Play Chaos Chess free in your browser or as a Discord Activity.",
  alternates: { canonical: "https://www.firechess.com/chaos" },
  openGraph: { title: "Chaos Chess", description: "Your next move could change the rules. Play in your browser or Discord.", url: "https://www.firechess.com/chaos", images: [{ url: "/chaos-brand/cover.webp" }] },
};

export default function ChaosIntroduction() {
  return <div className={styles.page}>
    <section className={styles.hero} aria-labelledby="chaos-title">
      <div>
        <p className={styles.eyebrow}>A FireChess playground</p>
        <img src="/chaos-brand/logo.svg" alt="Chaos Chess" className={styles.logo} />
        <h1 id="chaos-title">Your next move could<br /><em>change the rules.</em></h1>
        <p className={styles.lead}>It starts with chess. Then your knight becomes a Knook, your rook gets a railgun, and your friend has some explaining to do.</p>
        <div className={styles.actions}>
          <a className={styles.play} href="https://chaos.firechess.com">Play in browser <span aria-hidden="true">↗</span></a>
          <a className={styles.discord} href="https://discord.com/activities/1546003954616500245">Play on Discord <span aria-hidden="true">↗</span></a>
        </div>
        <p className={styles.note}>Free to play · No download · Solo or with friends</p>
      </div>
      <div className={styles.cover}><img src="/chaos-brand/cover.webp" alt="The playful world of Chaos Chess" fetchPriority="high" /><span>Familiar board. Unfamiliar possibilities.</span></div>
    </section>
    <section className={styles.steps} aria-label="How to play">
      {[
        ["01", "Pick your twist", "Start with an anomaly that changes the way you play."],
        ["02", "Build your army", "Choose from power cards during the match. Your upgrades stay with you."],
        ["03", "Outsmart the chaos", "Combine abilities, spot your opponent’s tricks, and protect your king."],
      ].map(([number, title, body]) => <article key={number}><span>{number}</span><h2>{title}</h2><p>{body}</p></article>)}
    </section>
    <section className={styles.powers} aria-labelledby="powers-title">
      <p className={styles.eyebrow}>Meet your unfair advantages</p><h2 id="powers-title">Ordinary pieces.<br />Extraordinary problems.</h2>
      <div className={styles.cards}>
        {[
          ["camel", "Camel", "A knight with an extra-long jump."],
          ["amazon", "The Amazon", "A queen with knight jumps. Yes, really."],
          ["railgun", "Railgun", "Fire down the rook’s lines without moving."],
        ].map(([id, name, text]) => <article key={id}><img src={`/chaos-brand/${id}.webp`} alt={name} loading="lazy" width={320} height={320} /><div><h3>{name}</h3><p>{text}</p></div></article>)}
      </div>
    </section>
    <section className={styles.finish}><h2>Bring a friend.<br />Blame the cards.</h2><a className={styles.play} href="https://chaos.firechess.com">Let’s play <span aria-hidden="true">↗</span></a><p>Or open Chaos Chess from Discord’s Activity launcher while you hang out.</p></section>
  </div>;
}
