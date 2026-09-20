"use client";

import { useMemo, useState } from "react";
import { Chess, type Square } from "chess.js";
import { FAIRY_PIECE_CODES } from "./power-art";
import { ALL_MODIFIERS } from "@/lib/chaos-chess";
import { getChaosMoves, executeChaosMove } from "@/lib/chaos-moves";

const STARTS: Record<string, string> = {
  "vaulting-knight": "7k/8/3p4/8/3NP3/8/8/K7 w - - 0 1",
  "bank-shot": "1n3n1k/8/8/8/3R4/8/8/K7 w - - 0 1",
  "night-rider": "7k/8/8/8/8/8/8/KN6 w - - 0 1",
  "phantom-rook": "7k/8/8/8/3RP3/8/8/K7 w - - 0 1",
  "bishop-bounce": "7k/8/8/8/3B4/8/8/K7 w - - 0 1",
  "queen-teleport": "7k/8/8/8/3Q4/8/8/K7 w - - 0 1",
};

/** A no-account sandbox driven by the same legal move generator as a match. */
export function ShopPowerPreview({ id }: { id: string }) {
  return STARTS[id] ? <MoveSandbox key={id} id={id} /> : null;
}

function MoveSandbox({ id }: { id: string }) {
  const [open, setOpen] = useState(false);
  const [fen, setFen] = useState(STARTS[id]);
  const [selected, setSelected] = useState<Square | null>(null);
  const [message, setMessage] = useState("Select the upgraded piece, then a glowing square.");
  const game = useMemo(() => new Chess(fen), [fen]);
  const mod = ALL_MODIFIERS.find(m => m.id === id)!;
  const legal = useMemo(() => {
    const knight = game.board().flat().find(piece => piece?.color === "w" && piece.type === "n");
    return getChaosMoves(game, [mod], "w", id === "night-rider" ? { "w_night-rider": knight?.square ?? null } : undefined);
  }, [game, mod, id]);
  function play(square: Square) {
    if (game.get(square)?.color === "w" && game.get(square)?.type === mod.piece) {
      setSelected(current => current === square ? null : square);
      return;
    }
    const move = legal.find(m => m.from === selected && m.to === square);
    if (!move) return;
    const next = executeChaosMove(game, move, [mod]);
    if (!next) return;
    // This is a move demonstration, not a match: keep control of the white piece.
    const parts = next.fen().split(" "); parts[1] = "w";
    setFen(parts.join(" ")); setSelected(null);
    setMessage(move.bounceSquare ? `Turned at ${move.bounceSquare}, landed on ${move.to}. Try another path.` : id === "vaulting-knight" ? `Jumped to ${move.to}. Pieces in between don't block the jump.` : `Moved to ${move.to}. Reset to try another route.`);
  }
  return <div className="shop-preview">
    <button className="shop-preview-toggle" aria-expanded={open} onClick={() => setOpen(value => !value)}>{open ? "Close practice board" : "Try the moves →"}</button>
    {open && <>
      <p role="status">{message}</p>
      <div className="shop-preview-board" aria-label={`${mod.name} practice board`}>
        {game.board().flatMap((rank, row) => rank.map((piece, col) => {
          const square = `${"abcdefgh"[col]}${8-row}` as Square;
          const destination = legal.some(m => m.from === selected && m.to === square);
          const code = piece?.color === "w" && piece.type === mod.piece ? (FAIRY_PIECE_CODES[id] ?? (id === "bishop-bounce" ? "BB" : piece.type.toUpperCase())) : piece?.type.toUpperCase();
          return <button key={square} className={`${(row+col)%2 ? "dark" : "light"}${destination ? " destination" : ""}${selected === square ? " selected" : ""}`}
            aria-label={`${square}${piece ? ` ${piece.color === "w" ? "white" : "black"} ${piece.type}` : ""}${destination ? " available power move" : ""}`}
            onClick={() => play(square)}>
            {piece && <img src={`/activity/pieces/${piece.color}${code}.svg`} alt="" draggable={false} />}
          </button>;
        }))}
      </div>
      <button className="shop-preview-reset" onClick={() => { setFen(STARTS[id]); setSelected(null); setMessage("Select the upgraded piece, then a glowing square."); }}>Reset position</button>
      <small>Power moves only · no gold or rating affected</small>
    </>}
  </div>;
}
