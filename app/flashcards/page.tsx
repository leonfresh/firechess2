"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BlogChessBoard } from "@/components/blog-chess-board";

type Card = {
  id: string;
  fen: string;
  label: string;
  note: string;
  orientation: "w" | "b";
  userMove: string;
  bestMove: string;
  openingName: string;
  eco: string;
  mastery: number;
  reviewCount: number;
  tags: string[];
  createdAt: string;
};

type Board = {
  id: string;
  name: string;
  description: string;
  cardCount: number;
  icon: string;
  color: string;
  createdAt: string;
};

const BOARD_COLORS = [
  { color: "from-indigo-600 to-purple-900", icon: "🃏" },
  { color: "from-emerald-600 to-teal-900", icon: "♟️" },
  { color: "from-rose-600 to-pink-900", icon: "🎯" },
  { color: "from-amber-600 to-orange-900", icon: "💣" },
  { color: "from-cyan-600 to-blue-900", icon: "🧩" },
  { color: "from-violet-600 to-fuchsia-900", icon: "🏆" },
];

export default function FlashcardsPage() {
  const [boards, setBoards] = useState<Board[]>([]);
  const [cards, setCards] = useState<Card[]>([]);
  const [activeBoard, setActiveBoard] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showNewBoard, setShowNewBoard] = useState(false);
  const [newBoardName, setNewBoardName] = useState("");
  const [pickColor, setPickColor] = useState(0);

  const user = { id: "demo" }; // placeholder — real auth used in API

  useEffect(() => {
    fetch("/api/flashcards")
      .then((r) => r.json())
      .then((data) => {
        setBoards(data ?? []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const openBoard = async (boardId: string) => {
    setActiveBoard(boardId);
    const res = await fetch(`/api/flashcards?boardId=${boardId}`);
    const data = await res.json();
    setCards(data ?? []);
  };

  const createBoard = async () => {
    if (!newBoardName.trim()) return;
    const c = BOARD_COLORS[pickColor % BOARD_COLORS.length];
    const res = await fetch("/api/flashcards", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newBoardName, icon: c.icon, color: c.color }),
    });
    const board = await res.json();
    setBoards((p) => [board, ...p]);
    setNewBoardName("");
    setShowNewBoard(false);
  };

  const deleteBoard = async (boardId: string) => {
    await fetch(`/api/flashcards?boardId=${boardId}`, { method: "DELETE" });
    setBoards((p) => p.filter((b) => b.id !== boardId));
    if (activeBoard === boardId) { setActiveBoard(null); setCards([]); }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-400 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen">
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="animate-float absolute -left-32 top-20 h-96 w-96 rounded-full bg-indigo-500/[0.07] blur-[100px]" />
        <div className="animate-float-delayed absolute -right-32 top-40 h-80 w-80 rounded-full bg-purple-500/[0.06] blur-[100px]" />
      </div>

      <div className="relative z-10 mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
        <header className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white sm:text-3xl">🃏 Flashcards</h1>
            <p className="mt-1 text-sm text-slate-500">Save positions from your reports into training boards</p>
          </div>
          <button
            onClick={() => setShowNewBoard(true)}
            className="rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-2 text-sm font-bold text-white shadow-lg shadow-indigo-500/20 transition-all hover:brightness-110"
          >
            + New Board
          </button>
        </header>

        {/* ─── New Board Modal ─── */}
        {showNewBoard && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
            <div className="w-full max-w-sm rounded-2xl border border-white/[0.08] bg-slate-900 p-6 shadow-2xl">
              <h2 className="text-lg font-bold text-white">Create Board</h2>
              <input
                value={newBoardName}
                onChange={(e) => setNewBoardName(e.target.value)}
                placeholder="e.g. Queen Forks, Italian Traps..."
                className="mt-4 w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-2.5 text-sm text-white outline-none focus:border-indigo-500/50"
                onKeyDown={(e) => e.key === "Enter" && createBoard()}
              />
              <div className="mt-3 flex gap-2">
                {BOARD_COLORS.map((c, i) => (
                  <button
                    key={i}
                    onClick={() => setPickColor(i)}
                    className={`h-8 w-8 rounded-xl bg-gradient-to-b ${c.color} transition-all ${pickColor === i ? "ring-2 ring-white scale-110" : "opacity-60"}`}
                  />
                ))}
              </div>
              <div className="mt-4 flex gap-2">
                <button onClick={createBoard} className="flex-1 rounded-xl bg-indigo-600 py-2 text-sm font-bold text-white">Create</button>
                <button onClick={() => setShowNewBoard(false)} className="flex-1 rounded-xl border border-white/[0.08] py-2 text-sm text-slate-400">Cancel</button>
              </div>
            </div>
          </div>
        )}

        {/* ─── Boards Grid ─── */}
        {!activeBoard && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {boards.map((board) => {
              const isDefault = BOARD_COLORS.some((c) => c.icon === board.icon);
              const c = BOARD_COLORS.find((c) => c.icon === board.icon) ?? BOARD_COLORS[0];
              return (
                <button
                  key={board.id}
                  onClick={() => openBoard(board.id)}
                  className="group relative overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 text-left transition-all hover:border-white/[0.15] hover:bg-white/[0.04]"
                >
                  <div className={`absolute -right-6 -top-6 h-24 w-24 rounded-full bg-gradient-to-b ${c.color} opacity-10 blur-xl transition-all group-hover:opacity-20`} />
                  <div className="relative">
                    <span className="text-3xl">{board.icon || "🃏"}</span>
                    <h3 className="mt-2 text-base font-bold text-white">{board.name}</h3>
                    {board.description && (
                      <p className="mt-1 text-xs text-slate-500">{board.description}</p>
                    )}
                    <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
                      <span>{board.cardCount} card{board.cardCount !== 1 ? "s" : ""}</span>
                    </div>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); deleteBoard(board.id); }}
                    className="absolute right-3 top-3 text-xs text-slate-600 opacity-0 transition-opacity hover:text-red-400 group-hover:opacity-100"
                  >
                    ✕
                  </button>
                </button>
              );
            })}
          </div>
        )}

        {/* ─── Cards Inside Board ─── */}
        {activeBoard && (
          <div>
            <button
              onClick={() => { setActiveBoard(null); setCards([]); }}
              className="mb-4 flex items-center gap-1 text-sm text-slate-500 hover:text-white"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              Back to boards
            </button>

            {cards.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <span className="text-4xl">🃏</span>
                <p className="mt-3 text-sm text-slate-500">No cards yet</p>
                <p className="mt-1 text-xs text-slate-600">Save positions from your analysis reports to build this board</p>
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {cards.map((card) => (
                  <div key={card.id} className="group rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 transition-all hover:border-white/[0.12]">
                    <div className="aspect-square rounded-lg bg-[#161a24] flex items-center justify-center overflow-hidden">
                      <BlogChessBoard fen={card.fen} orientation={card.orientation === "w" ? "white" : "black"} />
                    </div>
                    {card.label && <p className="mt-2 text-xs font-semibold text-white">{card.label}</p>}
                    {card.note && <p className="mt-0.5 text-[10px] text-slate-500">{card.note}</p>}
                    <div className="mt-2 flex items-center gap-2 text-[10px] text-slate-600">
                      {card.openingName && <span>{card.openingName}</span>}
                      {card.mastery > 0 && <span className="ml-auto text-emerald-500">{["", "★", "★★", "★★★", "★★★★"][card.mastery]}</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
