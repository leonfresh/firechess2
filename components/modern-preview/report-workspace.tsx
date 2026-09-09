"use client";
import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import type { PublicScanSessionPayload } from "@/lib/scan-session";
import s from "./modern.module.css";
const ScanWorkspace=dynamic(()=>import("@/components/scan-session-page").then(m=>m.ScanSessionPage),{ssr:false,loading:()=> <p role="status">Loading report tools…</p>});
export function ReportWorkspace({id}:{id:string}) {
 const [open,setOpen]=useState(false);const [scan,setScan]=useState<PublicScanSessionPayload|null>(null);const [error,setError]=useState("");const [retry,setRetry]=useState(0);
 useEffect(()=>{if(!open)return;const controller=new AbortController();setError("");fetch(`/api/scans/${id}`,{signal:controller.signal}).then(async response=>{if(!response.ok)throw new Error(response.status===404?"This scan is unavailable or its guest link has expired.":"Could not load report tools.");const data=await response.json();if(!controller.signal.aborted)setScan(data.scan);}).catch(e=>{if(!controller.signal.aborted)setError(e.message);});return()=>controller.abort();},[open,id,retry]);
 return <section className={`${s.summaryCard} ${s.reportActionCard}`} id="report-workspace"><span className={s.eyebrow}>YOUR COMPLETE REPORT WORKSPACE</span><h2>Save, share and go deeper.</h2><p>Open the guided walkthrough, regenerate your scan, save it to your account, build lessons, add opening moves to your repertoire or download highlight cards.</p><button className={s.secondaryButton} aria-expanded={open} onClick={()=>setOpen(v=>!v)}>{open?"Close report workspace":"Open report workspace"}</button>{open&&<div className={s.legacyDetails}>{error?<div role="alert"><p>{error}</p><button onClick={()=>setRetry(v=>v+1)}>Retry</button></div>:scan?<ScanWorkspace initialScan={scan} legacy/>:<p role="status">Loading report…</p>}</div>}</section>;
}
