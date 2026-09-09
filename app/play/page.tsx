import Link from "next/link";
import { ArrowRight, Castle, Crosshair, Flame, Swords, Trophy, Zap } from "lucide-react";
import type { Metadata } from "next";
import s from "@/components/modern-preview/modern.module.css";

export const metadata: Metadata = { title: "Play", description: "Find your next chess challenge: Guess the Move, Puzzle Dungeon, Chaos Chess and more." };
const games = [
  { title: "Guess the Move", href: "/guess", icon: Crosshair, tag: "Think like a grandmaster", text: "Step through famous games and choose the move before it is revealed." },
  { title: "Puzzle Dungeon", href: "/dungeon", icon: Castle, tag: "A tactical adventure", text: "Take your puzzle skills into the dungeon and see how far you can go." },
  { title: "Chaos Chess", href: "/chaos", icon: Zap, tag: "Expect the unexpected", text: "Explore a chess variant with unusual pieces and game-changing surprises." },
  { title: "Roast the Elo", href: "/roast", icon: Flame, tag: "Make your call", text: "Watch the game, read the mistakes and put your rating intuition to the test." },
  { title: "Sparring", href: "/sparring", icon: Swords, tag: "Find your opponent", text: "Put your ideas into practice on the board in a sparring session." },
  { title: "Daily Challenge", href: "/daily", icon: Trophy, tag: "A reason to come back", text: "Drop in for today's chess challenge and keep your practice moving." },
];

export default function PlayPage() {
  return <div className={s.root}><div className={s.dashboardContainer}>
    <header className={s.dashboardHeading}><div><span className={s.eyebrow}>MORE WAYS TO ENJOY CHESS</span><h1>Same board.<br />A whole different game.</h1><p>Follow your curiosity. Pick a challenge and make your next move.</p></div><Link className={s.secondaryButton} href="/leaderboard">Leaderboard <Trophy size={16} /></Link></header>
    <section className={`${s.trainingHero} ${s.playHero}`}><div><span className={s.eyebrow}>YOUR NEXT CHALLENGE</span><h2>Would you find<br />the grandmaster's move?</h2><p>Read the position, commit to your idea, then see how the game unfolded.</p><Link href="/guess" className={s.primaryButton}>Play Guess the Move <ArrowRight size={17} /></Link></div><div className={s.playArtwork} aria-hidden="true"><span>♜</span><span>♞</span><span>♝</span><span>♛</span></div></section>
    <div className={s.reportSectionTitle}><div><span className={s.eyebrow}>FIND YOUR KIND OF CHESS</span><h2>Choose a game.</h2></div></div>
    <div className={s.trainingGrid}>{games.map(game => <article key={game.href}><div className={s.trainingCardTop}><span className={s.featureIcon}><game.icon size={24} /></span><span>{game.tag}</span></div><h3>{game.title}</h3><p>{game.text}</p><Link href={game.href} className={s.textLink}>Explore {game.title} <ArrowRight size={16} /></Link></article>)}</div>
    <div className={s.accessNote}><Swords size={20}/><p>Want to work on something specific? Train with puzzles, openings and positions from your own games.</p><Link href="/newtraining">Go to training →</Link></div>
  </div></div>;
}
