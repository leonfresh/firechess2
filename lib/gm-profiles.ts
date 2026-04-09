/**
 * Grandmaster profile database for pSEO pages at /players/[slug]
 * Covers playing style, opening repertoire, career highlights, and learning tips.
 */

export type GmProfile = {
  id: string;
  /** Wikimedia Commons thumbnail URL for the player photo */
  imageUrl?: string;
  name: string;
  fullName: string;
  born: number;
  died?: number;
  nationality: string;
  title: string;
  peakRating?: number;
  worldChampion: boolean;
  championYears?: string;
  era: "romantic" | "classical" | "modern" | "contemporary";
  /** One-liner for SEO meta description */
  tagline: string;
  /** 3-4 sentence overview */
  bio: string;
  /** Playing style keywords */
  style: string[];
  /** Openings as White (ECO + name) */
  openingsWhite: { eco?: string; name: string; notes: string }[];
  /** Openings as Black (ECO + name) */
  openingsBlack: { eco?: string; name: string; notes: string }[];
  /** Key lessons any player can learn from studying this GM */
  lessonsToLearn: string[];
  /** Career highlights */
  highlights: string[];
  /** Famous game IDs (from famous-games.ts) */
  famousGameIds: string[];
  faqs: { q: string; a: string }[];
};

export const GM_PROFILES: GmProfile[] = [
  {
    id: "magnus-carlsen",
    imageUrl:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1a/Magnus_Carlsen_in_2025.jpg/330px-Magnus_Carlsen_in_2025.jpg",
    name: "Magnus Carlsen",
    fullName: "Sven Magnus Øen Carlsen",
    born: 1990,
    nationality: "Norwegian",
    title: "Grandmaster",
    peakRating: 2882,
    worldChampion: true,
    championYears: "2013–2023",
    era: "contemporary",
    tagline:
      "Magnus Carlsen — the highest-rated player in history — wins through universal mastery, endgame grinding, and relentless practical pressure rather than sharp theoretical novelties.",
    bio: "Magnus Carlsen became a grandmaster at 13 and world champion at 22, defeating Vishy Anand in 2013. He held the classical world title until 2023, when he chose not to defend it. Carlsen's peak rating of 2882 is the highest in chess history. Unlike predecessors who relied on deep opening preparation, Carlsen steers games into complex middlegames and endgames where his intuition and technique are matchless. He has dominated rapid and blitz chess simultaneously, holding all three world titles at once.",
    style: [
      "Universal player",
      "Endgame maestro",
      "Practical pressure",
      "Slight edge conversion",
      "Minimal theory reliance",
      "Psychological dominance",
    ],
    openingsWhite: [
      {
        eco: "A00–A09",
        name: "Réti / English setups",
        notes:
          "Carlsen often avoids early pawn commitments with 1.Nf3 or 1.c4, keeping the position flexible and steering away from opponents' preparation.",
      },
      {
        eco: "C65–C99",
        name: "Ruy Lopez",
        notes:
          "When playing 1.e4, Carlsen reaches for the Berlin or Ruy Lopez — solid structures where he can outplay opponents in long technical games.",
      },
      {
        eco: "D10–D19",
        name: "Queen's Gambit / Catalan",
        notes:
          "The Catalan is a Carlsen staple — long-term positional pressure with the bishop on g2, often leading to endgames where his precision shines.",
      },
    ],
    openingsBlack: [
      {
        eco: "C65",
        name: "Berlin Defense",
        notes:
          "Carlsen's go-to against 1.e4 — he accepts an early queen trade and plays rook-and-minor-piece endgames where his technique is virtually unbeatable.",
      },
      {
        eco: "D70–D79",
        name: "Grünfeld Defense",
        notes:
          "Carlsen uses the Grünfeld for imbalanced positions where Black fights for activity despite a cramped start. He often wins from seemingly passive positions.",
      },
      {
        eco: "E60–E99",
        name: "King's Indian Defense",
        notes:
          "The KID gives Carlsen counterplay-rich positions where he ignores pawn weaknesses in favour of a kingside attack.",
      },
    ],
    lessonsToLearn: [
      "Play for slight edges — don't need a flashy tactic to win material; accumulate small advantages",
      "Never simplify to a draw when you have any winning chances in the endgame",
      "Study rook endgames: Carlsen's rook technique is the benchmark for precision",
      "Vary your openings to keep opponents guessing and avoid over-reliance on preparation",
    ],
    highlights: [
      "World Chess Champion 2013–2023 (5 title defenses)",
      "All-time peak rating: 2882 (the highest in history)",
      "World Rapid Champion 2014, 2015, 2019, 2022",
      "World Blitz Champion 2009, 2010, 2012, 2014, 2017, 2018, 2022",
      "Became grandmaster at age 13 years, 148 days",
    ],
    famousGameIds: ["carlsen-karjakin-2016"],
    faqs: [
      {
        q: "What is Magnus Carlsen's peak chess rating?",
        a: "Magnus Carlsen's peak classical rating was 2882, achieved in May 2014 — the highest rating ever recorded in chess history.",
      },
      {
        q: "Why did Magnus Carlsen give up his World Championship title?",
        a: "Carlsen declined to defend his title in 2023 against Nepomniachtchi, stating the match format no longer motivated him. He remains the highest-rated active player in the world.",
      },
      {
        q: "What openings does Magnus Carlsen play?",
        a: "Carlsen is famous for his versatility. As White he often plays 1.e4 (Ruy Lopez, Spanish) or 1.Nf3/1.c4 (English, Réti). As Black he favors the Berlin Defense and Grünfeld. He adapts his repertoire frequently to surprise opponents.",
      },
      {
        q: "What makes Carlsen's endgame so strong?",
        a: "Carlsen's endgame strength comes from deep preparation, accurate calculation, exceptional patience, and an ability to create winning chances from positions that computers evaluate as drawn.",
      },
    ],
  },
  {
    id: "garry-kasparov",
    imageUrl:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b9/Garri_Kasparow_%2818776605665%29_%28cropped%29_2.jpg/330px-Garri_Kasparow_%2818776605665%29_%28cropped%29_2.jpg",
    name: "Garry Kasparov",
    fullName: "Garri Kimovich Kasparov",
    born: 1963,
    nationality: "Russian (Azerbaijani-born)",
    title: "Grandmaster",
    peakRating: 2851,
    worldChampion: true,
    championYears: "1985–2000",
    era: "contemporary",
    tagline:
      "Garry Kasparov — widely considered the greatest chess player of all time — combined explosive attacking chess with the deepest opening preparation in history to dominate world chess for 15 years.",
    bio: "Garry Kasparov became world champion in 1985 at age 22, defeating Karpov in an epic five-match rivalry. He held the title for 15 years — the longest reign in modern chess — and was ranked world number one for 255 months, including his entire professional career. Kasparov combined explosive tactical vision with revolutionary opening preparation, contributing hundreds of theoretical novelties. His match against IBM's Deep Blue in 1997 was the first time a computer beat a reigning world champion in a match.",
    style: [
      "Attacking genius",
      "Tactical fireworks",
      "Deep opening preparation",
      "Psychological aggression",
      "Dynamic piece play",
      "Initiative at all costs",
    ],
    openingsWhite: [
      {
        eco: "B40–B99",
        name: "Sicilian Defense (as White)",
        notes:
          "Kasparov loved sharp Sicilian positions where his tactical genius could maximize attacking chances. He prepared deeply in the English Attack and other aggressive systems.",
      },
      {
        eco: "C80–C99",
        name: "Ruy Lopez (Open and Closed)",
        notes:
          "Kasparov pioneered many Ruy Lopez novelties, especially in the Marshall Attack counterplay variations, turning theoretical duels with Karpov into legendary battles.",
      },
      {
        eco: "D85–D99",
        name: "Grünfeld Defense (as White)",
        notes:
          "As White against the Grünfeld, Kasparov prepared deeply with the Exchange variation, often launching devastating kingside attacks against Black's fianchetto.",
      },
    ],
    openingsBlack: [
      {
        eco: "B80–B89",
        name: "Sicilian Najdorf",
        notes:
          "The Najdorf was Kasparov's signature Black weapon — sharp, dynamic, and rich in counterplay. He won countless crushing games from the Najdorf position.",
      },
      {
        eco: "E60–E99",
        name: "King's Indian Defense",
        notes:
          "Kasparov used the King's Indian for explosive kingside counterattacks, particularly in his early career. His King's Indian games against Karpov are legendary.",
      },
    ],
    lessonsToLearn: [
      "Seize the initiative early — Kasparov rarely allowed opponents time to organize their counterplay",
      "Prepare deeply in your pet lines but stay flexible enough to deviate when needed",
      "Attack the king relentlessly once you've opened lines — don't give your opponent time to regroup",
      "Study Kasparov's 'My Great Predecessors' series to understand how champions think",
    ],
    highlights: [
      "World Chess Champion 1985–2000 (longest reign in modern chess)",
      "Ranked world #1 for 255 consecutive months — his entire career",
      "Peak rating 2851, then the highest ever recorded",
      "Five World Championship matches against Karpov (1984–1990)",
      "First player to lose a match to a computer (Deep Blue, 1997)",
      "Retired from professional chess in 2005 to focus on politics and democracy activism",
    ],
    famousGameIds: [
      "kasparov-immortal-1999",
      "kasparov-karpov-1985-g16",
      "deep-blue-kasparov-1997",
    ],
    faqs: [
      {
        q: "Is Garry Kasparov the greatest chess player of all time?",
        a: "Many chess historians consider Kasparov the greatest, based on his 15-year world championship reign, peak rating dominance, and revolutionary influence on opening theory. Magnus Carlsen's higher peak rating and sustained excellence give him a strong case too.",
      },
      {
        q: "When did Kasparov become World Champion?",
        a: "Kasparov became World Chess Champion in 1985 at age 22, defeating Anatoly Karpov after a controversial match abandonment in 1984. He held the title until losing to Vladimir Kramnik in 2000.",
      },
      {
        q: "What openings did Kasparov play?",
        a: "Kasparov's signature was the Sicilian Najdorf as Black and the Ruy Lopez / King's Indian setup as White. He also contributed hundreds of novelties to virtually every major opening.",
      },
      {
        q: "Did Kasparov ever lose to a computer before Deep Blue?",
        a: "Kasparov defeated Deep Blue in their first match in 1996 (4–2). He lost the rematch in 1997 (2.5–3.5), which was the first time a reigning world champion lost a match to a computer.",
      },
    ],
  },
  {
    id: "bobby-fischer",
    imageUrl:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/4/42/Bobby_Fischer_in_1962_portrait.jpg/330px-Bobby_Fischer_in_1962_portrait.jpg",
    name: "Bobby Fischer",
    fullName: "Robert James Fischer",
    born: 1943,
    died: 2008,
    nationality: "American",
    title: "Grandmaster",
    peakRating: 2785,
    worldChampion: true,
    championYears: "1972–1975",
    era: "modern",
    tagline:
      "Bobby Fischer — brilliant, troubled, and peerless — revolutionized chess preparation and demonstrated that a single player from a non-Soviet country could dominate the world's best.",
    bio: "Bobby Fischer became the US Chess Champion at 14 and a grandmaster at 15. He dominated the 1970–72 Candidates cycle, winning his semifinal against Taimanov 6–0 and his final against Larsen 6–0 before defeating world champion Spassky in Reykjavik in 1972. His chess was marked by absolute clarity, profound preparation, and relentless aggression from both sides of the board. Fischer's 1972 match against Spassky was one of the most watched events of the Cold War.",
    style: [
      "Crystal-clear clarity",
      "Opening preparation pioneer",
      "Relentless aggression",
      "Universal technical mastery",
      "Psychological intimidation",
      "Perfectionism",
    ],
    openingsWhite: [
      {
        eco: "C60–C99",
        name: "Ruy Lopez",
        notes:
          "Fischer played 1.e4 almost exclusively and favored the Ruy Lopez. He mastered every Ruy Lopez variation so deeply that opponents dreaded facing him in any line.",
      },
      {
        eco: "B80–B89",
        name: "Sicilian (Fischer Attack)",
        notes:
          "Fischer developed the Fischer Attack (6.Bc4) against the Sicilian Najdorf — an aggressive system that remains popular at all levels today.",
      },
    ],
    openingsBlack: [
      {
        eco: "B70–B79",
        name: "Sicilian Dragon",
        notes:
          "Fischer's early defense of choice — he later switched away citing White's dangerous attacking options, but his Dragon games are instructive models of dynamic play.",
      },
      {
        eco: "E60–E99",
        name: "King's Indian Defense",
        notes:
          "Fischer employed the King's Indian masterfully, winning many brilliant attacking games from this complex opening.",
      },
      {
        eco: "C60–C69",
        name: "Ruy Lopez Exchange Variation (as Black)",
        notes:
          "Fischer rehabilitated the Exchange Ruy Lopez from the Black side, demonstrating that Black's structural compensation could give winning chances.",
      },
    ],
    lessonsToLearn: [
      "Master all aspects of chess — Fischer was equally exceptional in tactics, strategy, and endgames",
      "Deep opening preparation pays off — Fischer often knew the theory 20+ moves deep",
      "Play 1.e4 with conviction — Fischer's comment 'Best by test' still rings true",
      "Study Fischer's endgame technique: his bishop-vs-knight and rook endgames are textbook perfect",
    ],
    highlights: [
      "US Chess Champion at age 14 (1957) — the youngest ever",
      "Grandmaster at 15 years, 6 months — then the youngest ever",
      "Won Candidates semifinals 6–0, 6–0 against Taimanov and Larsen (1971)",
      "Defeated Boris Spassky 12.5–8.5 in the 1972 World Championship in Reykjavik",
      "'The Game of the Century' at age 13 (vs Byrne, 1956)",
      "Beat Bent Larsen in a 21-move brilliancy (1971, Candidates)",
    ],
    famousGameIds: [
      "game-of-the-century",
      "byrne-fischer-1963",
      "fischer-spassky-g6-1972",
    ],
    faqs: [
      {
        q: "Why is Bobby Fischer considered the greatest chess player of his era?",
        a: "Fischer's dominance was unparalleled — he had the highest ever Elo rating at his peak, won Candidates matches 6–0 twice, and defeated the Soviet chess machine as a single American. His clarity and preparation set a new standard.",
      },
      {
        q: "Why did Bobby Fischer never defend his World Championship title?",
        a: "Fischer made extreme demands to FIDE for the 1975 title defense against Karpov. When FIDE didn't meet all his conditions, he forfeited the title without playing. He never played another classical game officially.",
      },
      {
        q: "What was Bobby Fischer's peak chess rating?",
        a: "Fischer's peak FIDE rating was 2785, achieved in July 1972 — the highest in the world at the time by a significant margin, which led to the creation of the rating floor discussion.",
      },
    ],
  },
  {
    id: "mikhail-tal",
    imageUrl:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4e/Mikhail_Tal_1962.jpg/330px-Mikhail_Tal_1962.jpg",
    name: "Mikhail Tal",
    fullName: "Mikhail Nekhemyevich Tal",
    born: 1936,
    died: 1992,
    nationality: "Latvian (Soviet)",
    title: "Grandmaster",
    peakRating: 2705,
    worldChampion: true,
    championYears: "1960–1961",
    era: "modern",
    tagline:
      "Mikhail Tal — the Magician from Riga — won the World Championship at 23 by sacrificing pieces at will, creating chaos his opponents found psychologically and technically impossible to navigate.",
    bio: "Mikhail Tal became World Chess Champion in 1960 at age 23, defeating the legendary Botvinnik. Known as 'The Magician from Riga', Tal was famous for speculative sacrifices that could not be refuted at the board — even when computers later showed some were objectively incorrect. His stare across the board became legendary: opponents reported feeling hypnotized. Even after losing the rematch to Botvinnik in 1961 and battling chronic kidney disease throughout his career, Tal continued to produce brilliant, creative chess for 30 years.",
    style: [
      "Speculative sacrifice",
      "Psychological warfare",
      "Chaos creation",
      "Tactical complexity",
      "Intuitive piece play",
      "Dynamic imbalance",
    ],
    openingsWhite: [
      {
        eco: "B40–B99",
        name: "Sicilian (as White)",
        notes:
          "Tal loved sharp Sicilian positions where he could launch kingside attacks. He favored aggressive systems that immediately unbalanced the position.",
      },
      {
        eco: "E60–E99",
        name: "King's Indian Attack",
        notes:
          "Tal used the King's Indian setup with White to steer games toward his preferred attacking middlegames with a kingside pawn storm.",
      },
    ],
    openingsBlack: [
      {
        eco: "B09",
        name: "Pirc Defense",
        notes:
          "Tal's Pirc was deliberately provocative — inviting White to advance in the center so he could generate counterplay from seemingly inferior positions.",
      },
      {
        eco: "E60–E99",
        name: "King's Indian Defense",
        notes:
          "The KID gave Tal exactly what he wanted: a cramped but dynamic position with clear kingside attacking ideas. His King's Indian games are models of aggression.",
      },
    ],
    lessonsToLearn: [
      "Complications favor the better calculator — create chaos only when you're more comfortable in it than your opponent",
      "Psychology matters: putting your opponent in difficult positions with the clock also counts",
      "Study Tal's games to understand the practical value of 'unsound' sacrifices in over-the-board play",
      "Even from inferior positions, active piece play can manufacture winning chances",
    ],
    highlights: [
      "World Chess Champion 1960–1961 at age 23",
      "Won the 1959 Candidates Tournament to earn the world championship match",
      "Eight-time Soviet Chess Champion",
      "Won numerous international tournaments despite chronic health problems",
      "Renowned for his hypnotic stare across the board",
    ],
    famousGameIds: ["tal-smyslov-1959", "tal-botvinnik-1960"],
    faqs: [
      {
        q: "Were Mikhail Tal's sacrifices always sound?",
        a: "Not always. Tal himself admitted some sacrifices were intuitive rather than calculated. Computers have found refutations to some of his famous sacrifices — but at the board, opponents consistently failed to find them. That was Tal's genius.",
      },
      {
        q: "Why is Tal called the Magician from Riga?",
        a: "The nickname comes from Tal's birthplace (Riga, Latvia) and his ability to conjure wins from seemingly impossible positions, as if by magic. His sacrifices and combinations appeared supernatural.",
      },
      {
        q: "Who defeated Tal to take back the World Championship?",
        a: "Mikhail Botvinnik defeated Tal 13–8 in the 1961 rematch, reclaiming the title. At the time, the reigning champion had the automatic right to demand a rematch within a year.",
      },
    ],
  },
  {
    id: "anatoly-karpov",
    imageUrl:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e6/Anatoly_Karpov_2017_april.jpg/330px-Anatoly_Karpov_2017_april.jpg",
    name: "Anatoly Karpov",
    fullName: "Anatoly Yevgenyevich Karpov",
    born: 1951,
    nationality: "Russian (Soviet)",
    title: "Grandmaster",
    peakRating: 2780,
    worldChampion: true,
    championYears: "1975–1985",
    era: "contemporary",
    tagline:
      "Anatoly Karpov — the positional boa constrictor — accumulated tiny advantages with such patience and precision that opponents found themselves slowly squeezed to death without any single decisive mistake.",
    bio: "Anatoly Karpov became World Champion in 1975 when Fischer refused to defend. He proved his title legitimate by dominating chess for a decade — winning virtually every major tournament, achieving a then-record rating, and engaging in five legendary World Championship matches against Kasparov. Karpov's style was the antithesis of tactical fireworks: he preferred prophylaxis, restriction, and the slow accumulation of seemingly imperceptible advantages. His endgame technique was second only to Capablanca's.",
    style: [
      "Positional squeeze",
      "Prophylaxis",
      "Restriction",
      "Outpost domination",
      "Endgame precision",
      "Slow accumulation",
    ],
    openingsWhite: [
      {
        eco: "C80–C99",
        name: "Ruy Lopez",
        notes:
          "Karpov's Ruy Lopez was a model of positional pressure — he developed the Karpov Variation and used the Lopez as a platform for long, grinding games.",
      },
      {
        eco: "A10–A39",
        name: "English Opening",
        notes:
          "The English allowed Karpov to maintain flexibility and reach middlegames where his strategic mastery could outclass opponents over 60+ moves.",
      },
    ],
    openingsBlack: [
      {
        eco: "E00–E09",
        name: "Nimzo-Indian / Queen's Indian",
        notes:
          "Karpov's Nimzo-Indian was a model of solid, prophylactic play. He would neutralize White's initiative and then outplay opponents in equal-looking endgames.",
      },
      {
        eco: "B40–B49",
        name: "Caro-Kann Defense",
        notes:
          "The solid Caro-Kann suited Karpov perfectly — a sturdy, slightly passive setup where he could wait for White to overextend and then punish inaccuracies.",
      },
    ],
    lessonsToLearn: [
      "Winning doesn't require brilliancies — small advantages reliably accumulated and converted are just as deadly",
      "Learn prophylaxis: preventing your opponent's plans is as important as making your own",
      "Study Karpov's domination of outposts, especially his knights on d6",
      "Patience is a weapon: making your opponent uncomfortable without any obvious crisis is rare skill",
    ],
    highlights: [
      "World Chess Champion 1975–1985",
      "Three-time winner of the Chess Oscar (awarded 9 times total)",
      "Won the 1993 FIDE World Championship after the Kasparov split",
      "Over 160 first-place tournament finishes in his career",
      "Held the highest rating in the world for most of the late 1970s and early 1980s",
    ],
    famousGameIds: ["kasparov-karpov-1985-g16", "polgar-karpov-1994"],
    faqs: [
      {
        q: "Did Karpov legitimately earn the World Championship title?",
        a: "Yes — though Karpov received the title by default in 1975 when Fischer forfeited, he went on to prove himself by dominating world chess for a decade with numerous tournament wins and five title matches against Kasparov.",
      },
      {
        q: "What is Karpov's playing style?",
        a: "Karpov is the master of positional squeeze — he preferred prophylaxis, restriction of opponent's pieces, and the slow accumulation of tiny advantages. He rarely launched speculative attacks, but his technique was virtually flawless.",
      },
      {
        q: "How many times did Karpov play Kasparov for the world title?",
        a: "Karpov and Kasparov played five World Championship matches: the controversial 1984 match (abandoned at 5–3 to Karpov), then 1985, 1986, 1987, and 1990. Kasparov won three, Karpov won once (1984, result annulled), and one was tied.",
      },
    ],
  },
  {
    id: "jose-capablanca",
    imageUrl:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/2/24/Jos%C3%A9_Ra%C3%BAl_Capablanca_1931.jpg/330px-Jos%C3%A9_Ra%C3%BAl_Capablanca_1931.jpg",
    name: "José Raúl Capablanca",
    fullName: "José Raúl Capablanca y Graupera",
    born: 1888,
    died: 1942,
    nationality: "Cuban",
    title: "Grandmaster",
    peakRating: 2725,
    worldChampion: true,
    championYears: "1921–1927",
    era: "classical",
    tagline:
      "José Raúl Capablanca — 'the chess machine' — possessed the most natural chess talent in history, winning games with effortless clarity and an endgame technique that defined the term 'technical perfection'.",
    bio: "José Raúl Capablanca learned chess at age 4 by watching his father, and was beating club players by 12. He defeated Emanuel Lasker for the World Championship in 1921 and went eight years without losing a single game. Capablanca's chess was uniquely clear and efficient — he wasted no moves, made no unnecessary complications, and converted endgames with machine-like precision. He lost the title to Alekhine in 1927 in one of the greatest upsets in chess history.",
    style: [
      "Natural clarity",
      "Simplicity as weapon",
      "Endgame technique",
      "Piece efficiency",
      "Strategic simplification",
      "Flawless technique",
    ],
    openingsWhite: [
      {
        eco: "C00–C19",
        name: "Queen's Gambit / Ruy Lopez",
        notes:
          "Capablanca favored solid, classical openings. He rarely played sharp gambits, preferring to reach middlegames where his superior piece placement would win slowly.",
      },
    ],
    openingsBlack: [
      {
        eco: "C60–C99",
        name: "Ruy Lopez (as Black)",
        notes:
          "Capablanca handled the Ruy Lopez from both sides with equal mastery. As Black he often steered into endgames early, confident in his conversion technique.",
      },
      {
        eco: "E00–E09",
        name: "Nimzo-Indian / Queen's Indian setups",
        notes:
          "Capablanca was among the first to refine these Indian Defense systems, demonstrating how Black could achieve dynamic equality without sharp counterplay.",
      },
    ],
    lessonsToLearn: [
      "Study Capablanca's endgames — they are the clearest, most instructive in chess history",
      "Simplify when you have an advantage — trading into a winning endgame is often better than attacking",
      "Every piece should have a purpose; eliminate inefficiency in your piece placement",
      "Learn 'Capablanca's Rule' of rook endgames: king activity is often more important than material",
    ],
    highlights: [
      "World Chess Champion 1921–1927",
      "Went 8 years (1914–1924) without losing a single game",
      "US Chess Champion 1909, defeating Frank Marshall decisively",
      "Won the 1914 St. Petersburg tournament ahead of Lasker and Alekhine",
      "His endgame technique remains the benchmark studied by all serious players",
    ],
    famousGameIds: ["capablanca-lasker-1914"],
    faqs: [
      {
        q: "Was Capablanca's talent truly natural?",
        a: "Capablanca famously said he never studied chess seriously. He learned by watching, developed understanding intuitively, and rarely analyzed games at home. Whether fully true or not, his play appeared more natural and effortless than any player before or since.",
      },
      {
        q: "How did Capablanca lose the World Championship?",
        a: "Alexander Alekhine defeated Capablanca in 1927 in the longest World Championship match ever played (34 games). Alekhine prepared deeply for the match and used sharp, complicated positions to negate Capablanca's technical mastery. Capablanca never got a rematch despite demanding one repeatedly.",
      },
      {
        q: "What is Capablanca's most famous endgame lesson?",
        a: "Capablanca's rook endgame technique — particularly his understanding of when to activate the king and when to use the rook actively — set the standard. His game against Tartakower (1924) is studied in every serious endgame textbook.",
      },
    ],
  },
  {
    id: "viswanathan-anand",
    imageUrl:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/5/57/Viswanathan_Anand_%282016%29_%28cropped%29.jpeg/330px-Viswanathan_Anand_%282016%29_%28cropped%29.jpeg",
    name: "Viswanathan Anand",
    fullName: "Viswanathan Anand",
    born: 1969,
    nationality: "Indian",
    title: "Grandmaster",
    peakRating: 2817,
    worldChampion: true,
    championYears: "2007–2013",
    era: "contemporary",
    tagline:
      "Viswanathan Anand — the fastest chess mind in history — broke Soviet dominance of world chess, won the title via three different formats, and became India's greatest chess hero.",
    bio: "Viswanathan Anand became India's first grandmaster in 1988 and is one of the few players to win world championship titles across classical, rapid, and knockout formats. Called 'Vishy' or 'The Tiger from Madras', Anand was renowned for his lightning-fast calculation — he often moved within seconds where others took minutes. He held the classical world title from 2007 to 2013, defeating Kramnik, Topalov, and Gelfand before losing to Magnus Carlsen. At his peak he was equally dangerous in all phases of the game.",
    style: [
      "Lightning speed",
      "Universal versatility",
      "Deep preparation",
      "Sharp tactical vision",
      "Adaptability",
      "Rapid endgame technique",
    ],
    openingsWhite: [
      {
        eco: "C60–C99",
        name: "Ruy Lopez",
        notes:
          "Anand's Ruy Lopez is characterized by deep preparation — he often introduced novelties 20+ moves deep in main lines, catching well-prepared opponents off guard.",
      },
      {
        eco: "B20–B99",
        name: "Sicilian (Anti-Sicilian systems)",
        notes:
          "Against the Sicilian, Anand adapted his weapons throughout his career, ranging from the Najdorf with White to the Alapin and c3-Sicilian.",
      },
    ],
    openingsBlack: [
      {
        eco: "D80–D99",
        name: "Grünfeld Defense",
        notes:
          "The Grünfeld gave Anand the dynamic counterplay he preferred as Black. His Grünfeld preparation was famously deep.",
      },
      {
        eco: "B80–B89",
        name: "Sicilian Najdorf",
        notes:
          "Like Kasparov, Anand used the Najdorf for sharp, dynamic games. His Najdorf analysis helped push opening theory further than ever before.",
      },
    ],
    lessonsToLearn: [
      "Speed in chess can be trained — Anand's fast play came from recognizing patterns instantly",
      "Adapt your opening repertoire throughout your career; what works at 20 may not at 40",
      "Study universal players: Anand's ability to play all styles is a model for improvement",
      "Even at the top level, classic calculation principles apply — candidate moves, comparison, decision",
    ],
    highlights: [
      "World Chess Champion 2007–2013 (classical title)",
      "World Rapid Champion 2003, 2017",
      "World Blitz Champion 2017",
      "India's first grandmaster (1988)",
      "Won the World Championship in three different formats: classical match, rapid knockout, and classical knockout",
      "Defeated Karpov, Kramnik, Topalov, Spassky, and others in title matches",
    ],
    famousGameIds: ["aronian-anand-2013"],
    faqs: [
      {
        q: "Why is Anand called 'The Tiger from Madras'?",
        a: "The nickname refers to Anand's birthplace (Madras, now Chennai, India) and his aggressive, dangerous play. He was known for lightning-fast tactical attacks.",
      },
      {
        q: "What format did Anand first win the World Championship in?",
        a: "Anand won his first undisputed world title in 2007 in a double round-robin tournament in Mexico City, ahead of Kramnik, Gelfand, Svidler, and others.",
      },
      {
        q: "Is Anand still playing chess?",
        a: "Yes. Anand remains an active grandmaster and is involved in promoting chess in India, which has produced a new generation of world-class players including Gukesh Dommaraju, who became world champion in 2024.",
      },
    ],
  },
  {
    id: "paul-morphy",
    imageUrl:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b2/PaulCharlesMorphy.jpg/330px-PaulCharlesMorphy.jpg",
    name: "Paul Morphy",
    fullName: "Paul Charles Morphy",
    born: 1837,
    died: 1884,
    nationality: "American",
    title: "Unofficial World Champion",
    peakRating: 2690,
    worldChampion: true,
    championYears: "1857–1858 (informal)",
    era: "romantic",
    tagline:
      "Paul Morphy was the first chess genius — completing development, controlling open files, and sacrificing freely, he beat every opponent in the world by 1858 before retiring from chess at 21.",
    bio: "Paul Morphy learned chess at 10 and was beating strong adult players by 12. He won the First American Chess Congress at 20, then traveled to Europe and defeated every leading player — Anderssen, Löwenthal, Harrwitz — sometimes giving knight odds. His game was revolutionary for its era: while opponents played slowly and without central principles, Morphy developed rapidly, occupied open files with rooks, and punished any delay instantly. He retired from chess at 21 and played virtually no more competitive games, spending the rest of his life in obscurity.",
    style: [
      "Rapid development",
      "Open file control",
      "King safety priority",
      "Piece coordination",
      "Punishing delays",
      "Classical principles personified",
    ],
    openingsWhite: [
      {
        eco: "C50–C59",
        name: "Italian Game / Giuoco Piano",
        notes:
          "Morphy favored open, classical openings that allowed maximum piece development. He turned the Italian Game into a vehicle for rapid mobilization and attack.",
      },
      {
        eco: "C20–C29",
        name: "King's Gambit",
        notes:
          "The King's Gambit suited Morphy perfectly — offering a pawn for rapid development and open lines. His King's Gambit games epitomize romantic-era attacking chess.",
      },
    ],
    openingsBlack: [
      {
        eco: "C60–C69",
        name: "Ruy Lopez (as Black)",
        notes:
          "Morphy handled the Ruy Lopez from both sides, emphasizing rapid development and counterplay before opponents could consolidate.",
      },
    ],
    lessonsToLearn: [
      "Develop all pieces before attacking — Morphy invented this principle and won games with it before anyone else understood it",
      "Every tempo matters: punish opponents who waste moves or develop pieces to passive squares",
      "Rooks belong on open files — Morphy's use of rooks in the middlegame was decades ahead of his time",
      "Study the Opera Game as a perfect beginner's guide to classical development principles",
    ],
    highlights: [
      "Won the First American Chess Congress at 20 (1857)",
      "Defeated all the world's leading players on his 1858 European tour",
      "Beat Anderssen, the best European player, in a match",
      "Gave knight odds to weaker players and still won easily",
      "Retired at 21 — arguably still the best in the world at the time",
    ],
    famousGameIds: ["opera-game", "morphy-paulsen-1857"],
    faqs: [
      {
        q: "Why did Paul Morphy retire from chess so young?",
        a: "Morphy retired from competitive chess around age 21, reportedly frustrated that no strong player would accept his challenges on even terms without odds. He also wanted to pursue a law career, though his chess fame made it difficult to attract clients.",
      },
      {
        q: "Was Paul Morphy the first World Chess Champion?",
        a: "Morphy was the informal world champion — no official title existed yet. Wilhelm Steinitz became the first officially recognized World Chess Champion in 1886, two years after Morphy's death.",
      },
      {
        q: "What made Morphy's chess so revolutionary?",
        a: "Morphy applied classical development principles (rapid mobilization, open files, king safety) decades before they were formally articulated. His opponents played passively and slowly; Morphy punished every tempo wasted with immediate tactical consequences.",
      },
    ],
  },
  {
    id: "judit-polgar",
    imageUrl:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/8/85/Judit_Polg%C3%A1r_2013.jpg/330px-Judit_Polg%C3%A1r_2013.jpg",
    name: "Judit Polgár",
    fullName: "Judit Polgár",
    born: 1976,
    nationality: "Hungarian",
    title: "Grandmaster",
    peakRating: 2735,
    worldChampion: false,
    era: "contemporary",
    tagline:
      "Judit Polgár — the strongest female chess player in history — broke every gender barrier in chess, achieved the grandmaster title at 15 (beating Fischer's record), and reached a peak ranking of number 8 in the world.",
    bio: "Judit Polgár was trained from birth by her father László as part of an educational experiment to prove that any child could achieve excellence with proper training. She became the strongest female player in history, broke Bobby Fischer's record for youngest grandmaster at 15, and at her peak was ranked number 8 in the world — defeating world champions Kasparov, Karpov, Anand, Topalov, and Spassky. She retired in 2014 and now dedicates her energy to chess education.",
    style: [
      "Aggressive attacking",
      "Tactical sharpness",
      "Fearless sacrifices",
      "Psychological strength",
      "Sharp opening repertoire",
      "Initiative-seeking",
    ],
    openingsWhite: [
      {
        eco: "C60–C99",
        name: "Ruy Lopez",
        notes:
          "Polgar played aggressive Ruy Lopez systems with White, often choosing the most combative options to unbalance the position.",
      },
      {
        eco: "B20–B99",
        name: "Anti-Sicilian systems",
        notes:
          "Against the Sicilian, Polgar often chose aggressive Anti-Sicilian setups to avoid deep preparation while maintaining attacking chances.",
      },
    ],
    openingsBlack: [
      {
        eco: "B80–B89",
        name: "Sicilian Najdorf",
        notes:
          "The Najdorf gave Polgar the sharp, tactical positions she thrived in. Her Najdorf games against top GMs are models of counterattacking chess.",
      },
      {
        eco: "C00–C19",
        name: "French Defense",
        notes:
          "Polgar used the French Defense for its solid structure and active counterplay ideas, transforming it into an attacking weapon.",
      },
    ],
    lessonsToLearn: [
      "Gender is irrelevant to chess strength — study Polgar's games with the same attention as any world champion",
      "Aggression and initiative can overcome material deficits — Polgar regularly sacrificed for the attack",
      "Study Polgar's queen sacrifice games as masterclasses in evaluating speculative piece sacrifices",
      "Belief in your own ability is itself a competitive weapon — Polgar never accepted limits imposed by others",
    ],
    highlights: [
      "Grandmaster at 15 years, 4 months, 28 days — beating Fischer's record",
      "Peak world ranking: #8",
      "Defeated World Champions Kasparov, Karpov, Anand, Topalov, Spassky",
      "Represented Hungary at 10 Chess Olympiads with a gold medal performance",
      "Won the 1994 Dos Hermanas brilliancy prize with her queen sacrifice against Karpov",
    ],
    famousGameIds: ["polgar-karpov-1994"],
    faqs: [
      {
        q: "Is Judit Polgar better than any current female chess player?",
        a: "Judit Polgar's peak rating of 2735 remains far above any other female player in history. Hou Yifan is second at around 2670. No other female player has come close to reaching the male world top 10 as Polgar did.",
      },
      {
        q: "Did Judit Polgar ever play for the Women's World Championship?",
        a: "Polgar famously refused to play Women's World Championship events, preferring to compete in open tournaments against male grandmasters. She believed separating women's chess created a lower standard to aspire to.",
      },
      {
        q: "Who trained Judit Polgar?",
        a: "Judit and her sisters Sofia and Susan were trained by their father László Polgár, who believed that geniuses are made, not born. All three became chess prodigies; Judit became the greatest female player in history.",
      },
    ],
  },
  {
    id: "vladimir-kramnik",
    imageUrl:
      "https://upload.wikimedia.org/wikipedia/commons/c/c6/Vladimir_Kramnik_2%2C_Candidates_Tournament_2018.jpg",
    name: "Vladimir Kramnik",
    fullName: "Vladimir Borisovich Kramnik",
    born: 1975,
    nationality: "Russian",
    title: "Grandmaster",
    peakRating: 2817,
    worldChampion: true,
    championYears: "2000–2007",
    era: "contemporary",
    tagline:
      "Vladimir Kramnik — Big Vlad — dethroned Kasparov with the Berlin Defense, invented an entire era of solid strategic chess, and was a classicist who combined Capablanca's clarity with modern computer-era preparation.",
    bio: "Vladimir Kramnik was a Kasparov student who became his student's greatest nightmare: in the 2000 World Championship match in London, he deployed the Berlin Defense repeatedly and neutralized Kasparov's every attacking attempt, winning the match without losing a single game. Kramnik's style was profoundly classical — precise, efficient, and technically flawless. He held the classical world title until losing to Anand in 2007. His contribution to opening theory, especially the Berlin Wall, permanently changed elite chess at the top level.",
    style: [
      "Classical clarity",
      "Strategic solidity",
      "Technical perfection",
      "Berlin Defense specialist",
      "Deep positional understanding",
      "Prophylaxis",
    ],
    openingsWhite: [
      {
        eco: "D10–D19",
        name: "Queen's Gambit / Catalan",
        notes:
          "Kramnik's Catalan was one of the most feared systems in elite chess — the bishop on g2 created lasting pressure and his endgame technique meant any slight advantage was dangerous.",
      },
      {
        eco: "A10–A39",
        name: "English Opening",
        notes:
          "The English allowed Kramnik to steer away from sharp theory and play the kind of long, maneuvering game where his positional understanding dominated.",
      },
    ],
    openingsBlack: [
      {
        eco: "C65",
        name: "Berlin Defense (Berlin Wall)",
        notes:
          "Kramnik's Berlin Defense defeated Kasparov in 2000 and changed chess history. He accepted a slightly passive position in exchange for structural solidity and endgame chances — and converted with machine precision.",
      },
      {
        eco: "E00–E09",
        name: "Nimzo-Indian / Queen's Indian",
        notes:
          "Kramnik's Nimzo-Indian was characteristically solid and deep — he would equalize quietly and then outplay opponents in the resulting endgames.",
      },
    ],
    lessonsToLearn: [
      "Study the Berlin Defense — Kramnik's games show how to build a fortress and convert endgame edges",
      "Catalan pawn structure: learn how the g2-bishop creates long-term pressure even after simplification",
      "Prophylaxis beats aggression: stop your opponent's plan before executing your own",
      "Kramnik's endgame technique rivals Capablanca's — study his rook and minor piece endings",
    ],
    highlights: [
      "World Chess Champion 2000–2007",
      "Defeated Kasparov 8.5–6.5 in 2000 without losing a game",
      "Peak rating 2817 (co-record at the time)",
      "Won the prestigious Dortmund tournament 10 times",
      "Revolutionized elite chess with the Berlin Defense",
    ],
    famousGameIds: ["fischer-spassky-g6-1972"],
    faqs: [
      {
        q: "How did Kramnik beat Kasparov in 2000?",
        a: "Kramnik played the Berlin Defense every game with Black, entering rook endgames where his technique was equal to Kasparov's tactical genius. Kasparov, unable to create complications, lost the match 6.5–8.5 without Kramnik losing a single game.",
      },
      {
        q: "What is the Berlin Wall in chess?",
        a: "The Berlin Wall is a nickname for the Berlin Defense of the Ruy Lopez (1.e4 e5 2.Nf3 Nc6 3.Bb5 Nf6). After 4.O-O Nxe4 5.d4 Nd6 6.Bxc6 dxc6 7.dxe5 Nf5, Black has doubled pawns but extremely solid structure. Kramnik used it to defeat Kasparov.",
      },
      {
        q: "Is Kramnik still playing chess?",
        a: "Kramnik retired from professional competitive chess in 2019. He remains involved in chess commentary, analysis, and project work, and collaborated with DeepMind on chess AI research.",
      },
    ],
  },
  {
    id: "hikaru-nakamura",
    imageUrl:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/4/48/Nakamura_Hikaru_%2829290269410%29_%28cropped%29_%28cropped%29.jpg/330px-Nakamura_Hikaru_%2829290269410%29_%28cropped%29_%28cropped%29.jpg",
    name: "Hikaru Nakamura",
    fullName: "Hikaru Nakamura",
    born: 1987,
    nationality: "American",
    title: "Grandmaster",
    peakRating: 2816,
    worldChampion: false,
    era: "contemporary",
    tagline:
      "Hikaru Nakamura — America's most exciting chess player in 50 years — combined Fischer-era American grit with online chess mastery to become the world's top rapid/blitz player and a dominant chess streamer.",
    bio: "Hikaru Nakamura became America's youngest grandmaster in 2003 at age 15. He has been ranked as high as number 2 in the world and is one of the most recognizable chess personalities globally. Nakamura dominated online chess for years before streaming brought his razor-sharp tactical style to millions of new fans. A five-time US Champion, he has qualified for Candidates Tournaments twice and is as dangerous in classical chess as he is in rapid and blitz.",
    style: [
      "Tactical complexity",
      "Sharp preparation",
      "Online chess specialist",
      "Dynamic imbalances",
      "Rapid/blitz dominance",
      "Aggressive setups",
    ],
    openingsWhite: [
      {
        eco: "A00",
        name: "Nakamura's 1.b3 / Nimzowitsch-Larsen Attack",
        notes:
          "Nakamura frequently surprises opponents with unconventional first moves, including 1.b3 and offbeat Anti-Sicilian systems, to steer games away from opponents' heavy preparation.",
      },
      {
        eco: "C80–C99",
        name: "Ruy Lopez",
        notes:
          "When playing mainstream openings, Nakamura is a strong Ruy Lopez player with deep knowledge of the main lines.",
      },
    ],
    openingsBlack: [
      {
        eco: "B80–B89",
        name: "Sicilian Najdorf",
        notes:
          "The Najdorf gives Nakamura the sharp counterplay he loves. His online Najdorf preparation is legendary among faster time controls.",
      },
      {
        eco: "A10–A39",
        name: "English / King's Indian setups",
        notes:
          "Nakamura frequently uses King's Indian-style setups as Black regardless of White's first move, creating familiar pawn structures where he's deeply comfortable.",
      },
    ],
    lessonsToLearn: [
      "Blitz and rapid chess can genuinely improve your pattern recognition for classical games",
      "Opening surprises at the board (1.b3, etc.) are legitimate weapons in competitive chess",
      "Study Nakamura's tactical speed — his games demonstrate how quickly threats can be created",
      "Chess streaming makes the game accessible; use it to study top players' live decision-making",
    ],
    highlights: [
      "Five-time US Chess Champion (2005, 2009, 2012, 2015, 2019)",
      "Peak rating 2816 — tied for second-highest American rating ever (behind Fischer's final active rating)",
      "World Blitz Champion 2018",
      "Two-time Candidates Tournament participant (2016, 2022)",
      "One of the most followed chess streamers globally on Twitch and YouTube",
    ],
    famousGameIds: ["game-of-the-century"],
    faqs: [
      {
        q: "Is Hikaru Nakamura a chess streamer?",
        a: "Yes. Nakamura is one of the most popular chess streamers globally, with millions of followers on Twitch and YouTube. He streams both rapid/blitz games and educational content, and his streaming helped fuel the chess popularity boom during the pandemic.",
      },
      {
        q: "Has Nakamura ever played for the World Chess Championship?",
        a: "Nakamura has qualified for the Candidates Tournament twice but has not yet played in a World Championship match. He remains one of the top contenders in the current generation.",
      },
      {
        q: "What is Nakamura's best classical rating?",
        a: "Nakamura's peak classical rating was 2816, achieved in January 2015 — the second-highest rating ever achieved by an American player, behind only Bobby Fischer.",
      },
    ],
  },
  {
    id: "fabiano-caruana",
    imageUrl:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/3/36/Fabiano_Caruana_in_2025.jpg/330px-Fabiano_Caruana_in_2025.jpg",
    name: "Fabiano Caruana",
    fullName: "Fabiano Luigi Caruana",
    born: 1992,
    nationality: "Italian-American",
    title: "Grandmaster",
    peakRating: 2844,
    worldChampion: false,
    era: "contemporary",
    tagline:
      "Fabiano Caruana — the third-highest-rated player in chess history — pushed Magnus Carlsen to the brink in 2018, drawing all 12 classical World Championship games before losing in rapid tiebreaks.",
    bio: "Fabiano Caruana is an Italian-American grandmaster who became the highest-rated Western player in history with a peak of 2844. Trained in Europe, he burst onto the world stage in 2014 by winning the Sinquefield Cup with a dominant performance against the world's top players — a result considered one of the strongest tournament runs in chess history. In 2018 he challenged Magnus Carlsen for the World Championship, drawing all 12 classical games — an unprecedented result — before losing in rapid tiebreaks. A five-time US Chess Champion, Caruana is universally regarded as the second-best player in the world at his peak.",
    style: [
      "Universal mastery",
      "Deep theoretical preparation",
      "Positional precision",
      "Endgame technique",
      "Classical opening repertoire",
      "Tactical accuracy",
    ],
    openingsWhite: [
      {
        eco: "C60–C99",
        name: "Ruy Lopez",
        notes:
          "Caruana's Ruy Lopez is deeply prepared — he introduced several theoretical novelties in the Marshall Attack and Spanish Torture lines. His positional play in the opening is considered model technique.",
      },
      {
        eco: "B20–B99",
        name: "Sicilian (various systems)",
        notes:
          "Caruana adapts to his opponent's Sicilian — prepared in the Open Sicilian, English Attack, and various Anti-Sicilian systems, making him unpredictable.",
      },
    ],
    openingsBlack: [
      {
        eco: "C65",
        name: "Berlin Defense",
        notes:
          "Like Carlsen, Caruana relies heavily on the Berlin Defense. His Berlin endgame technique is among the best in the world.",
      },
      {
        eco: "E60–E99",
        name: "King's Indian Defense",
        notes:
          "Caruana plays the King's Indian for dynamic counterplay in positions where he wants to fight for a win as Black rather than draw.",
      },
    ],
    lessonsToLearn: [
      "Perfect preparation: Caruana's openings are studied to a depth most players never reach",
      "Drawing isn't failure — 12 draws against the world champion requires elite accuracy over the board",
      "Study Caruana's 2014 Sinquefield Cup games as a masterclass in tournament domination",
      "Universal players demonstrate that you must be strong in all phases, not just tactics",
    ],
    highlights: [
      "Five-time United States Chess Champion",
      "2018 World Championship challenger — drew all 12 classical games vs Carlsen",
      "Peak rating 2844 — third-highest in chess history behind Kasparov and Carlsen",
      "2014 Sinquefield Cup: 8.5/10 against the world's top players (+7 =3 −0)",
      "Consistent top-3 world ranking for over a decade",
    ],
    famousGameIds: [],
    faqs: [
      {
        q: "Why didn't Caruana win the 2018 World Chess Championship?",
        a: "Caruana drew all 12 classical games against Carlsen — an unprecedented result. In the rapid tiebreaks, Carlsen's superior speed-chess skills proved decisive, winning 3–0. The match showed that Caruana matched Carlsen over the board in classical chess.",
      },
      {
        q: "What is Fabiano Caruana's peak chess rating?",
        a: "Caruana's peak FIDE rating was 2844, achieved in October 2014 — the third-highest classical rating in chess history, behind only Kasparov (2851) and Carlsen (2882).",
      },
      {
        q: "Where is Fabiano Caruana from?",
        a: "Caruana was born in Miami, Florida, grew up in Brooklyn, then trained in Europe (primarily Italy and Spain) before returning to represent the United States internationally.",
      },
    ],
  },
  {
    id: "ding-liren",
    imageUrl:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8a/DingLiren24a.jpg/330px-DingLiren24a.jpg",
    name: "Ding Liren",
    fullName: "Ding Liren",
    born: 1992,
    nationality: "Chinese",
    title: "Grandmaster",
    peakRating: 2816,
    worldChampion: true,
    championYears: "2023–2024",
    era: "contemporary",
    tagline:
      "Ding Liren — the first Chinese World Chess Champion — overcame psychological adversity and COVID-disrupted preparation to claim the 2023 world title, inspiring a generation of Asian players.",
    bio: "Ding Liren is a Chinese grandmaster who became the 17th World Chess Champion in 2023, defeating Ian Nepomniachtchi in rapid tiebreaks after the classical games ended tied. He is the first Chinese player to compete in a Candidates Tournament, the first to pass 2800 Elo, and the only Chinese World Champion. Ding's path to the title was unconventional — he entered after significant playing time lost during COVID lockdowns — yet produced brilliant and creative chess throughout the match. He lost the title to Gukesh Dommaraju in 2024, who became the youngest World Champion in history.",
    style: [
      "Creative dynamism",
      "Endgame precision",
      "Universal player",
      "Tactical vision",
      "Deep opening preparation",
      "Mental resilience",
    ],
    openingsWhite: [
      {
        eco: "D10–D29",
        name: "Queen's Gambit / Catalan",
        notes:
          "Ding favors the Catalan and Queen's Gambit for their strategic depth. His understanding of the resulting pawn structures is sophisticated and theoretically grounded.",
      },
      {
        eco: "C60–C99",
        name: "Ruy Lopez",
        notes:
          "Ding deploys the Ruy Lopez with deep preparation, often choosing the Berlin or Anti-Marshall lines for positional battles.",
      },
    ],
    openingsBlack: [
      {
        eco: "E00–E09",
        name: "Nimzo-Indian / Queen's Indian",
        notes:
          "Ding's Nimzo-Indian is a solid, well-prepared weapon. He often steers games into asymmetrical structures where his endgame technique gives him winning chances.",
      },
      {
        eco: "B80–B99",
        name: "Sicilian Defense",
        notes:
          "Against 1.e4, Ding is comfortable in Sicilian positions, adapting his approach based on the opponent's system.",
      },
    ],
    lessonsToLearn: [
      "Mental resilience under pressure: Ding won the world title despite difficult personal circumstances",
      "Creativity can overcome preparation: several of Ding's 2023 World Championship games featured original ideas",
      "Chinese players today are among the world's best — study their games for fresh, modern approaches",
      "Don't underestimate yourself: Ding was considered the underdog in the 2023 match and won",
    ],
    highlights: [
      "17th World Chess Champion 2023–2024",
      "First Chinese player to pass 2800 Elo",
      "First Chinese player to compete in a Candidates Tournament",
      "Three-time Chinese Chess Champion",
      "Chess Olympiad gold with China (2014, 2018)",
      "Peak Rapid rating of 2830 — World No. 1 in July 2023",
    ],
    famousGameIds: [],
    faqs: [
      {
        q: "How did Ding Liren win the 2023 World Chess Championship?",
        a: "Ding defeated Ian Nepomniachtchi in a 14-game classical match that ended 3.5–3.5. In the rapid tiebreaks, Ding won decisively to claim the title. The match was noted for its dramatic swings and psychological intensity.",
      },
      {
        q: "Who defeated Ding Liren for the world title?",
        a: "Ding Liren lost the World Championship to D Gukesh in 2024. Gukesh, aged 18, became the youngest World Chess Champion in history.",
      },
      {
        q: "Why is Ding Liren historically significant?",
        a: "Ding was the first Chinese player to win the World Chess Championship, marking a seismic shift in global chess. Chinese chess has since produced multiple elite players, and Gukesh's subsequent title continued the trend away from Western/Russian dominance.",
      },
    ],
  },
  {
    id: "ian-nepomniachtchi",
    imageUrl:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/8/88/Ian_Nepomniachtchi_in_2024_%28cropped_v2%29.jpg/330px-Ian_Nepomniachtchi_in_2024_%28cropped_v2%29.jpg",
    name: "Ian Nepomniachtchi",
    fullName: "Ian Alexandrovich Nepomniachtchi",
    born: 1990,
    nationality: "Russian",
    title: "Grandmaster",
    peakRating: 2795,
    worldChampion: false,
    era: "contemporary",
    tagline:
      "Ian Nepomniachtchi — 'Nepo' — is one of the sharpest tactical players in modern chess, a two-time World Championship challenger, and one of the very few players to win consecutive Candidates Tournaments.",
    bio: "Ian Nepomniachtchi is a Russian grandmaster known for extraordinarily sharp, creative play and exceptional speed chess ability. He won the 2020–21 Candidates Tournament to challenge Magnus Carlsen in 2021, losing a memorable match after a record-length game 6. His resilience earned him a second consecutive Candidates win in 2022, leading to a 2023 World Championship match against Ding Liren, which he lost in tiebreaks. Nepomniachtchi has held a top-5 world ranking for years and remains Russia's highest-rated active player.",
    style: [
      "Sharp tactical play",
      "Aggressive preparation",
      "Speed chess mastery",
      "Combinational creativity",
      "Dynamic imbalances",
      "Resourceful counterplay",
    ],
    openingsWhite: [
      {
        eco: "C80–C99",
        name: "Ruy Lopez / Italian Game",
        notes:
          "Nepo plays aggressive variations with White, often introducing sharp theoretical novelties to unbalance the position early and test opponents' preparation.",
      },
      {
        eco: "B20–B99",
        name: "Open Sicilian",
        notes:
          "Against the Sicilian, Nepomniachtchi favors the most aggressive lines — the English Attack and sharper Najdorf systems — seeking early complications.",
      },
    ],
    openingsBlack: [
      {
        eco: "C65–C67",
        name: "Berlin Defense",
        notes:
          "Nepo adapted the Berlin to his style, finding ways to create imbalances rather than just drawing — his Berlin games are notably more combative than Kramnik's classical approach.",
      },
      {
        eco: "A80–A99",
        name: "Dutch Defense",
        notes:
          "The Dutch is a sharp, unusual weapon Nepo employs to steer games away from ultra-theoretical lines into dynamic, creative positions.",
      },
    ],
    lessonsToLearn: [
      "Bounce back from losses: Nepo lost a World Championship match then immediately won the next Candidates to play again",
      "Speed chess training complements classical play: Nepo's rapid/blitz skills and classical preparation reinforce each other",
      "Sharp opening preparation matters — study Nepo's novelties to understand how preparation wins games",
      "Tactical creativity can overwhelm positional solidity when the complications become too deep to calculate",
    ],
    highlights: [
      "Two-time World Championship challenger (2021 vs Carlsen, 2023 vs Ding Liren)",
      "Won two consecutive Candidates Tournaments (2020–21 and 2022)",
      "2024 World Blitz Co-champion alongside Magnus Carlsen",
      "Russia's highest-rated active classical player",
      "Peak rating 2795",
      "Five-time Russian Chess Champion",
    ],
    famousGameIds: [],
    faqs: [
      {
        q: "What does 'Nepo' stand for?",
        a: "Nepo is a universal nickname for Ian Nepomniachtchi — a shortening of his lengthy surname that the chess world has adopted. Even official commentary and FIDE materials often use it.",
      },
      {
        q: "Why is game 6 of the 2021 World Championship so famous?",
        a: "Game 6 became the longest World Championship game in history (136 moves, over 7.5 hours). Nepomniachtchi had built a solid position but cracked under pressure in a complex endgame, giving Carlsen the decisive advantage. The loss appeared to unsettle Nepo psychologically for the rest of the match.",
      },
      {
        q: "Has Nepomniachtchi won a World Championship?",
        a: "No. Nepomniachtchi lost the 2021 World Championship to Magnus Carlsen (7.5–3.5) and the 2023 Championship to Ding Liren in rapid tiebreaks. He remains one of the elite contenders in modern chess.",
      },
    ],
  },
  {
    id: "eric-hansen",
    imageUrl:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/3/32/Eric_Hansen_2014_Iceland_-_Reykjavik_Tournament_%28cropped%29.jpg/330px-Eric_Hansen_2014_Iceland_-_Reykjavik_Tournament_%28cropped%29.jpg",
    name: "Eric Hansen",
    fullName: "Eric Hansen",
    born: 1992,
    nationality: "Canadian",
    title: "Grandmaster",
    peakRating: 2634,
    worldChampion: false,
    era: "contemporary",
    tagline:
      "Eric Hansen — 'Chessbrah' — is a Canadian GM who brought chess to millions of new fans through Twitch streaming and YouTube, pioneering an unfiltered, entertaining format that helped spark the global chess boom.",
    bio: "Eric Hansen is a Canadian grandmaster who earned his GM title in 2013 and went on to become one of the most influential chess content creators in the world. As one of the founders of the ChessBrah brand alongside IM Aman Hambleton, Hansen pioneered chess streaming on Twitch, creating an irreverent, entertaining format that attracted a new generation of chess fans. His aggressive, tactical style translates naturally to fast time controls where he excels. Hansen has represented Canada at multiple Chess Olympiads and remains one of the most recognizable personalities in online chess.",
    style: [
      "Aggressive and tactical",
      "Sharp opening play",
      "Blitz and bullet specialist",
      "Creative and unorthodox",
      "Initiative-seeking",
      "Entertaining over-the-board style",
    ],
    openingsWhite: [
      {
        eco: "B20–B99",
        name: "Open Sicilian / English Attack",
        notes:
          "Hansen favors aggressive Anti-Sicilian systems and the English Attack, seeking sharp, tactical battles from the very first moves.",
      },
      {
        eco: "C20–C29",
        name: "King's Gambit",
        notes:
          "A Hansen favorite in bullet and blitz — the King's Gambit creates immediate tactical complexity that suits his attacking style perfectly.",
      },
    ],
    openingsBlack: [
      {
        eco: "B09",
        name: "Pirc Defense",
        notes:
          "Hansen enjoys the Pirc Defense for its dynamic counterplay potential — inviting White to advance, then counterattacking sharply.",
      },
      {
        eco: "B20–B49",
        name: "Sicilian Defense (various)",
        notes:
          "As Black against 1.e4, Hansen is comfortable in many Sicilian lines, adapting to the opponent's system and creating imbalances early.",
      },
    ],
    lessonsToLearn: [
      "Chess streaming can help you improve — watching GM decision-making in real time builds intuition fast",
      "Aggressive, entertaining play is still strong play — Hansen's games prove that tactical chess wins at high levels",
      "Chess is fun: the ChessBrah content reminded the community that enjoyment and excellence can coexist",
      "Bullet and blitz training builds pattern recognition that transfers to longer time controls",
    ],
    highlights: [
      "Grandmaster title awarded 2013",
      "Co-founder of ChessBrah, one of the most popular chess YouTube and Twitch channels",
      "Represented Canada at Chess Olympiad (2012, 2014, 2016)",
      "Multiple Canadian Chess Championship competitor",
      "Pioneer of chess streaming on Twitch before the global chess boom",
    ],
    famousGameIds: [],
    faqs: [
      {
        q: "What is ChessBrah?",
        a: "ChessBrah is a chess brand created by Eric Hansen (GM) and Aman Hambleton (IM). They pioneered chess streaming on Twitch with an unfiltered, entertaining format. Their 'Can't Stop, Won't Stop' bullet series and blitz streams attracted millions of viewers and helped popularize online chess before the global boom.",
      },
      {
        q: "What is Eric Hansen's chess rating?",
        a: "Eric Hansen's peak FIDE classical rating is around 2634. He performs significantly stronger at faster time controls, consistently competing at GM level in blitz and bullet tournaments.",
      },
      {
        q: "Where is Eric Hansen from?",
        a: "Eric Hansen was born in the United States but represents Canada in international chess competition. He has played at multiple Chess Olympiads for Canada.",
      },
    ],
  },
  {
    id: "daniel-naroditsky",
    imageUrl:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/d/dc/DanielNaroditsky16_%28cropped%29.jpg/330px-DanielNaroditsky16_%28cropped%29.jpg",
    name: "Daniel Naroditsky",
    fullName: "Daniel Aaron Naroditsky",
    born: 1995,
    died: 2025,
    nationality: "American",
    title: "Grandmaster",
    peakRating: 2629,
    worldChampion: false,
    era: "contemporary",
    tagline:
      "Daniel Naroditsky — 'Danya' — was a brilliant American GM and beloved chess educator whose legendary Speed Run series taught millions of players how grandmasters really think at every rating level.",
    bio: "Daniel Naroditsky earned his grandmaster title at 17 and became one of chess's most beloved educators through his legendary 'Speed Run' series on Chess.com, playing through every rating bracket while explaining his thinking in real time. Known as 'Danya', he was also one of the world's best speed chess players, consistently placing at the top of elite online events. His gift was making grandmaster-level thinking genuinely accessible to players of all levels without dumbing it down. He passed away in 2025, leaving a legacy that continues to teach and inspire chess players worldwide.",
    style: [
      "Educational clarity",
      "Tactical precision",
      "Speed chess mastery",
      "Universal player",
      "Endgame technique",
      "Opening flexibility",
    ],
    openingsWhite: [
      {
        eco: "D10–D29",
        name: "Queen's Gambit / London System",
        notes:
          "Naroditsky was comfortable in a wide range of openings as White. He favored solid, instructive systems that let him demonstrate positional concepts clearly in his educational content.",
      },
      {
        eco: "C80–C99",
        name: "Ruy Lopez",
        notes:
          "Danya's Ruy Lopez was deeply theoretical and served double duty — a great competitive weapon and endless teaching material for his Speed Run episodes.",
      },
    ],
    openingsBlack: [
      {
        eco: "B80–B89",
        name: "Sicilian Najdorf",
        notes:
          "Naroditsky was a Najdorf devotee — his Speed Run games in the Najdorf provided millions of players with detailed explanations of this sharp, theoretical opening.",
      },
      {
        eco: "E60–E99",
        name: "King's Indian Defense",
        notes:
          "The KID gave Naroditsky rich, complex positions ideal for demonstrating dynamic thinking and counterattacking ideas.",
      },
    ],
    lessonsToLearn: [
      "Verbalize your thinking: Danya's greatest lesson was making explicit the calculation and evaluation that GMs do automatically",
      "Every rating level has its patterns — his Speed Run showed that the same principles apply from 100 to 2700",
      "Speed chess at a high level trains real chess: Danya's bullet games were deeply instructive, not just fast",
      "Teaching chess makes you better: Danya's ability to explain helped crystallize his own understanding",
    ],
    highlights: [
      "Grandmaster at 17 years old",
      "2007 World Youth Chess Champion (Under-12)",
      "2013 US Junior Chess Championship winner",
      "Speed Run series on Chess.com: millions of views, the most instructive GM series ever created",
      "2025 US Blitz Championship winner",
      "One of the youngest published chess authors in history (age 14)",
    ],
    famousGameIds: [],
    faqs: [
      {
        q: "What is the Danya Speed Run?",
        a: "The Speed Run is Daniel Naroditsky's legendary series on Chess.com where he played through every rating bracket on the platform — from ~100 to 3000+ — while explaining his thinking out loud in real time. It became the most-viewed chess educational series ever, showing exactly how a grandmaster thinks at every level.",
      },
      {
        q: "What was Daniel Naroditsky's peak chess rating?",
        a: "Naroditsky's peak classical FIDE rating was 2629. In online and speed chess events he consistently performed at higher levels.",
      },
      {
        q: "Did Daniel Naroditsky write any chess books?",
        a: "Yes — Naroditsky became one of the youngest published chess authors in history, writing 'Mastering Complex Endgames' at age 14. He later produced extensive written and video content for Chess.com that has educated millions of players.",
      },
    ],
  },
];
