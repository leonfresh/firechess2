import { useCallback, useEffect, useRef, useState } from "react";
import type { WordTiming } from "@/app/api/puzzle-speech/route";
import type { GestureType } from "@/components/puzzle-avatar/PuzzleAvatar";
import type { PuzzleAvatarAudioRef } from "@/components/puzzle-avatar/PuzzleAvatar";
import { buildPuzzleScript } from "@/lib/puzzle-commentary";
import { analyzePuzzleForTutor } from "@/lib/puzzle-analysis";

type TutorAnalysis = Awaited<ReturnType<typeof analyzePuzzleForTutor>>;

type SpeechOutcome = "completed" | "interrupted" | "blocked" | "failed";
type WaitOutcome = "completed" | "interrupted";

export type TutorPhase =
  | "idle"
  | "loading"
  | "intro"
  | "hint"
  | "thinking"
  | "move"
  | "opponent_dev_question"
  | "opponent_dev_answer"
  | "conclusion"
  | "done";

// fen = position AFTER the opponent's trigger move (what the player sees)
// solutionMoves = space-separated UCI solution moves (trigger already excluded)
export interface TutorPuzzle {
  id: string;
  fen: string;
  solutionMoves: string;
  themes: string;
  rating: number;
}

export interface TutorState {
  phase: TutorPhase;
  currentText: string;
  gesture: GestureType;
  currentMoveIndex: number;
  appliedMoveCount: number;
  awaitingUserMove: boolean;
  expectedMove: string | null;
  thinkingCountdown: number;
  solutionMoves: string[];
  isPlaying: boolean;
  error: string | null;
}

interface UsePuzzleTutorReturn {
  state: TutorState;
  audioRef: React.RefObject<PuzzleAvatarAudioRef>;
  startTutor: (puzzle: TutorPuzzle) => void;
  submitMove: (uci: string) => boolean;
  skipPhase: () => void;
  stopTutor: () => void;
  nextMove: () => void;
  setVoice: (voice: string) => void;
}

async function generateSpeech(
  text: string,
  voice: string,
): Promise<{
  audioBase64: string;
  wordTimings: WordTiming[];
  durationSeconds: number;
} | null> {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), 12000);

  try {
    const res = await fetch("/api/puzzle-speech", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify({ text, voice }),
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  } finally {
    window.clearTimeout(timeoutId);
  }
}

const OPTIONAL_ANALYSIS_WAIT_MS = 2500;

const EMPTY_ANALYSIS: TutorAnalysis = {
  wrongMove: null,
  wrongMoveLoss: 0,
  opponentDeviation: null,
  opponentDeviationResponse: null,
};

const GESTURE_FOR_PHASE: Record<TutorPhase, GestureType> = {
  idle: "idle",
  loading: "idle",
  intro: "explaining",
  hint: "pointing",
  thinking: "thinking",
  move: "explaining",
  opponent_dev_question: "thinking",
  opponent_dev_answer: "explaining",
  conclusion: "happy",
  done: "happy",
};

function getThinkingSeconds(rating: number): number {
  if (rating <= 1000) return 5;
  if (rating <= 1500) return 7;
  if (rating <= 2000) return 9;
  if (rating <= 2500) return 11;
  return 13;
}

function isPlaybackBlocked(error: unknown): boolean {
  if (error instanceof DOMException) {
    return error.name === "NotAllowedError";
  }

  return (
    typeof error === "object" &&
    error !== null &&
    "name" in error &&
    (error as { name?: string }).name === "NotAllowedError"
  );
}

async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  fallback: T,
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((resolve) => {
      setTimeout(() => resolve(fallback), timeoutMs);
    }),
  ]);
}

function getPreferredSpeechLang(voice: string): string {
  const parts = voice.split("-");
  if (parts.length >= 2) {
    return `${parts[0]}-${parts[1]}`;
  }
  return "en-US";
}

function pickBrowserVoice(preferredLang: string): SpeechSynthesisVoice | null {
  if (typeof window === "undefined" || !window.speechSynthesis) {
    return null;
  }

  const voices = window.speechSynthesis.getVoices();
  if (!voices.length) {
    return null;
  }

  const preferredBase = preferredLang.split("-")[0]?.toLowerCase() ?? "en";
  const exact = voices.find(
    (voice) => voice.lang.toLowerCase() === preferredLang.toLowerCase(),
  );
  if (exact) {
    return exact;
  }

  const sameLanguage = voices.find((voice) =>
    voice.lang.toLowerCase().startsWith(preferredBase),
  );
  return sameLanguage ?? voices[0] ?? null;
}

export function usePuzzleTutor(): UsePuzzleTutorReturn {
  const [state, setState] = useState<TutorState>({
    phase: "idle",
    currentText: "",
    gesture: "idle",
    currentMoveIndex: 0,
    appliedMoveCount: 0,
    awaitingUserMove: false,
    expectedMove: null,
    thinkingCountdown: 0,
    solutionMoves: [],
    isPlaying: false,
    error: null,
  });

  const audioRef = useRef<PuzzleAvatarAudioRef>({ wordActive: 0 });
  const audioElRef = useRef<HTMLAudioElement | null>(null);
  const wordTimingsRef = useRef<WordTiming[]>([]);
  const animFrameRef = useRef<number | null>(null);
  const voiceRef = useRef("en-US-AvaNeural");
  const activeWaitRef = useRef<(() => void) | null>(null);
  const sequenceIdRef = useRef(0);
  const pendingMoveRef = useRef<string | null>(null);

  // Script and analysis stored in refs so callbacks don't go stale
  const scriptRef = useRef<ReturnType<typeof buildPuzzleScript> | null>(null);
  const phaseRef = useRef<TutorPhase>("idle");

  const setPhase = useCallback(
    (phase: TutorPhase, text: string, extraState?: Partial<TutorState>) => {
      phaseRef.current = phase;
      setState((prev) => ({
        ...prev,
        phase,
        currentText: text,
        gesture: GESTURE_FOR_PHASE[phase],
        ...extraState,
      }));
    },
    [],
  );

  const cleanupPlayback = useCallback(() => {
    if (audioElRef.current) {
      audioElRef.current.pause();
      audioElRef.current.src = "";
      audioElRef.current = null;
    }
    if (animFrameRef.current !== null) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (audioRef.current) audioRef.current.wordActive = 0;

    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
  }, []);

  const clearActiveWait = useCallback((interrupt?: () => void) => {
    if (!interrupt || activeWaitRef.current === interrupt) {
      activeWaitRef.current = null;
    }
  }, []);

  const interruptActiveWait = useCallback(() => {
    const interrupt = activeWaitRef.current;
    activeWaitRef.current = null;
    interrupt?.();
  }, []);

  const isCurrentSequence = useCallback((sequenceId: number) => {
    return sequenceId === sequenceIdRef.current;
  }, []);

  const speakWithBrowserFallback = useCallback(
    async (text: string, sequenceId: number): Promise<SpeechOutcome> => {
      if (typeof window === "undefined" || !window.speechSynthesis) {
        return "failed";
      }

      cleanupPlayback();

      return new Promise<SpeechOutcome>((resolve) => {
        const synth = window.speechSynthesis;
        const utterance = new SpeechSynthesisUtterance(text);
        const preferredLang = getPreferredSpeechLang(voiceRef.current);
        const voice = pickBrowserVoice(preferredLang);

        utterance.lang = preferredLang;
        if (voice) {
          utterance.voice = voice;
        }

        let settled = false;

        const finish = (outcome: SpeechOutcome) => {
          if (settled) return;
          settled = true;
          clearActiveWait(interrupt);
          if (audioRef.current) {
            audioRef.current.wordActive = 0;
          }
          resolve(outcome);
        };

        const interrupt = () => {
          synth.cancel();
          finish("interrupted");
        };

        activeWaitRef.current = interrupt;

        utterance.onstart = () => {
          if (!isCurrentSequence(sequenceId)) {
            finish("interrupted");
            return;
          }
          if (audioRef.current) {
            audioRef.current.wordActive = 1;
          }
        };
        utterance.onend = () => finish("completed");
        utterance.onerror = (event) => {
          finish(isPlaybackBlocked(event.error) ? "blocked" : "failed");
        };

        try {
          synth.cancel();
          synth.speak(utterance);
        } catch (error) {
          finish(isPlaybackBlocked(error) ? "blocked" : "failed");
        }
      });
    },
    [cleanupPlayback, clearActiveWait, isCurrentSequence],
  );

  const playEdgeAudio = useCallback(
    async (
      audioBase64: string,
      wordTimings: WordTiming[],
      sequenceId: number,
    ): Promise<SpeechOutcome> => {
      cleanupPlayback();

      return new Promise<SpeechOutcome>((resolve) => {
        const audio = new Audio(`data:audio/mp3;base64,${audioBase64}`);
        audioElRef.current = audio;
        wordTimingsRef.current = wordTimings;

        let settled = false;

        const cleanup = () => {
          if (audioElRef.current === audio) {
            audioElRef.current = null;
          }
          if (animFrameRef.current !== null) {
            cancelAnimationFrame(animFrameRef.current);
            animFrameRef.current = null;
          }
          if (audioRef.current) {
            audioRef.current.wordActive = 0;
          }
          audio.pause();
          audio.src = "";
        };

        const finish = (outcome: SpeechOutcome) => {
          if (settled) return;
          settled = true;
          clearActiveWait(interrupt);
          cleanup();
          resolve(outcome);
        };

        const interrupt = () => finish("interrupted");
        activeWaitRef.current = interrupt;

        const tick = () => {
          if (!audioElRef.current || !isCurrentSequence(sequenceId)) {
            finish("interrupted");
            return;
          }

          const currentTime = audioElRef.current.currentTime;
          const active = wordTimingsRef.current.some(
            (word) =>
              currentTime >= word.startTime && currentTime <= word.endTime,
          );
          if (audioRef.current) {
            audioRef.current.wordActive = active ? 1 : 0;
          }
          animFrameRef.current = requestAnimationFrame(tick);
        };

        audio.onplay = () => {
          if (!isCurrentSequence(sequenceId)) {
            finish("interrupted");
            return;
          }
          animFrameRef.current = requestAnimationFrame(tick);
        };
        audio.onended = () => finish("completed");
        audio.onerror = () => finish("failed");

        audio.play().catch((error) => {
          finish(isPlaybackBlocked(error) ? "blocked" : "failed");
        });
      });
    },
    [cleanupPlayback, clearActiveWait, isCurrentSequence],
  );

  const speakAndAwait = useCallback(
    async (text: string, sequenceId: number): Promise<SpeechOutcome> => {
      cleanupPlayback();

      const result = await generateSpeech(text, voiceRef.current);
      if (!isCurrentSequence(sequenceId)) {
        return "interrupted";
      }

      if (result) {
        const edgeOutcome = await playEdgeAudio(
          result.audioBase64,
          result.wordTimings,
          sequenceId,
        );
        if (edgeOutcome === "completed" || edgeOutcome === "interrupted") {
          return edgeOutcome;
        }
      }

      return speakWithBrowserFallback(text, sequenceId);
    },
    [
      cleanupPlayback,
      isCurrentSequence,
      playEdgeAudio,
      speakWithBrowserFallback,
    ],
  );

  const waitMs = useCallback(
    async (durationMs: number): Promise<WaitOutcome> => {
      return new Promise<WaitOutcome>((resolve) => {
        let settled = false;
        const timeoutId = window.setTimeout(
          () => finish("completed"),
          durationMs,
        );

        const finish = (outcome: WaitOutcome) => {
          if (settled) return;
          settled = true;
          clearActiveWait(interrupt);
          window.clearTimeout(timeoutId);
          resolve(outcome);
        };

        const interrupt = () => finish("interrupted");
        activeWaitRef.current = interrupt;
      });
    },
    [clearActiveWait],
  );

  const runThinkingCountdown = useCallback(
    async (startingSeconds: number): Promise<WaitOutcome> => {
      return new Promise<WaitOutcome>((resolve) => {
        let settled = false;
        let remaining = Math.max(startingSeconds, 0);

        const finish = (outcome: WaitOutcome) => {
          if (settled) return;
          settled = true;
          clearActiveWait(interrupt);
          window.clearInterval(intervalId);
          setState((prev) => ({
            ...prev,
            thinkingCountdown:
              outcome === "completed" ? 0 : prev.thinkingCountdown,
          }));
          resolve(outcome);
        };

        const intervalId = window.setInterval(() => {
          remaining -= 1;
          setState((prev) => ({
            ...prev,
            thinkingCountdown: Math.max(remaining, 0),
          }));
          if (remaining <= 0) {
            finish("completed");
          }
        }, 1000);

        const interrupt = () => finish("interrupted");
        activeWaitRef.current = interrupt;
      });
    },
    [clearActiveWait],
  );

  const handleSpeechFailure = useCallback(
    (outcome: SpeechOutcome, currentText: string): boolean => {
      if (outcome !== "blocked" && outcome !== "failed") {
        return false;
      }

      setState((prev) => ({
        ...prev,
        phase: "idle",
        isPlaying: false,
        currentText,
        error:
          outcome === "blocked"
            ? "Narration was blocked by the browser. Click Start again to resume tutor mode."
            : "Narration failed to start. Please try again.",
      }));
      return true;
    },
    [],
  );

  const runTutorSequence = useCallback(
    async (puzzle: TutorPuzzle, sequenceId: number) => {
      const buildScript = (analysis: TutorAnalysis) => {
        return buildPuzzleScript({
          themes,
          fen: puzzle.fen,
          solutionMoves,
          wrongMove: analysis.wrongMove,
          wrongMoveLoss: analysis.wrongMoveLoss,
          opponentDeviation: analysis.opponentDeviation,
          opponentDeviationResponse: analysis.opponentDeviationResponse,
          rating: puzzle.rating,
          puzzleId: puzzle.id,
        });
      };

      const solutionMoves = puzzle.solutionMoves
        .trim()
        .split(" ")
        .filter(Boolean);
      const themes = puzzle.themes.trim().split(" ").filter(Boolean);
      const analysisPromise = analyzePuzzleForTutor(
        puzzle.fen,
        solutionMoves,
      ).catch(() => EMPTY_ANALYSIS);
      const baseScript = buildScript(EMPTY_ANALYSIS);
      let currentScript = baseScript;

      scriptRef.current = baseScript;

      setPhase("loading", "Let me take a look at this one...", {
        solutionMoves,
        isPlaying: true,
        error: null,
        currentMoveIndex: 0,
        appliedMoveCount: 0,
        awaitingUserMove: false,
        expectedMove: null,
        thinkingCountdown: 0,
      });

      if (!isCurrentSequence(sequenceId)) return;

      // Intro
      setPhase("intro", baseScript.intro, {
        solutionMoves,
        appliedMoveCount: 0,
        awaitingUserMove: false,
        expectedMove: null,
      });
      const introOutcome = await speakAndAwait(baseScript.intro, sequenceId);
      if (!isCurrentSequence(sequenceId)) return;
      if (handleSpeechFailure(introOutcome, baseScript.intro)) return;

      // Opening hint
      for (const hint of baseScript.hints.slice(0, 1)) {
        if (!isCurrentSequence(sequenceId)) return;
        setPhase("hint", hint, {
          appliedMoveCount: 0,
          awaitingUserMove: false,
          expectedMove: solutionMoves[0] ?? null,
        });
        const hintOutcome = await speakAndAwait(hint, sequenceId);
        if (!isCurrentSequence(sequenceId)) return;
        if (handleSpeechFailure(hintOutcome, hint)) return;
      }

      // Walk through each solution move
      for (let i = 0; i < solutionMoves.length; i++) {
        if (!isCurrentSequence(sequenceId)) return;

        const comment =
          currentScript.moveComments[i] ?? currentScript.moveComments[0];
        const isSolverMove = i % 2 === 0;

        if (isSolverMove) {
          const thinkingSeconds = getThinkingSeconds(puzzle.rating);
          const hint =
            currentScript.moveHints[i] ??
            baseScript.moveHints[i] ??
            baseScript.thinkingPrompt;

          pendingMoveRef.current = null;

          setPhase("hint", hint, {
            currentMoveIndex: i,
            appliedMoveCount: i,
            awaitingUserMove: false,
            expectedMove: solutionMoves[i] ?? null,
            thinkingCountdown: thinkingSeconds,
          });
          const hintOutcome = await speakAndAwait(hint, sequenceId);
          if (!isCurrentSequence(sequenceId)) return;
          if (handleSpeechFailure(hintOutcome, hint)) return;

          setPhase("thinking", hint, {
            currentMoveIndex: i,
            appliedMoveCount: i,
            awaitingUserMove: true,
            expectedMove: solutionMoves[i] ?? null,
            thinkingCountdown: thinkingSeconds,
          });

          await runThinkingCountdown(thinkingSeconds);
          if (!isCurrentSequence(sequenceId)) return;

          pendingMoveRef.current = null;
        }

        setPhase("move", comment, {
          currentMoveIndex: i,
          appliedMoveCount: i + 1,
          awaitingUserMove: false,
          expectedMove: null,
          thinkingCountdown: 0,
        });
        const moveOutcome = await speakAndAwait(comment, sequenceId);
        if (!isCurrentSequence(sequenceId)) return;
        if (handleSpeechFailure(moveOutcome, comment)) return;

        if (i === 0) {
          const analysis = await withTimeout(
            analysisPromise,
            OPTIONAL_ANALYSIS_WAIT_MS,
            EMPTY_ANALYSIS,
          );
          if (!isCurrentSequence(sequenceId)) return;
          currentScript = buildScript(analysis);
          scriptRef.current = currentScript;
        }
      }

      // Opponent deviation
      const finalAnalysis = await withTimeout(
        analysisPromise,
        OPTIONAL_ANALYSIS_WAIT_MS,
        EMPTY_ANALYSIS,
      );
      if (!isCurrentSequence(sequenceId)) return;

      currentScript = buildScript(finalAnalysis);
      scriptRef.current = currentScript;

      if (finalAnalysis.opponentDeviation) {
        setPhase("opponent_dev_question", currentScript.opponentDevQuestion);
        const opponentQuestionOutcome = await speakAndAwait(
          currentScript.opponentDevQuestion,
          sequenceId,
        );
        if (!isCurrentSequence(sequenceId)) return;
        if (
          handleSpeechFailure(
            opponentQuestionOutcome,
            currentScript.opponentDevQuestion,
          )
        ) {
          return;
        }

        if (opponentQuestionOutcome !== "interrupted") {
          await waitMs(2500);
          if (!isCurrentSequence(sequenceId)) return;
        }

        setPhase("opponent_dev_answer", currentScript.opponentDevAnswer);
        const opponentAnswerOutcome = await speakAndAwait(
          currentScript.opponentDevAnswer,
          sequenceId,
        );
        if (!isCurrentSequence(sequenceId)) return;
        if (
          handleSpeechFailure(
            opponentAnswerOutcome,
            currentScript.opponentDevAnswer,
          )
        ) {
          return;
        }
      }

      setPhase("conclusion", currentScript.conclusion);
      const conclusionOutcome = await speakAndAwait(
        currentScript.conclusion,
        sequenceId,
      );
      if (!isCurrentSequence(sequenceId)) return;
      if (handleSpeechFailure(conclusionOutcome, currentScript.conclusion)) {
        return;
      }

      setPhase("done", currentScript.conclusion, {
        isPlaying: false,
        appliedMoveCount: solutionMoves.length,
        awaitingUserMove: false,
        expectedMove: null,
        thinkingCountdown: 0,
      });
    },
    [
      handleSpeechFailure,
      isCurrentSequence,
      setPhase,
      speakAndAwait,
      waitMs,
      runThinkingCountdown,
    ],
  );

  const submitMove = useCallback(
    (uci: string) => {
      const expectedMove = state.expectedMove;
      if (
        !state.awaitingUserMove ||
        phaseRef.current !== "thinking" ||
        !expectedMove
      ) {
        return false;
      }

      if (uci !== expectedMove) {
        return false;
      }

      pendingMoveRef.current = uci;
      setState((prev) => ({
        ...prev,
        appliedMoveCount: prev.currentMoveIndex + 1,
        awaitingUserMove: false,
        expectedMove: null,
        thinkingCountdown: 0,
      }));
      interruptActiveWait();
      return true;
    },
    [interruptActiveWait, state.awaitingUserMove, state.expectedMove],
  );

  const startTutor = useCallback(
    (puzzle: TutorPuzzle) => {
      sequenceIdRef.current += 1;
      interruptActiveWait();
      cleanupPlayback();
      pendingMoveRef.current = null;

      const sequenceId = sequenceIdRef.current;
      runTutorSequence(puzzle, sequenceId).catch((err) => {
        if (!isCurrentSequence(sequenceId)) {
          return;
        }
        setState((prev) => ({
          ...prev,
          phase: "idle",
          isPlaying: false,
          error: String(err),
        }));
      });
    },
    [cleanupPlayback, interruptActiveWait, isCurrentSequence, runTutorSequence],
  );

  const stopTutor = useCallback(() => {
    sequenceIdRef.current += 1;
    interruptActiveWait();
    cleanupPlayback();
    pendingMoveRef.current = null;
    setState((prev) => ({
      ...prev,
      phase: "idle",
      isPlaying: false,
      currentText: "",
      error: null,
      currentMoveIndex: 0,
      appliedMoveCount: 0,
      awaitingUserMove: false,
      expectedMove: null,
      thinkingCountdown: 0,
    }));
  }, [cleanupPlayback, interruptActiveWait]);

  const skipPhase = useCallback(() => {
    interruptActiveWait();
  }, [interruptActiveWait]);

  const nextMove = useCallback(() => {
    interruptActiveWait();
  }, [interruptActiveWait]);

  const setVoice = useCallback((voice: string) => {
    voiceRef.current = voice;
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      sequenceIdRef.current += 1;
      interruptActiveWait();
      cleanupPlayback();
    };
  }, [cleanupPlayback, interruptActiveWait]);

  return {
    state,
    audioRef,
    startTutor,
    submitMove,
    skipPhase,
    stopTutor,
    nextMove,
    setVoice,
  };
}
