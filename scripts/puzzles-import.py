#!/usr/bin/env python3
"""
Import the Lichess puzzles dataset into Neon Postgres.

Replaces the dead Turso-backed `lichess_puzzles` table (Aug 2026 — the Turso
DB/credentials were lost, breaking /puzzles and /tutor's Puzzle Drills with
"Failed to fetch" in production).

Pipeline: stream-decompress puzzles.csv.zst -> sample every Nth row ->
COPY into Neon. Keeps only the columns the app actually uses
(id, fen, moves, rating, themes) to stay lean on Neon's storage.

Usage:
  python scripts/puzzles-import.py --zst C:/path/puzzles.csv.zst [--stride 8] [--max-rows 600000] [--force]
"""
import argparse
import csv
import io
import os
import re
import sys
import zstandard

ENV_PATH = os.path.join(os.path.dirname(__file__), "..", ".env.local")

TABLE_DDL = """
CREATE TABLE IF NOT EXISTS lichess_puzzles (
  rowid bigserial PRIMARY KEY,
  id text NOT NULL UNIQUE,
  fen text NOT NULL,
  moves text NOT NULL,
  rating integer NOT NULL,
  themes text NOT NULL,
  game_url text,
  opening_tags text
);
"""


def load_env():
    """Read KEY=VALUE lines from .env.local (no dotenv dep needed)."""
    env = {}
    if os.path.exists(ENV_PATH):
        with open(ENV_PATH, encoding="utf-8", errors="ignore") as f:
            for line in f:
                line = line.strip()
                if not line or line.startswith("#") or "=" not in line:
                    continue
                k, v = line.split("=", 1)
                env[k.strip()] = v.strip().strip('"').strip("'")
    return env


def sample_rows(zst_path, stride):
    """Yield (id, fen, moves, rating, themes, game_url, opening_tags) for every stride-th puzzle."""
    dctx = zstandard.ZstdDecompressor()
    with open(zst_path, "rb") as fh:
        reader = dctx.stream_reader(fh)
        text = io.TextIOWrapper(reader, encoding="utf-8")
        csv_reader = csv.reader(text)
        header = next(csv_reader, None)
        if not header:
            raise SystemExit("Empty CSV")
        # columns: PuzzleId,FEN,Moves,Rating,RatingDeviation,Popularity,NbPlays,Themes,GameUrl,OpeningTags
        for i, row in enumerate(csv_reader):
            if i % stride != 0:
                continue
            if len(row) < 8:
                continue
            pid, fen, moves, rating, _, _, _, themes = row[:8]
            game_url = row[8] if len(row) > 8 else ""
            opening_tags = row[9] if len(row) > 9 else ""
            try:
                rating_i = int(rating)
            except ValueError:
                continue
            yield (pid, fen, moves, rating_i, themes, game_url, opening_tags)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--zst", required=True, help="Path to puzzles.csv.zst")
    ap.add_argument("--stride", type=int, default=8)
    ap.add_argument("--max-rows", type=int, default=600_000)
    ap.add_argument("--force", action="store_true", help="Drop + recreate table")
    args = ap.parse_args()

    import psycopg2

    env = load_env()
    dsn = env.get("DATABASE_URL_UNPOOLED") or env.get("DATABASE_URL")
    if not dsn:
        raise SystemExit("No DATABASE_URL in .env.local")

    conn = psycopg2.connect(dsn, sslmode="require")
    conn.autocommit = True
    cur = conn.cursor()

    if args.force:
        cur.execute("DROP TABLE IF EXISTS lichess_puzzles")
    cur.execute(TABLE_DDL)
    cur.execute("SELECT count(*) FROM lichess_puzzles")
    existing = cur.fetchone()[0]
    if existing:
        print(f"Table already has {existing} rows — use --force to reimport.")
        return

    buf = io.StringIO()
    inserted = 0
    for pid, fen, moves, rating, themes, game_url, opening_tags in sample_rows(
        args.zst, args.stride
    ):
        # CSV-escape: fields could contain quotes/commas (themes, fen)
        buf.write(
            ",".join(
                csv_escape(v)
                for v in (
                    pid,
                    fen,
                    moves,
                    str(rating),
                    themes,
                    game_url,
                    opening_tags,
                )
            )
            + "\n"
        )
        inserted += 1
        if inserted % 100_000 == 0:
            print(f"  sampled {inserted} rows...")
        if inserted >= args.max_rows:
            break

    buf.seek(0)
    cur.copy_from(
        buf,
        "lichess_puzzles",
        columns=("id", "fen", "moves", "rating", "themes", "game_url", "opening_tags"),
        sep=",",
    )
    cur.execute("SELECT count(*), min(rating), max(rating), round(avg(rating)) FROM lichess_puzzles")
    count, lo, hi, avg = cur.fetchone()
    print(f"Imported {count} puzzles (rating {lo}-{hi}, avg {avg})")
    # Spot-check the random-rowid query shape the API uses
    cur.execute(
        "SELECT id, rating, themes FROM lichess_puzzles WHERE rowid >= %s AND rating BETWEEN 1300 AND 1700 ORDER BY rowid LIMIT 1",
        (1,),
    )
    print("Sample row:", cur.fetchone())
    cur.close()
    conn.close()


def csv_escape(v):
    v = str(v)
    if any(c in v for c in ',"\n'):
        return '"' + v.replace('"', '""') + '"'
    return v


if __name__ == "__main__":
    sys.exit(main())
