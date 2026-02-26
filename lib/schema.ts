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
  plan: text("plan").$type<"free" | "pro" | "lifetime">().notNull().default("free"),
  status: text("status")
    .$type<"active" | "canceled" | "past_due" | "incomplete" | "trialing">()
    .notNull()
    .default("active"),
  currentPeriodEnd: timestamp("currentPeriodEnd", { mode: "date" }),
  createdAt: timestamp("createdAt", { mode: "date" }).defaultNow(),
  updatedAt: timestamp("updatedAt", { mode: "date" }).defaultNow(),
  weeklyDigest: boolean("weeklyDigest").notNull().default(true),
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
  mentalStats: jsonb("mentalStats"),

  /* dedup: SHA-256 of (userId + chessUsername + source + scanMode + sorted game IDs summary) */
  contentHash: text("contentHash"),

  createdAt: timestamp("createdAt", { mode: "date" }).defaultNow(),
});

/* ------------------------------------------------------------------ */
/*  Custom: user feedback / support                                     */
/* ------------------------------------------------------------------ */

export const feedback = pgTable("feedback", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text("userId").references(() => users.id, { onDelete: "set null" }),
  email: text("email"),
  subject: text("subject"),
  category: text("category")
    .$type<"bug" | "feature" | "question" | "other">()
    .notNull()
    .default("other"),
  message: text("message").notNull(),
  status: text("status")
    .$type<"new" | "read" | "resolved">()
    .notNull()
    .default("new"),
  createdAt: timestamp("createdAt", { mode: "date" }).defaultNow(),
});

/* ------------------------------------------------------------------ */
/*  Custom: ticket replies (threaded support conversations)             */
/* ------------------------------------------------------------------ */

export const ticketReplies = pgTable("ticket_reply", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  feedbackId: text("feedbackId")
    .notNull()
    .references(() => feedback.id, { onDelete: "cascade" }),
  userId: text("userId").references(() => users.id, { onDelete: "set null" }),
  isAdmin: boolean("isAdmin").notNull().default(false),
  message: text("message").notNull(),
  emailSent: boolean("emailSent").notNull().default(false),
  createdAt: timestamp("createdAt", { mode: "date" }).defaultNow(),
});

/* ------------------------------------------------------------------ */
/*  Custom: study plans & tasks (retention / improvement tracking)      */
/* ------------------------------------------------------------------ */

export const studyPlans = pgTable("study_plan", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  reportId: text("reportId").references(() => reports.id, { onDelete: "set null" }),

  /** Chess username + source this plan is for */
  chessUsername: text("chessUsername"),
  source: text("source").$type<"lichess" | "chesscom">(),

  /** Human-readable title, e.g. "Week of Feb 27 — Fix Italian Game leaks" */
  title: text("title").notNull(),

  /** Snapshot of weaknesses used to generate this plan */
  weaknesses: jsonb("weaknesses").$type<{
    accuracy?: number;
    leakCount?: number;
    tacticsPerGame?: number;
    severeLeakRate?: number;
    topLeakOpenings?: string[];
  }>(),

  /** Overall progress 0–100 derived from tasks */
  progress: integer("progress").notNull().default(0),

  /** Daily streak tracking */
  currentStreak: integer("currentStreak").notNull().default(0),
  longestStreak: integer("longestStreak").notNull().default(0),
  lastActivityDate: text("lastActivityDate"),

  active: boolean("active").notNull().default(true),
  createdAt: timestamp("createdAt", { mode: "date" }).defaultNow(),
  updatedAt: timestamp("updatedAt", { mode: "date" }).defaultNow(),
});

export const studyTasks = pgTable("study_task", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  planId: text("planId")
    .notNull()
    .references(() => studyPlans.id, { onDelete: "cascade" }),

  /** Category: opening, tactic, endgame, habit, puzzle */
  category: text("category")
    .$type<"opening" | "tactic" | "endgame" | "habit" | "puzzle" | "review">()
    .notNull(),

  /** Short title, e.g. "Drill Italian Game leaks" */
  title: text("title").notNull(),

  /** Longer description with specific instructions */
  description: text("description").notNull(),

  /** Priority 1 (highest) – 5 (lowest) */
  priority: integer("priority").notNull().default(3),

  /** Whether this repeats daily vs one-time */
  recurring: boolean("recurring").notNull().default(false),

  /** Day index within the plan (1-7 for weekly plans) */
  dayIndex: integer("dayIndex"),

  /** Completion tracking */
  completed: boolean("completed").notNull().default(false),
  completedAt: timestamp("completedAt", { mode: "date" }),

  /** Optional link (e.g. lichess puzzle URL, drill link) */
  link: text("link"),

  /** Icon emoji */
  icon: text("icon").notNull().default("📝"),

  createdAt: timestamp("createdAt", { mode: "date" }).defaultNow(),
});
