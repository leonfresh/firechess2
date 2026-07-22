"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, HelpCircle } from "lucide-react";
import { splitMultiPgn } from "@/lib/client-analysis";
import type { AnalysisSource, ScanMode, TimeControl } from "@/lib/client-analysis";
import { scanOwnerStorageKey } from "@/lib/scan-session";

const FULL_SCAN_MODE: ScanMode = "both";
const FREE_MAX_GAMES = 300;
const FREE_MAX_DEPTH = 12;
const FREE_MAX_MOVES = 30;
const PGN_MAX_BYTES = 2 * 1024 * 1024;
const PGN_MAX_GAMES = 250;

function HelpTip({ text }: { text: string }) {
  return (
    <span className="group relative ml-1 inline-flex">
      <HelpCircle className="h-3 w-3 cursor-help text-slate-600 transition-colors group-hover:text-slate-400" />
      <span className="pointer-events-none absolute bottom-full left-1/2 z-[9999] mb-2 w-48 -translate-x-1/2 rounded-lg bg-slate-900/95 px-3 py-2 text-[11px] font-normal leading-snug text-slate-300 opacity-0 shadow-xl backdrop-blur-sm transition-opacity group-hover:opacity-100">
        {text}
        <span className="absolute left-1/2 top-full -translate-x-1/2 border-4 border-transparent border-t-slate-900/95" />
      </span>
    </span>
  );
}

export function ScanSection() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [source, setSource] = useState<AnalysisSource | null>(null);
  const [pgnText, setPgnText] = useState("");
  const [gameCount, setGameCount] = useState(300);
  const [engineDepth, setEngineDepth] = useState(12);
  const [moveCount, setMoveCount] = useState(30);
  const [cpThreshold, setCpThreshold] = useState(50);
  const [gameRangeMode, setGameRangeMode] = useState<"count" | "since">("count");
  const [sinceDate, setSinceDate] = useState("");
  const [untilDate, setUntilDate] = useState("");
  const [speed, setSpeed] = useState<TimeControl[]>(["all"]);
  const [advancedSettingsOpen, setAdvancedSettingsOpen] = useState(false);
  const [state, setState] = useState<"idle" | "loading" | "error">("idle");
  const [error, setError] = useState("");

  // Restore saved prefs on mount
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem("fc-scan-prefs");
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (parsed.source === "lichess" || parsed.source === "chesscom" || parsed.source === "pgn")
        setSource(parsed.source);
      if (typeof parsed.username === "string" && parsed.username) setUsername(parsed.username);
      if (typeof parsed.gameCount === "number") setGameCount(Math.min(100000, Math.max(1, parsed.gameCount)));
      if (typeof parsed.engineDepth === "number") setEngineDepth(Math.min(24, Math.max(6, parsed.engineDepth)));
      if (typeof parsed.moveCount === "number") setMoveCount(Math.min(30, Math.max(1, parsed.moveCount)));
      if (typeof parsed.cpThreshold === "number") setCpThreshold(Math.min(1000, Math.max(1, parsed.cpThreshold)));
    } catch { /* ignore malformed */ }
  }, []);

  // Save prefs on change
  useEffect(() => {
    try {
      window.localStorage.setItem("fc-scan-prefs", JSON.stringify({
        username, source, gameCount, engineDepth, moveCount, cpThreshold,
      }));
    } catch { /* ignore quota */ }
  }, [username, source, gameCount, engineDepth, moveCount, cpThreshold]);

  useEffect(() => {
    if (!advancedSettingsOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setAdvancedSettingsOpen(false); };
    window.addEventListener("keydown", onKey);
    return () => { document.body.style.overflow = prev; window.removeEventListener("keydown", onKey); };
  }, [advancedSettingsOpen]);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const trimmed = username.trim();
    if (!trimmed) { setError(source === "pgn" ? "Enter your name as it appears in the PGN." : "Enter your chess username."); setState("error"); return; }
    if (!source) { setError("Select a platform."); setState("error"); return; }
    if (source === "pgn") {
      const t = pgnText.trim();
      if (!t) { setError("Paste at least one PGN game."); setState("error"); return; }
      if (new Blob([t]).size > PGN_MAX_BYTES) { setError("PGN too large (max 2 MB)."); setState("error"); return; }
      if (splitMultiPgn(t).length > PGN_MAX_GAMES) { setError(`Max ${PGN_MAX_GAMES} games.`); setState("error"); return; }
    }

    setState("idle"); setError("");

    try {
      setState("loading");
      const res = await fetch("/api/scans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chessUsername: trimmed,
          config: {
            maxGames: gameRangeMode === "since" ? 100000 : Math.min(gameCount, FREE_MAX_GAMES),
            maxMoves: Math.min(moveCount, FREE_MAX_MOVES),
            engineDepth: Math.min(engineDepth, FREE_MAX_DEPTH),
            cpThreshold,
            source,
            scanMode: FULL_SCAN_MODE,
            speed,
            since: sinceDate || null,
            until: untilDate || null,
            ...(source === "pgn" ? { pgnText: pgnText.trim() } : {}),
          },
        }),
      });

      const json = await res.json() as { id?: string; guestToken?: string | null; error?: string };
      if (!res.ok || !json.id) throw new Error(json.error || "Could not create report.");

      if (json.guestToken) {
        try { window.localStorage.setItem(scanOwnerStorageKey(json.id), json.guestToken); } catch {}
      }

      router.push(`/report/${json.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setState("error");
    }
  };

  return (
    <section id="scan-section" className="relative overflow-hidden px-4 py-24 sm:px-6 lg:px-8">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-0 top-1/3 h-[400px] w-[400px] rounded-full bg-orange-500/[0.03] blur-[120px]" />
        <div className="absolute right-0 bottom-0 h-[300px] w-[300px] rounded-full bg-red-500/[0.02] blur-[80px]" />
      </div>

      <div className="relative mx-auto max-w-3xl">
        <div className="mb-10 text-center">
          <span className="mb-4 inline-block rounded-full border border-orange-500/15 bg-orange-500/[0.05] px-4 py-1.5 text-xs font-medium uppercase tracking-wider text-orange-200/80">
            Analyzer
          </span>
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Scan your games in seconds
          </h2>
          <p className="mt-3 text-lg text-slate-400">
            Pick a platform, enter your username, and get a full report with every mistake.
          </p>
        </div>

        <form
          onSubmit={onSubmit}
          className="relative overflow-hidden rounded-[1.9rem] p-6 sm:p-8"
          style={{ background: "linear-gradient(160deg, rgba(11, 9, 12, 0.97) 0%, rgba(18, 12, 15, 0.96) 58%, rgba(41, 21, 13, 0.94) 100%)" }}
        >
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-orange-200/35 to-transparent" />

          {/* Platform + username */}
          <div className="mb-4 flex flex-col overflow-hidden rounded-2xl border border-orange-500/10 bg-orange-500/[0.03] transition-colors duration-200 focus-within:border-orange-400/35 sm:flex-row sm:items-center">
            <div className="flex shrink-0 items-center gap-0.5 px-2 py-2">
              {(["lichess", "chesscom", "pgn"] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSource(s)}
                  className={`rounded-xl px-3 py-2 text-sm font-semibold transition-all duration-200 ${
                    source === s
                      ? "bg-gradient-to-r from-amber-200 to-orange-300 text-slate-950"
                      : "text-slate-400 hover:bg-orange-500/[0.08] hover:text-slate-200"
                  }`}
                >
                  {s === "lichess" ? "Lichess" : s === "chesscom" ? "Chess.com" : "PGN"}
                </button>
              ))}
            </div>
            <div className="hidden h-6 w-px shrink-0 bg-orange-500/10 sm:block" />
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder={source === "chesscom" ? "Your Chess.com username" : source === "lichess" ? "Your Lichess username" : source === "pgn" ? "Your name (as in the PGN)" : "Pick a platform, then enter username"}
              className="flex-1 bg-transparent py-4 pl-4 pr-4 text-base text-white outline-none placeholder:text-slate-400"
            />
          </div>

          {/* PGN */}
          {source === "pgn" && (
            <div className="mb-4 rounded-2xl border border-orange-500/10 bg-orange-500/[0.03] p-3">
              <textarea
                value={pgnText}
                onChange={(e) => setPgnText(e.target.value)}
                placeholder="Paste PGN games here..."
                spellCheck={false}
                className="h-32 w-full resize-y rounded-xl bg-black/40 p-3 font-mono text-xs leading-relaxed text-white outline-none placeholder:text-slate-400"
              />
              <div className="mt-2 flex items-center justify-between">
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-orange-500/[0.08] px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-orange-500/[0.12]">
                  <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" />
                  </svg>
                  Upload .pgn
                  <input type="file" accept=".pgn,.txt" className="hidden" onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const reader = new FileReader();
                    reader.onload = () => setPgnText(typeof reader.result === "string" ? reader.result : "");
                    reader.readAsText(file);
                  }} />
                </label>
                <span className="text-[11px] text-slate-400">Up to 250 games · 2 MB</span>
              </div>
            </div>
          )}

          {/* Quick settings */}
          <div className="mb-4 flex flex-wrap gap-3">
            {[
              { label: "Games", value: gameCount, set: setGameCount, max: FREE_MAX_GAMES },
              { label: "Moves", value: moveCount, set: setMoveCount, max: FREE_MAX_MOVES },
              { label: "Depth", value: engineDepth, set: setEngineDepth, max: FREE_MAX_DEPTH },
            ].map(({ label, value, set, max }) => (
              <div key={label} className="flex-1 min-w-[100px] rounded-xl border border-orange-500/5 bg-black/20 px-3 py-2">
                <p className="text-[9px] font-medium uppercase tracking-wider text-slate-500">{label}</p>
                <input
                  type="number"
                  value={value}
                  onChange={(e) => set(Math.min(max, Math.max(1, Number(e.target.value) || 1)))}
                  className="w-full bg-transparent text-base font-bold text-slate-200 outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
              </div>
            ))}
          </div>

          {/* Full scan label */}
          <div className="mb-4 rounded-[1.45rem] bg-[linear-gradient(140deg,rgba(78,34,15,0.22),rgba(37,20,16,0.7)_58%,rgba(18,12,16,0.92)_100%)] px-4 py-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-orange-100/80">Full Scan</p>
              <div className="flex flex-wrap gap-2">
                {["openings", "tactics", "endgames", "time"].map((item) => (
                  <span key={item} className="rounded-full bg-orange-300/[0.08] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-orange-100/80">{item}</span>
                ))}
              </div>
            </div>
            <p className="mt-1 text-sm text-slate-300/80">One report covering openings, tactics, endgames, and time management.</p>
          </div>

          {/* Submit + advanced */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <button
              type="submit"
              disabled={state === "loading"}
              className="group inline-flex h-14 flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-red-600 px-8 text-base font-semibold text-white transition-all duration-300 hover:scale-[1.01] hover:shadow-[0_0_40px_-10px_rgba(249,115,22,0.5)] disabled:scale-100 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {state === "loading" ? (
                <>
                  <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Creating your report...
                </>
              ) : (
                <>
                  Scan my games — free
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </>
              )}
            </button>
            <button
              type="button"
              onClick={() => setAdvancedSettingsOpen(true)}
              className="inline-flex items-center justify-center gap-2 text-sm font-medium text-orange-100/70 transition-colors hover:text-orange-50"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.343 3.94c.09-.542.56-.94 1.11-.94h1.093c.55 0 1.02.398 1.11.94l.149.894c.07.424.384.764.78.93.398.164.855.142 1.205-.108l.737-.527a1.125 1.125 0 011.45.12l.773.774c.39.389.44 1.002.12 1.45l-.527.737c-.25.35-.272.806-.107 1.204.165.397.505.71.93.78l.893.15c.543.09.94.56.94 1.109v1.094c0 .55-.397 1.02-.94 1.11l-.893.149c-.425.07-.765.383-.93.78-.165.398-.143.854.107 1.204l.527.738c.32.447.269 1.06-.12 1.45l-.774.773a1.125 1.125 0 01-1.449.12l-.738-.527c-.35-.25-.806-.272-1.203-.107-.397.165-.71.505-.781.929l-.149.894c-.09.542-.56.94-1.11.94h-1.094c-.55 0-1.019-.398-1.11-.94l-.148-.894c-.071-.424-.384-.764-.781-.93-.398-.164-.854-.142-1.204.108l-.738.527c-.447.32-1.06.269-1.45-.12l-.773-.774a1.125 1.125 0 01-.12-1.45l.527-.737c.25-.35.273-.806.108-1.204-.165-.397-.505-.71-.93-.78l-.894-.15c-.542-.09-.94-.56-.94-1.109v-1.094c0-.55.398-1.02.94-1.11l.894-.149c.424-.07.765-.383.93-.78.165-.398.143-.854-.107-1.204l-.527-.738a1.125 1.125 0 01.12-1.45l.773-.773a1.125 1.125 0 011.45-.12l.737.527c.35.25.807.272 1.204.107.397-.165.71-.505.78-.929l.15-.894z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Advanced settings
            </button>
          </div>

          {error && <p className="mt-3 text-center text-sm text-red-400">{error}</p>}
        </form>

        {/* ── Advanced Settings Modal ── */}
        {advancedSettingsOpen && (
          <div className="fixed inset-0 z-[80] flex items-start justify-center bg-[rgba(2,6,23,0.78)] px-4 py-6 backdrop-blur-sm sm:items-center sm:px-6">
            <div className="absolute inset-0" onClick={() => setAdvancedSettingsOpen(false)} aria-hidden="true" />
            <section className="relative z-10 max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-[2rem] bg-[rgba(6,11,26,0.96)] p-5 shadow-[0_30px_120px_-48px_rgba(2,6,23,0.98)] sm:max-w-4xl sm:p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-orange-200/72">Advanced Scan Settings</p>
                  <h2 className="mt-2 text-2xl font-bold text-white">Tune the scan without crowding the page.</h2>
                  <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-400">Set the platform and username above, then use this panel for depth, thresholds, and range.</p>
                </div>
                <button type="button" onClick={() => setAdvancedSettingsOpen(false)} className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-orange-500/10 bg-orange-500/[0.04] text-slate-400 transition hover:bg-orange-500/[0.08] hover:text-white" aria-label="Close">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M18 6 6 18M6 6l12 12" /></svg>
                </button>
              </div>

              <div className="mt-6 space-y-3">
                {/* Time control */}
                <div className="space-y-2">
                  <span className="text-xs font-medium uppercase tracking-wider text-slate-500">
                    Time Control
                    <HelpTip text="Filter which game speeds to include. Multi-select is supported." />
                  </span>
                  <div className="grid h-auto grid-cols-3 gap-1 rounded-lg bg-black/30 p-1 sm:h-10 sm:grid-cols-5">
                    {[
                      { value: "all" as const, label: "All" },
                      { value: "bullet" as const, label: "Bullet" },
                      { value: "blitz" as const, label: "Blitz" },
                      { value: "rapid" as const, label: "Rapid" },
                      { value: "classical" as const, label: "Classical" },
                    ].map((tc) => {
                      const isActive = speed.includes(tc.value);
                      return (
                        <button
                          key={tc.value}
                          type="button"
                          onClick={() => {
                            if (tc.value === "all") { setSpeed(["all"]); }
                            else {
                              setSpeed((prev) => {
                                const withoutAll = prev.filter((s) => s !== "all");
                                const next = withoutAll.includes(tc.value)
                                  ? withoutAll.filter((s) => s !== tc.value)
                                  : [...withoutAll, tc.value];
                                return next.length === 0 || next.length === 4 ? ["all"] : next;
                              });
                            }
                          }}
                          className={`rounded-md text-[11px] font-semibold transition-all duration-200 ${
                            isActive ? "bg-gradient-to-r from-orange-500 to-red-500 text-white" : "text-slate-400 hover:bg-orange-500/[0.08] hover:text-slate-200"
                          }`}
                        >
                          {tc.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Game range + CP threshold */}
                <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                  <div className="col-span-2 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium uppercase tracking-wider text-slate-500">
                        Games
                        <HelpTip text="Scan your N most recent games (Last N), or pick a date range." />
                      </span>
                      <div className="grid h-6 grid-cols-2 gap-0.5 rounded-md bg-black/30 p-0.5">
                        <button type="button" onClick={() => setGameRangeMode("count")} className={`rounded px-1.5 text-[10px] font-semibold transition-all ${gameRangeMode === "count" ? "bg-orange-500/80 text-white" : "text-slate-500 hover:text-slate-300"}`}>Last N</button>
                        <button type="button" onClick={() => setGameRangeMode("since")} className={`rounded px-1.5 text-[10px] font-semibold transition-all ${gameRangeMode === "since" ? "bg-orange-500/80 text-white" : "text-slate-500 hover:text-slate-300"}`}>Range</button>
                      </div>
                    </div>
                    {gameRangeMode === "count" ? (
                      <input type="number" min={1} max={FREE_MAX_GAMES} value={gameCount} onChange={(e) => setGameCount(Number(e.target.value))} className="h-10 w-full rounded-lg bg-black/40 px-3 text-sm text-white outline-none" />
                    ) : (
                      <div className="space-y-2">
                        <input type="date" value={sinceDate} onChange={(e) => setSinceDate(e.target.value)} max={new Date().toISOString().split("T")[0]} className="h-10 w-full rounded-lg bg-black/40 px-3 text-sm text-white outline-none" />
                        <input type="date" value={untilDate} onChange={(e) => setUntilDate(e.target.value)} min={sinceDate || undefined} max={new Date().toISOString().split("T")[0]} className="h-10 w-full rounded-lg bg-black/40 px-3 text-sm text-white outline-none" />
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <span className="text-xs font-medium uppercase tracking-wider text-slate-500">CP Threshold</span>
                    <input type="number" min={1} max={1000} value={cpThreshold} onChange={(e) => setCpThreshold(Math.min(1000, Math.max(1, Number(e.target.value) || 1)))} className="h-10 w-full rounded-lg bg-black/40 px-3 text-sm text-white outline-none" />
                  </div>
                </div>
              </div>
            </section>
          </div>
        )}
      </div>
    </section>
  );
}
