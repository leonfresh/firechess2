"use client";

import Link from "next/link";
import { Chess, type PieceSymbol } from "chess.js";
import { useMemo, useState } from "react";
import { Chessboard, type CbSquare } from "@/components/chessboard-compat";
import { ExplanationModal } from "@/components/explanation-modal";
import { PositionalMotifTrainer } from "@/components/positional-motif-trainer";
import { useBoardTheme, useCustomPieces } from "@/lib/use-coins";
import { POSITIONAL_PATTERNS } from "@/lib/positional-quotes";
import {
  describeEndPosition,
  explainOpeningLeak,
  type PositionExplanation,
} from "@/lib/position-explainer";
import { stockfishClient } from "@/lib/stockfish-client";

type MotifExample = {
  fenBefore: string;
  userMove?: string;
  bestMove?: string | null;
  cpLoss: number;
  gameUrl?: string;
};

type ScanPositionalMotif = {
  name: string;
  icon: string;
  count: number;
  avgCpLoss: number;
  examples: MotifExample[];
};

type ExplanationPayload = {
  rich: PositionExplanation;
  animationLine: string[];
  altLine: string[];
  altLabel?: string;
  orientation: "white" | "black";
  title: string;
  subtitle: string;
  fen: string;
};

type ColorPalette = {
  card: string;
  bar: string;
  ring: string;
  chip: string;
  icon: string;
};

const FREE_POSITIONAL_SAMPLE = 3;

const COLOR_MAP: Record<string, ColorPalette> = {
  amber: {
    card: "border-[#ff5a1f]/25 bg-[#ff5a1f]/[0.06]",
    bar: "bg-[#ff5a1f]",
    ring: "ring-amber-500/25",
    chip: "bg-[#ff5a1f]/[0.08] text-[#ff8c42]",
    icon: "bg-[#ff5a1f]/[0.08] shadow-amber-500/10",
  },
  orange: {
    card: "border-orange-500/20 bg-orange-500/[0.03]",
    bar: "bg-orange-400",
    ring: "ring-orange-500/25",
    chip: "bg-orange-500/15 text-orange-400",
    icon: "bg-orange-500/15 shadow-orange-500/10",
  },
  rose: {
    card: "border-rose-500/20 bg-rose-500/[0.03]",
    bar: "bg-rose-400",
    ring: "ring-rose-500/25",
    chip: "bg-rose-500/15 text-rose-400",
    icon: "bg-rose-500/15 shadow-rose-500/10",
  },
  red: {
    card: "border-red-500/20 bg-red-500/[0.03]",
    bar: "bg-red-400",
    ring: "ring-red-500/25",
    chip: "bg-red-500/15 text-red-400",
    icon: "bg-red-500/15 shadow-red-500/10",
  },
  slate: {
    card: "border-slate-500/20 bg-slate-500/[0.03]",
    bar: "bg-slate-400",
    ring: "ring-slate-500/25",
    chip: "bg-slate-500/15 text-[#f0edf2]",
    icon: "bg-slate-500/15 shadow-slate-500/10",
  },
  violet: {
    card: "border-[#ff5a1f]/25 bg-[#ff5a1f]/[0.06]",
    bar: "bg-[#ff5a1f]",
    ring: "ring-violet-500/25",
    chip: "bg-[#ff5a1f]/[0.08] text-[#ff8c42]",
    icon: "bg-[#ff5a1f]/[0.08] shadow-violet-500/10",
  },
  yellow: {
    card: "border-yellow-500/20 bg-yellow-500/[0.03]",
    bar: "bg-yellow-400",
    ring: "ring-yellow-500/25",
    chip: "bg-yellow-500/15 text-yellow-400",
    icon: "bg-yellow-500/15 shadow-yellow-500/10",
  },
  blue: {
    card: "border-blue-500/20 bg-blue-500/[0.03]",
    bar: "bg-blue-400",
    ring: "ring-blue-500/25",
    chip: "bg-blue-500/15 text-blue-400",
    icon: "bg-blue-500/15 shadow-blue-500/10",
  },
  cyan: {
    card: "border-[#ff5a1f]/25 bg-[#ff5a1f]/[0.06]",
    bar: "bg-[#ff5a1f]",
    ring: "ring-cyan-500/25",
    chip: "bg-[#ff5a1f]/[0.08] text-[#ff8c42]",
    icon: "bg-[#ff5a1f]/[0.08] shadow-cyan-500/10",
  },
  indigo: {
    card: "border-indigo-500/20 bg-indigo-500/[0.03]",
    bar: "bg-indigo-400",
    ring: "ring-indigo-500/25",
    chip: "bg-indigo-500/15 text-indigo-400",
    icon: "bg-indigo-500/15 shadow-indigo-500/10",
  },
  teal: {
    card: "border-teal-500/20 bg-teal-500/[0.03]",
    bar: "bg-teal-400",
    ring: "ring-teal-500/25",
    chip: "bg-teal-500/15 text-teal-400",
    icon: "bg-teal-500/15 shadow-teal-500/10",
  },
};

function isUciMove(move: string): boolean {
  return /^[a-h][1-8][a-h][1-8][qrbn]?$/.test(move);
}

function playMove(chess: Chess, move: string) {
  if (isUciMove(move)) {
    return chess.move({
      from: move.slice(0, 2),
      to: move.slice(2, 4),
      promotion: (move[4] || undefined) as PieceSymbol | undefined,
    });
  }

  return chess.move(move);
}

function resolveMotifMove(
  fen: string,
  move: string | null | undefined,
): { from: CbSquare; to: CbSquare; san: string } | null {
  if (!move) return null;

  try {
    const chess = new Chess(fen);
    const result = playMove(chess, move);
    if (!result) return null;

    return {
      from: result.from as CbSquare,
      to: result.to as CbSquare,
      san: result.san,
    };
  } catch {
    return null;
  }
}

function formatSanSequence(startFen: string, moves: string[]): string[] {
  try {
    const chess = new Chess(startFen);
    const tokens: string[] = [];

    for (const move of moves) {
      if (!move) continue;
      const moveNumber = chess.moveNumber();
      const side = chess.turn();
      const result = playMove(chess, move);
      if (!result) break;

      tokens.push(
        side === "w"
          ? `${moveNumber}.${result.san}`
          : `${moveNumber}...${result.san}`,
      );
    }

    return tokens;
  } catch {
    return [];
  }
}

function findPattern(motifName: string) {
  return POSITIONAL_PATTERNS.find(
    (pattern) =>
      motifName.startsWith(pattern.label) || motifName.includes(pattern.tag),
  );
}

async function buildPositionalExplanation(
  example: MotifExample,
  sideToMove: "white" | "black",
): Promise<ExplanationPayload> {
  const coaching = explainOpeningLeak(
    example.fenBefore,
    example.userMove ?? "",
    example.bestMove ?? null,
    example.cpLoss,
    0,
    -example.cpLoss,
  );

  const rich: PositionExplanation = {
    ...coaching.best,
    observations: [...coaching.best.observations],
  };

  const playedUci = example.userMove ?? "";
  const bestUci = example.bestMove ?? "";
  const playedSan =
    resolveMotifMove(example.fenBefore, playedUci)?.san ?? playedUci;
  let bestSan = resolveMotifMove(example.fenBefore, bestUci)?.san ?? bestUci;

  let animationLine = bestUci ? [bestUci] : playedUci ? [playedUci] : [];
  let altLine: string[] = [];
  let altLabel: string | undefined;

  if (bestUci) {
    try {
      const bestChess = new Chess(example.fenBefore);
      const bestResult = playMove(bestChess, bestUci);

      if (bestResult) {
        bestSan = bestResult.san;

        const bestPv = await stockfishClient.getPrincipalVariation(
          bestChess.fen(),
          9,
          12,
        );
        const bestContinuation = bestPv?.pvMoves ?? [];
        animationLine = [bestUci, ...bestContinuation];

        const bestTokens = formatSanSequence(example.fenBefore, animationLine);
        if (bestTokens.length > 0) {
          rich.observations.push(
            `**Engine best line**: ${bestTokens.join(" ")}`,
          );
        }

        try {
          const finalSim = new Chess(example.fenBefore);
          for (const move of animationLine) {
            const result = playMove(finalSim, move);
            if (!result) break;
          }

          const finalEval = await stockfishClient.evaluateFen(
            finalSim.fen(),
            8,
          );
          const outlook = describeEndPosition(
            finalSim.fen(),
            sideToMove === "white" ? "w" : "b",
            finalEval?.cp ?? null,
          );

          if (outlook.summary) {
            rich.observations.push(`**Position outlook**: ${outlook.summary}`);
          }

          for (const detail of outlook.details) {
            rich.observations.push(`  · ${detail}`);
          }
        } catch {
          // Ignore evaluation failures in the modal helper.
        }

        try {
          const captureMoves = bestChess
            .moves({ verbose: true })
            .filter(
              (move) =>
                move.to === bestResult.to &&
                (move.flags.includes("c") || move.flags.includes("e")),
            );

          if (captureMoves.length > 0) {
            const pieceOrder = ["p", "n", "b", "r", "q", "k"];
            captureMoves.sort(
              (left, right) =>
                pieceOrder.indexOf(left.piece) -
                pieceOrder.indexOf(right.piece),
            );

            const recapture = captureMoves[0];
            const recaptureUci = `${recapture.from}${recapture.to}${recapture.promotion ?? ""}`;
            altLine = [bestUci, recaptureUci];
            altLabel = `If ${recapture.san}?`;

            try {
              const recaptureChess = new Chess(bestChess.fen());
              recaptureChess.move({
                from: recapture.from,
                to: recapture.to,
                promotion: recapture.promotion as PieceSymbol | undefined,
              });

              const recapturePv = await stockfishClient.getPrincipalVariation(
                recaptureChess.fen(),
                9,
                10,
              );

              if (recapturePv?.pvMoves?.length) {
                altLine = [bestUci, recaptureUci, ...recapturePv.pvMoves];
              }
            } catch {
              // Keep the two-move natural line fallback.
            }
          }
        } catch {
          // Ignore recapture-line failures in the modal helper.
        }
      }
    } catch {
      // Ignore best-line expansion failures in the modal helper.
    }
  }

  if (playedUci) {
    try {
      const punishChess = new Chess(example.fenBefore);
      const punishResult = playMove(punishChess, playedUci);

      if (punishResult) {
        const punishPv = await stockfishClient.getPrincipalVariation(
          punishChess.fen(),
          8,
          10,
        );
        const punishmentLine = [playedUci, ...(punishPv?.pvMoves ?? [])];
        const punishmentTokens = formatSanSequence(
          example.fenBefore,
          punishmentLine,
        );

        if (punishmentTokens.length > 0) {
          rich.observations.push(
            `**After your move** (${playedSan || punishResult.san}): ${punishmentTokens.join(" ")}`,
          );
        }
      }
    } catch {
      // Ignore punishment-line failures in the modal helper.
    }
  }

  return {
    rich,
    animationLine,
    altLine,
    altLabel,
    orientation: sideToMove,
    title: bestSan ? `Best Move: ${bestSan}` : rich.headline,
    subtitle: rich.headline,
    fen: example.fenBefore,
  };
}

export function ScanPositionalMotifs({
  motifs,
  isProcessing,
  showTrainer = false,
  hasProAccess = false,
}: {
  motifs: ScanPositionalMotif[];
  isProcessing: boolean;
  showTrainer?: boolean;
  hasProAccess?: boolean;
}) {
  const boardTheme = useBoardTheme();
  const customPieces = useCustomPieces();
  const motifMax = useMemo(
    () => Math.max(1, ...motifs.map((motif) => motif.count)),
    [motifs],
  );
  const [expandedMotifs, setExpandedMotifs] = useState<Set<string>>(new Set());
  const [posExplainModalOpen, setPosExplainModalOpen] = useState(false);
  const [posExplainRich, setPosExplainRich] =
    useState<PositionExplanation | null>(null);
  const [posExplainAnimUci, setPosExplainAnimUci] = useState<string[]>([]);
  const [posExplainAltUci, setPosExplainAltUci] = useState<string[]>([]);
  const [posExplainAltLabel, setPosExplainAltLabel] = useState<
    string | undefined
  >();
  const [posExplainFen, setPosExplainFen] = useState("");
  const [posExplainOrientation, setPosExplainOrientation] = useState<
    "white" | "black"
  >("white");
  const [posExplainTitle, setPosExplainTitle] = useState("");
  const [posExplainSubtitle, setPosExplainSubtitle] = useState("");
  const [posExplaining, setPosExplaining] = useState<string | null>(null);

  if (motifs.length === 0) return null;

  const hangingPiecesMotif = motifs.find((m) => m.name === "Hanging Pieces");

  return (
    <div className="space-y-4">
      {/* Hanging Pieces spotlight — always call it out prominently */}
      {hangingPiecesMotif ? (
        <div className="overflow-hidden rounded-2xl border border-red-500/20 bg-gradient-to-r from-red-500/[0.06] to-red-500/[0.02]">
          <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-4">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-red-500/15 text-2xl shadow-lg shadow-red-500/10">
                💀
              </span>
              <div>
                <p className="text-sm font-extrabold text-red-300">
                  Loose pieces are your most expensive habit
                </p>
                <p className="mt-1 text-sm leading-relaxed text-[#f0edf2]">
                  You left a piece hanging{" "}
                  <span className="font-bold text-red-400">
                    {hangingPiecesMotif.count}x
                  </span>{" "}
                  across your games, costing an average of{" "}
                  <span className="font-bold text-red-400">
                    ~{(hangingPiecesMotif.avgCpLoss / 100).toFixed(1)} pawns
                  </span>{" "}
                  each time. Before every move, run a 1-second scan: is anything undefended?
                </p>
              </div>
            </div>
            <span className="shrink-0 rounded-full border border-red-500/20 bg-red-500/10 px-3 py-1.5 text-xs font-bold text-red-400">
              Top priority
            </span>
          </div>
        </div>
      ) : null}

      <div className="rounded-2xl border border-transparent bg-gradient-to-r from-[#ff5a1f]/[0.04] to-transparent px-5 py-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#ff8c42]">
              Human-readable habits
            </p>
            <p className="mt-1 text-sm leading-relaxed text-[#f0edf2]">
              {motifs.length === 1
                ? "One concrete habit stands out across your games."
                : `${motifs.length} concrete habits detected. The ones at the top are your highest-priority fixes.`}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {motifs.slice(0, 3).map((motif) => {
              const pattern = findPattern(motif.name);
              return (
                <span
                  key={motif.name}
                  className="inline-flex items-center gap-1 rounded-full border border-[#ff5a1f]/25 bg-[#ff5a1f]/[0.06] px-2.5 py-1 text-[11px] font-semibold text-[#ff8c42]"
                >
                  {pattern?.icon ?? motif.icon} {motif.name}
                  <span className="opacity-60">x{motif.count}</span>
                </span>
              );
            })}
          </div>
        </div>
      </div>

      {motifs.map((motif, motifIndex) => {
        const pattern = findPattern(motif.name);
        const colors = COLOR_MAP[pattern?.color ?? "amber"] ?? COLOR_MAP.amber;
        const icon = pattern?.icon ?? motif.icon;
        const quote = pattern?.quote;
        const author = pattern?.author;
        const freqPct = Math.max(8, Math.round((motif.count / motifMax) * 100));
        const severityClass =
          motif.avgCpLoss >= 15000
            ? "text-red-400"
            : motif.avgCpLoss >= 8000
              ? "text-[#ff8c42]"
              : "text-yellow-400";
        const priorityLabel =
          motifIndex === 0
            ? "Top Priority"
            : motif.count >= Math.ceil(motifMax * 0.6)
              ? "High Impact"
              : motif.count >= Math.ceil(motifMax * 0.3)
                ? "Watch Out"
                : "Minor Habit";
        const priorityClass =
          motifIndex === 0
            ? "bg-red-500/15 text-red-400 ring-1 ring-red-500/20"
            : motif.count >= Math.ceil(motifMax * 0.6)
              ? "bg-orange-500/15 text-orange-400 ring-1 ring-orange-500/20"
              : motif.count >= Math.ceil(motifMax * 0.3)
                ? "bg-[#ff5a1f]/[0.08] text-[#ff8c42] ring-1 ring-amber-500/20"
                : "bg-[#ff5a1f]/[0.05] text-[#8d8696]";
        const isExpanded = expandedMotifs.has(motif.name);
        const hasExamples = motif.examples.length > 0;

        return (
          <div
            key={motif.name}
            className={`overflow-hidden rounded-2xl border ${colors.card}`}
          >
            <div
              className={`h-[3px] w-full ${colors.bar} opacity-60`}
              style={{ width: `${freqPct}%` }}
            />

            <div className="p-5 md:p-6">
              <div className="mb-4 flex items-center justify-between gap-3">
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${priorityClass}`}
                >
                  {motifIndex === 0 ? (
                    <span className="h-1.5 w-1.5 rounded-full bg-red-400 animate-pulse" />
                  ) : null}
                  {priorityLabel}
                </span>

                <div className="flex items-center gap-2">
                  <span className={`text-xs font-bold ${severityClass}`}>
                    {motif.count}x detected
                  </span>
                  <span className="text-[11px] text-[#565061]">
                    avg -{(motif.avgCpLoss / 100).toFixed(1)} pawns
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div
                  className={`relative flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl ${colors.icon} text-2xl shadow-lg ring-1 ${colors.ring}`}
                >
                  {icon}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-lg font-bold leading-snug text-white">
                    {motif.name}
                  </h3>
                  <div className="mt-2 flex items-center gap-2">
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[#1e1a24]">
                      <div
                        className={`h-full rounded-full ${colors.bar} transition-all duration-700`}
                        style={{ width: `${freqPct}%` }}
                      />
                    </div>
                    <span className="shrink-0 text-[10px] font-medium text-[#565061]">
                      {motif.count}/{motifMax} max
                    </span>
                  </div>
                </div>
              </div>

              {quote ? (
                <blockquote className="mt-4 rounded-xl border border-[#1e1a24] bg-[#ff5a1f]/[0.03] px-4 py-3">
                  <p className="text-sm italic leading-relaxed text-[#f0edf2]">
                    &ldquo;{quote}&rdquo;
                  </p>
                  <p className="mt-1.5 text-[11px] font-medium text-[#565061]">
                    - {author}
                  </p>
                </blockquote>
              ) : null}

              {hasExamples ? (
                <button
                  type="button"
                  onClick={() => {
                    setExpandedMotifs((current) => {
                      const next = new Set(current);
                      if (next.has(motif.name)) next.delete(motif.name);
                      else next.add(motif.name);
                      return next;
                    });
                  }}
                  className={`mt-4 flex w-full items-center justify-between rounded-xl border px-4 py-3 text-sm font-semibold transition-all ${
                    isExpanded
                      ? "border-[#ff5a1f]/25 bg-[#ff5a1f]/[0.06] text-[#ff8c42]"
                      : "border-[#1e1a24] bg-[#ff5a1f]/[0.04] text-[#f0edf2] hover:border-[#ff5a1f]/25 hover:bg-[#ff5a1f]/[0.06] hover:text-[#ff8c42]"
                  }`}
                >
                  <span className="flex items-center gap-2.5">
                    <svg
                      width="15"
                      height="15"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <rect x="3" y="3" width="7" height="7" rx="1" />
                      <rect x="14" y="3" width="7" height="7" rx="1" />
                      <rect x="14" y="14" width="7" height="7" rx="1" />
                      <rect x="3" y="14" width="7" height="7" rx="1" />
                    </svg>
                    {isExpanded
                      ? "Hide positions"
                      : `See ${motif.examples.length} position${motif.examples.length === 1 ? "" : "s"} from your games`}
                  </span>
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    className={`shrink-0 transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`}
                  >
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </button>
              ) : null}
            </div>

            {isExpanded && hasExamples ? (
              <div className="border-t border-[#1e1a24] bg-[#ff5a1f]/[0.02] px-5 pb-5 pt-4">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#565061]">
                      Positions from your games
                    </p>
                    <p className="mt-0.5 text-[11px] text-[#565061]">
                      Each board shows your move in red and the engine move in
                      green.
                    </p>
                  </div>

                  <div className="flex items-center gap-3 text-[10px] text-[#565061]">
                    <span className="flex items-center gap-1">
                      <span
                        className="inline-block h-2 w-3.5 rounded-sm"
                        style={{ backgroundColor: "rgba(239, 68, 68, 0.85)" }}
                      />
                      Your move
                    </span>
                    <span className="flex items-center gap-1">
                      <span
                        className="inline-block h-2 w-3.5 rounded-sm"
                        style={{ backgroundColor: "rgba(34, 197, 94, 0.85)" }}
                      />
                      Best move
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {(hasProAccess
                    ? motif.examples
                    : motif.examples.slice(0, FREE_POSITIONAL_SAMPLE)
                  ).map((example, exampleIndex) => {
                    const userMove = resolveMotifMove(
                      example.fenBefore,
                      example.userMove,
                    );
                    const bestMove = resolveMotifMove(
                      example.fenBefore,
                      example.bestMove,
                    );
                    const sideToMove = example.fenBefore.includes(" b ")
                      ? "black"
                      : "white";
                    const arrows: [CbSquare, CbSquare, string][] = [];

                    if (userMove) {
                      arrows.push([
                        userMove.from,
                        userMove.to,
                        "rgba(239, 68, 68, 0.85)",
                      ]);
                    }
                    if (bestMove) {
                      arrows.push([
                        bestMove.from,
                        bestMove.to,
                        "rgba(34, 197, 94, 0.85)",
                      ]);
                    }

                    const explainKey = `${motif.name}-${exampleIndex}`;
                    const isExplaining = posExplaining === explainKey;
                    const moveNumber = example.fenBefore.split(" ")[5] ?? "?";
                    const evalColor =
                      example.cpLoss >= 100
                        ? "bg-red-500/15 text-red-400"
                        : example.cpLoss >= 70
                          ? "bg-orange-500/15 text-orange-400"
                          : "bg-[#ff5a1f]/[0.08] text-[#ff8c42]";
                    const boardId = `scan-pos-${motif.name.replace(/\s+/g, "-").toLowerCase()}-${exampleIndex}`;

                    return (
                      <div
                        key={`${example.fenBefore}-${exampleIndex}`}
                        className="flex flex-col overflow-hidden rounded-2xl border border-[#1e1a24] shadow-lg"
                      >
                        <div className="flex items-center justify-between border-b border-[#1e1a24] bg-[#ff5a1f]/[0.03] px-3.5 py-2.5">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-[#8d8696]">
                            Move {moveNumber} - as {sideToMove}
                          </span>
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${evalColor}`}
                          >
                            -{(example.cpLoss / 100).toFixed(1)} pawns
                          </span>
                        </div>

                        <div className="relative aspect-square w-full border-b border-[#1e1a24]">
                          <Chessboard
                            id={boardId}
                            position={example.fenBefore}
                            arePiecesDraggable={false}
                            customArrows={arrows}
                            boardOrientation={sideToMove}
                            customDarkSquareStyle={{
                              backgroundColor: boardTheme.darkSquare,
                            }}
                            customLightSquareStyle={{
                              backgroundColor: boardTheme.lightSquare,
                            }}
                            customBoardStyle={{ borderRadius: "0px" }}
                            showBoardNotation={false}
                            customPieces={customPieces}
                          />
                        </div>

                        <div className="grid grid-cols-2 divide-x divide-white/[0.06]">
                          <div className="flex flex-col items-center gap-0.5 px-3 py-3">
                            <span className="text-[9px] font-semibold uppercase tracking-widest text-[#565061]">
                              You played
                            </span>
                            {userMove ? (
                              <span className="font-mono text-sm font-bold text-red-400">
                                {userMove.san}
                              </span>
                            ) : (
                              <span className="text-[10px] text-[#565061]">
                                -
                              </span>
                            )}
                          </div>

                          <div className="flex flex-col items-center gap-0.5 px-3 py-3">
                            <span className="text-[9px] font-semibold uppercase tracking-widest text-[#565061]">
                              Engine best
                            </span>
                            {bestMove ? (
                              <span className="font-mono text-sm font-bold text-emerald-400">
                                {bestMove.san}
                              </span>
                            ) : (
                              <span className="text-[10px] text-[#565061]">
                                -
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex flex-col gap-2 border-t border-[#1e1a24] px-3.5 pb-3.5 pt-3">
                          <button
                            type="button"
                            onClick={async () => {
                              if (isExplaining) return;

                              setPosExplaining(explainKey);
                              try {
                                const payload =
                                  await buildPositionalExplanation(
                                    example,
                                    sideToMove,
                                  );
                                setPosExplainRich(payload.rich);
                                setPosExplainAnimUci(payload.animationLine);
                                setPosExplainAltUci(payload.altLine);
                                setPosExplainAltLabel(payload.altLabel);
                                setPosExplainFen(payload.fen);
                                setPosExplainOrientation(payload.orientation);
                                setPosExplainTitle(payload.title);
                                setPosExplainSubtitle(payload.subtitle);
                                setPosExplainModalOpen(true);
                              } finally {
                                setPosExplaining(null);
                              }
                            }}
                            disabled={isExplaining}
                            className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-[#ff5a1f]/25 bg-[#ff5a1f]/[0.06] py-2.5 text-xs font-semibold text-[#ff8c42] transition-all hover:border-[#ff5a1f]/25 hover:bg-[#ff5a1f]/[0.12] hover:text-[#ff8c42] disabled:cursor-wait disabled:opacity-50"
                          >
                            {isExplaining ? (
                              <>
                                <svg
                                  className="h-3.5 w-3.5 animate-spin"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                >
                                  <circle
                                    cx="12"
                                    cy="12"
                                    r="10"
                                    stroke="currentColor"
                                    strokeWidth="3"
                                    className="opacity-20"
                                  />
                                  <path
                                    d="M12 2a10 10 0 019.95 9"
                                    stroke="currentColor"
                                    strokeWidth="3"
                                    strokeLinecap="round"
                                  />
                                </svg>
                                Analyzing...
                              </>
                            ) : (
                              <>
                                <svg
                                  width="12"
                                  height="12"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2.5"
                                >
                                  <circle cx="12" cy="12" r="10" />
                                  <path d="M12 8v4m0 4h.01" />
                                </svg>
                                Explain this position
                              </>
                            )}
                          </button>

                          {example.gameUrl ? (
                            <a
                              href={example.gameUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-[#1e1a24] bg-[#ff5a1f]/[0.04] py-2 text-xs font-semibold text-[#8d8696] transition-all hover:border-[#ff5a1f]/25 hover:bg-[#1e1a24] hover:text-white"
                            >
                              <svg
                                width="11"
                                height="11"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2.5"
                              >
                                <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
                                <polyline points="15 3 21 3 21 9" />
                                <line x1="10" y1="14" x2="21" y2="3" />
                              </svg>
                              View game
                            </a>
                          ) : null}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {!hasProAccess &&
                motif.examples.length > FREE_POSITIONAL_SAMPLE ? (
                  <>
                    <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                      {motif.examples
                        .slice(FREE_POSITIONAL_SAMPLE)
                        .map((_, lockedIndex) => (
                          <div
                            key={`${motif.name}-locked-${lockedIndex}`}
                            className="flex flex-col overflow-hidden rounded-2xl border border-[#1e1a24] bg-[#ff5a1f]/[0.02]"
                          >
                            <div className="flex items-center justify-between border-b border-[#1e1a24] bg-[#ff5a1f]/[0.03] px-3.5 py-2.5">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-[#565061]">
                                Locked
                              </span>
                              <span className="rounded-full bg-[#ff5a1f]/[0.05] px-2 py-0.5 text-[10px] text-[#565061]">
                                Pro
                              </span>
                            </div>

                            <div className="flex aspect-square w-full flex-col items-center justify-center gap-2 border-b border-[#1e1a24] bg-[#ff5a1f]/[0.02]">
                              <span className="text-2xl">🔒</span>
                              <p className="px-3 text-center text-[10px] font-semibold text-[#565061]">
                                Pro only
                              </p>
                            </div>

                            <div className="grid grid-cols-2 divide-x divide-white/[0.04] opacity-30">
                              <div className="h-[52px] px-3 py-3" />
                              <div className="h-[52px] px-3 py-3" />
                            </div>
                          </div>
                        ))}
                    </div>

                    <div className="mt-4 text-center">
                      <Link
                        href="/pricing"
                        className="inline-flex items-center gap-2 rounded-full bg-[#ff5a1f]/[0.08] px-5 py-2 text-xs font-bold text-white shadow-lg shadow-amber-500/20 transition-opacity hover:opacity-90"
                      >
                        🔓 Unlock{" "}
                        {motif.examples.length - FREE_POSITIONAL_SAMPLE} more
                        position
                        {motif.examples.length - FREE_POSITIONAL_SAMPLE === 1
                          ? ""
                          : "s"}
                      </Link>
                    </div>
                  </>
                ) : null}
              </div>
            ) : null}
          </div>
        );
      })}

      {motifs.length >= 2 ? (
        <div className="rounded-2xl border border-[#ff5a1f]/25 bg-[#ff5a1f]/[0.06] p-5">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 shrink-0 text-lg">💡</span>
            <div>
              <p className="text-sm font-semibold text-white">
                These habits often repeat unconsciously.
              </p>
              <p className="mt-1 text-sm leading-relaxed text-[#8d8696]">
                Awareness is the first step. Pause and ask yourself whether the
                move has a concrete purpose before committing. Head to the{" "}
                <Link
                  href="/train"
                  className="font-semibold text-[#ff8c42] underline underline-offset-2 hover:text-[#ff8c42]"
                >
                  Training Center
                </Link>{" "}
                to drill the exact positions where these patterns appear.
              </p>
            </div>
          </div>
        </div>
      ) : null}

      {showTrainer ? <PositionalMotifTrainer motifs={motifs} /> : null}

      <ExplanationModal
        open={posExplainModalOpen}
        onClose={() => setPosExplainModalOpen(false)}
        variant="opening"
        activeTab="best"
        richExplanation={posExplainRich}
        fen={posExplainFen}
        uciMoves={posExplainAnimUci}
        altUciMoves={posExplainAltUci.length > 0 ? posExplainAltUci : undefined}
        altUciLabel={posExplainAltLabel}
        boardOrientation={posExplainOrientation}
        autoPlay
        title={posExplainTitle}
        subtitle={posExplainSubtitle}
      />
    </div>
  );
}
