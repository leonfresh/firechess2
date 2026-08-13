"use client";

import { ArrowRight } from "lucide-react";

export function Nl3FinalCta({ onScanClick }: { onScanClick: () => void }) {
  return (
    <section className="relative overflow-hidden px-4 pb-32 pt-28 text-center">
      <div className="pointer-events-none absolute -bottom-[200px] left-1/2 h-[500px] w-[900px] -translate-x-1/2 rounded-full bg-[radial-gradient(ellipse,rgba(255,90,31,0.12),transparent_65%)]" />
      <h2 className="relative mb-5 text-[40px] font-extrabold leading-[1.04] tracking-[-0.035em] text-white sm:text-6xl">
        Your next 100 games
        <br />
        shouldn&apos;t repeat your{" "}
        <span className="font-serif italic text-[#ff5a1f]">last 100.</span>
      </h2>
      <p className="relative mb-9 text-[17px] text-[#8d8696]">
        Free scan. 300 games. Two minutes. No credit card.
      </p>
      <button
        onClick={onScanClick}
        className="nl3-cta relative inline-flex h-[60px] items-center gap-2.5 rounded-[13px] bg-[#ff5a1f] px-10 text-[17px] font-semibold text-white shadow-[0_0_40px_rgba(255,90,31,0.3),inset_0_1px_0_rgba(255,255,255,0.15)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_0_55px_rgba(255,90,31,0.45)]"
      >
        Scan my games — free
        <ArrowRight className="h-4 w-4" />
      </button>
    </section>
  );
}
