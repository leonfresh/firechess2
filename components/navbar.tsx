"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { signOut } from "next-auth/react";
import { ChevronDown, Coins, Flame, Menu, X } from "lucide-react";
import { useSession } from "@/components/session-provider";
import { useCoinBalance } from "@/lib/use-coins";
import { navigationGroups } from "./site-navigation";
import s from "./site-navigation.module.css";

export function Navbar() {
  const pathname = usePathname();
  const { authenticated, loading, plan, isAdmin, user } = useSession();
  const balance = useCoinBalance();
  const [mobile, setMobile] = useState(false);
  const [open, setOpen] = useState<string | null>(null);
  const [unread, setUnread] = useState(0);
  const header = useRef<HTMLElement>(null);
  const trigger = useRef<HTMLButtonElement | null>(null);
  const active = (href: string) => pathname === href || pathname.startsWith(href + "/");

  useEffect(() => { setMobile(false); setOpen(null); }, [pathname]);
  useEffect(() => {
    const dismiss = (event: PointerEvent) => {
      if (!header.current?.contains(event.target as Node)) { setOpen(null); setMobile(false); }
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape") { setOpen(null); setMobile(false); const mobileButton = header.current?.querySelector<HTMLButtonElement>("[aria-controls=site-navigation]");
        if (mobileButton && getComputedStyle(mobileButton).display !== "none") mobileButton.focus();
        else trigger.current?.focus(); }
    };
    document.addEventListener("pointerdown", dismiss);
    document.addEventListener("keydown", escape);
    return () => { document.removeEventListener("pointerdown", dismiss); document.removeEventListener("keydown", escape); };
  }, []);
  useEffect(() => {
    if (!authenticated) { setUnread(0); return; }
    const controller = new AbortController();
    const check = () => {
      if (document.visibilityState === "hidden") return;
      fetch("/api/feedback/unread", { signal: controller.signal }).then(r => r.ok ? r.json() : null)
        .then(data => { if (!controller.signal.aborted && data) setUnread(Number(data.count) || 0); }).catch(() => {});
    };
    check();
    const timer = window.setInterval(check, 30000);
    window.addEventListener("focus", check);
    return () => { controller.abort(); window.clearInterval(timer); window.removeEventListener("focus", check); };
  }, [authenticated]);

  const toggle = (label: string, button: HTMLButtonElement) => {
    trigger.current = button;
    setOpen(current => current === label ? null : label);
  };
  return <header ref={header} className={s.header} onBlur={event => {
    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setOpen(null);
  }}>
    <div className={s.inner}>
      <Link href="/" className={s.brand}><Flame size={24} fill="currentColor" /> <span>FireChess<span className={s.dot}>.</span></span></Link>
      <button className={s.mobileToggle} aria-label={mobile ? "Close navigation" : "Open navigation"} aria-expanded={mobile} aria-controls="site-navigation" onClick={event => { trigger.current = event.currentTarget; setMobile(!mobile); setOpen(null); }}>{mobile ? <X /> : <Menu />}</button>
      <nav id="site-navigation" className={`${s.nav} ${mobile ? s.mobileOpen : ""}`} aria-label="Main navigation" onClick={event => {
        if ((event.target as HTMLElement).closest("a")) { setOpen(null); setMobile(false); }
      }}>
        {navigationGroups.map(group => <div className={s.group} key={group.label}>
          <div className={s.groupLabel} data-active={group.links.some(([, href]) => active(href)) || undefined}>
            {group.href ? <Link href={group.href} aria-current={active(group.href) ? "page" : undefined}>{group.label}</Link> : null}
            <button aria-label={group.href ? `${group.label} menu` : "More"} aria-expanded={open === group.label} aria-controls={`nav-${group.label}`} onClick={event => toggle(group.label, event.currentTarget)}>{!group.href && "More"}<ChevronDown size={14} /></button>
          </div>
          {open === group.label && <div id={`nav-${group.label}`} className={`${s.dropdown} ${group.label === "More" ? s.wide : ""}`}>
            <span className={s.menuCaption}>{group.label === "More" ? "Learn, explore & connect" : `Explore ${group.label.toLowerCase()}`}</span>
            <div className={s.links}>{group.links.map(([label, href]) => <Link key={href} prefetch={false} href={href} aria-current={active(href) ? "page" : undefined}>{label}</Link>)}</div>
          </div>}
        </div>)}
        <Link className={s.direct} href="/newdashboard" aria-current={active("/newdashboard") || active("/dashboard") ? "page" : undefined}>Dashboard</Link>
        {(!authenticated || plan === "free") && <Link className={s.direct} href="/newpricing" aria-current={active("/newpricing") ? "page" : undefined}>{authenticated ? "Upgrade" : "Pricing"}</Link>}
        <div className={`${s.group} ${s.account}`}>
          {authenticated ? <>
            <button className={s.accountButton} aria-expanded={open === "account"} aria-controls="nav-account" onClick={event => toggle("account", event.currentTarget)}><span className={s.avatar}>{(user?.name || "U").slice(0, 1).toUpperCase()}</span>Account{unread > 0 && <span className={s.badge}>{Math.min(unread, 99)}</span>}<ChevronDown size={14} /></button>
            {open === "account" && <div id="nav-account" className={`${s.dropdown} ${s.accountDropdown}`}>
              <span className={s.menuCaption}>{plan === "free" ? "Free plan" : plan === "lifetime" ? "Lifetime member" : "Pro member"}</span>
              <div className={s.links}>
                <Link href="/profile">My profile</Link><Link href="/account">Account & billing</Link><Link href="/dashboard">Saved reports & management</Link>
                <Link href="/shop"><Coins size={15} /> {balance.toLocaleString()} coins · Shop</Link>
                <Link href={isAdmin ? "/admin/feedback" : "/support"}>Support {unread > 0 ? `(${unread} unread)` : ""}</Link>
                {isAdmin && <><Link href="/admin/users">Manage users</Link><Link href="/admin/affiliates">Affiliates</Link><Link href="/admin/gift">Gift access</Link></>}
                <button onClick={() => void signOut({ callbackUrl: "/" })}>Sign out</button>
              </div>
            </div>}
          </> : <Link className={s.signIn} href="/auth/signin">{loading ? "Account" : "Sign in"}</Link>}
        </div>
      </nav>
    </div>
  </header>;
}
