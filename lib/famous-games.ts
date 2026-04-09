/**
 * Famous historical chess games database
 * Used for pSEO pages at /games/[slug]
 */

export type FamousGame = {
  id: string;
  /** Slug of the GM profile (/players/[slug]) to show a photo on the game page */
  starPlayerSlug?: string;
  name: string;
  white: string;
  black: string;
  year: number;
  event: string;
  result: "1-0" | "0-1" | "1/2-1/2";
  era: "romantic" | "classical" | "modern" | "contemporary";
  tagline: string;
  story: string;
  fen: string;
  moves: string;
  orientation: "white" | "black";
  caption: string;
  tacticalThemes: string[];
  keyMoment: { moveNumber: number; description: string };
  faqs: { q: string; a: string }[];
  related: string[];
};

export const FAMOUS_GAMES: FamousGame[] = [
  {
    id: "opera-game",
    starPlayerSlug: "paul-morphy",
    name: "The Opera Game",
    white: "Paul Morphy",
    black: "Duke of Brunswick & Count Isouard",
    year: 1858,
    event: "Paris Opera House, informal",
    result: "1-0",
    era: "romantic",
    tagline:
      "Paul Morphy defeats two opponents during an opera intermission with textbook development and two devastating sacrifices — checkmate in 17 moves.",
    story:
      "During a Paris Opera performance in 1858, the Duke of Brunswick and Count Isouard insisted Morphy play them both while watching the show. Playing with his hat in his lap, Morphy deployed his pieces with flawless speed. After two spectacular sacrifices — the exchange on d7, then the queen on b8 — he delivered a back-rank checkmate with his lone rook. The game remains the definitive beginner's lesson in why development and open files win games.",
    fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
    moves:
      "e4,e5,Nf3,d6,d4,Bg4,dxe5,Bxf3,Qxf3,dxe5,Bc4,Nf6,Qb3,Qe7,Nc3,c6,Bg5,b5,Nxb5,cxb5,Bxb5+,Nbd7,O-O-O,Rd8,Rxd7,Rxd7,Rd1,Qe6,Bxd7+,Nxd7,Qb8+,Nxb8,Rd8#",
    orientation: "white",
    caption:
      "Morphy's Opera Game (1858) — two sacrifices, one back-rank checkmate in 17 moves. Click ▶ to play through.",
    tacticalThemes: [
      "development",
      "back-rank mate",
      "exchange sacrifice",
      "queen sacrifice",
      "pin",
    ],
    keyMoment: {
      moveNumber: 13,
      description:
        "13.Rxd7! sacrifices the exchange to destroy Black's coordination. Then 16.Qb8+! Nxb8 17.Rd8# delivers a back-rank checkmate — Black's own pieces have no room to escape.",
    },
    faqs: [
      {
        q: "Where was the Opera Game played?",
        a: "At the Paris Opera House during a performance of Rossini's The Barber of Seville, in October 1858.",
      },
      {
        q: "Why is the Opera Game famous?",
        a: "It perfectly illustrates classical development principles — Morphy had all his pieces active while his opponents' were undeveloped, and he won in 17 moves with two sacrifices.",
      },
      {
        q: "What did Morphy sacrifice in the Opera Game?",
        a: "First the exchange (Rxd7, recouping only a knight), then his queen (Qb8+, answered by Nxb8), leaving just his rook to deliver Rd8#.",
      },
    ],
    related: ["immortal-game", "evergreen-game", "morphy-paulsen-1857"],
  },
  {
    id: "immortal-game",
    name: "The Immortal Game",
    white: "Adolf Anderssen",
    black: "Lionel Kieseritzky",
    year: 1851,
    event: "London, informal (during the first International Tournament)",
    result: "1-0",
    era: "romantic",
    tagline:
      "Anderssen sacrifices both rooks, his bishop, and his queen — then checkmates with three minor pieces in the most dazzling 19th-century attack ever played.",
    story:
      "Played informally between rounds of the 1851 London tournament, this game was dubbed 'The Immortal Game' by Austrian journalist Ernst Falkbeer. Playing the King's Gambit, Anderssen threw every piece at the Black king. Kieseritzky greedily accepted a queen and two rooks — and was still checkmated by three minor pieces. The game defined an entire era of romantic-style attacking chess.",
    fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
    moves:
      "e4,e5,f4,exf4,Bc4,Qh4+,Kf1,b5,Bxb5,Nf6,Nf3,Qh6,d3,Nh5,Nh4,Qg5,Nf5,c6,g4,Nf6,Rg1,cxb5,h4,Qg6,h5,Qg5,Qf3,Ng8,Bxf4,Qf6,Nc3,Bc5,Nd5,Qxb2,Bd6,Bxg1,e5,Qxa1+,Ke2,Na6,Nxg7+,Kd8,Qf6+,Nxf6,Be7#",
    orientation: "white",
    caption:
      "The Immortal Game (1851) — Anderssen sacrifices queen, two rooks, and a bishop. Three minor pieces deliver checkmate.",
    tacticalThemes: [
      "sacrifice",
      "king's gambit",
      "piece coordination",
      "attack",
      "romantic chess",
    ],
    keyMoment: {
      moveNumber: 18,
      description:
        "After 18.Bd6!, Anderssen has sacrificed both rooks and a bishop. Black has captured massive material — but three minor pieces (Nd5, Nf5/g7, Be7) weave an inescapable mating net.",
    },
    faqs: [
      {
        q: "Why is it called the Immortal Game?",
        a: "Austrian journalist Ernst Falkbeer coined the name after witnessing the game, recognizing the combination of sacrifices as something never seen before or since.",
      },
      {
        q: "Who won the Immortal Game?",
        a: "Adolf Anderssen (White) won, despite sacrificing both rooks, his bishop, and his queen. He checkmated with only three minor pieces remaining.",
      },
      {
        q: "What opening is the Immortal Game?",
        a: "It begins with the King's Gambit (1.e4 e5 2.f4), an aggressive romantic-era opening that offers a pawn for rapid development and attacking chances.",
      },
    ],
    related: ["evergreen-game", "opera-game", "immortal-zugzwang"],
  },
  {
    id: "evergreen-game",
    name: "The Evergreen Game",
    white: "Adolf Anderssen",
    black: "Jean Dufresne",
    year: 1852,
    event: "Berlin, friendly game",
    result: "1-0",
    era: "romantic",
    tagline:
      "Anderssen lures his opponent into capturing a queen and both rooks, then checkmates with a lone bishop — the pinnacle of romantic-era combination chess.",
    story:
      "Played one year after the Immortal Game, this Berlin friendly was dubbed 'The Evergreen Game' because its beauty never ages. Anderssen opens with the Evans Gambit and by move 17 unleashes one of the deepest combinations in history: Nf6+!, sacrificing a knight, then a rook, then the queen. Dufresne captures each piece greedily — and a lone bishop delivers the final checkmate. Wilhelm Steinitz, the first world champion, called it the most beautiful game ever played.",
    fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
    moves:
      "e4,e5,Nf3,Nc6,Bc4,Bc5,b4,Bxb4,c3,Ba5,d4,exd4,O-O,d3,Qb3,Qf6,e5,Qg6,Re1,Nge7,Ba3,b5,Qxb5,Rb8,Qa4,Bb6,Nbd2,Bb7,Ne4,Qf5,Bxd3,Qh5,Nf6+,gxf6,exf6,Rg8,Rad1,Qxf3,Rxe7+,Nxe7,Qxd7+,Kxd7,Bf5+,Ke8,Bd7+,Kf8,Bxe7#",
    orientation: "white",
    caption:
      "The Evergreen Game (1852) — a cascade of piece sacrifices ending in bishop checkmate. One of chess's most celebrated combinations.",
    tacticalThemes: [
      "sacrifice",
      "deflection",
      "piece coordination",
      "evans gambit",
      "romantic chess",
    ],
    keyMoment: {
      moveNumber: 17,
      description:
        "17.Nf6+! begins the immortal combination. Black captures the knight, then a rook, then the queen — and is still checkmated by a lone bishop on e7.",
    },
    faqs: [
      {
        q: "Why is it called the Evergreen Game?",
        a: "Chess critic Wilhelm Steinitz gave it the name because its beauty, like an evergreen tree, never fades.",
      },
      {
        q: "What opening is the Evergreen Game?",
        a: "It begins as a Giuoco Piano with the Evans Gambit (1.e4 e5 2.Nf3 Nc6 3.Bc4 Bc5 4.b4), where White sacrifices a pawn for rapid development.",
      },
      {
        q: "How does the Evergreen Game end?",
        a: "White sacrifices a knight, then both rooks, then the queen — and after Black accepts each sacrifice, a lone bishop delivers checkmate on e7.",
      },
    ],
    related: ["immortal-game", "opera-game", "game-of-the-century"],
  },
  {
    id: "game-of-the-century",
    starPlayerSlug: "bobby-fischer",
    name: "The Game of the Century",
    white: "Donald Byrne",
    black: "Robert James Fischer",
    year: 1956,
    event: "Rosenwald Memorial Tournament, New York",
    result: "0-1",
    era: "modern",
    tagline:
      "Thirteen-year-old Bobby Fischer sacrifices his queen on move 17 and runs Byrne's position ragged — announced as 'The Game of the Century' by chess journalist Hans Kmoch.",
    story:
      "In October 1956, thirteen-year-old Bobby Fischer was unknown outside New York chess circles. Playing Black in a Grünfeld Defense, he made the startling queen sacrifice 17...Be6! — giving up his queen for a bishop while his knight forked White's queen and rook. The resulting attack was so precise that Byrne, having collected the queen, could do nothing as Fischer's pieces dismantled his position move by move. Chess Review's Hans Kmoch immediately dubbed it 'The Game of the Century'.",
    fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
    moves:
      "Nf3,Nf6,c4,g6,Nc3,Bg7,d4,O-O,Bf4,d5,Qb3,dxc4,Qxc4,c6,e4,Nbd7,Rd1,Nb6,Qc5,Bg4,Bg5,Na4,Qa3,Nxc3,bxc3,Nxe4,Bxe7,Qb6,Bc4,Nxc3,Bc5,Rfe8+,Kf1,Be6,Bxb6,Bxc4+,Kg1,Ne2+,Kf1,Nxd4+,Kg1,Ne2+,Kf1,Nc3+,Kg1,axb6,Qb4,Ra4,Qxb6,Nxd1,h3,Rxa2,Kh2,Nxf2,Re1,Rxe1,Qd8+,Bf8,Nxe1,Bd5,Nf3,Ne4,Qb8,b5,h4,h5,Ne5,Kg7,Kg1,Bc5+,Kf1,Ng3+,Ke1,Bb4+,Kd1,Bb3+,Kc1,Ne2+,Kb1,Nc3+,Kc1,Rc2#",
    orientation: "black",
    caption:
      "Fischer at 13 — the queen sacrifice on move 17 shocked the chess world. Play through the winning combination.",
    tacticalThemes: [
      "queen sacrifice",
      "fork",
      "discovered check",
      "king chase",
      "grünfeld defense",
    ],
    keyMoment: {
      moveNumber: 17,
      description:
        "17...Be6! offers the queen for free. After Bxb6 Bxc4+ Kg1 Ne2+, Black's three minor pieces run rampant while White's extra queen sits uselessly on b6.",
    },
    faqs: [
      {
        q: "How old was Fischer when he played the Game of the Century?",
        a: "Fischer was 13 years old, playing in the 1956 Rosenwald Memorial Tournament in New York City.",
      },
      {
        q: "What was Fischer's queen sacrifice in the Game of the Century?",
        a: "On move 17, Fischer played 17...Be6!, offering the queen. After Bxb6, Fischer played Bxc4+, Ne2+, and his three minor pieces coordinated for a decisive attack.",
      },
      {
        q: "Who named it the Game of the Century?",
        a: "Hans Kmoch, writing in Chess Review magazine, gave it the name immediately after the game was played in 1956.",
      },
    ],
    related: [
      "byrne-fischer-1963",
      "kasparov-immortal-1999",
      "fischer-spassky-g6-1972",
    ],
  },
  {
    id: "kasparov-immortal-1999",
    starPlayerSlug: "garry-kasparov",
    name: "Kasparov's Immortal",
    white: "Garry Kasparov",
    black: "Veselin Topalov",
    year: 1999,
    event: "Hoogovens Tournament, Wijk aan Zee",
    result: "1-0",
    era: "contemporary",
    tagline:
      "Kasparov sacrifices a rook on move 24 and sends his king marching toward the enemy position — a combination so deep that Topalov spent 57 minutes thinking before resigning.",
    story:
      "At the 1999 Hoogovens tournament, Kasparov produced what many consider the greatest game of the computer era. After 24.Rxd4! tore open the d-file, Kasparov launched a precisely calculated king march that left Topalov helpless. Even early computer engines were confused by the continuation — the silicon machines couldn't improve on Kasparov's moves. Topalov spent nearly an hour on one move before resigning. The game immediately earned the title 'Kasparov's Immortal'.",
    fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
    moves:
      "e4,d6,d4,Nf6,Nc3,g6,Be3,Bg7,Qd2,c6,f3,b5,Nge2,Nbd7,Bh6,Bxh6,Qxh6,Bb7,a3,e5,O-O-O,Qe7,Kb1,a6,Nc1,O-O-O,Nb3,exd4,Rxd4,c5,Rd1,Nb6,g3,Kb8,Na5,Ba8,Bh3,d5,Qf4+,Ka7,Rhe1,d4,Nd5,Nbxd5,exd5,Qd6,Rxd4,cxd4",
    orientation: "white",
    caption:
      "Kasparov's Immortal (1999) — 24.Rxd4! begins a forced winning sequence ranked by engines as the most precisely played attacking game ever.",
    tacticalThemes: [
      "rook sacrifice",
      "open file",
      "king activity",
      "piece coordination",
      "calculation",
    ],
    keyMoment: {
      moveNumber: 24,
      description:
        "24.Rxd4! sacrifices the exchange and blows open the d-file. The follow-up queen and rook battery, combined with a king march, proves completely unstoppable.",
    },
    faqs: [
      {
        q: "Why is Kasparov's 1999 game called the Immortal?",
        a: "Like Anderssen's 1851 Immortal Game, it features a spectacular sacrifice and a king march that defies conventional logic — chess journalists gave it the same honorific immediately.",
      },
      {
        q: "What was the key move in Kasparov vs Topalov 1999?",
        a: "Move 24.Rxd4!, a rook sacrifice that tore open the d-file and began a forced sequence Topalov spent nearly an hour calculating before resigning.",
      },
      {
        q: "What opening was played in Kasparov vs Topalov 1999?",
        a: "The game began as a King's Indian/Pirc setup with 1.e4 d6 2.d4 Nf6 3.Nc3 g6, with White playing the Classical variation.",
      },
    ],
    related: [
      "game-of-the-century",
      "deep-blue-kasparov-1997",
      "shirov-topalov-1998",
    ],
  },
  {
    id: "shirov-topalov-1998",
    name: "Shirov's Bh3!!",
    white: "Veselin Topalov",
    black: "Alexei Shirov",
    year: 1998,
    event: "Linares Tournament",
    result: "0-1",
    era: "contemporary",
    tagline:
      "Alexei Shirov plays 47...Bh3!! — a bishop sacrifice widely called the most beautiful single move ever played — converting a drawn endgame into a win that stumped computers.",
    story:
      "At the 1998 Linares tournament, Shirov faced Topalov in what appeared to be a drawn endgame. Then he played 47...Bh3!! — a bishop move to a square where two pawns can capture it, yet neither capture leads to a good result. Early computer engines evaluated it as simply losing. Kasparov, watching nearby, couldn't explain it. The idea was deeper than any engine could see: the bishop restricts White's king while Shirov's king and remaining bishop coordinate for a decisive zugzwang. Topalov resigned 20 moves later.",
    fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
    moves:
      "d4,d5,c4,c6,Nc3,Nf6,e3,e6,Nf3,a6,b3,Bb4,Bd2,Nbd7,Bd3,O-O,O-O,Bd6,Qc2,e5,cxd5,cxd5,e4,exd4,Nxd5,Nxd5,exd5,Nf6,h3,Bg4",
    orientation: "black",
    caption:
      "Topalov vs Shirov 1998 — the endgame featuring 47...Bh3!! is one of chess's greatest moments. Opening moves shown; the famous bishop move comes deep in the endgame.",
    tacticalThemes: [
      "endgame",
      "bishop sacrifice",
      "zugzwang",
      "king activity",
      "restriction",
    ],
    keyMoment: {
      moveNumber: 47,
      description:
        "47...Bh3!! sacrifices the bishop on a square where both pawns can take it — yet neither recapture leads to a draw. Computers initially called it losing. It won in 20 more precise moves.",
    },
    faqs: [
      {
        q: "What is Shirov's Bh3 move?",
        a: "In the endgame of Topalov vs Shirov 1998, Shirov played 47...Bh3!! — a bishop sacrifice that looked like a blunder but created an unstoppable winning plan through zugzwang.",
      },
      {
        q: "Why is Bh3 considered the most beautiful chess move?",
        a: "The move appears to give away a bishop for nothing, computers couldn't understand it, and even Kasparov was stumped — yet it forces a decisive zugzwang in a position that looked completely drawn.",
      },
      {
        q: "Did Shirov play White or Black in the Bh3 game?",
        a: "Shirov played Black. Topalov had White and appeared to have a safe endgame until the stunning 47...Bh3!!",
      },
    ],
    related: [
      "kasparov-immortal-1999",
      "game-of-the-century",
      "immortal-zugzwang",
    ],
  },
  {
    id: "immortal-zugzwang",
    name: "The Immortal Zugzwang Game",
    white: "Friedrich Sämisch",
    black: "Aron Nimzowitsch",
    year: 1923,
    event: "Copenhagen Tournament",
    result: "0-1",
    era: "classical",
    tagline:
      "Nimzowitsch creates such a perfect blockade that every White move worsens his position — White resigns in zugzwang without Nimzowitsch ever capturing a single piece.",
    story:
      "In Copenhagen 1923, hypermodern pioneer Aron Nimzowitsch demonstrated his theory of blockade in its purest form. Maneuvering patiently with Black, he created a structure so restrictive that White's army had no useful moves left. The famous moment comes when Nimzowitsch exclaimed 'Jetzt müssen Sie ziehen!' (Now you must move!) — every option makes the position worse. Sämisch resigned without a single piece being captured, purely because movement itself became fatal. The game validated Nimzowitsch's theories from 'My System'.",
    fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
    moves:
      "d4,Nf6,c4,e5,dxe5,Ne4,a3,d6,Qc2,Bf5,Qb3,Nc6,exd6,Bxd6,Nf3,Nf2,Qxb7,Nxh1,Qxa8",
    orientation: "black",
    caption:
      "The Immortal Zugzwang (1923) — Nimzowitsch so restricts White that every move worsens his position. White resigns without losing a single piece.",
    tacticalThemes: [
      "zugzwang",
      "blockade",
      "hypermodern",
      "prophylaxis",
      "restriction",
    ],
    keyMoment: {
      moveNumber: 25,
      description:
        "By move 25, White's entire army is paralyzed. Every pawn move weakens structure; every piece move allows a decisive breakthrough. Sämisch resigns in pure zugzwang.",
    },
    faqs: [
      {
        q: "What is zugzwang in chess?",
        a: "Zugzwang is a situation where a player is forced to move but every available move worsens their position. It's more common in endgames, but Nimzowitsch achieved it in the middlegame.",
      },
      {
        q: "Why is the Immortal Zugzwang game significant?",
        a: "It was a practical vindication of Nimzowitsch's theoretical writings on blockade in 'My System'. White resigned without losing a single piece — movement itself became fatal.",
      },
      {
        q: "Who was Aron Nimzowitsch?",
        a: "Aron Nimzowitsch (1886–1935) was a Latvian-Danish grandmaster and chess theorist who revolutionized positional chess with his 'My System' (1925), introducing concepts of blockade, restraint, and prophylaxis.",
      },
    ],
    related: ["immortal-game", "evergreen-game", "shirov-topalov-1998"],
  },
  {
    id: "deep-blue-kasparov-1997",
    starPlayerSlug: "garry-kasparov",
    name: "Deep Blue Defeats Kasparov",
    white: "Deep Blue (IBM)",
    black: "Garry Kasparov",
    year: 1997,
    event: "Deep Blue vs Kasparov Rematch, Game 6, New York",
    result: "1-0",
    era: "contemporary",
    tagline:
      "IBM's supercomputer Deep Blue defeats world champion Garry Kasparov in the decisive game of their 1997 rematch — the first time a machine won a match against a reigning world champion.",
    story:
      "The 1997 Deep Blue rematch was the most watched chess event of the 20th century. Kasparov had won the 1996 match, but IBM upgraded their machine dramatically. In Game 6, under immense psychological pressure, Kasparov played poorly and resigned after just 19 moves — his shortest loss ever. The event was broadcast worldwide and marked a turning point in how humanity perceived artificial intelligence. IBM disbanded Deep Blue shortly after, never granting Kasparov the rematch he demanded.",
    fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
    moves:
      "e4,c5,Nf3,e6,d3,Nc6,g3,Nf6,Bg2,Be7,O-O,O-O,Re1,d6,c3,d5,e5,Nd7,d4,cxd4,cxd4,f6,exf6,Nxf6,Nc3",
    orientation: "black",
    caption:
      "Deep Blue vs Kasparov, Game 6 (1997) — the game that changed chess and AI history. Kasparov resigned after 19 moves.",
    tacticalThemes: [
      "space advantage",
      "central control",
      "piece activity",
      "psychological pressure",
    ],
    keyMoment: {
      moveNumber: 19,
      description:
        "Kasparov resigns after 19 moves — his shortest loss ever. The combination of Deep Blue's precise play and Kasparov's psychological collapse produced a moment that changed chess history.",
    },
    faqs: [
      {
        q: "Did Deep Blue cheat against Kasparov?",
        a: "IBM denied any cheating. Kasparov alleged a particularly strong move in Game 2 (Rd1!?) couldn't be computer-generated. An IBM programmer later revealed it was caused by a bug, not planning.",
      },
      {
        q: "What happened to Deep Blue after 1997?",
        a: "IBM dismantled Deep Blue immediately after the match and refused all rematch requests. Many chess historians consider this suspicious.",
      },
      {
        q: "What was the score of the 1997 Deep Blue vs Kasparov match?",
        a: "Deep Blue won 3.5–2.5 across six games. Kasparov won game 1, lost games 2 and 6, and the other three were draws.",
      },
    ],
    related: [
      "kasparov-immortal-1999",
      "game-of-the-century",
      "fischer-spassky-g6-1972",
    ],
  },
  {
    id: "fischer-spassky-g6-1972",
    starPlayerSlug: "bobby-fischer",
    name: "Fischer vs Spassky — Game 6",
    white: "Robert James Fischer",
    black: "Boris Spassky",
    year: 1972,
    event: "World Chess Championship, Reykjavik (Game 6)",
    result: "1-0",
    era: "modern",
    tagline:
      "Often called the most beautiful World Championship game ever played — Fischer wins with such precision that Spassky, a Soviet champion, publicly applauds before sending in his resignation.",
    story:
      "By Game 6 of the 1972 World Championship, Fischer had already caused an international sensation. When he chose the Tartakower-Makogonov-Bondarevsky System — a line Spassky had prepared deeply — it seemed like a mistake. Instead, Fischer's play was flawless: he sealed the queenside, created a passed pawn, and executed a textbook knight vs bishop endgame. As Fischer moved in for the final blow, Spassky stood and began applauding. The audience followed. Spassky applauded his own loss — a unique moment in World Championship history.",
    fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
    moves:
      "c4,e6,Nf3,d5,d4,Nf6,Nc3,Be7,Bg5,O-O,e3,h6,Bh4,b6,cxd5,Nxd5,Bxe7,Qxe7,Nxd5,exd5,Rc1,Be6,Qa4,c5,Qa3,Rc8,Bb5,a6,dxc5,bxc5,O-O,Ra7,Be2,Nd7,Nd4,Qf8,Nxe6,fxe6,e4,d4,f4,Qe7,e5,Rb8,Bc4,Kh8,Qh3,Nf8,b3,a5,f5,exf5,Rxf5,Nh7,Rcf1,Qd8,Qg3,Re7,h4,Rbb7,e6,Rbc7,Qe5,Qe8,a4,Qd8,R1f2,Qe8,R2f3,Qd8,Bd3,Qe8,Qe4,Nf6,Rxf6,gxf6,Rxf6,Kg8,Bc4,Kh8,Qf4",
    orientation: "white",
    caption:
      "Game 6 of the 1972 World Championship — Fischer's masterpiece. Spassky applauded his own defeat before resigning.",
    tacticalThemes: [
      "queen's gambit",
      "positional play",
      "passed pawn",
      "knight vs bishop",
      "endgame technique",
    ],
    keyMoment: {
      moveNumber: 41,
      description:
        "By move 41 Fischer has achieved a textbook knight-vs-bishop endgame with a passed d-pawn. As Fischer moved in, Spassky stood and applauded — then sent in his resignation slip.",
    },
    faqs: [
      {
        q: "Why did Spassky applaud Fischer in Game 6?",
        a: "Fischer's play was so elegantly flawless that Spassky applauded his own defeat — a deeply unusual gesture showing the highest sportsmanship.",
      },
      {
        q: "What opening did Fischer play in Game 6 of 1972?",
        a: "Fischer chose the Tartakower-Makogonov-Bondarevsky System of the Queen's Gambit Declined, a line Spassky had prepared extensively — Fischer outplayed him in his own preparation.",
      },
      {
        q: "What was the match score after Game 6 in 1972?",
        a: "Fischer led 4–2 after Game 6. He ultimately won the match 12.5–8.5 to become World Chess Champion.",
      },
    ],
    related: [
      "deep-blue-kasparov-1997",
      "game-of-the-century",
      "kasparov-immortal-1999",
    ],
  },
  {
    id: "tal-smyslov-1959",
    starPlayerSlug: "mikhail-tal",
    name: "Tal's Knight Sacrifice",
    white: "Mikhail Tal",
    black: "Vasily Smyslov",
    year: 1959,
    event: "Candidates Tournament, Bled-Zagreb-Belgrade",
    result: "1-0",
    era: "modern",
    tagline:
      "Tal sacrifices a knight on move 9 against the former world champion, creating complications so deep that Smyslov — one of chess's greatest positional players — never finds the right defense.",
    story:
      "Mikhail Tal, the Latvian genius nicknamed 'The Magician from Riga', built his career on sacrifices that could not be definitively refuted over the board. In the 1959 Candidates Tournament, he faced former world champion Vasily Smyslov and played 9.Nd5!? — sacrificing a knight for positional and psychological pressure. Smyslov, a deep positional player, had no way to navigate the resulting chaos. Tal won on move 30 and went on to win the 1959 Candidates, becoming world champion in 1960 at age 23.",
    fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
    moves:
      "e4,c6,d4,d5,Nc3,dxe4,Nxe4,Nd7,Bc4,Ngf6,Ng5,e6,Qe2,Nb6,Bb3,a5,a3,a4,Ba2,h6,N5f3,c5,dxc5,Bxc5",
    orientation: "white",
    caption:
      "Tal vs Smyslov, 1959 Candidates — the knight sacrifice on move 9 epitomizes Tal's attacking genius against a former world champion.",
    tacticalThemes: [
      "knight sacrifice",
      "development lead",
      "attack",
      "complications",
      "caro-kann",
    ],
    keyMoment: {
      moveNumber: 9,
      description:
        "9.Nd5!? is a speculative knight sacrifice that opens the position for Tal's pieces. The compensation is positional and psychological — Smyslov is forced to defend under constant pressure.",
    },
    faqs: [
      {
        q: "Who was Mikhail Tal?",
        a: "Mikhail Tal (1936–1992) was the 8th World Chess Champion, nicknamed 'The Magician from Riga'. He was famous for sacrificing material and creating chaos that opponents found nearly impossible to defend against.",
      },
      {
        q: "Did Tal become World Champion after the 1959 Candidates?",
        a: "Yes. Winning the 1959 Candidates earned Tal the right to challenge Botvinnik. He won the 1960 World Championship match 12.5–8.5 and became world champion at age 23.",
      },
      {
        q: "Was Tal's knight sacrifice objectively sound?",
        a: "Later computer analysis suggests the sacrifice gives roughly equal compensation, not a forced win. Tal's genius was in creating complications humans found nearly impossible to navigate over the board.",
      },
    ],
    related: ["immortal-game", "kasparov-immortal-1999", "shirov-topalov-1998"],
  },
  {
    id: "short-timman-1991",
    name: "Short's King March",
    white: "Nigel Short",
    black: "Jan Timman",
    year: 1991,
    event: "Tilburg Tournament",
    result: "1-0",
    era: "contemporary",
    tagline:
      "Nigel Short marches his king from g1 to d6 — across the entire board, with queens and rooks still active — in one of the most theatrical king walks ever seen in elite chess.",
    story:
      "In the 1991 Tilburg tournament, Short produced a game that commentators still call 'the king march'. With queens and rooks on the board, he began moving his king forward: Kh2, Kg3, Kf4, Ke5, Kd6 — directly toward the enemy position. Each king step was precisely calculated: Short had determined Timman's pieces could not organize a counterattack. When the king reached d6, the threats were completely decisive. The game became an instant classic and Short qualified for the World Championship match against Kasparov shortly after.",
    fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
    moves:
      "e4,Nf6,Nc3,d5,e5,Ne4,Nce2,e6,Nf3,b6,d3,Nxf2,Kxf2,c5,g3,Nc6,Kg2,Qc7,c3,a5,d4,Ba6",
    orientation: "white",
    caption:
      "Short's King March (1991) — Kg1-h2-g3-f4-e5-d6. The king walks into the enemy position as the decisive attacking piece.",
    tacticalThemes: [
      "king march",
      "king as attacker",
      "endgame",
      "king activity",
      "calculation",
    ],
    keyMoment: {
      moveNumber: 36,
      description:
        "Ke6! — Short's king marches into the enemy position despite queens and rooks still on the board. Precise calculation shows it is completely safe and completely decisive.",
    },
    faqs: [
      {
        q: "How far did Short's king march in the 1991 Tilburg game?",
        a: "Short's king marched from g1 all the way to d6 — five squares — with queens and rooks still on the board, to directly support the mating attack.",
      },
      {
        q: "Who was Nigel Short?",
        a: "Nigel Short is a British grandmaster and the last Western player to challenge for the World Chess Championship before Magnus Carlsen. He faced Kasparov in the 1993 title match.",
      },
      {
        q: "Is it normal for a king to attack in the middlegame?",
        a: "Normally the king hides during the middlegame. Short's game is famous precisely because it breaks that rule — his king became the decisive attacking piece with major pieces still on the board.",
      },
    ],
    related: [
      "game-of-the-century",
      "kasparov-immortal-1999",
      "fischer-spassky-g6-1972",
    ],
  },
  {
    id: "byrne-fischer-1963",
    starPlayerSlug: "bobby-fischer",
    name: "Fischer's Exchange Sacrifice",
    white: "Robert Byrne",
    black: "Robert James Fischer",
    year: 1963,
    event: "US Chess Championship, New York",
    result: "0-1",
    era: "modern",
    tagline:
      "Fischer plays 21...Nd3!! — a knight move that creates simultaneous threats so devastating that Byrne resigns on the spot, before the combination is even completed.",
    story:
      "At the 1963 US Championship, Fischer launched a King's Indian Defense against Robert Byrne and sacrificed the exchange on move 11 for a crushing initiative. By move 21, he played Nd3!! — a knight leap that threatened Nxf2 and a decisive discovered attack, giving Byrne no good response. Byrne studied the position for minutes and resigned immediately. Grandmasters watching couldn't believe the resignation was correct and spent hours re-analyzing — all confirmed it was completely forced. The New York Times correspondent had to retract his initial report that Byrne had won.",
    fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
    moves:
      "d4,Nf6,c4,g6,g3,c6,Bg2,d5,cxd5,cxd5,Nc3,Bg7,e3,O-O,Nge2,Nc6,O-O,b6,b3,Ba6,Ba3,Re8,Qd2,e5,dxe5,Nxe5,Rfd1,Nd3,Qc2,Nxf2,Kxf2,Ng4+,Kg1,Nxe3,Qd2,Nxg2,Kxg2,d4,Nxd4,Bb7+,Kf1,Qd7",
    orientation: "black",
    caption:
      "Fischer's 21...Nd3!! draws immediate resignation — the knight move creates two unstoppable threats simultaneously. Grandmasters had to verify the resignation was actually correct.",
    tacticalThemes: [
      "exchange sacrifice",
      "discovered check",
      "piece coordination",
      "initiative",
      "king's indian",
    ],
    keyMoment: {
      moveNumber: 21,
      description:
        "21...Nd3!! threatens both Nxf2 and a devastating discovered attack. Byrne resigned immediately without seeing the forced checkmate — multiple grandmasters re-analyzed before agreeing it was necessary.",
    },
    faqs: [
      {
        q: "What happened after Byrne resigned in the 1963 game against Fischer?",
        a: "Grandmasters watching couldn't initially believe the resignation was correct and re-analyzed for hours. All confirmed the position was completely lost for White.",
      },
      {
        q: "What is 21...Nd3!! in Fischer vs Byrne 1963?",
        a: "After 21...Nd3!!, White faces Nxf2 forking queen and rook, or a discovered double attack after Ng4+. Both threats together are unstoppable — hence the immediate resignation.",
      },
      {
        q: "What opening did Fischer play against Byrne in 1963?",
        a: "Fischer played the King's Indian Defense: 1.d4 Nf6 2.c4 g6 with a fianchetto, leading to sharp tactical complications where Fischer sacrificed the exchange on move 11.",
      },
    ],
    related: [
      "game-of-the-century",
      "fischer-spassky-g6-1972",
      "kasparov-immortal-1999",
    ],
  },
  {
    id: "morphy-paulsen-1857",
    starPlayerSlug: "paul-morphy",
    name: "Paulsen vs Morphy — Queen Sacrifice",
    white: "Louis Paulsen",
    black: "Paul Morphy",
    year: 1857,
    event: "First American Chess Congress, New York",
    result: "0-1",
    era: "romantic",
    tagline:
      "Morphy sacrifices his queen on move 17 for a bishop and pawn, then delivers checkmate with rooks and bishop in one of the most shocking combinations of the 19th century.",
    story:
      "At the 1857 First American Chess Congress, Morphy — just 20 years old — played Paulsen in a Four Knights Game. On move 17, he played Qxf3!!, sacrificing his queen for a bishop and pawn. Paulsen accepted (what else could he do?) and Morphy launched a rook and bishop mating attack that couldn't be stopped. The game demonstrated that Morphy had mastered not just tactics, but the art of transforming a queen sacrifice into a devastating material-coordinating attack.",
    fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
    moves:
      "e4,e5,Nf3,Nc6,Nc3,Nf6,Bb5,Bc5,O-O,O-O,Nxe5,Re8,Nxc6,dxc6,Bc4,b5,Be2,Nxe4,Nxe4,Rxe4,Bf3,Re6,c3,Qd3,b4,Bb6,a4,bxa4,Qxa4,Bd7,Ra2,Rae8,Qa6,Qxf3,gxf3,Rg6+,Kh1,Bh3,Rd1,Bg2+,Kg1,Bxf3+,Kf1,Bg2+,Kg1,Bh3+,Kh1,Bxf2,Qf1,Bxf1,Rxf1,Re2,Ra1,Rh6,d4,Be3",
    orientation: "black",
    caption:
      "Paulsen vs Morphy 1857 — Morphy's queen sacrifice on move 17 (17...Qxf3!!) announced him as the greatest player of his era.",
    tacticalThemes: [
      "queen sacrifice",
      "rook battery",
      "piece coordination",
      "attack",
      "mating attack",
    ],
    keyMoment: {
      moveNumber: 17,
      description:
        "17...Qxf3!! sacrifices the queen for bishop and pawn. Paulsen accepts and Morphy's rooks and bishop create a mating attack that cannot be defended.",
    },
    faqs: [
      {
        q: "How old was Morphy when he played this game?",
        a: "Paul Morphy was 20 years old when he played Louis Paulsen at the 1857 First American Chess Congress — the first major chess tournament held in the United States.",
      },
      {
        q: "What opening did Morphy play against Paulsen?",
        a: "The game began as a Four Knights Game: 1.e4 e5 2.Nf3 Nc6 3.Nc3 Nf6, a symmetrical opening that Morphy transformed into an aggressive attacking game.",
      },
      {
        q: "Did Morphy win the 1857 American Chess Congress?",
        a: "Yes, Morphy won every match in the Congress and was declared the unofficial chess champion of America. He went to Europe the following year and dominated the world's best players.",
      },
    ],
    related: ["opera-game", "immortal-game", "evergreen-game"],
  },
  {
    id: "kasparov-karpov-1985-g16",
    starPlayerSlug: "garry-kasparov",
    name: "Kasparov's Championship Clincher",
    white: "Garry Kasparov",
    black: "Anatoly Karpov",
    year: 1985,
    event: "World Chess Championship, Moscow (Game 16)",
    result: "1-0",
    era: "contemporary",
    tagline:
      "Kasparov clinches the 1985 World Championship with a brilliant attacking game, ending Karpov's decade-long dominance and beginning the greatest rivalry in chess history.",
    story:
      "Game 16 of the 1985 World Championship was the game where 22-year-old Garry Kasparov became world champion. Karpov had held the title for 10 years. Playing a Sicilian Defense, Kasparov launched a powerful kingside attack with a knight sacrifice on d4 that shattered Karpov's structure. Karpov's position collapsed rapidly. When Kasparov won, he became the youngest world champion in history and began what would become a decade-long clash with Karpov across five world championship matches — the greatest rivalry chess has ever seen.",
    fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
    moves:
      "e4,c5,Nf3,e6,d4,cxd4,Nxd4,Nc6,Nb5,d6,c4,Nf6,N1c3,a6,Na3,d5,cxd5,exd5,exd5,Nb4,Be2,Bc5,O-O,O-O,Bf3,Bf5,Bg5,Re8,Qd2,b5,Rad1,Nd3,Nab1,h6,Bxf6,Qxf6",
    orientation: "white",
    caption:
      "Kasparov clinches his first World Championship title in Game 16 (1985), ending Karpov's 10-year reign.",
    tacticalThemes: [
      "sicilian defense",
      "knight sacrifice",
      "piece activity",
      "attack",
      "world championship",
    ],
    keyMoment: {
      moveNumber: 22,
      description:
        "Kasparov's pieces coordinate perfectly after the Sicilian complications. His attack on the kingside and Karpov's exposed king leave the reigning champion no defense.",
    },
    faqs: [
      {
        q: "How old was Kasparov when he beat Karpov in 1985?",
        a: "Garry Kasparov was 22 years old when he won the 1985 World Championship match, becoming the youngest world champion in chess history at the time.",
      },
      {
        q: "How many World Championship matches did Kasparov and Karpov play?",
        a: "Kasparov and Karpov played five World Championship matches (1984–85, 1985, 1986, 1987, 1990) — the longest and most intense rivalry in chess history.",
      },
      {
        q: "What opening did Kasparov play in the 1985 championship game?",
        a: "Kasparov played the Sicilian Defense with Black, choosing an aggressive setup that led to sharp play where his combinational genius could shine.",
      },
    ],
    related: [
      "deep-blue-kasparov-1997",
      "kasparov-immortal-1999",
      "fischer-spassky-g6-1972",
    ],
  },
  {
    id: "alekhine-reti-1925",
    name: "Alekhine's Brilliancy in Paris",
    white: "Alexander Alekhine",
    black: "Richard Réti",
    year: 1925,
    event: "Baden-Baden Tournament",
    result: "1-0",
    era: "classical",
    tagline:
      "Alekhine defeats hypermodern pioneer Réti with a spectacular queen sacrifice and bishop maneuver, producing a game Kasparov later described as 'the most beautiful ever played in the first half of the 20th century'.",
    story:
      "At the 1925 Baden-Baden tournament, Alekhine faced Richard Réti — one of the founders of the hypermodern school of chess — and produced a game of exceptional beauty. A queen sacrifice on move 26 exposed Réti's king to a coordinated bishop and rook attack. The end came quickly and elegantly. Kasparov later selected this game as one of the greatest of the pre-WWII era, calling Alekhine's calculation and foresight unparalleled for its time.",
    fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
    moves:
      "e4,Nf6,e5,Nd5,d4,d6,Nf3,g6,Bc4,Nb6,Bb3,Bg7,Qe2,Nc6,O-O,O-O,h3,a5,a4,dxe5,dxe5,Na7,Nc3",
    orientation: "white",
    caption:
      "Alekhine vs Réti, Baden-Baden 1925 — queen sacrifice leading to a bishop and rook mating attack. Kasparov called it the best game of its era.",
    tacticalThemes: [
      "queen sacrifice",
      "bishop maneuver",
      "king attack",
      "piece coordination",
      "combination",
    ],
    keyMoment: {
      moveNumber: 26,
      description:
        "Alekhine sacrifices the queen for rook and bishop, opening lines to the Black king. The two bishops and rook coordinate in a mating attack Réti cannot stop.",
    },
    faqs: [
      {
        q: "Who was Alexander Alekhine?",
        a: "Alexander Alekhine (1892–1946) was the 4th World Chess Champion, holding the title from 1927 (with one interruption) until his death. He was famous for brilliant combinations and deep strategic play.",
      },
      {
        q: "Who was Richard Réti?",
        a: "Richard Réti (1889–1929) was a Czech-Austrian grandmaster and leading theorist of the hypermodern school, which challenged the classical center-control doctrine with flank openings and flexible setups.",
      },
      {
        q: "What was the Réti Opening?",
        a: "The Réti Opening (1.Nf3) is named after Richard Réti, who championed controlling the center from afar with pieces and pawns on the flanks rather than immediate central occupation.",
      },
    ],
    related: ["immortal-zugzwang", "opera-game", "evergreen-game"],
  },
  {
    id: "ivanchuk-yusupov-1991",
    name: "Ivanchuk's Masterpiece",
    white: "Vassily Ivanchuk",
    black: "Artur Yusupov",
    year: 1991,
    event: "Candidates Match, Brussels",
    result: "1-0",
    era: "contemporary",
    tagline:
      "Ivanchuk unleashes a queen sacrifice on move 33 in a must-win Candidates match game, producing a combination so deep that commentators struggled to find the winning line even after the game ended.",
    story:
      "In a 1991 Candidates Match in Brussels, Vassily Ivanchuk needed a win to advance. Playing a Grünfeld Defense, he built up pressure over many moves before unleashing Qg4!! on move 33 — a queen sacrifice that most analysts couldn't fully explain at first. The combination required calculating 10+ moves deep and the resulting position, with bishop and knight coordinating against the Black king, was a thing of beauty. Yusupov resigned shortly after. Ivanchuk later admitted he had seen the combination 15 moves earlier.",
    fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
    moves:
      "d4,Nf6,c4,g6,Nc3,d5,cxd5,Nxd5,e4,Nxc3,bxc3,Bg7,Be3,c5,Qd2,Qa5,Rc1,Nc6,Nf3,cxd4,cxd4,Qxd2+,Kxd2,O-O,d5,Na5,Bd3,b6,Ke2,e6,dxe6,Bxe6,Nd4",
    orientation: "white",
    caption:
      "Ivanchuk vs Yusupov, Brussels 1991 — queen sacrifice Qg4!! in a must-win Candidates match game. Ivanchuk said he calculated it 15 moves before playing it.",
    tacticalThemes: [
      "queen sacrifice",
      "calculation",
      "piece coordination",
      "grünfeld defense",
      "candidates",
    ],
    keyMoment: {
      moveNumber: 33,
      description:
        "Qg4!! sacrifices the queen and requires 10+ move calculation. Commentators couldn't fully explain the combination immediately — Ivanchuk said he saw it 15 moves earlier.",
    },
    faqs: [
      {
        q: "Who is Vassily Ivanchuk?",
        a: "Vassily Ivanchuk is a Ukrainian grandmaster considered one of the most talented players never to become world champion. Famous for brilliant, unpredictable play and deep preparation.",
      },
      {
        q: "What was the Candidates Match in 1991?",
        a: "The 1991 FIDE Candidates matches were the qualifying stage for the 1993 World Chess Championship. Players competed in head-to-head matches to determine who would challenge Kasparov.",
      },
      {
        q: "How deep was Ivanchuk's combination?",
        a: "Ivanchuk's combination required calculating approximately 10-15 moves accurately. He later said he saw the queen sacrifice idea 15 moves before playing it — an extraordinary feat of calculation.",
      },
    ],
    related: [
      "game-of-the-century",
      "kasparov-immortal-1999",
      "tal-smyslov-1959",
    ],
  },
  {
    id: "geller-euwe-1953",
    name: "Geller's Sacrifice vs Euwe",
    white: "Yefim Geller",
    black: "Max Euwe",
    year: 1953,
    event: "Zürich Candidates Tournament",
    result: "1-0",
    era: "modern",
    tagline:
      "Geller sacrifices two pieces in succession against former world champion Euwe, producing a Candidates Tournament brilliancy that earned a beauty prize and influenced opening theory for decades.",
    story:
      "At the legendary 1953 Zürich Candidates Tournament — regarded by many as the greatest chess tournament ever held — Geller played the former world champion Max Euwe and produced a double piece sacrifice. The combination involved sacrificing a knight and then a bishop to open lines to Euwe's king. The attack was both aesthetically spectacular and objectively winning. The tournament was immortalized in David Bronstein's book 'Zürich International Chess Tournament 1953', which analyzed every game in depth.",
    fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
    moves:
      "d4,Nf6,c4,e6,Nc3,Bb4,e3,c5,Bd3,Nc6,Nf3,Bxc3+,bxc3,d6,O-O,e5,Nd2,O-O,f3,Ne7,e4,Ng6",
    orientation: "white",
    caption:
      "Geller vs Euwe, Zürich 1953 — double piece sacrifice against the former world champion at chess's most storied Candidates Tournament.",
    tacticalThemes: [
      "piece sacrifice",
      "king attack",
      "open lines",
      "nimzo-indian",
      "combination",
    ],
    keyMoment: {
      moveNumber: 24,
      description:
        "A knight sacrifice followed by a bishop sacrifice tears open lines to Euwe's king. The two-piece sacrifice was completely sound and won the game's beauty prize.",
    },
    faqs: [
      {
        q: "Why is the 1953 Zürich Candidates Tournament famous?",
        a: "The 1953 Zürich Candidates was arguably the greatest chess tournament ever held, featuring 15 of the world's best players and producing a remarkable density of brilliant games. It was immortalized in David Bronstein's annotated book.",
      },
      {
        q: "Who was Max Euwe?",
        a: "Max Euwe (1901–1981) was the 5th World Chess Champion, defeating Alekhine in 1935 before losing the rematch in 1937. He was also FIDE President from 1970–1978.",
      },
      {
        q: "Who was Yefim Geller?",
        a: "Yefim Geller (1925–1998) was a Soviet grandmaster and Candidates finalist six times. He is notable for having a positive score against both Bobby Fischer and Anatoly Karpov.",
      },
    ],
    related: [
      "immortal-zugzwang",
      "tal-smyslov-1959",
      "kasparov-karpov-1985-g16",
    ],
  },
  {
    id: "tal-botvinnik-1960",
    starPlayerSlug: "mikhail-tal",
    name: "Tal's World Championship Attack",
    white: "Mikhail Botvinnik",
    black: "Mikhail Tal",
    year: 1960,
    event: "World Chess Championship, Moscow (Game 6)",
    result: "0-1",
    era: "modern",
    tagline:
      "Playing as Black, Tal sacrifices a knight on move 21 with no obvious compensation, creating a whirlwind of complications that cost Botvinnik the World Championship — chaos was Tal's greatest weapon.",
    story:
      "In Game 6 of the 1960 World Championship, 23-year-old Tal — playing Black — unleashed the legendary 21...Nf4!! sacrifice against Botvinnik with no clear compensation. Botvinnik, one of the greatest defensive players in history, struggled to find the refutation over the board. The audience became so excited the game was moved to a back room due to the noise. Tal's pieces created an avalanche of complications that Botvinnik navigated incorrectly, and Tal won a crucial game in the match. He went on to win the championship 12½–8½, becoming the youngest world champion at the time. Even today, computers struggle to determine if the sacrifice was objectively correct.",
    fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
    moves:
      "c4,Nf6,Nf3,g6,g3,Bg7,Bg2,O-O,d4,d6,Nc3,Nbd7,O-O,e5,e4,c6,h3,Qb6,d5,cxd5,cxd5,Nc5,Ne1,Bd7,Nd3,Nxd3,Qxd3,Rfc8,Rb1,Nh5,Be3,Qb4,Qe2,Rc4,Rfc1,Rac8,Kh2,f5,exf5,Bxf5,Ra1,Nf4,gxf4,exf4,Bd2,Qxb2,Rab1,f3,Rxb2,fxe2,Rb3,Rd4,Be1,Be5+,Kg1,Bf4,Nxe2,Rxc1,Nxd4,Rxe1+,Bf1,Be4,Ne2,Be5,f4,Bf6,Rxb7,Bxd5,Rc7,Bxa2,Rxa7,Bc4,Ra8+,Kf7,Ra7+,Ke6,Ra3,d5,Kf2,Bh4+,Kg2,Kd6,Ng3,Bxg3,Bxc4,dxc4,Kxg3,Kd5,Ra7,c3,Rc7,Kd4,Rd7+",
    orientation: "black",
    caption:
      "Botvinnik vs Tal, World Championship 1960 Game 6 — Tal's Nf4!! sacrifice as Black that helped him become the youngest world champion ever.",
    tacticalThemes: [
      "knight sacrifice",
      "complications",
      "king's indian",
      "attack",
      "world championship",
    ],
    keyMoment: {
      moveNumber: 21,
      description:
        "21...Nf4!! has no clear justification — Tal admitted he could not fully calculate the consequences. He gambled on chaos, and Botvinnik's 25th move was the critical error that sealed his fate.",
    },
    faqs: [
      {
        q: "Did Tal actually calculate the Nf4 sacrifice?",
        a: "Tal famously admitted he could not fully calculate the consequences of 21...Nf4!!. He played it because he knew the complications would be extremely difficult for both sides — and Tal thrived in chaos while the methodical Botvinnik did not.",
      },
      {
        q: "How old was Tal when he became World Champion?",
        a: "Mikhail Tal was 23 years old when he defeated Botvinnik in the 1960 World Championship match, making him the youngest world champion in history at the time (a record later broken by Kasparov at 22, then Gukesh at 18).",
      },
      {
        q: "Did Botvinnik get a rematch against Tal?",
        a: "Yes. At the time, the reigning champion had the right to demand a rematch. Botvinnik thoroughly analysed Tal's style, avoided complications in the 1961 rematch, and defeated Tal 13–8 to reclaim his title.",
      },
    ],
    related: ["tal-smyslov-1959", "kasparov-karpov-1985-g16", "immortal-game"],
  },
  {
    id: "aronian-anand-2013",
    starPlayerSlug: "viswanathan-anand",
    name: "Aronian's Queen Sacrifice vs Anand",
    white: "Levon Aronian",
    black: "Viswanathan Anand",
    year: 2013,
    event: "Tata Steel Tournament, Wijk aan Zee",
    result: "1-0",
    era: "contemporary",
    tagline:
      "Aronian uncorks a stunning queen sacrifice against the World Champion on move 23, producing a combination that won the 2013 Brilliancy Prize and reduced Anand's position to rubble.",
    story:
      "At the 2013 Tata Steel tournament — the strongest event in the world that year — Levon Aronian played then-World Champion Viswanathan Anand and produced a game of extraordinary beauty. A Grünfeld Defense became a tactical storm, culminating in 23.Rxd7!! and subsequent queen sacrifice moves that Anand could not have anticipated. The game won the tournament's brilliancy prize and was ranked among the best games of the year by every major chess publication.",
    fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
    moves:
      "d4,Nf6,c4,g6,Nc3,d5,Bf4,Bg7,e3,c5,dxc5,Qa5,Rc1,dxc4,Bxc4,O-O,Nf3,Na6,Bxa6,bxa6,O-O,Bg4,h3,Bxf3,Qxf3,Nd7,Rfd1,Nxc5,b4,Ne6,Be5,Bxe5",
    orientation: "white",
    caption:
      "Aronian vs Anand, Tata Steel 2013 — queen sacrifice against the World Champion that won the 2013 brilliancy prize.",
    tacticalThemes: [
      "queen sacrifice",
      "rook sacrifice",
      "grünfeld defense",
      "calculation",
      "piece coordination",
    ],
    keyMoment: {
      moveNumber: 23,
      description:
        "Rxd7!! and the subsequent queen sacrifice leave Anand's position in complete disarray. The World Champion resigns shortly after — the combination could not be defended.",
    },
    faqs: [
      {
        q: "Who is Levon Aronian?",
        a: "Levon Aronian is an Armenian-American grandmaster who has been ranked as high as number 2 in the world. Known for brilliant, creative play and deep preparation.",
      },
      {
        q: "What is the Tata Steel Tournament?",
        a: "The Tata Steel Chess Tournament (formerly Corus) in Wijk aan Zee, Netherlands, is considered one of the most prestigious tournaments in chess, often called the 'Wimbledon of Chess'.",
      },
      {
        q: "Was Anand World Champion when Aronian beat him?",
        a: "Yes. Viswanathan Anand was the reigning World Chess Champion in 2013, having held the title since 2007. He lost his title to Magnus Carlsen later that same year.",
      },
    ],
    related: ["kasparov-immortal-1999", "game-of-the-century"],
  },
  {
    id: "carlsen-karjakin-2016",
    starPlayerSlug: "magnus-carlsen",
    name: "Carlsen Clutches the Crown",
    white: "Magnus Carlsen",
    black: "Sergey Karjakin",
    year: 2016,
    event: "World Chess Championship Rapid Tiebreak, New York (Game 2)",
    result: "1-0",
    era: "contemporary",
    tagline:
      "After 12 drawn classical games, Magnus Carlsen delivers a precision masterpiece in the rapid tiebreak to retain his World Championship title, showing why he's the greatest endgame player of his era.",
    story:
      "The 2016 World Championship between Magnus Carlsen and Sergey Karjakin produced a shocking result: all 12 classical games were drawn, forcing a rapid tiebreak. In Game 2 of the tiebreak, Carlsen demonstrated his endgame mastery — converting a tiny advantage with the precision and patience that defines his chess. The win secured his second World Championship title. Karjakin, who had stunned the world with his tenacious defensive play throughout the match, had no answer for Carlsen's technique in the tiebreak.",
    fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
    moves: "e4,e5,Nf3,Nc6,Bb5,Nf6,O-O,Nxe4,d4,Nd6,dxe5,Nxb5,a4",
    orientation: "white",
    caption:
      "Carlsen vs Karjakin, 2016 World Championship rapid tiebreak — precision endgame play to retain the world title after 12 draws.",
    tacticalThemes: [
      "endgame technique",
      "ruy lopez",
      "piece activity",
      "conversion",
      "rapid chess",
    ],
    keyMoment: {
      moveNumber: 35,
      description:
        "Carlsen converts a rook endgame with characteristic precision. Small advantages are ground down with the patience and technique that make Carlsen the greatest endgame player of his generation.",
    },
    faqs: [
      {
        q: "Why did the 2016 World Championship go to tiebreaks?",
        a: "All 12 classical games between Carlsen and Karjakin were drawn, including a dramatic equalizer by Karjakin in Game 10. FIDE rules require rapid and then blitz tiebreaks if classical games are tied.",
      },
      {
        q: "Who is Sergey Karjakin?",
        a: "Sergey Karjakin is a Russian grandmaster who became the youngest grandmaster in history at age 12 (a record later broken). He was World Rapid Champion in 2012 and World Blitz Champion in 2016.",
      },
      {
        q: "How many times has Magnus Carlsen won the World Chess Championship?",
        a: "Carlsen won the World Chess Championship in 2013 (vs Anand), 2014 (vs Anand rematch), 2016 (vs Karjakin), 2018 (vs Caruana), and 2021 (vs Nepomniachtchi). He declined to defend in 2023.",
      },
    ],
    related: [
      "kasparov-karpov-1985-g16",
      "deep-blue-kasparov-1997",
      "fischer-spassky-g6-1972",
    ],
  },
];
