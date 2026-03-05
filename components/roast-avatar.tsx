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
  | "thinking"
  | "clown"
  | "crylaugh"
  | "rage";

/**
 * Pepe the Frog avatar — faithful to the Twitch emote style.
 * Bug eyes sitting ON TOP of the head, thick red-brown frog lips,
 * blue hoodie collar, classic green with darker shading.
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
      <svg viewBox="0 0 140 140" width={size} height={size} xmlns="http://www.w3.org/2000/svg">
        {/* ── Blue hoodie / shirt collar ── */}
        <path d="M24 108 Q30 96,70 94 Q110 96,116 108 L120 140 L20 140Z" fill="#3B5DC9" stroke="#2A47A0" strokeWidth="1.5" />
        <path d="M38 102 Q70 97,102 102 Q108 104,110 108 L30 108 Q32 104,38 102Z" fill="#4A6FE0" />

        {/* ── Head shape — wider at top, rounder chin, Pepe proportions ── */}
        <path d="M22 72 Q18 42,36 28 Q50 18,70 18 Q90 18,104 28 Q122 42,118 72 Q116 88,104 96 Q88 104,70 104 Q52 104,36 96 Q24 88,22 72Z"
          fill="#6B9E3C" stroke="#4A7A2A" strokeWidth="2">
          <animateTransform attributeName="transform" type="scale" values="1 1;1.005 0.995;1 1" dur="3s" repeatCount="indefinite" additive="sum" />
        </path>

        {/* ── Lighter face area (front of face) ── */}
        <ellipse cx="70" cy="72" rx="40" ry="28" fill="#7DB84A" />

        {/* ── Eye whites — BIG, protruding ABOVE the head like a frog ── */}
        <ellipse cx="50" cy="42" rx="20" ry="22" fill="white" stroke="#4A7A2A" strokeWidth="2" />
        <ellipse cx="90" cy="42" rx="20" ry="22" fill="white" stroke="#4A7A2A" strokeWidth="2" />

        {/* ── Thick frog lips (the iconic red-brown wide mouth) ── */}
        <path d="M30 82 Q50 78,70 80 Q90 78,110 82 Q112 86,110 90 Q90 96,70 94 Q50 96,30 90 Q28 86,30 82Z"
          fill="#C45C3A" stroke="#8B3D22" strokeWidth="1.5" />
        {/* Lip highlight */}
        <path d="M36 84 Q70 80,104 84 Q106 86,104 88 Q70 84,36 88 Q34 86,36 84Z" fill="#D47A5A" opacity="0.5" />

        {/* ═══ NEUTRAL — Classic Pepe ═══ */}
        {mood === "neutral" && (
          <>
            {/* Pupils — large, looking slightly left */}
            <circle cx="48" cy="48" r="10" fill="#1A1A1A" />
            <circle cx="88" cy="48" r="10" fill="#1A1A1A" />
            <circle cx="45" cy="44" r="3.5" fill="white" />
            <circle cx="85" cy="44" r="3.5" fill="white" />
            {/* Droopy eyelids — half-closed classic Pepe */}
            <path d="M30 32 Q50 22,70 36 L70 42 Q50 32,30 42Z" fill="#5A8E32" />
            <path d="M70 36 Q90 22,110 32 L110 42 Q90 32,70 42Z" fill="#5A8E32" />
            {/* Mouth line — subtle downturn inside lips */}
            <path d="M38 86 Q54 89,70 87 Q86 89,102 86" fill="none" stroke="#8B3D22" strokeWidth="1.5" strokeLinecap="round" />
          </>
        )}

        {/* ═══ SMUG — Smug Pepe ═══ */}
        {mood === "smug" && (
          <>
            {/* Pupils low and small — smug look */}
            <circle cx="50" cy="52" r="8" fill="#1A1A1A" />
            <circle cx="90" cy="52" r="8" fill="#1A1A1A" />
            <circle cx="48" cy="49" r="2.5" fill="white" />
            <circle cx="88" cy="49" r="2.5" fill="white" />
            {/* Very heavy eyelids — nearly closed */}
            <path d="M30 28 Q50 18,70 32 L70 50 Q50 38,30 50Z" fill="#5A8E32" />
            <path d="M70 32 Q90 18,110 28 L110 50 Q90 38,70 50Z" fill="#5A8E32" />
            {/* Smirk — right corner up */}
            <path d="M38 86 Q54 88,70 86 Q86 84,106 78" fill="none" stroke="#8B3D22" strokeWidth="2" strokeLinecap="round" />
          </>
        )}

        {/* ═══ SHOCKED — MonkaS ═══ */}
        {mood === "shocked" && (
          <>
            {/* Huge pupils — wide eyes, no eyelids */}
            <circle cx="50" cy="46" r="12" fill="#1A1A1A" />
            <circle cx="90" cy="46" r="12" fill="#1A1A1A" />
            <circle cx="46" cy="42" r="4" fill="white" />
            <circle cx="86" cy="42" r="4" fill="white" />
            <circle cx="52" cy="50" r="2" fill="white" opacity="0.4" />
            <circle cx="92" cy="50" r="2" fill="white" opacity="0.4" />
            {/* Open mouth inside lips */}
            <ellipse cx="70" cy="87" rx="14" ry="6" fill="#1A1A1A" />
            <ellipse cx="70" cy="86" rx="10" ry="4" fill="#6B1A1A" />
            {/* Sweat drops */}
            <path d="M118 50 Q120 42,122 50 Q120 56,118 50Z" fill="#87CEEB" opacity="0.8" />
            <path d="M114 62 Q115 58,116 62 Q115 65,114 62Z" fill="#87CEEB" opacity="0.6" />
          </>
        )}

        {/* ═══ DISAPPOINTED — FeelsBadMan / Sad Pepe ═══ */}
        {mood === "disappointed" && (
          <>
            {/* Small sad pupils looking down */}
            <circle cx="50" cy="52" r="8" fill="#1A1A1A" />
            <circle cx="90" cy="52" r="8" fill="#1A1A1A" />
            <circle cx="48" cy="50" r="2.5" fill="white" />
            <circle cx="88" cy="50" r="2.5" fill="white" />
            {/* Heavy droopy/sad eyelids — angled inward */}
            <path d="M30 26 Q50 38,70 26 L70 50 Q50 42,30 50Z" fill="#5A8E32" />
            <path d="M70 26 Q90 38,110 26 L110 50 Q90 42,70 50Z" fill="#5A8E32" />
            {/* Sad frown inside lips */}
            <path d="M44 90 Q56 82,70 84 Q84 82,96 90" fill="none" stroke="#8B3D22" strokeWidth="2" strokeLinecap="round" />
            {/* Tear stream */}
            <path d="M34 56 Q32 68,34 78" fill="none" stroke="#87CEEB" strokeWidth="3" strokeLinecap="round" opacity="0.6" />
            <path d="M106 56 Q108 68,106 78" fill="none" stroke="#87CEEB" strokeWidth="3" strokeLinecap="round" opacity="0.6" />
          </>
        )}

        {/* ═══ SUSPICIOUS — Pepe squint ═══ */}
        {mood === "suspicious" && (
          <>
            {/* Left eye nearly fully closed */}
            <path d="M30 28 Q50 20,70 28 L70 52 Q50 40,30 52Z" fill="#5A8E32" />
            <path d="M32 48 Q50 42,68 48" fill="none" stroke="#1A1A1A" strokeWidth="3" strokeLinecap="round" />
            {/* Right eye open, looking sideways */}
            <circle cx="92" cy="50" r="10" fill="#1A1A1A" />
            <circle cx="96" cy="47" r="3" fill="white" />
            {/* Right eyelid partially closed */}
            <path d="M70 30 Q90 22,110 30 L110 42 Q90 34,70 42Z" fill="#5A8E32" />
            {/* Raised right brow */}
            <path d="M72 20 Q90 12,112 22" fill="none" stroke="#4A7A2A" strokeWidth="3" strokeLinecap="round" />
            {/* Skeptical flat mouth */}
            <path d="M42 86 Q56 89,70 86 Q76 84,82 86" fill="none" stroke="#8B3D22" strokeWidth="2" strokeLinecap="round" />
          </>
        )}

        {/* ═══ MINDBLOWN — PogChamp face ═══ */}
        {mood === "mindblown" && (
          <>
            {/* Huge wide eyes — no eyelids */}
            <circle cx="50" cy="44" r="14" fill="#1A1A1A" />
            <circle cx="90" cy="44" r="14" fill="#1A1A1A" />
            <circle cx="46" cy="40" r="4.5" fill="white" />
            <circle cx="86" cy="40" r="4.5" fill="white" />
            {/* WIDE open mouth inside lips */}
            <ellipse cx="70" cy="87" rx="20" ry="8" fill="#1A1A1A" />
            <ellipse cx="70" cy="86" rx="16" ry="5" fill="#6B1A1A" />
            {/* Impact lines */}
            <line x1="10" y1="24" x2="2" y2="16" stroke="#FFD700" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="130" y1="24" x2="138" y2="16" stroke="#FFD700" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="70" y1="6" x2="70" y2="-2" stroke="#FFD700" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="24" y1="14" x2="18" y2="6" stroke="#FFD700" strokeWidth="2" strokeLinecap="round" />
            <line x1="116" y1="14" x2="122" y2="6" stroke="#FFD700" strokeWidth="2" strokeLinecap="round" />
          </>
        )}

        {/* ═══ LAUGHING — PepeLaugh ═══ */}
        {mood === "laughing" && (
          <>
            {/* Closed happy crescent eyes */}
            <path d="M32 46 Q50 34,68 46" fill="none" stroke="#1A1A1A" strokeWidth="3.5" strokeLinecap="round" />
            <path d="M72 46 Q90 34,108 46" fill="none" stroke="#1A1A1A" strokeWidth="3.5" strokeLinecap="round" />
            {/* Heavy eyelids pressing down */}
            <path d="M30 28 Q50 18,70 28 L70 42 Q50 32,30 42Z" fill="#5A8E32" />
            <path d="M70 28 Q90 18,110 28 L110 42 Q90 32,70 42Z" fill="#5A8E32" />
            {/* Wide laughing mouth — open with teeth visible */}
            <path d="M34 82 Q70 100,106 82 L106 90 Q70 106,34 90Z" fill="#1A1A1A" />
            <path d="M38 83 Q70 96,102 83" fill="#6B1A1A" />
            {/* Top teeth row */}
            <rect x="54" y="82" width="32" height="5" rx="2" fill="white" />
            {/* Laugh tears */}
            <path d="M28 52 Q26 62,28 70" fill="none" stroke="#87CEEB" strokeWidth="2.5" strokeLinecap="round" opacity="0.7" />
            <path d="M112 52 Q114 62,112 70" fill="none" stroke="#87CEEB" strokeWidth="2.5" strokeLinecap="round" opacity="0.7" />
          </>
        )}

        {/* ═══ THINKING — PepeThink ═══ */}
        {mood === "thinking" && (
          <>
            {/* Eyes looking up and to the right */}
            <circle cx="52" cy="44" r="9" fill="#1A1A1A" />
            <circle cx="92" cy="44" r="9" fill="#1A1A1A" />
            <circle cx="56" cy="40" r="3" fill="white" />
            <circle cx="96" cy="40" r="3" fill="white" />
            {/* Slight eyelids */}
            <path d="M30 30 Q50 22,70 30 L70 40 Q50 34,30 40Z" fill="#5A8E32" />
            <path d="M70 30 Q90 22,110 30 L110 40 Q90 34,70 40Z" fill="#5A8E32" />
            {/* Flat/pensive mouth line */}
            <path d="M44 86 Q56 84,68 86" fill="none" stroke="#8B3D22" strokeWidth="2" strokeLinecap="round" />
            {/* Hand on chin — green frog hand */}
            <ellipse cx="84" cy="96" rx="12" ry="8" fill="#6B9E3C" stroke="#4A7A2A" strokeWidth="1.5" />
            <ellipse cx="76" cy="94" rx="5" ry="5" fill="#6B9E3C" stroke="#4A7A2A" strokeWidth="1" />
            <ellipse cx="92" cy="94" rx="5" ry="5" fill="#6B9E3C" stroke="#4A7A2A" strokeWidth="1" />
            {/* Thought bubbles */}
            <circle cx="118" cy="22" r="3.5" fill="#A0D890" opacity="0.5" />
            <circle cx="126" cy="14" r="4.5" fill="#A0D890" opacity="0.4" />
            <circle cx="134" cy="6" r="5.5" fill="#A0D890" opacity="0.3" />
          </>
        )}

        {/* ═══ CLOWN — PepeClown (rainbow wig, red nose, bowtie) 🤡 honk honk ═══ */}
        {mood === "clown" && (
          <>
            {/* Rainbow afro wig — layered colored blobs */}
            <path d="M14 40 Q8 20,24 12 Q34 4,50 6" fill="#FF6B00" stroke="#E05500" strokeWidth="1" />
            <path d="M50 6 Q58 2,66 4 Q72 2,80 6" fill="#FFD700" stroke="#E6BE00" strokeWidth="1" />
            <path d="M80 6 Q92 4,100 10 Q112 18,118 34" fill="#3366FF" stroke="#2244CC" strokeWidth="1" />
            <path d="M100 10 Q108 6,114 10 Q122 16,124 30" fill="#9944CC" stroke="#7733AA" strokeWidth="1" />
            <path d="M14 40 Q6 28,16 16 Q24 6,42 4 Q56 0,70 2 Q84 0,98 4 Q116 6,124 16 Q134 28,126 40 Q128 50,120 48 Q114 36,104 28 Q90 18,70 18 Q50 18,36 28 Q26 36,22 48 Q12 50,14 40Z"
              fill="none" />
            {/* Wig fill sections with puffy shape */}
            <path d="M14 42 Q4 28,16 14 Q28 2,48 2 Q56 -2,70 0 Q84 -2,92 2 Q112 2,124 14 Q136 28,126 42 Q122 34,110 26 Q94 16,70 16 Q46 16,30 26 Q18 34,14 42Z"
              fill="#FF6B00" opacity="0.95" />
            <path d="M36 6 Q50 -2,70 0 Q90 -2,104 6 Q116 12,122 24 Q112 14,96 8 Q80 4,70 4 Q60 4,44 8 Q28 14,18 24 Q24 12,36 6Z"
              fill="#FFDD00" opacity="0.95" />
            <path d="M56 0 Q70 -4,84 0 Q98 4,108 14 Q100 6,88 4 Q76 0,70 2 Q64 0,52 4 Q40 6,32 14 Q42 4,56 0Z"
              fill="#22AA44" opacity="0.9" />
            <path d="M96 4 Q110 8,120 18 Q128 28,126 40 Q124 30,116 22 Q108 14,96 10Z"
              fill="#3366FF" opacity="0.9" />
            <path d="M108 10 Q118 14,124 24 Q130 34,126 42 Q128 30,122 22 Q116 16,108 10Z"
              fill="#9944CC" opacity="0.85" />
            {/* Cross-eyed pupils — silly/derpy look */}
            <circle cx="54" cy="48" r="10" fill="#1A1A1A" />
            <circle cx="86" cy="48" r="10" fill="#1A1A1A" />
            <circle cx="57" cy="45" r="3" fill="white" />
            <circle cx="83" cy="45" r="3" fill="white" />
            {/* Wide, innocent-looking eyes (less eyelid than normal) */}
            <path d="M30 32 Q50 26,70 36 L70 40 Q50 32,30 40Z" fill="#5A8E32" />
            <path d="M70 36 Q90 26,110 32 L110 40 Q90 32,70 40Z" fill="#5A8E32" />
            {/* Big red clown nose — 3D shading */}
            <circle cx="70" cy="68" r="11" fill="#E74C3C" stroke="#C0392B" strokeWidth="1.5" />
            <circle cx="66" cy="64" r="4" fill="#F5B7B1" opacity="0.5" />
            <circle cx="68" cy="62" r="2" fill="white" opacity="0.3" />
            {/* Slight smile (content, not goofy) */}
            <path d="M40 86 Q54 92,70 90 Q86 92,100 86" fill="none" stroke="#8B3D22" strokeWidth="2" strokeLinecap="round" />
            {/* Rosy cheeks */}
            <circle cx="34" cy="74" r="8" fill="#FF6B6B" opacity="0.25" />
            <circle cx="106" cy="74" r="8" fill="#FF6B6B" opacity="0.25" />
            {/* Polka-dot bowtie */}
            <path d="M50 108 L70 104 L70 112 Z" fill="#87CEEB" stroke="#5EAAD4" strokeWidth="1" />
            <path d="M90 108 L70 104 L70 112 Z" fill="#87CEEB" stroke="#5EAAD4" strokeWidth="1" />
            <circle cx="70" cy="108" r="3.5" fill="#5EAAD4" stroke="#4890B8" strokeWidth="1" />
            {/* Bowtie polka dots */}
            <circle cx="56" cy="108" r="1.5" fill="white" opacity="0.7" />
            <circle cx="62" cy="106" r="1" fill="white" opacity="0.6" />
            <circle cx="60" cy="110" r="1.2" fill="white" opacity="0.6" />
            <circle cx="80" cy="108" r="1.5" fill="white" opacity="0.7" />
            <circle cx="78" cy="106" r="1" fill="white" opacity="0.6" />
            <circle cx="82" cy="110" r="1.2" fill="white" opacity="0.6" />
          </>
        )}

        {/* ═══ CRYLAUGH — Tears of joy Pepe ═══ */}
        {mood === "crylaugh" && (
          <>
            {/* Squinting happy eyes */}
            <path d="M34 44 Q50 32,66 44" fill="none" stroke="#1A1A1A" strokeWidth="4" strokeLinecap="round" />
            <path d="M74 44 Q90 32,106 44" fill="none" stroke="#1A1A1A" strokeWidth="4" strokeLinecap="round" />
            {/* Heavy eyelids */}
            <path d="M30 26 Q50 16,70 26 L70 40 Q50 30,30 40Z" fill="#5A8E32" />
            <path d="M70 26 Q90 16,110 26 L110 40 Q90 30,70 40Z" fill="#5A8E32" />
            {/* Wide open laughing mouth */}
            <path d="M34 82 Q70 104,106 82 L106 92 Q70 110,34 92Z" fill="#1A1A1A" />
            <path d="M40 84 Q70 100,100 84" fill="#6B1A1A" />
            <rect x="54" y="82" width="32" height="5" rx="2" fill="white" />
            {/* Lots of tears */}
            <path d="M28 48 Q24 60,26 74" fill="none" stroke="#87CEEB" strokeWidth="3.5" strokeLinecap="round" opacity="0.8" />
            <path d="M112 48 Q116 60,114 74" fill="none" stroke="#87CEEB" strokeWidth="3.5" strokeLinecap="round" opacity="0.8" />
            <path d="M34 52 Q30 64,32 76" fill="none" stroke="#87CEEB" strokeWidth="2" strokeLinecap="round" opacity="0.5" />
            <path d="M106 52 Q110 64,108 76" fill="none" stroke="#87CEEB" strokeWidth="2" strokeLinecap="round" opacity="0.5" />
            {/* Tear drops */}
            <path d="M24 76 Q26 70,28 76 Q26 80,24 76Z" fill="#87CEEB" opacity="0.7" />
            <path d="M116 76 Q114 70,112 76 Q114 80,116 76Z" fill="#87CEEB" opacity="0.7" />
          </>
        )}

        {/* ═══ RAGE — Angry red Pepe ═══ */}
        {mood === "rage" && (
          <>
            {/* Angry squinting eyes */}
            <circle cx="50" cy="50" r="9" fill="#1A1A1A" />
            <circle cx="90" cy="50" r="9" fill="#1A1A1A" />
            <circle cx="48" cy="47" r="2.5" fill="#E74C3C" />
            <circle cx="88" cy="47" r="2.5" fill="#E74C3C" />
            {/* Angry V-shaped eyelids */}
            <path d="M28 28 Q50 40,70 28 L70 48 Q50 38,28 48Z" fill="#5A8E32" />
            <path d="M70 28 Q90 40,112 28 L112 48 Q90 38,70 48Z" fill="#5A8E32" />
            {/* Angry thick brows */}
            <path d="M28 24 Q50 36,68 26" fill="none" stroke="#3A6A1A" strokeWidth="4" strokeLinecap="round" />
            <path d="M72 26 Q90 36,112 24" fill="none" stroke="#3A6A1A" strokeWidth="4" strokeLinecap="round" />
            {/* Gritted teeth */}
            <path d="M38 82 Q54 78,70 80 Q86 78,102 82 Q104 86,102 90 Q86 94,70 92 Q54 94,38 90 Q36 86,38 82Z" fill="#1A1A1A" />
            <rect x="44" y="82" width="6" height="8" rx="1" fill="white" />
            <rect x="52" y="82" width="6" height="8" rx="1" fill="white" />
            <rect x="62" y="82" width="6" height="8" rx="1" fill="white" />
            <rect x="72" y="82" width="6" height="8" rx="1" fill="white" />
            <rect x="82" y="82" width="6" height="8" rx="1" fill="white" />
            <rect x="92" y="82" width="6" height="8" rx="1" fill="white" />
            {/* Red anger glow */}
            <circle cx="26" cy="34" r="12" fill="#FF0000" opacity="0.12" />
            <circle cx="114" cy="34" r="12" fill="#FF0000" opacity="0.12" />
            {/* Steam puffs */}
            <circle cx="14" cy="40" r="5" fill="white" opacity="0.4" />
            <circle cx="8" cy="34" r="4" fill="white" opacity="0.3" />
            <circle cx="126" cy="40" r="5" fill="white" opacity="0.4" />
            <circle cx="132" cy="34" r="4" fill="white" opacity="0.3" />
          </>
        )}
      </svg>
    </div>
  );
}
