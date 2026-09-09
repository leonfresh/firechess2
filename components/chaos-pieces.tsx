"use client";
import React from "react";
import {Chess} from "chess.js";
import {getPieceImageUrl} from "@/lib/board-themes";
import type {ChaosModifier} from "@/lib/chaos-chess";
function _twemojiUrl(emoji: string): string {
  const pts = [...emoji]
    .map((c) => c.codePointAt(0)!.toString(16))
    .filter((cp) => cp !== "fe0f");
  return `https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/${pts.join("-")}.svg`;
}
function Emoji({
  emoji,
  className,
  style,
}: {
  emoji: string;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <img
      src={_twemojiUrl(emoji)}
      alt={emoji}
      className={className}
      style={{ display: "inline-block", verticalAlign: "-0.125em", ...style }}
      draggable={false}
    />
  );
}

type Corner = "top-left" | "top-right" | "bottom-left" | "bottom-right";
const CORNER_STYLES: Record<Corner, React.CSSProperties> = {
  "top-left": { position: "absolute", top: "0%", left: "0%" },
  "top-right": { position: "absolute", top: "0%", right: "0%" },
  "bottom-left": { position: "absolute", bottom: "2%", left: "0%" },
  "bottom-right": { position: "absolute", bottom: "2%", right: "0%" },
};
const CORNER_ORDER: Corner[] = [
  "top-right",
  "top-left",
  "bottom-right",
  "bottom-left",
];

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
  "night-rider": {
    glow: "rgba(168,85,247,0.4)",
    render: (sw) => {
      const s = sw * 0.35;
      return (
        <svg
          viewBox="0 0 24 24"
          width={s}
          height={s}
          style={{
            position: "absolute",
            top: "2%",
            right: "2%",
            opacity: 0.9,
            filter: "drop-shadow(0 0 2px rgba(168,85,247,0.8))",
          }}
        >
          <path
            d="M4 12 C4 6, 12 2, 20 6 L16 10 C14 8, 10 8, 8 12 Z"
            fill="rgba(168,85,247,0.85)"
            stroke="rgba(216,180,254,0.9)"
            strokeWidth="0.5"
          />
          <path
            d="M6 14 C6 9, 12 5, 18 8 L15 11 C13 9.5, 10 10, 9 13 Z"
            fill="rgba(192,132,252,0.5)"
          />
        </svg>
      );
    },
  },
  camel: {
    glow: "rgba(245,158,11,0.45)",
  },
  knook: {
    glow: "rgba(59,130,246,0.5)",
    render: (sw) => {
      const s = sw * 0.28;
      return (
        <svg
          viewBox="0 0 24 24"
          width={s}
          height={s}
          style={{
            position: "absolute",
            top: "2%",
            left: "2%",
            opacity: 0.85,
            filter: "drop-shadow(0 0 3px rgba(59,130,246,0.8))",
          }}
        >
          <rect
            x="4"
            y="8"
            width="16"
            height="14"
            rx="1"
            fill="rgba(59,130,246,0.7)"
            stroke="rgba(147,197,253,0.8)"
            strokeWidth="0.8"
          />
          <rect
            x="5.5"
            y="4"
            width="3"
            height="6"
            fill="rgba(59,130,246,0.8)"
          />
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
        <svg
          viewBox="0 0 24 24"
          width={s}
          height={s}
          style={{
            position: "absolute",
            top: "0%",
            right: "2%",
            opacity: 0.9,
            filter: "drop-shadow(0 0 3px rgba(249,115,22,0.8))",
          }}
        >
          <path
            d="M6 20 L8 12 L6 8 L10 4 L14 6 L18 4 L16 10 L18 14 L14 18 Z"
            fill="rgba(249,115,22,0.8)"
            stroke="rgba(251,191,36,0.8)"
            strokeWidth="0.6"
          />
        </svg>
      );
    },
  },
  "king-ascension": {
    glow: "rgba(234,179,8,0.5)",
    render: (sw) => {
      const s = sw * 0.32;
      return (
        <svg
          viewBox="0 0 24 24"
          width={s}
          height={s}
          style={{
            position: "absolute",
            top: "-4%",
            left: "50%",
            transform: "translateX(-50%)",
            opacity: 0.9,
            filter: "drop-shadow(0 0 4px rgba(234,179,8,0.9))",
          }}
        >
          <path
            d="M2 18 L4 8 L8 12 L12 4 L16 12 L20 8 L22 18 Z"
            fill="rgba(234,179,8,0.8)"
            stroke="rgba(253,224,71,0.9)"
            strokeWidth="0.6"
          />
          <circle cx="4" cy="8" r="1.5" fill="rgba(253,224,71,0.9)" />
          <circle cx="12" cy="4" r="1.5" fill="rgba(253,224,71,0.9)" />
          <circle cx="20" cy="8" r="1.5" fill="rgba(253,224,71,0.9)" />
        </svg>
      );
    },
  },
  "phantom-rook": {
    icon: "👻",
    iconGlow: "rgba(147,51,234,0.8)",
    filter: "opacity(0.65) brightness(1.3)",
    glow: "rgba(147,51,234,0.4)",
  },
  "sniper-bishop": {
    icon: "🎯",
    iconGlow: "rgba(239,68,68,0.8)",
    render: (sw) => {
      const s = sw * 0.35;
      return (
        <svg
          viewBox="0 0 24 24"
          width={s}
          height={s}
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%,-50%)",
            opacity: 0.5,
            filter: "drop-shadow(0 0 2px rgba(239,68,68,0.6))",
          }}
        >
          <circle
            cx="12"
            cy="12"
            r="9"
            stroke="rgba(239,68,68,0.7)"
            strokeWidth="1"
            fill="none"
          />
          <circle
            cx="12"
            cy="12"
            r="4"
            stroke="rgba(239,68,68,0.5)"
            strokeWidth="0.8"
            fill="none"
          />
          <line
            x1="12"
            y1="1"
            x2="12"
            y2="7"
            stroke="rgba(239,68,68,0.6)"
            strokeWidth="1"
          />
          <line
            x1="12"
            y1="17"
            x2="12"
            y2="23"
            stroke="rgba(239,68,68,0.6)"
            strokeWidth="1"
          />
          <line
            x1="1"
            y1="12"
            x2="7"
            y2="12"
            stroke="rgba(239,68,68,0.6)"
            strokeWidth="1"
          />
          <line
            x1="17"
            y1="12"
            x2="23"
            y2="12"
            stroke="rgba(239,68,68,0.6)"
            strokeWidth="1"
          />
        </svg>
      );
    },
  },
  "collateral-rook": {
    icon: "💥",
    iconGlow: "rgba(249,115,22,0.8)",
    glow: "rgba(249,115,22,0.4)",
  },
  "nuclear-queen": {
    icon: "☢️",
    iconGlow: "rgba(34,197,94,0.9)",
    glow: "rgba(34,197,94,0.5)",
  },
  "dragon-rook": {
    icon: "🐲",
    iconGlow: "rgba(220,38,38,0.7)",
    glow: "rgba(220,38,38,0.4)",
  },
  "pawn-charge": {
    icon: "🚀",
    iconGlow: "rgba(249,115,22,0.8)",
    glow: "rgba(249,115,22,0.4)",
  },
  "pawn-capture-forward": {
    icon: "🗡️",
    iconGlow: "rgba(239,68,68,0.6)",
    glow: "rgba(239,68,68,0.4)",
  },
  "dragon-bishop": {
    icon: "🐉",
    iconGlow: "rgba(8,145,178,0.7)",
    glow: "rgba(8,145,178,0.4)",
  },
  "pawn-promotion-early": {
    icon: "⭐",
    iconGlow: "rgba(234,179,8,0.8)",
    glow: "rgba(234,179,8,0.3)",
  },
  "kings-chains": {
    render: (sw: number) => {
      const s = sw * 0.42;
      return (
        <svg
          viewBox="0 0 100 100"
          width={s}
          height={s}
          style={{
            position: "absolute",
            bottom: "0%",
            left: "50%",
            transform: "translateX(-50%)",
            opacity: 0.93,
            filter: "drop-shadow(0 0 4px rgba(200,160,40,0.9))",
          }}
        >
          <ellipse
            cx="28"
            cy="72"
            rx="13"
            ry="8"
            fill="none"
            stroke="#C8A030"
            strokeWidth="5.5"
            transform="rotate(-38 28 72)"
          />
          <ellipse
            cx="50"
            cy="78"
            rx="13"
            ry="8"
            fill="none"
            stroke="#C8A030"
            strokeWidth="5.5"
          />
          <ellipse
            cx="72"
            cy="72"
            rx="13"
            ry="8"
            fill="none"
            stroke="#C8A030"
            strokeWidth="5.5"
            transform="rotate(38 72 72)"
          />
        </svg>
      );
    },
    glow: "rgba(200,160,40,0.45)",
  },
  "king-wrath": { icon: "⚔️", iconGlow: "rgba(239,68,68,0.7)" },
  "queen-teleport": {
    icon: "🌀",
    iconGlow: "rgba(168,85,247,0.8)",
    glow: "rgba(168,85,247,0.4)",
  },
  "bishop-bounce": { icon: "🪃", iconGlow: "rgba(249,115,22,0.6)" },
  "rook-cannon": {
    icon: "💣",
    iconGlow: "rgba(239,68,68,0.8)",
    glow: "rgba(239,68,68,0.4)",
  },
  "knight-horde": { icon: "🪖", iconGlow: "rgba(34,197,94,0.7)" },
  "undead-army": {
    icon: "💀",
    iconGlow: "rgba(168,85,247,0.8)",
    filter: "sepia(0.3) hue-rotate(-20deg)",
  },
  "bishop-cannon": {
    icon: "🔮",
    iconGlow: "rgba(168,85,247,0.7)",
    glow: "rgba(168,85,247,0.3)",
  },
  "forced-en-passant": { icon: "🧱", iconGlow: "rgba(249,115,22,0.6)" },
  "pawn-shield-wall": { icon: "🔰", iconGlow: "rgba(59,130,246,0.6)" },
  "enpassant-everywhere": { icon: "♟️", iconGlow: "rgba(234,179,8,0.6)" },
  "pawn-fortress": { icon: "🏰", iconGlow: "rgba(245,158,11,0.8)" },
};

/** Map piece code letter → PieceSymbol */
const PIECE_CODE_MAP: Record<string, string> = {
  P: "p",
  N: "n",
  B: "b",
  R: "r",
  Q: "q",
  K: "k",
};

/** Modifier IDs that only affect the first piece of their type (visual overlays).
 *  The move gen (genKnook, genArchbishop) also uses the first piece found
 *  in file/rank scan order, so the visual consistently matches. */
export const SINGLE_PIECE_MODIFIERS: Record<string, true> = {
  knook: true,
  archbishop: true,
  camel: true,
  "night-rider": true,
};

/** Fairy piece SVG replacements — full piece image swap for transformative modifiers */
const FAIRY_PIECE_SVGS: Record<string, Record<string, string>> = {
  knook: { w: "/pieces/fairy/wC.svg", b: "/pieces/fairy/bC.svg" },
  archbishop: { w: "/pieces/fairy/wA.svg", b: "/pieces/fairy/bA.svg" },
  amazon: { w: "/pieces/fairy/wAm.svg", b: "/pieces/fairy/bAm.svg" },
  "night-rider": { w: "/pieces/fairy/wNR.svg", b: "/pieces/fairy/bNR.svg" },
  camel: { w: "/pieces/fairy/wCa.svg", b: "/pieces/fairy/bCa.svg" },
  "dragon-bishop": { w: "/pieces/fairy/wDb.svg", b: "/pieces/fairy/bDb.svg" },
  "dragon-rook": { w: "/pieces/fairy/wDr.svg", b: "/pieces/fairy/bDr.svg" },
  "rook-cannon": { w: "/pieces/fairy/wRC.svg", b: "/pieces/fairy/bRC.svg" },
  "pawn-charge": { w: "/pieces/fairy/wPC.svg", b: "/pieces/fairy/bPC.svg" },
  "pawn-capture-forward": {
    w: "/pieces/fairy/wPB.svg",
    b: "/pieces/fairy/bPB.svg",
  },
  /** Emperor king — standard king body with gold reach-ring and corner triangles */
  "fools-king": { w: "/pieces/fairy/wFK.svg", b: "/pieces/fairy/bFK.svg" },
  "inversion-pawn": { w: "/pieces/fairy/wIP.svg", b: "/pieces/fairy/bIP.svg" },
  "moon-queen": { w: "/pieces/fairy/wMQ.svg", b: "/pieces/fairy/bMQ.svg" },
  "emperor-king": { w: "/pieces/fairy/wEK.svg", b: "/pieces/fairy/bEK.svg" },
  /** Hierophant (Sacred Passage) bishop — ghostly violet phase-bishop */
  "hierophant-bishop": {
    w: "/pieces/fairy/wHb.svg",
    b: "/pieces/fairy/bHb.svg",
  },
  /** Usurper — king with swap arrows */
  usurper: { w: "/pieces/fairy/wUsp.svg", b: "/pieces/fairy/bUsp.svg" },
  /** Kamikaze Bishop — bishop with explosion flames */
  "kamikaze-bishop": { w: "/pieces/fairy/wKB.svg", b: "/pieces/fairy/bKB.svg" },
  /** Queen Cannon — queen with cannon barrel */
  "queen-cannon": { w: "/pieces/fairy/wQC.svg", b: "/pieces/fairy/bQC.svg" },
  /** Railgun — rook with electric bolt */
  railgun: { w: "/pieces/fairy/wRG.svg", b: "/pieces/fairy/bRG.svg" },
  "sniper-bishop": { w: "/pieces/fairy/wSB.svg", b: "/pieces/fairy/bSB.svg" },
  "bishop-cannon": { w: "/pieces/fairy/wBC.svg", b: "/pieces/fairy/bBC.svg" },
  "bishop-bounce": { w: "/pieces/fairy/wBB.svg", b: "/pieces/fairy/bBB.svg" },
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
export function buildChaosCustomPieces(
  setName: string | null,
  playerModifiers: ChaosModifier[],
  aiModifiers: ChaosModifier[],
  playerColor: "white" | "black",
  game: Chess,
  assignedSquares?: Record<string, string | null>,
  undeadRevived?: { w: boolean; b: boolean },
  lastMoveRef?: React.MutableRefObject<{ from: string; to: string } | null>,
  /** Turns remaining on player's nuclear queen cooldown (0 = ready) */
  playerNukeCdTurns?: number,
  /** Turns remaining on AI's nuclear queen cooldown (0 = ready) */
  aiNukeCdTurns?: number,
  /** Player's active anomaly ID — used for per-anomaly piece visuals */
  playerAnomalyId?: string | null,
  /** AI's active anomaly ID — used for per-anomaly piece visuals */
  aiAnomalyId?: string | null,
  /** Moon anomaly: whether the queen's nocturnal ability is active */
  playerMoonUnlocked?: boolean,
  aiMoonUnlocked?: boolean,
): Record<
  string,
  ({
    squareWidth,
    square,
  }: {
    squareWidth: number;
    square?: string;
  }) => React.ReactElement
> {
  const codes = [
    "wP",
    "wN",
    "wB",
    "wR",
    "wQ",
    "wK",
    "bP",
    "bN",
    "bB",
    "bR",
    "bQ",
    "bK",
  ];
  const result: Record<
    string,
    ({
      squareWidth,
      square,
    }: {
      squareWidth: number;
      square?: string;
    }) => React.ReactElement
  > = {};

  // Fallback to cburnett if no custom set chosen
  const actualSet = setName ?? "cburnett";

  // Pre-compute which square is the "single piece" for each modifier
  // e.g. for knook: the first knight square of each color
  const singlePieceSquares: Record<string, Record<string, string | null>> = {};
  for (const modId of Object.keys(SINGLE_PIECE_MODIFIERS)) {
    singlePieceSquares[modId] = {};
    for (const color of ["w", "b"] as const) {
      const mod = (
        color === (playerColor === "white" ? "w" : "b")
          ? playerModifiers
          : aiModifiers
      ).find((m) => m.id === modId);
      if (!mod) {
        singlePieceSquares[modId][color] = null;
        continue;
      }

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
    const url = actualSet === 'chaos-toy' ? `/activity/pieces/${code}.svg` : getPieceImageUrl(actualSet, code);

    result[code] = ({
      squareWidth,
      square,
    }: {
      squareWidth: number;
      square?: string;
    }) => {
      // Collect overlays & effects
      const overlays: React.ReactElement[] = [];
      let filter = "";
      let glowColor = "";
      let cornerIdx = 0;
      let pieceUrl = url; // default to standard piece

      // Detect pawn modifier combo: both charge + bayonet = War Pawn
      const hasPawnCharge =
        pieceType === "p" && activeForPiece.some((m) => m.id === "pawn-charge");
      const hasPawnBayonet =
        pieceType === "p" &&
        activeForPiece.some((m) => m.id === "pawn-capture-forward");
      const pawnCombo = hasPawnCharge && hasPawnBayonet;
      if (pawnCombo) {
        pieceUrl = WAR_PAWN_SVGS[pieceColor];
        glowColor = "rgba(245,158,11,0.45)"; // amber glow for war pawn
      }

      // Choose the fairy piece SVG using the same priority as getPieceDisplayName:
      // identity mods beat movement mods; newest draft wins within each tier.
      const IDENTITY_MOD_IDS = [
        "knook",
        "archbishop",
        "camel",
        "night-rider",
        "amazon",
        "king-ascension",
        "usurper",
        "kamikaze-bishop",
        "queen-cannon",
        "railgun",
      ];
      const MOVEMENT_MOD_IDS = ["dragon-bishop", "dragon-rook", "rook-cannon", "pawn-charge", "pawn-capture-forward", "sniper-bishop", "bishop-cannon", "bishop-bounce"];
      const fairyTiers = [IDENTITY_MOD_IDS, MOVEMENT_MOD_IDS];
      for (const tier of fairyTiers) {
        // newest-first within the tier
        const found = [...activeForPiece].reverse().find((m) => {
          if (!tier.includes(m.id)) return false;
          if (!FAIRY_PIECE_SVGS[m.id]) return false;
          if (
            pawnCombo &&
            (m.id === "pawn-capture-forward" || m.id === "pawn-charge")
          )
            return false;
          const designatedSquare = singlePieceSquares[m.id]?.[pieceColor];
          if (designatedSquare === null) return false; // piece was captured
          if (!square || !designatedSquare) return true;
          if (square === designatedSquare) return true;
          // Animation ghost: react-chessboard passes the *source* square while sliding.
          // After updateTrackedPieces, designatedSquare already points to the target,
          // so `square` (source) won't match. Only show the fairy SVG for the ghost
          // if the last move went FROM this square TO the designated square — otherwise
          // a different piece moving away from an adjacent square would incorrectly
          // inherit the fairy skin.
          const lm = lastMoveRef?.current;
          return (
            !game.get(square as any) &&
            !!lm &&
            lm.from === square &&
            lm.to === designatedSquare
          );
        });
        if (found) {
          pieceUrl = FAIRY_PIECE_SVGS[found.id][pieceColor];
          break;
        }
      }

      // Star anomaly: all knights become camels visually (camel SVG)
      if (
        pieceType === "n" &&
        ((isPlayerPiece && playerAnomalyId === "star") ||
          (!isPlayerPiece && aiAnomalyId === "star")) &&
        FAIRY_PIECE_SVGS["camel"]
      ) {
        pieceUrl = FAIRY_PIECE_SVGS["camel"][pieceColor];
      }

      const pieceAnomaly = isPlayerPiece ? playerAnomalyId : aiAnomalyId;
      const moonReady = isPlayerPiece ? playerMoonUnlocked : aiMoonUnlocked;
      if (pieceType === "k" && pieceAnomaly === "fools-king") {
        pieceUrl = FAIRY_PIECE_SVGS["fools-king"][pieceColor];
      }
      // Preserve existing equipment/hybrid sculpts; retain their anomaly badge when stacked.
      if (pieceType === "p" && pieceAnomaly === "hanged-man" && !activeForPiece.length) {
        pieceUrl = FAIRY_PIECE_SVGS["inversion-pawn"][pieceColor];
      }
      if (pieceType === "q" && pieceAnomaly === "moon" && moonReady && !activeForPiece.length) {
        pieceUrl = FAIRY_PIECE_SVGS["moon-queen"][pieceColor];
      }

      // Emperor anomaly: king gets a special SVG with golden reach-ring
      if (
        pieceType === "k" &&
        ((isPlayerPiece && playerAnomalyId === "emperor") ||
          (!isPlayerPiece && aiAnomalyId === "emperor")) &&
        FAIRY_PIECE_SVGS["emperor-king"]
      ) {
        pieceUrl = FAIRY_PIECE_SVGS["emperor-king"][pieceColor];
        if (!glowColor) glowColor = "rgba(245,158,11,0.45)";
      }

      // Hierophant anomaly: all bishops become ghostly phase-bishops
      if (
        pieceType === "b" &&
        ((isPlayerPiece && playerAnomalyId === "hierophant") ||
          (!isPlayerPiece && aiAnomalyId === "hierophant")) &&
        FAIRY_PIECE_SVGS["hierophant-bishop"]
      ) {
        pieceUrl = FAIRY_PIECE_SVGS["hierophant-bishop"][pieceColor];
        if (!glowColor) glowColor = "rgba(167,139,250,0.45)";
      }

      // Now iterate all active mods for overlays, glows, and filters
      for (const mod of activeForPiece) {
        // Skip single-piece modifiers if this isn't the designated piece
        if (SINGLE_PIECE_MODIFIERS[mod.id] && square) {
          const designatedSquare = singlePieceSquares[mod.id]?.[pieceColor];
          if (designatedSquare === null) continue;
          // Also allow through when the piece has left `square` — animation ghost of the fairy piece
          if (
            designatedSquare &&
            square !== designatedSquare &&
            game.get(square as any)
          )
            continue;
        }

        const fairySvgs = FAIRY_PIECE_SVGS[mod.id];
        // Undead army: hide skull icon once revival has been spent
        const skipUndeadIcon =
          mod.id === "undead-army" &&
          !!undeadRevived?.[pieceColor as "w" | "b"];

        const def = MODIFIER_OVERLAYS[mod.id];
        if (!def) continue;
        // Equipment is part of these toy sculpts; don't cover it with the old crosshair/emoji.
        if (actualSet === 'chaos-toy' && ['sniper-bishop', 'bishop-cannon', 'bishop-bounce', 'railgun', 'kamikaze-bishop', 'usurper'].includes(mod.id)) continue;

        // Skip icon/render overlays for most fairy piece replacements.
        // Exception: mods whose badge should still be visible alongside the fairy SVG.
        const allowIconWithFairy =
          mod.id === "pawn-charge" ||
          mod.id === "pawn-capture-forward" ||
          mod.id === "dragon-bishop" ||
          mod.id === "dragon-rook";
        if ((!fairySvgs || (allowIconWithFairy && actualSet !== 'chaos-toy')) && !skipUndeadIcon) {
          if (def.icon) {
            // For the War Pawn combo (Torpedo + Bayonet), render icons in all
            // 4 corners: each modifier occupies two opposite corners.
            if (
              pawnCombo &&
              (mod.id === "pawn-charge" || mod.id === "pawn-capture-forward")
            ) {
              const corners: Corner[] =
                mod.id === "pawn-charge"
                  ? ["top-left", "bottom-right"]
                  : ["top-right", "bottom-left"];
              const s = squareWidth * 0.24;
              for (const c of corners) {
                const style = CORNER_STYLES[c];
                overlays.push(
                  <div
                    key={`${mod.id}-${c}`}
                    style={{
                      position: "absolute",
                      ...style,
                      lineHeight: 1,
                      filter: `drop-shadow(0 0 3px ${def.iconGlow ?? "rgba(255,255,255,0.6)"})`,
                    }}
                  >
                    <Emoji emoji={def.icon} style={{ width: s, height: s }} />
                  </div>,
                );
              }
              continue;
            }

            // Icon-based badge — auto-assign to next available corner
            const corner = CORNER_ORDER[cornerIdx % CORNER_ORDER.length];
            cornerIdx++;
            const s = squareWidth * 0.24;
            const style = CORNER_STYLES[corner];
            // Nuclear queen on cooldown: show remaining turns number badge and dim
            const nukeCdTurns =
              mod.id === "nuclear-queen"
                ? isPlayerPiece
                  ? (playerNukeCdTurns ?? 0)
                  : (aiNukeCdTurns ?? 0)
                : 0;
            const nukeOnCooldown = nukeCdTurns > 0;
            const badgeGlow = nukeOnCooldown
              ? "rgba(100,100,100,0.5)"
              : (def.iconGlow ?? "rgba(255,255,255,0.6)");
            overlays.push(
              nukeOnCooldown ? (
                <div
                  key={mod.id}
                  style={{
                    position: "absolute",
                    ...style,
                    width: s,
                    height: s,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: "rgba(0,0,0,0.55)",
                    borderRadius: "3px",
                    opacity: 0.85,
                    color: "#ccc",
                    fontSize: s * 0.68,
                    fontWeight: "bold",
                    lineHeight: 1,
                    filter: `drop-shadow(0 0 3px ${badgeGlow})`,
                  }}
                >
                  {nukeCdTurns}
                </div>
              ) : (
                <div
                  key={mod.id}
                  style={{
                    position: "absolute",
                    ...style,
                    lineHeight: 1,
                    filter: `drop-shadow(0 0 3px ${badgeGlow})`,
                  }}
                >
                  <Emoji emoji={def.icon} style={{ width: s, height: s }} />
                </div>
              ),
            );
          }
          if (def.render) {
            // Custom SVG render — uses its own positioning (can stack with icon badge above)
            overlays.push(
              <React.Fragment key={`${mod.id}-render`}>
                {def.render(squareWidth)}
              </React.Fragment>,
            );
          }
        }

        if (def.filter) filter = def.filter;
        if (def.glow && !glowColor) glowColor = def.glow;
      }

      // Anomaly-specific piece badges (passive anomalies that change piece movement)
      {
        const pAnom = isPlayerPiece ? playerAnomalyId : aiAnomalyId;
        const pMoon = isPlayerPiece ? playerMoonUnlocked : aiMoonUnlocked;
        if (pAnom) {
          // Hanged Man — Inversion: 🙃 on all pawns
          if (pAnom === "hanged-man" && pieceType === "p" && activeForPiece.length > 0) {
            const corner = CORNER_ORDER[cornerIdx % CORNER_ORDER.length];
            cornerIdx++;
            const s = squareWidth * 0.24;
            overlays.push(
              <div
                key="anom-badge"
                style={{
                  position: "absolute",
                  ...CORNER_STYLES[corner],
                  lineHeight: 1,
                  filter: "drop-shadow(0 0 2px rgba(20,184,166,0.7))",
                }}
              >
                <Emoji emoji="🙃" style={{ width: s, height: s }} />
              </div>,
            );
          }
          // Emperor — Dominion: SVG handles the visual (see emperor-king in FAIRY_PIECE_SVGS)
          // Moon — Nocturnal Hunt: 🌑 on queen when unlocked
          if (pAnom === "moon" && pieceType === "q" && pMoon && activeForPiece.length > 0) {
            if (!glowColor) glowColor = "rgba(100,116,139,0.4)";
            const corner = CORNER_ORDER[cornerIdx % CORNER_ORDER.length];
            cornerIdx++;
            const s = squareWidth * 0.24;
            overlays.push(
              <div
                key="anom-badge"
                style={{
                  position: "absolute",
                  ...CORNER_STYLES[corner],
                  lineHeight: 1,
                  filter: "drop-shadow(0 0 3px rgba(148,163,184,0.9))",
                }}
              >
                <Emoji emoji="🌑" style={{ width: s, height: s }} />
              </div>,
            );
          }
        }
      }

      // King's Chains: draw chain overlay on the currently-chained enemy piece square
      const wChained = assignedSquares?.["w_kings-chains"];
      const bChained = assignedSquares?.["b_kings-chains"];
      if (square && (square === wChained || square === bChained)) {
        const s = squareWidth * 0.42;
        overlays.push(
          <React.Fragment key="kings-chains-chain">
            <svg
              viewBox="0 0 100 100"
              width={s}
              height={s}
              style={{
                position: "absolute",
                bottom: "0%",
                left: "50%",
                transform: "translateX(-50%)",
                opacity: 0.97,
                filter:
                  "drop-shadow(0 0 6px rgba(239,68,68,0.95)) drop-shadow(0 0 2px rgba(0,0,0,0.8))",
                zIndex: 3,
              }}
            >
              <ellipse
                cx="28"
                cy="72"
                rx="13"
                ry="8"
                fill="none"
                stroke="#EF4444"
                strokeWidth="5.5"
                transform="rotate(-38 28 72)"
              />
              <ellipse
                cx="50"
                cy="78"
                rx="13"
                ry="8"
                fill="none"
                stroke="#EF4444"
                strokeWidth="5.5"
              />
              <ellipse
                cx="72"
                cy="72"
                rx="13"
                ry="8"
                fill="none"
                stroke="#EF4444"
                strokeWidth="5.5"
                transform="rotate(38 72 72)"
              />
            </svg>
          </React.Fragment>,
        );
        if (!glowColor) glowColor = "rgba(239,68,68,0.5)";
      }

      const visiblePowers = activeForPiece.filter(m =>
        !['knight-horde', 'undead-army'].includes(m.id) &&
        (!SINGLE_PIECE_MODIFIERS[m.id] || singlePieceSquares[m.id]?.[pieceColor] === square));

      return (
        <div
          style={{
            width: squareWidth,
            height: squareWidth,
            position: "relative",
          }}
        >
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
              backgroundImage: `url(${actualSet === 'chaos-toy' ? `/activity/pieces/${pieceUrl.split('/').pop()}` : pieceUrl})`,
              backgroundSize: "contain",
              backgroundRepeat: "no-repeat",
              backgroundPosition: "center",
              filter: filter || undefined,
              position: "relative",
              zIndex: 1,
            }}
          />
          {/* Modifier overlays */}
          {actualSet === 'chaos-toy' && visiblePowers.length > 1 && (
            <div title={visiblePowers.map(m => m.name).join(' + ')} aria-label={`${visiblePowers.length} powers: ${visiblePowers.map(m => m.name).join(', ')}`}
              data-power-count={visiblePowers.length}
              style={{ position: 'absolute', right: '2%', bottom: '4%', zIndex: 3, pointerEvents: 'none',
                minWidth: squareWidth * .24, height: squareWidth * .24, padding: '0 2px', boxSizing: 'border-box',
                borderRadius: 5, background: '#23334d', border: '1px solid #f2d58b', color: '#fff0c6',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: Math.max(9, squareWidth * .16),
                fontWeight: 900, lineHeight: 1, boxShadow: '0 1px 3px #11182788' }}>
              {visiblePowers.length}
            </div>
          )}
          {overlays.length > 0 && (
            <div
              style={{
                position: "absolute",
                inset: 0,
                zIndex: 2,
                pointerEvents: "none",
              }}
            >
              {overlays}
            </div>
          )}
        </div>
      );
    };
  }

  return result;
}

