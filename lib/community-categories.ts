export type CommunityCategoryId =
  | "all"
  | "position-lab"
  | "opening-lab"
  | "endgame-clinic"
  | "anarchy-corner";

type CommunityCategoryPost = {
  id: string;
  kind: string;
  sourceType: string;
  tags: string[];
};

export type CommunityHomepageSection<T extends CommunityCategoryPost> = {
  id: string;
  label: string;
  title: string;
  description: string;
  accentClass: string;
  posts: T[];
};

type CommunityCategoryDefinition = {
  id: Exclude<CommunityCategoryId, "all">;
  label: string;
  title: string;
  description: string;
  accentClass: string;
  matcher: <T extends CommunityCategoryPost>(post: T) => boolean;
};

const OPENING_TAGS = new Set([
  "opening",
  "italian",
  "sicilian",
  "najdorf",
  "caro-kann",
  "theory",
  "plans",
  "structure",
]);

const ENDGAME_TAGS = new Set([
  "endgame",
  "rook-endgame",
  "king-and-pawn",
  "technique",
  "conversion",
  "fortress",
]);

const ANARCHY_TAGS = new Set([
  "anarchy",
  "en-passant",
  "joke",
  "meme",
  "cursed",
  "illegal",
]);

function hasAnyTag<T extends CommunityCategoryPost>(
  post: T,
  tagSet: Set<string>,
) {
  return post.tags.some((tag) => tagSet.has(tag.toLowerCase()));
}

export function isAnarchyPost<T extends CommunityCategoryPost>(post: T) {
  return hasAnyTag(post, ANARCHY_TAGS);
}

export function isEndgamePost<T extends CommunityCategoryPost>(post: T) {
  return post.sourceType === "endgame-scan" || hasAnyTag(post, ENDGAME_TAGS);
}

export function isOpeningPost<T extends CommunityCategoryPost>(post: T) {
  return post.kind === "opening" || hasAnyTag(post, OPENING_TAGS);
}

export function getPrimaryCommunityCategory<T extends CommunityCategoryPost>(
  post: T,
): Exclude<CommunityCategoryId, "all"> {
  if (isOpeningPost(post)) return "opening-lab";
  if (isEndgamePost(post)) return "endgame-clinic";
  if (isAnarchyPost(post)) return "anarchy-corner";
  return "position-lab";
}

export const COMMUNITY_CATEGORY_DEFINITIONS: CommunityCategoryDefinition[] = [
  {
    id: "position-lab",
    label: "Position Lab",
    title: "Practical middlegames and tactical questions",
    description:
      "Fresh boards pulled from analysis runs, puzzle saves, and real post-game questions.",
    accentClass: "border-orange-500/25 bg-orange-500/10 text-orange-300",
    matcher: (post) =>
      !isOpeningPost(post) && !isEndgamePost(post) && !isAnarchyPost(post),
  },
  {
    id: "opening-lab",
    label: "Opening Lab",
    title: "Plans, move orders, and repeat structures",
    description:
      "The spots people keep reaching and still misplaying after move ten.",
    accentClass: "border-cyan-500/25 bg-cyan-500/10 text-cyan-300",
    matcher: (post) => isOpeningPost(post),
  },
  {
    id: "endgame-clinic",
    label: "Endgame Clinic",
    title: "Conversion, technique, and clean plans",
    description:
      "Winning endings, defensive resources, and the engine lines that need a human explanation.",
    accentClass: "border-emerald-500/25 bg-emerald-500/10 text-emerald-300",
    matcher: (post) => isEndgamePost(post),
  },
  {
    id: "anarchy-corner",
    label: "Anarchy Corner",
    title: "En passant, cursed boards, and other crimes",
    description:
      "The joke positions, impossible-looking mates, and meme analysis boards that still deserve a line.",
    accentClass: "border-fuchsia-500/25 bg-fuchsia-500/10 text-fuchsia-300",
    matcher: (post) => isAnarchyPost(post),
  },
];

export const COMMUNITY_CATEGORY_OPTIONS = [
  {
    id: "all" as const,
    label: "All Boards",
    title: "Everything in the public feed",
    description: "Every public position, opening, endgame, and chaos board.",
    accentClass: "border-white/[0.14] bg-white/[0.05] text-slate-200",
  },
  ...COMMUNITY_CATEGORY_DEFINITIONS,
] as const;

export function isCommunityCategoryId(
  value: string | undefined,
): value is CommunityCategoryId {
  return COMMUNITY_CATEGORY_OPTIONS.some((option) => option.id === value);
}

export function filterCommunityPostsByCategory<T extends CommunityCategoryPost>(
  posts: T[],
  category: CommunityCategoryId,
) {
  if (category === "all") return posts;

  return posts.filter((post) => getPrimaryCommunityCategory(post) === category);
}

export function buildHomepageSections<T extends CommunityCategoryPost>(
  posts: T[],
) {
  const usedIds = new Set<string>();
  const sections: CommunityHomepageSection<T>[] = [];

  for (const section of COMMUNITY_CATEGORY_DEFINITIONS) {
    const sectionPosts = posts
      .filter((post) => !usedIds.has(post.id) && section.matcher(post))
      .slice(0, 2);

    if (sectionPosts.length === 0) continue;

    sectionPosts.forEach((post) => usedIds.add(post.id));
    sections.push({
      id: section.id,
      label: section.label,
      title: section.title,
      description: section.description,
      accentClass: section.accentClass,
      posts: sectionPosts,
    });
  }

  const leftovers = posts.filter((post) => !usedIds.has(post.id)).slice(0, 2);
  if (leftovers.length > 0) {
    sections.unshift({
      id: "fresh-boards",
      label: "Fresh Boards",
      title: "The hottest positions in the feed right now",
      description:
        "The most active boards on FireChess, regardless of category.",
      accentClass: "border-white/[0.14] bg-white/[0.05] text-slate-200",
      posts: leftovers,
    });
  }

  return sections;
}
