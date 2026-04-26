import { createClient } from "@libsql/client";

export const turso = createClient({
  url: process.env.TURSO_URL!,
  authToken: process.env.TURSO_TOKEN,
});

export interface LichessPuzzle {
  id: string;
  fen: string;
  moves: string;
  rating: number;
  rating_dev: number;
  popularity: number;
  nb_plays: number;
  themes: string;
  game_url: string;
  opening_tags: string;
}
