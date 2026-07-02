import type { MoveClassification } from "./move-quality";

export type RatingBand = "800" | "1200" | "1600" | "2000";

export type TextSlide = {
  kind: "text";
  heading: string;
  body: string;
  insight?: string;
  fen?: string;
  orientation?: "white" | "black";
  highlights?: string[];
  arrows?: [string, string][];
  photo?: { src: string; credit: string };
};

export type InteractSlide = {
  kind: "interact";
  heading: string;
  instruction: string;
  fen?: string;
  orientation?: "white" | "black";
  correctMoves?: string[];
  wrongMoves?: string[];
  fetchTheme?: string;
  correctExplanation: string;
  wrongExplanation: string;
  badge?: MoveClassification;
};

export type ChoiceSlide = {
  kind: "choice";
  heading: string;
  question: string;
  choices: string[];
  correctIndex: number;
  explanation: string;
  fen?: string;
  orientation?: "white" | "black";
  highlights?: string[];
  arrows?: [string, string][];
};

export type ReplaySlide = {
  kind: "replay";
  heading: string;
  body: string;
  startFen?: string;
  moves: string[];
  orientation?: "white" | "black";
  intervalMs?: number;
  badges?: Record<number, { sq: string; cls: MoveClassification }>;
};

export type Slide = TextSlide | InteractSlide | ChoiceSlide | ReplaySlide;

export type Lesson = {
  id: string;
  band: RatingBand;
  title: string;
  subtitle: string;
  icon: string;
  estimatedMinutes: number;
  tags: string[];
  slides: Slide[];
};
