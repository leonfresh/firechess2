import { createClient, type Client } from "@libsql/client";

let _turso: Client | null = null;

function getTurso(): Client {
  if (!_turso) {
    const url = process.env.TURSO_URL;
    if (!url) throw new Error("TURSO_URL is not set");
    _turso = createClient({ url, authToken: process.env.TURSO_TOKEN });
  }
  return _turso;
}

export const turso = {
  execute: ((
    arg: string | { sql: string; args?: (string | number)[] },
    args?: (string | number)[],
  ) =>
    typeof arg === "string"
      ? getTurso().execute(arg, args)
      : getTurso().execute(arg)) as Client["execute"],
};

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
