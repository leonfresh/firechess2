"use client";

/* ── Twemoji helper — consistent cross-platform emoji rendering ── */
function _twemojiUrl(emoji: string): string {
  const pts = [...emoji].map((c) => c.codePointAt(0)!.toString(16)).filter((cp) => cp !== "fe0f");
  return `https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/${pts.join("-")}.svg`;
}
function Emoji({ emoji, className, style }: { emoji: string; className?: string; style?: React.CSSProperties }) {
  return <img src={_twemojiUrl(emoji)} alt={emoji} className={className} style={{ display: "inline-block", verticalAlign: "-0.125em", ...style }} draggable={false} />;
}


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
import { playSound, preloadSounds, getSoundVolume, setSoundVolume, getMemeVolume, setMemeVolume } from "@/lib/sounds";
import { getPieceImageUrl } from "@/lib/board-themes";
// Note: useBoardSize removed — we use onBoardWidthChange from react-chessboard for auto-responsive sizing
import {
  createChaosState,
  checkDraftTrigger,
  rollDraftChoices,
  countPiecesFromFen,
  applyDraft,
  getAiDraftMessage,
  getPhaseLabel,
  updateTrackedPieces,
  initTrackedPiece,
  getChaosPieceValCp,
  TIER_COLORS,
  TIER_LABELS,
  type ChaosState,
  type ChaosModifier,
  type ModifierTier,
  type PieceType,
} from "@/lib/chaos-chess";
import {
  getChaosMoves,
  executeChaosMove,
  applyPostMoveEffects,
  applyDraftEffect,
  computeChaosThreatPenalty,
  getChaosAttackedSquares,
  isKingUnderChaosAttack,
  computeChainedSquare,
  isChaosCheckmate,
  type ChaosMove,
} from "@/lib/chaos-moves";
import { usePartyRoom, PARTYKIT_HOST, type PartyMessage } from "@/lib/use-party-room";
import { computeEloChange, DEFAULT_CHAOS_ELO, TIME_CONTROLS } from "@/lib/chaos-elo";

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
  "camel": {
    glow: "rgba(245,158,11,0.45)",
  },
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
  "dragon-rook": {
    glow: "rgba(220,38,38,0.4)",
  },
  "pawn-charge": { icon: "🚀", iconGlow: "rgba(249,115,22,0.8)", glow: "rgba(249,115,22,0.4)" },
  "pawn-capture-forward": { icon: "🗡️", iconGlow: "rgba(239,68,68,0.6)", glow: "rgba(239,68,68,0.4)" },
  "dragon-bishop": {
    glow: "rgba(8,145,178,0.4)",
  },
  "pawn-promotion-early": { icon: "⭐", iconGlow: "rgba(234,179,8,0.8)", glow: "rgba(234,179,8,0.3)" },
  "kings-chains": {
    render: (sw: number) => {
      const s = sw * 0.42;
      return (
        <svg viewBox="0 0 100 100" width={s} height={s} style={{ position: "absolute", bottom: "0%", left: "50%", transform: "translateX(-50%)", opacity: 0.93, filter: "drop-shadow(0 0 4px rgba(200,160,40,0.9))" }}>
          <ellipse cx="28" cy="72" rx="13" ry="8" fill="none" stroke="#C8A030" strokeWidth="5.5" transform="rotate(-38 28 72)"/>
          <ellipse cx="50" cy="78" rx="13" ry="8" fill="none" stroke="#C8A030" strokeWidth="5.5"/>
          <ellipse cx="72" cy="72" rx="13" ry="8" fill="none" stroke="#C8A030" strokeWidth="5.5" transform="rotate(38 72 72)"/>
        </svg>
      );
    },
    glow: "rgba(200,160,40,0.45)",
  },
  "king-wrath": { icon: "⚔️", iconGlow: "rgba(239,68,68,0.7)" },
  "queen-teleport": { icon: "🌀", iconGlow: "rgba(168,85,247,0.8)", glow: "rgba(168,85,247,0.4)" },
  "bishop-bounce": { icon: "🪃", iconGlow: "rgba(249,115,22,0.6)" },
  "rook-cannon": { icon: "💣", iconGlow: "rgba(239,68,68,0.8)", glow: "rgba(239,68,68,0.4)" },
  "knight-horde": { icon: "🪖", iconGlow: "rgba(34,197,94,0.7)" },
  "undead-army": { icon: "💀", iconGlow: "rgba(168,85,247,0.8)", filter: "sepia(0.3) hue-rotate(-20deg)" },
  "bishop-cannon": { icon: "🔮", iconGlow: "rgba(168,85,247,0.7)", glow: "rgba(168,85,247,0.3)" },
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
  camel: true,
  pegasus: true,
};

/** Fairy piece SVG replacements — full piece image swap for transformative modifiers */
const FAIRY_PIECE_SVGS: Record<string, Record<string, string>> = {
  knook:                  { w: "/pieces/fairy/wC.svg",  b: "/pieces/fairy/bC.svg" },
  archbishop:             { w: "/pieces/fairy/wA.svg",  b: "/pieces/fairy/bA.svg" },
  amazon:                 { w: "/pieces/fairy/wAm.svg", b: "/pieces/fairy/bAm.svg" },
  pegasus:                { w: "/pieces/fairy/wPg.svg", b: "/pieces/fairy/bPg.svg" },
  camel:                  { w: "/pieces/fairy/wCa.svg", b: "/pieces/fairy/bCa.svg" },
  "dragon-bishop":        { w: "/pieces/fairy/wDb.svg", b: "/pieces/fairy/bDb.svg" },
  "dragon-rook":          { w: "/pieces/fairy/wDr.svg", b: "/pieces/fairy/bDr.svg" },
  "rook-cannon":          { w: "/pieces/fairy/wRC.svg",  b: "/pieces/fairy/bRC.svg" },
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
  undeadRevived?: { w: boolean; b: boolean },
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

      // Choose the fairy piece SVG using the same priority as getPieceDisplayName:
      // identity mods beat movement mods; newest draft wins within each tier.
      const IDENTITY_MOD_IDS = ["knook", "archbishop", "camel", "pegasus", "amazon", "king-ascension"];
      const MOVEMENT_MOD_IDS = ["dragon-bishop", "dragon-rook", "rook-cannon"];
      const fairyTiers = [IDENTITY_MOD_IDS, MOVEMENT_MOD_IDS];
      for (const tier of fairyTiers) {
        // newest-first within the tier
        const found = [...activeForPiece].reverse().find(m => {
          if (!tier.includes(m.id)) return false;
          if (!FAIRY_PIECE_SVGS[m.id]) return false;
          if (pawnCombo && (m.id === "pawn-capture-forward" || m.id === "pawn-charge")) return false;
          const designatedSquare = singlePieceSquares[m.id]?.[pieceColor];
          if (designatedSquare === null) return false; // piece was captured
          if (!square || !designatedSquare) return true;
          if (square === designatedSquare) return true;
          // Animation ghost: react-chessboard passes the *source* square while sliding.
          // After updateTrackedPieces, designatedSquare already points to the target,
          // so `square` (source) won't match. If no piece exists at `square` in the
          // current game state, we're rendering the ghost — show the fairy SVG.
          return !game.get(square as any);
        });
        if (found) {
          pieceUrl = FAIRY_PIECE_SVGS[found.id][pieceColor];
          break;
        }
      }

      // Now iterate all active mods for overlays, glows, and filters
      for (const mod of activeForPiece) {
        // Skip single-piece modifiers if this isn't the designated piece
        if (SINGLE_PIECE_MODIFIERS[mod.id] && square) {
          const designatedSquare = singlePieceSquares[mod.id]?.[pieceColor];
          // Also allow through when the piece has left `square` — animation ghost of the fairy piece
          if (designatedSquare && square !== designatedSquare && game.get(square as any)) continue;
        }

        const fairySvgs = FAIRY_PIECE_SVGS[mod.id];
        // Undead army: hide skull icon once revival has been spent
        const skipUndeadIcon = mod.id === "undead-army" && !!undeadRevived?.[pieceColor as "w" | "b"];

        const def = MODIFIER_OVERLAYS[mod.id];
        if (!def) continue;

        // Skip icon/render overlays for most fairy piece replacements.
        // Exception: torpedo/bayonet pawn mods should still show their icon badge
        // so the upgrade remains visible even when custom pawn SVGs are active.
        const allowIconWithFairy = mod.id === "pawn-charge" || mod.id === "pawn-capture-forward";
        if ((!fairySvgs || allowIconWithFairy) && !skipUndeadIcon) {
          if (def.icon) {
            // For the War Pawn combo (Torpedo + Bayonet), render icons in all
            // 4 corners: each modifier occupies two opposite corners.
            if (pawnCombo && (mod.id === "pawn-charge" || mod.id === "pawn-capture-forward")) {
              const corners: Corner[] = mod.id === "pawn-charge"
                ? ["top-left", "bottom-right"]
                : ["top-right", "bottom-left"];
              const s = squareWidth * 0.24;
              for (const c of corners) {
                const style = CORNER_STYLES[c];
                overlays.push(
                  <div key={`${mod.id}-${c}`} style={{ position: "absolute", ...style, lineHeight: 1, filter: `drop-shadow(0 0 3px ${def.iconGlow ?? "rgba(255,255,255,0.6)"})` }}>
                    <Emoji emoji={def.icon} style={{ width: s, height: s }} />
                  </div>
                );
              }
              continue;
            }

            // Icon-based badge — auto-assign to next available corner
            const corner = CORNER_ORDER[cornerIdx % CORNER_ORDER.length];
            cornerIdx++;
            const s = squareWidth * 0.24;
            const style = CORNER_STYLES[corner];
            overlays.push(
              <div key={mod.id} style={{ position: "absolute", ...style, lineHeight: 1, filter: `drop-shadow(0 0 3px ${def.iconGlow ?? "rgba(255,255,255,0.6)"})` }}>
                <Emoji emoji={def.icon} style={{ width: s, height: s }} />
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

      // King's Chains: draw chain overlay on the currently-chained enemy piece square
      const wChained = assignedSquares?.["w_kings-chains"];
      const bChained = assignedSquares?.["b_kings-chains"];
      if (square && (square === wChained || square === bChained)) {
        const s = squareWidth * 0.42;
        overlays.push(
          <React.Fragment key="kings-chains-chain">
            <svg viewBox="0 0 100 100" width={s} height={s} style={{ position: "absolute", bottom: "0%", left: "50%", transform: "translateX(-50%)", opacity: 0.93, filter: "drop-shadow(0 0 4px rgba(200,160,40,0.9))", zIndex: 3 }}>
              <ellipse cx="28" cy="72" rx="13" ry="8" fill="none" stroke="#C8A030" strokeWidth="5.5" transform="rotate(-38 28 72)"/>
              <ellipse cx="50" cy="78" rx="13" ry="8" fill="none" stroke="#C8A030" strokeWidth="5.5"/>
              <ellipse cx="72" cy="72" rx="13" ry="8" fill="none" stroke="#C8A030" strokeWidth="5.5" transform="rotate(38 72 72)"/>
            </svg>
          </React.Fragment>
        );
        if (!glowColor) glowColor = "rgba(200,160,40,0.35)";
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
const POLL_INTERVAL = 1_500; // fallback polling — primary sync is via WebSocket

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
type ChaosSound = "bell" | "bell-double" | "taco-bell-bong" | "crowd-ooh" | "airhorn" | "emotional-damage" | "bruh" | "roblox-oof" | "record-scratch" | "honk" | "buzzer" | "bro-serious" | "yeet";

const TIER_SOUNDS: Record<ModifierTier, ChaosSound[]> = {
  common:    ["bruh", "roblox-oof"],
  rare:      ["crowd-ooh", "record-scratch", "honk"],
  epic:      ["airhorn", "emotional-damage", "bro-serious"],
  legendary: ["airhorn", "yeet"],
};

/** SFX pool for AI chaos moves — varied so it doesn't repeat the same clip */
const AI_CHAOS_SOUNDS: ChaosSound[] = [
  "bruh", "roblox-oof", "crowd-ooh",
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
    const t1 = setTimeout(() => { setStage("reveal"); playSound("bell-double"); }, 800);
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
                <div className="relative z-10">
                  <Emoji emoji={mod.icon} className="w-9 h-9 sm:w-12 sm:h-12" />
                </div>

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
  fen,
  playerColor,
}: {
  phase: number;
  choices: ChaosModifier[];
  onPick: (mod: ChaosModifier) => void;
  fen?: string;
  playerColor?: "w" | "b";
}) {
  const pieceCounts = fen && playerColor ? countPiecesFromFen(fen, playerColor) : null;
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
      playSound("taco-bell-bong");
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
                    <div className="relative z-10 shrink-0 sm:mb-2">
                      <Emoji emoji={mod.icon} className="w-8 h-8 sm:w-12 sm:h-12" />
                    </div>

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
                          {pieceCounts && (
                            <span className={`ml-1 font-bold ${(pieceCounts[mod.piece as PieceType] ?? 0) === 0 ? "text-red-400" : "text-emerald-400"}`}>
                              ×{pieceCounts[mod.piece as PieceType] ?? 0}
                            </span>
                          )}
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
            <Emoji emoji={mod.icon} className="w-6 h-6" />
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
              <Emoji emoji={mod.icon} className="w-5 h-5" />
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
          <span className="cursor-default transition-transform inline-block hover:scale-125">
            <Emoji emoji={m.icon} className="w-5 h-5" />
          </span>
        </ModifierTooltip>
      ))}
    </div>
  );
}

/* ════════════════════ Board Effect Overlay ════════════════════ */

/**
 * CSS keyframe animations for board effects.
 * Injected once via a <style> tag inside the overlay component.
 */
const EFFECT_KEYFRAMES = `
@keyframes ce-burst      { 0%{transform:scale(.15);opacity:1} 55%{opacity:.85} 100%{transform:scale(2.4);opacity:0} }
@keyframes ce-nuke       { 0%{transform:scale(0);opacity:1} 45%{opacity:1} 100%{transform:scale(3.5);opacity:0} }
@keyframes ce-spin       { 0%{transform:scale(1.4) rotate(0deg);opacity:.9} 100%{transform:scale(0) rotate(560deg);opacity:0} }
@keyframes ce-flash      { 0%{opacity:0} 15%{opacity:1} 100%{opacity:0} }
@keyframes ce-slide      { 0%{transform:scaleX(0);opacity:1;transform-origin:left center} 40%{opacity:1} 100%{transform:scaleX(1);opacity:0} }
@keyframes ce-shield     { 0%{transform:scale(.15);opacity:1} 50%{transform:scale(1.2);opacity:.8} 100%{transform:scale(1.7);opacity:0} }
@keyframes ce-spawn      { 0%{transform:scale(0) rotate(-20deg);opacity:1} 60%{transform:scale(1.1);opacity:.9} 100%{transform:scale(1.8);opacity:0} }
@keyframes ce-king-death { 0%{transform:scale(.2);opacity:1} 30%{transform:scale(1.8);opacity:1} 65%{transform:scale(1.4);opacity:.85} 100%{transform:scale(2.8);opacity:0} }
@keyframes ce-king-ring  { 0%{transform:scale(.1);opacity:.9;border-width:6px} 100%{transform:scale(2.6);opacity:0;border-width:1px} }
`;

type BoardEffect = { id: number; type: string; squares: string[] };
type RicochetAnimState = { id: number; from: string; bounceSquare: string; to: string; pieceUrl: string };

function BoardEffectsOverlay({
  effects,
  boardSize,
  orientation,
}: {
  effects: BoardEffect[];
  boardSize: number;
  orientation: "white" | "black";
}) {
  if (!boardSize || effects.length === 0) return null;
  const sq = boardSize / 8;

  return (
    <>
      <style>{EFFECT_KEYFRAMES}</style>
      <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-[8px]">
        {effects.flatMap(({ id, type, squares }) =>
          squares.map((square) => {
            const file = square.charCodeAt(0) - 97;
            const rank = parseInt(square[1], 10) - 1;
            const x = orientation === "white" ? file * sq : (7 - file) * sq;
            const y = orientation === "white" ? (7 - rank) * sq : rank * sq;

            let inner: React.ReactNode = null;
            if (type === "explosion") {
              inner = (
                <div style={{
                  width: "88%", height: "88%", borderRadius: "50%",
                  background: "radial-gradient(circle, #fff 0%, #ff9500 25%, #ff4500 55%, transparent 100%)",
                  boxShadow: "0 0 14px #ff8c00",
                  animation: "ce-burst 700ms ease-out forwards",
                }} />
              );
            } else if (type === "nuke") {
              inner = (
                <div style={{
                  width: "100%", height: "100%", borderRadius: "50%",
                  background: "radial-gradient(circle, #fff 0%, #00ff88 20%, #00cc66 50%, transparent 100%)",
                  boxShadow: "0 0 22px #00ff88",
                  animation: "ce-nuke 950ms ease-out forwards",
                }} />
              );
            } else if (type === "teleport") {
              inner = (
                <div style={{
                  width: "90%", height: "90%", borderRadius: "50%",
                  background: "conic-gradient(from 0deg, #a855f7, transparent 30%, #c084fc 60%, transparent 80%, #a855f7)",
                  boxShadow: "0 0 14px #a855f7",
                  animation: "ce-spin 800ms ease-in forwards",
                }} />
              );
            } else if (type === "ricochet") {
              inner = (
                <div style={{
                  width: "78%", height: "78%",
                  background: "radial-gradient(circle, #fde68a 0%, #fb923c 50%, transparent 100%)",
                  transform: "rotate(45deg)",
                  animation: "ce-burst 550ms ease-out forwards",
                }} />
              );
            } else if (type === "cannon") {
              inner = (
                <div style={{
                  width: "95%", height: "38%",
                  background: "linear-gradient(to right, transparent, #ef4444 35%, #ff8c00 70%, #fff 100%)",
                  borderRadius: "3px",
                  animation: "ce-slide 500ms ease-out forwards",
                }} />
              );
            } else if (type === "shield") {
              inner = (
                <div style={{
                  width: "84%", height: "84%", borderRadius: "8px",
                  border: "3px solid #60a5fa",
                  background: "rgba(96,165,250,0.15)",
                  boxShadow: "0 0 16px #60a5fa",
                  animation: "ce-shield 850ms ease-out forwards",
                }} />
              );
            } else if (type === "spawn") {
              inner = (
                <div style={{
                  width: "84%", height: "84%", borderRadius: "50%",
                  background: "radial-gradient(circle, #a3e635 0%, #65a30d 50%, transparent 100%)",
                  boxShadow: "0 0 12px #a3e635",
                  animation: "ce-spawn 750ms ease-out forwards",
                }} />
              );
            } else if (type === "pegasus") {
              inner = (
                <div style={{
                  width: "84%", height: "84%", borderRadius: "50%",
                  background: "radial-gradient(circle, #e879f9 0%, #a855f7 50%, transparent 100%)",
                  boxShadow: "0 0 12px #a855f7",
                  animation: "ce-burst 700ms ease-out forwards",
                }} />
              );
            } else if (type === "flash") {
              inner = (
                <div style={{
                  width: "100%", height: "100%",
                  background: "rgba(168,85,247,0.5)",
                  animation: "ce-flash 500ms ease-out forwards",
                }} />
              );
            } else if (type === "king-death") {
              inner = (
                <>
                  <div style={{
                    position: "absolute",
                    width: "96%", height: "96%", borderRadius: "50%",
                    background: "radial-gradient(circle, #fff 0%, #fde68a 18%, #f59e0b 38%, #dc2626 62%, transparent 100%)",
                    boxShadow: "0 0 28px #f59e0b, 0 0 56px rgba(220,38,38,0.7)",
                    animation: "ce-king-death 1300ms ease-out forwards",
                  }} />
                  <div style={{
                    position: "absolute",
                    width: "80%", height: "80%", borderRadius: "50%",
                    border: "5px solid #fbbf24",
                    boxShadow: "0 0 12px #fbbf24",
                    animation: "ce-king-ring 1300ms ease-out forwards",
                  }} />
                </>
              );
            }

            if (!inner) return null;
            return (
              <div
                key={`${id}-${square}`}
                style={{
                  position: "absolute",
                  left: x,
                  top: y,
                  width: sq,
                  height: sq,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {inner}
              </div>
            );
          })
        )}
      </div>
    </>
  );
}

/* ════════════════════ Ricochet Bishop Animator ════════════════════ */

function RicochetBishopAnimator({
  anim,
  boardSize,
  orientation,
}: {
  anim: RicochetAnimState;
  boardSize: number;
  orientation: "white" | "black";
}) {
  const sqPx = boardSize / 8;
  const pieceSize = sqPx * 0.82;
  const offset = (sqPx - pieceSize) / 2;

  const toPixel = (square: string) => {
    const file = square.charCodeAt(0) - 97;
    const rank = parseInt(square[1], 10) - 1;
    const px = (orientation === "white" ? file : 7 - file) * sqPx + offset;
    const py = (orientation === "white" ? 7 - rank : rank) * sqPx + offset;
    return { px, py };
  };

  const from   = toPixel(anim.from);
  const bounce = toPixel(anim.bounceSquare);
  const to     = toPixel(anim.to);

  // Proportional timing by distance so speed looks constant
  const dist1 = Math.hypot(bounce.px - from.px, bounce.py - from.py);
  const dist2 = Math.hypot(to.px - bounce.px, to.py - bounce.py);
  const totalDist = dist1 + dist2 || 1;
  const pct1 = Math.round((dist1 / totalDist) * 100);

  const totalDuration = 900;
  const kfName = `rico-${anim.id}`;
  const kfCSS = `
    @keyframes ${kfName} {
      0%        { transform: translate(${from.px}px, ${from.py}px); opacity: 1; }
      ${pct1}%  { transform: translate(${bounce.px}px, ${bounce.py}px); opacity: 1; filter: drop-shadow(0 0 ${(sqPx * 0.35).toFixed(1)}px #fb923c) drop-shadow(0 0 ${(sqPx * 0.18).toFixed(1)}px #fff) brightness(1.7); }
      ${Math.min(pct1 + 8, 96)}% { filter: drop-shadow(0 0 ${(sqPx * 0.2).toFixed(1)}px #fb923c); }
      88%       { transform: translate(${to.px}px, ${to.py}px); opacity: 1; }
      100%      { transform: translate(${to.px}px, ${to.py}px); opacity: 0; }
    }
  `;

  return (
    <>
      <style>{kfCSS}</style>
      <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-[8px]" style={{ zIndex: 30 }}>
        <img
          src={anim.pieceUrl}
          alt=""
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: pieceSize,
            height: pieceSize,
            filter: `drop-shadow(0 0 ${(sqPx * 0.22).toFixed(1)}px #fb923c) drop-shadow(0 0 ${(sqPx * 0.08).toFixed(1)}px #fff)`,
            animation: `${kfName} ${totalDuration}ms linear forwards`,
          }}
        />
      </div>
    </>
  );
}

/* ────────────────────── Piece Info Panel ─────────────────────── */

const PIECE_BASE_LABELS: Record<string, { name: string; moveLabel: string }> = {
  p: { name: "Pawn",   moveLabel: "Moves 1 forward; 2 from start. Captures diagonally." },
  n: { name: "Knight", moveLabel: "L-jump (2+1). Leaps over all pieces." },
  b: { name: "Bishop", moveLabel: "Any distance diagonally. Stays on one color." },
  r: { name: "Rook",   moveLabel: "Any distance horizontally or vertically." },
  q: { name: "Queen",  moveLabel: "Any direction, any distance." },
  k: { name: "King",   moveLabel: "1 square in any direction. Keep it safe!" },
};

/** Get fancy display name for a piece when it carries a transformative modifier */
function getPieceDisplayName(
  pieceType: string,
  mods: ChaosModifier[],
  square: string,
  assignedSquares?: Record<string, string | null>,
  color?: string,
): string {
  const singlePieceMods: Record<string, true> = { knook: true, archbishop: true, camel: true, pegasus: true };

  // Identity-changing mods take full priority over movement-adding mods.
  // Within each tier, last-drafted wins (iterate in reverse = newest first).
  const identityMods = ["knook", "archbishop", "camel", "pegasus", "amazon", "king-ascension"];
  const movementMods = ["dragon-bishop", "dragon-rook"];

  for (const tier of [identityMods, movementMods]) {
    for (const m of [...mods].reverse()) {
      if (!tier.includes(m.id)) continue;
      if (singlePieceMods[m.id]) {
        const trackedKey = `${color}_${m.id}`;
        const trackedSq = assignedSquares?.[trackedKey];
        if (trackedSq !== undefined && trackedSq !== square) continue;
      }
      if (m.id === "knook"         && pieceType === "n") return "The Knook";
      if (m.id === "archbishop"    && pieceType === "b") return "The Archbishop";
      if (m.id === "camel"         && pieceType === "n") return "Camel";
      if (m.id === "pegasus"       && pieceType === "n") return "Pegasus";
      if (m.id === "amazon"        && pieceType === "q") return "The Amazon";
      if (m.id === "king-ascension"&& pieceType === "k") return "Ascended King";
      if (m.id === "dragon-bishop" && pieceType === "b") return "Dragon Bishop";
      if (m.id === "dragon-rook"   && pieceType === "r") return "Dragon Rook";
    }
  }
  return PIECE_BASE_LABELS[pieceType]?.name ?? pieceType.toUpperCase();
}

/** 7×7 relative-movement schematic for the piece info panel */
function PieceMovementGrid({ pieceType, isWhite, mods }: {
  pieceType: string;
  isWhite: boolean;
  mods: ChaosModifier[];
}) {
  const SIZE = 7;
  const C = 3;
  type CellType = "piece" | "base" | "capture-base" | "chaos" | "capture-chaos" | null;
  const cells: CellType[][] = Array.from({ length: SIZE }, () => Array(SIZE).fill(null) as CellType[]);
  cells[C][C] = "piece";
  const fwd = isWhite ? -1 : 1;
  function mark(dr: number, dc: number, ct: CellType) {
    const r = C + dr, co = C + dc;
    if (r >= 0 && r < SIZE && co >= 0 && co < SIZE && !(dr === 0 && dc === 0)) cells[r][co] = ct;
  }
  function tryMark(dr: number, dc: number, ct: CellType) {
    const r = C + dr, co = C + dc;
    if (r >= 0 && r < SIZE && co >= 0 && co < SIZE && !cells[r][co]) mark(dr, dc, ct);
  }
  if (pieceType === "p") {
    mark(fwd, 0, "base"); mark(2 * fwd, 0, "base");
    mark(fwd, -1, "capture-base"); mark(fwd, 1, "capture-base");
  } else if (pieceType === "n") {
    for (const [dr, dc] of [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]])
      mark(dr, dc, "capture-base");
  } else if (pieceType === "b") {
    for (let d = 1; d <= 3; d++)
      for (const [dr, dc] of [[d,d],[d,-d],[-d,d],[-d,-d]] as [number,number][]) mark(dr, dc, "base");
  } else if (pieceType === "r") {
    for (let d = 1; d <= 3; d++)
      for (const [dr, dc] of [[d,0],[-d,0],[0,d],[0,-d]] as [number,number][]) mark(dr, dc, "base");
  } else if (pieceType === "q") {
    for (let d = 1; d <= 3; d++)
      for (const [dr, dc] of [[d,0],[-d,0],[0,d],[0,-d],[d,d],[d,-d],[-d,d],[-d,-d]] as [number,number][]) mark(dr, dc, "base");
  } else if (pieceType === "k") {
    for (const [dr, dc] of [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]] as [number,number][])
      mark(dr, dc, "capture-base");
  }
  const modIds = new Set(mods.map(m => m.id));
  if (modIds.has("camel"))
    for (const [dr,dc] of [[-3,-1],[-3,1],[-1,-3],[-1,3],[1,-3],[1,3],[3,-1],[3,1]] as [number,number][]) tryMark(dr, dc, "chaos");
  if (modIds.has("dragon-bishop"))
    for (const [dr,dc] of [[-1,0],[1,0],[0,-1],[0,1]] as [number,number][]) tryMark(dr, dc, "chaos");
  if (modIds.has("dragon-rook"))
    for (const [dr,dc] of [[-1,-1],[-1,1],[1,-1],[1,1]] as [number,number][]) tryMark(dr, dc, "chaos");
  if (modIds.has("pawn-charge")) tryMark(2 * fwd, 0, "chaos");
  if (modIds.has("pawn-capture-forward")) tryMark(fwd, 0, "capture-chaos");
  if (modIds.has("knook"))
    for (let d = 1; d <= 3; d++)
      for (const [dr,dc] of [[d,0],[-d,0],[0,d],[0,-d]] as [number,number][]) tryMark(dr, dc, "chaos");
  if (modIds.has("archbishop"))
    for (const [dr,dc] of [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]] as [number,number][]) tryMark(dr, dc, "chaos");
  if (modIds.has("amazon"))
    for (const [dr,dc] of [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]] as [number,number][]) tryMark(dr, dc, "chaos");
  if (modIds.has("king-ascension"))
    for (let d = 1; d <= 3; d++)
      for (const [dr,dc] of [[d,0],[-d,0],[0,d],[0,-d],[d,d],[d,-d],[-d,d],[-d,-d]] as [number,number][]) tryMark(dr, dc, "chaos");
  if (modIds.has("pegasus"))
    for (const [dr,dc] of [[-3,-2],[-3,2],[3,-2],[3,2],[-2,-3],[-2,3],[2,-3],[2,3]] as [number,number][]) tryMark(dr, dc, "chaos");

  return (
    <div style={{ display: "grid", gridTemplateColumns: `repeat(${SIZE}, 1fr)`, gap: "1px", backgroundColor: "rgba(255,255,255,0.05)", borderRadius: "6px", overflow: "hidden", padding: "1px" }}>
      {cells.flatMap((row, ri) =>
        row.map((cell, ci) => {
          const isDark = (ri + ci) % 2 === 0;
          const bg =
            cell === "piece"         ? "rgba(168,85,247,0.85)" :
            cell === "base"          ? "rgba(34,197,94,0.55)"  :
            cell === "capture-base"  ? "rgba(239,68,68,0.55)"  :
            cell === "chaos"         ? "rgba(168,85,247,0.55)" :
            cell === "capture-chaos" ? "rgba(249,115,22,0.6)"  :
            isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.25)";
          return (
            <div key={`${ri}-${ci}`} style={{
              aspectRatio: "1",
              backgroundColor: bg,
              borderRadius: (cell === "base" || cell === "chaos") ? "50%" : undefined,
            }} />
          );
        })
      )}
    </div>
  );
}

/** Build a move-description string that includes any chaos additions for the given piece */
function getChaosMoveLabel(pieceType: string, mods: ChaosModifier[]): string {
  const base = PIECE_BASE_LABELS[pieceType]?.moveLabel ?? "";
  const extra: string[] = [];
  const modIds = new Set(mods.map(m => m.id));
  if (modIds.has("dragon-bishop") && pieceType === "b") extra.push("+ 1 orthogonal step");
  if (modIds.has("dragon-rook")   && pieceType === "r") extra.push("+ 1 diagonal step");
  if (modIds.has("knook")         && pieceType === "n") extra.push("+ Rook slides");
  if (modIds.has("archbishop")    && pieceType === "b") extra.push("+ Knight jumps");
  if (modIds.has("amazon")        && pieceType === "q") extra.push("+ Knight jumps");
  if (modIds.has("king-ascension")&& pieceType === "k") extra.push("+ Full queen movement");
  if (modIds.has("camel")         && pieceType === "n") extra.push("+ 3+1 camel jump");
  if (modIds.has("pegasus")       && pieceType === "n") extra.push("+ 3+2 extended jump");
  if (modIds.has("pawn-charge")   && pieceType === "p") extra.push("+ always 2-square push");
  if (modIds.has("pawn-capture-forward") && pieceType === "p") extra.push("+ forward capture");
  return extra.length > 0 ? `${base} ${extra.join("; ")}.` : base;
}

/** Sidebar panel: rendered when the user hovers a piece */
function PieceInfoPanel({
  square, game, playerMods, aiMods, playerColorCode, assignedSquares,
}: {
  square: string | null;
  game: Chess;
  playerMods: ChaosModifier[];
  aiMods: ChaosModifier[];
  playerColorCode: "w" | "b";
  assignedSquares?: Record<string, string | null>;
}) {
  const piece = square ? game.get(square as any) : null;
  if (!piece) {
    return (
      <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-2.5 sm:p-3">
        <PieceMovementGrid pieceType="" isWhite mods={[]} />
      </div>
    );
  }

  const isPlayerPiece = piece.color === playerColorCode;
  const mods = isPlayerPiece ? playerMods : aiMods;
  const pieceTypeMods = mods.filter(m => m.piece === (piece.type as PieceType));
  const displayName = getPieceDisplayName(piece.type, mods, square!, assignedSquares, piece.color);
  const sideClass = isPlayerPiece ? "text-emerald-400" : "text-red-400";
  const valCp = getChaosPieceValCp(square!, piece.type, piece.color as "w" | "b", mods, assignedSquares);
  const valStr = valCp >= 20000 ? "\u221e" : (valCp / 100).toFixed(1).replace(/\.0$/, "");

  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-2.5 sm:p-3">
      <div className="mb-2 flex items-center gap-2">
        <span className={`text-sm font-bold ${sideClass}`}>{displayName}</span>
        <span className="rounded-full border border-amber-500/20 bg-amber-500/10 px-1.5 py-0.5 text-[9px] font-semibold text-amber-400" title="Material value in pawns">
          ♟ {valStr}
        </span>
        <span className={`ml-auto rounded-full px-1.5 py-0.5 text-[9px] font-semibold ${
          isPlayerPiece ? "bg-emerald-500/15 text-emerald-400" : "bg-red-500/15 text-red-400"
        }`}>
          {isPlayerPiece ? "Yours" : "Enemy"}
        </span>
      </div>
      <PieceMovementGrid pieceType={piece.type} isWhite={piece.color === "w"} mods={pieceTypeMods} />
      <div className="mt-1.5 flex flex-wrap gap-2.5 text-[10px] text-slate-500">
        <span className="flex items-center gap-1"><span className="inline-block h-2 w-2 rounded-full bg-emerald-500/55" />Move</span>
        <span className="flex items-center gap-1"><span className="inline-block h-2 w-2 bg-red-500/55" />Capture</span>
        {pieceTypeMods.length > 0 && (
          <span className="flex items-center gap-1"><span className="inline-block h-2 w-2 rounded-full bg-purple-500/55" />Chaos</span>
        )}
      </div>
      <p className="mt-1.5 text-[10px] text-slate-500">{getChaosMoveLabel(piece.type, pieceTypeMods)}</p>
      {pieceTypeMods.length > 0 ? (
        <div className="mt-2 space-y-1.5">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-purple-400">Special rules:</p>
          {pieceTypeMods.map(m => (
            <div key={m.id} className="rounded-lg border border-purple-500/20 bg-purple-500/5 px-2 py-1.5">
              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-purple-300">
                <Emoji emoji={m.icon} style={{ width: 12, height: 12 }} />
                {m.name}
              </div>
              <p className="mt-0.5 text-[10px] leading-relaxed text-slate-400 line-clamp-2">{m.description}</p>
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-1 text-[10px] text-slate-600">Special rules: None.</p>
      )}
    </div>
  );
}

/* ────────────────────────── Main Page ────────────────────────── */

const EFFECT_DURATIONS: Record<string, number> = {
  explosion: 750, nuke: 1000, teleport: 850, ricochet: 600,
  cannon: 550, shield: 900, spawn: 800, pegasus: 750, flash: 550,
  "king-death": 1300,
};

/** How long to wait after king-death effect before showing game-over popup */
const KING_DEATH_POPUP_DELAY = 950;

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
  const [soundVolume, setSoundVolumeState] = useState(() => getSoundVolume());
  const handleVolumeChange = useCallback((v: number) => {
    setSoundVolume(v);
    setSoundVolumeState(v);
  }, []);
  const [memeVolumeState, setMemeVolumeState] = useState(() => getMemeVolume());
  const handleMemeVolumeChange = useCallback((v: number) => {
    setMemeVolume(v);
    setMemeVolumeState(v);
  }, []);
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
  const [undeadRevived, setUndeadRevived] = useState({ w: false, b: false });

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
  /** Move held back when a draft opens — sent bundled with the draft pick */
  const pendingMoveBeforeDraftRef = useRef<{ from: string; to: string } | null>(null);
  /** In AI mode: draft data queued while AI makes its response move */
  const pendingAiDraftRef = useRef<{ phase: number; choices: ChaosModifier[] } | null>(null);

  /* ── PartyKit WebSocket ref for send ── */
  const partySendRef = useRef<((msg: PartyMessage) => void) | null>(null);

  /* ── Draw offer / rematch state (multiplayer) ── */
  const [drawOfferSent, setDrawOfferSent] = useState(false);
  const [drawOfferReceived, setDrawOfferReceived] = useState(false);
  const [rematchRequested, setRematchRequested] = useState(false);
  const [rematchReceived, setRematchReceived] = useState(false);
  /** Reason for game end (for display) */
  const [endReason, setEndReason] = useState<string>("");

  /* ── Piece info floating panel ── */
  const [pieceInfoOpen, setPieceInfoOpen] = useState(true);
  const [pieceInfoPos, setPieceInfoPos] = useState({ x: -1, y: -1 }); // -1 = use default (bottom-right)
  const pieceInfoDragRef = useRef<{ sx: number; sy: number; ox: number; oy: number } | null>(null);

  /* ── Time controls ── */

  const [timeControl, setTimeControl] = useState<{ label: string; base: number; inc: number } | null>(null);
  const [timers, setTimers] = useState<{ w: number; b: number }>({ w: 0, b: 0 });
  const timersRef = useRef<{ w: number; b: number }>({ w: 0, b: 0 });
  timersRef.current = timers;
  const timeControlRef = useRef<{ label: string; base: number; inc: number } | null>(null);
  timeControlRef.current = timeControl;
  const timerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  /* ── ELO ratings ── */
  const [myRating, setMyRating] = useState<number | null>(null);
  const [opponentRating, setOpponentRating] = useState<number | null>(null);
  const [myGamesPlayed, setMyGamesPlayed] = useState(0);
  const myRatingRef = useRef<number | null>(null);
  myRatingRef.current = myRating;
  const opponentRatingRef = useRef<number | null>(null);
  opponentRatingRef.current = opponentRating;
  const myGamesPlayedRef = useRef(0);
  myGamesPlayedRef.current = myGamesPlayed;
  const [eloChange, setEloChange] = useState<number | null>(null);
  const [eloSaved, setEloSaved] = useState(false);
  const [aiEloSaved, setAiEloSaved] = useState(false);
  type LeaderboardMini = { userId: string; rating: number; userName: string | null; userImage: string | null; wins: number; gamesPlayed: number };
  const [setupLeaderboard, setSetupLeaderboard] = useState<LeaderboardMini[]>([]);

  /* ── Chaos moves (extra legal moves from modifiers) ── */
  const [availableChaosMoves, setAvailableChaosMoves] = useState<ChaosMove[]>([]);
  /** When true, queen-teleport moves are included in click/highlight logic */
  const [warpQueenActive, setWarpQueenActive] = useState(false);
  /** Chaos moves visible to the player — warp queen is hidden until its button is toggled on */
  const activeChaosMoves = useMemo(
    () => warpQueenActive
      ? availableChaosMoves
      : availableChaosMoves.filter((m) => m.modifierId !== "queen-teleport"),
    [availableChaosMoves, warpQueenActive],
  );

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
      undeadRevived,
    );
  }, [pieceTheme.setName, chaosState.playerModifiers, chaosState.aiModifiers, playerColor, baseCustomPieces, game, chaosState.assignedSquares, undeadRevived]);

  /* ── Move log ── */
  const [moveLog, setMoveLog] = useState<MoveLogEntry[]>([]);
  const [eventLog, setEventLog] = useState<EventLogEntry[]>([]);
  const moveLogRef = useRef<HTMLDivElement>(null);
  const eventLogRef = useRef<HTMLDivElement>(null);
  const boardContainerRef = useRef<HTMLDivElement>(null);

  /* ── Measure board size via ResizeObserver (react-chessboard v5 removed onBoardWidthChange) ── */
  useEffect(() => {
    const el = boardContainerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect.width;
      if (w) setBoardSize(w);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  /* ── Board interaction state ── */
  const [selectedSquare, setSelectedSquare] = useState<CbSquare | null>(null);
  const [legalMoveSquares, setLegalMoveSquares] = useState<Record<string, React.CSSProperties>>({});
  const [lastMoveHighlight, setLastMoveHighlight] = useState<Record<string, React.CSSProperties>>({});
  const [hoveredSquare, setHoveredSquare] = useState<string | null>(null);
  const [hoverMoveSquares, setHoverMoveSquares] = useState<Record<string, React.CSSProperties>>({});

  /* ── Chaos promotion choice dialog ── */
  const [pendingPromotion, setPendingPromotion] = useState<ChaosMove | null>(null);
  /* ── Standard promotion choice dialog ── */
  const [pendingStdPromotion, setPendingStdPromotion] = useState<{ from: CbSquare; to: CbSquare } | null>(null);
  /* ── Difficulty ── */
  const [aiLevel, setAiLevel] = useState<"easy" | "medium" | "hard">("easy");
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

  /* ── Board effect overlays (explosions, teleports, etc.) ── */
  const [boardEffects, setBoardEffects] = useState<BoardEffect[]>([]);
  const effectIdRef = useRef(0);
  const [ricochetAnim, setRicochetAnim] = useState<RicochetAnimState | null>(null);
  const ricochetAnimIdRef = useRef(0);
  /** True during the ~950ms king-death animation window — blocks input so the popup can't be raced. */
  const isAnimatingEndRef = useRef(false);

  const triggerEffect = useCallback((type: string, squares: string[], durationOverride?: number) => {
    const id = ++effectIdRef.current;
    setBoardEffects((prev) => [...prev, { id, type, squares }]);
    const dur = durationOverride ?? EFFECT_DURATIONS[type] ?? 700;
    setTimeout(() => setBoardEffects((prev) => prev.filter((e) => e.id !== id)), dur);
  }, []);

  const startRicochetAnim = useCallback((
    move: { from: string; to: string; bounceSquare?: string },
    bishopColor: "w" | "b",
  ) => {
    const bounceSquare = move.bounceSquare ?? move.from;
    const pieceCode = `${bishopColor}B`;
    const pieceUrl = getPieceImageUrl(pieceTheme.setName ?? "cburnett", pieceCode);
    const id = ++ricochetAnimIdRef.current;
    setRicochetAnim({ id, from: move.from, bounceSquare, to: move.to, pieceUrl });
    setTimeout(() => setRicochetAnim((prev) => (prev?.id === id ? null : prev)), 950);
  }, [pieceTheme.setName]);

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

  /* ── Timer tick (100ms interval) ── */
  useEffect(() => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    if (gameStatus !== "playing" || !timeControl) return;
    timerIntervalRef.current = setInterval(() => {
      const turn = gameRef.current.turn() as "w" | "b";
      setTimers((prev) => ({ ...prev, [turn]: Math.max(0, prev[turn] - 100) }));
    }, 100);
    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameStatus, timeControl]);

  /* ── Timer timeout check ── */
  useEffect(() => {
    if (!timeControl || gameStatus !== "playing") return;
    if (timers.w === 0 && timers.b > 0) {
      setGameResult("black");
      setGameStatus("game-over");
      setEndReason("White ran out of time");
    } else if (timers.b === 0 && timers.w > 0) {
      setGameResult("white");
      setGameStatus("game-over");
      setEndReason("Black ran out of time");
    }
  }, [timers.w, timers.b, gameStatus, timeControl]);

  /* ── Fetch ELO ratings when multiplayer game starts ── */
  useEffect(() => {
    if (gameStatus !== "playing" || gameMode === "ai" || !roomId || !authenticated) return;
    fetch(`/api/chaos/rating?roomId=${roomId}`, { headers: chaosHeaders() })
      .then((r) => r.json())
      .then((d) => {
        if (d.myRating !== undefined) setMyRating(d.myRating);
        if (d.opponentRating !== undefined) setOpponentRating(d.opponentRating);
        if (d.myGamesPlayed !== undefined) setMyGamesPlayed(d.myGamesPlayed);
      })
      .catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameStatus, gameMode, roomId, authenticated]);

  /* ── Compute ELO change when game ends (multiplayer only) ── */
  useEffect(() => {
    if (gameStatus !== "game-over" || gameMode === "ai") return;
    if (myRatingRef.current === null || opponentRatingRef.current === null) return;
    const result = gameResult === playerColor ? 1 : gameResult === "draw" ? 0.5 : 0;
    setEloChange(computeEloChange(myRatingRef.current, opponentRatingRef.current, result, myGamesPlayedRef.current));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameStatus, gameMode, gameResult, playerColor]);

  /* ── Fetch own rating when an AI game starts (so we know the baseline) ── */
  useEffect(() => {
    if (gameStatus !== "playing" || gameMode !== "ai" || !authenticated) return;
    fetch("/api/chaos/rating", { headers: chaosHeaders() })
      .then(r => r.json())
      .then(d => {
        if (d.rating !== undefined) setMyRating(d.rating);
        if (d.gamesPlayed !== undefined) setMyGamesPlayed(d.gamesPlayed);
      })
      .catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameStatus, gameMode, authenticated]);

  /* ── Compute ELO change when an AI game ends ── */
  useEffect(() => {
    if (gameStatus !== "game-over" || gameMode !== "ai") return;
    const aiRating = aiLevel === "hard" ? 1600 : aiLevel === "medium" ? 1200 : 800;
    const result: 1 | 0.5 | 0 = gameResult === playerColor ? 1 : gameResult === "draw" ? 0.5 : 0;
    const baseline = myRatingRef.current ?? DEFAULT_CHAOS_ELO;
    const games = myGamesPlayedRef.current;
    setEloChange(computeEloChange(baseline, aiRating, result, games));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameStatus, gameMode, gameResult, playerColor, aiLevel]);

  /* ── Fetch top 5 leaderboard entries for the setup screen ── */
  useEffect(() => {
    fetch("/api/chaos/leaderboard?limit=5")
      .then(r => r.json())
      .then(d => setSetupLeaderboard(d.entries ?? []))
      .catch(() => {});
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
        const chaosMvs = getChaosMoves(g, cs.playerModifiers, g.turn() as Color, cs.assignedSquares, cs.aiModifiers);
        setAvailableChaosMoves(chaosMvs);
      } else {
        setAvailableChaosMoves([]);
      }

      // Recompute chained squares for kings-chains modifier
      const playerC: Color = playerColor === "white" ? "w" : "b";
      const aiC: Color = playerColor === "white" ? "b" : "w";
      const hasPlayerChains = cs.playerModifiers.some((m) => m.id === "kings-chains");
      const hasAiChains = cs.aiModifiers.some((m) => m.id === "kings-chains");
      if (hasPlayerChains || hasAiChains) {
        const newAssigned = { ...(cs.assignedSquares ?? {}) };
        if (hasPlayerChains) newAssigned[`${playerC}_kings-chains`] = computeChainedSquare(g, playerC);
        if (hasAiChains) newAssigned[`${aiC}_kings-chains`] = computeChainedSquare(g, aiC);
        setChaosState((prev) => ({ ...prev, assignedSquares: newAssigned }));
      }
    },
    [playerColor, setChaosState],
  );

  /* ── Helper: add move to log ── */
  const addMoveToLog = useCallback((g: Chess, san: string, moveColor: "w" | "b") => {
    setMoveLog((prev) => {
      const copy = [...prev];
      // chess.js fullmove number increments after Black moves:
      // - White move belongs to current fullmove number
      // - Black move belongs to previous fullmove number
      const mn = Math.max(1, moveColor === "w" ? g.moveNumber() : g.moveNumber() - 1);
      const existing = copy.find((e) => e.moveNumber === mn);
      if (moveColor === "w") {
        if (existing) existing.white = san;
        else copy.push({ moveNumber: mn, white: san });
      } else {
        if (existing) existing.black = san;
        else copy.push({ moveNumber: mn, black: san });
      }
      copy.sort((a, b) => a.moveNumber - b.moveNumber);
      return copy;
    });
  }, []);

  /* ── Check for game end ── */
  const checkGameEnd = useCallback((g: Chess, captureAt?: string) => {
    // King-capture fallback: chaos moves can land on the king square.
    // If a king is missing from the board, the side that captured it wins.
    const board = g.board();
    let whiteKingFound = false;
    let blackKingFound = false;
    for (const row of board) {
      for (const sq of row) {
        if (sq?.type === "k") {
          if (sq.color === "w") whiteKingFound = true;
          else blackKingFound = true;
        }
      }
    }
    if (!whiteKingFound || !blackKingFound) {
      const winner = !whiteKingFound ? "black" : "white";
      const youWin = winner === playerColor;
      // Fire king-death effect then delay popup
      if (captureAt) triggerEffect("king-death", [captureAt]);
      isAnimatingEndRef.current = true;
      if (youWin) { playSound("airhorn"); spawnPepe(PEPE.gigachad); }
      else { playSound("mario-death"); spawnPepe(PEPE.gamercry); }
      setTimeout(() => {
        isAnimatingEndRef.current = false;
        setGameResult(winner);
        setGameStatus("game-over");
        setEndReason("King Captured");
        setEventLog((prev) => [
          ...prev,
          {
            type: "chaos",
            message: `👑 ${winner === "white" ? "White" : "Black"} captured the enemy King!`,
            icon: "👑",
            pepe: youWin ? PEPE.gigachad : PEPE.gamercry,
          },
        ]);
        if (youWin) spawnPepe(PEPE.clap);
      }, captureAt ? KING_DEATH_POPUP_DELAY : 0);
      return true;
    }

    if (g.isCheckmate()) {
      // Before declaring checkmate, check if the checkmated side has chaos escape moves.
      const checkmatedColor = g.turn() as Color;
      const isPlayerCheckmated =
        (playerColor === "white" && checkmatedColor === "w") ||
        (playerColor === "black" && checkmatedColor === "b");
      const checkmatedMods = isPlayerCheckmated
        ? chaosStateRef.current.playerModifiers
        : chaosStateRef.current.aiModifiers;
      const attackerModsForCheckmate = isPlayerCheckmated
        ? chaosStateRef.current.aiModifiers
        : chaosStateRef.current.playerModifiers;
      if (checkmatedMods.length > 0) {
        const chaosEscapes = getChaosMoves(
          g, checkmatedMods, checkmatedColor,
          chaosStateRef.current.assignedSquares ?? undefined,
          attackerModsForCheckmate,
        );
        if (chaosEscapes.length > 0) return false;
      }
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
      // Before declaring stalemate, check if the stalemated side has chaos moves available.
      // Chaos moves are extra legal moves; if any exist, it's not truly stalemate.
      if (g.isStalemate()) {
        const stalematedColor = g.turn() as Color;
        const isPlayerStalemated =
          (playerColor === "white" && stalematedColor === "w") ||
          (playerColor === "black" && stalematedColor === "b");
        const stalematedMods = isPlayerStalemated
          ? chaosStateRef.current.playerModifiers
          : chaosStateRef.current.aiModifiers;
        if (stalematedMods.length > 0) {
          const staleChaosMoves = getChaosMoves(
            g, stalematedMods, stalematedColor,
            chaosStateRef.current.assignedSquares ?? undefined,
          );
          if (staleChaosMoves.length > 0) return false;
        }
      }
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

    // Chaos checkmate: king is in check but chess.js doesn't detect checkmate
    // because all "legal" king escapes land on chaos-controlled squares.
    if (g.inCheck() && !g.isCheckmate()) {
      const checkedColor = g.turn() as "w" | "b";
      const attackerColor: Color = checkedColor === "w" ? "b" : "w";
      const isPlayerChecked =
        (playerColor === "white" && checkedColor === "w") ||
        (playerColor === "black" && checkedColor === "b");
      const attackerMods = isPlayerChecked
        ? chaosStateRef.current.aiModifiers
        : chaosStateRef.current.playerModifiers;
      const defenderMods = isPlayerChecked
        ? chaosStateRef.current.playerModifiers
        : chaosStateRef.current.aiModifiers;
      if (isChaosCheckmate(g, attackerMods, attackerColor, chaosStateRef.current.assignedSquares ?? undefined, defenderMods)) {
        const winner = checkedColor === "w" ? "black" : "white";
        setGameResult(winner);
        setGameStatus("game-over");
        setEndReason("Checkmate");
        const youWin = winner === playerColor;
        setEventLog((prev) => [
          ...prev,
          {
            type: "chaos",
            message: `♟️ Chaos Checkmate! ${winner === "white" ? "White" : "Black"} wins — every escape was sealed!`,
            icon: "♟️",
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
            const playerPieceCounts = countPiecesFromFen(g.fen(), "w");
            const choices = rollDraftChoices(phase, state.playerModifiers, undefined, playerPieceCounts);
            setChaosState((prev) => ({
              ...prev,
              isDrafting: true,
              draftingSide: "player",
              draftChoices: choices,
            }));
            setGameStatus("drafting");
            setWaitingForOpponentDraft(false);
            // Immediately freeze opponent's board so they can't move while we pick
            if (partySendRef.current) {
              partySendRef.current({ type: "draft_freeze" });
            }
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
          // AI mode: show draft immediately after player's move, before AI responds
          setPendingPhase(phase);
          prevPhaseRef.current = phase;
          const playerColor_ = playerColor === "white" ? "w" : "b";
          const playerPieceCounts = countPiecesFromFen(g.fen(), playerColor_);
          const choices = rollDraftChoices(phase, state.playerModifiers, undefined, playerPieceCounts);
          setChaosState((prev) => ({ ...prev, isDrafting: true, draftingSide: "player", draftChoices: choices }));
          setGameStatus("drafting");
          setEventLog((prev) => [
            ...prev,
            {
              type: "draft",
              message: `⏸️ Turn ${g.moveNumber()} — CHAOS DRAFT Phase ${phase}! Choose your power-up.`,
              icon: "⏸️",
              pepe: phase <= 2 ? PEPE.think : phase <= 4 ? PEPE.shocked : PEPE.galaxybrain,
            },
          ]);
          playSound("record-scratch");
          spawnPepe(phase >= 4 ? PEPE.shocked : PEPE.bigeyes);
          return true;
        }
        return true;
      }
      return false;
    },
    [spawnPepe, gameMode, playerColor],
  );

  /* ── Apply post-move effects (collateral rook, nuclear queen, pawn fortress) ── */
  const applyPostMove = useCallback(
    (g: Chess, from: CbSquare, to: CbSquare, captured: boolean, pieceType: PieceSymbol, color: Color, mods: ChaosModifier[], opponentMods?: ChaosModifier[], capturedType?: PieceSymbol) => {
      const result = applyPostMoveEffects(g, from as any, to as any, captured, pieceType, color, mods, opponentMods, capturedType);
      if (result) {
        if (mods.some((m) => m.id === "collateral-rook") && pieceType === "r" && captured) {
          // Explosion on capture square + collateral square one step beyond
          const dirF = Math.sign(to.charCodeAt(0) - from.charCodeAt(0));
          const dirR = Math.sign(parseInt(to[1]) - parseInt(from[1]));
          const colFile = String.fromCharCode(to.charCodeAt(0) + dirF);
          const colRank = String(parseInt(to[1]) + dirR);
          const effectSqs = [to as string];
          if (colFile >= "a" && colFile <= "h" && colRank >= "1" && colRank <= "8") {
            effectSqs.push(`${colFile}${colRank}`);
          }
          triggerEffect("explosion", effectSqs);
          setEventLog((prev) => [...prev, { type: "chaos", message: "💥 Collateral Damage! The rook destroyed the piece behind its target!", icon: "💥", pepe: PEPE.firesgun }]);
          spawnPepe(PEPE.firesgun);
          playSound("yeet");
        }
        if (mods.some((m) => m.id === "nuclear-queen") && pieceType === "q" && captured) {
          // Nuke burst on capture square, standard explosions on all 8 adjacent squares
          triggerEffect("nuke", [to as string]);
          const qf = to.charCodeAt(0) - 97;
          const qr = parseInt(to[1]) - 1;
          const surrounding: string[] = [];
          for (let df = -1; df <= 1; df++) {
            for (let dr = -1; dr <= 1; dr++) {
              if (df === 0 && dr === 0) continue;
              const nf = qf + df; const nr = qr + dr;
              if (nf >= 0 && nf <= 7 && nr >= 0 && nr <= 7) {
                surrounding.push(`${String.fromCharCode(97 + nf)}${nr + 1}`);
              }
            }
          }
          setTimeout(() => triggerEffect("explosion", surrounding), 150);
          setEventLog((prev) => [...prev, { type: "chaos", message: "☢️ NUCLEAR QUEEN! All surrounding pieces destroyed!", icon: "☢️", pepe: PEPE.madpuke }]);
          spawnPepe(PEPE.madpuke);
          playSound("airhorn");
        }
        if (opponentMods?.some((m) => m.id === "pawn-fortress") && capturedType === "p" && captured) {
          // Spawn glow on the pawn's starting square (same file, back rank)
          const pawnColor: Color = color === "w" ? "b" : "w";
          const startRank = pawnColor === "w" ? "2" : "7";
          triggerEffect("spawn", [`${to[0]}${startRank}`]);
          setEventLog((prev) => [...prev, { type: "chaos", message: "🏰 Pawn Fortress! The captured pawn respawned on its starting square!", icon: "🏰", pepe: PEPE.shocked }]);
          spawnPepe(PEPE.shocked);
          playSound("crowd-ooh");
        }
        if (mods.some((m) => m.id === "king-wrath") && pieceType === "k" && captured) {
          // Regicide: a piece was revived on the back rank
          triggerEffect("spawn", [to as string]);
          setEventLog((prev) => [...prev, { type: "chaos", message: "👑 Regicide! The King's conquest summoned a fallen warrior!", icon: "👑", pepe: PEPE.gigachad }]);
          spawnPepe(PEPE.gigachad);
          playSound("crowd-ooh");
        }
        return result;
      }
      return g;
    },
    [spawnPepe, triggerEffect],
  );

  /* ── AI move (with chaos modifiers) ── */
  const makeAiMove = useCallback(
    async (g: Chess, cs: ChaosState, onComplete?: (finalGame: Chess, finalCs: ChaosState) => void) => {
      if (g.isGameOver()) return;
      setIsThinking(true);

      try {
        // AI can also use chaos moves
        const aiColor = playerColor === "white" ? "b" : "w";
        const aiChaosMoves = getChaosMoves(g, cs.aiModifiers, aiColor as Color, cs.assignedSquares, cs.playerModifiers);

        // Forced En Passant: if player has this, AI must play EP when available — skip chaos
        const forcedEpForAI = cs.playerModifiers.some((m) => m.id === "forced-en-passant") &&
          g.moves({ verbose: true }).some((m: { flags: string }) => m.flags.includes("e"));

        // Evaluate chaos moves — captures sorted by material gain are always evaluated;
        // positional (non-capture) chaos moves are considered 30% of the time.
        if (aiChaosMoves.length > 0 && !forcedEpForAI) {
          // Chaos-aware piece value lookup: upgraded pieces are worth more
          const getVal = (sq: string, pieceType: string, pColor: "w" | "b") =>
            getChaosPieceValCp(sq, pieceType, pColor,
              pColor === (aiColor as string) ? cs.aiModifiers : cs.playerModifiers,
              cs.assignedSquares ?? undefined);

          // Sort captures by net material gain (greedy-first), always evaluate up to 6
          const chaosCaps = aiChaosMoves
            .filter(cm => cm.type === "capture")
            .map(cm => {
              const target   = g.get(cm.to   as any);
              const attacker = g.get(cm.from as any);
              const targetVal   = target   ? getVal(cm.to,   target.type,   target.color   as "w" | "b") : 0;
              const attackerVal = attacker ? getVal(cm.from, attacker.type, attacker.color as "w" | "b") : 0;
              const gain = targetVal - attackerVal * 0.35;
              return { cm, gain };
            })
            .sort((a, b) => b.gain - a.gain);

          const chaosNonCaps = aiChaosMoves.filter(cm => cm.type !== "capture");
          const sample = [
            ...chaosCaps.slice(0, 6).map(x => x.cm),
            ...(Math.random() < 0.30 ? chaosNonCaps.slice(0, 3) : []),
          ];

          if (sample.length > 0) {
          // Get normal Stockfish eval as baseline
          const normalResult = await stockfishPool.evaluateFen(g.fen(), aiDepth);
          const normalEvalRaw = normalResult?.cp ?? 0; // from AI's (side-to-move) perspective
          // Adjust the baseline by the phantom/chaos threat already present in the current position
          // so the chaos-move comparison is on the same scale as the adjusted chaos evals below.
          const playerColorForChaos = playerColor === "white" ? "w" : "b";
          const chaosValFnBase = (sq: string, type: string, col: string) =>
            getChaosPieceValCp(sq, type, col as "w" | "b",
              col === playerColorForChaos ? cs.playerModifiers : cs.aiModifiers,
              cs.assignedSquares ?? undefined);
          const baselinePenalty = cs.playerModifiers.length > 0
            ? computeChaosThreatPenalty(g, cs.playerModifiers, playerColorForChaos as Color, cs.assignedSquares ?? undefined, chaosValFnBase)
            : 0;
          const normalEval = normalEvalRaw - baselinePenalty;

          const evalDepth = Math.min(aiDepth, 10);

          type ScoredChaos = { move: ChaosMove; eval: number; game: Chess };
          const scored: ScoredChaos[] = [];

          for (const cm of sample) {
            // King-capture via chaos move — declare instant win for AI
            const targetAtChaosTo = g.get(cm.to as any);
            if (targetAtChaosTo?.type === "k") {
              scored.push({ move: cm, eval: 1_000_000, game: g });
              continue;
            }
            const newGame = executeChaosMove(g, cm, cs.aiModifiers);
            if (!newGame) continue;
            // Eval the resulting position — cp is from the player's perspective (side to move after AI's chaos move)
            const er = await stockfishPool.evaluateFen(newGame.fen(), evalDepth);
            if (er) {
              let chaosEval = -(er.cp ?? 0);
              // Subtract chaos threat penalty from the resulting position so the AI doesn't
              // pick a chaos move that enables the player's phantom rook (or other chaos piece)
              // to recapture through friendly pieces.
              if (cs.playerModifiers.length > 0) {
                const pCol = playerColorForChaos as Color;
                const chaosValFn = (sq: string, type: string, col: string) =>
                  getChaosPieceValCp(sq, type, col as "w" | "b",
                    col === playerColorForChaos ? cs.playerModifiers : cs.aiModifiers,
                    cs.assignedSquares ?? undefined);
                chaosEval -= computeChaosThreatPenalty(
                  newGame, cs.playerModifiers, pCol, cs.assignedSquares ?? undefined, chaosValFn);
              }
              scored.push({ move: cm, eval: chaosEval, game: newGame });
            }
          }

          if (scored.length > 0) {
            // Pick the best-evaluated chaos move
            scored.sort((a, b) => b.eval - a.eval);
            const best = scored[0];

            // Captures tolerated 50 cp below normal eval (Stockfish was blind to this threat);
            // non-captures need to roughly match normal play (30 cp tolerance)
            if (best.eval >= normalEval - (best.move.type === "capture" ? 50 : 30)) {
              // AI captured the player's king via chaos move
              if (best.eval >= 1_000_000) {
                const aiWinner = playerColor === "white" ? "black" : "white";
                const captured = best.move.to;
                setLastMoveHighlight({
                  [best.move.from]: { backgroundColor: "rgba(220,38,38,0.4)" },
                  [captured]: { backgroundColor: "rgba(255,215,0,0.55)" },
                });
                triggerEffect("king-death", [captured]);
                playSound("mario-death");
                spawnPepe(PEPE.gamercry);
                setIsThinking(false);
                setTimeout(() => {
                  setGameResult(aiWinner);
                  setGameStatus("game-over");
                  setEndReason("King Captured");
                  setEventLog((prev) => [
                    ...prev,
                    { type: "chaos", message: `👑 AI captured your King!`, icon: "👑", pepe: PEPE.gamercry },
                  ]);
                }, KING_DEATH_POPUP_DELAY);
                return;
              }
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

              // Trigger board effect for AI chaos move
              { const mid = chaosMove.modifierId;
                if (mid === "queen-teleport") {
                  triggerEffect("teleport", [chaosMove.from, chaosMove.to]);
                } else if (mid === "pegasus") {
                  triggerEffect("pegasus", [chaosMove.from, chaosMove.to]);
                } else if (mid === "bishop-bounce") {
                  triggerEffect("ricochet", [chaosMove.from, chaosMove.to]);
                  startRicochetAnim(chaosMove, aiColor as "w" | "b");
                } else if (mid === "rook-cannon") {
                  triggerEffect("cannon", [chaosMove.to]);
                  setTimeout(() => triggerEffect("explosion", [chaosMove.to]), 350);
                } else if (chaosMove.type === "capture") {
                  triggerEffect("explosion", [chaosMove.to]);
                } else {
                  triggerEffect("flash", [chaosMove.to]);
                }
              }

              // Update tracked pieces
              let cs2 = updateTrackedPieces(cs, chaosMove.from, chaosMove.to, chaosMove.type === "capture");
              let activeGame = newGame;

              setChaosState(cs2);
              setGame(activeGame);
              setSelectedSquare(null);
              setLegalMoveSquares({});
              setIsThinking(false);
              if (!checkGameEnd(activeGame, chaosMove.to)) {
                recomputeChaosMoves(activeGame, cs2);
              }
              onComplete?.(activeGame, cs2);
              return;
            }
          }
          } // if (sample.length > 0)
        }

        // Chaos-threat-aware Stockfish move
        // Get top 5 candidate moves, then pick the one with the best
        // eval after accounting for the player's chaos threats
        const playerColor_ = playerColor === "white" ? "w" : "b";
        const hasPlayerChaosMods = cs.playerModifiers.length > 0;
        const hasAiChaosMods = cs.aiModifiers.length > 0;
        const needsTopMoves = hasPlayerChaosMods || hasAiChaosMods;
        const topMoves = needsTopMoves
          ? await stockfishPool.getTopMoves(g.fen(), 5, aiDepth)
          : [];

        // Escape-move injection: Stockfish's top-5 are blind to chaos rules, so if the player
        // already threatens an AI piece right now (e.g. bayonet pawn in front of the queen),
        // inject legal escape moves for those pieces so the penalty loop can find them.
        if (hasPlayerChaosMods) {
          const valFn = (sq: string, type: string, col: string) =>
            getChaosPieceValCp(sq, type, col as "w" | "b",
              col === playerColor_ ? cs.playerModifiers : cs.aiModifiers,
              cs.assignedSquares ?? undefined);
          const immediateThreats = computeChaosThreatPenalty(
            g, cs.playerModifiers, playerColor_ as Color, cs.assignedSquares ?? undefined, valFn);
          if (immediateThreats > 200) {
            const chaosAttacked = getChaosAttackedSquares(
              g, cs.playerModifiers, playerColor_ as Color, cs.assignedSquares ?? undefined);
            // Collect legal moves that save the threatened piece(s) — skip king (handled separately)
            const escapeMoves = g.moves({ verbose: true }).filter(
              (mv: { from: string; piece: string }) => chaosAttacked.has(mv.from as any) && mv.piece !== "k",
            );
            const escapeDepth = Math.min(aiDepth, 8);
            for (const mv of escapeMoves.slice(0, 6)) {
              const tmpGame = new Chess(g.fen());
              try { tmpGame.move({ from: mv.from, to: mv.to, promotion: mv.promotion }); } catch { continue; }
              // cp after AI's escape is from the player's (side-to-move) perspective — negate for AI
              const er = await stockfishPool.evaluateFen(tmpGame.fen(), escapeDepth);
              if (er) topMoves.push({ bestMove: mv.lan, pvMoves: [mv.lan], cp: -(er.cp ?? 0) });
            }
          }
        }

        // Enhanced-piece protection injection: if any AI extra-value piece (Knook, Pegasus, etc.)
        // is capturable by the player in the current position, Stockfish won't try to escape it
        // (it sees knight=knight, not Knook=800). Inject escape moves so the penalty loop can pick them.
        if (hasAiChaosMods) {
          const aiCol2 = playerColor_ === "w" ? "b" : "w";
          const STD_VAL: Record<string, number> = { p: 100, n: 325, b: 325, r: 500, q: 900 };
          // Flip FEN active color to get player's candidate captures in the current position
          const fenParts = g.fen().split(" ");
          fenParts[1] = playerColor_;
          const threatenedAiSqs = new Set<string>();
          try {
            const flipGame = new Chess(fenParts.join(" "));
            for (const mv of flipGame.moves({ verbose: true }) as any[]) {
              if (!mv.flags.includes("c")) continue;
              const p = g.get(mv.to as any);
              if (!p || p.color !== aiCol2) continue;
              const chaosVal = getChaosPieceValCp(mv.to, p.type, aiCol2 as "w" | "b", cs.aiModifiers, cs.assignedSquares ?? undefined);
              if (chaosVal - (STD_VAL[p.type] ?? 100) > 100) threatenedAiSqs.add(mv.to);
            }
          } catch { /* flipped position illegal – skip */ }
          if (threatenedAiSqs.size > 0) {
            const escDepth2 = Math.min(aiDepth, 8);
            for (const mv of (g.moves({ verbose: true }) as any[]).filter((m: { from: string }) => threatenedAiSqs.has(m.from)).slice(0, 6)) {
              const tmpEsc = new Chess(g.fen());
              try { tmpEsc.move({ from: mv.from, to: mv.to, promotion: mv.promotion }); } catch { continue; }
              const er = await stockfishPool.evaluateFen(tmpEsc.fen(), escDepth2);
              if (er) topMoves.push({ bestMove: mv.lan, pvMoves: [mv.lan], cp: -(er.cp ?? 0) });
            }
          }
        }

        let bestUci: string | null = null;

        if (needsTopMoves && topMoves.length > 0) {
          const aiCol3 = playerColor_ === "w" ? "b" : "w";
          const STD_VAL2: Record<string, number> = { p: 100, n: 325, b: 325, r: 500, q: 900 };
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
            // 1. Chaos threat penalty: player's chaos pieces threatening AI pieces
            const penalty = hasPlayerChaosMods ? computeChaosThreatPenalty(
              tmpGame, cs.playerModifiers, playerColor_ as Color, cs.assignedSquares ?? undefined,
              (sq, type, col) => getChaosPieceValCp(sq, type, col as "w" | "b",
                col === playerColor_ ? cs.playerModifiers : cs.aiModifiers,
                cs.assignedSquares ?? undefined),
            ) : 0;
            // 2. Enhanced exposure penalty: Stockfish undervalues the AI's own chaos-enhanced pieces.
            // If an AI enhanced piece sits on a square the player can capture after this move,
            // penalise by the extra value above what Stockfish's standard eval accounts for.
            let enhancedPenalty = 0;
            if (hasAiChaosMods) {
              const playerCaptures = new Set<string>(
                (tmpGame.moves({ verbose: true }) as any[])
                  .filter((mv: { flags: string }) => mv.flags.includes("c") || mv.flags.includes("e"))
                  .map((mv: { to: string }) => mv.to)
              );
              const board2 = tmpGame.board();
              for (let ri = 0; ri < 8; ri++) {
                for (let fi = 0; fi < 8; fi++) {
                  const p = board2[ri][fi];
                  if (!p || p.color !== aiCol3) continue;
                  const sqName = `${"abcdefgh"[fi]}${8 - ri}`;
                  if (!playerCaptures.has(sqName)) continue;
                  const chaosVal = getChaosPieceValCp(sqName, p.type, aiCol3 as "w" | "b", cs.aiModifiers, cs.assignedSquares ?? undefined);
                  const stdVal = STD_VAL2[p.type] ?? 100;
                  if (chaosVal > stdVal) enhancedPenalty += chaosVal - stdVal;
                }
              }
            }
            const adjusted = candidate.cp - penalty - enhancedPenalty;
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
            // Helper: is king move from->to chaos-unsafe?
            const isKingChaosUnsafe = (fromSq: string, toSq: string): boolean => {
              const tmp = new Chess(g.fen());
              tmp.remove(fromSq as any);
              if (tmp.get(toSq as any)) tmp.remove(toSq as any);
              tmp.put({ type: "k", color: aiTurn }, toSq as any);
              const ca = getChaosAttackedSquares(tmp, cs.playerModifiers, playerC, cs.assignedSquares ?? undefined);
              return ca.has(toSq as any);
            };

            if (isKingChaosUnsafe(from, to)) {
              const allLegal = g.moves({ verbose: true });
              // Prefer top-ranked non-king moves (can't land king in danger if king doesn't move)
              const nonKingMoves = allLegal.filter((m) => m.piece !== "k");
              if (nonKingMoves.length > 0) {
                // Pick the non-king move with the highest Stockfish ranking (topMoves order)
                const topUciOrder = topMoves
                  .map((t) => t.bestMove ?? t.pvMoves[0])
                  .filter(Boolean) as string[];
                const topRanked = topUciOrder.find((u) => nonKingMoves.some((m) => m.lan === u));
                bestUci = topRanked ?? nonKingMoves[0].lan;
              } else {
                // Only king moves available — find a chaos-safe one
                const safeKingMoves = allLegal.filter(
                  (m) => m.piece === "k" && !isKingChaosUnsafe(m.from, m.to),
                );
                if (safeKingMoves.length > 0) {
                  const topUciOrder = topMoves
                    .map((t) => t.bestMove ?? t.pvMoves[0])
                    .filter(Boolean) as string[];
                  const topRankedSafe = topUciOrder.find((u) =>
                    safeKingMoves.some((m) => m.lan === u),
                  );
                  bestUci = topRankedSafe ?? safeKingMoves[0].lan;
                }
                // else: all king moves are chaos-unsafe — forced, bestUci stays
              }
            }
          }
        }

        // If AI king is under chaos-only check, force it to play an escaping move
        const playerChaosMods = cs.playerModifiers;
        const playerC3: Color = playerColor === "white" ? "w" : "b";
        if (playerChaosMods.length > 0 && isKingUnderChaosAttack(g, playerChaosMods, playerC3, cs.assignedSquares ?? undefined)) {
          const ceFen = g.fen();
          const ceFrom = bestUci!.slice(0, 2);
          const ceTo = bestUci!.slice(2, 4);
          const cePromo = bestUci!.length > 4 ? bestUci![4] : undefined;
          const ceTmp = new Chess(ceFen);
          let chaosEscaped = false;
          try {
            ceTmp.move({ from: ceFrom, to: ceTo, promotion: cePromo });
            chaosEscaped = !isKingUnderChaosAttack(ceTmp, playerChaosMods, playerC3, cs.assignedSquares ?? undefined);
          } catch { /* invalid move */ }
          if (!chaosEscaped) {
            // Find all legal moves that escape the chaos check — prefer topMoves order
            const allLegal = g.moves({ verbose: true });
            const escaping = allLegal.filter((mv) => {
              const t = new Chess(ceFen);
              try { t.move({ from: mv.from, to: mv.to, promotion: mv.promotion }); } catch { return false; }
              return !isKingUnderChaosAttack(t, playerChaosMods, playerC3, cs.assignedSquares ?? undefined);
            });
            if (escaping.length > 0) {
              const topUciOrder = topMoves
                .map((t) => t.bestMove ?? t.pvMoves[0])
                .filter(Boolean) as string[];
              const topRanked = topUciOrder.find((u) => escaping.some((m) => m.lan === u));
              bestUci = topRanked ?? escaping[0].lan;
            }
            // else: truly trapped — checkmate logic will handle it
          }
        }

        // Forced En Passant: if player has this modifier and EP is available, AI must play it
        if (cs.playerModifiers.some((m) => m.id === "forced-en-passant")) {
          const epMoves = g.moves({ verbose: true }).filter((m: { flags: string; from: string; to: string }) => m.flags.includes("e"));
          if (epMoves.length > 0) {
            bestUci = `${epMoves[0].from}${epMoves[0].to}`;
          }
        }

        // King's Chains: don't move the piece chained by the player's king
        const playerChainColor: Color = playerColor === "white" ? "w" : "b";
        const chainedByPlayer = cs.assignedSquares?.[`${playerChainColor}_kings-chains`];
        if (chainedByPlayer && bestUci && bestUci.startsWith(chainedByPlayer)) {
          const allLegal = g.moves({ verbose: true });
          const nonChained = allLegal.filter((mv: { from: string }) => mv.from !== chainedByPlayer);
          if (nonChained.length > 0) {
            const topUciOrder = topMoves.map((t) => t.bestMove ?? t.pvMoves[0]).filter(Boolean) as string[];
            const topRanked = topUciOrder.find((u) => nonChained.some((m: { lan: string }) => m.lan === u));
            bestUci = topRanked ?? (nonChained[0] as { lan: string }).lan;
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
          const afterEffects = applyPostMove(g, finalFrom, finalTo, true, finalPieceAtFrom.type, finalPieceAtFrom.color as Color, aiMods, cs.playerModifiers, moveResult.captured || undefined);
          if (afterEffects !== g) {
            finalGame = afterEffects;
          }
        }

        // Update tracked pieces
        let cs2 = updateTrackedPieces(cs, finalFrom, finalTo, !!moveResult.captured);
        let activeGame2 = new Chess(finalGame.fen());

        setChaosState(cs2);
        setGame(activeGame2);
        // Clear any piece selection the player may have made while the AI was thinking
        setSelectedSquare(null);
        setLegalMoveSquares({});

        // If the AI just checkmated the player, let the board show the move first
        const checkmatedColor = activeGame2.turn() as Color;
        const aiJustCheckmatedPlayer =
          activeGame2.isCheckmate() &&
          ((playerColor === "white" && checkmatedColor === "w") ||
           (playerColor === "black" && checkmatedColor === "b"));

        if (aiJustCheckmatedPlayer) {
          setTimeout(() => { checkGameEnd(activeGame2); }, 1500);
        } else if (!checkGameEnd(activeGame2)) {
          recomputeChaosMoves(activeGame2, cs2);
        }
        onComplete?.(activeGame2, cs2);

      } catch (err) {
        console.warn("[Chaos AI] Engine error:", err);
      }

      setIsThinking(false);
    },
    [playerColor, aiDepth, checkGameEnd, addMoveToLog, applyPostMove, recomputeChaosMoves, chaosState, spawnPepe, triggerEffect],
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
      prevPhaseRef.current = -1;
      pendingAiDraftRef.current = null;
      const tc = timeControlRef.current;
      setTimers({ w: (tc?.base ?? 0) * 1000, b: (tc?.base ?? 0) * 1000 });
      setEloChange(null);
      setEloSaved(false);
      setAiEloSaved(false);
      setMyRating(null);
      setOpponentRating(null);
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
        body: JSON.stringify({
          hostColor: color,
          timeControlSeconds: timeControlRef.current?.base ?? 0,
          incrementSeconds: timeControlRef.current?.inc ?? 0,
        }),
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
      // Init timers so UI shows correct values when game starts
      const tc = timeControlRef.current;
      setTimers({ w: (tc?.base ?? 0) * 1000, b: (tc?.base ?? 0) * 1000 });
      setEloChange(null);
      setEloSaved(false);
      setAiEloSaved(false);
      setMyRating(null);
      setOpponentRating(null);
      // Reset draft refs so a new game always starts with a clean slate
      justDraftedRef.current = false;
      triggeredDraftForPhaseRef.current = -1;
      pendingDraftAfterRevealRef.current = null;
      pendingMoveBeforeDraftRef.current = null;
      pendingAiDraftRef.current = null;
      setWaitingForOpponentDraft(false);
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
      // Init time control and timers from room settings
      if ((data.timeControlSeconds ?? 0) > 0) {
        const tc = TIME_CONTROLS.find((t) => t.base === data.timeControlSeconds) ?? { label: "Custom", base: data.timeControlSeconds as number, inc: (data.incrementSeconds ?? 0) as number };
        setTimeControl(tc);
        setTimers({ w: data.timerWhiteMs ?? data.timeControlSeconds * 1000, b: data.timerBlackMs ?? data.timeControlSeconds * 1000 });
      } else {
        setTimeControl(null);
        setTimers({ w: 0, b: 0 });
      }
      setEloChange(null);
      setEloSaved(false);
      setAiEloSaved(false);
      setMyRating(null);
      setOpponentRating(null);
      recomputeChaosMoves(g, cs);
      // Reset draft refs so a new game always starts with a clean slate
      justDraftedRef.current = false;
      triggeredDraftForPhaseRef.current = -1;
      pendingDraftAfterRevealRef.current = null;
      pendingMoveBeforeDraftRef.current = null;
      setWaitingForOpponentDraft(false);

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
        prevPhaseRef.current = -1;
        justDraftedRef.current = false;
        pendingDraftAfterRevealRef.current = null;
        pendingMoveBeforeDraftRef.current = null;
        pendingAiDraftRef.current = null;
        setWaitingForOpponentDraft(false);
        // Swap colors
        const newColor = playerColor === "white" ? "black" : "white";
        setPlayerColor(newColor);
        // Reset ELO/timer state for new game
        setEloChange(null);
        setEloSaved(false);
        setAiEloSaved(false);
        setMyRating(null);
        setOpponentRating(null);
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

    if (msg.type === "draft_freeze") {
      // Opponent entered their draft phase — freeze our board immediately so we can't
      // make moves that would corrupt the draft state while they're picking
      setWaitingForOpponentDraft(true);
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
            const choices = rollDraftChoices(phaseForDraft, incoming.playerModifiers, undefined, countPiecesFromFen(gameRef.current.fen(), "b"));
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
      // Sync timer values from opponent's move
      if ((data as any).timerWhiteMs !== undefined && (data as any).timerBlackMs !== undefined) {
        setTimers({ w: (data as any).timerWhiteMs, b: (data as any).timerBlackMs });
      }

      const activeGame = g;

      // Check game end / draft
      if (activeGame.isCheckmate() || activeGame.isStalemate() || activeGame.isDraw()) {
        if (activeGame.isCheckmate()) {
          setTimeout(() => checkGameEnd(activeGame), 1500);
        } else {
          checkGameEnd(activeGame);
        }
        if (pollRef.current) clearInterval(pollRef.current);
      } else if (activeGame.inCheck()) {
        // Chaos-checkmate: king is in check but chess.js doesn't see checkmate
        // because escape squares are all chaos-controlled
        const cs2 = data.chaosState ? fromServerChaosState(data.chaosState as ChaosState, playerColor) : undefined;
        if (cs2) {
          // Update ref synchronously so checkGameEnd sees fresh modifiers
          chaosStateRef.current = cs2;
          setChaosState(cs2);
        }
        if (checkGameEnd(activeGame)) {
          if (pollRef.current) clearInterval(pollRef.current);
        } else if (cs2) {
          recomputeChaosMoves(activeGame, cs2);
        }
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
    playerColor,
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
  // Keep chaosState in a ref so stale closures (e.g. checkGameEnd, polling) can access the latest value
  const chaosStateRef = useRef(chaosState);
  chaosStateRef.current = chaosState;

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
              // Init timer from room settings
              if ((data.timeControlSeconds ?? 0) > 0) {
                const tc = TIME_CONTROLS.find((t) => t.base === data.timeControlSeconds) ?? { label: "Custom", base: data.timeControlSeconds as number, inc: (data.incrementSeconds ?? 0) as number };
                setTimeControl(tc);
                setTimers({ w: data.timerWhiteMs ?? data.timeControlSeconds * 1000, b: data.timerBlackMs ?? data.timeControlSeconds * 1000 });
              }
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
                const myColor_ = (myColor as string) === "white" ? "w" : "b" as "w" | "b";
                const choices = rollDraftChoices(phaseForDraft, incoming.playerModifiers, undefined, countPiecesFromFen(gameRef.current.fen(), myColor_));
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

          // Sync opponent's timer values from DB
          if (data.timerWhiteMs !== undefined && data.timerBlackMs !== undefined) {
            setTimers({ w: data.timerWhiteMs, b: data.timerBlackMs });
          }

          const activeGame = g;

          // Check game end from FEN
          if (activeGame.isCheckmate() || activeGame.isStalemate() || activeGame.isDraw()) {
            checkGameEndCbRef.current(activeGame);
            if (pollRef.current) clearInterval(pollRef.current);
          } else if (activeGame.inCheck()) {
            // Chaos-checkmate: in check but not standard checkmate
            const rawCs2 = data.chaosState ? data.chaosState as ChaosState : createChaosState();
            const cs2 = fromServerChaosState(rawCs2, myColor as "white" | "black");
            // Update ref synchronously so checkGameEnd sees fresh modifiers
            chaosStateRef.current = cs2;
            setChaosState(cs2);
            if (checkGameEndCbRef.current(activeGame)) {
              if (pollRef.current) clearInterval(pollRef.current);
            } else {
              recomputeChaosMovesCbRef.current(activeGame, cs2);
            }
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
    (g: Chess, from: string, to: string, cs: ChaosState, isChaosMove = false) => {
      if (!roomId) return;
      // Convert to server perspective (white=playerModifiers, black=aiModifiers)
      const serverCs = toServerChaosState(cs, playerColor);

      // Compute post-increment timers (real moves only, not draft syncs)
      const isRealMove = from !== "" && to !== "";
      const movedSide = isRealMove ? (g.turn() === "w" ? "b" : "w") : null;
      const incMs = (isRealMove && timeControlRef.current) ? timeControlRef.current.inc * 1000 : 0;
      const timerW = movedSide === "w" ? timersRef.current.w + incMs : timersRef.current.w;
      const timerB = movedSide === "b" ? timersRef.current.b + incMs : timersRef.current.b;
      if (isRealMove && incMs > 0) {
        setTimers({ w: timerW, b: timerB });
      }

      let wsMsg: PartyMessage;
      if (from === "" && to === "") {
        wsMsg = { type: "draft", chaosState: serverCs, fen: g.fen() };
      } else if (isChaosMove) {
        // Chaos moves (non-standard): server relays without validation
        wsMsg = {
          type: "chaos_move",
          newFen: g.fen(),
          chaosState: serverCs,
          lastMoveFrom: from,
          lastMoveTo: to,
          capturedPawnsWhite: capturedPawns.w,
          capturedPawnsBlack: capturedPawns.b,
          status: g.isGameOver() ? "finished" : "playing",
          timerWhiteMs: timerW,
          timerBlackMs: timerB,
        };
      } else {
        // Standard move: server validates with chess.js before broadcasting
        wsMsg = {
          type: "move",
          fen: g.fen(),
          chaosState: serverCs,
          lastMoveFrom: from,
          lastMoveTo: to,
          capturedPawnsWhite: capturedPawns.w,
          capturedPawnsBlack: capturedPawns.b,
          status: g.isGameOver() ? "finished" : "playing",
          timerWhiteMs: timerW,
          timerBlackMs: timerB,
        };
      }

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
        timerWhiteMs: timerW,
        timerBlackMs: timerB,
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
      if (isAnimatingEndRef.current) return false;
      if (waitingForOpponentDraft) return false;

      const isPlayerTurn =
        (playerColor === "white" && game.turn() === "w") ||
        (playerColor === "black" && game.turn() === "b");
      if (!isPlayerTurn) return false;

      // King's Chains: block the piece chained by the opponent's king from moving
      const aiChainColor = playerColor === "white" ? "b" : "w";
      const chainedByAi = chaosState.assignedSquares?.[`${aiChainColor}_kings-chains`];
      if (chainedByAi && from === chainedByAi) return false;

      // Forced En Passant: if AI has this modifier and standard EP is available, player must play it
      if (chaosState.aiModifiers.some((m) => m.id === "forced-en-passant")) {
        const epMoves = game.moves({ verbose: true }).filter(
          (m: { flags: string; from: string; to: string }) => m.flags.includes("e")
        );
        if (epMoves.length > 0 && !epMoves.some((m: { from: string; to: string }) => m.from === from && m.to === to)) {
          return false; // must play en passant
        }
      }

      // First check if this is a chaos move
      const chaosMove = activeChaosMoves.find(
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

        // King-capture via chaos move — chess.js rejects kingless FENs so we must
        // intercept and declare the win before calling executeChaosMove.
        const targetPieceAtTo = game.get(chaosMove.to as any);
        if (targetPieceAtTo?.type === "k") {
          // Let the board animation play before showing game-over popup
          isAnimatingEndRef.current = true;
          setLastMoveHighlight({
            [from]: { backgroundColor: "rgba(220,38,38,0.4)" },
            [to]: { backgroundColor: "rgba(255,215,0,0.55)" },
          });
          triggerEffect("king-death", [to]);
          playSound("airhorn");
          spawnPepe(PEPE.gigachad);
          setTimeout(() => {
            isAnimatingEndRef.current = false;
            setGameResult(playerColor);
            setGameStatus("game-over");
            setEndReason("King Captured");
            setEventLog((prev) => [
              ...prev,
              { type: "chaos", message: `👑 You captured the enemy King!`, icon: "👑", pepe: PEPE.gigachad },
            ]);
            spawnPepe(PEPE.clap);
          }, KING_DEATH_POPUP_DELAY);
          return true;
        }

        const newGame = executeChaosMove(game, chaosMove, chaosState.playerModifiers);
        if (!newGame) return false;

        // Trigger board effect based on the modifier used
        { const mid = chaosMove.modifierId;
          if (mid === "queen-teleport") {
            triggerEffect("teleport", [from, to]);
          } else if (mid === "pegasus") {
            triggerEffect("pegasus", [from, to]);
          } else if (mid === "bishop-bounce") {
            triggerEffect("ricochet", [from, to]);
            startRicochetAnim(chaosMove, playerColor === "white" ? "w" : "b");
          } else if (mid === "rook-cannon") {
            triggerEffect("cannon", [to]);
            setTimeout(() => triggerEffect("explosion", [to]), 350);
          } else if (mid === "king-ascension") {
            triggerEffect("explosion", [to]);
          } else if (chaosMove.type === "capture") {
            triggerEffect("explosion", [to]);
          } else {
            triggerEffect("flash", [to]);
          }
        }

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
        playSound("crowd-ooh");

        setGame(newGame);

        // Update tracked pieces
        let cs = updateTrackedPieces(chaosState, from, to, chaosMove.type === "capture");
        let activeGame = newGame;

        // Check game end first — checkmate wins immediately
        setChaosState(cs);
        if (checkGameEnd(activeGame, chaosMove.type === "capture" ? chaosMove.to : undefined)) return true;

        const drafted = checkDraft(activeGame, cs);

        // Multiplayer: send to server (or hold for draft pick)
        // Only hold the move if THIS player is actually about to open the draft picker:
        //   - White triggered the draft (White drafts first in multiplayer)
        //   - Black has a deferred draft queued from White's step-1 broadcast
        // If Black's move merely hit the draft counter threshold, send immediately.
        if (gameMode !== "ai") {
          const holdForDraft = (drafted && playerColor === "white") || !!pendingDraftAfterRevealRef.current;
          if (!holdForDraft) {
            sendMoveToServer(activeGame, from, to, cs, true);
          } else {
            // Draft about to open — hold the move and send it bundled with the pick
            pendingMoveBeforeDraftRef.current = { from, to };
          }
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

      // Block moves that don't escape a chaos-only check on the player's king
      const aiColorCode: Color = playerColor === "white" ? "b" : "w";
      if (chaosState.aiModifiers.length > 0 && isKingUnderChaosAttack(game, chaosState.aiModifiers, aiColorCode, chaosState.assignedSquares ?? undefined)) {
        const simTmp = new Chess(game.fen());
        let escapesCheck = false;
        try {
          simTmp.move({ from, to, promotion: pieceAtFrom?.type === "p" ? "q" : undefined });
          escapesCheck = !isKingUnderChaosAttack(simTmp, chaosState.aiModifiers, aiColorCode, chaosState.assignedSquares ?? undefined);
        } catch { /* invalid move; will fail naturally below */ }
        if (!escapesCheck) return false;
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

      // Apply post-move chaos effects (collateral rook, nuclear queen, pawn fortress)
      let finalGame: Chess = game;
      if (moveResult.captured && pieceAtFrom) {
        const afterEffects = applyPostMove(game, from, to, true, pieceAtFrom.type, pieceAtFrom.color as Color, chaosState.playerModifiers, chaosState.aiModifiers, moveResult.captured || undefined);
        if (afterEffects !== game) {
          finalGame = afterEffects;
        }
      }

      const newG = new Chess(finalGame.fen());

      // Update tracked pieces
      let cs2 = updateTrackedPieces(chaosState, from, to, !!moveResult.captured);
      let activeG = newG;

      // Check game end first — checkmate takes priority.
      setChaosState(cs2);
      setGame(activeG);
      if (activeG.isCheckmate()) {
        setTimeout(() => checkGameEnd(activeG), 1500);
        return true;
      }
      if (checkGameEnd(activeG)) return true;

      const drafted = checkDraft(activeG, cs2);

      // Multiplayer: send to server (or hold for draft pick)
      // Only hold the move if THIS player is actually about to open the draft picker.
      if (gameMode !== "ai") {
        const holdForDraft = (drafted && playerColor === "white") || !!pendingDraftAfterRevealRef.current;
        if (!holdForDraft) {
          sendMoveToServer(activeG, from, to, cs2);
        } else {
          // Draft about to open — hold the move and send it bundled with the pick
          pendingMoveBeforeDraftRef.current = { from, to };
        }
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
    [game, gameStatus, playerColor, isThinking, waitingForOpponentDraft, chaosState, gameMode, activeChaosMoves, checkGameEnd, checkDraft, makeAiMove, addMoveToLog, applyPostMove, sendMoveToServer, spawnPepe, recomputeChaosMoves, isKingMoveChaosUnsafe, triggerEffect],
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
      playSound("crowd-ooh");

      setGame(newGame);

      if (newGame.isCheckmate()) {
        setTimeout(() => checkGameEnd(newGame), 1500);
        return;
      }
      if (checkGameEnd(newGame)) return;
      const drafted = checkDraft(newGame, chaosState);

      if (gameMode !== "ai") {
        const holdForDraft = (drafted && playerColor === "white") || !!pendingDraftAfterRevealRef.current;
        if (!holdForDraft) {
          sendMoveToServer(newGame, move.from, move.to, chaosState, true);
        } else {
          pendingMoveBeforeDraftRef.current = { from: move.from, to: move.to };
        }
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
        const afterEffects = applyPostMove(game, from, to, true, pieceAtFrom.type, pieceAtFrom.color as Color, chaosState.playerModifiers, chaosState.aiModifiers, moveResult.captured || undefined);
        if (afterEffects !== game) finalGame = afterEffects;
      }

      const newG = new Chess(finalGame.fen());
      setGame(newG);

      if (newG.isCheckmate()) {
        setTimeout(() => checkGameEnd(newG), 1500);
        return;
      }
      if (checkGameEnd(newG)) return;
      const drafted = checkDraft(newG, chaosState);

      if (gameMode !== "ai") {
        const holdForDraft = (drafted && playerColor === "white") || !!pendingDraftAfterRevealRef.current;
        if (!holdForDraft) {
          sendMoveToServer(newG, from, to, chaosState);
        } else {
          pendingMoveBeforeDraftRef.current = { from, to };
        }
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
      if (gameStatus !== "playing") return;

      const playerCode = playerColor === "white" ? "w" : "b";
      const isPlayerTurn = game.turn() === playerCode;

      // Helper: build highlight map for a given square using real game.moves()
      const buildHighlights = (sq: CbSquare): Record<string, React.CSSProperties> => {
        const p = game.get(sq as any);
        const highlights: Record<string, React.CSSProperties> = {
          [sq]: { backgroundColor: "rgba(255, 255, 0, 0.3)" },
        };
        const moves = game.moves({ square: sq as any, verbose: true });
        for (const m of moves) {
          if (m.piece === "k" && isKingMoveChaosUnsafe(game, m.from, m.to)) continue;
          highlights[m.to] = {
            background: m.captured
              ? "radial-gradient(circle, transparent 68%, rgba(255,0,0,0.55) 69%)"
              : "radial-gradient(circle, rgba(0,180,0,0.75) 14%, transparent 15%)",
          };
        }
        for (const cm of activeChaosMoves.filter((m) => m.from === sq)) {
          if (p?.type === "k" && isKingMoveChaosUnsafe(game, cm.from, cm.to)) continue;
          highlights[cm.to] = {
            background: cm.type === "capture"
              ? "radial-gradient(circle, transparent 68%, rgba(168,85,247,0.65) 69%)"
              : "radial-gradient(circle, rgba(168,85,247,0.75) 14%, transparent 15%)",
          };
        }
        return highlights;
      };

      // While AI is thinking: allow selecting own pieces for preview, but never deselect or move
      if (isThinking) {
        const piece = game.get(square as any);
        if (piece && piece.color === playerCode) {
          // Use a temp game to generate the player's piece moves when it's the AI's turn
          const parts = game.fen().split(" ");
          parts[1] = playerCode;
          parts[3] = "-";
          const highlights: Record<string, React.CSSProperties> = {
            [square]: { backgroundColor: "rgba(255, 255, 0, 0.3)" },
          };
          try {
            const tmp = new Chess(parts.join(" "));
            const moves = tmp.moves({ square: square as any, verbose: true });
            for (const m of moves) {
              if (m.piece === "k" && isKingMoveChaosUnsafe(game, m.from, m.to)) continue;
              highlights[m.to] = {
                background: m.captured
                  ? "radial-gradient(circle, transparent 68%, rgba(255,0,0,0.55) 69%)"
                  : "radial-gradient(circle, rgba(0,180,0,0.75) 14%, transparent 15%)",
              };
            }
          } catch { /* ignore */ }
          for (const cm of activeChaosMoves.filter((m) => m.from === square)) {
            if (piece.type === "k" && isKingMoveChaosUnsafe(game, cm.from, cm.to)) continue;
            highlights[cm.to] = {
              background: cm.type === "capture"
                ? "radial-gradient(circle, transparent 68%, rgba(168,85,247,0.65) 69%)"
                : "radial-gradient(circle, rgba(168,85,247,0.75) 14%, transparent 15%)",
            };
          }
          setSelectedSquare(square);
          setLegalMoveSquares(highlights);
          playSound("select");
        }
        // Don't deselect — clicking empty squares / enemy pieces while AI thinks is a no-op
        return;
      }

      // Not the player's turn (and not thinking) — do nothing
      if (!isPlayerTurn) return;

      // Player's turn, AI idle
      if (selectedSquare) {
        const success = handlePlayerMove(selectedSquare, square);
        if (!success) {
          const piece = game.get(square as any);
          if (piece && piece.color === game.turn()) {
            setSelectedSquare(square);
            setLegalMoveSquares(buildHighlights(square));
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
          setLegalMoveSquares(buildHighlights(square));
          playSound("select");
        }
      }
    },
    [game, gameStatus, playerColor, isThinking, selectedSquare, handlePlayerMove, activeChaosMoves, isKingMoveChaosUnsafe],
  );

  /* ── Hover: no move dots, just track hovered square for sidebar info ── */
  const handleMouseOverSquare = useCallback((square: CbSquare) => {
    setHoveredSquare(square);
  }, []);

  const handleMouseOutSquare = useCallback(() => {
    setHoveredSquare(null);
    setHoverMoveSquares({});
  }, []);

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
        // AI mode: player picks first, AI picks sequentially after a reveal delay
        stateWithTracking = applyDraft(chaosState, mod, pendingPhase, { skipOpponentRoll: true });
      }

      // Track single-piece modifiers (archbishop, knook, camel) to prevent transfer on capture
      const SINGLE_PIECE_MODS: Record<string, string> = { archbishop: "b", knook: "n", pegasus: "n", camel: "n" };

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
      // Also update gameStatusRef synchronously so the WS guard ("drafting" → drop move)
      // can't fire between setGameStatus() and React's next render commit.
      gameStatusRef.current = "playing";
      setSelectedSquare(null);
      setLegalMoveSquares({});
      setHoverMoveSquares({});
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

      setEventLog((prev) => [
        ...prev,
        {
          type: "modifier",
          message: `You drafted: ${mod.icon} ${mod.name} — ${mod.description}`,
          icon: mod.icon,
          pepe: tierPepe(mod.tier),
        },
        ...(isMultiplayer && playerColor === "white"
          ? [{ type: "info" as const, message: "⚡ Powerup locked in! Make your move!", icon: "⚡" }]
          : [{ type: "info" as const, message: "⏯️ Game resumed!", icon: "▶️" }]),
      ]);

      // Apply one-time draft effects (knight horde, undead army)
      const pColor = playerColor === "white" ? "w" : "b";
      if (mod.id === "undead-army") setUndeadRevived((prev) => ({ ...prev, [pColor]: true }));
      const draftResult = applyDraftEffect(game, mod, pColor as Color, capturedPawns[pColor as "w" | "b"]);
      let currentGame = game;
      if (draftResult) {
        // Find newly spawned squares by diffing the board before/after
        const beforeBoard = game.board();
        const afterBoard = draftResult.board();
        const spawnedSquares: string[] = [];
        for (let ri = 0; ri < 8; ri++) {
          for (let fi = 0; fi < 8; fi++) {
            if (!beforeBoard[ri][fi] && afterBoard[ri][fi]) {
              spawnedSquares.push(`${"abcdefgh"[fi]}${8 - ri}`);
            }
          }
        }
        if (spawnedSquares.length > 0) triggerEffect("spawn", spawnedSquares);
        currentGame = draftResult;
        setGame(draftResult);
        setEventLog((prev) => [...prev, { type: "chaos", message: `🎭 ${mod.name} effect activated! Check the board!`, icon: "🎭", pepe: PEPE.galaxybrain }]);
        spawnPepe(PEPE.galaxybrain);
      }

      // Tier-based meme sound
      playSound(pickRandom(TIER_SOUNDS[mod.tier]));
      spawnPepe(tierPepe(mod.tier));

      recomputeChaosMoves(currentGame, stateWithTracking);

      // AI sequential pick: AI moves first (matching the player's "move then draft" rule),
      // then its auto-pick is revealed after the move completes.
      if (!isMultiplayer) {
        const phaseForAi = pendingPhase;
        const isAiTurn =
          (playerColor === "white" && currentGame.turn() === "b") ||
          (playerColor === "black" && currentGame.turn() === "w");
        const aiColor_ = playerColor === "white" ? "b" : "w";
        const aiChoices = rollDraftChoices(phaseForAi, stateWithTracking.aiModifiers, Date.now(), countPiecesFromFen(currentGame.fen(), aiColor_));
        const tierRank: Record<string, number> = { common: 1, rare: 2, epic: 3, legendary: 4 };
        const aiPick = [...aiChoices].sort((a, b) => (tierRank[b.tier] ?? 0) - (tierRank[a.tier] ?? 0))[0];
        if (aiPick) {
          const aiColor__ = aiColor_;
          const capturedForAi = capturedPawns[aiColor__ as "w" | "b"];
          const applyAiPick = (baseGame: Chess, baseState: ChaosState) => {
            let newState = { ...baseState, aiModifiers: [...baseState.aiModifiers, aiPick] };
            const SINGLE_PIECE_MODS: Record<string, string> = { archbishop: "b", knook: "n", pegasus: "n", camel: "n" };
            if (SINGLE_PIECE_MODS[aiPick.id]) {
              const pieceType = SINGLE_PIECE_MODS[aiPick.id] as any;
              for (const f of "abcdefgh") for (const r of "12345678") {
                const s = `${f}${r}`;
                const p = baseGame.get(s as any);
                if (p && p.type === pieceType && p.color === aiColor_) {
                  newState = initTrackedPiece(newState, aiPick.id, aiColor_ as "w" | "b", s);
                  break;
                }
              }
            }
            if (aiPick.id === "undead-army") setUndeadRevived((prev) => ({ ...prev, [aiColor__]: true }));
            const aiDraftResult = applyDraftEffect(baseGame, aiPick, aiColor__ as Color, capturedForAi);
            let finalGame = baseGame;
            if (aiDraftResult) {
              const beforeBoard_ = baseGame.board();
              const afterBoard_ = aiDraftResult.board();
              const spawnedSqs: string[] = [];
              for (let ri = 0; ri < 8; ri++) {
                for (let fi = 0; fi < 8; fi++) {
                  if (!beforeBoard_[ri][fi] && afterBoard_[ri][fi]) {
                    spawnedSqs.push(`${'abcdefgh'[fi]}${8 - ri}`);
                  }
                }
              }
              if (spawnedSqs.length > 0) triggerEffect("spawn", spawnedSqs);
              finalGame = aiDraftResult;
              setGame(aiDraftResult);
            }
            setChaosState(newState);
            recomputeChaosMoves(finalGame, newState);
            setOpponentDraftReveal({ opponentPick: aiPick, phase: phaseForAi });
            setEventLog((p) => [
              ...p,
              { type: "modifier" as const, message: `🤖 Stockfish drafted: ${aiPick.icon} ${aiPick.name} — ${aiPick.description}`, icon: aiPick.icon, pepe: tierPepe(aiPick.tier) },
            ]);
            spawnPepe(tierPepe(aiPick.tier));
          };
          if (isAiTurn) {
            // AI moves first without the new powerup — then its pick is revealed, same rule as the player
            setTimeout(() => makeAiMove(currentGame, stateWithTracking, (finalGame, finalState) => {
              setTimeout(() => applyAiPick(finalGame, finalState), 400);
            }), AI_MOVE_DELAY);
          } else {
            // AI already moved this turn; apply pick immediately
            setTimeout(() => applyAiPick(currentGame, stateWithTracking), 800);
          }
        }
      }

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

        // Pick up any move that was held pending this draft pick
        const pendingMove = pendingMoveBeforeDraftRef.current;
        pendingMoveBeforeDraftRef.current = null;
        const moveFrom = pendingMove?.from ?? "";
        const moveTo   = pendingMove?.to   ?? "";

        const payload = {
          roomId,
          from: moveFrom,
          to:   moveTo,
          newFen: currentGame.fen(),
          chaosState: serverCs,
          lastMoveFrom: moveFrom,
          lastMoveTo:   moveTo,
          capturedPawnsWhite: capturedPawns.w,
          capturedPawnsBlack: capturedPawns.b,
          status: "playing",
        };

        // Broadcast via WebSocket FIRST for instant sync (move + modifier in one packet)
        if (partySendRef.current) {
          partySendRef.current({
            type: "draft",
            chaosState: serverCs,
            fen: currentGame.fen(),
            ...(moveFrom ? { lastMoveFrom: moveFrom, lastMoveTo: moveTo } : {}),
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

      // (AI move is handled inside the sequential reveal timeout above for gameMode === "ai")
    },
    [chaosState, pendingPhase, playerColor, game, gameMode, makeAiMove, roomId, capturedPawns, spawnPepe, recomputeChaosMoves, triggerEffect],
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
    prevPhaseRef.current = -1;
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

  const checkKingHighlight = useMemo(() => {
    const styles: Record<string, React.CSSProperties> = {};

    const kingSquare = (color: Color): string | null => {
      const board = game.board();
      for (let r = 0; r < board.length; r++) {
        for (let c = 0; c < board[r].length; c++) {
          const p = board[r][c];
          if (p && p.type === "k" && p.color === color) {
            return `${"abcdefgh"[c]}${8 - r}`;
          }
        }
      }
      return null;
    };

    const markChecked = (sq: string | null) => {
      if (!sq) return;
      styles[sq] = {
        boxShadow: "inset 0 0 0 2px rgba(248,113,113,0.85), inset 0 0 18px rgba(239,68,68,0.55), 0 0 12px rgba(239,68,68,0.45)",
        backgroundColor: "rgba(239,68,68,0.18)",
      };
    };

    if (game.isCheck()) {
      markChecked(kingSquare(game.turn() as Color));
    }

    const myColor: Color = playerColor === "white" ? "w" : "b";
    const oppColor: Color = myColor === "w" ? "b" : "w";

    // Also glow kings under chaos-only check pressure.
    if (isKingUnderChaosAttack(game, chaosState.playerModifiers, myColor, chaosState.assignedSquares)) {
      markChecked(kingSquare(oppColor));
    }
    if (isKingUnderChaosAttack(game, chaosState.aiModifiers, oppColor, chaosState.assignedSquares)) {
      markChecked(kingSquare(myColor));
    }

    return styles;
  }, [game, playerColor, chaosState.playerModifiers, chaosState.aiModifiers, chaosState.assignedSquares]);

  /* ── Board squares merging ── */
  const mergedSquareStyles = useMemo(() => {
    // hoverMoveSquares last so hovering a piece always shows its dots,
    // even when another piece is already selected (legalMoveSquares).
    // checkKingHighlight stays on top of everything.
    return { ...lastMoveHighlight, ...legalMoveSquares, ...hoverMoveSquares, ...checkKingHighlight };
  }, [lastMoveHighlight, hoverMoveSquares, legalMoveSquares, checkKingHighlight]);

  /* ── Reset warp-queen toggle after every move ── */
  useEffect(() => {
    setWarpQueenActive(false);
  }, [game]);

  /* ── Active chaos moves count badge ── */
  const chaosMovesCount = activeChaosMoves.length;

  /* ── Timer format helper ── */
  const formatTimer = (ms: number) => {
    const s = Math.max(0, Math.ceil(ms / 1000));
    return `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;
  };

  /* ────────────────────────── Render ────────────────────────── */

  // Setup screen
  if (gameStatus === "setup") {
    return (
      <div className="relative min-h-[calc(100vh-64px)] overflow-hidden bg-gradient-to-b from-[#030712] via-[#0a0f1a] to-[#030712]">
        <ChaosParticles />
        <div className="relative z-10 mx-auto flex max-w-3xl flex-col items-center px-4 py-8 text-center sm:py-14">

          {/* ── Hero ── */}
          <div className="mb-6 flex flex-col items-center sm:mb-10">
            <div className="mb-3 flex items-center gap-3 sm:mb-4">
              <img src={PEPE.hyped} alt="" className="h-10 w-10 object-contain sm:h-14 sm:w-14" style={{ animation: "pepe-bounce 1.5s ease-in-out infinite" }} />
              <h1 className="bg-gradient-to-r from-purple-400 via-pink-400 to-orange-400 bg-clip-text text-4xl font-black tracking-tight text-transparent sm:text-5xl md:text-6xl">
                CHAOS CHESS
              </h1>
              <img src={PEPE.clowntrain} alt="" className="h-10 w-10 object-contain sm:h-14 sm:w-14" style={{ animation: "pepe-bounce 1.5s ease-in-out infinite 0.4s" }} />
            </div>
            <p className="max-w-lg text-sm text-slate-400 sm:text-base">
              Chess, but every 5 turns you draft a permanent power-up that rewires how your pieces move. Camel knights. Dragon bishops. Nuclear queens. Pure anarchy.
            </p>
          </div>

          {/* ── Example draft cards (flip on hover) ── */}
          <div className="mb-8 flex w-full max-w-2xl flex-wrap justify-center gap-3 sm:mb-10">
            <p className="w-full text-[11px] font-semibold uppercase tracking-wider text-slate-600 mb-1">Example draft picks — hover to learn more</p>
            {([
              {
                icon: "🏰", piece: "♜", name: "The Knook", tier: "epic",
                tierColor: "text-purple-400 border-purple-500/30 bg-purple-500/10",
                glow: "rgba(168,85,247,0.25)",
                desc: "Your knight merges with a rook. It can move like BOTH. Combined power rated at ~12 pawns.",
              },
              {
                icon: "☢️", piece: "♛", name: "Nuclear Queen", tier: "legendary",
                tierColor: "text-amber-400 border-amber-500/30 bg-amber-500/10",
                glow: "rgba(234,179,8,0.25)",
                desc: "When your queen captures, it nukes all adjacent enemy pieces too. Absolute mayhem.",
              },
              {
                icon: "🐫", piece: "♞", name: "Camel Knight", tier: "rare",
                tierColor: "text-cyan-400 border-cyan-500/30 bg-cyan-500/10",
                glow: "rgba(6,182,212,0.2)",
                desc: "Your knight gains a (1,3) leap — the camel move. Reaches squares normal knights can't.",
              },
              {
                icon: "🧱", piece: "♟", name: "Forced En Passant", tier: "common",
                tierColor: "text-slate-400 border-white/10 bg-white/[0.04]",
                glow: "rgba(255,255,255,0.08)",
                desc: "En passant is now mandatory. If you CAN take en passant, you MUST. Tu dois.",
              },
              {
                icon: "💀", piece: "♟", name: "Undead Army", tier: "legendary",
                tierColor: "text-amber-400 border-amber-500/30 bg-amber-500/10",
                glow: "rgba(234,179,8,0.25)",
                desc: "All your captured pawns instantly revive on your back ranks. From ashes they return.",
              },
            ] as const).map((card) => (
              <div
                key={card.name}
                className="group"
                style={{ perspective: "800px", width: 120, height: 148 }}
              >
                <div
                  style={{
                    width: "100%", height: "100%",
                    position: "relative",
                    transformStyle: "preserve-3d",
                    transition: "transform 0.55s cubic-bezier(0.4,0.2,0.2,1)",
                  }}
                  className="group-hover:[transform:rotateY(180deg)]"
                >
                  {/* ── Front ── */}
                  <div
                    style={{
                      position: "absolute", inset: 0,
                      backfaceVisibility: "hidden",
                      WebkitBackfaceVisibility: "hidden",
                      background: `radial-gradient(ellipse at 50% 0%, ${card.glow} 0%, transparent 70%), rgba(255,255,255,0.02)`,
                    }}
                    className="flex flex-col items-center justify-center gap-1.5 rounded-xl border border-white/[0.07] p-3"
                  >
                    <Emoji emoji={card.icon} className="h-7 w-7" />
                    <span className="text-2xl leading-none" style={{ filter: "drop-shadow(0 0 4px rgba(255,255,255,0.3))" }}>{card.piece}</span>
                    <p className="mt-0.5 text-center text-[11px] font-bold leading-tight text-white">{card.name}</p>
                    <span className={`rounded-full border px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide ${card.tierColor}`}>
                      {card.tier}
                    </span>
                  </div>
                  {/* ── Back ── */}
                  <div
                    style={{
                      position: "absolute", inset: 0,
                      backfaceVisibility: "hidden",
                      WebkitBackfaceVisibility: "hidden",
                      transform: "rotateY(180deg)",
                      background: `radial-gradient(ellipse at 50% 100%, ${card.glow} 0%, transparent 70%), rgba(255,255,255,0.03)`,
                    }}
                    className="flex flex-col items-center justify-center gap-2 rounded-xl border border-white/[0.1] p-3"
                  >
                    <Emoji emoji={card.icon} className="h-5 w-5 opacity-70" />
                    <p className="text-center text-[10px] leading-relaxed text-slate-300">{card.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* ── Mode picker ── */}
          <div className="mb-6 flex w-full max-w-xs gap-1.5 rounded-xl border border-white/[0.07] bg-white/[0.02] p-1.5 sm:max-w-sm sm:gap-2">
            {(["ai", "friend", "matchmake"] as GameMode[]).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setGameMode(mode)}
                className={`flex-1 rounded-lg py-3 text-xs font-semibold transition-all sm:py-3.5 sm:text-sm ${
                  gameMode === mode
                    ? "bg-purple-500/25 text-purple-300 shadow-inner"
                    : "text-slate-500 hover:text-slate-300"
                }`}
              >
                {mode === "ai" ? "🤖 vs AI" : mode === "friend" ? "👥 Friend" : "🌐 Matchmake"}
              </button>
            ))}
          </div>

          {/* ── Time Control (shared across all modes) ── */}
          <div className="mb-5 flex flex-wrap items-center justify-center gap-1.5 sm:mb-6">
            {TIME_CONTROLS.map((tc) => {
              const isSelected = tc.base === 0 ? timeControl === null : timeControl?.base === tc.base && timeControl?.inc === tc.inc;
              return (
                <button
                  key={tc.label}
                  type="button"
                  onClick={() => setTimeControl(tc.base === 0 ? null : tc)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                    isSelected
                      ? "bg-purple-500/20 text-purple-400 border border-purple-500/40"
                      : "bg-white/[0.03] text-slate-500 border border-white/[0.06] hover:text-slate-300 hover:bg-white/[0.06]"
                  }`}
                >
                  {tc.label}
                </button>
              );
            })}
          </div>

          {/* ── AI Mode ── */}
          {gameMode === "ai" && (
            <div className="flex w-full max-w-sm flex-col items-center gap-5">
              {/* Difficulty */}
              <div className="w-full rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
                <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500">AI Difficulty</p>
                <div className="flex gap-2">
                  {([
                    { id: "easy",   label: "Easy",   emoji: "🌱", desc: "Casual fun" },
                    { id: "medium", label: "Medium", emoji: "⚔️", desc: "A real fight" },
                    { id: "hard",   label: "Hard",   emoji: "💀", desc: "Good luck" },
                  ] as const).map(({ id, label, emoji, desc }) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setAiLevel(id)}
                      className={`flex flex-1 flex-col items-center gap-1 rounded-lg border py-2.5 text-xs font-medium transition-all ${
                        aiLevel === id
                          ? "border-purple-500/40 bg-purple-500/15 text-purple-300"
                          : "border-white/[0.06] bg-white/[0.02] text-slate-400 hover:bg-white/[0.06]"
                      }`}
                    >
                      <Emoji emoji={emoji} className="h-4 w-4" />
                      <span className="font-bold">{label}</span>
                      <span className="text-[10px] font-normal opacity-60">{desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Side picker */}
              <div className="w-full rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
                <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500">Choose Your Side</p>
                <div className="flex gap-3">
                  <button type="button" onClick={() => startGame("white", "ai")}
                    className="flex flex-1 flex-col items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.04] py-4 font-medium text-white transition-all hover:scale-105 hover:border-white/20 hover:bg-white/[0.08]">
                    <span className="text-4xl">♔</span>
                    <span className="text-sm font-bold">White</span>
                    <span className="text-[10px] text-slate-500">Move first</span>
                  </button>
                  <button type="button" onClick={() => startGame("black", "ai")}
                    className="flex flex-1 flex-col items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.04] py-4 font-medium text-white transition-all hover:scale-105 hover:border-white/20 hover:bg-white/[0.08]">
                    <span className="text-4xl">♚</span>
                    <span className="text-sm font-bold">Black</span>
                    <span className="text-[10px] text-slate-500">Respond</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── Friend Mode ── */}
          {gameMode === "friend" && (
            <div className="flex w-full max-w-sm flex-col gap-4">
              <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
                <p className="mb-1 text-sm font-bold text-white">Create a Room</p>
                <p className="mb-4 text-xs text-slate-500">Share the code with a friend after creating</p>
                <div className="flex gap-2">
                  <button type="button" onClick={() => createRoom("white")}
                    className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-white/[0.08] bg-white/[0.04] py-2.5 text-sm font-medium text-white transition-all hover:bg-white/[0.1]">
                    ♔ White
                  </button>
                  <button type="button" onClick={() => createRoom("black")}
                    className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-white/[0.08] bg-white/[0.04] py-2.5 text-sm font-medium text-white transition-all hover:bg-white/[0.1]">
                    ♚ Black
                  </button>
                </div>
              </div>

              <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
                <p className="mb-1 text-sm font-bold text-white">Join a Room</p>
                <p className="mb-4 text-xs text-slate-500">Enter the 6-letter code your friend sent</p>
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
            <div className="flex w-full max-w-sm flex-col items-center gap-4">
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
                  // Reset ELO and timer state (timers will be synced from first poll)
                  setEloChange(null);
                  setEloSaved(false);
                  setAiEloSaved(false);
                  setMyRating(null);
                  setOpponentRating(null);
                  setTimers({ w: 0, b: 0 });
                  setTimeControl(null);
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

          {/* ── Sound settings (compact) ── */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4 rounded-xl border border-white/[0.06] bg-white/[0.02] px-5 py-3 sm:mt-10">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Sound</span>
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => handleVolumeChange(soundVolume === 0 ? 0.8 : 0)} className="text-base leading-none transition-opacity hover:opacity-70" title={soundVolume === 0 ? "Unmute" : "Mute"}>
                {soundVolume === 0 ? "🔇" : soundVolume < 0.4 ? "🔈" : soundVolume < 0.75 ? "🔉" : "🔊"}
              </button>
              <input type="range" min={0} max={1} step={0.05} value={soundVolume} onChange={e => handleVolumeChange(parseFloat(e.target.value))} className="w-24 accent-purple-500" />
              <span className="w-7 text-right text-[11px] text-slate-500">{Math.round(soundVolume * 100)}%</span>
            </div>
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => handleMemeVolumeChange(memeVolumeState === 0 ? 1 : 0)} className="text-base leading-none transition-opacity hover:opacity-70" title="Meme sounds">
                {memeVolumeState === 0 ? "🤐" : "😂"}
              </button>
              <input type="range" min={0} max={1} step={0.05} value={memeVolumeState} onChange={e => handleMemeVolumeChange(parseFloat(e.target.value))} className="w-24 accent-yellow-500" />
              <span className="w-7 text-right text-[11px] text-slate-500">{Math.round(memeVolumeState * 100)}%</span>
              <span className="text-[10px] text-slate-600">memes</span>
            </div>
          </div>

          {/* ── Mini Leaderboard ── */}
          {setupLeaderboard.length > 0 && (
            <div className="mt-8 w-full max-w-sm rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">⚡ Top Chaos Players</p>
                <a href="/leaderboard/chaos" className="text-[10px] text-slate-600 hover:text-purple-400 transition-colors">
                  View all →
                </a>
              </div>
              <div className="flex flex-col gap-1.5">
                {setupLeaderboard.map((entry, i) => {
                  const ratingColor = entry.rating >= 2000 ? "text-amber-400" : entry.rating >= 1600 ? "text-purple-400" : entry.rating >= 1400 ? "text-cyan-400" : "text-slate-300";
                  return (
                    <div key={entry.userId} className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 hover:bg-white/[0.03] transition-colors">
                      <span className="w-4 text-center text-[11px] font-bold text-slate-600">
                        {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i + 1}`}
                      </span>
                      {entry.userImage ? (
                        <img src={entry.userImage} alt="" className="h-5 w-5 rounded-full object-cover" />
                      ) : (
                        <div className="flex h-5 w-5 items-center justify-center rounded-full bg-purple-500/20 text-[9px] font-bold text-purple-400">
                          {(entry.userName?.[0] ?? "?").toUpperCase()}
                        </div>
                      )}
                      <span className="flex-1 truncate text-xs text-slate-300">{entry.userName ?? "Anonymous"}</span>
                      <span className={`text-xs font-black tabular-nums ${ratingColor}`}>{entry.rating}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* AnarchyChess callout */}
          <div className="mt-6 rounded-xl border border-orange-500/20 bg-orange-500/5 px-5 py-3 text-center">
            <div className="flex items-center justify-center gap-2">
              <img src={PEPE.clownge} alt="" className="h-6 w-6 object-contain" />
              <p className="text-xs text-orange-400">
                Yes, we have <span className="font-bold">Forced En Passant</span>, <span className="font-bold">The Knook</span>, and <span className="font-bold">the Bishop Cannon</span>.
              </p>
              <img src={PEPE.clowntrain} alt="" className="h-6 w-6 object-contain" />
            </div>
            <p className="mt-0.5 text-[11px] text-slate-500">You&apos;re welcome, r/AnarchyChess.</p>
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
    <>
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
          fen={game.fen()}
          playerColor={playerColor === "white" ? "w" : "b"}
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
            {timeControl && gameMode !== "ai" && (
              <span className={`ml-auto font-mono text-sm font-bold tabular-nums ${
                (playerColor === "white" ? timers.b : timers.w) < 10000 ? "text-red-400 animate-pulse" : "text-slate-300"
              }`}>
                {formatTimer(playerColor === "white" ? timers.b : timers.w)}
              </span>
            )}
          </div>

          {/* Board — auto-sizes to fill container, capped at 640px */}
          <div ref={boardContainerRef} className="w-full max-w-[640px]">
            <div className="relative w-full">
              <Chessboard
                id="chaos-board"
                position={game.fen()}
                boardOrientation={playerColor}
                onPieceDrop={(sourceSquare, targetSquare) =>
                  targetSquare ? handlePlayerMove(sourceSquare as CbSquare, targetSquare as CbSquare) : false
                }
                onSquareClick={(square) => handleSquareClick(square as CbSquare)}
                onMouseOverSquare={(square) => handleMouseOverSquare(square as CbSquare)}
                onMouseOutSquare={() => handleMouseOutSquare()}
                customSquareStyles={mergedSquareStyles}
                customBoardStyle={{
                  borderRadius: "8px",
                  boxShadow: "0 4px 30px rgba(0,0,0,0.4)",
                }}
                customDarkSquareStyle={{ backgroundColor: boardTheme.darkSquare }}
                customLightSquareStyle={{ backgroundColor: boardTheme.lightSquare }}
                showBoardNotation={showCoordinates}
                customPieces={chaosCustomPieces || undefined}
                animationDuration={ricochetAnim ? 0 : 200}
                arePiecesDraggable={gameStatus === "playing" && !isThinking && !waitingForOpponentDraft}
              />
              <BoardEffectsOverlay effects={boardEffects} boardSize={boardSize} orientation={playerColor} />
              {ricochetAnim && boardSize > 0 && (
                <RicochetBishopAnimator anim={ricochetAnim} boardSize={boardSize} orientation={playerColor} />
              )}
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
            {timeControl && gameMode !== "ai" && (
              <span className={`ml-auto font-mono text-sm font-bold tabular-nums ${
                (playerColor === "white" ? timers.w : timers.b) < 10000 ? "text-red-400 animate-pulse" : "text-slate-300"
              }`}>
                {formatTimer(playerColor === "white" ? timers.w : timers.b)}
              </span>
            )}
          </div>

          {/* Controls */}
          <div className="mt-2 sm:mt-3 flex gap-2">
            {gameStatus === "playing" && (
              <>
                {/* Warp Queen activation button */}
                {chaosState.playerModifiers.some((m) => m.id === "queen-teleport") &&
                  ((playerColor === "white" && game.turn() === "w") || (playerColor === "black" && game.turn() === "b")) && (
                  <button
                    type="button"
                    onClick={() => setWarpQueenActive((v) => !v)}
                    className={`rounded-lg border px-4 py-2 text-xs font-bold transition-all ${
                      warpQueenActive
                        ? "border-purple-400/60 bg-purple-500/30 text-purple-200 shadow-[0_0_8px_rgba(168,85,247,0.5)]"
                        : "border-purple-500/30 bg-purple-500/10 text-purple-400 hover:bg-purple-500/20"
                    }`}
                  >
                    🌀 Warp Queen {warpQueenActive ? "— active" : ""}
                  </button>
                )}
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

                {/* ── ELO section (multiplayer only) ── */}
                {gameMode !== "ai" && (
                  <div className="w-full rounded-xl border border-purple-500/20 bg-purple-500/5 px-4 py-3 text-center">
                    {eloChange !== null ? (
                      <>
                        <div className={`text-lg font-black ${eloChange >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                          {eloChange >= 0 ? "+" : ""}{eloChange} ELO
                        </div>
                        <div className="mt-0.5 text-xs text-slate-500">
                          {myRating !== null
                            ? `Rating: ${myRating} → ${(myRating + (eloSaved ? 0 : eloChange))} `
                            : `Base: ${DEFAULT_CHAOS_ELO}`}
                        </div>
                      </>
                    ) : (
                      <div className="text-xs text-slate-500">⚡ Chaos ELO — sign in to track your rating</div>
                    )}

                    {/* Save / Auth CTA */}
                    {eloChange !== null && !authenticated && (
                      <a
                        href="/auth/signin"
                        className="mt-2 block w-full rounded-lg border border-purple-500/40 bg-purple-500/20 px-4 py-2 text-xs font-bold text-purple-300 transition-all hover:bg-purple-500/30"
                      >
                        🔐 Sign in to save your Chaos ELO
                      </a>
                    )}
                    {eloChange !== null && authenticated && !eloSaved && (
                      <button
                        type="button"
                        onClick={async () => {
                          const result = gameResult === playerColor ? "win" : gameResult === "draw" ? "draw" : "loss";
                          try {
                            await fetch("/api/chaos/rating", {
                              method: "POST",
                              headers: chaosHeaders(true),
                              body: JSON.stringify({ roomId, result }),
                            });
                            setEloSaved(true);
                            setMyRating((prev) => (prev ?? DEFAULT_CHAOS_ELO) + eloChange);
                          } catch { /* ignore */ }
                        }}
                        className="mt-2 w-full rounded-lg border border-purple-500/40 bg-purple-600/20 px-4 py-2 text-xs font-bold text-purple-300 transition-all hover:bg-purple-600/30"
                      >
                        💾 Save Rating
                      </button>
                    )}
                    {eloSaved && (
                      <div className="mt-2 text-xs font-bold text-emerald-400">
                        ✅ Rating saved! New rating: {myRating ?? DEFAULT_CHAOS_ELO}
                      </div>
                    )}

                    {/* Leaderboard link */}
                    <a
                      href="/leaderboard/chaos"
                      className="mt-2 block text-[10px] text-slate-500 hover:text-purple-400 transition-colors"
                    >
                      🏆 View Chaos Leaderboard
                    </a>
                  </div>
                )}

                {/* ── ELO section (AI games) ── */}
                {gameMode === "ai" && (
                  <div className="w-full rounded-xl border border-purple-500/20 bg-purple-500/5 px-4 py-3 text-center">
                    {eloChange !== null ? (
                      <>
                        <div className={`text-lg font-black ${eloChange >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                          {eloChange >= 0 ? "+" : ""}{eloChange} ELO
                        </div>
                        <div className="mt-0.5 text-xs text-slate-500">
                          {`vs ${aiLevel === "hard" ? "Hard AI (1600)" : aiLevel === "medium" ? "Medium AI (1200)" : "Easy AI (800)"}`}
                        </div>
                        <div className="mt-0.5 text-xs text-slate-500">
                          {`Rating: ${myRating ?? DEFAULT_CHAOS_ELO} → ${(myRating ?? DEFAULT_CHAOS_ELO) + (aiEloSaved ? 0 : eloChange)}`}
                        </div>
                      </>
                    ) : (
                      <div className="text-xs text-slate-500">⚡ Chaos ELO — sign in to track your rating</div>
                    )}

                    {eloChange !== null && !authenticated && (
                      <a
                        href="/auth/signin"
                        className="mt-2 block w-full rounded-lg border border-purple-500/40 bg-purple-500/20 px-4 py-2 text-xs font-bold text-purple-300 transition-all hover:bg-purple-500/30"
                      >
                        🔐 Sign in to save your Chaos ELO
                      </a>
                    )}
                    {eloChange !== null && authenticated && !aiEloSaved && (
                      <button
                        type="button"
                        onClick={async () => {
                          const result = gameResult === playerColor ? "win" : gameResult === "draw" ? "draw" : "loss";
                          try {
                            const res = await fetch("/api/chaos/rating", {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ mode: "ai", difficulty: aiLevel, result }),
                            });
                            const data = await res.json();
                            if (data.ok) {
                              setAiEloSaved(true);
                              setMyRating(data.newRating);
                            }
                          } catch { /* ignore */ }
                        }}
                        className="mt-2 w-full rounded-lg border border-purple-500/40 bg-purple-600/20 px-4 py-2 text-xs font-bold text-purple-300 transition-all hover:bg-purple-600/30"
                      >
                        🏆 Save to Leaderboard
                      </button>
                    )}
                    {aiEloSaved && (
                      <div className="mt-2 text-xs font-bold text-emerald-400">
                        ✅ Saved! New rating: {myRating ?? DEFAULT_CHAOS_ELO}
                      </div>
                    )}
                    <a
                      href="/leaderboard/chaos"
                      className="mt-2 block text-[10px] text-slate-500 hover:text-purple-400 transition-colors"
                    >
                      🏆 View Chaos Leaderboard
                    </a>
                  </div>
                )}

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

                  {/* Guest upsell */}
                  {!authenticated && (
                    <a
                      href="/auth/signin"
                      className="mt-1 flex items-center justify-center gap-2 rounded-lg border border-amber-500/25 bg-amber-500/8 px-4 py-2.5 text-xs font-medium text-amber-300/80 transition-all hover:bg-amber-500/15 w-full"
                    >
                      🎨 Sign in for custom pieces &amp; board themes
                    </a>
                  )}
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
              {moveLog.length === 0
                ? <p className="text-center text-slate-600">No moves yet</p>
                : moveLog.map((p) => (
                  <div key={p.moveNumber} className="grid grid-cols-[2.25rem_minmax(0,1fr)_minmax(0,1fr)] gap-2 text-slate-400">
                    <span className="text-right tabular-nums text-slate-600">{p.moveNumber}.</span>
                    <span className="truncate">{p.white ?? ""}</span>
                    <span className="truncate">{p.black ?? ""}</span>
                  </div>
                ))
              }
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

          {/* ── Settings ── */}
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-2.5 sm:p-3 sm:col-span-2 lg:col-span-1">
            <h3 className="mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-500 sm:text-xs">
              ⚙️ Settings
            </h3>
            <div className="flex items-center gap-2 mb-1.5">
              <button
                type="button"
                onClick={() => handleVolumeChange(soundVolume === 0 ? 0.8 : 0)}
                className="text-base leading-none transition-opacity hover:opacity-70"
                title={soundVolume === 0 ? "Unmute" : "Mute"}
              >
                {soundVolume === 0 ? "🔇" : soundVolume < 0.4 ? "🔈" : soundVolume < 0.75 ? "🔉" : "🔊"}
              </button>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={soundVolume}
                onChange={e => handleVolumeChange(parseFloat(e.target.value))}
                className="flex-1 accent-purple-500"
              />
              <span className="w-7 text-right text-[10px] text-slate-500">{Math.round(soundVolume * 100)}%</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleMemeVolumeChange(memeVolumeState === 0 ? 1 : 0)}
                className="text-base leading-none transition-opacity hover:opacity-70"
                title={memeVolumeState === 0 ? "Unmute memes" : "Mute memes"}
              >
                {memeVolumeState === 0 ? "🤐" : "😂"}
              </button>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={memeVolumeState}
                onChange={e => handleMemeVolumeChange(parseFloat(e.target.value))}
                className="flex-1 accent-yellow-500"
              />
              <span className="w-7 text-right text-[10px] text-slate-500">{Math.round(memeVolumeState * 100)}%</span>
              <span className="text-[9px] text-slate-600">memes</span>
            </div>
            {!pieceInfoOpen && (
              <button
                type="button"
                onClick={() => setPieceInfoOpen(true)}
                className="mt-2 w-full rounded-lg border border-purple-500/20 bg-purple-500/5 py-1.5 text-[11px] font-medium text-purple-400 transition-all hover:bg-purple-500/10"
              >
                🔍 Show Piece Info
              </button>
            )}
            {!authenticated && (
              <a
                href="/auth/signin"
                className="mt-2 flex items-center gap-1.5 rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-2 text-[11px] text-amber-300/80 transition-all hover:bg-amber-500/10"
              >
                <span>🎨</span>
                <span>Sign in to unlock custom <strong>pieces &amp; board themes</strong></span>
              </a>
            )}
          </div>
        </div>
      </div>
    </div>

    {/* ── Floating draggable piece info panel ── */}
    {pieceInfoOpen && gameStatus === "playing" && (() => {
      const sq = hoveredSquare ?? selectedSquare;
      const activeSq = (sq && game.get(sq as any)) ? sq : null;
      const defaultX = typeof window !== "undefined" ? Math.max(20, window.innerWidth - 290) : 20;
      const defaultY = typeof window !== "undefined" ? Math.max(80, window.innerHeight - 480) : 80;
      const px = pieceInfoPos.x < 0 ? defaultX : pieceInfoPos.x;
      const py = pieceInfoPos.y < 0 ? defaultY : pieceInfoPos.y;
      return (
        <div
          style={{ position: "fixed", left: px, top: py, zIndex: 60, width: 260 }}
          className="rounded-xl border border-white/[0.1] bg-[#0d1117]/95 shadow-2xl shadow-black/50 backdrop-blur-md"
        >
          <div
            className="flex cursor-grab items-center gap-2 rounded-t-xl border-b border-white/[0.06] px-3 py-2 select-none active:cursor-grabbing"
            onPointerDown={(e) => {
              const ox = pieceInfoPos.x < 0 ? defaultX : pieceInfoPos.x;
              const oy = pieceInfoPos.y < 0 ? defaultY : pieceInfoPos.y;
              pieceInfoDragRef.current = { sx: e.clientX, sy: e.clientY, ox, oy };
              const onMove = (ev: PointerEvent) => {
                if (!pieceInfoDragRef.current) return;
                setPieceInfoPos({
                  x: Math.max(0, Math.min(pieceInfoDragRef.current.ox + ev.clientX - pieceInfoDragRef.current.sx, window.innerWidth - 265)),
                  y: Math.max(60, Math.min(pieceInfoDragRef.current.oy + ev.clientY - pieceInfoDragRef.current.sy, window.innerHeight - 60)),
                });
              };
              const onUp = () => {
                pieceInfoDragRef.current = null;
                document.removeEventListener("pointermove", onMove);
                document.removeEventListener("pointerup", onUp);
              };
              document.addEventListener("pointermove", onMove);
              document.addEventListener("pointerup", onUp);
              e.currentTarget.setPointerCapture(e.pointerId);
              e.preventDefault();
            }}
          >
            <span className="text-slate-600">⠿⠿</span>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Piece Info</span>
            <button
              type="button"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={() => setPieceInfoOpen(false)}
              className="ml-auto rounded p-0.5 text-slate-600 transition-colors hover:bg-white/10 hover:text-slate-300 text-xs leading-none"
              title="Close"
            >✕</button>
          </div>
          <div className="p-2.5" style={{ maxHeight: `calc(100vh - ${py + 52}px)`, overflowY: "auto" }}>
            <PieceInfoPanel
              square={activeSq}
              game={game}
              playerMods={chaosState.playerModifiers}
              aiMods={chaosState.aiModifiers}
              playerColorCode={playerColor === "white" ? "w" : "b"}
              assignedSquares={chaosState.assignedSquares ?? undefined}
            />
          </div>
        </div>
      );
    })()}
    </>
  );
}
