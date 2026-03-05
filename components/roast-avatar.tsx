"use client";

import { useEffect, useState } from "react";

export type RoastMood =
  | "neutral"
  | "smug"
  | "shocked"
  | "disappointed"
  | "suspicious"
  | "mindblown"
  | "laughing"
  | "thinking";

/**
 * Pepe the Frog style avatar for roast commentary.
 * Big green face, bulging eyes, expressive mouth — maximum meme energy.
 * Changes expression based on `mood` prop and bounces on mood change.
 */
export function RoastAvatar({ mood, size = 72 }: { mood: RoastMood; size?: number }) {
  const [bounce, setBounce] = useState(false);
  const [prev, setPrev] = useState(mood);

  useEffect(() => {
    if (mood !== prev) {
      setBounce(true);
      setPrev(mood);
      const t = setTimeout(() => setBounce(false), 350);
      return () => clearTimeout(t);
    }
  }, [mood, prev]);

  return (
    <div
      className={`flex-shrink-0 transition-transform duration-200 ${bounce ? "scale-[1.18]" : "scale-100"}`}
      style={{ width: size, height: size }}
    >
      <svg viewBox="0 0 120 120" width={size} height={size} xmlns="http://www.w3.org/2000/svg">
        <defs>
          <radialGradient id="pepe-face" cx="50%" cy="45%" r="55%">
            <stop offset="0%" stopColor="#7BC264" />
            <stop offset="100%" stopColor="#5A9E47" />
          </radialGradient>
          <radialGradient id="pepe-dark" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#4A8A38" />
            <stop offset="100%" stopColor="#3D7530" />
          </radialGradient>
        </defs>

        {/* ── Head shape (big round green face) ── */}
        <ellipse cx="60" cy="62" rx="50" ry="46" fill="url(#pepe-face)" stroke="#3D7530" strokeWidth="1.2">
          <animateTransform attributeName="transform" type="scale" values="1 1;1.01 0.99;1 1" dur="2.5s" repeatCount="indefinite" additive="sum" />
        </ellipse>

        {/* ── Chin / jaw bulge ── */}
        <ellipse cx="60" cy="88" rx="38" ry="18" fill="#6BB855" />

        {/* ── Eye whites (big bulging frog eyes) ── */}
        <ellipse cx="40" cy="48" rx="18" ry="20" fill="white" stroke="#3D7530" strokeWidth="1" />
        <ellipse cx="80" cy="48" rx="18" ry="20" fill="white" stroke="#3D7530" strokeWidth="1" />

        {/* ── Mouth area base ── */}
        <ellipse cx="60" cy="82" rx="28" ry="12" fill="#6BB855" />

        {/* ═══ NEUTRAL — classic Pepe ═══ */}
        {mood === "neutral" && (
          <>
            {/* Pupils */}
            <circle cx="42" cy="52" r="7" fill="#2D1B07" />
            <circle cx="78" cy="52" r="7" fill="#2D1B07" />
            <circle cx="40" cy="50" r="2.5" fill="white" />
            <circle cx="76" cy="50" r="2.5" fill="white" />
            {/* Eyelids (half-droopy classic Pepe) */}
            <path d="M22 42 Q40 36 58 42" fill="#5A9E47" />
            <path d="M62 42 Q80 36 98 42" fill="#5A9E47" />
            {/* Mouth — flat frog line with slight downturn */}
            <path d="M34 82 Q46 86 60 84 Q74 86 86 82" fill="none" stroke="#3D7530" strokeWidth="2.5" strokeLinecap="round" />
          </>
        )}

        {/* ═══ SMUG — Smug Pepe (small knowing smile, half-closed eyes) ═══ */}
        {mood === "smug" && (
          <>
            {/* Heavy eyelids */}
            <ellipse cx="40" cy="48" rx="18" ry="20" fill="white" stroke="#3D7530" strokeWidth="1" />
            <ellipse cx="80" cy="48" rx="18" ry="20" fill="white" stroke="#3D7530" strokeWidth="1" />
            <circle cx="42" cy="54" r="6" fill="#2D1B07" />
            <circle cx="78" cy="54" r="6" fill="#2D1B07" />
            <circle cx="40" cy="52" r="2" fill="white" />
            <circle cx="76" cy="52" r="2" fill="white" />
            {/* More closed eyelids */}
            <path d="M22 38 Q40 28 58 38 L58 50 Q40 42 22 50Z" fill="#5A9E47" />
            <path d="M62 38 Q80 28 98 38 L98 50 Q80 42 62 50Z" fill="#5A9E47" />
            {/* Smug smirk — one corner up */}
            <path d="M36 82 Q50 80 60 82 Q72 88 88 80" fill="none" stroke="#3D7530" strokeWidth="2.5" strokeLinecap="round" />
          </>
        )}

        {/* ═══ SHOCKED — MonkaS wide eyes ═══ */}
        {mood === "shocked" && (
          <>
            {/* Wide open eyes — no eyelids */}
            <circle cx="42" cy="50" r="9" fill="#2D1B07" />
            <circle cx="78" cy="50" r="9" fill="#2D1B07" />
            <circle cx="40" cy="47" r="3" fill="white" />
            <circle cx="76" cy="47" r="3" fill="white" />
            <circle cx="44" cy="53" r="1.5" fill="white" opacity="0.5" />
            <circle cx="80" cy="53" r="1.5" fill="white" opacity="0.5" />
            {/* Open mouth — shocked O */}
            <ellipse cx="60" cy="84" rx="12" ry="8" fill="#2D1B07" />
            <ellipse cx="60" cy="83" rx="8" ry="5" fill="#8B2020" />
            {/* Sweat drop */}
            <path d="M100 38 Q102 30 104 38 Q102 44 100 38Z" fill="#87CEEB" opacity="0.8" />
          </>
        )}

        {/* ═══ DISAPPOINTED — Sad Pepe (feels bad man) ═══ */}
        {mood === "disappointed" && (
          <>
            {/* Sad droopy eyes */}
            <circle cx="42" cy="54" r="6" fill="#2D1B07" />
            <circle cx="78" cy="54" r="6" fill="#2D1B07" />
            <circle cx="40" cy="52" r="2" fill="white" />
            <circle cx="76" cy="52" r="2" fill="white" />
            {/* Very heavy sad eyelids */}
            <path d="M22 36 Q40 44 58 36 L58 52 Q40 46 22 52Z" fill="#5A9E47" />
            <path d="M62 36 Q80 44 98 36 L98 52 Q80 46 62 52Z" fill="#5A9E47" />
            {/* Sad frown */}
            <path d="M38 86 Q48 78 60 80 Q72 78 82 86" fill="none" stroke="#3D7530" strokeWidth="2.5" strokeLinecap="round" />
            {/* Tear */}
            <path d="M28 60 Q26 68 28 72 Q30 68 28 60Z" fill="#87CEEB" opacity="0.7" />
          </>
        )}

        {/* ═══ SUSPICIOUS — one eye squinted ═══ */}
        {mood === "suspicious" && (
          <>
            {/* Left eye squinted */}
            <path d="M24 50 Q40 44 56 50" fill="none" stroke="#2D1B07" strokeWidth="3" strokeLinecap="round" />
            {/* Right eye open, looking sideways */}
            <circle cx="80" cy="52" r="8" fill="#2D1B07" />
            <circle cx="83" cy="50" r="2.5" fill="white" />
            {/* Raised right eyebrow */}
            <path d="M64 32 Q80 26 96 34" fill="none" stroke="#3D7530" strokeWidth="3" strokeLinecap="round" />
            {/* Heavy left eyelid */}
            <path d="M22 36 Q40 30 58 36 L58 48 Q40 42 22 48Z" fill="#5A9E47" />
            {/* Pursed skeptical mouth */}
            <path d="M42 82 Q52 86 62 82 Q68 80 74 82" fill="none" stroke="#3D7530" strokeWidth="2.5" strokeLinecap="round" />
          </>
        )}

        {/* ═══ MINDBLOWN — PogChamp eyes ═══ */}
        {mood === "mindblown" && (
          <>
            {/* Huge eyes with star pupils */}
            <text x="42" cy="54" fontSize="18" textAnchor="middle" dominantBaseline="central" fill="#FFD700" y="54">★</text>
            <text x="78" cy="54" fontSize="18" textAnchor="middle" dominantBaseline="central" fill="#FFD700" y="54">★</text>
            {/* Wide open mouth */}
            <ellipse cx="60" cy="84" rx="16" ry="10" fill="#2D1B07" />
            <ellipse cx="60" cy="83" rx="12" ry="6" fill="#8B2020" />
            {/* Explosion lines */}
            <line x1="14" y1="30" x2="6" y2="22" stroke="#FFD700" strokeWidth="2" strokeLinecap="round" />
            <line x1="106" y1="30" x2="114" y2="22" stroke="#FFD700" strokeWidth="2" strokeLinecap="round" />
            <line x1="60" y1="10" x2="60" y2="2" stroke="#FFD700" strokeWidth="2" strokeLinecap="round" />
          </>
        )}

        {/* ═══ LAUGHING — PepeLaugh ═══ */}
        {mood === "laughing" && (
          <>
            {/* Closed happy eyes */}
            <path d="M26 50 Q40 40 54 50" fill="none" stroke="#2D1B07" strokeWidth="3" strokeLinecap="round" />
            <path d="M66 50 Q80 40 94 50" fill="none" stroke="#2D1B07" strokeWidth="3" strokeLinecap="round" />
            {/* Heavy eyelids */}
            <path d="M22 36 Q40 30 58 36 L58 46 Q40 38 22 46Z" fill="#5A9E47" />
            <path d="M62 36 Q80 30 98 36 L98 46 Q80 38 62 46Z" fill="#5A9E47" />
            {/* Wide open laughing mouth */}
            <path d="M32 80 Q60 102 88 80" fill="#2D1B07" />
            <path d="M36 81 Q60 96 84 81" fill="#8B2020" />
            {/* Teeth */}
            <rect x="48" y="80" width="24" height="4" rx="1" fill="white" />
            {/* Laugh tears */}
            <path d="M22 56 Q20 64 22 68" fill="none" stroke="#87CEEB" strokeWidth="2" strokeLinecap="round" opacity="0.7" />
            <path d="M98 56 Q100 64 98 68" fill="none" stroke="#87CEEB" strokeWidth="2" strokeLinecap="round" opacity="0.7" />
          </>
        )}

        {/* ═══ THINKING — PepeThink (hand on chin) ═══ */}
        {mood === "thinking" && (
          <>
            {/* Eyes looking up-right */}
            <circle cx="44" cy="48" r="7" fill="#2D1B07" />
            <circle cx="80" cy="48" r="7" fill="#2D1B07" />
            <circle cx="46" cy="44" r="2.5" fill="white" />
            <circle cx="82" cy="44" r="2.5" fill="white" />
            {/* Slight eyelids */}
            <path d="M22 38 Q40 32 58 38 L58 44 Q40 38 22 44Z" fill="#5A9E47" />
            <path d="M62 38 Q80 32 98 38 L98 44 Q80 38 62 44Z" fill="#5A9E47" />
            {/* Flat thinking mouth */}
            <path d="M42 84 Q52 82 62 84" fill="none" stroke="#3D7530" strokeWidth="2" strokeLinecap="round" />
            {/* Hand on chin */}
            <ellipse cx="72" cy="92" rx="10" ry="7" fill="#6BB855" stroke="#3D7530" strokeWidth="1" />
            <circle cx="66" cy="90" r="4" fill="#6BB855" stroke="#3D7530" strokeWidth="0.8" />
            <circle cx="78" cy="90" r="4" fill="#6BB855" stroke="#3D7530" strokeWidth="0.8" />
            {/* Thought bubbles */}
            <circle cx="100" cy="26" r="3" fill="#A0D890" opacity="0.5" />
            <circle cx="106" cy="18" r="4" fill="#A0D890" opacity="0.4" />
            <circle cx="113" cy="10" r="5" fill="#A0D890" opacity="0.3" />
          </>
        )}
      </svg>
    </div>
  );
}
