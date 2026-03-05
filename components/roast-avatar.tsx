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
 * Animated flame character with expressive face for roast commentary.
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

  const h = Math.round(size * 1.2);

  return (
    <div
      className={`flex-shrink-0 transition-transform duration-200 ${bounce ? "scale-[1.18]" : "scale-100"}`}
      style={{ width: size, height: h }}
    >
      <svg viewBox="0 0 100 120" width={size} height={h} xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="rflame" x1="50" y1="0" x2="50" y2="95" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FFD700" />
            <stop offset="45%" stopColor="#FF8C00" />
            <stop offset="100%" stopColor="#FF4500" />
          </linearGradient>
          <radialGradient id="rface" cx="50%" cy="35%" r="50%">
            <stop offset="0%" stopColor="#FFF0DB" />
            <stop offset="100%" stopColor="#FFD9A0" />
          </radialGradient>
        </defs>

        {/* Outer glow */}
        <circle cx="50" cy="65" r="50" fill="#FF6A00" opacity="0.06" />

        {/* Flame body */}
        <path
          d="M50 8 C56 20,78 28,80 48 C82 62,70 58,72 68 C74 78,82 82,78 92 L22 92 C18 82,26 78,28 68 C30 58,18 62,20 48 C22 28,44 20,50 8Z"
          fill="url(#rflame)"
        >
          <animateTransform attributeName="transform" type="scale" values="1 1;0.97 1.03;1 1" dur="2s" repeatCount="indefinite" additive="sum" />
        </path>

        {/* Inner flame highlight */}
        <path
          d="M50 20 C54 28,68 34,69 48 C70 55,64 52,65 58 L35 58 C36 52,30 55,31 48 C32 34,46 28,50 20Z"
          fill="#FFD700"
          opacity="0.4"
        />

        {/* Face */}
        <circle cx="50" cy="72" r="23" fill="url(#rface)" stroke="#E8A855" strokeWidth="1" />

        {/* ═══ NEUTRAL ═══ */}
        {mood === "neutral" && (
          <>
            <circle cx="41" cy="69" r="2.5" fill="#4A3728" />
            <circle cx="59" cy="69" r="2.5" fill="#4A3728" />
            <circle cx="42" cy="68" r="0.8" fill="white" />
            <circle cx="60" cy="68" r="0.8" fill="white" />
            <path d="M43 79 Q50 84 57 79" fill="none" stroke="#4A3728" strokeWidth="1.8" strokeLinecap="round" />
          </>
        )}

        {/* ═══ SMUG ═══ */}
        {mood === "smug" && (
          <>
            <path d="M36 69 Q41 64 46 69" fill="none" stroke="#4A3728" strokeWidth="2" strokeLinecap="round" />
            <path d="M54 69 Q59 64 64 69" fill="none" stroke="#4A3728" strokeWidth="2" strokeLinecap="round" />
            <path d="M38 78 Q50 90 62 78" fill="#4A3728" />
            <path d="M40 79 Q50 86 60 79" fill="#FFF0DB" />
            <text x="72" y="56" fontSize="10" fill="#FFD700">✦</text>
          </>
        )}

        {/* ═══ SHOCKED ═══ */}
        {mood === "shocked" && (
          <>
            <circle cx="41" cy="68" r="5" fill="white" stroke="#4A3728" strokeWidth="1.5" />
            <circle cx="59" cy="68" r="5" fill="white" stroke="#4A3728" strokeWidth="1.5" />
            <circle cx="42" cy="69" r="2" fill="#4A3728" />
            <circle cx="60" cy="69" r="2" fill="#4A3728" />
            <ellipse cx="50" cy="83" rx="4" ry="5" fill="#4A3728" />
            <path d="M72 60 Q74 54,76 60 Q74 64,72 60Z" fill="#87CEEB" opacity="0.8" />
          </>
        )}

        {/* ═══ DISAPPOINTED ═══ */}
        {mood === "disappointed" && (
          <>
            <line x1="37" y1="67" x2="45" y2="70" stroke="#4A3728" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="55" y1="70" x2="63" y2="67" stroke="#4A3728" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M42 81 Q50 78 58 81" fill="none" stroke="#4A3728" strokeWidth="2" strokeLinecap="round" />
          </>
        )}

        {/* ═══ SUSPICIOUS ═══ */}
        {mood === "suspicious" && (
          <>
            <line x1="36" y1="69" x2="46" y2="68" stroke="#4A3728" strokeWidth="2.5" strokeLinecap="round" />
            <circle cx="59" cy="69" r="3" fill="#4A3728" />
            <circle cx="60" cy="68" r="1" fill="white" />
            <path d="M54 60 Q59 56 64 60" fill="none" stroke="#4A3728" strokeWidth="2" strokeLinecap="round" />
            <path d="M44 80 Q52 83 58 78" fill="none" stroke="#4A3728" strokeWidth="2" strokeLinecap="round" />
          </>
        )}

        {/* ═══ MINDBLOWN ═══ */}
        {mood === "mindblown" && (
          <>
            <text x="41" y="73" fontSize="12" textAnchor="middle" fill="#FFD700">★</text>
            <text x="59" y="73" fontSize="12" textAnchor="middle" fill="#FFD700">★</text>
            <ellipse cx="50" cy="84" rx="6" ry="6" fill="#4A3728" />
            <ellipse cx="50" cy="83" rx="4" ry="3.5" fill="#FF6A6A" />
            <line x1="20" y1="52" x2="12" y2="47" stroke="#FFD700" strokeWidth="2" strokeLinecap="round" />
            <line x1="80" y1="52" x2="88" y2="47" stroke="#FFD700" strokeWidth="2" strokeLinecap="round" />
            <line x1="50" y1="40" x2="50" y2="32" stroke="#FFD700" strokeWidth="2" strokeLinecap="round" />
          </>
        )}

        {/* ═══ LAUGHING ═══ */}
        {mood === "laughing" && (
          <>
            <path d="M36 68 Q41 63 46 68" fill="none" stroke="#4A3728" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M54 68 Q59 63 64 68" fill="none" stroke="#4A3728" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M36 78 Q50 94 64 78" fill="#4A3728" />
            <path d="M38 79 Q50 88 62 79" fill="#FFF0DB" />
            <path d="M33 70 Q31 76,29 70" fill="#87CEEB" opacity="0.7" />
            <path d="M67 70 Q69 76,71 70" fill="#87CEEB" opacity="0.7" />
          </>
        )}

        {/* ═══ THINKING ═══ */}
        {mood === "thinking" && (
          <>
            <circle cx="43" cy="69" r="2.5" fill="#4A3728" />
            <circle cx="62" cy="69" r="2.5" fill="#4A3728" />
            <circle cx="44" cy="68" r="0.8" fill="white" />
            <circle cx="63" cy="68" r="0.8" fill="white" />
            <path d="M43 80 Q47 82,50 80 Q53 78,57 80" fill="none" stroke="#4A3728" strokeWidth="1.5" strokeLinecap="round" />
            <circle cx="74" cy="54" r="2" fill="#FFD700" opacity="0.6" />
            <circle cx="80" cy="48" r="2.5" fill="#FFD700" opacity="0.5" />
            <circle cx="87" cy="42" r="3" fill="#FFD700" opacity="0.4" />
          </>
        )}
      </svg>
    </div>
  );
}
