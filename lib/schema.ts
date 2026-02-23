/**
 * Drizzle ORM schema — Auth.js tables + custom subscription table.
 *
 * Based on the Auth.js Drizzle adapter schema for PostgreSQL:
 * https://authjs.dev/getting-started/adapters/drizzle
 */

import {
  boolean,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  real,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import type { AdapterAccountType } from "next-auth/adapters";

/* ------------------------------------------------------------------ */
/*  Auth.js core tables                                                */
/* ------------------------------------------------------------------ */

export const users = pgTable("user", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name"),
  email: text("email").unique(),
  emailVerified: timestamp("emailVerified", { mode: "date" }),
  image: text("image"),
});

export const accounts = pgTable(
  "account",
  {
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").$type<AdapterAccountType>().notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("providerAccountId").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (account) => [
    primaryKey({
      columns: [account.provider, account.providerAccountId],
    }),
  ],
);

export const sessions = pgTable("session", {
  sessionToken: text("sessionToken").primaryKey(),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { mode: "date" }).notNull(),
});

export const verificationTokens = pgTable(
  "verificationToken",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires", { mode: "date" }).notNull(),
  },
  (verificationToken) => [
    primaryKey({
      columns: [verificationToken.identifier, verificationToken.token],
    }),
  ],
);

/* ------------------------------------------------------------------ */
/*  Custom: subscriptions                                               */
/* ------------------------------------------------------------------ */

export const subscriptions = pgTable("subscription", {
  userId: text("userId")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  stripeCustomerId: text("stripeCustomerId"),
  stripeSubscriptionId: text("stripeSubscriptionId"),
  plan: text("plan").$type<"free" | "pro">().notNull().default("free"),
  status: text("status")
    .$type<"active" | "canceled" | "past_due" | "incomplete" | "trialing">()
    .notNull()
    .default("active"),
  currentPeriodEnd: timestamp("currentPeriodEnd", { mode: "date" }),
  createdAt: timestamp("createdAt", { mode: "date" }).defaultNow(),
  updatedAt: timestamp("updatedAt", { mode: "date" }).defaultNow(),
});

/* ------------------------------------------------------------------ */
/*  Custom: saved analysis reports                                      */
/* ------------------------------------------------------------------ */

export const reports = pgTable("report", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),

  /* identifiers */
  chessUsername: text("chessUsername").notNull(),
  source: text("source").$type<"lichess" | "chesscom">().notNull(),
  scanMode: text("scanMode")
    .$type<"openings" | "tactics" | "both">()
    .notNull()
    .default("both"),

  /* config snapshot */
  gamesAnalyzed: integer("gamesAnalyzed").notNull().default(0),
  maxGames: integer("maxGames"),
  maxMoves: integer("maxMoves"),
  cpThreshold: integer("cpThreshold"),
  engineDepth: integer("engineDepth"),

  /* summary metrics – stored denormalized for fast dashboard queries */
  estimatedAccuracy: real("estimatedAccuracy"),
  estimatedRating: real("estimatedRating"),
  weightedCpLoss: real("weightedCpLoss"),
  severeLeakRate: real("severeLeakRate"),
  repeatedPositions: integer("repeatedPositions").default(0),
  leakCount: integer("leakCount").default(0),
  tacticsCount: integer("tacticsCount").default(0),

  /* computed report card data */
  reportMeta: jsonb("reportMeta"),

  /* full payloads (for re-rendering report detail) */
  leaks: jsonb("leaks").default([]),
  missedTactics: jsonb("missedTactics").default([]),
  diagnostics: jsonb("diagnostics"),

  /* dedup: SHA-256 of (userId + chessUsername + source + scanMode + sorted game IDs summary) */
  contentHash: text("contentHash"),

  createdAt: timestamp("createdAt", { mode: "date" }).defaultNow(),
});
