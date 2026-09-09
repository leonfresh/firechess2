'use client';
import { createContext, useContext, type ComponentType, type ReactNode } from 'react';
import type { AnomalyDefinition } from '@/lib/chaos-anomalies';
import type { ChaosModifier } from '@/lib/chaos-chess';

export type ChaosLobbyViewProps = {
  startPractice: (side: 'white' | 'black') => void;
  createRoom: (side: 'white' | 'black') => Promise<void>;
  joinRoom: () => Promise<void>;
  joinOpenRoom: (code: string) => Promise<void>;
  matchmaking: ReactNode;
  joinCode: string;
  setJoinCode: (value: string) => void;
  difficulty: string;
  setDifficulty: (value: 'beginner' | 'easy' | 'medium' | 'hard') => void;
  unlimited: boolean;
  setUnlimited: (value: boolean) => void;
  clockLabel: string;
  setClockLabel: (value: string) => void;
  error?: string;
};
export type ChaosDraftViewProps = {
  phase: number;
  choices: ChaosModifier[];
  ready: boolean;
  revealedCards: Set<number>;
  picked: boolean;
  countdown: number | null;
  unlockedIds?: Set<string>;
  onPick: (mod: ChaosModifier, locked: boolean) => void;
  onReroll?: (mod: ChaosModifier) => void;
};
export type ChaosHudProps = {
  yours: ChaosModifier[];
  theirs: ChaosModifier[];
  turn: number;
  nextDraft: number | null;
  moves: string[];
  events: string[];
  anomalies: { name: string; description: string }[];
};
export type ChaosOpponentRevealProps = {
  mod: ChaosModifier;
  phase: number;
  revealed: boolean;
  onDismiss: () => void;
};
export type ChaosResultProps = {
  outcome: 'win' | 'loss' | 'draw' | 'aborted';
  reason: string;
  practice: boolean;
  turns: number;
  powers: ChaosModifier[];
  rematchRequested: boolean;
  rematchReceived: boolean;
  onRematch: () => void;
  onLobby: () => void;
};
export const ChaosPresentation = createContext<{
  activity?: boolean;
  Result?: ComponentType<ChaosResultProps>;
  Lobby?: ComponentType<ChaosLobbyViewProps>;
  Draft?: ComponentType<ChaosDraftViewProps>;
  Hud?: ComponentType<ChaosHudProps>;
  PowerArt?: ComponentType<{ id: string; piece?: string }>;
  OpponentReveal?: ComponentType<ChaosOpponentRevealProps>;
  AnomalyPicker?: ComponentType<{ choices: AnomalyDefinition[]; revealed: boolean[]; selected: AnomalyDefinition | null; onSelect: (value: AnomalyDefinition) => void; onPick: (value: AnomalyDefinition) => void; onSkip: () => void; waiting: boolean; countdown: number | null }>;
}>({});
export const useChaosPresentation = () => useContext(ChaosPresentation);
