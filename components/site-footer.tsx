import Link from "next/link";
import { Flame, ArrowUpRight } from "lucide-react";
import { GoogleTranslate } from "@/components/google-translate";
import { navigationGroups } from "./site-navigation";
import s from "./site-footer.module.css";

const groups = [
  ...navigationGroups.slice(0, 3),
  { label: "More", links: [["Dashboard", "/newdashboard"], ["Pricing", "/newpricing"], ["Famous games", "/games"], ["Chess glossary", "/glossary"], ["Leaderboard", "/leaderboard"], ["Coin shop", "/shop"], ["Support", "/support"], ["Account & billing", "/account"]] },
];
const social = [["Discord", "https://discord.gg/YS8fc4FtEk"], ["Reddit", "https://reddit.com/r/firechess"], ["X / Twitter", "https://twitter.com/firechessapp"], ["GitHub", "https://github.com/leonfresh"]];

export function SiteFooter() {
  return <footer className={s.footer}>
    <div className={s.inner}>
      <div className={s.top}>
        <div className={s.identity}>
          <Link className={s.brand} href="/"><Flame size={25} fill="currentColor" aria-hidden="true" /><span>FireChess<span className={s.dot}>.</span></span></Link>
          <p>Understand your games.<br />Find your next good move.</p>
          <span className={s.caption}>Made for the love of the game.</span>
          <div className={s.social} aria-label="Social links">{social.map(([name,href]) => <a key={name} href={href} target="_blank" rel="noopener noreferrer">{name}<ArrowUpRight size={12} aria-hidden="true" /></a>)}</div>
        </div>
        <nav className={s.directory} aria-label="Footer navigation">{groups.map(group => <div key={group.label}><h2>{group.label}</h2><ul>{group.links.map(([label,href]) => <li key={href}><Link prefetch={false} href={href}>{label}</Link></li>)}</ul></div>)}</nav>
      </div>
      <div className={s.bottom}>
        <div><span>© {new Date().getFullYear()} FireChess</span><span>Powered by Stockfish 18</span></div>
        <nav className={s.legal} aria-label="Company and legal"><Link href="/about">About</Link><Link href="/blog">Blog</Link><Link href="/changelog">What’s new</Link><Link href="/feedback">Feedback</Link><Link href="/privacy">Privacy</Link><Link href="/terms">Terms</Link></nav>
        <GoogleTranslate />
      </div>
    </div>
  </footer>;
}
