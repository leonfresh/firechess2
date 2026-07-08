/**
 * Drizzle ORM schema — Auth.js tables + custom subscription table.
 *
 * Based on the Auth.js Drizzle adapter schema for PostgreSQL:
 * https://authjs.dev/getting-started/adapters/drizzle
 */

import {
  bigint,
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
import type { AnalyzeResponse } from "./types";
import type { ComputedScanReport, ScanSessionConfig } from "./scan-session";

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
  /** Custom iPad launcher layout — stored as { grid: string[], dock: string[] } */
  launcherConfig: jsonb("launcher_config"),
  /** Optional Chaos Chess display name (unique, 3–20 chars) */
  chaosUsername: text("chaos_username").unique(),
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
  plan: text("plan")
    .$type<"free" | "pro" | "lifetime">()
    .notNull()
    .default("free"),
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
  source: text("source").$type<"lichess" | "chesscom" | "pgn">().notNull(),
  scanMode: text("scanMode")
    .$type<"openings" | "tactics" | "endgames" | "time-management" | "both">()
    .notNull()
    .default("both"),

  /* config snapshot */
  gamesAnalyzed: integer("gamesAnalyzed").notNull().default(0),
  /** When the analyzed games were actually played (epoch ms). Lets the
   *  dashboard plot progress by game date rather than the report save date,
   *  so historical-range scans don't fake a recent rating drop. */
  gamesStartDate: bigint("gamesStartDate", { mode: "number" }),
  gamesEndDate: bigint("gamesEndDate", { mode: "number" }),
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

export const scanSessions = pgTable("scan_session", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text("userId").references(() => users.id, { onDelete: "set null" }),
  guestToken: text("guestToken"),
  chessUsername: text("chessUsername").notNull(),
  source: text("source").$type<"lichess" | "chesscom" | "pgn">().notNull(),
  scanMode: text("scanMode")
    .$type<"openings" | "tactics" | "endgames" | "time-management" | "both">()
    .notNull()
    .default("both"),
  status: text("status")
    .$type<"processing" | "ready" | "failed">()
    .notNull()
    .default("processing"),
  config: jsonb("config").$type<ScanSessionConfig>().notNull(),
  result: jsonb("result").$type<AnalyzeResponse | null>(),
  reportMeta: jsonb("reportMeta").$type<ComputedScanReport | null>(),
  error: text("error"),
  savedReportId: text("savedReportId").references(() => reports.id, {
    onDelete: "set null",
  }),
  expiresAt: timestamp("expiresAt", { mode: "date" }),
  createdAt: timestamp("createdAt", { mode: "date" }).defaultNow(),
  updatedAt: timestamp("updatedAt", { mode: "date" }).defaultNow(),
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
  guestToken: text("guestToken"),
  lastAdminReplyAt: timestamp("lastAdminReplyAt", { mode: "date" }),
  userLastViewedAt: timestamp("userLastViewedAt", { mode: "date" }),
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
  reportId: text("reportId").references(() => reports.id, {
    onDelete: "set null",
  }),

  /** Chess username + source this plan is for */
  chessUsername: text("chessUsername"),
  source: text("source").$type<"lichess" | "chesscom" | "pgn">(),

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
  fen: text("fen")
    .notNull()
    .default("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"),
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
  /** URL-safe slug for ?ref= link tracking, e.g. "zerochess" */
  refSlug: text("refSlug"),
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
  planType: text("planType")
    .$type<"pro" | "lifetime">()
    .notNull()
    .default("pro"),
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
  planType: text("planType")
    .$type<"pro" | "lifetime">()
    .notNull()
    .default("pro"),
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

/* ------------------------------------------------------------------ */
/*  Chaos Chess — modifier collection (unlocks per user)               */
/* ------------------------------------------------------------------ */

export const chaosUnlocks = pgTable(
  "chaos_unlock",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    modifierId: text("modifierId").notNull(),
    unlockedAt: timestamp("unlockedAt", { mode: "date" }).defaultNow(),
  },
  (t) => [unique().on(t.userId, t.modifierId)],
);

/* ------------------------------------------------------------------ */
/*  Site-wide configuration (key-value store for admin settings)        */
/* ------------------------------------------------------------------ */

export const siteConfig = pgTable("site_config", {
  key: text("key").primaryKey(),
  value: jsonb("value").notNull(),
  updatedAt: timestamp("updatedAt", { mode: "date" }).defaultNow(),
});

// ── Recruit Chess ─────────────────────────────────────────────────────────

/** One completed (or abandoned) Recruit Chess run per player */
export const recruitGames = pgTable("recruit_game", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text("userId").references(() => users.id, { onDelete: "set null" }),
  guestToken: text("guestToken"),
  commander: text("commander").notNull(),
  /** Full army snapshot — array of {pieceType, modifierId, tier} */
  armySnapshot: jsonb("armySnapshot"),
  roundsCompleted: integer("roundsCompleted").notNull().default(0),
  won: boolean("won").notNull().default(false),
  finalHp: integer("finalHp").notNull().default(0),
  rating: integer("rating"),
  createdAt: timestamp("createdAt", { mode: "date" }).defaultNow(),
});

/**
 * Pool of ghost builds used as opponents in Recruit Chess.
 * Populated by real players' losing/winning builds and pre-seeded AI builds.
 */
export const recruitGhostBuilds = pgTable("recruit_ghost_build", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text("userId"),
  guestToken: text("guestToken"),
  displayName: text("displayName").notNull().default("Ghost Player"),
  commander: text("commander").notNull(),
  /** Array of {pieceType, modifierId, tier} */
  armySnapshot: jsonb("armySnapshot").notNull(),
  round: integer("round").notNull(),
  rating: integer("rating").notNull().default(1000),
  isAI: boolean("isAI").notNull().default(false),
  createdAt: timestamp("createdAt", { mode: "date" }).defaultNow(),
});

/* ------------------------------------------------------------------ */
/*  Ghost Mode — Play Like a Legend                                     */
/* ------------------------------------------------------------------ */

export type GhostCookCandidate = {
  /** 0-based ply index within the full game */
  ply: number;
  /** The move the master actually played (UCI) */
  masterUci: string;
  /** Centipawn eval of the master's move (from side-to-move perspective) */
  masterEval: number;
  /** Best move found by Lichess cloud engine (UCI) */
  stockfishBestUci: string;
  /** Centipawn eval of the best move (from side-to-move perspective) */
  stockfishEval: number;
};

export type GhostGameMove = {
  /** 0-based ply index */
  ply: number;
  san: string;
  uci: string;
  /** FEN *after* this move */
  fenAfter: string;
};

/** One legendary game that players can simulate */
export const ghostGames = pgTable("ghost_game", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  whiteName: text("whiteName").notNull(),
  blackName: text("blackName").notNull(),
  whiteElo: integer("whiteElo"),
  blackElo: integer("blackElo"),
  tournament: text("tournament").notNull(),
  eventDate: text("eventDate").notNull(),
  result: text("result").notNull(),
  eco: text("eco"),
  openingName: text("openingName"),
  /** Full PGN move text (space-separated SAN moves, no move numbers) */
  pgnMoves: text("pgnMoves").notNull(),
  /** Pre-computed move array [{ply, san, uci, fenAfter}] */
  moves: jsonb("moves").$type<GhostGameMove[]>().notNull().default([]),
  /** "white" | "black" — which side the user plays */
  playAs: text("playAs").$type<"white" | "black">().notNull(),
  /** 0-based ply where time-lapse stops and user begins */
  startPly: integer("startPly").notNull(),
  /** 0-based ply where the sequence ends (inclusive) */
  endPly: integer("endPly").notNull(),
  /** Mission narrative shown before play */
  missionTitle: text("missionTitle").notNull(),
  missionContext: text("missionContext").notNull(),
  missionObjective: text("missionObjective").notNull(),
  difficulty: text("difficulty")
    .$type<"beginner" | "intermediate" | "expert">()
    .notNull()
    .default("intermediate"),
  tags: jsonb("tags").$type<string[]>().notNull().default([]),
  featured: boolean("featured").notNull().default(false),
  /** Pre-computed cook candidates from Lichess cloud eval */
  cookCandidates: jsonb("cookCandidates")
    .$type<GhostCookCandidate[]>()
    .notNull()
    .default([]),
  /** Optional link to the original game (e.g. chessgames.com) */
  sourceUrl: text("sourceUrl"),
  createdAt: timestamp("createdAt", { mode: "date" }).defaultNow(),
});

/** One user attempt at a Ghost Mode session */
export const ghostResults = pgTable("ghost_result", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  gameId: text("gameId")
    .notNull()
    .references(() => ghostGames.id, { onDelete: "cascade" }),
  userId: text("userId").references(() => users.id, { onDelete: "set null" }),
  guestToken: text("guestToken"),
  /** 0–100 sync rate */
  syncRate: real("syncRate").notNull().default(0),
  movesPlayed: integer("movesPlayed").notNull().default(0),
  movesMatched: integer("movesMatched").notNull().default(0),
  cookFound: boolean("cookFound").notNull().default(false),
  cookPly: integer("cookPly"),
  cookUci: text("cookUci"),
  completedAt: timestamp("completedAt", { mode: "date" }).defaultNow(),
});

/* ------------------------------------------------------------------ */
/*  Community posts, comments, and reactions                           */
/* ------------------------------------------------------------------ */

export const communityPosts = pgTable(
  "community_post",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    authorId: text("authorId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    slug: text("slug").notNull(),
    kind: text("kind")
      .$type<"position" | "opening" | "puzzle">()
      .notNull()
      .default("position"),
    sourceType: text("sourceType")
      .$type<
        | "analysis"
        | "manual"
        | "community-thread"
        | "famous-game"
        | "opening-guide"
        | "endgame-scan"
        | "puzzle-source"
      >()
      .notNull()
      .default("manual"),
    title: text("title").notNull(),
    prompt: text("prompt").notNull(),
    description: text("description"),
    fen: text("fen").notNull(),
    pgn: text("pgn"),
    orientation: text("orientation")
      .$type<"white" | "black">()
      .notNull()
      .default("white"),
    openingName: text("openingName"),
    tags: jsonb("tags").$type<string[]>().notNull().default([]),
    collectionKey: text("collectionKey"),
    visibility: text("visibility")
      .$type<"public" | "unlisted">()
      .notNull()
      .default("public"),
    previewMode: text("previewMode")
      .$type<"board" | "gif">()
      .notNull()
      .default("board"),
    likesCount: integer("likesCount").notNull().default(0),
    commentsCount: integer("commentsCount").notNull().default(0),
    savesCount: integer("savesCount").notNull().default(0),
    hotScore: real("hotScore").notNull().default(0),
    createdAt: timestamp("createdAt", { mode: "date" }).defaultNow(),
    updatedAt: timestamp("updatedAt", { mode: "date" }).defaultNow(),
  },
  (t) => [unique().on(t.slug)],
);

export const communityComments = pgTable("community_comment", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  postId: text("postId")
    .notNull()
    .references(() => communityPosts.id, { onDelete: "cascade" }),
  authorId: text("authorId").references(() => users.id, {
    onDelete: "set null",
  }),
  parentId: text("parentId"),
  body: text("body").notNull(),
  createdAt: timestamp("createdAt", { mode: "date" }).defaultNow(),
});

export const communityReactions = pgTable(
  "community_reaction",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    postId: text("postId")
      .notNull()
      .references(() => communityPosts.id, { onDelete: "cascade" }),
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    kind: text("kind").$type<"like" | "save">().notNull().default("like"),
    createdAt: timestamp("createdAt", { mode: "date" }).defaultNow(),
  },
  (t) => [unique().on(t.postId, t.userId, t.kind)],
);

/* ------------------------------------------------------------------ */
/*  Newsletter / lead capture                                          */
/* ------------------------------------------------------------------ */

/**
 * Anonymous homepage email captures for the weekly-digest nurture funnel.
 * Separate from `subscriptions` (which is tied to a registered userId) so we
 * can collect leads before signup. When a subscriber later registers, the
 * weekly-digest cron picks them up from `users`+`subscriptions` instead.
 */
export const newsletterSubscribers = pgTable(
  "newsletter_subscriber",
  {
    email: text("email").primaryKey(),
    /** Where the lead came from — e.g. "homepage", "blog", "exit-intent". */
    source: text("source").notNull().default("homepage"),
    leadMagnet: text("leadMagnet"),
    createdAt: timestamp("createdAt", { mode: "date" }).defaultNow(),
    unsubscribedAt: timestamp("unsubscribedAt", { mode: "date" }),
    /** Optional token used for one-click unsubscribe links. */
    unsubscribeToken: text("unsubscribeToken"),
  },
);
