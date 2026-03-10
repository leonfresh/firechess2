"use client";

/**
 * /chaos — Chaos Chess
 *
 * Play chess against Stockfish AI or another player. At turn milestones
 * (5, 10, 15, 20, 25) the game freezes and you draft a permanent
 * modifier that changes how your pieces behave. Modifiers actually work —
 * the custom move engine generates extra legal moves beyond standard chess.
 *
 * Supports: vs AI, vs Friend (room code invite), and random matchmaking.
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Chess, type Color, type PieceSymbol } from "chess.js";
import { Chessboard, type CbSquare } from "@/components/chessboard-compat";
import { stockfishPool } from "@/lib/stockfish-client";
import { ChaosLobby } from "@/components/chaos-lobby";
import { useSession } from "@/components/session-provider";
import { getGuestId } from "@/lib/guest-id";
// useBoardSize removed — we use onBoardWidthChange from react-chessboard
import { useBoardTheme, useShowCoordinates, useCustomPieces, usePieceTheme } from "@/lib/use-coins";
import { playSound, preloadSounds } from "@/lib/sounds";
import { getPieceImageUrl } from "@/lib/board-themes";
// Note: useBoardSize removed — we use onBoardWidthChange from react-chessboard for auto-responsive sizing
import {
  createChaosState,
  checkDraftTrigger,
  rollDraftChoices,
  applyDraft,
  getAiDraftMessage,
  getPhaseLabel,
  updateTrackedPieces,
  initTrackedPiece,
  TIER_COLORS,
  TIER_LABELS,
  type ChaosState,
  type ChaosModifier,
  type ModifierTier,
} from "@/lib/chaos-chess";
import {
  getChaosMoves,
  executeChaosMove,
  applyPostMoveEffects,
  applyDraftEffect,
  computeChaosThreatPenalty,
  getChaosAttackedSquares,
  applyKingShield,
  type ChaosMove,
} from "@/lib/chaos-moves";
import { usePartyRoom, PARTYKIT_HOST, type PartyMessage } from "@/lib/use-party-room";

/* ────────────────────────── Chaos Piece Overlays ────────────────────────── */

/**
 * SVG overlay definitions keyed by modifier id.
 * Each returns SVG elements drawn at various positions around the piece.
 * Overlays that use `icon` are positioned dynamically in corners to avoid stacking.
 * Overlays with custom `render` draw centred effects (wings, crosshairs, crowns).
 */
type Corner = "top-left" | "top-right" | "bottom-left" | "bottom-right";
const CORNER_STYLES: Record<Corner, React.CSSProperties> = {
  "top-left": { position: "absolute", top: "0%", left: "0%" },
  "top-right": { position: "absolute", top: "0%", right: "0%" },
  "bottom-left": { position: "absolute", bottom: "2%", left: "0%" },
  "bottom-right": { position: "absolute", bottom: "2%", right: "0%" },
};
const CORNER_ORDER: Corner[] = ["top-right", "top-left", "bottom-right", "bottom-left"];

type OverlayDef = {
  /** Simple emoji badge — will be auto-positioned into a corner */
  icon?: string;
  /** Color for the icon's drop-shadow glow */
  iconGlow?: string;
  /** Custom render for complex shapes (centred, not corner-slotted) */
  render?: (sw: number) => React.ReactElement;
  /** CSS filter to apply on the base piece */
  filter?: string;
  /** Pulsing glow color */
  glow?: string;
};

const MODIFIER_OVERLAYS: Record<string, OverlayDef> = {
  pegasus: {
    glow: "rgba(168,85,247,0.4)",
    render: (sw) => {
      const s = sw * 0.35;
      return (
        <svg viewBox="0 0 24 24" width={s} height={s} style={{ position: "absolute", top: "2%", right: "2%", opacity: 0.9, filter: "drop-shadow(0 0 2px rgba(168,85,247,0.8))" }}>
          <path d="M4 12 C4 6, 12 2, 20 6 L16 10 C14 8, 10 8, 8 12 Z" fill="rgba(168,85,247,0.85)" stroke="rgba(216,180,254,0.9)" strokeWidth="0.5" />
          <path d="M6 14 C6 9, 12 5, 18 8 L15 11 C13 9.5, 10 10, 9 13 Z" fill="rgba(192,132,252,0.5)" />
        </svg>
      );
    },
  },
  "knight-retreat": { icon: "🥾", iconGlow: "rgba(34,197,94,0.6)" },
  knook: {
    glow: "rgba(59,130,246,0.5)",
    render: (sw) => {
      const s = sw * 0.28;
      return (
        <svg viewBox="0 0 24 24" width={s} height={s} style={{ position: "absolute", top: "2%", left: "2%", opacity: 0.85, filter: "drop-shadow(0 0 3px rgba(59,130,246,0.8))" }}>
          <rect x="4" y="8" width="16" height="14" rx="1" fill="rgba(59,130,246,0.7)" stroke="rgba(147,197,253,0.8)" strokeWidth="0.8" />
          <rect x="5.5" y="4" width="3" height="6" fill="rgba(59,130,246,0.8)" />
          <rect x="10" y="4" width="3" height="6" fill="rgba(59,130,246,0.8)" />
          <rect x="15" y="4" width="3" height="6" fill="rgba(59,130,246,0.8)" />
        </svg>
      );
    },
  },
  archbishop: {
    glow: "rgba(168,85,247,0.5)",
  },
  amazon: {
    glow: "rgba(249,115,22,0.4)",
    render: (sw) => {
      const s = sw * 0.26;
      return (
        <svg viewBox="0 0 24 24" width={s} height={s} style={{ position: "absolute", top: "0%", right: "2%", opacity: 0.9, filter: "drop-shadow(0 0 3px rgba(249,115,22,0.8))" }}>
          <path d="M6 20 L8 12 L6 8 L10 4 L14 6 L18 4 L16 10 L18 14 L14 18 Z" fill="rgba(249,115,22,0.8)" stroke="rgba(251,191,36,0.8)" strokeWidth="0.6" />
        </svg>
      );
    },
  },
  "king-ascension": {
    glow: "rgba(234,179,8,0.5)",
    render: (sw) => {
      const s = sw * 0.32;
      return (
        <svg viewBox="0 0 24 24" width={s} height={s} style={{ position: "absolute", top: "-4%", left: "50%", transform: "translateX(-50%)", opacity: 0.9, filter: "drop-shadow(0 0 4px rgba(234,179,8,0.9))" }}>
          <path d="M2 18 L4 8 L8 12 L12 4 L16 12 L20 8 L22 18 Z" fill="rgba(234,179,8,0.8)" stroke="rgba(253,224,71,0.9)" strokeWidth="0.6" />
          <circle cx="4" cy="8" r="1.5" fill="rgba(253,224,71,0.9)" />
          <circle cx="12" cy="4" r="1.5" fill="rgba(253,224,71,0.9)" />
          <circle cx="20" cy="8" r="1.5" fill="rgba(253,224,71,0.9)" />
        </svg>
      );
    },
  },
  "phantom-rook": { icon: "👻", iconGlow: "rgba(147,51,234,0.8)", filter: "opacity(0.65) brightness(1.3)", glow: "rgba(147,51,234,0.4)" },
  "sniper-bishop": {
    render: (sw) => {
      const s = sw * 0.35;
      return (
        <svg viewBox="0 0 24 24" width={s} height={s} style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", opacity: 0.5, filter: "drop-shadow(0 0 2px rgba(239,68,68,0.6))" }}>
          <circle cx="12" cy="12" r="9" stroke="rgba(239,68,68,0.7)" strokeWidth="1" fill="none" />
          <circle cx="12" cy="12" r="4" stroke="rgba(239,68,68,0.5)" strokeWidth="0.8" fill="none" />
          <line x1="12" y1="1" x2="12" y2="7" stroke="rgba(239,68,68,0.6)" strokeWidth="1" />
          <line x1="12" y1="17" x2="12" y2="23" stroke="rgba(239,68,68,0.6)" strokeWidth="1" />
          <line x1="1" y1="12" x2="7" y2="12" stroke="rgba(239,68,68,0.6)" strokeWidth="1" />
          <line x1="17" y1="12" x2="23" y2="12" stroke="rgba(239,68,68,0.6)" strokeWidth="1" />
        </svg>
      );
    },
  },
  "collateral-rook": { icon: "💥", iconGlow: "rgba(249,115,22,0.8)", glow: "rgba(249,115,22,0.4)" },
  "nuclear-queen": { icon: "☢️", iconGlow: "rgba(34,197,94,0.9)", glow: "rgba(34,197,94,0.5)" },
  "rook-charge": { icon: "🥾", iconGlow: "rgba(59,130,246,0.6)" },
  "pawn-charge": { icon: "🚀", iconGlow: "rgba(59,130,246,0.6)", glow: "rgba(59,130,246,0.4)" },
  "pawn-capture-forward": { icon: "🗡️", iconGlow: "rgba(239,68,68,0.6)", glow: "rgba(239,68,68,0.4)" },
  "bishop-slide": { icon: "🥾", iconGlow: "rgba(96,165,250,0.6)" },
  "pawn-promotion-early": { icon: "⭐", iconGlow: "rgba(234,179,8,0.8)", glow: "rgba(234,179,8,0.3)" },
  "king-shield": { icon: "🛡️", iconGlow: "rgba(59,130,246,0.6)" },
  "king-wrath": { icon: "⚔️", iconGlow: "rgba(239,68,68,0.7)" },
  "queen-teleport": { icon: "🌀", iconGlow: "rgba(168,85,247,0.8)", glow: "rgba(168,85,247,0.4)" },
  "bishop-bounce": { icon: "🪃", iconGlow: "rgba(249,115,22,0.6)" },
  "rook-cannon": { icon: "💣", iconGlow: "rgba(239,68,68,0.8)", glow: "rgba(239,68,68,0.4)" },
  "knight-horde": { icon: "🪖", iconGlow: "rgba(34,197,94,0.7)" },
  "undead-army": { icon: "💀", iconGlow: "rgba(168,85,247,0.8)", filter: "sepia(0.3) hue-rotate(-20deg)" },
  "il-vaticano": { icon: "✝️", iconGlow: "rgba(234,179,8,0.6)" },
  "forced-en-passant": { icon: "🧱", iconGlow: "rgba(249,115,22,0.6)" },
  "pawn-shield-wall": { icon: "🔰", iconGlow: "rgba(59,130,246,0.6)" },
  "enpassant-everywhere": { icon: "♟️", iconGlow: "rgba(234,179,8,0.6)" },
};

/** Map piece code letter → PieceSymbol */
const PIECE_CODE_MAP: Record<string, string> = {
  P: "p", N: "n", B: "b", R: "r", Q: "q", K: "k",
};

/** Modifier IDs that only affect the first piece of their type (visual overlays).
 *  The move gen (genKnook, genArchbishop) also uses the first piece found
 *  in file/rank scan order, so the visual consistently matches. */
const SINGLE_PIECE_MODIFIERS: Record<string, true> = {
  knook: true,
  archbishop: true,
};

/** Fairy piece SVG replacements — full piece image swap for transformative modifiers */
const FAIRY_PIECE_SVGS: Record<string, Record<string, string>> = {
  knook:                  { w: "/pieces/fairy/wC.svg",  b: "/pieces/fairy/bC.svg" },
  archbishop:             { w: "/pieces/fairy/wA.svg",  b: "/pieces/fairy/bA.svg" },
  amazon:                 { w: "/pieces/fairy/wAm.svg", b: "/pieces/fairy/bAm.svg" },
  pegasus:                { w: "/pieces/fairy/wPg.svg", b: "/pieces/fairy/bPg.svg" },
  "pawn-charge":          { w: "/pieces/fairy/wPC.svg", b: "/pieces/fairy/bPC.svg" },
  "pawn-capture-forward": { w: "/pieces/fairy/wPB.svg", b: "/pieces/fairy/bPB.svg" },
};

/** War Pawn SVG — shown when both pawn-charge AND pawn-capture-forward are active */
const WAR_PAWN_SVGS: Record<string, string> = {
  w: "/pieces/fairy/wPW.svg",
  b: "/pieces/fairy/bPW.svg",
};

/**
 * Build customPieces with chaos modifier overlays.
 * Wraps each piece image with SVG decorations based on active modifiers.
 */
function buildChaosCustomPieces(
  setName: string | null,
  playerModifiers: ChaosModifier[],
  aiModifiers: ChaosModifier[],
  playerColor: "white" | "black",
  game: Chess,
  assignedSquares?: Record<string, string | null>,
): Record<string, ({ squareWidth, square }: { squareWidth: number; square?: string }) => React.ReactElement> {
  const codes = ["wP", "wN", "wB", "wR", "wQ", "wK", "bP", "bN", "bB", "bR", "bQ", "bK"];
  const result: Record<string, ({ squareWidth, square }: { squareWidth: number; square?: string }) => React.ReactElement> = {};

  // Fallback to cburnett if no custom set chosen
  const actualSet = setName ?? "cburnett";

  // Pre-compute which square is the "single piece" for each modifier
  // e.g. for knook: the first knight square of each color
  const singlePieceSquares: Record<string, Record<string, string | null>> = {};
  for (const modId of Object.keys(SINGLE_PIECE_MODIFIERS)) {
    singlePieceSquares[modId] = {};
    for (const color of ["w", "b"] as const) {
      const mod = (color === (playerColor === "white" ? "w" : "b") ? playerModifiers : aiModifiers)
        .find((m) => m.id === modId);
      if (!mod) { singlePieceSquares[modId][color] = null; continue; }

      // Use tracked square from assignedSquares if available
      const trackedKey = `${color}_${modId}`;
      if (assignedSquares && trackedKey in assignedSquares) {
        singlePieceSquares[modId][color] = assignedSquares[trackedKey];
        continue;
      }

      // Fallback: find first piece of this type for this color
      const squares: string[] = [];
      for (const f of "abcdefgh") {
        for (const r of "12345678") {
          const s = `${f}${r}`;
          const p = game.get(s as any);
          if (p && p.type === mod.piece && p.color === color) squares.push(s);
        }
      }
      singlePieceSquares[modId][color] = squares[0] ?? null;
    }
  }

  for (const code of codes) {
    const pieceColor = code[0]; // "w" or "b"
    const pieceType = PIECE_CODE_MAP[code[1]]; // "p", "n", etc.
    const isPlayerPiece =
      (pieceColor === "w" && playerColor === "white") ||
      (pieceColor === "b" && playerColor === "black");
    const mods = isPlayerPiece ? playerModifiers : aiModifiers;
    const activeForPiece = mods.filter((m) => m.piece === pieceType);
    const url = getPieceImageUrl(actualSet, code);

    result[code] = ({ squareWidth, square }: { squareWidth: number; square?: string }) => {
      // Collect overlays & effects
      const overlays: React.ReactElement[] = [];
      let filter = "";
      let glowColor = "";
      let cornerIdx = 0;
      let pieceUrl = url; // default to standard piece

      // Detect pawn modifier combo: both charge + bayonet = War Pawn
      const hasPawnCharge = pieceType === "p" && activeForPiece.some(m => m.id === "pawn-charge");
      const hasPawnBayonet = pieceType === "p" && activeForPiece.some(m => m.id === "pawn-capture-forward");
      const pawnCombo = hasPawnCharge && hasPawnBayonet;
      if (pawnCombo) {
        pieceUrl = WAR_PAWN_SVGS[pieceColor];
        glowColor = "rgba(245,158,11,0.45)"; // amber glow for war pawn
      }

      for (const mod of activeForPiece) {
        // Skip single-piece modifiers if this isn't the designated piece
        if (SINGLE_PIECE_MODIFIERS[mod.id] && square) {
          const designatedSquare = singlePieceSquares[mod.id]?.[pieceColor];
          if (designatedSquare && square !== designatedSquare) continue;
        }

        // Check for fairy piece SVG replacement (replaces the entire piece image)
        const fairySvgs = FAIRY_PIECE_SVGS[mod.id];
        // Skip individual pawn fairy SVGs when War Pawn combo is active
        const skipForCombo = pawnCombo && (mod.id === "pawn-charge" || mod.id === "pawn-capture-forward");
        if (fairySvgs && square && !skipForCombo) {
          const designatedSquare = singlePieceSquares[mod.id]?.[pieceColor];
          if (!designatedSquare || square === designatedSquare) {
            pieceUrl = fairySvgs[pieceColor];
          }
        }

        const def = MODIFIER_OVERLAYS[mod.id];
        if (!def) continue;

        // Skip icon/render overlays for modifiers with fairy piece replacements
        // (the fairy SVG IS the piece — no need for an overlay badge)
        if (!fairySvgs && !skipForCombo) {
          if (def.icon) {
            // Icon-based badge — auto-assign to next available corner
            const corner = CORNER_ORDER[cornerIdx % CORNER_ORDER.length];
            cornerIdx++;
            const s = squareWidth * 0.24;
            const style = CORNER_STYLES[corner];
            overlays.push(
              <div key={mod.id} style={{ position: "absolute", ...style, fontSize: s, lineHeight: 1, filter: `drop-shadow(0 0 3px ${def.iconGlow ?? "rgba(255,255,255,0.6)"})` }}>
                {def.icon}
              </div>
            );
          } else if (def.render) {
            // Custom SVG render — uses its own positioning
            overlays.push(<React.Fragment key={mod.id}>{def.render(squareWidth)}</React.Fragment>);
          }
        }

        if (def.filter) filter = def.filter;
        if (def.glow && !glowColor) glowColor = def.glow;
      }

      return (
        <div style={{ width: squareWidth, height: squareWidth, position: "relative" }}>
          {/* Glow aura behind piece */}
          {glowColor && (
            <div
              style={{
                position: "absolute",
                inset: "10%",
                borderRadius: "50%",
                background: `radial-gradient(circle, ${glowColor} 0%, transparent 70%)`,
                animation: "pulse 2.5s ease-in-out infinite",
                pointerEvents: "none",
              }}
            />
          )}
          {/* Base piece image */}
          <div
            style={{
              width: squareWidth,
              height: squareWidth,
              backgroundImage: `url(${pieceUrl})`,
              backgroundSize: "contain",
              backgroundRepeat: "no-repeat",
              backgroundPosition: "center",
              filter: filter || undefined,
              position: "relative",
              zIndex: 1,
            }}
          />
          {/* Modifier overlays */}
          {overlays.length > 0 && (
            <div style={{ position: "absolute", inset: 0, zIndex: 2, pointerEvents: "none" }}>
              {overlays}
            </div>
          )}
        </div>
      );
    };
  }

  return result;
}

/* ────────────────────────── Constants ────────────────────────── */

const AI_MOVE_DELAY = 600;
const POLL_INTERVAL = 3_000; // fallback polling — primary sync is via WebSocket

type GameMode = "ai" | "friend" | "matchmake";
type GameStatus = "setup" | "waiting" | "playing" | "drafting" | "game-over";
type GameResult = "white" | "black" | "draw" | null;

type MoveLogEntry = {
  moveNumber: number;
  white?: string;
  black?: string;
};

type EventLogEntry = {
  type: "draft" | "modifier" | "info" | "chaos";
  message: string;
  icon?: string;
  pepe?: string;
};

/* ────────────────────────── Multiplayer Perspective Helpers ────────────────── */

/**
 * The server stores ChaosState from a neutral (color-based) perspective:
 *   playerModifiers → white's modifiers
 *   aiModifiers     → black's modifiers
 *
 * Each client maps these to/from their local perspective based on
 * what color they are playing.
 */
function toServerChaosState(localState: ChaosState, myColor: "white" | "black"): ChaosState {
  if (myColor === "white") return localState; // already aligned
  // Swap: my "player" mods = black's from server perspective → stored as aiModifiers
  return {
    ...localState,
    playerModifiers: localState.aiModifiers,
    aiModifiers: localState.playerModifiers,
  };
}

function fromServerChaosState(serverState: ChaosState, myColor: "white" | "black"): ChaosState {
  if (myColor === "white") return serverState; // already aligned
  // Swap back: server playerModifiers = white's mods → my "ai" (opponent)
  return {
    ...serverState,
    playerModifiers: serverState.aiModifiers,
    aiModifiers: serverState.playerModifiers,
  };
}

/* ────────────────────────── Pepe Emojis ────────────────────────── */

const PEPE = {
  // Reactions
  hmm:          "/pepe-emojis/3959-hmm.png",
  gigachad:     "/pepe-emojis/9088-pepe-gigachad.png",
  king:         "/pepe-emojis/11998-pepe-king.png",
  shocked:      "/pepe-emojis/monkaS.png",
  clown:        "/pepe-emojis/4825_PepeClown.png",
  sadge:        "/pepe-emojis/6757_Sadge.png",
  copium:       "/pepe-emojis/7332-copium.png",
  rage:         "/pepe-emojis/4178-pepe-rage.png",
  think:        "/pepe-emojis/60250-think.png",
  cry:          "/pepe-emojis/2982-pepecry.png",
  detective:    "/pepe-emojis/8557-peepodetective.png",
  pepeok:       "/pepe-emojis/81504-pepeok.png",
  poggies:      "/pepe-emojis/2230-poggies-peepo.png",
  galaxybrain:  "/pepe-emojis/26578-galaxybrainpepe.png",
  death:        "/pepe-emojis/4642-death.png",
  cringe:       "/pepe-emojis/9807-pepecringe.png",
  nosign:       "/pepe-emojis/3049-pepenosign.png",
  clownge:      "/pepe-emojis/1082-clownge.png",
  prayge:       "/pepe-emojis/4437-prayge.png",
  jesus:        "/pepe-emojis/3613-pepe-with-jesus.png",
  // Animated
  lmao:         "/pepe-emojis/animated/690612-pepe-lmao.gif",
  clap:         "/pepe-emojis/animated/80293-pepeclap.gif",
  hyped:        "/pepe-emojis/animated/88627-pepehype.gif",
  gamercry:     "/pepe-emojis/animated/411644-gamer-pepe-cry.gif",
  madpuke:      "/pepe-emojis/animated/84899-pepe-madpuke.gif",
  bigeyes:      "/pepe-emojis/animated/28654-bigeyes.gif",
  nope:         "/pepe-emojis/animated/41292-pepe-nopes.gif",
  clowntrain:   "/pepe-emojis/animated/59958-pepeclownblobtrain.gif",
  firesgun:     "/pepe-emojis/animated/815161-pepe-fires-gun.gif",
  toxic:        "/pepe-emojis/animated/972934-pepe-with-toxic-sign.gif",
  moneyrain:    "/pepe-emojis/animated/93659-pepemoneyrain.gif",
  loving:       "/pepe-emojis/animated/98260-pepe-loving.gif",
  cantwatch:    "/pepe-emojis/animated/pepe-with-hands-covering-ears.gif",
} as const;

/** Pepe reaction pools for different draft tier qualities */
const TIER_PEPES: Record<ModifierTier, string[]> = {
  common:    [PEPE.hmm, PEPE.pepeok, PEPE.think, PEPE.detective],
  rare:      [PEPE.bigeyes, PEPE.shocked, PEPE.poggies, PEPE.hyped],
  epic:      [PEPE.galaxybrain, PEPE.lmao, PEPE.firesgun, PEPE.clap],
  legendary: [PEPE.gigachad, PEPE.king, PEPE.moneyrain, PEPE.hyped],
};

/** Pick a random pepe for a tier */
function tierPepe(tier: ModifierTier): string {
  const pool = TIER_PEPES[tier];
  return pool[Math.floor(Math.random() * pool.length)];
}

/** Meme sound pools per tier */
type ChaosSound = "vine-boom" | "crowd-ooh" | "airhorn" | "emotional-damage" | "bruh" | "roblox-oof" | "record-scratch" | "honk" | "bell" | "buzzer" | "bro-serious" | "yeet";

const TIER_SOUNDS: Record<ModifierTier, ChaosSound[]> = {
  common:    ["bruh", "roblox-oof"],
  rare:      ["crowd-ooh", "record-scratch", "honk"],
  epic:      ["airhorn", "emotional-damage", "bro-serious"],
  legendary: ["airhorn", "yeet"],
};

/** SFX pool for AI chaos moves — varied so it doesn't repeat the same clip */
const AI_CHAOS_SOUNDS: ChaosSound[] = [
  "vine-boom", "bruh", "roblox-oof", "crowd-ooh",
  "record-scratch", "honk", "bro-serious", "yeet",
];

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

/* ────────────────────────── Particles ────────────────────────── */

function ChaosParticles() {
  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden z-0">
      {Array.from({ length: 20 }).map((_, i) => {
        const colors = ["#f97316", "#a855f7", "#ef4444", "#eab308", "#3b82f6"];
        const size = 2 + Math.random() * 4;
        const duration = 4 + Math.random() * 6;
        return (
          <div
            key={i}
            className="absolute rounded-full"
            style={{
              width: `${size}px`,
              height: `${size}px`,
              backgroundColor: colors[i % colors.length],
              left: `${5 + Math.random() * 90}%`,
              bottom: `${-5 + Math.random() * 10}%`,
              opacity: 0,
              animation: `chaos-float ${duration}s ease-out ${Math.random() * 5}s infinite`,
            }}
          />
        );
      })}
      <style>{`
        @keyframes chaos-float {
          0% { transform: translateY(0) scale(1); opacity: 0; }
          10% { opacity: 0.6; }
          50% { opacity: 0.3; }
          100% { transform: translateY(-100vh) scale(0.3); opacity: 0; }
        }
        @keyframes draft-pulse {
          0%, 100% { box-shadow: 0 0 20px rgba(168, 85, 247, 0.3); }
          50% { box-shadow: 0 0 40px rgba(168, 85, 247, 0.6); }
        }
        @keyframes card-appear {
          0% { transform: translateY(30px) scale(0.8); opacity: 0; }
          100% { transform: translateY(0) scale(1); opacity: 1; }
        }
        @keyframes pepe-pop {
          0% { transform: scale(0) rotate(-15deg); opacity: 0; }
          50% { transform: scale(1.2) rotate(5deg); opacity: 1; }
          100% { transform: scale(1) rotate(0deg); opacity: 1; }
        }
        @keyframes pepe-float-away {
          0% { transform: translateY(0) scale(1); opacity: 1; }
          100% { transform: translateY(-120px) scale(0.5); opacity: 0; }
        }
        @keyframes pepe-bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
        @keyframes tooltip-pop {
          0% { transform: translateX(-50%) scale(0.9); opacity: 0; }
          100% { transform: translateX(-50%) scale(1); opacity: 1; }
        }

        /* ── Draft card tarot animations ── */
        @keyframes card-deal {
          0% { transform: translateY(120px) scale(0.3) rotate(25deg); opacity: 0; }
          60% { transform: translateY(-10px) scale(1.03) rotate(-2deg); opacity: 1; }
          80% { transform: translateY(3px) scale(0.99) rotate(0.5deg); }
          100% { transform: translateY(0) scale(1) rotate(0deg); opacity: 1; }
        }
        @keyframes card-flip {
          0% { transform: rotateY(0deg); }
          100% { transform: rotateY(180deg); }
        }
        @keyframes card-flip-reverse {
          0% { transform: rotateY(180deg); }
          100% { transform: rotateY(0deg); }
        }
        @keyframes card-shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        @keyframes card-glow-pulse {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 0.8; }
        }
        @keyframes card-picked {
          0% { transform: scale(1); }
          30% { transform: scale(1.15) rotate(-2deg); }
          60% { transform: scale(1.1) rotate(1deg); }
          100% { transform: scale(1.05) rotate(0deg); }
        }
        @keyframes card-dismiss {
          0% { transform: scale(1) translateY(0) rotate(0deg); opacity: 1; }
          100% { transform: scale(0.6) translateY(60px) rotate(10deg); opacity: 0; }
        }
        @keyframes sparkle-drift {
          0% { transform: translate(0, 0) scale(0); opacity: 0; }
          20% { opacity: 1; transform: scale(1); }
          100% { transform: translate(var(--sx), var(--sy)) scale(0); opacity: 0; }
        }
        @keyframes draft-bg-enter {
          0% { opacity: 0; backdrop-filter: blur(0px); }
          100% { opacity: 1; backdrop-filter: blur(8px); }
        }
        @keyframes draft-modal-enter {
          0% { transform: translateY(40px) scale(0.95); opacity: 0; }
          100% { transform: translateY(0) scale(1); opacity: 1; }
        }
        @keyframes draft-title-enter {
          0% { transform: scale(0.7); opacity: 0; letter-spacing: 0.3em; }
          60% { transform: scale(1.05); }
          100% { transform: scale(1); opacity: 1; letter-spacing: 0.05em; }
        }
        @keyframes rune-spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes card-hover-glow {
          0%, 100% { box-shadow: 0 0 15px var(--glow-color, rgba(168,85,247,0.3)); }
          50% { box-shadow: 0 0 30px var(--glow-color, rgba(168,85,247,0.6)), 0 0 60px var(--glow-color, rgba(168,85,247,0.2)); }
        }
      `}</style>
    </div>
  );
}

/* ────────────────────────── Opponent Draft Reveal ────────────────────────── */

interface OpponentDraftRevealData {
  opponentPick: ChaosModifier;
  phase: number;
}

function OpponentDraftReveal({
  data,
  onDismiss,
}: {
  data: OpponentDraftRevealData;
  onDismiss: () => void;
}) {
  const [stage, setStage] = useState<"enter" | "reveal" | "done">("enter");

  useEffect(() => {
    playSound("record-scratch");
    const t1 = setTimeout(() => { setStage("reveal"); playSound("vine-boom"); }, 800);
    const t2 = setTimeout(() => setStage("done"), 1400);
    const t3 = setTimeout(onDismiss, 4500);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [onDismiss]);

  const mod = data.opponentPick;
  const tier = TIER_COLORS[mod.tier];
  const glowColor = TIER_GLOW_COLORS[mod.tier];
  const isRevealed = stage !== "enter";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ animation: "draft-bg-enter 0.4s ease-out both", backgroundColor: "rgba(0,0,0,0.7)" }}
      onClick={onDismiss}
    >
      <div
        className="mx-4 w-full max-w-sm rounded-2xl border border-purple-500/30 bg-[#0a0f1a]/95 p-5 text-center sm:p-8"
        style={{ animation: "draft-modal-enter 0.5s cubic-bezier(0.34,1.56,0.64,1) both" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Title */}
        <p className="mb-1 text-xs font-bold uppercase tracking-widest text-purple-400/80">
          Phase {data.phase}
        </p>
        <h2
          className="mb-5 bg-gradient-to-r from-red-400 via-orange-400 to-yellow-400 bg-clip-text text-xl font-black tracking-wide text-transparent sm:text-2xl"
          style={{ animation: "draft-title-enter 0.6s cubic-bezier(0.34,1.56,0.64,1) 0.2s both" }}
        >
          ⚔️ OPPONENT DRAFTED!
        </h2>

        {/* Single card reveal */}
        <div className="flex justify-center" style={{ perspective: "1000px" }}>
          <div className="relative w-48" style={{ transformStyle: "preserve-3d" }}>
            <div
              className="relative w-full transition-transform duration-700"
              style={{
                transformStyle: "preserve-3d",
                transform: isRevealed ? "rotateY(180deg)" : "rotateY(0deg)",
              }}
            >
              {/* Card back */}
              <div
                className="absolute inset-0 flex flex-col items-center justify-center rounded-xl border border-purple-500/30 bg-gradient-to-br from-[#1a1040] via-[#0f0a2a] to-[#1a0a30] p-4"
                style={{ backfaceVisibility: "hidden", minHeight: "200px" }}
              >
                <div className="text-3xl text-purple-500/20" style={{ animation: "rune-spin 10s linear infinite" }}>✦</div>
                <div className="mt-2 text-[10px] uppercase tracking-[0.2em] text-purple-500/30">Chaos</div>
              </div>

              {/* Card front */}
              <div
                className={`relative flex w-full flex-col items-center gap-1.5 rounded-xl border p-4 text-center ${tier.bg} ${tier.border}`}
                style={{
                  backfaceVisibility: "hidden",
                  transform: "rotateY(180deg)",
                  minHeight: "200px",
                  ...(isRevealed && (mod.tier === "epic" || mod.tier === "legendary")
                    ? { boxShadow: `0 0 25px ${glowColor}, 0 0 50px ${glowColor}` }
                    : {}),
                }}
              >
                <CardSparkles tier={mod.tier} />

                {/* Label */}
                <span className="mb-1 text-[9px] font-bold uppercase tracking-wider text-red-400/80">
                  Opponent Drafted
                </span>

                {/* Icon */}
                <div className="relative z-10 text-4xl sm:text-5xl">{mod.icon}</div>

                {/* Tier badge */}
                <span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${tier.text} ${tier.bg}`}>
                  {TIER_LABELS[mod.tier]}
                </span>

                {/* Name */}
                <h3 className="text-sm font-bold text-white">{mod.name}</h3>

                {/* Description */}
                <p className="text-[10px] leading-snug text-slate-400">{mod.description}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Dismiss hint */}
        {stage === "done" && (
          <p className="mt-4 text-[10px] text-slate-500 animate-pulse">Click anywhere to continue</p>
        )}
      </div>
    </div>
  );
}

/* ────────────────────────── Floating Pepe Reaction ────────────────────────── */

function FloatingPepe({ src, onDone }: { src: string; onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 2500);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <div
      className="pointer-events-none fixed z-[60]"
      style={{
        left: `${30 + Math.random() * 40}%`,
        top: `${20 + Math.random() * 30}%`,
        animation: "pepe-float-away 2.5s ease-out forwards",
      }}
    >
      <img src={src} alt="" className="h-16 w-16 object-contain" style={{ animation: "pepe-pop 0.3s ease-out" }} />
    </div>
  );
}

/* ────────────────────────── Draft Modal ────────────────────────── */

/** Glow colours per tier for the card edge/shadow */
const TIER_GLOW_COLORS: Record<ModifierTier, string> = {
  common:    "rgba(148,163,184,0.4)",
  rare:      "rgba(59,130,246,0.5)",
  epic:      "rgba(168,85,247,0.55)",
  legendary: "rgba(245,158,11,0.6)",
};

/** Card-back rune patterns (purely decorative) */
const CARD_BACK_RUNES = ["⚔", "♜", "♞", "⚡", "♛", "✦"];

/** Tiny sparkle particles for epic/legendary cards */
function CardSparkles({ tier }: { tier: ModifierTier }) {
  if (tier !== "epic" && tier !== "legendary") return null;
  const sparkles = useMemo(() => {
    const count = tier === "legendary" ? 8 : 5;
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      left: `${10 + Math.random() * 80}%`,
      top: `${10 + Math.random() * 80}%`,
      delay: `${Math.random() * 2}s`,
      sx: `${(Math.random() - 0.5) * 30}px`,
      sy: `${(Math.random() - 0.5) * 30}px`,
      dur: `${1.5 + Math.random()}s`,
    }));
  }, [tier]);

  return (
    <>
      {sparkles.map((s) => (
        <span
          key={s.id}
          className="pointer-events-none absolute text-[8px]"
          style={{
            left: s.left,
            top: s.top,
            color: tier === "legendary" ? "#fbbf24" : "#c084fc",
            animation: `sparkle-drift ${s.dur} ease-out ${s.delay} infinite`,
            "--sx": s.sx,
            "--sy": s.sy,
          } as React.CSSProperties}
        >
          ✦
        </span>
      ))}
    </>
  );
}

function DraftModal({
  phase,
  choices,
  onPick,
}: {
  phase: number;
  choices: ChaosModifier[];
  onPick: (mod: ChaosModifier) => void;
}) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const hoveredMod = choices.find((c) => c.id === hoveredId);

  // Staggered reveal: cards start face-down, flip one by one
  const [revealedCards, setRevealedCards] = useState<Set<number>>(new Set());
  const [allRevealed, setAllRevealed] = useState(false);
  const [pickedId, setPickedId] = useState<string | null>(null);
  const [dismissing, setDismissing] = useState(false);

  // Peek board state
  const [peeking, setPeeking] = useState(false);

  // Play drumroll on mount, then reveal cards one by one
  useEffect(() => {
    playSound("drumroll");

    // Stagger the card reveals
    const timers: ReturnType<typeof setTimeout>[] = [];
    choices.forEach((_, idx) => {
      timers.push(
        setTimeout(() => {
          setRevealedCards((prev) => new Set([...prev, idx]));
          // Play a subtle sound on each flip
          if (idx < choices.length - 1) playSound("move");
          else playSound("reveal-stinger");
        }, 600 + idx * 450),
      );
    });
    // Mark all revealed
    timers.push(
      setTimeout(() => setAllRevealed(true), 600 + choices.length * 450 + 100),
    );
    return () => timers.forEach(clearTimeout);
  }, [choices]);

  // Handle card pick with a dismiss animation
  const handlePick = useCallback(
    (mod: ChaosModifier) => {
      if (pickedId || !allRevealed) return; // prevent double-picks & picks before reveal
      setPickedId(mod.id);
      setDismissing(true);
      playSound("vine-boom");
      // Wait for dismiss animation, then call onPick
      setTimeout(() => onPick(mod), 650);
    },
    [pickedId, allRevealed, onPick],
  );

  // Floating "Back to Draft" button when peeking
  if (peeking) {
    return (
      <button
        type="button"
        onClick={() => setPeeking(false)}
        className="fixed bottom-4 left-1/2 z-50 -translate-x-1/2 flex items-center gap-2 rounded-full border border-purple-500/40 bg-[#0a0f1a]/90 px-5 py-2.5 text-sm font-bold text-purple-300 shadow-lg shadow-purple-500/20 backdrop-blur-sm transition-all hover:border-purple-400/60 hover:text-white hover:scale-105"
        style={{ animation: "draft-modal-enter 0.3s ease-out both" }}
      >
        <span className="text-lg">🃏</span> Back to Draft
      </button>
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center sm:items-center"
      style={{
        animation: "draft-bg-enter 0.4s ease-out both",
        backgroundColor: "rgba(0,0,0,0.75)",
      }}
    >
      {/* Modal container */}
      <div
        className="relative w-full max-w-2xl rounded-t-2xl border border-purple-500/30 bg-[#0a0f1a]/95 p-4 sm:mx-4 sm:rounded-2xl sm:p-6 md:p-8 max-h-[90vh] overflow-y-auto"
        style={{
          animation: "draft-modal-enter 0.5s ease-out both, draft-pulse 2s ease-in-out 0.5s infinite",
        }}
      >
        {/* Decorative spinning rune behind header */}
        <div
          className="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 text-[120px] text-purple-500/[0.04]"
          style={{ animation: "rune-spin 30s linear infinite" }}
        >
          ✦
        </div>

        {/* Header */}
        <div className="relative mb-4 text-center sm:mb-6">
          {/* Pepe reacts to hovered tier */}
          <div className="mb-1.5 flex items-center justify-center gap-3 sm:mb-2">
            <img
              src={hoveredMod ? tierPepe(hoveredMod.tier) : PEPE.bigeyes}
              alt=""
              className="h-9 w-9 object-contain sm:h-12 sm:w-12"
              style={{
                animation: hoveredMod
                  ? "pepe-pop 0.25s ease-out"
                  : "pepe-bounce 1.5s ease-in-out infinite",
              }}
              key={hoveredId ?? "idle"}
            />
          </div>
          <h2
            className="text-xl font-bold tracking-wide text-white sm:text-2xl"
            style={{ animation: "draft-title-enter 0.6s ease-out 0.15s both" }}
          >
            CHAOS DRAFT
          </h2>
          <p className="mt-0.5 text-xs text-purple-400 sm:mt-1 sm:text-sm">
            Phase {phase} — {getPhaseLabel(phase)}
          </p>
          <p className="mt-1 text-[10px] text-slate-500 sm:mt-2 sm:text-xs">
            Choose a modifier to permanently buff your pieces
          </p>
          {allRevealed && !pickedId && (
            <button
              type="button"
              onClick={() => setPeeking(true)}
              className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-slate-600/40 bg-slate-800/50 px-3 py-1 text-[10px] font-medium text-slate-400 transition-all hover:border-purple-500/40 hover:text-purple-300 sm:text-xs"
            >
              <span>👁️</span> Peek Board
            </button>
          )}
        </div>

        {/* Cards */}
        <div className="grid gap-3 grid-cols-1 sm:gap-5 sm:grid-cols-3" style={{ perspective: "1200px" }}>
          {choices.map((mod, idx) => {
            const tier = TIER_COLORS[mod.tier];
            const isHovered = hoveredId === mod.id;
            const isRevealed = revealedCards.has(idx);
            const isPicked = pickedId === mod.id;
            const isDismissed = dismissing && !isPicked;
            const glowColor = TIER_GLOW_COLORS[mod.tier];

            return (
              <div
                key={mod.id}
                className="relative"
                style={{
                  animation: `card-deal 0.5s cubic-bezier(0.34,1.56,0.64,1) ${idx * 0.15}s both`,
                  transformStyle: "preserve-3d",
                }}
              >
                {/* 3D flip container */}
                <div
                  className="relative w-full transition-transform duration-500"
                  style={{
                    transformStyle: "preserve-3d",
                    transform: isRevealed ? "rotateY(180deg)" : "rotateY(0deg)",
                  }}
                >
                  {/* ─── Card Back (face-down) ─── */}
                  <div
                    className="absolute inset-0 flex flex-col items-center justify-center rounded-xl border border-purple-500/30 bg-gradient-to-br from-[#1a1040] via-[#0f0a2a] to-[#1a0a30] p-4 sm:p-5"
                    style={{
                      backfaceVisibility: "hidden",
                      minHeight: "180px",
                    }}
                  >
                    {/* Decorative rune pattern */}
                    <div className="mb-2 text-3xl text-purple-500/20 sm:text-4xl" style={{ animation: "rune-spin 10s linear infinite" }}>
                      ✦
                    </div>
                    <div className="grid grid-cols-3 gap-1 opacity-20">
                      {CARD_BACK_RUNES.map((r, i) => (
                        <span key={i} className="text-center text-sm text-purple-400">{r}</span>
                      ))}
                    </div>
                    <div className="mt-2 text-[10px] uppercase tracking-[0.2em] text-purple-500/30">
                      Chaos
                    </div>
                  </div>

                  {/* ─── Card Front (face-up) ─── */}
                  <button
                    type="button"
                    onClick={() => handlePick(mod)}
                    onMouseEnter={() => allRevealed && setHoveredId(mod.id)}
                    onMouseLeave={() => setHoveredId(null)}
                    disabled={!allRevealed || !!pickedId}
                    className={`relative flex w-full flex-row items-center gap-3 rounded-xl border p-3 text-left sm:flex-col sm:gap-0 sm:p-5 sm:text-center ${tier.bg} ${tier.border} ${
                      allRevealed && !pickedId
                        ? "cursor-pointer transition-all duration-200"
                        : ""
                    } ${
                      isHovered && !pickedId
                        ? "border-white/30 sm:scale-105"
                        : ""
                    }`}
                    style={{
                      backfaceVisibility: "hidden",
                      transform: "rotateY(180deg)",
                      minHeight: "180px",
                      ...(isPicked
                        ? { animation: "card-picked 0.5s ease-out both", zIndex: 10 }
                        : isDismissed
                        ? { animation: `card-dismiss 0.5s ease-in ${idx * 0.05}s both` }
                        : {}),
                      ...(isHovered && !pickedId
                        ? {
                            "--glow-color": glowColor,
                            animation: "card-hover-glow 1.5s ease-in-out infinite",
                            transform: "rotateY(180deg) translateY(-4px)",
                          } as React.CSSProperties
                        : {}),
                    }}
                  >
                    {/* Tier shimmer overlay */}
                    {(mod.tier === "epic" || mod.tier === "legendary") && (
                      <div
                        className="pointer-events-none absolute inset-0 rounded-xl opacity-30"
                        style={{
                          background: `linear-gradient(90deg, transparent 0%, ${glowColor} 50%, transparent 100%)`,
                          backgroundSize: "200% 100%",
                          animation: "card-shimmer 3s linear infinite",
                        }}
                      />
                    )}

                    {/* Sparkles */}
                    <CardSparkles tier={mod.tier} />

                    {/* Icon */}
                    <div className="relative z-10 text-3xl shrink-0 sm:mb-2 sm:text-5xl">{mod.icon}</div>

                    <div className="relative z-10 flex-1 min-w-0 sm:flex-none">
                      {/* Tier badge */}
                      <span
                        className={`mb-1 inline-block rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider sm:mb-2 sm:text-[10px] ${tier.text} ${tier.bg}`}
                      >
                        {TIER_LABELS[mod.tier]}
                      </span>

                      {/* Name */}
                      <h3 className="text-xs font-bold text-white sm:mb-1 sm:text-sm">{mod.name}</h3>

                      {/* Piece target */}
                      {mod.piece && (
                        <span className="text-[9px] uppercase tracking-wider text-slate-500 sm:mb-2 sm:text-[10px] block">
                          {({ p: "Pawns", n: "Knights", b: "Bishops", r: "Rooks", q: "Queen", k: "King" })[mod.piece]}
                        </span>
                      )}

                      {/* Description */}
                      <p className="text-[10px] leading-relaxed text-slate-400 sm:text-xs">
                        {mod.description}
                      </p>
                    </div>

                    {/* Pick hint */}
                    {allRevealed && !pickedId && (
                      <div
                        className={`hidden sm:mt-3 sm:block rounded-lg px-3 py-1 text-xs font-semibold transition-all duration-200 ${
                          isHovered
                            ? "bg-white/15 text-white scale-105"
                            : "bg-white/5 text-slate-500"
                        }`}
                      >
                        {isHovered ? "⚡ Draft This!" : "Click to Draft"}
                      </div>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* "Revealing..." text while cards flip */}
        {!allRevealed && (
          <p className="mt-4 text-center text-xs text-purple-400/60 animate-pulse sm:mt-6">
            Revealing your fate…
          </p>
        )}
      </div>
    </div>
  );
}

/* ────────────────────────── Modifier Tooltip ────────────────────────── */

function ModifierTooltip({
  mod,
  children,
}: {
  mod: ChaosModifier;
  children: React.ReactNode;
}) {
  const [show, setShow] = useState(false);
  const triggerRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const tier = TIER_COLORS[mod.tier];

  useEffect(() => {
    if (!show || !triggerRef.current) { setPos(null); return; }
    const rect = triggerRef.current.getBoundingClientRect();
    setPos({
      top: rect.top - 8, // 8px gap above trigger
      left: rect.left + rect.width / 2,
    });
  }, [show]);

  return (
    <div
      ref={triggerRef}
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      {children}
      {show && pos && createPortal(
        <div
          className="fixed w-56 rounded-xl border border-white/10 bg-[#0d1117] p-3 shadow-2xl shadow-black/50"
          style={{
            top: pos.top,
            left: pos.left,
            transform: "translate(-50%, -100%)",
            zIndex: 9999,
            animation: "tooltip-pop 0.15s ease-out both",
            pointerEvents: "none",
          }}
        >
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-2xl">{mod.icon}</span>
            <div>
              <p className="text-sm font-bold text-white">{mod.name}</p>
              <span className={`text-[10px] font-bold uppercase tracking-wider ${tier.text}`}>
                {TIER_LABELS[mod.tier]}
              </span>
            </div>
          </div>
          {mod.piece && (
            <p className="mb-1 text-[10px] uppercase tracking-wider text-slate-500">
              Affects: {({ p: "Pawns", n: "Knights", b: "Bishops", r: "Rooks", q: "Queen", k: "King" } as Record<string, string>)[mod.piece]}
            </p>
          )}
          <p className="text-xs leading-relaxed text-slate-400">{mod.description}</p>
          <div className="absolute left-1/2 top-full -translate-x-1/2 border-4 border-transparent border-t-[#0d1117]" />
        </div>,
        document.body,
      )}
    </div>
  );
}

/* ────────────────────────── Modifier sidebar ────────────────────────── */

function ModifierList({
  title,
  modifiers,
  color,
}: {
  title: string;
  modifiers: ChaosModifier[];
  color: string;
}) {
  if (modifiers.length === 0) return null;

  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-2 sm:p-2.5">
      <h3 className={`mb-1.5 text-[10px] font-bold uppercase tracking-wider ${color}`}>
        {title}
      </h3>
      <div className="space-y-1.5">
        {modifiers.map((mod) => (
          <div key={mod.id} className="rounded-lg bg-white/[0.03] px-2.5 py-1.5 transition-colors hover:bg-white/[0.06]">
            <div className="flex items-center gap-2">
              <span className="text-lg leading-none">{mod.icon}</span>
              <span className="text-xs font-semibold text-white">{mod.name}</span>
              <span className={`ml-auto text-[9px] font-bold uppercase tracking-wider ${TIER_COLORS[mod.tier].text}`}>
                {mod.tier}
              </span>
            </div>
            <p className="mt-0.5 text-[11px] leading-snug text-slate-500">
              {mod.description}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ────────────────────────── Inline modifier icons (next to player name) ────────────────────────── */

function InlineModifierIcons({ modifiers }: { modifiers: ChaosModifier[] }) {
  if (modifiers.length === 0) return null;
  return (
    <div className="ml-auto flex gap-1">
      {modifiers.map((m) => (
        <ModifierTooltip key={m.id} mod={m}>
          <span className="text-xl cursor-default transition-transform hover:scale-125">
            {m.icon}
          </span>
        </ModifierTooltip>
      ))}
    </div>
  );
}

/* ────────────────────────── Main Page ────────────────────────── */

export default function ChaosChessPage() {
  /* ── Auth ── */
  const { authenticated } = useSession();

  /** Build headers for chaos API calls — adds X-Guest-Id for unauthenticated players */
  const chaosHeaders = useCallback((json = false) => {
    const h: Record<string, string> = {};
    if (json) h["Content-Type"] = "application/json";
    if (!authenticated) h["X-Guest-Id"] = getGuestId();
    return h;
  }, [authenticated]);

  /* ── Board / theme hooks ── */
  const [boardSize, setBoardSize] = useState(0);
  const boardTheme = useBoardTheme();
  const showCoordinates = useShowCoordinates();
  const pieceTheme = usePieceTheme();
  const baseCustomPieces = useCustomPieces();

  /* ── Game state ── */
  const [game, setGame] = useState(() => new Chess());
  const [gameStatus, setGameStatus] = useState<GameStatus>("setup");
  const [gameResult, setGameResult] = useState<GameResult>(null);
  const [playerColor, setPlayerColor] = useState<"white" | "black">("white");
  const [isThinking, setIsThinking] = useState(false);

  /* ── Mode / multiplayer ── */
  const [gameMode, setGameMode] = useState<GameMode>("ai");
  const [roomId, setRoomId] = useState<string | null>(null);
  const [roomCode, setRoomCode] = useState<string>("");
  const [joinCode, setJoinCode] = useState<string>("");
  const [matchmakeState, setMatchmakeState] = useState<"idle" | "searching" | "found">("idle");
  const [opponentLabel, setOpponentLabel] = useState<string>("Opponent");
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastFenRef = useRef<string>("");

  /* ── Chaos state ── */
  const [chaosState, setChaosState] = useState<ChaosState>(createChaosState);
  const [pendingPhase, setPendingPhase] = useState(0);
  const [capturedPawns, setCapturedPawns] = useState({ w: 0, b: 0 });

  /* ── Opponent draft reveal (multiplayer) ── */
  const [opponentDraftReveal, setOpponentDraftReveal] = useState<OpponentDraftRevealData | null>(null);
  const prevPhaseRef = useRef(0);
  const justDraftedRef = useRef(false);
  /** Tracks the latest draft phase we've already shown a reveal/triggered a draft for (prevents poll re-triggering) */
  const triggeredDraftForPhaseRef = useRef(-1);

  /* ── Sequential draft state (multiplayer: White drafts first, then Black) ── */
  const [waitingForOpponentDraft, setWaitingForOpponentDraft] = useState(false);
  /** Queued data for the second drafter's own draft after seeing opponent reveal */
  const pendingDraftAfterRevealRef = useRef<{ phase: number; choices: ChaosModifier[]; chaosState: ChaosState } | null>(null);

  /* ── PartyKit WebSocket ref for send ── */
  const partySendRef = useRef<((msg: PartyMessage) => void) | null>(null);

  /* ── Draw offer / rematch state (multiplayer) ── */
  const [drawOfferSent, setDrawOfferSent] = useState(false);
  const [drawOfferReceived, setDrawOfferReceived] = useState(false);
  const [rematchRequested, setRematchRequested] = useState(false);
  const [rematchReceived, setRematchReceived] = useState(false);
  /** Reason for game end (for display) */
  const [endReason, setEndReason] = useState<string>("");

  /* ── Chaos moves (extra legal moves from modifiers) ── */
  const [availableChaosMoves, setAvailableChaosMoves] = useState<ChaosMove[]>([]);

  /* ── Chaos-aware piece rendering (overlays on pieces with modifiers) ── */
  const chaosCustomPieces = useMemo(() => {
    const allMods = [...chaosState.playerModifiers, ...chaosState.aiModifiers];
    if (allMods.length === 0) return baseCustomPieces;
    return buildChaosCustomPieces(
      pieceTheme.setName,
      chaosState.playerModifiers,
      chaosState.aiModifiers,
      playerColor,
      game,
      chaosState.assignedSquares ?? undefined,
    );
  }, [pieceTheme.setName, chaosState.playerModifiers, chaosState.aiModifiers, playerColor, baseCustomPieces, game, chaosState.assignedSquares]);

  /* ── Move log ── */
  const [moveLog, setMoveLog] = useState<MoveLogEntry[]>([]);
  const [eventLog, setEventLog] = useState<EventLogEntry[]>([]);
  const moveLogRef = useRef<HTMLDivElement>(null);
  const eventLogRef = useRef<HTMLDivElement>(null);
  const boardContainerRef = useRef<HTMLDivElement>(null);

  /* ── Board interaction state ── */
  const [selectedSquare, setSelectedSquare] = useState<CbSquare | null>(null);
  const [legalMoveSquares, setLegalMoveSquares] = useState<Record<string, React.CSSProperties>>({});
  const [lastMoveHighlight, setLastMoveHighlight] = useState<Record<string, React.CSSProperties>>({});

  /* ── Chaos promotion choice dialog ── */
  const [pendingPromotion, setPendingPromotion] = useState<ChaosMove | null>(null);
  /* ── Standard promotion choice dialog ── */
  const [pendingStdPromotion, setPendingStdPromotion] = useState<{ from: CbSquare; to: CbSquare } | null>(null);
  /* ── Difficulty ── */
  const [aiLevel, setAiLevel] = useState<"easy" | "medium" | "hard">("medium");
  const aiDepth = aiLevel === "easy" ? 6 : aiLevel === "medium" ? 10 : 14;

  /* ── Floating pepe reactions ── */
  const [floatingPepes, setFloatingPepes] = useState<{ id: number; src: string }[]>([]);
  const pepeIdRef = useRef(0);

  const spawnPepe = useCallback((src: string) => {
    const id = ++pepeIdRef.current;
    setFloatingPepes((prev) => [...prev, { id, src }]);
  }, []);

  const removePepe = useCallback((id: number) => {
    setFloatingPepes((prev) => prev.filter((p) => p.id !== id));
  }, []);

  /* ── Preload sounds ── */
  useEffect(() => {
    preloadSounds();
  }, []);

  /* ── Scroll event log to bottom ── */
  useEffect(() => {
    eventLogRef.current?.scrollTo({ top: eventLogRef.current.scrollHeight, behavior: "smooth" });
  }, [eventLog]);

  /* ── Scroll move log to bottom when game state changes ── */
  useEffect(() => {
    moveLogRef.current?.scrollTo({ top: moveLogRef.current.scrollHeight, behavior: "smooth" });
  }, [game]);

  /* ── Cleanup polling on unmount ── */
  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  /**
   * Check if a standard king move would land on a square attacked by
   * the opponent's chaos-modified pieces.  We simulate the king on
   * the target square first so sliding-piece rays update correctly.
   */
  const isKingMoveChaosUnsafe = useCallback(
    (g: Chess, from: string, to: string): boolean => {
      const turnColor = g.turn() as Color;
      const oppColor: Color = turnColor === "w" ? "b" : "w";
      const isPlayerTurn =
        (playerColor === "white" && turnColor === "w") ||
        (playerColor === "black" && turnColor === "b");
      const oppMods = isPlayerTurn ? chaosState.aiModifiers : chaosState.playerModifiers;
      if (oppMods.length === 0) return false;

      // Build a temp position with the king already on the target square
      const tmp = new Chess(g.fen());
      tmp.remove(from as any);
      if (tmp.get(to as any)) tmp.remove(to as any);
      tmp.put({ type: "k", color: turnColor }, to as any);

      const chaosAttacked = getChaosAttackedSquares(tmp, oppMods, oppColor, chaosState.assignedSquares ?? undefined);
      return chaosAttacked.has(to as any);
    },
    [playerColor, chaosState],
  );

  /* ── Recompute chaos moves when board/modifiers change ── */
  const recomputeChaosMoves = useCallback(
    (g: Chess, cs: ChaosState) => {
      const isPlayerTurn =
        (playerColor === "white" && g.turn() === "w") ||
        (playerColor === "black" && g.turn() === "b");
      if (isPlayerTurn) {
        const chaosMvs = getChaosMoves(g, cs.playerModifiers, g.turn() as Color, cs.assignedSquares);
        setAvailableChaosMoves(chaosMvs);
      } else {
        setAvailableChaosMoves([]);
      }
    },
    [playerColor],
  );

  /* ── Helper: add move to log ── */
  const addMoveToLog = useCallback((g: Chess, san: string, moveColor: "w" | "b") => {
    setMoveLog((prev) => {
      const copy = [...prev];
      const mn = moveColor === "w" ? g.moveNumber() - 1 : g.moveNumber();
      const existing = copy.find((e) => e.moveNumber === mn);
      if (moveColor === "w") {
        if (existing) existing.white = san;
        else copy.push({ moveNumber: mn, white: san });
      } else {
        if (existing) existing.black = san;
        else copy.push({ moveNumber: mn, black: san });
      }
      return copy;
    });
  }, []);

  /* ── Check for game end ── */
  const checkGameEnd = useCallback((g: Chess) => {
    if (g.isCheckmate()) {
      const winner = g.turn() === "w" ? "black" : "white";
      setGameResult(winner);
      setGameStatus("game-over");
      setEndReason("Checkmate");
      const youWin = winner === playerColor;
      setEventLog((prev) => [
        ...prev,
        {
          type: "chaos",
          message: `♚ Checkmate! ${winner === "white" ? "White" : "Black"} wins!`,
          icon: "♚",
          pepe: youWin ? PEPE.gigachad : PEPE.gamercry,
        },
      ]);
      if (youWin) {
        playSound("airhorn");
        spawnPepe(PEPE.gigachad);
        setTimeout(() => spawnPepe(PEPE.clap), 400);
      } else {
        playSound("mario-death");
        spawnPepe(PEPE.gamercry);
      }
      return true;
    }
    if (g.isStalemate() || g.isDraw() || g.isThreefoldRepetition() || g.isInsufficientMaterial()) {
      setGameResult("draw");
      setGameStatus("game-over");
      const reason = g.isStalemate()
        ? "Stalemate"
        : g.isInsufficientMaterial()
        ? "Insufficient Material"
        : g.isThreefoldRepetition()
        ? "Threefold Repetition"
        : "Draw";
      setEndReason(reason);
      setEventLog((prev) => [
        ...prev,
        {
          type: "info",
          message: g.isStalemate()
            ? "½-½ Stalemate!"
            : g.isInsufficientMaterial()
            ? "½-½ Insufficient material."
            : "½-½ Draw.",
          icon: "🤝",
          pepe: PEPE.hmm,
        },
      ]);
      playSound("sad-trombone");
      return true;
    }
    return false;
  }, [playerColor, spawnPepe]);

  /* ── Check draft trigger after a full move ── */
  const checkDraft = useCallback(
    (g: Chess, state: ChaosState) => {
      const fullMove = g.moveNumber();
      const phase = checkDraftTrigger(fullMove, state);
      if (phase > 0 && phase > prevPhaseRef.current) {
        const isMultiplayer = gameMode !== "ai";

        if (isMultiplayer) {
          // Staggered drafting: the player whose turn it is now picks immediately
          // (draft triggers after Black's move, so White is next → White drafts now)
          // Black will be prompted when they receive White's draftStep=1 broadcast.
          if (playerColor === "white") {
            // White drafts immediately
            setPendingPhase(phase);
            const choices = rollDraftChoices(phase, state.playerModifiers);
            setChaosState((prev) => ({
              ...prev,
              isDrafting: true,
              draftingSide: "player",
              draftChoices: choices,
            }));
            setGameStatus("drafting");
            setWaitingForOpponentDraft(false);
            setEventLog((prev) => [
              ...prev,
              {
                type: "draft",
                message: `⏸️ Turn ${fullMove} — CHAOS DRAFT Phase ${phase}! Your turn to draft.`,
                icon: "⏸️",
                pepe: phase <= 2 ? PEPE.think : phase <= 4 ? PEPE.shocked : PEPE.galaxybrain,
              },
            ]);
            playSound("record-scratch");
            spawnPepe(phase >= 4 ? PEPE.shocked : PEPE.bigeyes);
          }
          // Black: no action here — Black picks when White's broadcast arrives
        } else {
          // AI mode: both draft simultaneously (existing behavior)
          setPendingPhase(phase);
          const choices = rollDraftChoices(phase, state.playerModifiers);
          setChaosState((prev) => ({
            ...prev,
            isDrafting: true,
            draftingSide: "player",
            draftChoices: choices,
          }));
          setGameStatus("drafting");
          setEventLog((prev) => [
            ...prev,
            {
              type: "draft",
              message: `⏸️ Turn ${fullMove} — CHAOS DRAFT Phase ${phase}! Choose your modifier.`,
              icon: "⏸️",
              pepe: phase <= 2 ? PEPE.think : phase <= 4 ? PEPE.shocked : PEPE.galaxybrain,
            },
          ]);
          playSound("record-scratch");
          spawnPepe(phase >= 4 ? PEPE.shocked : PEPE.bigeyes);
        }
        return true;
      }
      return false;
    },
    [spawnPepe, gameMode, playerColor],
  );

  /* ── Apply post-move effects (collateral rook, nuclear queen) ── */
  const applyPostMove = useCallback(
    (g: Chess, from: CbSquare, to: CbSquare, captured: boolean, pieceType: PieceSymbol, color: Color, mods: ChaosModifier[]) => {
      const result = applyPostMoveEffects(g, from as any, to as any, captured, pieceType, color, mods);
      if (result) {
        if (mods.some((m) => m.id === "collateral-rook") && pieceType === "r" && captured) {
          setEventLog((prev) => [...prev, { type: "chaos", message: "💥 Collateral Damage! The rook destroyed the piece behind its target!", icon: "💥", pepe: PEPE.firesgun }]);
          spawnPepe(PEPE.firesgun);
          playSound("vine-boom");
        }
        if (mods.some((m) => m.id === "nuclear-queen") && pieceType === "q" && captured) {
          setEventLog((prev) => [...prev, { type: "chaos", message: "☢️ NUCLEAR QUEEN! All surrounding pieces destroyed!", icon: "☢️", pepe: PEPE.madpuke }]);
          spawnPepe(PEPE.madpuke);
          playSound("airhorn");
        }
        return result;
      }
      return g;
    },
    [spawnPepe],
  );

  /* ── AI move (with chaos modifiers) ── */
  const makeAiMove = useCallback(
    async (g: Chess, cs: ChaosState) => {
      if (g.isGameOver()) return;
      setIsThinking(true);

      try {
        // AI can also use chaos moves
        const aiColor = playerColor === "white" ? "b" : "w";
        const aiChaosMoves = getChaosMoves(g, cs.aiModifiers, aiColor as Color);

        // Evaluate chaos moves with Stockfish — only use if genuinely good
        // 35% chance to even consider chaos moves (prevents spamming)
        if (aiChaosMoves.length > 0 && Math.random() < 0.35) {
          // Get normal Stockfish eval as baseline
          const normalResult = await stockfishPool.evaluateFen(g.fen(), aiDepth);
          const normalEval = normalResult?.cp ?? 0; // from AI's (side-to-move) perspective

          // Evaluate a random sample of chaos moves (max 4 for speed)
          const evalDepth = Math.min(aiDepth, 10);
          const sample =
            aiChaosMoves.length <= 4
              ? aiChaosMoves
              : [...aiChaosMoves].sort(() => Math.random() - 0.5).slice(0, 4);

          type ScoredChaos = { move: ChaosMove; eval: number; game: Chess };
          const scored: ScoredChaos[] = [];

          for (const cm of sample) {
            const newGame = executeChaosMove(g, cm, cs.aiModifiers);
            if (!newGame) continue;
            // Eval the resulting position — cp is from the player's perspective (side to move after AI's chaos move)
            const er = await stockfishPool.evaluateFen(newGame.fen(), evalDepth);
            if (er) scored.push({ move: cm, eval: -(er.cp ?? 0), game: newGame });
          }

          if (scored.length > 0) {
            // Pick the best-evaluated chaos move
            scored.sort((a, b) => b.eval - a.eval);
            const best = scored[0];

            // Only use chaos move if it's at least as good as normal play (max 30cp worse)
            if (best.eval >= normalEval - 30) {
              const newGame = best.game;
              const chaosMove = best.move;
              const label = chaosMove.label;
              addMoveToLog(newGame, `⚡${label.split("(")[0].trim()}`, aiColor as "w" | "b");
              setLastMoveHighlight({
                [chaosMove.from]: { backgroundColor: "rgba(255, 100, 0, 0.4)" },
                [chaosMove.to]: { backgroundColor: "rgba(255, 100, 0, 0.4)" },
              });
              setEventLog((prev) => [...prev, { type: "chaos", message: `🤖 AI used: ${chaosMove.label}`, icon: "🤖", pepe: PEPE.shocked }]);
              playSound(pickRandom(AI_CHAOS_SOUNDS));

              // Update tracked pieces
              let cs2 = updateTrackedPieces(cs, chaosMove.from, chaosMove.to, chaosMove.type === "capture");
              let activeGame = newGame;

              // Check player's king-shield (AI moved, player may be in check)
              if (activeGame.isCheck()) {
                if (cs2.playerModifiers.some((m) => m.id === "king-shield")) {
                  const shielded = applyKingShield(activeGame, activeGame.turn() as Color);
                  if (shielded) {
                    activeGame = shielded;
                    cs2 = { ...cs2, playerModifiers: cs2.playerModifiers.filter((m) => m.id !== "king-shield") };
                    setEventLog((prev) => [...prev, { type: "chaos" as const, message: "🛡️ Your Royal Guard blocked the check!", icon: "🛡️", pepe: PEPE.galaxybrain }]);
                    playSound("vine-boom");
                  }
                }
              }
              setChaosState(cs2);
              setGame(activeGame);
              setIsThinking(false);
              if (!checkGameEnd(activeGame)) {
                checkDraft(activeGame, cs2);
                recomputeChaosMoves(activeGame, cs2);
              }
              return;
            }
          }
        }

        // Chaos-threat-aware Stockfish move
        // Get top 5 candidate moves, then pick the one with the best
        // eval after accounting for the player's chaos threats
        const playerColor_ = playerColor === "white" ? "w" : "b";
        const hasPlayerChaosMods = cs.playerModifiers.length > 0;
        const topMoves = hasPlayerChaosMods
          ? await stockfishPool.getTopMoves(g.fen(), 5, aiDepth)
          : [];

        let bestUci: string | null = null;

        if (hasPlayerChaosMods && topMoves.length > 0) {
          // Evaluate each candidate for chaos vulnerability
          let bestAdjusted = -Infinity;
          for (const candidate of topMoves) {
            const uci = candidate.bestMove ?? candidate.pvMoves[0];
            if (!uci) continue;
            // Simulate the move
            const tmpGame = new Chess(g.fen());
            const cf = uci.slice(0, 2);
            const ct = uci.slice(2, 4);
            const cp = uci.length > 4 ? uci[4] : undefined;
            try { tmpGame.move({ from: cf, to: ct, promotion: cp }); } catch { continue; }
            // Compute chaos threat penalty from the resulting position
            const penalty = computeChaosThreatPenalty(tmpGame, cs.playerModifiers, playerColor_ as Color, cs.assignedSquares ?? undefined);
            const adjusted = candidate.cp - penalty;
            if (adjusted > bestAdjusted) {
              bestAdjusted = adjusted;
              bestUci = uci;
            }
          }
        }

        // Fallback to single best move if multi-PV didn't yield anything
        if (!bestUci) {
          const result = await stockfishPool.evaluateFen(g.fen(), aiDepth);
          bestUci = result?.bestMove ?? null;
        }

        if (!bestUci) {
          setIsThinking(false);
          return;
        }

        const from = bestUci.slice(0, 2) as CbSquare;
        const to = bestUci.slice(2, 4) as CbSquare;
        const promotion = bestUci.length > 4 ? bestUci[4] : undefined;

        const pieceAtFrom = g.get(from as any);

        // Block AI king moves into chaos-attacked squares
        if (pieceAtFrom && pieceAtFrom.type === "k") {
          const aiTurn = g.turn() as Color;
          const playerC: Color = playerColor === "white" ? "w" : "b";
          if (cs.playerModifiers.length > 0) {
            const tmp = new Chess(g.fen());
            tmp.remove(from as any);
            if (tmp.get(to as any)) tmp.remove(to as any);
            tmp.put({ type: "k", color: aiTurn }, to as any);
            const chaosAttacked = getChaosAttackedSquares(tmp, cs.playerModifiers, playerC, cs.assignedSquares ?? undefined);
            if (chaosAttacked.has(to as any)) {
              // Unsafe king move — try a random legal non-king move instead
              const fallbackMoves = g.moves({ verbose: true }).filter((m) => m.piece !== "k");
              if (fallbackMoves.length > 0) {
                const fb = fallbackMoves[Math.floor(Math.random() * fallbackMoves.length)];
                bestUci = fb.lan;
              } else {
                // Only king moves available — let it go (might be forced)
              }
            }
          }
        }

        // Re-parse in case bestUci changed from fallback
        const finalFrom = bestUci!.slice(0, 2) as CbSquare;
        const finalTo = bestUci!.slice(2, 4) as CbSquare;
        const finalPromo = bestUci!.length > 4 ? bestUci![4] : undefined;
        const finalPieceAtFrom = g.get(finalFrom as any);

        const moveResult = g.move({ from: finalFrom, to: finalTo, promotion: finalPromo });
        if (!moveResult) {
          setIsThinking(false);
          return;
        }

        // Sound
        if (g.isCheck()) playSound("check");
        else if (moveResult.captured) playSound("capture");
        else playSound("move");

        // Track captured pawns
        if (moveResult.captured === "p") {
          setCapturedPawns((prev) => ({
            ...prev,
            [moveResult.color === "w" ? "b" : "w"]: prev[moveResult.color === "w" ? "b" as const : "w" as const] + 1,
          }));
        }

        // Highlight
        setLastMoveHighlight({
          [finalFrom]: { backgroundColor: "rgba(255, 170, 0, 0.3)" },
          [finalTo]: { backgroundColor: "rgba(255, 170, 0, 0.3)" },
        });

        addMoveToLog(g, moveResult.san, moveResult.color);

        // Apply post-move chaos effects
        const aiMods = cs.aiModifiers;
        let finalGame: Chess = g;
        if (moveResult.captured && finalPieceAtFrom) {
          const afterEffects = applyPostMove(g, finalFrom, finalTo, true, finalPieceAtFrom.type, finalPieceAtFrom.color as Color, aiMods);
          if (afterEffects !== g) {
            finalGame = afterEffects;
          }
        }

        // Update tracked pieces
        let cs2 = updateTrackedPieces(cs, finalFrom, finalTo, !!moveResult.captured);
        let activeGame2 = new Chess(finalGame.fen());

        // Check player's king-shield (AI moved, player may be in check)
        if (activeGame2.isCheck()) {
          if (cs2.playerModifiers.some((m) => m.id === "king-shield")) {
            const shielded = applyKingShield(activeGame2, activeGame2.turn() as Color);
            if (shielded) {
              activeGame2 = shielded;
              cs2 = { ...cs2, playerModifiers: cs2.playerModifiers.filter((m) => m.id !== "king-shield") };
              setEventLog((prev) => [...prev, { type: "chaos" as const, message: "🛡️ Your Royal Guard blocked the check!", icon: "🛡️", pepe: PEPE.galaxybrain }]);
              playSound("vine-boom");
            }
          }
        }
        setChaosState(cs2);
        setGame(activeGame2);

        if (!checkGameEnd(activeGame2)) {
          checkDraft(activeGame2, cs2);
          recomputeChaosMoves(activeGame2, cs2);
        }
      } catch (err) {
        console.warn("[Chaos AI] Engine error:", err);
      }

      setIsThinking(false);
    },
    [playerColor, aiDepth, checkGameEnd, checkDraft, addMoveToLog, applyPostMove, recomputeChaosMoves, chaosState],
  );

  /* ── Start game ── */
  const startGame = useCallback(
    (color: "white" | "black", mode: GameMode = "ai") => {
      const g = new Chess();
      setGame(g);
      setPlayerColor(color);
      setGameMode(mode);
      setGameStatus("playing");
      setGameResult(null);
      const cs = createChaosState();
      setChaosState(cs);
      setMoveLog([]);
      setFloatingPepes([]);
      setCapturedPawns({ w: 0, b: 0 });
      setAvailableChaosMoves([]);
      setEventLog([
        { type: "info", message: `⚡ Chaos Chess begins! ${mode === "ai" ? "vs Stockfish" : "vs Player"}. Modifiers appear at turns 5, 10, 15, 20, 25.`, icon: "⚡", pepe: PEPE.hyped },
      ]);
      playSound("reveal-stinger");
      setSelectedSquare(null);
      setLegalMoveSquares({});
      setLastMoveHighlight({});
      setEndReason("");
      setDrawOfferSent(false);
      setDrawOfferReceived(false);
      setRematchRequested(false);
      setRematchReceived(false);
      triggeredDraftForPhaseRef.current = -1;
      recomputeChaosMoves(g, cs);

      if (mode === "ai" && color === "black") {
        setTimeout(() => makeAiMove(g, cs), AI_MOVE_DELAY);
      }
    },
    [makeAiMove, recomputeChaosMoves],
  );

  /* ── Multiplayer: Create room ── */
  const createRoom = useCallback(async (color: "white" | "black") => {
    try {
      const res = await fetch("/api/chaos/create", {
        method: "POST",
        headers: chaosHeaders(true),
        body: JSON.stringify({ hostColor: color }),
      });
      const data = await res.json();
      if (data.error) {
        setEventLog((prev) => [...prev, { type: "info", message: `❌ ${data.error}`, icon: "❌" }]);
        return;
      }
      setRoomId(data.roomId);
      setRoomCode(data.roomCode);
      setPlayerColor(color);
      setGameMode("friend");
      setGameStatus("waiting");
      setOpponentLabel("Waiting for friend…");
      setEventLog([{ type: "info", message: `🏠 Room created! Code: ${data.roomCode}. Share it with a friend!`, icon: "🏠", pepe: PEPE.detective }]);

      // Start polling for guest
      startPolling(data.roomId, color);
    } catch {
      setEventLog((prev) => [...prev, { type: "info", message: "❌ Failed to create room. Are you signed in?", icon: "❌" }]);
    }
  }, []);

  /* ── Multiplayer: Join room ── */
  const joinRoom = useCallback(async () => {
    if (joinCode.length !== 6) return;
    try {
      const res = await fetch("/api/chaos/join", {
        method: "POST",
        headers: chaosHeaders(true),
        body: JSON.stringify({ roomCode: joinCode.toUpperCase() }),
      });
      const data = await res.json();
      if (data.error) {
        setEventLog((prev) => [...prev, { type: "info", message: `❌ ${data.error}`, icon: "❌" }]);
        return;
      }
      setRoomId(data.roomId);
      setRoomCode(joinCode.toUpperCase());
      const guestColor = data.hostColor === "white" ? "black" : "white";
      setPlayerColor(guestColor as "white" | "black");
      setGameMode("friend");
      setGameStatus("playing");
      setOpponentLabel("Friend");
      const rawCs = data.chaosState ? data.chaosState as ChaosState : createChaosState();
      const cs = fromServerChaosState(rawCs, guestColor as "white" | "black");
      setChaosState(cs);
      const g = new Chess(data.fen);
      setGame(g);
      setMoveLog([]);
      setFloatingPepes([]);
      setCapturedPawns({ w: 0, b: 0 });
      setEventLog([{ type: "info", message: `🎮 Joined room ${joinCode.toUpperCase()}! You are ${guestColor}. Game on!`, icon: "🎮", pepe: PEPE.hyped }]);
      playSound("reveal-stinger");
      recomputeChaosMoves(g, cs);

      // Start slow fallback polling + notify host via WebSocket
      startPolling(data.roomId, guestColor);
      // WebSocket join notification is sent after usePartyRoom connects (roomId is set above)
      setTimeout(() => {
        if (partySendRef.current) {
          partySendRef.current({ type: "join", guestId: "" });
        }
      }, 500); // brief delay to let the socket connect
    } catch {
      setEventLog((prev) => [...prev, { type: "info", message: "❌ Failed to join room.", icon: "❌" }]);
    }
  }, [joinCode, recomputeChaosMoves]);

  /* ── PartyKit WebSocket: real-time sync ── */
  const onPartyMessage = useCallback((msg: PartyMessage) => {
    // Presence: detect opponent joining via connection count
    if (msg.type === "presence") {
      if (msg.count >= 2) {
        setGameStatus((prev) => {
          if (prev === "waiting") {
            setOpponentLabel("Opponent");
            setEventLog((p) => [...p, { type: "info", message: "🎮 Opponent connected! Game on!", icon: "🎮", pepe: PEPE.hyped }]);
            playSound("reveal-stinger");
            return "playing";
          }
          return prev;
        });
      }
      return;
    }

    if (msg.type === "join") {
      // Fallback join detection (if presence didn't fire first)
      setGameStatus((prev) => {
        if (prev === "waiting") {
          setOpponentLabel("Opponent");
          setEventLog((p) => [...p, { type: "info", message: "🎮 Opponent joined! Game on!", icon: "🎮", pepe: PEPE.hyped }]);
          playSound("reveal-stinger");
          return "playing";
        }
        return prev;
      });
      return;
    }

    if (msg.type === "resign") {
      setGameResult(msg.winner as GameResult);
      setGameStatus("game-over");
      setEndReason("Opponent Resigned");
      setEventLog((prev) => [...prev, { type: "info", message: `🏳️ Opponent resigned! ${msg.winner === "white" ? "White" : "Black"} wins.`, icon: "🏳️", pepe: PEPE.hyped }]);
      playSound("reveal-stinger");
      if (pollRef.current) clearInterval(pollRef.current);
      return;
    }

    if (msg.type === "draw-offer") {
      setDrawOfferReceived(true);
      setEventLog((prev) => [...prev, { type: "info", message: "🤝 Opponent offers a draw.", icon: "🤝", pepe: PEPE.think }]);
      playSound("reveal-stinger");
      return;
    }

    if (msg.type === "draw-accept") {
      setGameResult("draw");
      setGameStatus("game-over");
      setEndReason("Draw by Agreement");
      setDrawOfferSent(false);
      setEventLog((prev) => [...prev, { type: "info", message: "🤝 Draw accepted!", icon: "🤝", pepe: PEPE.pepeok }]);
      playSound("reveal-stinger");
      if (pollRef.current) clearInterval(pollRef.current);
      return;
    }

    if (msg.type === "draw-decline") {
      setDrawOfferSent(false);
      setEventLog((prev) => [...prev, { type: "info", message: "❌ Opponent declined the draw offer.", icon: "❌", pepe: PEPE.sadge }]);
      return;
    }

    if (msg.type === "rematch") {
      if (rematchRequested) {
        // Both players want a rematch — auto-start
        const g = new Chess();
        setGame(g);
        setGameStatus("playing");
        setGameResult(null);
        setEndReason("");
        const cs = createChaosState();
        setChaosState(cs);
        setMoveLog([]);
        setFloatingPepes([]);
        setCapturedPawns({ w: 0, b: 0 });
        setAvailableChaosMoves([]);
        setSelectedSquare(null);
        setLegalMoveSquares({});
        setLastMoveHighlight({});
        setDrawOfferSent(false);
        setDrawOfferReceived(false);
        setRematchRequested(false);
        setRematchReceived(false);
        triggeredDraftForPhaseRef.current = -1;
        // Swap colors
        const newColor = playerColor === "white" ? "black" : "white";
        setPlayerColor(newColor);
        recomputeChaosMoves(g, cs);
        setEventLog([{ type: "info", message: "⚡ Rematch started! Good luck!", icon: "⚡", pepe: PEPE.hyped }]);
        playSound("reveal-stinger");
      } else {
        setRematchReceived(true);
        setEventLog((prev) => [...prev, { type: "info", message: "🔄 Opponent wants a rematch!", icon: "🔄", pepe: PEPE.hyped }]);
        playSound("reveal-stinger");
      }
      return;
    }

    if (msg.type === "move" || msg.type === "draft") {
      const data = msg as PartyMessage & { fen?: string; chaosState?: unknown; lastMoveFrom?: string; lastMoveTo?: string; capturedPawnsWhite?: number; capturedPawnsBlack?: number; status?: string };
      if (!data.fen) return;
      // Don't apply opponent updates while the local player is actively picking a draft
      if (gameStatusRef.current === "drafting") return;

      const g = new Chess(data.fen);
      const oldFen = lastFenRef.current;
      lastFenRef.current = data.fen;
      setGame(g);

      // Process chaosState (perspective swap) — sequential draft handling
      if (data.chaosState) {
        const serverCs = data.chaosState as ChaosState;
        const incoming = fromServerChaosState(serverCs, playerColor);
        const draftStep = serverCs.draftStep ?? 0;

        // ── Sequential draft: White drafts first (step 1), then Black (step 2) ──

        if (draftStep === 1 && playerColor === "black" && !justDraftedRef.current) {
          // White just drafted (step 1) → I'm Black: show reveal, then trigger my draft
          const phaseForDraft = incoming.currentPhase + 1;
          if (triggeredDraftForPhaseRef.current === phaseForDraft) {
            return; // Already triggered — don't overwrite active draft choices
          }
          triggeredDraftForPhaseRef.current = phaseForDraft;
          const oppPick = incoming.aiModifiers[incoming.aiModifiers.length - 1];
          if (oppPick) {
            // Queue my own draft to fire after Black's own move
            const choices = rollDraftChoices(phaseForDraft, incoming.playerModifiers);
            pendingDraftAfterRevealRef.current = { phase: phaseForDraft, choices, chaosState: incoming };

            // Show opponent's reveal
            setOpponentDraftReveal({ opponentPick: oppPick, phase: phaseForDraft });
            setEventLog((prev) => [
              ...prev,
              { type: "modifier" as const, message: `⚔️ Opponent drafted: ${oppPick.icon} ${oppPick.name} — ${oppPick.description}`, icon: oppPick.icon, pepe: tierPepe(oppPick.tier) },
            ]);
            spawnPepe(tierPepe(oppPick.tier));
          }
          setChaosState(incoming);
          return;
        }

        if (draftStep === 2 && playerColor === "white" && !justDraftedRef.current) {
          // Black just drafted (step 2) → I'm White: show reveal, then resume game
          const phaseForDraft = incoming.currentPhase;
          if (triggeredDraftForPhaseRef.current === phaseForDraft) {
            // Already triggered for this phase — ignore duplicate
            setChaosState({ ...incoming, draftStep: 0 });
            return;
          }
          triggeredDraftForPhaseRef.current = phaseForDraft;
          const oppPick = incoming.aiModifiers[incoming.aiModifiers.length - 1];
          if (oppPick) {
            setOpponentDraftReveal({ opponentPick: oppPick, phase: incoming.currentPhase });
            setEventLog((prev) => [
              ...prev,
              { type: "modifier" as const, message: `⚔️ Opponent drafted: ${oppPick.icon} ${oppPick.name} — ${oppPick.description}`, icon: oppPick.icon, pepe: tierPepe(oppPick.tier) },
            ]);
            spawnPepe(tierPepe(oppPick.tier));
          }
          // Both have drafted — resume game
          setChaosState({ ...incoming, draftStep: 0 });
          setGameStatus("playing");
          setWaitingForOpponentDraft(false);
          setPendingPhase(0);
          prevPhaseRef.current = incoming.currentPhase;
          setEventLog((prev) => [
            ...prev,
            { type: "info" as const, message: "⏯️ Both players have drafted! Game resumed!", icon: "▶️" },
          ]);
          recomputeChaosMoves(g, incoming);
          return;
        }

        // Clear justDrafted flag when we see our own draft reflected
        if (justDraftedRef.current) {
          justDraftedRef.current = false;
        }

        setChaosState(incoming);
      }

      // Move highlight + tracked piece update
      if (data.lastMoveFrom && data.lastMoveTo) {
        setLastMoveHighlight({
          [data.lastMoveFrom]: { backgroundColor: "rgba(255, 170, 0, 0.3)" },
          [data.lastMoveTo]: { backgroundColor: "rgba(255, 170, 0, 0.3)" },
        });
        playSound("move");
        if (oldFen) {
          const oldBoard = new Chess(oldFen);
          const hadPiece = oldBoard.get(data.lastMoveTo as any);
          const wasCaptured = !!hadPiece;
          setChaosState((prev) => updateTrackedPieces(prev, data.lastMoveFrom!, data.lastMoveTo!, wasCaptured));
        }
      }
      if (data.capturedPawnsWhite !== undefined) {
        setCapturedPawns({ w: data.capturedPawnsWhite ?? 0, b: data.capturedPawnsBlack ?? 0 });
      }

      // King-shield
      let activeGame = g;
      if (activeGame.isCheck()) {
        const checkedColor: Color = activeGame.turn() as Color;
        const isOurKingChecked = (playerColor === "white" && checkedColor === "w") || (playerColor === "black" && checkedColor === "b");
        setChaosState((prev) => {
          const mods = isOurKingChecked ? prev.playerModifiers : prev.aiModifiers;
          if (mods.some((m) => m.id === "king-shield")) {
            const shielded = applyKingShield(activeGame, checkedColor);
            if (shielded) {
              activeGame = shielded;
              setGame(shielded);
              setEventLog((p) => [...p, { type: "chaos" as const, message: "🛡️ Royal Guard activated! Check blocked — attacker destroyed!", icon: "🛡️", pepe: PEPE.galaxybrain }]);
              playSound("vine-boom");
              return {
                ...prev,
                ...(isOurKingChecked
                  ? { playerModifiers: prev.playerModifiers.filter((m) => m.id !== "king-shield") }
                  : { aiModifiers: prev.aiModifiers.filter((m) => m.id !== "king-shield") }),
              };
            }
          }
          return prev;
        });
      }

      // Check game end / draft
      if (activeGame.isCheckmate() || activeGame.isStalemate() || activeGame.isDraw()) {
        checkGameEnd(activeGame);
        if (pollRef.current) clearInterval(pollRef.current);
      } else if (data.chaosState) {
        // Only recompute moves — checkDraft fires from handlePlayerMove (your own move) only
        const cs2 = fromServerChaosState(data.chaosState as ChaosState, playerColor);
        recomputeChaosMoves(activeGame, cs2);
      }

      if (data.status === "finished") {
        if (pollRef.current) clearInterval(pollRef.current);
      }
    }
  }, [playerColor, checkGameEnd, recomputeChaosMoves, spawnPepe]);

  const { send: partySend, isConnected: partyConnected } = usePartyRoom(
    gameMode !== "ai" ? roomId : null,
    onPartyMessage,
  );
  // Keep ref in sync so sendMoveToServer (memoized) can use it
  partySendRef.current = partySend;

  // Callback refs — updated every render so the polling setInterval always uses
  // the latest version of these functions without needing to recreate the interval.
  const checkGameEndCbRef = useRef(checkGameEnd);
  checkGameEndCbRef.current = checkGameEnd;
  const recomputeChaosMovesCbRef = useRef(recomputeChaosMoves);
  recomputeChaosMovesCbRef.current = recomputeChaosMoves;
  // Track current gameStatus in a ref so polling/WS guards can read it from stale closures
  const gameStatusRef = useRef(gameStatus);
  gameStatusRef.current = gameStatus;
  // Track current game in a ref so polling can compare move counts against local state
  const gameRef = useRef(game);
  gameRef.current = game;

  /* ── Polling for multiplayer state (slow fallback) ── */
  const startPolling = useCallback((rId: string, myColor: string) => {
    if (pollRef.current) clearInterval(pollRef.current);
    lastFenRef.current = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

    pollRef.current = setInterval(async () => {
      try {
        // Don't poll while the user is actively picking a draft — avoids wiping draft choices
        if (gameStatusRef.current === "drafting") return;
        const res = await fetch(`/api/chaos/move?roomId=${rId}`, { headers: chaosHeaders() });
        if (!res.ok) return;
        const data = await res.json();

        // Room got a guest — start the game
        if (data.status === "playing" && data.guestId) {
          setGameStatus((prev) => {
            if (prev === "waiting") {
              setOpponentLabel("Opponent");
              setEventLog((p) => [...p, { type: "info", message: "🎮 Opponent joined! Game on!", icon: "🎮", pepe: PEPE.hyped }]);
              playSound("reveal-stinger");
              const rawCs = data.chaosState ? data.chaosState as ChaosState : createChaosState();
              const cs = fromServerChaosState(rawCs, myColor as "white" | "black");
              setChaosState(cs);
              prevPhaseRef.current = cs.currentPhase;
              const g = new Chess(data.fen);
              setGame(g);
              return "playing";
            }
            return prev;
          });
        }

        // ── Check for draft state changes (may happen without FEN changing) ──
        if (data.chaosState) {
          const serverCs = data.chaosState as ChaosState;
          const incoming = fromServerChaosState(serverCs, myColor as "white" | "black");
          const draftStep = serverCs.draftStep ?? 0;

          if (draftStep === 1 && myColor === "black" && !justDraftedRef.current) {
            // White just drafted (step 1) → I'm Black: show reveal, then defer my draft
            const phaseForDraft = incoming.currentPhase + 1;
            if (triggeredDraftForPhaseRef.current !== phaseForDraft) {
              triggeredDraftForPhaseRef.current = phaseForDraft;
              const oppPick = incoming.aiModifiers[incoming.aiModifiers.length - 1];
              if (oppPick) {
                const choices = rollDraftChoices(phaseForDraft, incoming.playerModifiers);
                pendingDraftAfterRevealRef.current = { phase: phaseForDraft, choices, chaosState: incoming };
                setOpponentDraftReveal({ opponentPick: oppPick, phase: phaseForDraft });
                setEventLog((prev) => [
                  ...prev,
                  { type: "modifier" as const, message: `⚔️ Opponent drafted: ${oppPick.icon} ${oppPick.name} — ${oppPick.description}`, icon: oppPick.icon, pepe: tierPepe(oppPick.tier) },
                ]);
                spawnPepe(tierPepe(oppPick.tier));
              }
              // Only update state when first triggering — avoids wiping active draft choices on repeat polls
              setChaosState(incoming);
            }
            // If already triggered, skip setChaosState to not overwrite open draft modal
          } else if (draftStep === 2 && myColor === "white" && !justDraftedRef.current) {
            // Black just drafted (step 2) → I'm White: show reveal, then resume
            const phaseForDraft = incoming.currentPhase;
            if (triggeredDraftForPhaseRef.current !== phaseForDraft) {
              triggeredDraftForPhaseRef.current = phaseForDraft;
              const oppPick = incoming.aiModifiers[incoming.aiModifiers.length - 1];
              if (oppPick) {
                const g2 = new Chess(data.fen);
                setOpponentDraftReveal({ opponentPick: oppPick, phase: incoming.currentPhase });
                setEventLog((prev) => [
                  ...prev,
                  { type: "modifier" as const, message: `⚔️ Opponent drafted: ${oppPick.icon} ${oppPick.name} — ${oppPick.description}`, icon: oppPick.icon, pepe: tierPepe(oppPick.tier) },
                ]);
                spawnPepe(tierPepe(oppPick.tier));
                recomputeChaosMovesCbRef.current(g2, incoming);
              }
              setChaosState({ ...incoming, draftStep: 0 });
              setGameStatus("playing");
              setWaitingForOpponentDraft(false);
              setPendingPhase(0);
              prevPhaseRef.current = incoming.currentPhase;
              setEventLog((prev) => [
                ...prev,
                { type: "info" as const, message: "⏯️ Both players have drafted! Game resumed!", icon: "▶️" },
              ]);
            }
          }
          // Reset the justDrafted flag once we see the state reflected
          if (justDraftedRef.current) {
            justDraftedRef.current = false;
          }
        }

        // Check for new moves (FEN changed)
        if (data.fen && data.fen !== lastFenRef.current) {
          // Guard: skip if the DB returned a FEN behind our local state.
          // Compute total half-moves from FEN fields directly — Chess.history() on a
          // freshly-constructed instance is always [] so it can't be used here.
          // FEN format: "pieces side castling ep halfclock fullmove"
          // Total half-moves played = (fullmove - 1) * 2 + (side === 'b' ? 1 : 0)
          const fenHalfMoves = (fen: string) => {
            const p = fen.split(" ");
            return (parseInt(p[5] ?? "1", 10) - 1) * 2 + (p[1] === "b" ? 1 : 0);
          };
          const localFen = gameRef.current.fen();
          if (fenHalfMoves(data.fen) < fenHalfMoves(localFen)) {
            // DB is stale — do nothing; next poll will get the persisted FEN
            return;
          }

          const oldFen = lastFenRef.current;
          lastFenRef.current = data.fen;
          const g = new Chess(data.fen);
          setGame(g);

          // Apply chaosState if present (non-draft update)
          if (data.chaosState) {
            const serverCs = data.chaosState as ChaosState;
            const draftStep = serverCs.draftStep ?? 0;
            // Only apply as regular update if not a draft step we already handled above
            if (draftStep === 0) {
              const incoming = fromServerChaosState(serverCs, myColor as "white" | "black");
              setChaosState(incoming);
            }
          }

          if (data.lastMoveFrom && data.lastMoveTo) {
            setLastMoveHighlight({
              [data.lastMoveFrom]: { backgroundColor: "rgba(255, 170, 0, 0.3)" },
              [data.lastMoveTo]: { backgroundColor: "rgba(255, 170, 0, 0.3)" },
            });
            playSound("move");

            // Update tracked pieces for single-piece modifiers (archbishop/knook)
            if (oldFen) {
              const oldBoard = new Chess(oldFen);
              const hadPiece = oldBoard.get(data.lastMoveTo as any);
              const wasCaptured = !!hadPiece;
              setChaosState((prev) => updateTrackedPieces(prev, data.lastMoveFrom, data.lastMoveTo, wasCaptured));
            }
          }
          setCapturedPawns({ w: data.capturedPawnsWhite ?? 0, b: data.capturedPawnsBlack ?? 0 });

          // King-shield: if we or opponent are in check and have shield, activate it
          let activeGame = g;
          if (activeGame.isCheck()) {
            const checkedColor: Color = activeGame.turn() as Color;
            const isOurKingChecked = (myColor === "white" && checkedColor === "w") || (myColor === "black" && checkedColor === "b");
            setChaosState((prev) => {
              const mods = isOurKingChecked ? prev.playerModifiers : prev.aiModifiers;
              if (mods.some((m) => m.id === "king-shield")) {
                const shielded = applyKingShield(activeGame, checkedColor);
                if (shielded) {
                  activeGame = shielded;
                  setGame(shielded);
                  setEventLog((p) => [...p, { type: "chaos" as const, message: "🛡️ Royal Guard activated! Check blocked — attacker destroyed!", icon: "🛡️", pepe: PEPE.galaxybrain }]);
                  playSound("vine-boom");
                  return {
                    ...prev,
                    ...(isOurKingChecked
                      ? { playerModifiers: prev.playerModifiers.filter((m) => m.id !== "king-shield") }
                      : { aiModifiers: prev.aiModifiers.filter((m) => m.id !== "king-shield") }),
                  };
                }
              }
              return prev;
            });
          }

          // Check game end from FEN
          if (activeGame.isCheckmate() || activeGame.isStalemate() || activeGame.isDraw()) {
            checkGameEndCbRef.current(activeGame);
            if (pollRef.current) clearInterval(pollRef.current);
          } else {
            // Only recompute moves — checkDraft fires from handlePlayerMove (your own move only)
            const rawCs2 = data.chaosState ? data.chaosState as ChaosState : createChaosState();
            const cs2 = fromServerChaosState(rawCs2, myColor as "white" | "black");
            recomputeChaosMovesCbRef.current(activeGame, cs2);
          }
        }

        if (data.status === "finished") {
          if (pollRef.current) clearInterval(pollRef.current);
        }
      } catch {
        // Poll error — ignore
      }
    }, POLL_INTERVAL);
  }, [spawnPepe]);

  /* ── Send move to server (multiplayer) ── */
  const sendMoveToServer = useCallback(
    (g: Chess, from: string, to: string, cs: ChaosState) => {
      if (!roomId) return;
      // Convert to server perspective (white=playerModifiers, black=aiModifiers)
      const serverCs = toServerChaosState(cs, playerColor);
      const wsMsg: PartyMessage = from === "" && to === ""
        ? { type: "draft", chaosState: serverCs, fen: g.fen() }
        : {
            type: "move",
            fen: g.fen(),
            chaosState: serverCs,
            lastMoveFrom: from,
            lastMoveTo: to,
            capturedPawnsWhite: capturedPawns.w,
            capturedPawnsBlack: capturedPawns.b,
            status: g.isGameOver() ? "finished" : "playing",
          };

      // ── Broadcast via WebSocket FIRST for instant opponent sync ──
      if (partySendRef.current) {
        partySendRef.current(wsMsg);
      }
      lastFenRef.current = g.fen();

      // ── Persist to DB in the background (polling fallback) ──
      const payload = {
        roomId,
        from,
        to,
        newFen: g.fen(),
        chaosState: serverCs,
        lastMoveFrom: from,
        lastMoveTo: to,
        capturedPawnsWhite: capturedPawns.w,
        capturedPawnsBlack: capturedPawns.b,
        status: g.isGameOver() ? "finished" : "playing",
      };
      fetch("/api/chaos/move", {
        method: "POST",
        headers: chaosHeaders(true),
        body: JSON.stringify(payload),
      }).catch(() => { /* network error — polling will resync */ });
    },
    [roomId, capturedPawns, playerColor],
  );

  /* ── Player move ── */
  const handlePlayerMove = useCallback(
    (from: CbSquare, to: CbSquare) => {
      if (gameStatus !== "playing") return false;
      if (isThinking) return false;

      const isPlayerTurn =
        (playerColor === "white" && game.turn() === "w") ||
        (playerColor === "black" && game.turn() === "b");
      if (!isPlayerTurn) return false;

      // First check if this is a chaos move
      const chaosMove = availableChaosMoves.find(
        (m) => m.from === from && m.to === to,
      );

      if (chaosMove) {
        // If this chaos move needs a promotion choice, show picker first
        if (chaosMove.promotionChoice) {
          setPendingPromotion(chaosMove);
          return true;
        }

        // Block king chaos moves (e.g. King Ascension) into chaos-defended squares
        const pieceAtFromChaos = game.get(from as any);
        if (pieceAtFromChaos && pieceAtFromChaos.type === "k" && isKingMoveChaosUnsafe(game, from, to)) {
          return false;
        }

        const newGame = executeChaosMove(game, chaosMove, chaosState.playerModifiers);
        if (!newGame) return false;

        playSound("capture");
        setLastMoveHighlight({
          [from]: { backgroundColor: "rgba(168, 85, 247, 0.4)" },
          [to]: { backgroundColor: "rgba(168, 85, 247, 0.4)" },
        });
        setSelectedSquare(null);
        setLegalMoveSquares({});
        addMoveToLog(newGame, `⚡${chaosMove.label.split("(")[0].trim()}`, game.turn() as "w" | "b");
        setEventLog((prev) => [...prev, { type: "chaos", message: `⚡ You used: ${chaosMove.label}`, icon: "⚡", pepe: tierPepe("rare") }]);
        spawnPepe(PEPE.lmao);
        playSound("vine-boom");

        setGame(newGame);

        // Update tracked pieces
        let cs = updateTrackedPieces(chaosState, from, to, chaosMove.type === "capture");
        let activeGame = newGame;

        // Check opponent's king-shield
        if (activeGame.isCheck()) {
          if (cs.aiModifiers.some((m) => m.id === "king-shield")) {
            const shielded = applyKingShield(activeGame, activeGame.turn() as Color);
            if (shielded) {
              activeGame = shielded;
              setGame(shielded);
              cs = { ...cs, aiModifiers: cs.aiModifiers.filter((m) => m.id !== "king-shield") };
              setEventLog((prev) => [...prev, { type: "chaos" as const, message: "🛡️ Opponent's Royal Guard blocked your check!", icon: "🛡️", pepe: PEPE.galaxybrain }]);
              playSound("vine-boom");
            }
          }
        }
        setChaosState(cs);

        if (checkGameEnd(activeGame)) return true;
        const drafted = checkDraft(activeGame, cs);

        // Multiplayer: send to server
        if (gameMode !== "ai") {
          sendMoveToServer(activeGame, from, to, cs);
          // Staggered draft: fire Black's deferred draft pick after their move
          if (pendingDraftAfterRevealRef.current) {
            const deferred = pendingDraftAfterRevealRef.current;
            pendingDraftAfterRevealRef.current = null;
            setChaosState((prev) => ({ ...prev, ...deferred.chaosState, isDrafting: true, draftingSide: "player", draftChoices: deferred.choices }));
            setPendingPhase(deferred.phase);
            setGameStatus("drafting");
            setEventLog((prev) => [...prev, { type: "draft" as const, message: `⏸️ CHAOS DRAFT Phase ${deferred.phase}! Your turn to pick!`, icon: "⏸️", pepe: PEPE.think }]);
            playSound("record-scratch");
            spawnPepe(PEPE.bigeyes);
          }
        }

        if (!drafted && gameMode === "ai") {
          setTimeout(() => makeAiMove(activeGame, cs), AI_MOVE_DELAY);
        }
        recomputeChaosMoves(activeGame, cs);
        return true;
      }

      // Standard chess.js move
      let moveResult = null;
      const pieceAtFrom = game.get(from as any);

      // Block king moves into chaos-attacked squares
      if (pieceAtFrom && pieceAtFrom.type === "k" && isKingMoveChaosUnsafe(game, from, to)) {
        return false;
      }

      // Check if this is a promotion move (pawn reaching last rank)
      if (pieceAtFrom && pieceAtFrom.type === "p") {
        const lastRank = pieceAtFrom.color === "w" ? "8" : "1";
        if (to[1] === lastRank) {
          // Verify the move is legal (try with queen promotion)
          try {
            const tmp = new Chess(game.fen());
            const result = tmp.move({ from, to, promotion: "q" });
            if (result) {
              setPendingStdPromotion({ from, to });
              return true;
            }
          } catch { /* not a valid promotion */ }
        }
      }

      for (const promo of [undefined, "q", "r", "b", "n"] as const) {
        try {
          const tmp = new Chess(game.fen());
          const result = tmp.move({ from, to, promotion: promo });
          if (result) {
            moveResult = result;
            game.move({ from, to, promotion: promo });
            break;
          }
        } catch {
          continue;
        }
      }

      if (!moveResult) return false;

      // Sound
      if (game.isCheck()) playSound("check");
      else if (moveResult.captured) playSound("capture");
      else playSound("move");

      // Track captured pawns
      if (moveResult.captured === "p") {
        setCapturedPawns((prev) => ({
          ...prev,
          [moveResult.color === "w" ? "b" : "w"]: prev[moveResult.color === "w" ? "b" as const : "w" as const] + 1,
        }));
      }

      // Highlight
      setLastMoveHighlight({
        [from]: { backgroundColor: "rgba(255, 170, 0, 0.3)" },
        [to]: { backgroundColor: "rgba(255, 170, 0, 0.3)" },
      });
      setSelectedSquare(null);
      setLegalMoveSquares({});

      addMoveToLog(game, moveResult.san, moveResult.color);

      // Apply post-move chaos effects (collateral rook, nuclear queen)
      let finalGame: Chess = game;
      if (moveResult.captured && pieceAtFrom) {
        const afterEffects = applyPostMove(game, from, to, true, pieceAtFrom.type, pieceAtFrom.color as Color, chaosState.playerModifiers);
        if (afterEffects !== game) {
          finalGame = afterEffects;
        }
      }

      const newG = new Chess(finalGame.fen());

      // Update tracked pieces
      let cs2 = updateTrackedPieces(chaosState, from, to, !!moveResult.captured);
      let activeG = newG;

      // Check opponent's king-shield
      if (activeG.isCheck()) {
        if (cs2.aiModifiers.some((m) => m.id === "king-shield")) {
          const shielded = applyKingShield(activeG, activeG.turn() as Color);
          if (shielded) {
            activeG = shielded;
            cs2 = { ...cs2, aiModifiers: cs2.aiModifiers.filter((m) => m.id !== "king-shield") };
            setEventLog((prev) => [...prev, { type: "chaos" as const, message: "🛡️ Opponent's Royal Guard blocked your check!", icon: "🛡️", pepe: PEPE.galaxybrain }]);
            playSound("vine-boom");
          }
        }
      }
      setChaosState(cs2);
      setGame(activeG);

      if (checkGameEnd(activeG)) return true;

      const drafted = checkDraft(activeG, cs2);

      // Multiplayer: send to server
      if (gameMode !== "ai") {
        sendMoveToServer(activeG, from, to, cs2);
        // Staggered draft: fire Black's deferred draft pick after their move
        if (pendingDraftAfterRevealRef.current) {
          const deferred = pendingDraftAfterRevealRef.current;
          pendingDraftAfterRevealRef.current = null;
          setChaosState((prev) => ({ ...prev, ...deferred.chaosState, isDrafting: true, draftingSide: "player", draftChoices: deferred.choices }));
          setPendingPhase(deferred.phase);
          setGameStatus("drafting");
          setEventLog((prev) => [...prev, { type: "draft" as const, message: `⏸️ CHAOS DRAFT Phase ${deferred.phase}! Your turn to pick!`, icon: "⏸️", pepe: PEPE.think }]);
          playSound("record-scratch");
          spawnPepe(PEPE.bigeyes);
        }
      }

      if (!drafted && gameMode === "ai") {
        setTimeout(() => makeAiMove(activeG, cs2), AI_MOVE_DELAY);
      }
      recomputeChaosMoves(activeG, cs2);

      return true;
    },
    [game, gameStatus, playerColor, isThinking, chaosState, gameMode, availableChaosMoves, checkGameEnd, checkDraft, makeAiMove, addMoveToLog, applyPostMove, sendMoveToServer, spawnPepe, recomputeChaosMoves, isKingMoveChaosUnsafe],
  );

  /* ── Execute a pending chaos promotion after piece choice ── */
  const executePromotion = useCallback(
    (pieceType: "q" | "r" | "b" | "n") => {
      if (!pendingPromotion) return;
      const move = { ...pendingPromotion, spawnPiece: { type: pieceType as PieceSymbol, color: game.turn() as Color } };
      setPendingPromotion(null);

      const newGame = executeChaosMove(game, move, chaosState.playerModifiers);
      if (!newGame) return;

      const pieceName = pieceType === "q" ? "Queen" : pieceType === "r" ? "Rook" : pieceType === "b" ? "Bishop" : "Knight";
      playSound("capture");
      setLastMoveHighlight({
        [move.from]: { backgroundColor: "rgba(168, 85, 247, 0.4)" },
        [move.to]: { backgroundColor: "rgba(168, 85, 247, 0.4)" },
      });
      setSelectedSquare(null);
      setLegalMoveSquares({});
      addMoveToLog(newGame, `⚡Promo → ${pieceName}`, game.turn() as "w" | "b");
      setEventLog((prev) => [...prev, { type: "chaos", message: `⚡ Battlefield Promotion → ${pieceName}!`, icon: "⭐", pepe: tierPepe("epic") }]);
      spawnPepe(PEPE.lmao);
      playSound("vine-boom");

      setGame(newGame);

      if (checkGameEnd(newGame)) return;
      const drafted = checkDraft(newGame, chaosState);

      if (gameMode !== "ai") {
        sendMoveToServer(newGame, move.from, move.to, chaosState);
        // Staggered draft: fire Black's deferred draft pick after their move
        if (pendingDraftAfterRevealRef.current) {
          const deferred = pendingDraftAfterRevealRef.current;
          pendingDraftAfterRevealRef.current = null;
          setChaosState((prev) => ({ ...prev, ...deferred.chaosState, isDrafting: true, draftingSide: "player", draftChoices: deferred.choices }));
          setPendingPhase(deferred.phase);
          setGameStatus("drafting");
          setEventLog((prev) => [...prev, { type: "draft" as const, message: `⏸️ CHAOS DRAFT Phase ${deferred.phase}! Your turn to pick!`, icon: "⏸️", pepe: PEPE.think }]);
          playSound("record-scratch");
          spawnPepe(PEPE.bigeyes);
        }
      }

      if (!drafted && gameMode === "ai") {
        setTimeout(() => makeAiMove(newGame, chaosState), AI_MOVE_DELAY);
      }
      recomputeChaosMoves(newGame, chaosState);
    },
    [pendingPromotion, game, chaosState, gameMode, checkGameEnd, checkDraft, makeAiMove, addMoveToLog, sendMoveToServer, spawnPepe, recomputeChaosMoves],
  );

  /* ── Execute a pending standard promotion after piece choice ── */
  const executeStdPromotion = useCallback(
    (pieceType: "q" | "r" | "b" | "n") => {
      if (!pendingStdPromotion) return;
      const { from, to } = pendingStdPromotion;
      setPendingStdPromotion(null);

      const pieceAtFrom = game.get(from as any);
      let moveResult;
      try {
        moveResult = game.move({ from, to, promotion: pieceType });
      } catch { return; }
      if (!moveResult) return;

      if (game.isCheck()) playSound("check");
      else if (moveResult.captured) playSound("capture");
      else playSound("move");

      if (moveResult.captured === "p") {
        setCapturedPawns((prev) => ({
          ...prev,
          [moveResult.color === "w" ? "b" : "w"]: prev[moveResult.color === "w" ? "b" as const : "w" as const] + 1,
        }));
      }

      setLastMoveHighlight({
        [from]: { backgroundColor: "rgba(255, 170, 0, 0.3)" },
        [to]: { backgroundColor: "rgba(255, 170, 0, 0.3)" },
      });
      setSelectedSquare(null);
      setLegalMoveSquares({});
      addMoveToLog(game, moveResult.san, moveResult.color);

      let finalGame: Chess = game;
      if (moveResult.captured && pieceAtFrom) {
        const afterEffects = applyPostMove(game, from, to, true, pieceAtFrom.type, pieceAtFrom.color as Color, chaosState.playerModifiers);
        if (afterEffects !== game) finalGame = afterEffects;
      }

      const newG = new Chess(finalGame.fen());
      setGame(newG);

      if (checkGameEnd(newG)) return;
      const drafted = checkDraft(newG, chaosState);

      if (gameMode !== "ai") {
        sendMoveToServer(newG, from, to, chaosState);
        // Staggered draft: fire Black's deferred draft pick after their move
        if (pendingDraftAfterRevealRef.current) {
          const deferred = pendingDraftAfterRevealRef.current;
          pendingDraftAfterRevealRef.current = null;
          setChaosState((prev) => ({ ...prev, ...deferred.chaosState, isDrafting: true, draftingSide: "player", draftChoices: deferred.choices }));
          setPendingPhase(deferred.phase);
          setGameStatus("drafting");
          setEventLog((prev) => [...prev, { type: "draft" as const, message: `⏸️ CHAOS DRAFT Phase ${deferred.phase}! Your turn to pick!`, icon: "⏸️", pepe: PEPE.think }]);
          playSound("record-scratch");
        }
      }

      if (!drafted && gameMode === "ai") {
        setTimeout(() => makeAiMove(newG, chaosState), AI_MOVE_DELAY);
      }
      recomputeChaosMoves(newG, chaosState);
    },
    [pendingStdPromotion, game, chaosState, gameMode, checkGameEnd, checkDraft, makeAiMove, addMoveToLog, applyPostMove, sendMoveToServer, recomputeChaosMoves],
  );

  /* ── Square click for mobile + to show legal moves ── */
  const handleSquareClick = useCallback(
    (square: CbSquare) => {
      if (gameStatus !== "playing" || isThinking) return;

      const isPlayerTurn =
        (playerColor === "white" && game.turn() === "w") ||
        (playerColor === "black" && game.turn() === "b");
      if (!isPlayerTurn) return;

      if (selectedSquare) {
        const success = handlePlayerMove(selectedSquare, square);
        if (!success) {
          const piece = game.get(square as any);
          if (piece && piece.color === game.turn()) {
            setSelectedSquare(square);
            const moves = game.moves({ square: square as any, verbose: true });
            const highlights: Record<string, React.CSSProperties> = {
              [square]: { backgroundColor: "rgba(255, 255, 0, 0.3)" },
            };
            for (const m of moves) {
              // Filter out king moves to chaos-attacked squares
              if (m.piece === "k" && isKingMoveChaosUnsafe(game, m.from, m.to)) continue;
              highlights[m.to] = {
                backgroundColor: m.captured
                  ? "rgba(255, 0, 0, 0.35)"
                  : "rgba(0, 180, 0, 0.25)",
                borderRadius: m.captured ? undefined : "50%",
              };
            }
            // Add chaos move highlights for this square
            for (const cm of availableChaosMoves.filter((m) => m.from === square)) {
              // Filter out king chaos moves to chaos-defended squares
              if (piece && piece.type === "k" && isKingMoveChaosUnsafe(game, cm.from, cm.to)) continue;
              highlights[cm.to] = {
                backgroundColor: cm.type === "capture"
                  ? "rgba(168, 85, 247, 0.5)"
                  : "rgba(168, 85, 247, 0.3)",
                borderRadius: cm.type === "capture" ? undefined : "50%",
              };
            }
            setLegalMoveSquares(highlights);
            playSound("select");
          } else {
            setSelectedSquare(null);
            setLegalMoveSquares({});
          }
        }
      } else {
        const piece = game.get(square as any);
        if (piece && piece.color === game.turn()) {
          setSelectedSquare(square);
          const moves = game.moves({ square: square as any, verbose: true });
          const highlights: Record<string, React.CSSProperties> = {
            [square]: { backgroundColor: "rgba(255, 255, 0, 0.3)" },
          };
          for (const m of moves) {
            // Filter out king moves to chaos-attacked squares
            if (m.piece === "k" && isKingMoveChaosUnsafe(game, m.from, m.to)) continue;
            highlights[m.to] = {
              backgroundColor: m.captured
                ? "rgba(255, 0, 0, 0.35)"
                : "rgba(0, 180, 0, 0.25)",
              borderRadius: m.captured ? undefined : "50%",
            };
          }
          // Add chaos move highlights for this square (purple)
          for (const cm of availableChaosMoves.filter((m) => m.from === square)) {
            // Filter out king chaos moves to chaos-defended squares
            if (piece && piece.type === "k" && isKingMoveChaosUnsafe(game, cm.from, cm.to)) continue;
            highlights[cm.to] = {
              backgroundColor: cm.type === "capture"
                ? "rgba(168, 85, 247, 0.5)"
                : "rgba(168, 85, 247, 0.3)",
              borderRadius: cm.type === "capture" ? undefined : "50%",
            };
          }
          setLegalMoveSquares(highlights);
          playSound("select");
        }
      }
    },
    [game, gameStatus, playerColor, isThinking, selectedSquare, handlePlayerMove, availableChaosMoves, isKingMoveChaosUnsafe],
  );

  /* ── Handle draft pick ── */
  const handleDraftPick = useCallback(
    (mod: ChaosModifier) => {
      const isMultiplayer = gameMode !== "ai";

      // ── Build new state ──
      // For multiplayer: don't use applyDraft — we manage phase advancement manually
      let stateWithTracking: ChaosState;

      if (isMultiplayer) {
        // Sequential drafting: White picks first (draftStep 0→1), Black picks second (draftStep 1→2)
        const isFirstDrafter = playerColor === "white";

        stateWithTracking = {
          ...chaosState,
          playerModifiers: [...chaosState.playerModifiers, mod],
          // Only advance currentPhase when BOTH have drafted (Black picks = second drafter)
          currentPhase: isFirstDrafter ? chaosState.currentPhase : pendingPhase,
          isDrafting: false,
          draftingSide: null,
          draftChoices: [],
          // draftStep is set below in the server-perspective state
        };
      } else {
        // AI mode: both draft simultaneously
        stateWithTracking = applyDraft(chaosState, mod, pendingPhase);
      }

      // Track single-piece modifiers (archbishop, knook) to prevent transfer on capture
      const SINGLE_PIECE_MODS: Record<string, string> = { archbishop: "b", knook: "n" };

      // Track the player's pick
      if (SINGLE_PIECE_MODS[mod.id]) {
        const pColor = playerColor === "white" ? "w" : "b";
        const pieceType = SINGLE_PIECE_MODS[mod.id] as any;
        const squares: string[] = [];
        for (const f of "abcdefgh") for (const r of "12345678") {
          const s = `${f}${r}`;
          const p = game.get(s as any);
          if (p && p.type === pieceType && p.color === pColor) squares.push(s);
        }
        if (squares[0]) {
          stateWithTracking = initTrackedPiece(stateWithTracking, mod.id, pColor as "w" | "b", squares[0]);
        }
      }

      // Track the AI's pick too (AI auto-drafts in single player mode)
      if (!isMultiplayer) {
        const aiLastMod2 = stateWithTracking.aiModifiers[stateWithTracking.aiModifiers.length - 1];
        if (aiLastMod2 && SINGLE_PIECE_MODS[aiLastMod2.id]) {
          const aiColor = playerColor === "white" ? "b" : "w";
          const pieceType = SINGLE_PIECE_MODS[aiLastMod2.id] as any;
          const squares: string[] = [];
          for (const f of "abcdefgh") for (const r of "12345678") {
            const s = `${f}${r}`;
            const p = game.get(s as any);
            if (p && p.type === pieceType && p.color === aiColor) squares.push(s);
          }
          if (squares[0]) {
            stateWithTracking = initTrackedPiece(stateWithTracking, aiLastMod2.id, aiColor as "w" | "b", squares[0]);
          }
        }
      }

      setChaosState(stateWithTracking);

      // In multiplayer staggered drafting: both players resume immediately after picking
      if (isMultiplayer) {
        const isFirstDrafter = playerColor === "white";
        setGameStatus("playing");
        if (!isFirstDrafter) setPendingPhase(0);
        setWaitingForOpponentDraft(false);
      } else {
        setGameStatus("playing");
        setPendingPhase(0);
      }

      // Track that WE just drafted (so WebSocket/polling doesn't show the reveal for our own draft)
      justDraftedRef.current = true;
      prevPhaseRef.current = isMultiplayer
        ? pendingPhase // track by pending phase even if currentPhase hasn't advanced yet
        : stateWithTracking.currentPhase;

      const aiMsg = !isMultiplayer ? getAiDraftMessage(stateWithTracking) : null;
      const aiLastMod = stateWithTracking.aiModifiers[stateWithTracking.aiModifiers.length - 1];

      setEventLog((prev) => [
        ...prev,
        {
          type: "modifier",
          message: `You drafted: ${mod.icon} ${mod.name} — ${mod.description}`,
          icon: mod.icon,
          pepe: tierPepe(mod.tier),
        },
        ...(gameMode === "ai" && aiMsg
          ? [{ type: "modifier" as const, message: aiMsg, icon: "🤖", pepe: aiLastMod ? tierPepe(aiLastMod.tier) : PEPE.hmm }]
          : []),
        ...(isMultiplayer && playerColor === "white"
          ? [{ type: "info" as const, message: "⚡ Powerup locked in! Make your move!", icon: "⚡" }]
          : [{ type: "info" as const, message: "⏯️ Game resumed!", icon: "▶️" }]),
      ]);

      // Apply one-time draft effects (knight horde, undead army)
      const pColor = playerColor === "white" ? "w" : "b";
      const draftResult = applyDraftEffect(game, mod, pColor as Color, capturedPawns[pColor as "w" | "b"]);
      let currentGame = game;
      if (draftResult) {
        currentGame = draftResult;
        setGame(draftResult);
        setEventLog((prev) => [...prev, { type: "chaos", message: `🎭 ${mod.name} effect activated! Check the board!`, icon: "🎭", pepe: PEPE.galaxybrain }]);
        spawnPepe(PEPE.galaxybrain);
      }

      // Tier-based meme sound
      playSound(pickRandom(TIER_SOUNDS[mod.tier]));
      spawnPepe(tierPepe(mod.tier));

      recomputeChaosMoves(currentGame, stateWithTracking);

      // Send updated state for multiplayer with draftStep
      if (isMultiplayer && roomId) {
        const isFirstDrafter = playerColor === "white";
        const serverCs = toServerChaosState(stateWithTracking, playerColor);
        // Set draftStep: White=1 (first drafter done), Black=2 (both done, advance phase)
        serverCs.draftStep = isFirstDrafter ? 1 : 2;
        // Black (second drafter) also advances currentPhase on the server
        if (!isFirstDrafter) {
          serverCs.currentPhase = pendingPhase;
        }

        const payload = {
          roomId,
          from: "",
          to: "",
          newFen: currentGame.fen(),
          chaosState: serverCs,
          lastMoveFrom: "",
          lastMoveTo: "",
          capturedPawnsWhite: capturedPawns.w,
          capturedPawnsBlack: capturedPawns.b,
          status: "playing",
        };

        // Broadcast via WebSocket FIRST for instant sync
        if (partySendRef.current) {
          partySendRef.current({
            type: "draft",
            chaosState: serverCs,
            fen: currentGame.fen(),
          } as PartyMessage);
        }
        lastFenRef.current = currentGame.fen();

        // Persist to DB in the background
        fetch("/api/chaos/move", {
          method: "POST",
          headers: chaosHeaders(true),
          body: JSON.stringify(payload),
        }).catch(() => { /* network error — polling will resync */ });
      }

      // If it's AI's turn, make AI move
      if (gameMode === "ai") {
        const isAiTurn =
          (playerColor === "white" && currentGame.turn() === "b") ||
          (playerColor === "black" && currentGame.turn() === "w");
        if (isAiTurn) {
          setTimeout(() => makeAiMove(currentGame, stateWithTracking), AI_MOVE_DELAY);
        }
      }
    },
    [chaosState, pendingPhase, playerColor, game, gameMode, makeAiMove, roomId, capturedPawns, spawnPepe, recomputeChaosMoves],
  );

  /* ── Resign ── */
  const handleResign = useCallback(() => {
    const winner = playerColor === "white" ? "black" : "white";
    setGameResult(winner);
    setGameStatus("game-over");
    setEndReason("Resignation");
    setEventLog((prev) => [
      ...prev,
      { type: "info", message: `🏳️ You resigned. ${winner === "white" ? "White" : "Black"} wins.`, icon: "🏳️", pepe: PEPE.sadge },
    ]);
    playSound("sad-trombone");
    spawnPepe(PEPE.sadge);
    if (pollRef.current) clearInterval(pollRef.current);
    if (gameMode !== "ai" && roomId) {
      // Mark room as finished
      fetch("/api/chaos/move", {
        method: "POST",
        headers: chaosHeaders(true),
        body: JSON.stringify({ roomId, from: "", to: "", newFen: game.fen(), status: "finished" }),
      });
      // Notify opponent via WebSocket
      if (partySendRef.current) {
        partySendRef.current({ type: "resign", winner });
      }
    }
  }, [playerColor, spawnPepe, gameMode, roomId, game]);

  /* ── Draw Offer ── */
  const handleDrawOffer = useCallback(() => {
    if (gameMode === "ai") return;
    setDrawOfferSent(true);
    setEventLog((prev) => [...prev, { type: "info", message: "🤝 Draw offer sent.", icon: "🤝", pepe: PEPE.think }]);
    if (partySendRef.current) {
      partySendRef.current({ type: "draw-offer" });
    }
  }, [gameMode]);

  const handleDrawAccept = useCallback(() => {
    setGameResult("draw");
    setGameStatus("game-over");
    setEndReason("Draw by Agreement");
    setDrawOfferReceived(false);
    setEventLog((prev) => [...prev, { type: "info", message: "🤝 Draw accepted!", icon: "🤝", pepe: PEPE.pepeok }]);
    playSound("reveal-stinger");
    if (pollRef.current) clearInterval(pollRef.current);
    if (partySendRef.current) {
      partySendRef.current({ type: "draw-accept" });
    }
    if (roomId) {
      fetch("/api/chaos/move", {
        method: "POST",
        headers: chaosHeaders(true),
        body: JSON.stringify({ roomId, from: "", to: "", newFen: game.fen(), status: "finished" }),
      });
    }
  }, [roomId, game]);

  const handleDrawDecline = useCallback(() => {
    setDrawOfferReceived(false);
    setEventLog((prev) => [...prev, { type: "info", message: "❌ Draw declined.", icon: "❌", pepe: PEPE.rage }]);
    if (partySendRef.current) {
      partySendRef.current({ type: "draw-decline" });
    }
  }, []);

  /* ── Rematch ── */
  const handleRematch = useCallback(() => {
    if (partySendRef.current) {
      partySendRef.current({ type: "rematch" });
    }
    setRematchRequested(true);
    setEventLog((prev) => [...prev, { type: "info", message: "🔄 Rematch request sent!", icon: "🔄", pepe: PEPE.hyped }]);
  }, []);

  const handleAcceptRematch = useCallback(() => {
    // Reset the game
    const g = new Chess();
    setGame(g);
    setGameStatus("playing");
    setGameResult(null);
    setEndReason("");
    const cs = createChaosState();
    setChaosState(cs);
    setMoveLog([]);
    setFloatingPepes([]);
    setCapturedPawns({ w: 0, b: 0 });
    setAvailableChaosMoves([]);
    setSelectedSquare(null);
    setLegalMoveSquares({});
    setLastMoveHighlight({});
    setDrawOfferSent(false);
    setDrawOfferReceived(false);
    setRematchRequested(false);
    setRematchReceived(false);
    triggeredDraftForPhaseRef.current = -1;
    recomputeChaosMoves(g, cs);
    setEventLog([{ type: "info", message: "⚡ Rematch started! Good luck!", icon: "⚡", pepe: PEPE.hyped }]);
    playSound("reveal-stinger");

    // Swap colors
    const newColor = playerColor === "white" ? "black" : "white";
    setPlayerColor(newColor);

    if (partySendRef.current) {
      partySendRef.current({ type: "rematch" });
    }

    if (gameMode === "ai" && newColor === "black") {
      setTimeout(() => makeAiMove(g, cs), 600);
    }
  }, [playerColor, gameMode, makeAiMove, recomputeChaosMoves]);

  /* ── Next draft phase number for display ── */
  const nextDraftTurn = useMemo(() => {
    const nextPhase = chaosState.currentPhase + 1;
    if (nextPhase > chaosState.phaseTriggers.length) return null;
    return chaosState.phaseTriggers[nextPhase - 1];
  }, [chaosState]);

  /* ── Board squares merging ── */
  const mergedSquareStyles = useMemo(() => {
    return { ...lastMoveHighlight, ...legalMoveSquares };
  }, [lastMoveHighlight, legalMoveSquares]);

  /* ── Active chaos moves count badge ── */
  const chaosMovesCount = availableChaosMoves.length;

  /* ────────────────────────── Render ────────────────────────── */

  // Setup screen
  if (gameStatus === "setup") {
    return (
      <div className="relative min-h-[calc(100vh-64px)] overflow-hidden bg-gradient-to-b from-[#030712] via-[#0a0f1a] to-[#030712]">
        <ChaosParticles />
        <div className="relative z-10 mx-auto flex max-w-4xl flex-col items-center px-3 py-6 text-center sm:px-4 sm:py-12">
          {/* Title */}
          <img
            src={PEPE.hyped}
            alt=""
            className="mb-2 h-12 w-12 object-contain sm:mb-3 sm:h-16 sm:w-16"
            style={{ animation: "pepe-bounce 1.5s ease-in-out infinite" }}
          />
          <h1 className="mb-2 bg-gradient-to-r from-purple-400 via-pink-400 to-orange-400 bg-clip-text text-3xl font-black tracking-tight text-transparent sm:mb-3 sm:text-4xl md:text-5xl">
            CHAOS CHESS
          </h1>
          <p className="mb-5 max-w-md text-sm text-slate-400 sm:mb-8 sm:text-base">
            Play chess with wild modifiers. Every 5 turns, draft a permanent buff
            that actually changes how your pieces move. Pure chaos.
          </p>

          {/* How it works */}
          <div className="mb-6 grid w-full max-w-lg gap-3 text-left grid-cols-3 sm:mb-10 sm:gap-4">
            {[
              { icon: "♟️", title: "Play", desc: "Normal chess rules + chaos modifiers" },
              { icon: "⏸️", title: "Draft", desc: "At turns 5, 10, 15, 20, 25 — pick a modifier" },
              { icon: "💥", title: "Chaos", desc: "Modifiers actually work — pieces gain new moves!" },
            ].map((step) => (
              <div key={step.title} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-2.5 text-center sm:p-4">
                <div className="mb-1 text-xl sm:mb-2 sm:text-2xl">{step.icon}</div>
                <h3 className="mb-0.5 text-xs font-bold text-white sm:mb-1 sm:text-sm">{step.title}</h3>
                <p className="text-[10px] text-slate-500 sm:text-xs">{step.desc}</p>
              </div>
            ))}
          </div>

          {/* ── Mode Tabs ── */}
          <div className="mb-4 flex flex-wrap justify-center gap-1.5 sm:mb-6 sm:gap-2">
            {(["ai", "friend", "matchmake"] as GameMode[]).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setGameMode(mode)}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all sm:px-4 sm:py-2 sm:text-sm ${
                  gameMode === mode
                    ? "bg-purple-500/20 text-purple-400 border border-purple-500/40"
                    : "bg-white/[0.04] text-slate-400 border border-white/[0.06] hover:bg-white/[0.08]"
                }`}
              >
                {mode === "ai" ? "🤖 vs AI" : mode === "friend" ? "👥 vs Friend" : "🎲 Matchmake"}
              </button>
            ))}
          </div>

          {/* ── AI Mode ── */}
          {gameMode === "ai" && (
            <>
              <div className="mb-4 sm:mb-6">
                <p className="mb-2 text-[11px] font-medium uppercase tracking-wider text-slate-500 sm:text-xs">AI Difficulty</p>
                <div className="flex gap-1.5 sm:gap-2">
                  {(["easy", "medium", "hard"] as const).map((level) => (
                    <button
                      key={level}
                      type="button"
                      onClick={() => setAiLevel(level)}
                      className={`rounded-lg px-3 py-1.5 text-xs font-medium capitalize transition-all sm:px-4 sm:py-2 sm:text-sm ${
                        aiLevel === level
                          ? "bg-purple-500/20 text-purple-400 border border-purple-500/40"
                          : "bg-white/[0.04] text-slate-400 border border-white/[0.06] hover:bg-white/[0.08]"
                      }`}
                    >
                      {level}
                    </button>
                  ))}
                </div>
              </div>

              <p className="mb-2 text-[11px] font-medium uppercase tracking-wider text-slate-500 sm:mb-3 sm:text-xs">Choose your side</p>
              <div className="flex gap-3 sm:gap-4">
                <button type="button" onClick={() => startGame("white", "ai")}
                  className="group flex flex-col items-center gap-1.5 rounded-xl border border-white/[0.08] bg-white/[0.04] px-5 py-3.5 transition-all hover:border-white/[0.2] hover:bg-white/[0.08] hover:scale-105 sm:gap-2 sm:px-8 sm:py-5">
                  <span className="text-3xl sm:text-4xl">♔</span>
                  <span className="text-xs font-bold text-white sm:text-sm">White</span>
                </button>
                <button type="button" onClick={() => startGame("black", "ai")}
                  className="group flex flex-col items-center gap-1.5 rounded-xl border border-white/[0.08] bg-white/[0.04] px-5 py-3.5 transition-all hover:border-white/[0.2] hover:bg-white/[0.08] hover:scale-105 sm:gap-2 sm:px-8 sm:py-5">
                  <span className="text-3xl sm:text-4xl">♚</span>
                  <span className="text-xs font-bold text-white sm:text-sm">Black</span>
                </button>
              </div>
            </>
          )}

          {/* ── Friend Mode ── */}
          {gameMode === "friend" && (
            <div className="flex w-full max-w-md flex-col gap-6">
              {/* Create room */}
              <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
                <p className="mb-3 text-sm font-bold text-white">Create a Room</p>
                <p className="mb-4 text-xs text-slate-500">Choose your color and share the code with a friend</p>
                <div className="flex justify-center gap-3">
                  <button type="button" onClick={() => createRoom("white")}
                    className="flex items-center gap-2 rounded-lg border border-white/[0.08] bg-white/[0.04] px-5 py-3 text-sm font-medium text-white transition-all hover:bg-white/[0.1]">
                    ♔ Play White
                  </button>
                  <button type="button" onClick={() => createRoom("black")}
                    className="flex items-center gap-2 rounded-lg border border-white/[0.08] bg-white/[0.04] px-5 py-3 text-sm font-medium text-white transition-all hover:bg-white/[0.1]">
                    ♚ Play Black
                  </button>
                </div>
              </div>

              {/* Join room */}
              <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
                <p className="mb-3 text-sm font-bold text-white">Join a Room</p>
                <p className="mb-4 text-xs text-slate-500">Enter the 6-character code your friend shared</p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    maxLength={6}
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                    placeholder="ABCDEF"
                    className="flex-1 rounded-lg border border-white/[0.1] bg-white/[0.04] px-4 py-2.5 text-center font-mono text-lg font-bold uppercase tracking-[0.3em] text-white outline-none placeholder:text-slate-600 focus:border-purple-500/40"
                  />
                  <button
                    type="button"
                    onClick={joinRoom}
                    disabled={joinCode.length !== 6}
                    className="rounded-lg bg-purple-500/20 px-5 py-2.5 text-sm font-medium text-purple-400 transition-all hover:bg-purple-500/30 disabled:opacity-40"
                  >
                    Join
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── Matchmake Mode ── */}
          {gameMode === "matchmake" && (
            <div className="flex flex-col items-center gap-4">
              <p className="text-sm text-slate-400">Find a random opponent to play Chaos Chess against</p>
              <ChaosLobby
                isSignedIn={true}
                onMatchFound={(data) => {
                  setRoomId(data.roomId);
                  setRoomCode(data.roomCode);
                  setGameMode("matchmake");
                  setOpponentLabel("Random Opponent");

                  // Determine our color based on whether we joined or hosted
                  const myColor = data.joined
                    ? (data.hostColor === "white" ? "black" : "white")
                    : (data.hostColor === "white" ? "white" : "black");
                  setPlayerColor(myColor as "white" | "black");
                  setGameStatus("playing");
                  setMatchmakeState("found");
                  const cs = createChaosState();
                  setChaosState(cs);
                  const g = new Chess();
                  setGame(g);
                  // Reset all per-game state/refs
                  prevPhaseRef.current = 0;
                  triggeredDraftForPhaseRef.current = -1;
                  pendingDraftAfterRevealRef.current = null;
                  justDraftedRef.current = false;
                  setEndReason("");
                  setDrawOfferSent(false);
                  setDrawOfferReceived(false);
                  setRematchRequested(false);
                  setRematchReceived(false);
                  setSelectedSquare(null);
                  setLegalMoveSquares({});
                  setLastMoveHighlight({});
                  setAvailableChaosMoves([]);
                  setMoveLog([]);
                  setFloatingPepes([]);
                  setCapturedPawns({ w: 0, b: 0 });
                  setEventLog([{ type: "info", message: "🎯 Opponent found! Game on!", icon: "🎯", pepe: PEPE.hyped }]);
                  playSound("reveal-stinger");
                  spawnPepe(PEPE.hyped);
                  recomputeChaosMoves(g, cs);
                  startPolling(data.roomId, myColor);
                  // Notify via WebSocket
                  if (data.joined) {
                    setTimeout(() => {
                      if (partySendRef.current) {
                        partySendRef.current({ type: "join", guestId: "" });
                      }
                    }, 500);
                  }
                }}
                onCancel={() => {
                  setMatchmakeState("idle");
                  if (pollRef.current) clearInterval(pollRef.current);
                }}
              />
            </div>
          )}

          {/* AnarchyChess callout */}
          <div className="mt-12 rounded-xl border border-orange-500/20 bg-orange-500/5 px-6 py-4 text-center">
            <div className="mb-2 flex items-center justify-center gap-2">
              <img src={PEPE.clownge} alt="" className="h-8 w-8 object-contain" />
              <img src={PEPE.clowntrain} alt="" className="h-8 w-8 object-contain" />
            </div>
            <p className="text-sm text-orange-400">
              🧱 Yes, we have <span className="font-bold">Forced En Passant</span>, <span className="font-bold">The Knook</span>, and <span className="font-bold">Il Vaticano</span>.
            </p>
            <p className="mt-1 text-xs text-slate-500">You&apos;re welcome, r/AnarchyChess.</p>
          </div>
        </div>
      </div>
    );
  }

  // Waiting for opponent screen
  if (gameStatus === "waiting") {
    return (
      <div className="relative min-h-[calc(100vh-64px)] overflow-hidden bg-gradient-to-b from-[#030712] via-[#0a0f1a] to-[#030712]">
        <ChaosParticles />
        <div className="relative z-10 mx-auto flex max-w-md flex-col items-center px-4 py-20 text-center">
          <img
            src={PEPE.prayge}
            alt=""
            className="mb-4 h-20 w-20 object-contain"
            style={{ animation: "pepe-bounce 1.5s ease-in-out infinite" }}
          />
          <h1 className="mb-3 text-2xl font-bold text-white">Waiting for Opponent</h1>

          {roomCode && gameMode === "friend" && (
            <div className="mb-6">
              <p className="mb-2 text-sm text-slate-400">Share this code with your friend:</p>
              <div className="flex items-center gap-3 rounded-xl border border-purple-500/30 bg-purple-500/10 px-6 py-4">
                <span className="font-mono text-3xl font-black tracking-[0.4em] text-purple-400">{roomCode}</span>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(roomCode);
                    setEventLog((prev) => [...prev, { type: "info", message: "📋 Code copied!", icon: "📋" }]);
                  }}
                  className="rounded-lg bg-white/10 px-3 py-1.5 text-xs text-white transition hover:bg-white/20"
                >
                  Copy
                </button>
              </div>
            </div>
          )}

          {/* Matchmaking waiting: show lobby with chat */}
          {gameMode === "matchmake" ? (
            <div className="mb-6 w-full flex flex-col items-center gap-4">
              <div className="flex items-center gap-2 text-sm text-slate-400">
                <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-purple-400 border-t-transparent" />
                Waiting for opponent…
              </div>
              <ChaosLobby
                isSignedIn={true}
                chatOnly
                onMatchFound={() => {}}
                onCancel={() => {}}
              />
              <button
                type="button"
                onClick={() => {
                  setGameStatus("setup");
                  if (pollRef.current) clearInterval(pollRef.current);
                  setMatchmakeState("idle");
                  // Cancel room on server
                  if (roomId) {
                    fetch("/api/chaos/matchmake", {
                      method: "DELETE",
                      headers: chaosHeaders(true),
                      body: JSON.stringify({ roomId }),
                    }).catch(() => {});
                  }
                }}
                className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-xs font-medium text-red-400 transition-all hover:bg-red-500/20"
              >
                Cancel
              </button>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-purple-400 border-t-transparent" />
                Waiting for them to join…
              </div>

              <button
                type="button"
                onClick={() => {
                  setGameStatus("setup");
                  if (pollRef.current) clearInterval(pollRef.current);
                  setMatchmakeState("idle");
                }}
                className="mt-6 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-xs font-medium text-red-400 transition-all hover:bg-red-500/20"
              >
                Cancel
              </button>
            </>
          )}

          {/* Event log for errors */}
          {eventLog.length > 0 && (
            <div className="mt-6 w-full space-y-1">
              {eventLog.slice(-3).map((e, i) => (
                <div key={i} className="flex items-center gap-1.5 rounded px-3 py-1.5 text-xs text-slate-500">
                  {e.pepe && <img src={e.pepe} alt="" className="h-4 w-4 object-contain" />}
                  <span>{e.message}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Game / Drafting / Game Over
  return (
    <div className="relative min-h-[calc(100vh-64px)] overflow-hidden bg-gradient-to-b from-[#030712] via-[#0a0f1a] to-[#030712]">
      <ChaosParticles />

      {/* Floating pepe reactions */}
      {floatingPepes.map((p) => (
        <FloatingPepe key={p.id} src={p.src} onDone={() => removePepe(p.id)} />
      ))}

      {/* Draft modal — only show when it's our turn to draft */}
      {gameStatus === "drafting" && chaosState.draftChoices.length > 0 && (
        <DraftModal
          phase={pendingPhase}
          choices={chaosState.draftChoices}
          onPick={handleDraftPick}
        />
      )}
      {/* Return to Draft — floating safety button if the modal was accidentally hidden */}
      {gameStatus === "playing" && chaosState.isDrafting && chaosState.draftChoices.length > 0 && (
        <div className="pointer-events-none fixed inset-0 z-50 flex items-end justify-center pb-8">
          <button
            type="button"
            onClick={() => setGameStatus("drafting")}
            className="pointer-events-auto animate-bounce rounded-xl border border-purple-500/50 bg-purple-600/90 px-6 py-3 font-bold text-white shadow-lg shadow-purple-900/50 backdrop-blur-sm hover:bg-purple-500 active:scale-95 transition-colors"
          >
            ⚡ Pick Your Power
          </button>
        </div>
      )}

      {/* Opponent draft reveal (multiplayer) — with post-reveal action */}
      {opponentDraftReveal && (
        <OpponentDraftReveal
          data={opponentDraftReveal}
          onDismiss={() => {
            setOpponentDraftReveal(null);
            // Draft triggers after Black's own move — nothing to do here
          }}
        />
      )}

      <div className="relative z-10 mx-auto grid w-full max-w-6xl grid-cols-1 gap-4 px-3 py-3 sm:px-4 sm:py-4 lg:grid-cols-[1fr_280px] lg:gap-6 lg:px-8 lg:py-6">
        {/* ── Center: Board + Modifiers below ── */}
        <div className="flex flex-col items-center gap-2 sm:gap-3 min-w-0">
          {/* Header */}
          <div className="flex w-full max-w-[640px] items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <span className="text-lg">⚡</span>
              <h1 className="text-lg font-bold text-white">Chaos Chess</h1>
              {gameMode !== "ai" && roomCode && (
                <span className="rounded bg-white/10 px-2 py-0.5 font-mono text-[10px] font-bold text-slate-400">
                  {roomCode}
                </span>
              )}
              {gameStatus === "game-over" && (
                <div className="flex items-center gap-1.5">
                  <img
                    src={
                      gameResult === "draw" ? PEPE.hmm
                      : gameResult === playerColor ? PEPE.gigachad
                      : PEPE.gamercry
                    }
                    alt=""
                    className="h-7 w-7 object-contain"
                  />
                  <span className={`rounded px-2 py-0.5 text-xs font-bold ${
                    gameResult === playerColor
                      ? "bg-emerald-500/20 text-emerald-400"
                      : gameResult === "draw"
                      ? "bg-white/10 text-white"
                      : "bg-red-500/20 text-red-400"
                  }`}>
                    {gameResult === "draw"
                      ? "Draw"
                      : gameResult === playerColor
                      ? "You Win!"
                      : "You Lose"}
                  </span>
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              {isThinking && (
                <span className="flex items-center gap-1 text-xs text-slate-500">
                  <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-orange-400" />
                  Thinking…
                </span>
              )}
            </div>
          </div>

          {/* Opponent label */}
          <div className="flex w-full max-w-[640px] items-center gap-2 rounded-lg bg-white/[0.02] px-2 py-1 sm:px-3 sm:py-1.5">
            <span className="text-xs sm:text-sm">{gameMode === "ai" ? "🤖" : "👤"}</span>
            <span className="text-[11px] sm:text-xs font-medium text-slate-400">
              {gameMode === "ai" ? `Stockfish (${aiLevel})` : opponentLabel}
            </span>
            <InlineModifierIcons modifiers={chaosState.aiModifiers} />
          </div>

          {/* Board — auto-sizes to fill container, capped at 640px */}
          <div ref={boardContainerRef} className="w-full max-w-[640px]">
            <div className="w-full">
              <Chessboard
                id="chaos-board"
                position={game.fen()}
                boardOrientation={playerColor}
                onBoardWidthChange={setBoardSize}
                onPieceDrop={(from, to) => handlePlayerMove(from as CbSquare, to as CbSquare)}
                onSquareClick={handleSquareClick}
                customSquareStyles={mergedSquareStyles}
                customBoardStyle={{
                  borderRadius: "8px",
                  boxShadow: "0 4px 30px rgba(0,0,0,0.4)",
                }}
                customDarkSquareStyle={{ backgroundColor: boardTheme.darkSquare }}
                customLightSquareStyle={{ backgroundColor: boardTheme.lightSquare }}
                showBoardNotation={showCoordinates}
                customPieces={chaosCustomPieces || undefined}
                animationDuration={200}
                arePiecesDraggable={gameStatus === "playing" && !isThinking}
              />
            </div>
          </div>

          {/* Chaos Promotion Piece Picker */}
          {pendingPromotion && (
            <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setPendingPromotion(null)}>
              <div className="flex flex-col items-center gap-3 rounded-2xl border border-purple-500/30 bg-slate-900/95 p-5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
                <p className="text-sm font-bold text-purple-300">⭐ Battlefield Promotion</p>
                <p className="text-xs text-slate-400">Choose a piece:</p>
                <div className="flex gap-2">
                  {(["q", "r", "b", "n"] as const).map((p) => {
                    const colorPrefix = game.turn() === "w" ? "w" : "b";
                    const pieceCode = `${colorPrefix}${p.toUpperCase()}`;
                    const labels: Record<string, string> = { q: "Queen", r: "Rook", b: "Bishop", n: "Knight" };
                    return (
                      <button
                        key={p}
                        type="button"
                        onClick={() => executePromotion(p)}
                        className="group flex flex-col items-center gap-1 rounded-xl border border-slate-600/50 bg-slate-800/80 p-2 transition-all hover:border-purple-400/60 hover:bg-purple-500/20 hover:scale-110 active:scale-95"
                      >
                        <img
                          src={`https://images.chesscomfiles.com/chess-themes/pieces/neo/150/${pieceCode}.png`}
                          alt={labels[p]}
                          className="h-12 w-12 sm:h-14 sm:w-14"
                          draggable={false}
                        />
                        <span className="text-[10px] text-slate-400 group-hover:text-purple-300">{labels[p]}</span>
                      </button>
                    );
                  })}
                </div>
                <button type="button" onClick={() => setPendingPromotion(null)} className="mt-1 text-[10px] text-slate-500 hover:text-slate-300">Cancel</button>
              </div>
            </div>
          )}

          {/* Standard Promotion Piece Picker */}
          {pendingStdPromotion && (
            <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setPendingStdPromotion(null)}>
              <div className="flex flex-col items-center gap-3 rounded-2xl border border-amber-500/30 bg-slate-900/95 p-5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
                <p className="text-sm font-bold text-amber-300">♛ Promote Pawn</p>
                <p className="text-xs text-slate-400">Choose a piece:</p>
                <div className="flex gap-2">
                  {(["q", "r", "b", "n"] as const).map((p) => {
                    const colorPrefix = game.turn() === "w" ? "w" : "b";
                    const pieceCode = `${colorPrefix}${p.toUpperCase()}`;
                    const labels: Record<string, string> = { q: "Queen", r: "Rook", b: "Bishop", n: "Knight" };
                    return (
                      <button
                        key={p}
                        type="button"
                        onClick={() => executeStdPromotion(p)}
                        className="group flex flex-col items-center gap-1 rounded-xl border border-slate-600/50 bg-slate-800/80 p-2 transition-all hover:border-amber-400/60 hover:bg-amber-500/20 hover:scale-110 active:scale-95"
                      >
                        <img
                          src={`https://images.chesscomfiles.com/chess-themes/pieces/neo/150/${pieceCode}.png`}
                          alt={labels[p]}
                          className="h-12 w-12 sm:h-14 sm:w-14"
                          draggable={false}
                        />
                        <span className="text-[10px] text-slate-400 group-hover:text-amber-300">{labels[p]}</span>
                      </button>
                    );
                  })}
                </div>
                <button type="button" onClick={() => setPendingStdPromotion(null)} className="mt-1 text-[10px] text-slate-500 hover:text-slate-300">Cancel</button>
              </div>
            </div>
          )}

          {/* Player label */}
          <div className="flex w-full max-w-[640px] items-center gap-2 rounded-lg bg-white/[0.02] px-2 py-1 sm:px-3 sm:py-1.5">
            <span className="text-xs sm:text-sm">👤</span>
            <span className="text-[11px] sm:text-xs font-medium text-slate-400">
              You ({playerColor})
            </span>
            <InlineModifierIcons modifiers={chaosState.playerModifiers} />
          </div>

          {/* Controls */}
          <div className="mt-2 sm:mt-3 flex gap-2">
            {gameStatus === "playing" && (
              <>
                <button
                  type="button"
                  onClick={handleResign}
                  className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-xs font-medium text-red-400 transition-all hover:bg-red-500/20"
                >
                  🏳️ Resign
                </button>
                {gameMode !== "ai" && !drawOfferSent && (
                  <button
                    type="button"
                    onClick={handleDrawOffer}
                    className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-2 text-xs font-medium text-amber-400 transition-all hover:bg-amber-500/20"
                  >
                    🤝 Offer Draw
                  </button>
                )}
                {drawOfferSent && (
                  <span className="flex items-center gap-1 rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-2 text-[11px] text-amber-400/70">
                    <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-amber-400" />
                    Draw offer sent…
                  </span>
                )}
              </>
            )}
          </div>

          {/* Draw offer received banner */}
          {drawOfferReceived && gameStatus === "playing" && (
            <div className="mt-2 flex w-full max-w-[640px] items-center justify-center gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 backdrop-blur-sm">
              <img src={PEPE.think} alt="" className="h-8 w-8 object-contain" />
              <span className="text-xs font-medium text-amber-300">Opponent offers a draw</span>
              <button
                type="button"
                onClick={handleDrawAccept}
                className="rounded-lg bg-emerald-500/20 px-3 py-1.5 text-xs font-bold text-emerald-400 transition-all hover:bg-emerald-500/30"
              >
                ✅ Accept
              </button>
              <button
                type="button"
                onClick={handleDrawDecline}
                className="rounded-lg bg-red-500/20 px-3 py-1.5 text-xs font-bold text-red-400 transition-all hover:bg-red-500/30"
              >
                ❌ Decline
              </button>
            </div>
          )}

          {/* ── Game Over Overlay ── */}
          {gameStatus === "game-over" && (
            <div className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/70 backdrop-blur-sm">
              <div className="flex flex-col items-center gap-4 rounded-2xl border border-white/10 bg-slate-900/95 p-6 sm:p-8 shadow-2xl max-w-sm w-full mx-4">
                {/* Result pepe */}
                <img
                  src={
                    gameResult === playerColor ? PEPE.king
                    : gameResult === "draw" ? PEPE.copium
                    : PEPE.sadge
                  }
                  alt=""
                  className="h-20 w-20 object-contain"
                  style={{ animation: "pepe-bounce 1.5s ease-in-out infinite" }}
                />

                {/* Result text */}
                <div className="text-center">
                  <h2 className={`text-2xl font-black ${
                    gameResult === playerColor
                      ? "text-emerald-400"
                      : gameResult === "draw"
                      ? "text-amber-400"
                      : "text-red-400"
                  }`}>
                    {gameResult === playerColor ? "You Win!" : gameResult === "draw" ? "Draw" : "You Lose"}
                  </h2>
                  {endReason && (
                    <p className="mt-1 text-sm text-slate-400">{endReason}</p>
                  )}
                  <p className="mt-2 text-xs text-slate-500">
                    {gameResult === playerColor
                      ? "They never stood a chance. GG EZ."
                      : gameResult === "draw"
                      ? "Copium levels critical."
                      : "Skill issue. Maybe draft better next time."}
                  </p>
                </div>

                {/* Action buttons */}
                <div className="flex flex-col items-center gap-2 w-full">
                  {/* Rematch (multiplayer) */}
                  {gameMode !== "ai" && !rematchRequested && !rematchReceived && (
                    <button
                      type="button"
                      onClick={handleRematch}
                      className="w-full rounded-lg border border-blue-500/30 bg-blue-500/10 px-4 py-2.5 text-sm font-bold text-blue-400 transition-all hover:bg-blue-500/20"
                    >
                      🔄 Rematch
                    </button>
                  )}
                  {rematchRequested && !rematchReceived && (
                    <span className="flex items-center gap-1.5 rounded-lg border border-blue-500/20 bg-blue-500/5 px-4 py-2.5 text-xs text-blue-400/70">
                      <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-blue-400" />
                      Waiting for opponent…
                    </span>
                  )}
                  {rematchReceived && (
                    <button
                      type="button"
                      onClick={handleAcceptRematch}
                      className="w-full rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-2.5 text-sm font-bold text-emerald-400 transition-all hover:bg-emerald-500/20 animate-pulse"
                    >
                      ✅ Accept Rematch
                    </button>
                  )}

                  {/* AI rematch */}
                  {gameMode === "ai" && (
                    <button
                      type="button"
                      onClick={() => startGame(playerColor, "ai")}
                      className="w-full rounded-lg border border-blue-500/30 bg-blue-500/10 px-4 py-2.5 text-sm font-bold text-blue-400 transition-all hover:bg-blue-500/20"
                    >
                      🔄 Play Again
                    </button>
                  )}

                  {/* New game */}
                  <button
                    type="button"
                    onClick={() => {
                      setGameStatus("setup");
                      setGameResult(null);
                      setEndReason("");
                      setRoomId(null);
                      setRoomCode("");
                      setMatchmakeState("idle");
                      setDrawOfferSent(false);
                      setDrawOfferReceived(false);
                      setRematchRequested(false);
                      setRematchReceived(false);
                      if (pollRef.current) clearInterval(pollRef.current);
                    }}
                    className="w-full rounded-lg border border-purple-500/30 bg-purple-500/10 px-4 py-2.5 text-sm font-bold text-purple-400 transition-all hover:bg-purple-500/20"
                  >
                    ⚡ New Game
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── Modifiers (below board) ── */}
          <div className="mt-3 sm:mt-4 flex w-full max-w-[640px] flex-col gap-2 sm:gap-3 sm:flex-row">
            <div className="flex-1">
              <ModifierList
                title="Your Modifiers"
                modifiers={chaosState.playerModifiers}
                color="text-purple-400"
              />
            </div>
            <div className="flex-1">
              <ModifierList
                title={gameMode === "ai" ? "AI Modifiers" : "Opponent Modifiers"}
                modifiers={chaosState.aiModifiers}
                color="text-red-400"
              />
            </div>
          </div>

          {/* Status badges below modifiers */}
          <div className="mt-1.5 sm:mt-2 flex w-full max-w-[640px] flex-wrap justify-center gap-1.5 sm:gap-2">
            {nextDraftTurn && gameStatus === "playing" && (
              <div className="rounded-lg border border-purple-500/20 bg-purple-500/5 px-3 py-1.5 text-center">
                <p className="text-xs text-purple-400">
                  ⚡ Next draft turn <span className="font-bold">{nextDraftTurn}</span>
                  <span className="ml-1 text-slate-500">(now: {game.moveNumber()})</span>
                </p>
              </div>
            )}
            {chaosMovesCount > 0 && gameStatus === "playing" && (
              <div className="rounded-lg border border-purple-500/20 bg-purple-500/5 px-3 py-1.5 text-center">
                <p className="text-xs text-purple-400">
                  ⚡ <span className="font-bold">{chaosMovesCount}</span> chaos {chaosMovesCount === 1 ? "move" : "moves"} available
                </p>
              </div>
            )}
          </div>
        </div>

        {/* ── Right sidebar / bottom panel: Event log + Move log ── */}
        <div className="grid w-full grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-3 lg:grid-cols-1">
          {/* Event log */}
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-2.5 sm:p-3">
            <h3 className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-purple-400 sm:mb-2 sm:text-xs">
              ⚡ Chaos Log
            </h3>
            <div
              ref={eventLogRef}
              className="max-h-32 space-y-1 overflow-y-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10 sm:max-h-48"
            >
              {eventLog.map((entry, i) => (
                <div
                  key={i}
                  className={`flex items-start gap-1.5 rounded px-2 py-1 text-[11px] leading-relaxed ${
                    entry.type === "draft"
                      ? "bg-purple-500/10 text-purple-300"
                      : entry.type === "modifier"
                      ? "bg-amber-500/10 text-amber-300"
                      : entry.type === "chaos"
                      ? "bg-red-500/10 text-red-300"
                      : "text-slate-500"
                  }`}
                >
                  {entry.pepe && (
                    <img src={entry.pepe} alt="" className="h-4 w-4 shrink-0 object-contain mt-0.5" />
                  )}
                  <span>{entry.message}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Move log */}
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-2.5 sm:p-3">
            <h3 className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500 sm:mb-2 sm:text-xs">
              Moves
            </h3>
            <div
              ref={moveLogRef}
              className="max-h-28 space-y-0.5 overflow-y-auto font-mono text-[10px] scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10 sm:max-h-40 sm:text-[11px]"
            >
              {(() => {
                const moves = game.history();
                if (moves.length === 0) return <p className="text-center text-slate-600">No moves yet</p>;
                const pairs: { num: number; w: string; b?: string }[] = [];
                moves.forEach((san, i) => {
                  if (i % 2 === 0) pairs.push({ num: Math.floor(i / 2) + 1, w: san });
                  else pairs[pairs.length - 1].b = san;
                });
                return pairs.map((p) => (
                  <div key={p.num} className="flex gap-2 text-slate-400">
                    <span className="w-6 text-right text-slate-600">{p.num}.</span>
                    <span className="w-14">{p.w}</span>
                    <span className="w-14">{p.b ?? ""}</span>
                  </div>
                ));
              })()}
            </div>
          </div>

          {/* Quick info */}
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-2.5 sm:p-3 sm:col-span-2 lg:col-span-1">
            <h3 className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500 sm:mb-2 sm:text-xs">
              Game Info
            </h3>
            <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 text-[11px] text-slate-400 sm:grid-cols-1 sm:space-y-1 sm:text-xs">
              <div className="flex justify-between">
                <span>Mode</span>
                <span className="text-white">{gameMode === "ai" ? "vs AI" : gameMode === "friend" ? "vs Friend" : "Matchmade"}</span>
              </div>
              <div className="flex justify-between">
                <span>Turn</span>
                <span className="text-white">{game.moveNumber()}</span>
              </div>
              <div className="flex justify-between">
                <span>Side to move</span>
                <span className="text-white">{game.turn() === "w" ? "White" : "Black"}</span>
              </div>
              <div className="flex justify-between">
                <span>Modifiers drafted</span>
                <span className="text-white">{chaosState.playerModifiers.length + chaosState.aiModifiers.length}</span>
              </div>
              <div className="flex justify-between">
                <span>Phase</span>
                <span className="text-white">{chaosState.currentPhase} / 5</span>
              </div>
              {chaosMovesCount > 0 && (
                <div className="flex justify-between">
                  <span>Chaos moves</span>
                  <span className="font-bold text-purple-400">{chaosMovesCount}</span>
                </div>
              )}
              {/* Dev info */}
              {gameMode !== "ai" && (
                <>
                  <div className="col-span-2 sm:col-span-1 my-1 border-t border-white/[0.06]" />
                  <div className="flex justify-between">
                    <span>Sync</span>
                    <span className={partyConnected ? "font-semibold text-green-400" : "font-semibold text-yellow-400"}>
                      {partyConnected ? "PartyKit ✓" : "Polling ⏳"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>WS host</span>
                    <span className="text-white truncate max-w-[120px] sm:max-w-[160px]" title={PARTYKIT_HOST}>{PARTYKIT_HOST}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Poll interval</span>
                    <span className="text-white">{POLL_INTERVAL / 1000}s</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Room</span>
                    <span className="text-white truncate max-w-[120px] sm:max-w-[160px] font-mono text-[10px]" title={roomId ?? "-"}>{roomId ?? "-"}</span>
                  </div>
                </>
              )}
              <div className="flex justify-between">
                <span>Color</span>
                <span className="text-white">{playerColor}</span>
              </div>
              <div className="flex justify-between">
                <span>Auth</span>
                <span className={authenticated ? "text-green-400" : "text-yellow-400"}>
                  {authenticated ? "Signed in" : "Guest"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
