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
 * Doro-style blob mascot with expressive face for roast commentary.
 * Cute round white body, pink hair with bun, big eyes, cat mouth — meme energy.
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
          <radialGradient id="dbody" cx="45%" cy="40%" r="55%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="100%" stopColor="#F0EAE0" />
          </radialGradient>
          <radialGradient id="dblush" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#FFB7C5" />
            <stop offset="100%" stopColor="#FFB7C5" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* ── Stubby legs ── */}
        <ellipse cx="34" cy="108" rx="10" ry="7" fill="#F0EAE0" />
        <ellipse cx="86" cy="108" rx="10" ry="7" fill="#F0EAE0" />
        <ellipse cx="34" cy="108" rx="8" ry="5" fill="white" />
        <ellipse cx="86" cy="108" rx="8" ry="5" fill="white" />

        {/* ── Body (round blob) ── */}
        <ellipse cx="60" cy="78" rx="42" ry="36" fill="url(#dbody)" stroke="#E0D8CC" strokeWidth="0.8">
          <animateTransform attributeName="transform" type="scale" values="1 1;1.01 0.99;1 1" dur="2.5s" repeatCount="indefinite" additive="sum" />
        </ellipse>

        {/* ── Pink hair (back layer) ── */}
        <ellipse cx="60" cy="48" rx="36" ry="30" fill="#F5A0B8" />

        {/* ── Hair bun ── */}
        <circle cx="88" cy="34" r="14" fill="#F5A0B8" />
        <circle cx="88" cy="34" r="11" fill="#F0889E" opacity="0.4" />

        {/* ── Bun ribbon ── */}
        <path d="M76 40 Q80 36,84 42 Q80 44,76 40Z" fill="#9B7DD4" />
        <path d="M84 42 Q88 38,92 44 Q88 46,84 42Z" fill="#9B7DD4" />
        <circle cx="84" cy="42" r="2" fill="#8366C0" />

        {/* ── Hair bangs (front layer over face) ── */}
        <path d="M24 52 Q28 20,44 18 Q50 16,56 18 Q62 16,68 18 Q76 20,82 36 Q86 46,88 52 L82 58 Q76 42,68 38 Q62 34,60 48 Q58 34,52 38 Q44 42,38 58 Z"
          fill="#F5A0B8" />

        {/* ── Hair shine ── */}
        <path d="M42 26 Q48 22,54 26" fill="none" stroke="#FFD1E0" strokeWidth="2" strokeLinecap="round" opacity="0.6" />

        {/* ── Face area ── */}
        {/* (face sits on the white body, framed by bangs) */}

        {/* ── Blush spots ── */}
        <ellipse cx="36" cy="76" rx="7" ry="4" fill="url(#dblush)" opacity="0.5" />
        <ellipse cx="84" cy="76" rx="7" ry="4" fill="url(#dblush)" opacity="0.5" />

        {/* ═══ NEUTRAL — big round eyes, ω cat mouth ═══ */}
        {mood === "neutral" && (
          <>
            <ellipse cx="46" cy="70" rx="6" ry="7" fill="#2D1B4E" />
            <ellipse cx="74" cy="70" rx="6" ry="7" fill="#2D1B4E" />
            <ellipse cx="46" cy="69" rx="5" ry="6" fill="#6B4FA0" />
            <ellipse cx="74" cy="69" rx="5" ry="6" fill="#6B4FA0" />
            <circle cx="44" cy="67" r="2" fill="white" />
            <circle cx="72" cy="67" r="2" fill="white" />
            <circle cx="48" cy="72" r="1" fill="white" opacity="0.5" />
            <circle cx="76" cy="72" r="1" fill="white" opacity="0.5" />
            {/* ω mouth */}
            <path d="M52 83 Q55 87,60 83 Q65 87,68 83" fill="none" stroke="#4A3728" strokeWidth="1.5" strokeLinecap="round" />
          </>
        )}

        {/* ═══ SMUG — half-closed eyes, smirk ═══ */}
        {mood === "smug" && (
          <>
            <path d="M39 70 Q46 63 53 70" fill="none" stroke="#2D1B4E" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M67 70 Q74 63 81 70" fill="none" stroke="#2D1B4E" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M50 83 Q60 92 70 83" fill="#4A3728" />
            <path d="M52 84 Q60 89 68 84" fill="white" />
            <text x="90" y="52" fontSize="8" fill="#F5A0B8">✦</text>
          </>
        )}

        {/* ═══ SHOCKED — huge round eyes, O mouth ═══ */}
        {mood === "shocked" && (
          <>
            <circle cx="46" cy="68" r="8" fill="white" stroke="#2D1B4E" strokeWidth="1.5" />
            <circle cx="74" cy="68" r="8" fill="white" stroke="#2D1B4E" strokeWidth="1.5" />
            <circle cx="47" cy="69" r="3.5" fill="#2D1B4E" />
            <circle cx="75" cy="69" r="3.5" fill="#2D1B4E" />
            <circle cx="45" cy="67" r="1.5" fill="white" />
            <circle cx="73" cy="67" r="1.5" fill="white" />
            <ellipse cx="60" cy="86" rx="5" ry="6" fill="#4A3728" />
            {/* sweat drop */}
            <path d="M88 58 Q90 52,92 58 Q90 62,88 58Z" fill="#87CEEB" opacity="0.7" />
          </>
        )}

        {/* ═══ DISAPPOINTED — droopy lines, frown ═══ */}
        {mood === "disappointed" && (
          <>
            <line x1="39" y1="66" x2="53" y2="70" stroke="#2D1B4E" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="67" y1="70" x2="81" y2="66" stroke="#2D1B4E" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M50 86 Q60 82 70 86" fill="none" stroke="#4A3728" strokeWidth="2" strokeLinecap="round" />
          </>
        )}

        {/* ═══ SUSPICIOUS — one squint, one open, raised brow ═══ */}
        {mood === "suspicious" && (
          <>
            <path d="M39 70 Q46 66 53 70" fill="none" stroke="#2D1B4E" strokeWidth="2.5" strokeLinecap="round" />
            <ellipse cx="74" cy="70" rx="6" ry="7" fill="#2D1B4E" />
            <ellipse cx="74" cy="69" rx="5" ry="6" fill="#6B4FA0" />
            <circle cx="72" cy="67" r="2" fill="white" />
            <path d="M67 58 Q74 54 81 58" fill="none" stroke="#2D1B4E" strokeWidth="2" strokeLinecap="round" />
            <path d="M52 84 Q60 87 68 82" fill="none" stroke="#4A3728" strokeWidth="1.8" strokeLinecap="round" />
          </>
        )}

        {/* ═══ MINDBLOWN — star eyes, open mouth ═══ */}
        {mood === "mindblown" && (
          <>
            <text x="46" y="74" fontSize="16" textAnchor="middle" fill="#F5A0B8">★</text>
            <text x="74" y="74" fontSize="16" textAnchor="middle" fill="#F5A0B8">★</text>
            <ellipse cx="60" cy="87" rx="6" ry="7" fill="#4A3728" />
            <ellipse cx="60" cy="86" rx="4" ry="4" fill="#FF6A6A" />
            {/* sparkle rays */}
            <line x1="22" y1="50" x2="14" y2="44" stroke="#F5A0B8" strokeWidth="2" strokeLinecap="round" />
            <line x1="98" y1="50" x2="106" y2="44" stroke="#F5A0B8" strokeWidth="2" strokeLinecap="round" />
            <line x1="60" y1="16" x2="60" y2="8" stroke="#F5A0B8" strokeWidth="2" strokeLinecap="round" />
          </>
        )}

        {/* ═══ LAUGHING — closed happy eyes, wide grin, tears ═══ */}
        {mood === "laughing" && (
          <>
            <path d="M39 69 Q46 62 53 69" fill="none" stroke="#2D1B4E" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M67 69 Q74 62 81 69" fill="none" stroke="#2D1B4E" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M46 82 Q60 98 74 82" fill="#4A3728" />
            <path d="M48 83 Q60 92 72 83" fill="white" />
            {/* laugh tears */}
            <path d="M36 72 Q34 78,32 72" fill="#87CEEB" opacity="0.6" />
            <path d="M84 72 Q86 78,88 72" fill="#87CEEB" opacity="0.6" />
          </>
        )}

        {/* ═══ THINKING — dots above, looking up, wiggly mouth ═══ */}
        {mood === "thinking" && (
          <>
            <ellipse cx="46" cy="70" rx="6" ry="7" fill="#2D1B4E" />
            <ellipse cx="74" cy="70" rx="6" ry="7" fill="#2D1B4E" />
            <ellipse cx="46" cy="69" rx="5" ry="6" fill="#6B4FA0" />
            <ellipse cx="74" cy="69" rx="5" ry="6" fill="#6B4FA0" />
            {/* looking up-right */}
            <circle cx="48" cy="66" r="2.2" fill="white" />
            <circle cx="76" cy="66" r="2.2" fill="white" />
            {/* wavy mouth */}
            <path d="M52 84 Q56 86,60 84 Q64 82,68 84" fill="none" stroke="#4A3728" strokeWidth="1.5" strokeLinecap="round" />
            {/* thought bubbles */}
            <circle cx="92" cy="50" r="2.5" fill="#F5A0B8" opacity="0.5" />
            <circle cx="98" cy="42" r="3" fill="#F5A0B8" opacity="0.4" />
            <circle cx="105" cy="34" r="4" fill="#F5A0B8" opacity="0.3" />
          </>
        )}
      </svg>
    </div>
  );
}
