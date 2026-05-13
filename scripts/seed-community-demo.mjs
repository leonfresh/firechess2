import dotenv from "dotenv";
import { readFileSync } from "node:fs";
import { Client } from "pg";
import { Chess } from "chess.js";

const COMMUNITY_PUZZLE_PGN_HEADER = "FireChessPuzzleData";
const PUZZLE_MAX_PLIES = 6;

dotenv.config({ path: ".env.local" });
dotenv.config();

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not set. Seed aborted.");
}

const client = new Client({
  connectionString,
  connectionTimeoutMillis: 15_000,
  ssl: connectionString.includes("localhost")
    ? false
    : { rejectUnauthorized: false },
});

const DEMO_EMAIL_DOMAIN = "@community.firechess.demo";

function escapeXml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function getAvatarInitials(name, handle) {
  const initials = name
    .split(/\s+/)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("")
    .slice(0, 2);

  if (initials) {
    return initials;
  }

  return handle.slice(0, 2).toUpperCase() || "FC";
}

function createAvatarDataUri(name, handle) {
  const initials = getAvatarInitials(name, handle);
  const hue =
    Array.from(handle).reduce((sum, char) => sum + char.charCodeAt(0), 0) % 360;
  const accentHue = (hue + 28) % 360;
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96" role="img" aria-label="${escapeXml(name)}">
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="hsl(${hue} 72% 54%)" />
          <stop offset="100%" stop-color="hsl(${accentHue} 84% 46%)" />
        </linearGradient>
      </defs>
      <rect width="96" height="96" rx="48" fill="url(#bg)" />
      <circle cx="48" cy="48" r="44" fill="none" stroke="rgba(255,255,255,0.26)" stroke-width="2" />
      <path d="M48 21l8 12h-5v10h-6V33h-5l8-12zm-15 42c0-8.284 6.716-15 15-15s15 6.716 15 15v2H33v-2z" fill="rgba(255,255,255,0.14)" />
      <text x="48" y="58" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="28" font-weight="700" fill="white">${escapeXml(initials)}</text>
    </svg>
  `.trim();

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

const demoUsers = [
  ["demo-community-user-01", "Ari Coleman", "ChessStudent42"],
  ["demo-community-user-02", "Mira Novak", "ThePositionalMind"],
  ["demo-community-user-03", "Leo Hart", "TacticalTrainer"],
  ["demo-community-user-04", "Eva Mercer", "EndgameGeek"],
  ["demo-community-user-05", "Ryan Vale", "QueensideScout"],
  ["demo-community-user-06", "Nora Quinn", "RookLiftRyan"],
  ["demo-community-user-07", "Sami Torres", "SicilianSurvivor"],
  ["demo-community-user-08", "Ben Alder", "BishopsPairBen"],
  ["demo-community-user-09", "Nina Frost", "KnightForkNina"],
  ["demo-community-user-10", "Pete Sloan", "PawnStormPete"],
  ["demo-community-user-11", "Quinn Hale", "QuietMoveQ"],
  ["demo-community-user-12", "Tara Voss", "TempoTara"],
  ["demo-community-user-13", "Lena Park", "LichessLena"],
  ["demo-community-user-14", "Carl Mercer", "CalculationCarl"],
  ["demo-community-user-15", "Sam Ortiz", "StudyBoardSam"],
  ["demo-community-user-16", "Bea Nolan", "BlitzProofBea"],
  ["demo-community-user-17", "Chris Rowan", "CounterplayChris"],
  ["demo-community-user-18", "Finn Lowe", "FileOpenFinn"],
  ["demo-community-user-19", "Flo Marin", "FianchettoFlo"],
  ["demo-community-user-20", "Grace Ivers", "GambitGrace"],
  ["demo-community-user-21", "Vic Rowan", "BoardVisionVic"],
  ["demo-community-user-22", "Maya Brooks", "MiddlegameMaya"],
  ["demo-community-user-23", "Ruben Cole", "RapidRuben"],
  ["demo-community-user-24", "Dani Wells", "DarkSquareDani"],
  ["demo-community-user-25", "Eva Sloan", "EndgameEva"],
  ["demo-community-user-26", "Theo Marsh", "TheoryTheo"],
  ["demo-community-user-27", "Kai Mercer", "CastleLongKai"],
  ["demo-community-user-28", "Casey Dean", "ConversionCasey"],
  ["demo-community-user-29", "Clara Finch", "CFileClara"],
  ["demo-community-user-30", "Pia Rowe", "ProphylaxisPia"],
  ["demo-community-user-31", "Ben Shaw", "BrokenStructureBen"],
  ["demo-community-user-32", "Suri Quinn", "SwissSystemSuri"],
  ["demo-community-user-33", "Jules Mercer", "JulesOnG7"],
  ["demo-community-user-34", "Ivy Stone", "IvySeesTactics"],
  ["demo-community-user-35", "Noah Pike", "NoahKnowsNajdorf"],
  ["demo-community-user-36", "Rhea Cole", "RheaRooksFirst"],
].map(([id, name, handle]) => ({
  id,
  name,
  handle,
  email: `${handle.toLowerCase()}${DEMO_EMAIL_DOMAIN}`,
  image: createAvatarDataUri(name, handle),
}));

function addMinutes(date, minutes) {
  return new Date(date.getTime() + minutes * 60_000);
}

function toMillis(value) {
  return value.getTime();
}

function computeHotScore({ likesCount, commentsCount, savesCount, createdAt }) {
  const ageHours = Math.max(
    1,
    (Date.now() - createdAt.getTime()) / (1000 * 60 * 60),
  );
  const engagement = likesCount * 3 + commentsCount * 5 + savesCount * 4;
  return Number((engagement / Math.pow(ageHours + 2, 1.15)).toFixed(4));
}

function pickDistinctUsers(count, offset, excludeId) {
  const availableUsers = demoUsers.filter((user) => user.id !== excludeId);

  if (count > availableUsers.length) {
    throw new Error(
      `Requested ${count} distinct demo users, but only ${availableUsers.length} are available.`,
    );
  }

  const picked = [];
  let index = offset;

  while (picked.length < count) {
    const user = availableUsers[index % availableUsers.length];
    index += 1;
    if (picked.some((item) => item.id === user.id)) {
      continue;
    }
    picked.push(user);
  }

  return picked;
}

const historicalGames = JSON.parse(
  readFileSync(
    new URL("./data/ghost-games-seed.json", import.meta.url),
    "utf8",
  ),
);

function getHistoricalGame(missionTitle) {
  const game = historicalGames.find(
    (entry) => entry.missionTitle === missionTitle,
  );

  if (!game) {
    throw new Error(`Historical game not found for mission: ${missionTitle}`);
  }

  return game;
}

function tokenizePgnMoves(pgnMoves) {
  return pgnMoves
    .replace(/\{[^}]*\}/g, " ")
    .replace(/\([^)]*\)/g, " ")
    .replace(/\$\d+/g, " ")
    .trim()
    .split(/\s+/)
    .filter(
      (token) =>
        token &&
        !/^\d+\.+$/.test(token) &&
        !/^(1-0|0-1|1\/2-1\/2|\*)$/.test(token),
    )
    .map((token) => token.replace(/[!?]+$/, ""));
}

function fenBeforePly(pgnMoves, ply) {
  const chess = new Chess();
  const moves = tokenizePgnMoves(pgnMoves);

  for (let index = 0; index < ply; index += 1) {
    const san = moves[index];
    const result = chess.move(san);

    if (!result) {
      throw new Error(
        `Invalid SAN '${san}' while building FEN for ply ${ply}.`,
      );
    }
  }

  return chess.fen();
}

function buildMoveHistory(pgnMoves, maxPly = Number.POSITIVE_INFINITY) {
  const chess = new Chess();

  try {
    chess.loadPgn(pgnMoves);
    const history = chess.history({ verbose: true });
    if (history.length > 0) {
      return history.slice(0, maxPly);
    }
  } catch {
    // Fall back to token-by-token SAN parsing for seed lines chess.js rejects as PGN.
  }

  const fallbackChess = new Chess();
  return tokenizePgnMoves(pgnMoves)
    .slice(0, maxPly)
    .map((san, plyIndex) => {
      const move = fallbackChess.move(san);

      if (!move) {
        throw new Error(
          `Invalid SAN '${san}' while building move history at ply ${plyIndex}.`,
        );
      }

      return move;
    });
}

function formatPgnFromHistory(history, plyCount) {
  const clipped = history.slice(0, Math.max(0, plyCount));

  if (clipped.length === 0) {
    return null;
  }

  const chunks = [];
  for (let index = 0; index < clipped.length; index += 2) {
    const whiteMove = clipped[index];
    const blackMove = clipped[index + 1];
    chunks.push(
      `${Math.floor(index / 2) + 1}. ${whiteMove.san}${blackMove ? ` ${blackMove.san}` : ""}`,
    );
  }

  return chunks.join(" ").trim();
}

function toCommunityLineMove(move, plyIndex) {
  return {
    san: move.san,
    uci: `${move.from}${move.to}${move.promotion ?? ""}`,
    color: move.color,
    moveNumber: Math.floor(plyIndex / 2) + 1,
  };
}

function attachPuzzleDataToPgn(pgn, puzzleData) {
  if (!pgn || !puzzleData) {
    return pgn ?? null;
  }

  const encoded = encodeURIComponent(JSON.stringify(puzzleData));
  return `[${COMMUNITY_PUZZLE_PGN_HEADER} "${encoded}"]\n\n${pgn}`.trim();
}

function buildCommunityPostBoardState(game, kind) {
  const requiredPlyCount =
    kind === "puzzle"
      ? Math.min(game.endPly + 1, game.startPly + PUZZLE_MAX_PLIES)
      : game.startPly;
  const history = buildMoveHistory(game.pgnMoves, requiredPlyCount);
  const contextFen = fenBeforePly(game.pgnMoves, game.startPly);
  const contextPgn = formatPgnFromHistory(history, game.startPly);

  if (!contextPgn || history.length < game.startPly) {
    throw new Error(
      `Unable to build context PGN for ${game.missionTitle} at ply ${game.startPly}.`,
    );
  }

  if (kind !== "puzzle") {
    return {
      fen: contextFen,
      pgn: contextPgn,
      orientation: game.playAs,
    };
  }

  if (game.startPly <= 0) {
    throw new Error(
      `Puzzle seed for ${game.missionTitle} needs a previous move before ply ${game.startPly}.`,
    );
  }

  const previousMove = history[game.startPly - 1];
  const solution = history
    .slice(
      game.startPly,
      Math.min(history.length, game.startPly + PUZZLE_MAX_PLIES),
    )
    .map((move, index) => toCommunityLineMove(move, game.startPly + index));

  if (!previousMove || solution.length === 0) {
    throw new Error(
      `Puzzle seed for ${game.missionTitle} is missing previous move or solution line.`,
    );
  }

  const puzzleData = {
    startFen: contextFen,
    orientation: game.playAs,
    previousMove: toCommunityLineMove(previousMove, game.startPly - 1),
    solution,
  };

  return {
    fen: contextFen,
    pgn: attachPuzzleDataToPgn(contextPgn, puzzleData),
    orientation: game.playAs,
  };
}

function mergeTags(...tagGroups) {
  return Array.from(
    new Set(
      tagGroups
        .flat()
        .map((tag) => tag.trim().toLowerCase())
        .filter(Boolean),
    ),
  ).slice(0, 8);
}

function buildHistoricalThreadDescription(game, threadFlavor) {
  const year = game.eventDate?.slice(0, 4) ?? "";
  const eventLabel = [game.tournament, year ? `(${year})` : ""]
    .filter(Boolean)
    .join(" ");

  return `${threadFlavor} This seeded post is framed as a public discussion board, not as the demo user's own game. The position itself comes from the exact historical PGN of ${game.whiteName} vs ${game.blackName}${eventLabel ? `, ${eventLabel}` : ""}, sourced from scripts/data/ghost-games-seed.json and linked there via chessgames.com.`;
}

const historicalPostSpecs = [
  {
    id: "demo-community-post-01",
    slug: "demo-why-is-white-winning-here",
    authorId: "demo-community-user-01",
    missionTitle: "Operation: Break the Magician",
    kind: "position",
    sourceType: "community-thread",
    title: "Why is everyone saying White is completely winning here?",
    prompt:
      "Saw this in a best-move style thread about attacking finishes. White to move. I can tell the attack is real, but every line I calculate turns into a slower version.",
    tags: ["attack", "historical", "fischer", "tal", "sacrifice"],
    threadFlavor:
      "Written in the tone of a /r/chess discussion where people post a sharp board and ask why the eval says one side is already crushing.",
    collectionKey: "public-thread-breakdowns",
    likesCount: 17,
    savesCount: 6,
    createdAt: addMinutes(new Date(), -(6 * 60 + 20)),
    commentBodies: [
      "The top-comment idea here is basically 'do not cash out too early'. White's attack only works because every piece is still aimed at the king.",
      "Dark-square pressure is the whole story. Once White gives Black a tempo to untangle, the position stops being nearly as forcing.",
      "The exchange sac is already justified by activity. Black's queenside pieces are spectators for the rest of the sequence.",
      "This is one of those spots where the engine line looks violent, but the human explanation is simple: White gets every move with tempo.",
      "If you replay it from the PGN, the attack feels less magical and more like a clean punishment for undeveloped defenders.",
    ],
  },
  {
    id: "demo-community-post-02",
    slug: "demo-explain-the-queen-sac-compensation",
    authorId: "demo-community-user-02",
    missionTitle: "The Game of the Century",
    kind: "puzzle",
    sourceType: "community-thread",
    title: "Can someone explain the compensation before the queen sac?",
    prompt:
      "This was posted like a 'find the best move' thread and the replies keep saying Black's activity matters more than the queen. What exactly is White supposed to be afraid of?",
    tags: [
      "historical",
      "queen-sacrifice",
      "combination",
      "fischer",
      "prodigy",
    ],
    threadFlavor:
      "Written in the tone of a /r/chess puzzle thread where people want the concrete point behind a famous combination, not just the headline move.",
    collectionKey: "public-thread-puzzles",
    likesCount: 22,
    savesCount: 8,
    createdAt: addMinutes(new Date(), -(19 * 60 + 5)),
    commentBodies: [
      "The queen sac is famous, but the real answer is piece coordination. White's king gets dragged into a position where every black piece hits something.",
      "If Black hesitates, the whole thing evaporates. The reason the combination works is that every follow-up move gains time.",
      "This is the classic activity-over-material lesson people always mention, but the position finally makes it concrete.",
      "The long diagonals and the e-file do most of the work. Once you see that, the sacrifice stops looking mystical.",
      "It is a great thread board because the move is flashy but the explanation is still teachable.",
    ],
  },
  {
    id: "demo-community-post-03",
    slug: "demo-calm-defense-better-than-grabbing-material",
    authorId: "demo-community-user-03",
    missionTitle: "Surviving the Ambush",
    kind: "opening",
    sourceType: "community-thread",
    title:
      "Opening help: why is the calm defense better than grabbing material?",
    prompt:
      "Posted with big opening-help energy: White to move, Marshall pressure on the kingside, and every obvious move looks scary. What is the safest human plan here?",
    tags: ["opening", "ruy-lopez", "marshall-attack", "defense", "historical"],
    threadFlavor:
      "Written in the tone of a /r/chessbeginners opening-help thread where the author wants the calm practical plan, not ten engine-only moves.",
    collectionKey: "opening-help-threads",
    likesCount: 28,
    savesCount: 11,
    createdAt: addMinutes(new Date(), -(31 * 60 + 10)),
    commentBodies: [
      "The answer is not to get greedy. White first solves the h-file pressure and only then worries about turning the game around.",
      "This is exactly why people still recommend studying Capablanca: the defense is calm, practical, and almost annoyingly clean.",
      "Once the heavy pieces start coming off, Black's initiative fades fast. That is the transition you want to understand here.",
      "It is a perfect example of a thread where the engine move looks quiet but the reason is very human: kill the attack first.",
      "The position is scary over the board, but the plan is simpler than it looks if you focus on neutralizing the immediate threats.",
    ],
  },
  {
    id: "demo-community-post-04",
    slug: "demo-development-lead-looks-fake",
    authorId: "demo-community-user-04",
    missionTitle: "The Opera Game",
    kind: "opening",
    sourceType: "community-thread",
    title: "This development lead looks fake. Is White already winning?",
    prompt:
      "Shared as one of those 'open files kill you fast' discussion boards. White to move. Which continuation punishes Black's undeveloped pieces most cleanly?",
    tags: ["opening", "development", "morphy", "open-files", "classical"],
    threadFlavor:
      "Written in the tone of a /r/chess thread where someone posts a classic miniature and asks why development matters more than material count.",
    collectionKey: "opening-help-threads",
    likesCount: 18,
    savesCount: 5,
    createdAt: addMinutes(new Date(), -(9 * 60 + 40)),
    commentBodies: [
      "The position looks exaggerated until you notice Black still has pieces asleep on the back rank while the center is already open.",
      "White is not relying on a cheap shot. The rooks and queen simply reach the key files before Black can coordinate.",
      "This is the cleanest historical example of why people say development is a real resource and not just a beginner slogan.",
      "Even if Black sees the idea, there are too many weak entry squares and not enough defenders.",
      "Great thread board because the tactical finish only works after a long chain of principled moves.",
    ],
  },
  {
    id: "demo-community-post-05",
    slug: "demo-where-does-the-endgame-edge-come-from",
    authorId: "demo-community-user-05",
    missionTitle: "Carlsen Dethrones Anand",
    kind: "position",
    sourceType: "community-thread",
    title: "Endgame help: where does White's edge actually come from?",
    prompt:
      "This came from the kind of thread where someone says the eval likes White but the board still looks equal. White to move. What is the long-term winning plan?",
    tags: ["endgame", "technique", "carlsen", "anand", "world-championship"],
    threadFlavor:
      "Written in the tone of a /r/chessbeginners endgame-help thread where the position looks equal to humans but the engine already prefers one side.",
    collectionKey: "endgame-help-threads",
    likesCount: 18,
    savesCount: 7,
    createdAt: addMinutes(new Date(), -(13 * 60 + 32)),
    commentBodies: [
      "The instructive answer is that White is not winning by force yet. White is winning because Black has fewer useful improving moves.",
      "Carlsen keeps tightening the screws until active defense disappears. That is why the eval likes him before the tactic shows up.",
      "The worst thing White can do is rush a pawn break. First improve the pieces, then cash in the structural edge.",
      "This is a very Reddit-style question because the board looks normal until someone points out how one side is running out of counterplay.",
      "If you replay the game, the technical win is all about denying Anand the one freeing idea he wants.",
    ],
  },
  {
    id: "demo-community-post-06",
    slug: "demo-how-do-you-convert-without-drifting",
    authorId: "demo-community-user-06",
    missionTitle: "24th Game — Kasparov Reclaims the Crown",
    kind: "position",
    sourceType: "community-thread",
    title: "Black to move: how do you convert without letting it drift?",
    prompt:
      "Shared as a technique thread about converting small endgame pressure. Black to move. Which improving plan keeps White tied down instead of letting the position flatten out?",
    tags: ["endgame", "technique", "karpov", "kasparov", "world-championship"],
    threadFlavor:
      "Written in the tone of a community conversion thread where players argue about whether the position is just equal or whether one side is winning by patient improvement.",
    collectionKey: "endgame-help-threads",
    likesCount: 14,
    savesCount: 6,
    createdAt: addMinutes(new Date(), -(16 * 60 + 48)),
    commentBodies: [
      "The whole conversion is about not giving White a clear simplifying path. Black keeps improving first and forcing concessions second.",
      "This is the kind of position where flashy checks are mostly a distraction. The strongest move is the one that creates the next restriction.",
      "Karpov is so resilient that the game becomes a lesson in squeezing, not a lesson in tactics.",
      "White's pieces look coordinated until you ask which one can actually improve without giving something up.",
      "It is a good thread board because lots of players would overpush here and let the edge dissolve.",
    ],
  },
  {
    id: "demo-community-post-07",
    slug: "demo-this-position-looks-illegal",
    authorId: "demo-community-user-07",
    missionTitle: "Immortal King Hunt",
    kind: "puzzle",
    sourceType: "community-thread",
    title: "This position looks illegal. Is the king walk seriously best?",
    prompt:
      "Exactly the kind of cursed board that would get cross-posted between /r/chess and /r/AnarchyChess. White to move. Is the king walk actually the point, or is there a cleaner human line?",
    tags: ["anarchy", "king-walk", "attack", "kasparov", "cursed"],
    threadFlavor:
      "Written in the tone of a cross-posted /r/chess and /r/AnarchyChess thread where the board looks fake until someone posts the engine line.",
    collectionKey: "chaos-thread-finds",
    likesCount: 34,
    savesCount: 10,
    createdAt: addMinutes(new Date(), -(4 * 60 + 12)),
    commentBodies: [
      "The king walk works because every check White allows comes bundled with an even bigger threat somewhere else.",
      "This is one of those boards where 'human line' and 'engine line' surprisingly become the same thing if you keep following forcing moves.",
      "Black's king is actually the less safe king even while White's monarch is marching through the center. That is the absurd part.",
      "Topalov defended unbelievably well, which is why the continuation still feels unrealistic when you first see it.",
      "Perfect chaos-thread material: the board looks cursed, but the moves are still concrete and exact.",
    ],
  },
  {
    id: "demo-community-post-08",
    slug: "demo-sound-attack-or-impossible-defense",
    authorId: "demo-community-user-08",
    missionTitle: "The Magician Strikes",
    kind: "puzzle",
    sourceType: "community-thread",
    title: "Chaos thread: sound attack or just impossible defense?",
    prompt:
      "Posted like a 'how is this not losing on the spot?' thread. White to move. Is Tal objectively right here, or is this one of those attacks that only works because defense is so hard?",
    tags: ["anarchy", "chaos", "sacrifice", "tal", "smyslov"],
    threadFlavor:
      "Written in the tone of a chaos-thread argument where half the replies call the attack unsound and the other half say the defense is impossible for humans.",
    collectionKey: "chaos-thread-finds",
    likesCount: 29,
    savesCount: 9,
    createdAt: addMinutes(new Date(), -(7 * 60 + 5)),
    commentBodies: [
      "The most useful reply here is that Tal keeps choosing initiative over material. If White ever slows down, Black might actually stabilize.",
      "Smyslov's defensive level matters to the evaluation discussion. If he struggles to untangle, that tells you how practical the attack is.",
      "This is exactly the type of board where 'sound' and 'impossible to defend for humans' start to blur together.",
      "You can call it chaos, but every attacking piece has a job and every tempo has a point.",
      "Great comment-section board because the position invites both concrete calculation and a real debate about practical chess.",
    ],
  },
];

const posts = historicalPostSpecs
  .map((post) => {
    const game = getHistoricalGame(post.missionTitle);
    const boardState = buildCommunityPostBoardState(game, post.kind);

    return {
      ...post,
      description: buildHistoricalThreadDescription(game, post.threadFlavor),
      fen: boardState.fen,
      pgn: boardState.pgn,
      orientation: boardState.orientation,
      openingName: game.openingName,
      tags: mergeTags(game.tags, post.tags),
    };
  })
  .map((post, index) => ({
    ...post,
    commentsCount: post.commentBodies.length,
    likeUsers: pickDistinctUsers(post.likesCount, index * 7 + 4, post.authorId),
    saveUsers: pickDistinctUsers(
      post.savesCount,
      index * 5 + 11,
      post.authorId,
    ),
    comments: post.commentBodies.map((body, commentIndex) => ({
      id: `${post.id}-comment-${String(commentIndex + 1).padStart(2, "0")}`,
      author: pickDistinctUsers(6, index * 9 + commentIndex + 1, post.authorId)[
        commentIndex % 6
      ],
      body,
      createdAt: addMinutes(post.createdAt, 18 + commentIndex * 19),
    })),
  }));

async function insertDemoUsers(rows) {
  console.log(`Inserting ${rows.length} demo users...`);
  await client.query(
    `INSERT INTO "user" ("id", "name", "email", "image", "chaos_username")
     SELECT
       seed."id",
       seed."name",
       seed."email",
       seed."image",
       seed."chaos_username"
     FROM jsonb_to_recordset($1::jsonb) AS seed(
       "id" text,
       "name" text,
       "email" text,
       "image" text,
       "chaos_username" text
     )`,
    [JSON.stringify(rows)],
  );
}

async function insertDemoPosts(rows) {
  console.log(`Inserting ${rows.length} demo posts...`);
  await client.query(
    `INSERT INTO "community_post" (
       "id",
       "authorId",
       "slug",
       "kind",
       "sourceType",
       "title",
       "prompt",
       "description",
       "fen",
       "pgn",
       "orientation",
       "openingName",
       "tags",
       "collectionKey",
       "visibility",
       "previewMode",
       "likesCount",
       "commentsCount",
       "savesCount",
       "hotScore",
       "createdAt",
       "updatedAt"
     )
     SELECT
       seed."id",
       seed."authorId",
       seed."slug",
       seed."kind",
       seed."sourceType",
       seed."title",
       seed."prompt",
       seed."description",
       seed."fen",
       seed."pgn",
       seed."orientation",
       seed."openingName",
       seed."tags",
       seed."collectionKey",
       'public',
       'board',
       seed."likesCount",
       seed."commentsCount",
       seed."savesCount",
       seed."hotScore",
       to_timestamp(seed."createdAtMs" / 1000.0),
       to_timestamp(seed."updatedAtMs" / 1000.0)
     FROM jsonb_to_recordset($1::jsonb) AS seed(
       "id" text,
       "authorId" text,
       "slug" text,
       "kind" text,
       "sourceType" text,
       "title" text,
       "prompt" text,
       "description" text,
       "fen" text,
       "pgn" text,
       "orientation" text,
       "openingName" text,
       "tags" jsonb,
       "collectionKey" text,
       "likesCount" integer,
       "commentsCount" integer,
       "savesCount" integer,
       "hotScore" double precision,
       "createdAtMs" bigint,
       "updatedAtMs" bigint
     )`,
    [JSON.stringify(rows)],
  );
}

async function insertDemoComments(rows) {
  console.log(`Inserting ${rows.length} demo comments...`);
  await client.query(
    `INSERT INTO "community_comment" (
       "id",
       "postId",
       "authorId",
       "parentId",
       "body",
       "createdAt"
     )
     SELECT
       seed."id",
       seed."postId",
       seed."authorId",
       NULL,
       seed."body",
       to_timestamp(seed."createdAtMs" / 1000.0)
     FROM jsonb_to_recordset($1::jsonb) AS seed(
       "id" text,
       "postId" text,
       "authorId" text,
       "body" text,
       "createdAtMs" bigint
     )`,
    [JSON.stringify(rows)],
  );
}

async function insertDemoReactions(rows) {
  console.log(`Inserting ${rows.length} demo reactions...`);
  await client.query(
    `INSERT INTO "community_reaction" (
       "id",
       "postId",
       "userId",
       "kind",
       "createdAt"
     )
     SELECT
       seed."id",
       seed."postId",
       seed."userId",
       seed."kind",
       to_timestamp(seed."createdAtMs" / 1000.0)
     FROM jsonb_to_recordset($1::jsonb) AS seed(
       "id" text,
       "postId" text,
       "userId" text,
       "kind" text,
       "createdAtMs" bigint
     )`,
    [JSON.stringify(rows)],
  );
}

async function seed() {
  const userIds = demoUsers.map((user) => user.id);
  const postIds = posts.map((post) => post.id);
  const postSlugs = posts.map((post) => post.slug);
  const commentCount = posts.reduce(
    (sum, post) => sum + post.comments.length,
    0,
  );
  const reactionCount = posts.reduce(
    (sum, post) => sum + post.likeUsers.length + post.saveUsers.length,
    0,
  );

  const userRows = demoUsers.map((user) => ({
    id: user.id,
    name: user.name,
    email: user.email,
    image: user.image,
    chaos_username: user.handle,
  }));

  const postRows = posts.map((post) => ({
    id: post.id,
    authorId: post.authorId,
    slug: post.slug,
    kind: post.kind,
    sourceType: post.sourceType,
    title: post.title,
    prompt: post.prompt,
    description: post.description,
    fen: post.fen,
    pgn: post.pgn,
    orientation: post.orientation,
    openingName: post.openingName,
    tags: post.tags,
    collectionKey: post.collectionKey,
    likesCount: post.likesCount,
    commentsCount: post.commentsCount,
    savesCount: post.savesCount,
    hotScore: computeHotScore(post),
    createdAtMs: toMillis(post.createdAt),
    updatedAtMs: toMillis(post.comments.at(-1)?.createdAt ?? post.createdAt),
  }));

  const commentRows = posts.flatMap((post) =>
    post.comments.map((comment) => ({
      id: comment.id,
      postId: post.id,
      authorId: comment.author.id,
      body: comment.body,
      createdAtMs: toMillis(comment.createdAt),
    })),
  );

  const reactionRows = posts.flatMap((post) => [
    ...post.likeUsers.map((user, index) => ({
      id: `${post.id}-like-${String(index + 1).padStart(2, "0")}`,
      postId: post.id,
      userId: user.id,
      kind: "like",
      createdAtMs: toMillis(addMinutes(post.createdAt, 12 + index * 7)),
    })),
    ...post.saveUsers.map((user, index) => ({
      id: `${post.id}-save-${String(index + 1).padStart(2, "0")}`,
      postId: post.id,
      userId: user.id,
      kind: "save",
      createdAtMs: toMillis(addMinutes(post.createdAt, 25 + index * 11)),
    })),
  ]);

  console.log("Connecting to database...");
  await client.connect();
  console.log("Starting transaction...");
  await client.query("BEGIN");

  try {
    console.log("Deleting previous demo community posts...");
    await client.query(
      `DELETE FROM "community_post"
       WHERE "id" = ANY($1::text[])
          OR "slug" = ANY($2::text[])`,
      [postIds, postSlugs],
    );

    console.log("Deleting previous demo users...");
    await client.query(
      `DELETE FROM "user"
       WHERE "id" = ANY($1::text[])
          OR "email" LIKE $2`,
      [userIds, `%${DEMO_EMAIL_DOMAIN}`],
    );

    await insertDemoUsers(userRows);
    await insertDemoPosts(postRows);
    await insertDemoComments(commentRows);
    await insertDemoReactions(reactionRows);

    console.log("Committing transaction...");
    await client.query("COMMIT");

    console.log(
      `Seeded ${demoUsers.length} demo users, ${posts.length} posts, ${commentCount} comments, and ${reactionCount} reactions.`,
    );
  } catch (error) {
    console.log("Rolling back transaction...");
    await client.query("ROLLBACK");
    throw error;
  } finally {
    console.log("Closing database connection...");
    await client.end();
  }
}

seed().catch((error) => {
  console.error("Community demo seed failed:", error);
  process.exitCode = 1;
});
