"use client";
import {useEffect, useState, type ReactNode} from "react";
import {ChaosNavLink} from "@/components/chaos-nav-link";
import {connectDiscord} from "./activity-connection";

export function HubPage({active, children}: {active:'shop'|'watch';children:ReactNode}) {
  const [ready,setReady]=useState(false),[error,setError]=useState(false);
  useEffect(()=>{
    let alive=true;
    if (!new URLSearchParams(window.location.search).has('frame_id')) {setReady(true);return;}
    const timeout=setTimeout(()=>{if(alive)setError(true);},90000);
    connectDiscord().then(()=>{if(alive){clearTimeout(timeout);setError(false);setReady(true);}}).catch(()=>{if(alive)setError(true);});
    return()=>{alive=false;clearTimeout(timeout);};
  },[]);
  return <div className="hub-page">
    <header className="hub-nav">
      <ChaosNavLink href="/" className="hub-brand"><img src="/activity/logo.svg" width="32" height="32" alt=""/><strong>CHAOS<span>CHESS</span></strong></ChaosNavLink>
      <nav aria-label="Chaos Chess"><ChaosNavLink href="/">Play</ChaosNavLink><ChaosNavLink href="/watch" aria-current={active==='watch'?'page':undefined}>Watch</ChaosNavLink><ChaosNavLink href="/shop" aria-current={active==='shop'?'page':undefined}>Shop</ChaosNavLink></nav>
    </header>
    <main>{ready ? children : <div className="hub-loading" role="status">{error ? <>Couldn’t connect to Discord. <button onClick={()=>window.location.reload()}>Retry</button></> : 'Opening the arena…'}</div>}</main>
  </div>;
}
