"use client";
/**
 * The coach card: a small banner pinned to the top of the screen that explains what to do right now.
 *
 *  - Tutorial ("Learn in 2 minutes"): a practice game vs the Beginner AI whose first power draft comes
 *    after move 2 instead of 5. Five steps, each advanced by the real game (pick an anomaly, move,
 *    draft, use the power, draft again), then an invitation to play online.
 *  - Hints: one line per moment (anomaly pick, first move, first draft) in a player's first couple of
 *    games. They never block anything; × hides the current one.
 *
 * Sits above every game overlay (the Activity's draft backdrop is z-index 10000) and near the top,
 * so it never covers a draft's confirm button on a phone.
 */
import { useEffect, useState } from "react";

const TUTORIAL_KEY = "chaos-tutorial-done";
const GAMES_KEY = "chaos-games-finished";
const HINT_GAMES = 2;

const read = (key: string) => { try { return window.localStorage.getItem(key); } catch { return null; } };
const write = (key: string, value: string) => { try { window.localStorage.setItem(key, value); } catch {} };

export const tutorialDone = () => read(TUTORIAL_KEY) === "1";
export const markTutorialDone = () => write(TUTORIAL_KEY, "1");
export const gamesFinished = () => Number(read(GAMES_KEY)) || 0;
export const countFinishedGame = () => write(GAMES_KEY, String(gamesFinished() + 1));
/** Offer the tutorial in the lobby to newcomers who haven't done it. */
export const offerTutorial = () => !tutorialDone() && gamesFinished() < 5;

/** Tutorial draft schedule: the first power after move 2, then the usual rhythm. */
export const TUTORIAL_PHASE_TRIGGERS = [2, 5, 10, 15, 20];

type Status = "setup" | "waiting" | "matched" | "picking-anomaly" | "playing" | "drafting" | "game-over";

export type ChaosCoachProps = {
  tutorial: boolean;
  status: Status;
  /** Drafts completed by this player so far. */
  drafts: number;
  /** Full-move number of the game. */
  moveNumber: number;
  playerColor: "white" | "black";
  /** Online game where this player's first move is due. */
  firstMoveDue: boolean;
  onPlayOnline: () => void;
  /** The tutorial reached its last step. */
  onComplete?: () => void;
};

type Card = { key: string; step?: string; title: string; body: string; final?: boolean };

function tutorialCard({ status, drafts, moveNumber }: ChaosCoachProps): Card | null {
  if (status === "picking-anomaly") return { key: "t1", step: "1 of 5", title: "Pick an anomaly", body: "An anomaly bends one rule for your side for the whole game. There's no wrong pick while you learn." };
  if (status === "drafting") return drafts === 0
    ? { key: "t3", step: "3 of 5", title: "Draft your first power", body: "Each card gives one of your piece types a new ability for the rest of the game. Read the three and pick one." }
    : { key: "t5", step: "5 of 5", title: "Powers stack", body: "Every 5 moves you draft again, up to 5 powers. The AI drafts too, so watch what its pieces can do." };
  if (status !== "playing") return null;
  if (drafts === 0) return { key: "t2", step: "2 of 5", title: "Play normal chess", body: moveNumber < 2 ? "All the usual rules apply. Make two moves and your first power arrives." : "One more move and you draft your first power." };
  if (drafts === 1) return { key: "t4", step: "4 of 5", title: "Use your power", body: "Pieces with a power wear a badge. Tap one and its new moves light up. Checkmate still wins." };
  return { key: "t6", title: "You've got it", body: "That's Chaos Chess: normal chess plus a new power every 5 moves. Finish this game or find a real opponent.", final: true };
}

function hintCard({ status, drafts, playerColor, firstMoveDue }: ChaosCoachProps): Card | null {
  if (status === "picking-anomaly") return { key: "h1", title: "Pick 1 anomaly", body: "It bends a rule for your side for the whole game." };
  if (status === "playing" && firstMoveDue) return { key: "h2", title: `Game on! You're ${playerColor === "white" ? "White" : "Black"}`, body: "Make your first move. Every 5 moves you'll draft a power." };
  if (status === "drafting" && drafts === 0) return { key: "h3", title: "Pick 1 power", body: "It stays for the rest of the game. Tap a powered piece later to see its new moves." };
  return null;
}

export function ChaosCoach(props: ChaosCoachProps) {
  const [hintsOn, setHintsOn] = useState(false);
  const [hidden, setHidden] = useState<string | null>(null);
  useEffect(() => { setHintsOn(gamesFinished() < HINT_GAMES); }, []);

  const card = props.tutorial ? tutorialCard(props) : hintsOn ? hintCard(props) : null;
  useEffect(() => {
    if (!card?.final) return;
    markTutorialDone();
    props.onComplete?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [card?.final]);
  if (!card || hidden === card.key) return null;

  return (
    <div role="status" aria-live="polite" style={{
      position: "fixed", zIndex: 10050, left: "50%", transform: "translateX(-50%)",
      top: "calc(env(safe-area-inset-top, 0px) + 10px)", width: "min(26rem, calc(100vw - 32px))",
      background: "#1b2036f2", color: "#f8f6ef", border: "1px solid #d4f77a66", borderRadius: 16,
      boxShadow: "0 16px 40px #0008", padding: "12px 40px 12px 14px", backdropFilter: "blur(8px)",
      fontSize: 13, lineHeight: 1.45, textAlign: "left",
    }}>
      {card.step && <div style={{ fontSize: 10, letterSpacing: 1.5, textTransform: "uppercase", color: "#d4f77a", fontWeight: 800 }}>Tutorial · {card.step}</div>}
      <div style={{ fontWeight: 800, fontSize: 15, margin: "2px 0 3px" }}>{card.title}</div>
      <div style={{ color: "#c2c8dc" }}>{card.body}</div>
      {card.final && (
        <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
          <button type="button" onClick={props.onPlayOnline} style={{ background: "#d4f77a", color: "#1b2036", border: 0, borderRadius: 10, padding: "8px 14px", fontWeight: 800, cursor: "pointer" }}>Play online</button>
          <button type="button" onClick={() => setHidden(card.key)} style={{ background: "transparent", color: "#f8f6ef", border: "1px solid #ffffff33", borderRadius: 10, padding: "8px 14px", fontWeight: 700, cursor: "pointer" }}>Finish this game</button>
        </div>
      )}
      <button type="button" aria-label="Hide tip" onClick={() => setHidden(card.key)} style={{
        position: "absolute", top: 6, right: 6, width: 30, height: 30, borderRadius: 8, border: 0,
        background: "transparent", color: "#a8afc7", fontSize: 18, cursor: "pointer",
      }}>×</button>
    </div>
  );
}

/** Lobby call to action for newcomers. */
export function TutorialInvite({ onStart, className }: { onStart: () => void; className?: string }) {
  const [show, setShow] = useState(false);
  useEffect(() => { setShow(offerTutorial()); }, []);
  if (!show) return null;
  return (
    <button type="button" onClick={onStart} className={className} style={{
      display: "flex", alignItems: "center", gap: 12, width: "100%", textAlign: "left", cursor: "pointer",
      background: "#d4f77a14", border: "1px solid #d4f77a55", borderRadius: 14, padding: "11px 14px", color: "#f8f6ef",
    }}>
      <span aria-hidden="true" style={{ fontSize: 22 }}>🎓</span>
      <span style={{ flex: 1 }}>
        <strong style={{ display: "block", fontSize: 14 }}>New to Chaos? Learn in 2 minutes</strong>
        <span style={{ fontSize: 12, color: "#c2c8dc" }}>A guided game vs the Beginner AI. Your first power comes fast.</span>
      </span>
      <span aria-hidden="true" style={{ color: "#d4f77a", fontWeight: 800 }}>→</span>
    </button>
  );
}
