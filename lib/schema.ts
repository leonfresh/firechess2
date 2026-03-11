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
  unique,
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
    .$type<"openings" | "tactics" | "endgames" | "time-management" | "both">()
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
  oneOffMistakes: jsonb("oneOffMistakes").default([]),
  missedTactics: jsonb("missedTactics").default([]),
  diagnostics: jsonb("diagnostics"),
  mentalStats: jsonb("mentalStats"),
  timeManagement: jsonb("timeManagement"),

  /* composite leaderboard score (0–1000, higher is better) */
  firechessScore: real("firechessScore"),
  playerRating: integer("playerRating"),

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

/* ------------------------------------------------------------------ */
/*  Daily login streak (server-authoritative)                           */
/* ------------------------------------------------------------------ */

export const dailyLogins = pgTable("daily_login", {
  userId: text("userId")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  /** Current streak day 1-7 */
  currentDay: integer("currentDay").notNull().default(0),
  /** ISO date of last claim (YYYY-MM-DD) */
  lastClaimDate: text("lastClaimDate").notNull().default(""),
  /** Total days ever claimed */
  totalDaysLogged: integer("totalDaysLogged").notNull().default(0),
  /** Full 7-day cycles completed */
  cyclesCompleted: integer("cyclesCompleted").notNull().default(0),
  updatedAt: timestamp("updatedAt", { mode: "date" }).defaultNow(),
});

/* ------------------------------------------------------------------ */
/*  Custom: coin economy (server-authoritative)                         */
/* ------------------------------------------------------------------ */

export const userCoins = pgTable("user_coins", {
  userId: text("userId")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  balance: integer("balance").notNull().default(0),
  updatedAt: timestamp("updatedAt", { mode: "date" }).defaultNow(),
});

export const coinPurchases = pgTable("coin_purchase", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  itemId: text("itemId").notNull(),
  amount: integer("amount").notNull(),
  purchasedAt: timestamp("purchasedAt", { mode: "date" }).defaultNow(),
});

/* ------------------------------------------------------------------ */
/*  Roast the Elo – score tracking                                     */
/* ------------------------------------------------------------------ */

export const roastScores = pgTable("roast_score", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  score: integer("score").notNull().default(0),
  gamesPlayed: integer("gamesPlayed").notNull().default(0),
  streakCount: integer("streakCount").notNull().default(0),
  quizScore: integer("quizScore").notNull().default(0),
  createdAt: timestamp("createdAt", { mode: "date" }).defaultNow(),
});

/* ------------------------------------------------------------------ */
/*  Roast the Elo – Daily Challenge live reactions (ghost emojis)       */
/* ------------------------------------------------------------------ */

export const roastDailyReactions = pgTable("roast_daily_reaction", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  /** Date string YYYY-MM-DD — all players on the same day share reactions */
  date: text("date").notNull(),
  /** Which move index (0-based) triggered this reaction */
  moveIdx: integer("moveIdx").notNull(),
  /** The emoji/mood key reacted with (e.g. "lmao", "shocked", "clapping") */
  emoji: text("emoji").notNull(),
  /** Optional display name (from session or "Anonymous") */
  displayName: text("displayName").default("Anonymous"),
  /** Optional user ID if authenticated */
  userId: text("userId"),
  createdAt: timestamp("createdAt", { mode: "date" }).defaultNow(),
});

/* ------------------------------------------------------------------ */
/*  Chaos Chess multiplayer rooms                                       */
/* ------------------------------------------------------------------ */

export const chaosRooms = pgTable("chaos_room", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  /** Short 6-char code for inviting friends */
  roomCode: text("roomCode").notNull().unique(),
  /** Host user ID (or guest_<uuid> for unauthenticated players) */
  hostId: text("hostId").notNull(),
  /** Guest user ID (null until someone joins; may be guest_<uuid>) */
  guestId: text("guestId"),
  /** Host's chosen color */
  hostColor: text("hostColor").notNull().default("white"),
  /** Current FEN */
  fen: text("fen").notNull().default("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"),
  /** Full chaos state as JSON */
  chaosState: jsonb("chaosState"),
  /** Move history: array of { from, to, promotion?, chaosMove? } */
  moveHistory: jsonb("moveHistory").default([]),
  /** Game status */
  status: text("status").notNull().default("waiting"),
  /** Last move from/to for highlighting */
  lastMoveFrom: text("lastMoveFrom"),
  lastMoveTo: text("lastMoveTo"),
  /** AI difficulty (used when looking for matchmaking) */
  difficulty: text("difficulty").default("medium"),
  /** Whether this room is open for matchmaking */
  isMatchmaking: boolean("isMatchmaking").default(false),
  /** Time control: base seconds per player (null = unlimited) */
  timeControlSeconds: integer("timeControlSeconds"),
  /** Increment: seconds added after each move */
  incrementSeconds: integer("incrementSeconds").default(0),
  /** Current remaining time per player in ms (synced on each move) */
  timerWhiteMs: integer("timerWhiteMs"),
  timerBlackMs: integer("timerBlackMs"),
  /** Captured pawns count per side (for undead army) */
  capturedPawnsWhite: integer("capturedPawnsWhite").default(0),
  capturedPawnsBlack: integer("capturedPawnsBlack").default(0),
  /** Timestamp tracking */
  createdAt: timestamp("createdAt", { mode: "date" }).defaultNow(),
  updatedAt: timestamp("updatedAt", { mode: "date" }).defaultNow(),
});

/* ------------------------------------------------------------------ */
/*  Chaos Chess lobby — online presence & chat                          */
/* ------------------------------------------------------------------ */

export const chaosPresence = pgTable("chaos_presence", {
  userId: text("userId")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  userName: text("userName").notNull().default("Anonymous"),
  userImage: text("userImage"),
  /** Timestamp of last heartbeat — stale after ~30s */
  lastSeen: timestamp("lastSeen", { mode: "date" }).notNull().defaultNow(),
});

export const chaosLobbyMessages = pgTable("chaos_lobby_message", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  userName: text("userName").notNull().default("Anonymous"),
  userImage: text("userImage"),
  message: text("message").notNull(),
  createdAt: timestamp("createdAt", { mode: "date" }).notNull().defaultNow(),
});

/* ------------------------------------------------------------------ */
/*  Affiliate system                                                    */
/* ------------------------------------------------------------------ */

/**
 * One row per affiliate (YouTuber / streamer / creator).
 * stripePromoCodeId — the ID of the Stripe Promotion Code object (not its code string).
 * stripePromoCode   — the human-readable code, e.g. "GOTHAM".
 * commissionPct     — integer, e.g. 20 = 20% of each sale.
 */
export const affiliates = pgTable("affiliate", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  /** Creator's display name, e.g. "GothamChess" */
  name: text("name").notNull(),
  /** Their contact/payment email */
  email: text("email"),
  /** Stripe Promotion Code ID (promo_XXXX) — used to match webhook events */
  stripePromoCodeId: text("stripePromoCodeId"),
  /** The code string users type, e.g. "GOTHAM" — for display only */
  stripePromoCode: text("stripePromoCode"),
  /** Commission percentage, e.g. 20 */
  commissionPct: integer("commissionPct").notNull().default(20),
  /** Optional admin notes */
  notes: text("notes"),
  /** Whether the affiliate is still active */
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("createdAt", { mode: "date" }).defaultNow(),
});

/**
 * One row per successful sale that used an affiliate code.
 */
export const affiliateReferrals = pgTable("affiliate_referral", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  affiliateId: text("affiliateId")
    .notNull()
    .references(() => affiliates.id, { onDelete: "cascade" }),
  /** FireChess user who bought */
  userId: text("userId").references(() => users.id, { onDelete: "set null" }),
  /** Stripe Checkout Session ID for audit trail */
  stripeSessionId: text("stripeSessionId"),
  /** "pro" (monthly) or "lifetime" */
  planType: text("planType").$type<"pro" | "lifetime">().notNull().default("pro"),
  /** Amount paid in cents after discount, e.g. 900 = $9.00 */
  amountCents: integer("amountCents").notNull().default(0),
  /** Commission owed in cents */
  commissionCents: integer("commissionCents").notNull().default(0),
  /** Whether this commission has been paid out */
  paid: boolean("paid").notNull().default(false),
  paidAt: timestamp("paidAt", { mode: "date" }),
  createdAt: timestamp("createdAt", { mode: "date" }).defaultNow(),
});

/* ------------------------------------------------------------------ */
/*  Gift Links (Pro access gifting system)                             */
/* ------------------------------------------------------------------ */

/**
 * One row per gift link. Each link can be used up to maxUses times.
 * durationDays — how many days of Pro the recipient gets (null = permanent).
 */
export const giftLinks = pgTable("gift_link", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  /** Short human-readable label for admin reference, e.g. "YouTube Outreach March" */
  label: text("label").notNull(),
  /** URL-safe random token, e.g. "ab12cd34ef56" */
  token: text("token").notNull().unique(),
  /** Maximum number of times this link can be redeemed */
  maxUses: integer("maxUses").notNull().default(50),
  /** How many times it has been redeemed so far */
  usedCount: integer("usedCount").notNull().default(0),
  /** Plan type granted on redemption */
  planType: text("planType").$type<"pro" | "lifetime">().notNull().default("pro"),
  /** Days of Pro access granted (null = permanent) */
  durationDays: integer("durationDays"),
  /** Optional hard expiry — link stops working after this date */
  expiresAt: timestamp("expiresAt", { mode: "date" }),
  /** Set to a timestamp to manually revoke the link */
  revokedAt: timestamp("revokedAt", { mode: "date" }),
  createdAt: timestamp("createdAt", { mode: "date" }).defaultNow(),
});

/**
 * One row per redemption — tracks who claimed which link.
 * Unique constraint prevents double-claiming the same link per user.
 */
export const giftRedemptions = pgTable(
  "gift_redemption",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    giftLinkId: text("giftLinkId")
      .notNull()
      .references(() => giftLinks.id, { onDelete: "cascade" }),
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    redeemedAt: timestamp("redeemedAt", { mode: "date" }).defaultNow(),
  },
  (t) => [unique().on(t.giftLinkId, t.userId)],
);

/* ------------------------------------------------------------------ */
/*  Chaos Chess — player ELO ratings                                   */
/* ------------------------------------------------------------------ */

export const chaosRatings = pgTable("chaos_rating", {
  userId: text("userId")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  /** Current ELO rating (default 1200) */
  rating: integer("rating").notNull().default(1200),
  wins: integer("wins").notNull().default(0),
  losses: integer("losses").notNull().default(0),
  draws: integer("draws").notNull().default(0),
  gamesPlayed: integer("gamesPlayed").notNull().default(0),
  /** Highest rating ever achieved */
  peakRating: integer("peakRating").notNull().default(1200),
  updatedAt: timestamp("updatedAt", { mode: "date" }).defaultNow(),
});
