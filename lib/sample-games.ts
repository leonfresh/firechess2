/**
 * Famous chess games shared between the PGN Game Analyzer and Guess the Move.
 *
 * Each game includes metadata for browsing (label, year, players, description,
 * category folder, tags) and the full PGN text.
 *
 * Categories act as "folders" in the Guess the Move UI.
 */

export const GAME_CATEGORIES = [
  { key: "immortal", label: "Immortal Games", icon: "👑", description: "The most famous games in chess history" },
  { key: "world-championship", label: "World Championship", icon: "🏆", description: "Decisive games from WC matches" },
  { key: "modern", label: "Modern Brilliancies", icon: "⚡", description: "21st-century masterpieces" },
  { key: "romantic", label: "Romantic Era", icon: "🏰", description: "19th-century swashbuckling chess" },
  { key: "positional", label: "Positional Masterpieces", icon: "🧠", description: "Strategic domination" },
  { key: "endgame", label: "Endgame Classics", icon: "♔", description: "Technique and precision" },
  { key: "attacking", label: "Attacking Classics", icon: "⚔️", description: "Crushing kingside attacks" },
  { key: "tactical", label: "Tactical Fireworks", icon: "💥", description: "Explosive combinations" },
  { key: "defense", label: "Defense & Counterplay", icon: "🛡️", description: "Turning the tables" },
  { key: "miniature", label: "Miniatures", icon: "🎯", description: "Decided in 25 moves or fewer" },
] as const;

export type GameCategory = (typeof GAME_CATEGORIES)[number]["key"];

export type SampleGame = {
  label: string;
  year: number;
  white: string;
  black: string;
  description: string;
  category: GameCategory;
  tags: ("attack" | "endgame" | "positional" | "sacrifice" | "defense" | "tactics" | "opening-trap")[];
  pgn: string;
};

export const SAMPLE_GAMES: SampleGame[] = [
  // ═══════════════════════════════════════════════════════════════
  //  IMMORTAL GAMES
  // ═══════════════════════════════════════════════════════════════
  {
    label: "Kasparov vs Topalov, 1999",
    white: "Kasparov, Garry", black: "Topalov, Veselin", year: 1999,
    description: "Kasparov's Immortal — Wijk aan Zee",
    category: "immortal", tags: ["attack", "sacrifice", "tactics"],
    pgn: `[Event "Hoogovens A Tournament"]
[Site "Wijk aan Zee NED"]
[Date "1999.01.20"]
[White "Kasparov, Garry"]
[Black "Topalov, Veselin"]
[Result "1-0"]

1. e4 d6 2. d4 Nf6 3. Nc3 g6 4. Be3 Bg7 5. Qd2 c6 6. f3 b5 7. Nge2 Nbd7 8. Bh6 Bxh6 9. Qxh6 Bb7 10. a3 e5 11. O-O-O Qe7 12. Kb1 a6 13. Nc1 O-O-O 14. Nb3 exd4 15. Rxd4 c5 16. Rd1 Nb6 17. g3 Kb8 18. Na5 Ba8 19. Bh3 d5 20. Qf4+ Ka7 21. Re1 d4 22. Nd5 Nbxd5 23. exd5 Qd6 24. Rxd4 cxd4 25. Re7+ Kb6 26. Qxd4+ Kxa5 27. b4+ Ka4 28. Qc3 Qxd5 29. Ra7 Bb7 30. Rxb7 Qc4 31. Qxf6 Kxa3 32. Qxa6+ Kxb4 33. c3+ Kxc3 34. Qa1+ Kd2 35. Qb2+ Kd1 36. Bf1 Rd2 37. Rd7 Rxd7 38. Bxc4 bxc4 39. Qxh8 Rd3 40. Qa8 c3 41. Qa4+ Ke1 42. f4 f5 43. Kc1 Rd2 44. Qa7 1-0`,
  },
  {
    label: "Morphy vs Allies (Opera Game), 1858",
    white: "Morphy, Paul", black: "Duke of Brunswick and Count Isouard", year: 1858,
    description: "The Opera Game — Paris",
    category: "immortal", tags: ["attack", "sacrifice", "tactics"],
    pgn: `[Event "Opera Game"]
[Site "Paris FRA"]
[Date "1858.??.??"]
[White "Morphy, Paul"]
[Black "Duke of Brunswick and Count Isouard"]
[Result "1-0"]

1. e4 e5 2. Nf3 d6 3. d4 Bg4 4. dxe5 Bxf3 5. Qxf3 dxe5 6. Bc4 Nf6 7. Qb3 Qe7 8. Nc3 c6 9. Bg5 b5 10. Nxb5 cxb5 11. Bxb5+ Nbd7 12. O-O-O Rd8 13. Rxd7 Rxd7 14. Rd1 Qe6 15. Bxd7+ Nxd7 16. Qb8+ Nxb8 17. Rd8# 1-0`,
  },
  {
    label: "Byrne vs Fischer, 1956",
    white: "Byrne, Donald", black: "Fischer, Robert James", year: 1956,
    description: "The Game of the Century — New York",
    category: "immortal", tags: ["sacrifice", "tactics", "attack"],
    pgn: `[Event "Third Rosenwald Trophy"]
[Site "New York USA"]
[Date "1956.10.17"]
[White "Byrne, Donald"]
[Black "Fischer, Robert James"]
[Result "0-1"]

1. Nf3 Nf6 2. c4 g6 3. Nc3 Bg7 4. d4 O-O 5. Bf4 d5 6. Qb3 dxc4 7. Qxc4 c6 8. e4 Nbd7 9. Rd1 Nb6 10. Qc5 Bg4 11. Bg5 Na4 12. Qa3 Nxc3 13. bxc3 Nxe4 14. Bxe7 Qb6 15. Bc4 Nxc3 16. Bc5 Rfe8+ 17. Kf1 Be6 18. Bxb6 Bxc4+ 19. Kg1 Ne2+ 20. Kf1 Nxd4+ 21. Kg1 Ne2+ 22. Kf1 Nc3+ 23. Kg1 axb6 24. Qb4 Ra4 25. Qxb6 Nxd1 26. h3 Rxa2 27. Kh2 Nxf2 28. Re1 Rxe1 29. Qd8+ Bf8 30. Nxe1 Bd5 31. Nf3 Ne4 32. Qb8 b5 33. h4 h5 34. Ne5 Kg7 35. Kg1 Bc5+ 36. Kf1 Ng3+ 37. Ke1 Bb4+ 38. Kd1 Bb3+ 39. Kc1 Ne2+ 40. Kb1 Nc3+ 41. Kc1 Rc2# 0-1`,
  },
  {
    label: "Anderssen vs Kieseritzky, 1851",
    white: "Anderssen, Adolf", black: "Kieseritzky, Lionel", year: 1851,
    description: "The Immortal Game — London",
    category: "immortal", tags: ["sacrifice", "attack", "tactics"],
    pgn: `[Event "London"]
[Site "London ENG"]
[Date "1851.06.21"]
[White "Anderssen, Adolf"]
[Black "Kieseritzky, Lionel"]
[Result "1-0"]

1. e4 e5 2. f4 exf4 3. Bc4 Qh4+ 4. Kf1 b5 5. Bxb5 Nf6 6. Nf3 Qh6 7. d3 Nh5 8. Nh4 Qg5 9. Nf5 c6 10. g4 Nf6 11. Rg1 cxb5 12. h4 Qg6 13. h5 Qg5 14. Qf3 Ng8 15. Bxf4 Qf6 16. Nc3 Bc5 17. Nd5 Qxb2 18. Bd6 Bxg1 19. e5 Qxa1+ 20. Ke2 Na6 21. Nxg7+ Kd8 22. Qf6+ Nxf6 23. Be7# 1-0`,
  },
  {
    label: "Anderssen vs Dufresne, 1852",
    white: "Anderssen, Adolf", black: "Dufresne, Jean", year: 1852,
    description: "The Evergreen Game — Berlin",
    category: "immortal", tags: ["sacrifice", "attack", "tactics"],
    pgn: `[Event "Casual Game"]
[Site "Berlin GER"]
[Date "1852.??.??"]
[White "Anderssen, Adolf"]
[Black "Dufresne, Jean"]
[Result "1-0"]

1. e4 e5 2. Nf3 Nc6 3. Bc4 Bc5 4. b4 Bxb4 5. c3 Ba5 6. d4 exd4 7. O-O d3 8. Qb3 Qf6 9. e5 Qg6 10. Re1 Nge7 11. Ba3 b5 12. Qxb5 Rb8 13. Qa4 Bb6 14. Nbd2 Bb7 15. Ne4 Qf5 16. Bxd3 Qh5 17. Nf6+ gxf6 18. exf6 Rg8 19. Rad1 Qxf3 20. Rxe7+ Nxe7 21. Qxd7+ Kxd7 22. Bf5+ Ke8 23. Bd7+ Kf8 24. Bxe7# 1-0`,
  },
  {
    label: "Rotlewi vs Rubinstein, 1907",
    white: "Rotlewi, Georg A", black: "Rubinstein, Akiba", year: 1907,
    description: "Rubinstein's Immortal — Lodz",
    category: "immortal", tags: ["sacrifice", "tactics", "attack"],
    pgn: `[Event "Lodz"]
[Site "Lodz POL"]
[Date "1907.12.26"]
[White "Rotlewi, Georg A"]
[Black "Rubinstein, Akiba"]
[Result "0-1"]

1. d4 d5 2. Nf3 e6 3. e3 c5 4. c4 Nc6 5. Nc3 Nf6 6. dxc5 Bxc5 7. a3 a6 8. b4 Bd6 9. Bb2 O-O 10. Qd2 Qe7 11. Bd3 dxc4 12. Bxc4 b5 13. Bd3 Rd8 14. Qe2 Bb7 15. O-O Ne5 16. Nxe5 Bxe5 17. f4 Bc7 18. e4 Rac8 19. e5 Bb6+ 20. Kh1 Ng4 21. Be4 Qh4 22. g3 Rxc3 23. gxh4 Rd2 24. Qxd2 Bxe4+ 25. Qg2 Rh3 0-1`,
  },
  {
    label: "Polugaevsky vs Nezhmetdinov, 1958",
    white: "Polugaevsky, Lev", black: "Nezhmetdinov, Rashid", year: 1958,
    description: "Nezhmetdinov's Immortal — Sochi",
    category: "immortal", tags: ["sacrifice", "attack", "tactics"],
    pgn: `[Event "Russian Championship"]
[Site "Sochi URS"]
[Date "1958.??.??"]
[White "Polugaevsky, Lev"]
[Black "Nezhmetdinov, Rashid"]
[Result "0-1"]

1. d4 Nf6 2. c4 d6 3. Nc3 e5 4. e4 exd4 5. Qxd4 Nc6 6. Qd2 g6 7. b3 Bg7 8. Bb2 O-O 9. Bd3 Ng4 10. Nge2 Qh4 11. Ng3 Nge5 12. O-O f5 13. f3 Bh6 14. Qd1 f4 15. Nge2 g5 16. Nd5 g4 17. g3 fxg3 18. hxg3 Qh3 19. f4 Be3+ 20. Kh1 Rxf4 21. Bxe5 Nxe5 22. Rxf4 Nxd3 23. Rf3 gxf3 24. Nef4 Bxf4 25. Nxf4 Qg4 26. Qd2 Nxf4 27. gxf4 Qh4+ 28. Kg1 Qg3+ 29. Kh1 Bf5 30. Rf1 Bxe4 31. Qf2 Qh3+ 32. Qh2 Bxf1 33. Qxh3 Bxh3 0-1`,
  },
  {
    label: "Lasker vs Thomas, 1912",
    white: "Lasker, Emanuel", black: "Thomas, George Alan", year: 1912,
    description: "The Great King Hunt — London",
    category: "immortal", tags: ["sacrifice", "attack", "tactics"],
    pgn: `[Event "London"]
[Site "London ENG"]
[Date "1912.??.??"]
[White "Lasker, Emanuel"]
[Black "Thomas, George Alan"]
[Result "1-0"]

1. d4 e6 2. Nf3 f5 3. Nc3 Nf6 4. Bg5 Be7 5. Bxf6 Bxf6 6. e4 fxe4 7. Nxe4 b6 8. Ne5 O-O 9. Bd3 Bb7 10. Qh5 Qe7 11. Qxh7+ Kxh7 12. Nxf6+ Kh6 13. Neg4+ Kg5 14. h4+ Kf4 15. g3+ Kf3 16. Be2+ Kg2 17. Rh2+ Kg1 18. Kd2# 1-0`,
  },
  {
    label: "Wei Yi vs Bruzon, 2015",
    white: "Wei Yi", black: "Bruzon Batista, Lazaro", year: 2015,
    description: "The Chinese Immortal — Danzhou",
    category: "immortal", tags: ["attack", "sacrifice", "tactics"],
    pgn: `[Event "Danzhou"]
[Site "Danzhou CHN"]
[Date "2015.07.05"]
[White "Wei Yi"]
[Black "Bruzon Batista, Lazaro"]
[Result "1-0"]

1. e4 e5 2. Nf3 Nc6 3. Bb5 Nf6 4. d3 Bc5 5. c3 O-O 6. O-O Re8 7. Re1 a6 8. Ba4 b5 9. Bb3 d6 10. Bg5 Be6 11. Nbd2 h6 12. Bh4 Bxb3 13. axb3 Nb8 14. h3 Nbd7 15. Nh2 Qe7 16. Ndf1 Bb6 17. Ne3 d5 18. Nhf1 Qe6 19. Bg3 d4 20. Nc2 c5 21. f4 a5 22. fxe5 Nxe5 23. Nf3 Nxf3+ 24. Qxf3 e4 25. dxe4 dxc3 26. bxc3 Rad8 27. Rad1 Rd3 28. Rxd3 Nxe4 29. Rd5 Nxg3 30. Rxb5 Bc7 31. Qf4 Bxf4 32. Rxe6 fxe6 33. Ne3 Bxe3+ 34. Kf1 Nf5 35. Rxc5 Nd4 36. b4 Bb6 37. Rc4 Nf3 38. bxa5 Bxa5 39. gxf3 Bxc3 40. Rxc3 Rxe2 1-0`,
  },
  {
    label: "Topalov vs Shirov, 1998",
    white: "Topalov, Veselin", black: "Shirov, Alexei", year: 1998,
    description: "Shirov's Bh3!! — Linares",
    category: "immortal", tags: ["sacrifice", "tactics", "endgame"],
    pgn: `[Event "Linares"]
[Site "Linares ESP"]
[Date "1998.03.02"]
[White "Topalov, Veselin"]
[Black "Shirov, Alexei"]
[Result "0-1"]

1. d4 f5 2. g3 Nf6 3. Bg2 g6 4. Nf3 Bg7 5. O-O O-O 6. c4 d6 7. Nc3 Qe8 8. d5 Na6 9. Rb1 Nc5 10. Qc2 a5 11. Rd1 Bd7 12. Be3 Qf7 13. Bxc5 dxc5 14. e3 e5 15. dxe6 Bxe6 16. b3 Rad8 17. Na4 Rxd1+ 18. Rxd1 b6 19. Nb2 Bc8 20. Rd2 Ne4 21. Bxe4 fxe4 22. Nd4 Bb7 23. Nf5 Qxf5 24. Qxe4 Bh6 25. Rd7 Qf2+ 26. Kh1 Qf1+ 27. Qg1 Qxg1+ 28. Kxg1 Bc6 29. Rd6 Rc8 30. Nc4 Bf8 31. Rd1 Be7 32. Nxa5 Ba8 33. Nc6 Bf6 34. Kf1 Kf7 35. Ke2 Ke6 36. a4 Kd6 37. Na5 Kc7 38. Rd2 Ra8 39. Nb7 Ra7 40. a5 bxa5 41. Na5 Be5 42. Nc6 Bxc6 43. Rd8 a4 44. bxa4 Bxa4 45. Rc8 Kb6 46. Rb8+ Bb5 47. Kd1 Bh3 0-1`,
  },

  // ═══════════════════════════════════════════════════════════════
  //  WORLD CHAMPIONSHIP
  // ═══════════════════════════════════════════════════════════════
  {
    label: "Karpov vs Kasparov, WC 1985 G16",
    white: "Karpov, Anatoly", black: "Kasparov, Garry", year: 1985,
    description: "The turning point — Moscow WC",
    category: "world-championship", tags: ["positional", "attack"],
    pgn: `[Event "World Championship 32th-KK2"]
[Site "Moscow URS"]
[Date "1985.10.15"]
[White "Karpov, Anatoly"]
[Black "Kasparov, Garry"]
[Result "0-1"]

1. e4 c5 2. Nf3 e6 3. d4 cxd4 4. Nxd4 Nc6 5. Nb5 d6 6. c4 Nf6 7. N1c3 a6 8. Na3 d5 9. cxd5 exd5 10. exd5 Nb4 11. Be2 Bc5 12. O-O O-O 13. Bf3 Bf5 14. Bg5 Re8 15. Qd2 b5 16. Rad1 Nd3 17. Nab1 h6 18. Bh4 b4 19. Na4 Bd6 20. Bg3 Rc8 21. b3 g5 22. Bxd6 Qxd6 23. g3 Nd7 24. Bg2 Qf6 25. a3 a5 26. axb4 axb4 27. Qa2 Bg6 28. d6 g4 29. Qd2 Kg7 30. f3 Qxd6 31. fxg4 Qd4+ 32. Kh1 Nf6 33. Rf4 Ne4 34. Qxd3 Nf2+ 35. Rxf2 Bxd3 36. Rfd2 Qe3 37. Rxd3 Rc1 38. Nb2 Qf2 39. Nd2 Rxd1+ 40. Nxd1 Re1+ 0-1`,
  },
  {
    label: "Fischer vs Spassky, WC 1972 G6",
    white: "Fischer, Robert James", black: "Spassky, Boris", year: 1972,
    description: "Fischer's masterpiece — Reykjavik WC",
    category: "world-championship", tags: ["positional", "endgame"],
    pgn: `[Event "World Championship"]
[Site "Reykjavik ISL"]
[Date "1972.07.23"]
[White "Fischer, Robert James"]
[Black "Spassky, Boris"]
[Result "1-0"]

1. c4 e6 2. Nf3 d5 3. d4 Nf6 4. Nc3 Be7 5. Bg5 O-O 6. e3 h6 7. Bh4 b6 8. cxd5 Nxd5 9. Bxe7 Qxe7 10. Nxd5 exd5 11. Rc1 Be6 12. Qa4 c5 13. Qa3 Rc8 14. Bb5 a6 15. dxc5 bxc5 16. O-O Ra7 17. Be2 Nd7 18. Nd4 Qf8 19. Nxe6 fxe6 20. e4 d4 21. f4 Qe7 22. e5 Rb8 23. Bc4 Kh8 24. Qh3 Nf8 25. b3 a5 26. f5 exf5 27. Rxf5 Nh7 28. Rcf1 Qd8 29. Qg3 Re7 30. h4 Rbb7 31. e6 Rbc7 32. Qe5 Qe8 33. a4 Qd8 34. R1f2 Qe8 35. R2f3 Qd8 36. Bd3 Qe8 37. Qe4 Nf6 38. Rxf6 gxf6 39. Rxf6 Kg8 40. Bc4 Kh8 41. Qf4 1-0`,
  },
  {
    label: "Carlsen vs Anand, WC 2013 G6",
    white: "Carlsen, Magnus", black: "Anand, Viswanathan", year: 2013,
    description: "Carlsen grinds Anand — Chennai WC",
    category: "world-championship", tags: ["endgame", "positional"],
    pgn: `[Event "World Championship"]
[Site "Chennai IND"]
[Date "2013.11.16"]
[White "Carlsen, Magnus"]
[Black "Anand, Viswanathan"]
[Result "1-0"]

1. e4 e5 2. Nf3 Nc6 3. Bb5 Nf6 4. d3 Bc5 5. c3 O-O 6. Bg5 h6 7. Bh4 Be7 8. O-O d6 9. Nbd2 Nh5 10. Bxe7 Qxe7 11. Nc4 Nf4 12. Ne3 Qf6 13. g3 Nh3+ 14. Kh1 Ng5 15. Nxg5 hxg5 16. Bc4 g4 17. Nd5 Qd8 18. Kg2 Kh7 19. Rh1 f5 20. Qb3 Qe8 21. Qg3 Bd7 22. Rae1 Na5 23. Bd3 c6 24. Nb4 a6 25. Re2 fxe4 26. Bxe4 d5 27. Bd3 Rxf2+ 28. Qxf2 Nc4 29. Re7 Rf8 30. Qg1 Nd2 31. Rxd7 Rf3 32. Bxf3 gxf3+ 33. Kxf3 Ne4 34. Rhh7 Qf8+ 35. Ke2 Nd6 36. Rxb7 Nxb7 37. Rxb7 Qf2+ 38. Kd1 Qf1+ 39. Kc2 Qf2+ 40. Kb3 Qd4 41. Ka4 Qxb4+ 42. Kxb4 1-0`,
  },
  {
    label: "Kramnik vs Kasparov, WC 2000 G2",
    white: "Kramnik, Vladimir", black: "Kasparov, Garry", year: 2000,
    description: "The Berlin Wall — London WC",
    category: "world-championship", tags: ["positional", "endgame", "defense"],
    pgn: `[Event "World Championship"]
[Site "London ENG"]
[Date "2000.10.12"]
[White "Kramnik, Vladimir"]
[Black "Kasparov, Garry"]
[Result "1-0"]

1. d4 Nf6 2. c4 e6 3. Nc3 Bb4 4. e3 O-O 5. Bd3 d5 6. Nf3 c5 7. O-O cxd4 8. exd4 dxc4 9. Bxc4 b6 10. Bg5 Bb7 11. Re1 Nbd7 12. Rc1 Rc8 13. Qb3 Be7 14. Bxf6 Nxf6 15. Bxe6 fxe6 16. Qxe6+ Kh8 17. Qxe7 Bxf3 18. gxf3 Qxd4 19. Nb5 Qxb2 20. Rxc8 Rxc8 21. Nd6 Rb8 22. Nf7+ Kg8 23. Qe6 Rf8 24. Nd8+ Kh8 25. Qe7 Rc8 26. Nf7+ Kg8 27. Nd6+ Kh8 28. Nxc8 Qxa2 29. Nb6 Qb3 30. Re3 Qb4 31. Nd7 Nxd7 32. Qxd7 Qb1+ 33. Kg2 a5 34. Qd5 a4 35. Re7 h6 36. Qf7 Qe4 37. Qf8+ Kh7 38. Re8 b5 39. Qg8+ Kg6 40. Re6+ Kh5 41. Qf7+ 1-0`,
  },
  {
    label: "Tal vs Botvinnik, WC 1960 G6",
    white: "Tal, Mikhail", black: "Botvinnik, Mikhail", year: 1960,
    description: "The Magician attacks — Moscow WC",
    category: "world-championship", tags: ["sacrifice", "attack"],
    pgn: `[Event "World Championship"]
[Site "Moscow URS"]
[Date "1960.03.26"]
[White "Tal, Mikhail"]
[Black "Botvinnik, Mikhail"]
[Result "1-0"]

1. d4 Nf6 2. c4 e6 3. Nc3 d5 4. cxd5 exd5 5. Bg5 Be7 6. e3 O-O 7. Bd3 Nbd7 8. Qc2 Re8 9. Nge2 Nf8 10. O-O c6 11. Rab1 Bd6 12. Kh1 Ng6 13. f3 Be6 14. Nf4 Nxf4 15. exf4 Qc8 16. f5 Bd7 17. f4 Be7 18. Bf5 Bxf5 19. Qxf5 Qxf5 20. Rxf5 Bd6 21. Rbf1 Bc7 22. Nd1 Nd7 23. Ne3 Nf8 24. g4 f6 25. Bh4 Bd6 26. Ng2 Kf7 27. h3 Be7 28. Bf2 Nd7 29. Nh4 Nf8 30. R5f3 Bd6 31. Nf5 Bf8 32. Nh6+ gxh6 33. f5 Bg7 34. Bh4 Nh7 35. Rg3 Kf8 36. Bxf6 Nxf6 37. Rxf6+ Ke7 38. Rxc6 Kd7 39. Rf6 Bf8 40. g5 1-0`,
  },
  {
    label: "Carlsen vs Karjakin, WC 2016 Rapid",
    white: "Carlsen, Magnus", black: "Karjakin, Sergey", year: 2016,
    description: "Rapid playoff clincher — New York WC",
    category: "world-championship", tags: ["attack", "tactics"],
    pgn: `[Event "World Championship (rapid)"]
[Site "New York USA"]
[Date "2016.11.30"]
[White "Carlsen, Magnus"]
[Black "Karjakin, Sergey"]
[Result "1-0"]

1. e4 e5 2. Nf3 Nc6 3. Bb5 Nf6 4. d3 Bc5 5. O-O d6 6. Re1 O-O 7. Bxc6 bxc6 8. h3 Re8 9. Nbd2 Be6 10. b3 d5 11. Bb2 Bd6 12. Nf1 Nxe4 13. dxe4 dxe4 14. Rxe4 Qf6 15. Nh4 g6 16. Qd3 g5 17. Nf5 Bxf5 18. Qxf5 Qxf5 19. Rxe5 Re6 20. Rae1 Rae8 21. Rxe6 Rxe6 22. Rxe6 fxe6 23. Ne3 Be7 24. Kf1 c5 25. Ke2 Kf7 26. Kd3 a5 27. c4 Bf6 28. Bc3 Ke7 29. Nc2 Kd6 30. Bxa5 Kc6 31. Nb4+ Kb5 32. Nd5 Bd8 33. Bc3 Ka4 34. Kc2 c6 35. Nf4 Bf6 36. Bxf6 Ka3 37. Kb1 e5 38. Nd5 cxd5 39. cxd5 Kb4 40. d6 Kc5 41. Be7+ Kd5 42. d7 Ke6 43. d8=Q 1-0`,
  },
  {
    label: "Ding vs Nepomniachtchi, WC 2023 G12",
    white: "Ding, Liren", black: "Nepomniachtchi, Ian", year: 2023,
    description: "Ding's WC comeback — Astana",
    category: "world-championship", tags: ["positional", "endgame"],
    pgn: `[Event "World Championship"]
[Site "Astana KAZ"]
[Date "2023.04.28"]
[White "Ding, Liren"]
[Black "Nepomniachtchi, Ian"]
[Result "1-0"]

1. d4 Nf6 2. c4 e6 3. Nf3 d5 4. h3 dxc4 5. e3 c5 6. Bxc4 a6 7. O-O Nc6 8. Nc3 b5 9. Bd3 Bb7 10. a4 b4 11. Ne4 Na5 12. Nxf6+ gxf6 13. e4 c4 14. Bc2 Qd7 15. d5 Nb3 16. Bxb3 cxb3 17. d6 Bxd6 18. Qxd6 Qxd6 19. Rd1 Qc6 20. Rxd8+ Kxd8 21. Be3 a5 22. Rc1 Qb5 23. Nd4 Qxe2 24. Nc6+ Bxc6 25. Rxc6 Ke8 26. Rc7 e5 27. Rxf7 Qb5 28. Bg5 Rb8 29. Bxf6 Qd3 30. Bxe5 Qd1+ 31. Kh2 Qd5 32. Bg3 b2 33. Rb7 1-0`,
  },
  {
    label: "Capablanca vs Alekhine, WC 1927 G34",
    white: "Capablanca, Jose Raul", black: "Alekhine, Alexander", year: 1927,
    description: "The dethroning — Buenos Aires",
    category: "world-championship", tags: ["positional", "endgame"],
    pgn: `[Event "World Championship"]
[Site "Buenos Aires ARG"]
[Date "1927.11.26"]
[White "Capablanca, Jose Raul"]
[Black "Alekhine, Alexander"]
[Result "0-1"]

1. d4 d5 2. c4 e6 3. Nc3 Nf6 4. Bg5 Nbd7 5. e3 Be7 6. Nf3 O-O 7. Rc1 a6 8. a3 h6 9. Bh4 dxc4 10. Bxc4 b5 11. Ba2 Bb7 12. O-O c5 13. Qe2 c4 14. Rfd1 Qb6 15. Nd2 Rfd8 16. f3 Rac8 17. Bf2 Bf8 18. Kh1 Qa7 19. Bb1 Bd5 20. Nc4 b4 21. axb4 bxc3 22. bxc3 Qa4 23. Ra1 Be7 24. Bc2 Qb5 25. Ba4 Qb7 26. Na5 Qb6 27. Qe1 Rc7 28. Bc2 Rdc8 29. Bd1 Nd7 30. Bg3 Bf6 31. Bf2 Nb8 32. Be2 Nc6 33. Nxc6 Rxc6 34. Bg3 a5 35. Bf2 Bg5 36. Ra3 Bf4 37. h3 Qd6 38. Kh2 e5 39. Ra1 exd4 40. exd4 Re8 41. Bf1 a4 42. Ra3 Re2 43. Bg3 Bxg3+ 44. Kxg3 Qe6 45. Kf2 Rxg2+ 46. Ke1 Qe3+ 47. Qe2 Qg1+ 0-1`,
  },
  {
    label: "Kasparov vs Karpov, WC 1990 G20",
    white: "Kasparov, Garry", black: "Karpov, Anatoly", year: 1990,
    description: "The decider — Lyon/New York WC",
    category: "world-championship", tags: ["attack", "tactics"],
    pgn: `[Event "World Championship"]
[Site "Lyon/New York"]
[Date "1990.12.16"]
[White "Kasparov, Garry"]
[Black "Karpov, Anatoly"]
[Result "1-0"]

1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6 5. O-O Be7 6. Re1 b5 7. Bb3 d6 8. c3 O-O 9. h3 Bb7 10. d4 Re8 11. Nbd2 Bf8 12. a4 h6 13. Bc2 exd4 14. cxd4 Nb4 15. Bb1 c5 16. d5 Nd7 17. Ra3 f5 18. Rae3 Nf6 19. Nh2 Kh8 20. b3 bxa4 21. bxa4 c4 22. Bb2 fxe4 23. Nxe4 Nfxd5 24. Rg3 Re6 25. Ng4 Qe8 26. Nxh6 c3 27. Nf5 cxb2 28. Qg4 Bc8 29. Qh4+ Rh6 30. Nxh6 gxh6 31. Kh2 Qe5 32. Ng5 Qf6 33. Re8 Bf5 34. Qxh6+ Qxh6 35. Nf7+ Kh7 36. Bxf5+ Qg6 37. Bxg6+ Kg7 38. Rxa8 Be7 39. Rb8 a5 40. Be4+ Kxf7 41. Bxd5+ 1-0`,
  },
  {
    label: "Anand vs Gelfand, WC 2012 G8",
    white: "Anand, Viswanathan", black: "Gelfand, Boris", year: 2012,
    description: "Anand's exchange sacrifice — Moscow WC",
    category: "world-championship", tags: ["sacrifice", "positional"],
    pgn: `[Event "World Championship"]
[Site "Moscow RUS"]
[Date "2012.05.21"]
[White "Anand, Viswanathan"]
[Black "Gelfand, Boris"]
[Result "1-0"]

1. d4 Nf6 2. c4 g6 3. f3 d5 4. cxd5 Nxd5 5. e4 Nb6 6. Nc3 Bg7 7. Be3 O-O 8. Qd2 e5 9. d5 c6 10. h4 cxd5 11. exd5 N8d7 12. h5 Nf6 13. hxg6 fxg6 14. O-O-O Bd7 15. Kb1 Rc8 16. Ka1 e4 17. Bd4 Nfxd5 18. Nxe4 Nc4 19. Qc1 Bxd4 20. Rxd4 Ndb6 21. Nd6 Rf6 22. Nxc8 Nxc8 23. Bd3 Nd6 24. Qh6 Nf7 25. Qd2 Nd6 26. Re1 Nb5 27. Bxb5 Bxb5 28. Rd7 Qf8 29. Ree7 Bc6 30. Rc7 Bb5 31. g4 Nd5 32. Rg7+ Kh8 33. Rce7 1-0`,
  },

  // ═══════════════════════════════════════════════════════════════
  //  MODERN BRILLIANCIES (post-2000)
  // ═══════════════════════════════════════════════════════════════
  {
    label: "Aronian vs Anand, 2013",
    white: "Aronian, Levon", black: "Anand, Viswanathan", year: 2013,
    description: "Anand's counterattack — Wijk aan Zee",
    category: "modern", tags: ["sacrifice", "attack", "tactics"],
    pgn: `[Event "75th Tata Steel GpA"]
[Site "Wijk aan Zee NED"]
[Date "2013.01.15"]
[White "Aronian, Levon"]
[Black "Anand, Viswanathan"]
[Result "0-1"]

1. d4 d5 2. c4 c6 3. Nf3 Nf6 4. Nc3 e6 5. e3 Nbd7 6. Bd3 dxc4 7. Bxc4 b5 8. Bd3 Bd6 9. O-O O-O 10. Qc2 Bb7 11. a3 Rc8 12. Ng5 c5 13. Nxh7 Ng4 14. f4 cxd4 15. exd4 Bc5 16. Be2 Nde5 17. Bxg4 Bxd4+ 18. Kh1 Nxg4 19. Nxf8 f5 20. Ng6 Qf6 21. h3 Qxg6 22. Qe2 Qh5 23. Qd3 Be3 0-1`,
  },
  {
    label: "Giri vs Ding, 2017",
    white: "Giri, Anish", black: "Ding, Liren", year: 2017,
    description: "Ding's stunning rook sacrifice — Shenzhen",
    category: "modern", tags: ["sacrifice", "tactics", "attack"],
    pgn: `[Event "Shenzhen Masters"]
[Site "Shenzhen CHN"]
[Date "2017.03.25"]
[White "Giri, Anish"]
[Black "Ding, Liren"]
[Result "0-1"]

1. d4 Nf6 2. c4 e6 3. Nf3 d5 4. Nc3 Be7 5. Bf4 O-O 6. e3 Nbd7 7. c5 Nh5 8. Bd3 Nxf4 9. exf4 b6 10. b4 a5 11. a3 c6 12. O-O Qc7 13. g3 Ba6 14. Re1 Bxd3 15. Qxd3 b5 16. Nd2 Bf6 17. f5 e5 18. dxe5 Nxe5 19. Qe3 Rfe8 20. Qf4 Nd3 21. Re6 fxe6 22. Qxc7 Nxb4 23. axb4 axb4 24. Nd1 exf5 25. Qa7 Ra1 26. Qa6 Ra2 27. Qa7 d4 28. Qb7 d3 29. Nb3 d2 30. Nf2 Re1+ 31. Kg2 Rexf2+ 0-1`,
  },
  {
    label: "Caruana vs Topalov, 2015",
    white: "Caruana, Fabiano", black: "Topalov, Veselin", year: 2015,
    description: "Caruana's thunderbolt — Sinquefield Cup",
    category: "modern", tags: ["attack", "sacrifice"],
    pgn: `[Event "Sinquefield Cup"]
[Site "Saint Louis USA"]
[Date "2015.08.23"]
[White "Caruana, Fabiano"]
[Black "Topalov, Veselin"]
[Result "1-0"]

1. e4 e5 2. Nf3 Nc6 3. Bb5 Nf6 4. d3 Bc5 5. Bxc6 dxc6 6. Nbd2 Be6 7. O-O Bd6 8. b3 O-O 9. Bb2 Re8 10. Nc4 Bf8 11. Nce5 Nd7 12. d4 Nxe5 13. Nxe5 c5 14. c4 f6 15. Nd3 cxd4 16. Bxd4 c5 17. Bc3 Bd7 18. f4 Bc6 19. f5 Qd7 20. Qg4 b5 21. Nf4 bxc4 22. Rad1 Qc7 23. Rd6 Rad8 24. Rfd1 Rxd6 25. Rxd6 Re7 26. Nd5 Bxd5 27. exd5 Rd7 28. Qe6+ Kh8 29. d6 Qd8 30. bxc4 g6 31. fxg6 hxg6 32. Qxg6 1-0`,
  },
  {
    label: "Nakamura vs Carlsen, 2010",
    white: "Nakamura, Hikaru", black: "Carlsen, Magnus", year: 2010,
    description: "Naka stuns Carlsen — London Chess Classic",
    category: "modern", tags: ["attack", "tactics"],
    pgn: `[Event "London Chess Classic"]
[Site "London ENG"]
[Date "2010.12.08"]
[White "Nakamura, Hikaru"]
[Black "Carlsen, Magnus"]
[Result "1-0"]

1. d4 Nf6 2. c4 g6 3. Nc3 Bg7 4. e4 d6 5. f3 O-O 6. Nge2 c5 7. d5 e6 8. Ng3 exd5 9. cxd5 h5 10. Bg5 a6 11. Be2 Qe8 12. a4 Nbd7 13. O-O h4 14. Nf1 Nh5 15. Nd2 Qe5 16. Nc4 Qf4 17. Bf2 Ne5 18. Na5 Bd7 19. Nc6 Nxc6 20. dxc6 Bc8 21. Nd5 Qd4 22. Bxd4 cxd4 23. Qb3 Be6 24. cxb7 Rab8 25. Qa3 Bxd5 26. exd5 Nf4 27. Bf1 Rxb7 28. Qxa6 1-0`,
  },
  {
    label: "Firouzja vs Carlsen, 2022",
    white: "Firouzja, Alireza", black: "Carlsen, Magnus", year: 2022,
    description: "17-year-old beats the champion — Wijk aan Zee",
    category: "modern", tags: ["attack", "positional"],
    pgn: `[Event "84th Tata Steel GpA"]
[Site "Wijk aan Zee NED"]
[Date "2022.01.24"]
[White "Firouzja, Alireza"]
[Black "Carlsen, Magnus"]
[Result "1-0"]

1. d4 Nf6 2. c4 e6 3. Nf3 d5 4. Nc3 c6 5. e3 Nbd7 6. Qc2 Bd6 7. Bd3 O-O 8. O-O dxc4 9. Bxc4 b5 10. Be2 Bb7 11. Rd1 Qc7 12. e4 e5 13. dxe5 Nxe5 14. Nd4 Neg4 15. g3 a6 16. Bf4 Bxf4 17. gxf4 Qd6 18. Bf3 Rfe8 19. e5 Qxf4 20. exf6 Rxe1+ 21. Rxe1 Nxf6 22. Nce2 Qd2 23. Qxd2 1-0`,
  },
  {
    label: "Rapport vs Grischuk, 2021",
    white: "Rapport, Richard", black: "Grischuk, Alexander", year: 2021,
    description: "Creative genius — FIDE Grand Swiss",
    category: "modern", tags: ["sacrifice", "attack"],
    pgn: `[Event "FIDE Grand Swiss"]
[Site "Riga LAT"]
[Date "2021.10.30"]
[White "Rapport, Richard"]
[Black "Grischuk, Alexander"]
[Result "1-0"]

1. e4 c5 2. Nf3 e6 3. d4 cxd4 4. Nxd4 Nc6 5. Nc3 d6 6. Be2 Nf6 7. O-O Be7 8. Be3 O-O 9. f4 a6 10. Qe1 Nxd4 11. Bxd4 b5 12. a3 Bb7 13. Qg3 Nd7 14. f5 e5 15. Bf2 Bf6 16. Bg4 Nc5 17. Nd5 Bxd5 18. exd5 b4 19. Bh5 bxa3 20. bxa3 g6 21. fxg6 hxg6 22. Qg4 Kh8 23. Bg5 Qc7 24. Rxf6 gxh5 25. Qg5 Qd7 26. Raf1 Rg8 27. Qf5 Qxf5 28. R1xf5 1-0`,
  },
  {
    label: "MVL vs Anand, 2013",
    white: "Vachier-Lagrave, Maxime", black: "Anand, Viswanathan", year: 2013,
    description: "MVL's Najdorf showdown — Biel",
    category: "modern", tags: ["attack", "tactics"],
    pgn: `[Event "Biel GM"]
[Site "Biel SUI"]
[Date "2013.07.23"]
[White "Vachier-Lagrave, Maxime"]
[Black "Anand, Viswanathan"]
[Result "1-0"]

1. e4 c5 2. Nf3 d6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 a6 6. Bg5 e6 7. f4 Be7 8. Qf3 Qc7 9. O-O-O Nbd7 10. g4 b5 11. Bxf6 Nxf6 12. g5 Nd7 13. f5 Nc5 14. f6 gxf6 15. gxf6 Bf8 16. Rg1 b4 17. Nd5 exd5 18. exd5 Bd7 19. Re1+ Kd8 20. Bh3 Bxh3 21. Qxh3 a5 22. Nf5 Kc8 23. Qe6+ Kb8 24. Nd4 Na4 25. Nc6+ Ka8 26. Qd7 1-0`,
  },
  {
    label: "Carlsen vs Karjakin, 2014",
    white: "Carlsen, Magnus", black: "Karjakin, Sergey", year: 2014,
    description: "Crushing attack with white — Shamkir",
    category: "modern", tags: ["attack", "positional"],
    pgn: `[Event "Shamkir Chess"]
[Site "Shamkir AZE"]
[Date "2014.04.20"]
[White "Carlsen, Magnus"]
[Black "Karjakin, Sergey"]
[Result "1-0"]

1. c4 c5 2. Nf3 Nc6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 e6 6. a3 Bc5 7. Nb3 Be7 8. e4 O-O 9. Be2 b6 10. O-O Bb7 11. Bf4 d6 12. Rc1 Rc8 13. Re1 Ne5 14. Nd2 Ng6 15. Bg3 Nh5 16. b4 Nxg3 17. hxg3 Bf6 18. Nd5 Re8 19. Nf1 exd5 20. exd5 Ne5 21. Ne3 g6 22. Bf3 Bg7 23. Qd2 a5 24. b5 a4 25. Red1 Qa5 26. Rb1 Rc5 27. g4 Bc8 28. Ng2 Qc7 29. Nf4 Bd7 30. g5 Rc8 31. g3 Kh8 32. Kg2 Bf8 33. Rh1 Bg7 34. Qe3 Rf8 35. Qe2 Qd8 36. Nd3 Nxd3 37. Qxd3 f6 38. gxf6 Rxf6 39. Rbf1 Rff8 40. Qe3 Re8 41. Qd4 1-0`,
  },
  {
    label: "Nepo vs Wang Hao, 2019",
    white: "Nepomniachtchi, Ian", black: "Wang, Hao", year: 2019,
    description: "Nepo's flawless attack — FIDE Grand Prix",
    category: "modern", tags: ["attack", "sacrifice"],
    pgn: `[Event "FIDE Grand Prix"]
[Site "Hamburg GER"]
[Date "2019.11.08"]
[White "Nepomniachtchi, Ian"]
[Black "Wang, Hao"]
[Result "1-0"]

1. e4 e5 2. Nf3 Nc6 3. Bc4 Bc5 4. O-O Nf6 5. d3 d6 6. c3 a6 7. a4 Ba7 8. Na3 h6 9. Nc2 O-O 10. Be3 Bxe3 11. Nxe3 Re8 12. h3 Be6 13. Bxe6 Rxe6 14. d4 Qe7 15. dxe5 dxe5 16. Qc2 Rd8 17. Rfd1 Rxd1+ 18. Rxd1 Rd6 19. Rxd6 cxd6 20. Qd3 Nd7 21. Nd5 Qd8 22. b4 Kh7 23. Qb3 Nc5 24. Qb2 Nd7 25. a5 Qg5 26. Kh2 Ne7 27. Qd2 Qxd2 28. Nxd2 Nxd5 29. exd5 Kg6 30. Nc4 Kf5 31. Kg3 e4 32. Kf4 1-0`,
  },
  {
    label: "So vs Carlsen, 2016",
    white: "So, Wesley", black: "Carlsen, Magnus", year: 2016,
    description: "Wesley tames Carlsen — Leuven",
    category: "modern", tags: ["positional", "endgame"],
    pgn: `[Event "Your Next Move GCT"]
[Site "Leuven BEL"]
[Date "2016.06.17"]
[White "So, Wesley"]
[Black "Carlsen, Magnus"]
[Result "1-0"]

1. d4 e6 2. c4 d5 3. Nc3 Be7 4. cxd5 exd5 5. Bf4 c6 6. e3 Bf5 7. g4 Be6 8. h3 Nf6 9. Bd3 c5 10. Nf3 Nc6 11. Kf1 O-O 12. Kg2 cxd4 13. exd4 Bd6 14. Be3 Re8 15. Re1 Bf4 16. Bf1 Bxe3 17. Rxe3 Qd6 18. Nd2 Rad8 19. Nb3 Nd7 20. Na4 Nb4 21. Nbc5 Nxc5 22. Nxc5 Bc8 23. a3 Na6 24. Nxa6 Bxa6 25. Bxa6 bxa6 26. Qa4 Qb6 27. Rae1 h6 28. Rxe8+ Rxe8 29. Rxe8+ Kh7 30. Qe4+ 1-0`,
  },

  // ═══════════════════════════════════════════════════════════════
  //  ROMANTIC ERA (pre-1920)
  // ═══════════════════════════════════════════════════════════════
  {
    label: "Morphy vs Paulsen, 1857",
    white: "Morphy, Paul", black: "Paulsen, Louis", year: 1857,
    description: "Morphy's mating attack — New York",
    category: "romantic", tags: ["attack", "sacrifice"],
    pgn: `[Event "First American Chess Congress"]
[Site "New York USA"]
[Date "1857.11.08"]
[White "Morphy, Paul"]
[Black "Paulsen, Louis"]
[Result "1-0"]

1. e4 e5 2. Nf3 Nc6 3. Bc4 Nf6 4. d4 exd4 5. O-O Nxe4 6. Re1 d5 7. Bxd5 Qxd5 8. Nc3 Qa5 9. Nxe4 Be6 10. Neg5 O-O-O 11. Nxe6 fxe6 12. Rxe6 Bd6 13. Bg5 Rd7 14. b4 Qc5 15. bxc5 1-0`,
  },
  {
    label: "Zukertort vs Blackburne, 1883",
    white: "Zukertort, Johannes", black: "Blackburne, Joseph", year: 1883,
    description: "Zukertort's crowning achievement — London",
    category: "romantic", tags: ["attack", "sacrifice", "positional"],
    pgn: `[Event "London"]
[Site "London ENG"]
[Date "1883.??.??"]
[White "Zukertort, Johannes Hermann"]
[Black "Blackburne, Joseph Henry"]
[Result "1-0"]

1. c4 e6 2. e3 Nf6 3. Nf3 b6 4. Be2 Bb7 5. O-O d5 6. d4 Bd6 7. Nc3 O-O 8. b3 Nbd7 9. Bb2 Qe7 10. Nb5 Ne4 11. Nxd6 cxd6 12. Nd2 Ndf6 13. f3 Nxd2 14. Qxd2 dxc4 15. Bxc4 d5 16. Bd3 Rfc8 17. Rae1 Rc7 18. e4 Rac8 19. e5 Ne8 20. f4 g6 21. Re3 f5 22. exf6 Nxf6 23. f5 Ne4 24. Bxe4 dxe4 25. fxg6 Rc2 26. gxh7+ Kh8 27. d5+ e5 28. Qb4 R8c5 29. Rf8+ Kxh7 30. Qxe4+ Kg7 31. Bxe5+ Kxf8 32. Bg7+ Kg8 33. Qxe7 1-0`,
  },
  {
    label: "Pillsbury vs Lasker, 1895",
    white: "Pillsbury, Harry Nelson", black: "Lasker, Emanuel", year: 1895,
    description: "Pillsbury's debut — Hastings",
    category: "romantic", tags: ["attack", "positional"],
    pgn: `[Event "Hastings"]
[Site "Hastings ENG"]
[Date "1895.08.17"]
[White "Pillsbury, Harry Nelson"]
[Black "Lasker, Emanuel"]
[Result "1-0"]

1. d4 d5 2. c4 e6 3. Nc3 Nf6 4. Nf3 c5 5. Bg5 cxd4 6. Qxd4 Nc6 7. Qh4 Be7 8. O-O-O Qa5 9. e3 Bd7 10. Kb1 h6 11. cxd5 exd5 12. Nd4 O-O 13. Bxf6 Bxf6 14. Qh5 Nxd4 15. exd4 Be6 16. f4 Rac8 17. f5 Rxc3 18. fxe6 Ra3 19. exf7+ Rxf7 20. bxa3 Qb6+ 21. Bb5 Qxb5+ 22. Ka1 Rc7 23. Rd2 Rc4 24. Rhd1 Rc2 25. Qf5 Qa4 26. Qf1 Rc3 27. Qf5 Qa5 28. Rb1 Rc1+ 29. Rxc1 Qxd2 30. Qc8+ Kh7 31. Rc7 Qd1+ 32. Kb2 Qd2+ 33. Kb3 Qxa2+ 34. Kb4 Bd8 35. Qf5+ g6 36. Qf7+ Kh8 37. Qf8+ Kh7 38. Rc1 1-0`,
  },
  {
    label: "Steinitz vs von Bardeleben, 1895",
    white: "Steinitz, Wilhelm", black: "von Bardeleben, Curt", year: 1895,
    description: "The silent resignation — Hastings",
    category: "romantic", tags: ["attack", "sacrifice", "tactics"],
    pgn: `[Event "Hastings"]
[Site "Hastings ENG"]
[Date "1895.08.17"]
[White "Steinitz, Wilhelm"]
[Black "von Bardeleben, Curt"]
[Result "1-0"]

1. e4 e5 2. Nf3 Nc6 3. Bc4 Bc5 4. c3 Nf6 5. d4 exd4 6. cxd4 Bb4+ 7. Nc3 d5 8. exd5 Nxd5 9. O-O Be6 10. Bg5 Be7 11. Bxd5 Bxd5 12. Nxd5 Qxd5 13. Bxe7 Nxe7 14. Re1 f6 15. Qe2 Qd7 16. Rac1 c6 17. d5 cxd5 18. Nd4 Kf7 19. Ne6 Rhc8 20. Qg4 g6 21. Ng5+ Ke8 22. Rxe7+ Kf8 23. Rf7+ Kg8 24. Rg7+ Kh8 25. Rxh7+ 1-0`,
  },
  {
    label: "Reti vs Alekhine, 1925",
    white: "Reti, Richard", black: "Alekhine, Alexander", year: 1925,
    description: "Alekhine's legendary win — Baden-Baden",
    category: "romantic", tags: ["attack", "sacrifice", "positional"],
    pgn: `[Event "Baden-Baden"]
[Site "Baden-Baden GER"]
[Date "1925.04.25"]
[White "Reti, Richard"]
[Black "Alekhine, Alexander"]
[Result "0-1"]

1. g3 e5 2. Nf3 e4 3. Nd4 d5 4. d3 exd3 5. Qxd3 Nf6 6. Bg2 Bb4+ 7. Bd2 Bxd2+ 8. Nxd2 O-O 9. c4 Na6 10. cxd5 Nb4 11. Qc4 Nbxd5 12. N2b3 c6 13. O-O Re8 14. Rfd1 Bg4 15. Rd2 Qc8 16. Nc5 Bh3 17. Bf3 Bg4 18. Bg2 Bh3 19. Bf3 Bg4 20. Bh1 h5 21. b4 a6 22. Rc1 h4 23. a4 hxg3 24. hxg3 Qc7 25. b5 axb5 26. axb5 Re3 27. Nf3 cxb5 28. Qxb5 Nc3 29. Qxb7 Qxb7 30. Nxb7 Nxe2+ 31. Kh2 Ne4 32. Rc4 Nxf2 33. Bg2 Be6 34. Rcc2 Ng4+ 35. Kh3 Ne5+ 36. Kh2 Rxf3 37. Rxe2 Ng4+ 38. Kh3 Ne3+ 39. Kh2 Nxc2 40. Bxf3 Nd4 0-1`,
  },
  {
    label: "Bird vs Morphy, 1858",
    white: "Bird, Henry", black: "Morphy, Paul", year: 1858,
    description: "Morphy's casual brilliancy — London",
    category: "romantic", tags: ["attack", "sacrifice"],
    pgn: `[Event "London"]
[Site "London ENG"]
[Date "1858.??.??"]
[White "Bird, Henry Edward"]
[Black "Morphy, Paul"]
[Result "0-1"]

1. e4 e5 2. Nf3 d6 3. d4 f5 4. Nc3 fxe4 5. Nxe4 d5 6. Ng3 e4 7. Ne5 Nf6 8. Bg5 Bd6 9. Nh5 O-O 10. Qd2 Qe8 11. g4 Nxg4 12. Nxg4 Qxh5 13. Ne5 Bxe5 14. dxe5 Nc6 15. f3 d4 16. Bc4+ Kh8 17. Bxd4 Nxd4 18. Qxd4 Bh3 19. Qd7 Rf7 20. Qd6 Rd8 21. Qb4 e3 22. Qe4 Rd4 23. Qe8+ Rf8 24. Qe6 Rd2 25. Be2 Qg5 0-1`,
  },
  {
    label: "Chigorin vs Steinitz, 1892",
    white: "Chigorin, Mikhail", black: "Steinitz, Wilhelm", year: 1892,
    description: "Evans Gambit in the WC — Havana",
    category: "romantic", tags: ["attack", "sacrifice"],
    pgn: `[Event "World Championship"]
[Site "Havana CUB"]
[Date "1892.01.30"]
[White "Chigorin, Mikhail"]
[Black "Steinitz, Wilhelm"]
[Result "1-0"]

1. e4 e5 2. Nf3 Nc6 3. Bc4 Bc5 4. b4 Bxb4 5. c3 Ba5 6. O-O Nf6 7. d4 O-O 8. d5 Na7 9. Bd3 c5 10. dxc6 bxc6 11. Nbd2 d5 12. exd5 cxd5 13. Qc2 h6 14. Nb3 Bb6 15. Re1 Ba6 16. Bxa6 Nxa6 17. Nbxd5 Nxd5 18. Nxe5 Re8 19. Qg6 fxg6 20. Nxg6 Qf6 21. Bb2 1-0`,
  },
  {
    label: "Tarrasch vs Thorold, 1890",
    white: "Tarrasch, Siegbert", black: "Thorold, Edmund", year: 1890,
    description: "A romantic king hunt — Manchester",
    category: "romantic", tags: ["attack", "sacrifice"],
    pgn: `[Event "Manchester"]
[Site "Manchester ENG"]
[Date "1890.08.25"]
[White "Tarrasch, Siegbert"]
[Black "Thorold, Edmund"]
[Result "1-0"]

1. e4 e5 2. Nf3 Nc6 3. Bb5 Nf6 4. d3 d6 5. c3 g6 6. Nbd2 Bg7 7. Nf1 O-O 8. Ba4 d5 9. Qe2 dxe4 10. dxe4 Be6 11. Ng3 Bc4 12. Qc2 Nd7 13. Nf5 Nc5 14. Be3 Nxa4 15. Qxa4 gxf5 16. exf5 f6 17. Nh4 Bd5 18. Qg4 Kh8 19. Qh5 Rg8 20. Bh6 Rg5 21. Qxh7+ 1-0`,
  },
  {
    label: "Charousek vs Wollner, 1893",
    white: "Charousek, Rudolf", black: "Wollner", year: 1893,
    description: "Romantic era attacking gem — Budapest",
    category: "romantic", tags: ["attack", "sacrifice", "tactics"],
    pgn: `[Event "Budapest"]
[Site "Budapest"]
[Date "1893.??.??"]
[White "Charousek, Rudolf"]
[Black "Wollner"]
[Result "1-0"]

1. e4 e5 2. f4 exf4 3. Nf3 g5 4. h4 g4 5. Ne5 Nf6 6. Bc4 d5 7. exd5 Bd6 8. d4 Nh5 9. O-O Qxh4 10. Qe1 Qxe1 11. Rxe1 f6 12. Nxg4 Bxg4 13. Bxf4 Bxf4 14. Rxe4+ Kf8 15. Rxf4 Kg7 16. Nc3 Re8 17. Re1 Rxe1+ 18. Nxe1 1-0`,
  },

  // ═══════════════════════════════════════════════════════════════
  //  POSITIONAL MASTERPIECES
  // ═══════════════════════════════════════════════════════════════
  {
    label: "Capablanca vs Marshall, 1918",
    white: "Capablanca, Jose Raul", black: "Marshall, Frank James", year: 1918,
    description: "Debut of the Marshall Attack — New York",
    category: "positional", tags: ["defense", "positional"],
    pgn: `[Event "New York"]
[Site "New York USA"]
[Date "1918.10.23"]
[White "Capablanca, Jose Raul"]
[Black "Marshall, Frank James"]
[Result "1-0"]

1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6 5. O-O Be7 6. Re1 b5 7. Bb3 O-O 8. c3 d5 9. exd5 Nxd5 10. Nxe5 Nxe5 11. Rxe5 Nf6 12. Re1 Bd6 13. h3 Ng4 14. Qf3 Qh4 15. d4 Nxf2 16. Re2 Bg4 17. hxg4 Bh2+ 18. Kf1 Bg3 19. Rxf2 Qh1+ 20. Ke2 Bxf2 21. Bd2 Bh4 22. Qh3 Rae8+ 23. Kd3 Qf1+ 24. Kc2 Bf2 25. Qf3 Qg1 26. Bd5 c5 27. dxc5 Bxc5 28. b4 Bd6 29. a4 a5 30. axb5 axb4 31. Ra6 bxc3 32. Nxc3 Bb4 33. b6 Bxc3 34. Bxc3 h6 35. b7 Re3 36. Bxf7+ 1-0`,
  },
  {
    label: "Kasparov vs Kramnik, 1994",
    white: "Kasparov, Garry", black: "Kramnik, Vladimir", year: 1994,
    description: "Rook and bishop domination — Linares",
    category: "positional", tags: ["positional", "attack"],
    pgn: `[Event "Linares"]
[Site "Linares ESP"]
[Date "1994.03.05"]
[White "Kasparov, Garry"]
[Black "Kramnik, Vladimir"]
[Result "1-0"]

1. Nf3 Nf6 2. c4 e6 3. Nc3 d5 4. d4 c6 5. e3 Nbd7 6. Bd3 dxc4 7. Bxc4 b5 8. Bd3 Bb7 9. e4 b4 10. Na4 c5 11. e5 Nd5 12. Nxc5 Nxc5 13. dxc5 Bxc5 14. O-O Be7 15. Nd4 O-O 16. Nf5 exf5 17. Bxf5 Qd7 18. Bxd7 Bc8 19. Bf5 Bxf5 20. Qxd5 Be4 21. Qe5 Rfe8 22. Qf4 Bf5 23. Be3 Bg5 24. Qg3 Bxe3 25. Qxe3 Be4 26. Rfd1 Rac8 27. Rd4 Bc2 28. Rc1 Be4 29. Rd6 1-0`,
  },
  {
    label: "Petrosian vs Spassky, WC 1966 G10",
    white: "Petrosian, Tigran", black: "Spassky, Boris", year: 1966,
    description: "Iron Tigran's squeeze — Moscow WC",
    category: "positional", tags: ["positional", "defense"],
    pgn: `[Event "World Championship"]
[Site "Moscow URS"]
[Date "1966.04.27"]
[White "Petrosian, Tigran V"]
[Black "Spassky, Boris V"]
[Result "1-0"]

1. Nf3 d5 2. d4 Nf6 3. c4 e6 4. Nc3 c5 5. cxd5 Nxd5 6. e3 Nc6 7. Bd3 Be7 8. O-O O-O 9. a3 cxd4 10. exd4 Bf6 11. Re1 Nce7 12. Bg5 Bxg5 13. Nxg5 Nf5 14. Qh5 h6 15. Nf3 Bd7 16. Rad1 Qb6 17. Bc2 Rfd8 18. Qg4 Be8 19. d5 e5 20. Ne4 Nd6 21. Ng3 Qd4 22. Nf5 Nxf5 23. Bxf5 Qxa1 24. Ne5 g6 25. Bxg6 1-0`,
  },
  {
    label: "Karpov vs Unzicker, 1974",
    white: "Karpov, Anatoly", black: "Unzicker, Wolfgang", year: 1974,
    description: "Karpov's python squeeze — Nice Olympiad",
    category: "positional", tags: ["positional", "endgame"],
    pgn: `[Event "Nice Olympiad"]
[Site "Nice FRA"]
[Date "1974.06.??"]
[White "Karpov, Anatoly"]
[Black "Unzicker, Wolfgang"]
[Result "1-0"]

1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6 5. O-O Be7 6. Re1 b5 7. Bb3 d6 8. c3 O-O 9. h3 Nb8 10. d4 Nbd7 11. Nbd2 Bb7 12. Bc2 Re8 13. Nf1 Bf8 14. Ng3 g6 15. Bg5 Bg7 16. Qd2 h6 17. Bh4 Nh7 18. Bxd8 1-0`,
  },
  {
    label: "Rubinstein vs Salwe, 1908",
    white: "Rubinstein, Akiba", black: "Salwe, Georg", year: 1908,
    description: "The model rook endgame — Lodz",
    category: "positional", tags: ["endgame", "positional"],
    pgn: `[Event "Lodz"]
[Site "Lodz RUS"]
[Date "1908.??.??"]
[White "Rubinstein, Akiba"]
[Black "Salwe, Georg"]
[Result "1-0"]

1. d4 d5 2. Nf3 c5 3. c4 e6 4. cxd5 exd5 5. Nc3 Nf6 6. g3 Nc6 7. Bg2 cxd4 8. Nxd4 Qb6 9. Nxc6 bxc6 10. O-O Be7 11. Na4 Qb5 12. Be3 O-O 13. Rc1 Bg4 14. f3 Be6 15. Bc5 Rfe8 16. Rf2 Nd7 17. Bxe7 Rxe7 18. Qd4 Ree8 19. Bf1 Rec8 20. e3 Qb7 21. Nc5 Nxc5 22. Rxc5 Rc7 23. Rfc2 Rac8 24. b4 a6 25. Ra5 Rb8 26. a3 Ra7 27. Rxc6 Qd7 28. Rc3 Qd8 29. Qa7 1-0`,
  },
  {
    label: "Kramnik vs Kasparov, 2001",
    white: "Kramnik, Vladimir", black: "Kasparov, Garry", year: 2001,
    description: "Positional masterclass — Botvinnik Memorial",
    category: "positional", tags: ["positional"],
    pgn: `[Event "Botvinnik Memorial"]
[Site "Moscow RUS"]
[Date "2001.12.01"]
[White "Kramnik, Vladimir"]
[Black "Kasparov, Garry"]
[Result "1-0"]

1. d4 Nf6 2. c4 e6 3. Nc3 Bb4 4. e3 O-O 5. Bd3 d5 6. cxd5 exd5 7. Nge2 Re8 8. O-O Bd6 9. a3 c6 10. Qc2 Nbd7 11. f3 Nf8 12. Bd2 Ng6 13. Rae1 Be6 14. Ng3 Nd7 15. Nf5 Nf6 16. Kh1 Bxf5 17. Bxf5 Qc7 18. Bxg6 hxg6 19. e4 dxe4 20. fxe4 e5 21. dxe5 Rxe5 22. Bf4 Re6 23. e5 Nd5 24. Nxd5 cxd5 25. Qd3 Rae8 26. Qxd5 Bc5 27. Qd2 Bb6 28. Qf2 R8e7 29. Bg5 Re2 30. Qf3 R2e5 31. Bf4 R5e6 32. Rc1 1-0`,
  },
  {
    label: "Carlsen vs Aronian, 2012",
    white: "Carlsen, Magnus", black: "Aronian, Levon", year: 2012,
    description: "Prophylactic perfection — Wijk aan Zee",
    category: "positional", tags: ["positional", "endgame"],
    pgn: `[Event "Tata Steel GpA"]
[Site "Wijk aan Zee NED"]
[Date "2012.01.15"]
[White "Carlsen, Magnus"]
[Black "Aronian, Levon"]
[Result "1-0"]

1. d4 d5 2. c4 c6 3. Nf3 Nf6 4. Nc3 e6 5. e3 Nbd7 6. Bd3 dxc4 7. Bxc4 b5 8. Bd3 Bd6 9. O-O O-O 10. Qc2 Bb7 11. a3 Rc8 12. b4 a5 13. Rb1 axb4 14. axb4 Qe7 15. e4 e5 16. dxe5 Nxe5 17. Nxe5 Bxe5 18. h3 Rfd8 19. Be3 Bd4 20. Rfd1 Bxe3 21. fxe3 Rxd3 22. Rxd3 Qe5 23. Qf2 Rc4 24. Rbd1 Rxe4 25. Rd8+ Ne8 26. R1d4 Rxd4 27. exd4 Qf6 28. Qe3 Kf8 29. Qb6 h6 30. R8d7 Bc8 31. Rc7 Bd7 32. Nd5 Qf5 33. Ne7 1-0`,
  },
  {
    label: "Smyslov vs Reshevsky, 1948",
    white: "Smyslov, Vasily", black: "Reshevsky, Samuel", year: 1948,
    description: "Smyslov's harmony — WC Tournament",
    category: "positional", tags: ["positional", "endgame"],
    pgn: `[Event "World Championship Tournament"]
[Site "The Hague/Moscow"]
[Date "1948.03.??"]
[White "Smyslov, Vasily"]
[Black "Reshevsky, Samuel"]
[Result "1-0"]

1. d4 d5 2. c4 e6 3. Nc3 Nf6 4. Bg5 Nbd7 5. e3 c6 6. cxd5 exd5 7. Bd3 Be7 8. Qc2 O-O 9. Nge2 Re8 10. O-O Nf8 11. f3 Be6 12. Rad1 Rc8 13. Kh1 N6d7 14. Bxe7 Qxe7 15. Nd4 Ng6 16. Rfe1 a6 17. Bf1 Nde5 18. a3 Nh4 19. g3 Nhf5 20. Nxf5 Bxf5 21. Qd2 Nd7 22. Bg2 Be6 23. f4 Nf6 24. Qf2 Qb4 25. b3 a5 26. e4 dxe4 27. Nxe4 Nxe4 28. Bxe4 Bf5 29. Bxf5 Rxe1+ 30. Rxe1 Qxd4 31. Qxd4 1-0`,
  },

  // ═══════════════════════════════════════════════════════════════
  //  ENDGAME CLASSICS
  // ═══════════════════════════════════════════════════════════════
  {
    label: "Fischer vs Taimanov, 1971 G6",
    white: "Fischer, Robert James", black: "Taimanov, Mark", year: 1971,
    description: "6-0 sweep — Vancouver Candidates",
    category: "endgame", tags: ["endgame", "positional"],
    pgn: `[Event "Candidates QF"]
[Site "Vancouver CAN"]
[Date "1971.05.??"]
[White "Fischer, Robert James"]
[Black "Taimanov, Mark"]
[Result "1-0"]

1. e4 c5 2. Nf3 Nc6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 d6 6. Bc4 e6 7. Bb3 a6 8. f4 Qa5 9. O-O Nxd4 10. Qxd4 d5 11. Be3 Nxe4 12. Nxe4 dxe4 13. c4 Bd6 14. f5 Bc5 15. Qxe4 Bxe3+ 16. Qxe3 O-O 17. fxe6 fxe6 18. Rf3 Bd7 19. Re1 Rae8 20. Rg3 Kh8 21. Qe5 Bc8 22. Qg5 Rd8 23. Re5 b5 24. Rh3 Rf6 25. Qg3 Rdf8 26. Rg5 bxc4 27. Bxc4 e5 28. Qg4 Qc3 29. Rh5 Qd4+ 30. Kh1 h6 31. Bd5 1-0`,
  },
  {
    label: "Karpov vs Kasparov, 1993",
    white: "Karpov, Anatoly", black: "Kasparov, Garry", year: 1993,
    description: "Karpov's endgame technique — Linares",
    category: "endgame", tags: ["endgame", "positional"],
    pgn: `[Event "Linares"]
[Site "Linares ESP"]
[Date "1993.03.05"]
[White "Karpov, Anatoly"]
[Black "Kasparov, Garry"]
[Result "1-0"]

1. d4 Nf6 2. c4 e6 3. Nf3 b6 4. a3 Bb7 5. Nc3 d5 6. cxd5 Nxd5 7. Qc2 Nxc3 8. bxc3 Be7 9. e4 O-O 10. Bd3 c5 11. O-O Qc8 12. Qe2 Ba6 13. Rd1 Rd8 14. e5 cxd4 15. Bxa6 Nxa6 16. cxd4 Rxd4 17. Rxd4 Qxc1+ 18. Rd1 Qc7 19. Qd2 Rd8 20. Qf4 Qc2 21. Nd4 Qc7 22. Qg4 Nc5 23. Nb5 Qc6 24. Rxd8+ Bxd8 25. Nd6 Ne4 26. Nxf7 Nd2 27. N7h6+ 1-0`,
  },
  {
    label: "Carlsen vs Anand, 2014 WC G11",
    white: "Carlsen, Magnus", black: "Anand, Viswanathan", year: 2014,
    description: "Endgame squeeze — Sochi WC",
    category: "endgame", tags: ["endgame", "positional"],
    pgn: `[Event "World Championship"]
[Site "Sochi RUS"]
[Date "2014.11.??"]
[White "Carlsen, Magnus"]
[Black "Anand, Viswanathan"]
[Result "1-0"]

1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6 5. O-O Be7 6. d3 b5 7. Bb3 d6 8. a3 O-O 9. Nc3 Na5 10. Ba2 Be6 11. b4 Bxa2 12. Rxa2 Nc6 13. Bg5 Nd4 14. Nxd4 exd4 15. Bxf6 Bxf6 16. Nd5 Bg5 17. Ra1 c6 18. Nf4 a5 19. Qg4 Kh8 20. Qe2 axb4 21. axb4 Ra3 22. h4 Be7 23. Ng6+ hxg6 24. Qe1 Ra2 25. Qh4+ Bxh4 26. Rxa2 1-0`,
  },
  {
    label: "Smyslov vs Botvinnik, WC 1957 G5",
    white: "Smyslov, Vasily", black: "Botvinnik, Mikhail", year: 1957,
    description: "Smyslov's endgame artistry — Moscow WC",
    category: "endgame", tags: ["endgame", "positional"],
    pgn: `[Event "World Championship"]
[Site "Moscow URS"]
[Date "1957.03.??"]
[White "Smyslov, Vasily"]
[Black "Botvinnik, Mikhail"]
[Result "1-0"]

1. d4 Nf6 2. c4 e6 3. Nc3 Bb4 4. e3 O-O 5. Bd3 d5 6. Nf3 c5 7. O-O Nc6 8. a3 Bxc3 9. bxc3 b6 10. cxd5 exd5 11. a4 c4 12. Bc2 Bg4 13. Qe1 Ne4 14. Nd2 Nxd2 15. Bxd2 Na5 16. f3 Bh5 17. e4 dxe4 18. fxe4 Bg6 19. Qe3 Nb3 20. Bxb3 cxb3 21. Qxb3 Bxe4 22. Ba5 Qd5 23. Qxd5 Bxd5 24. Bxb6 axb6 25. Rxf7 Rxf7 26. Kf2 1-0`,
  },
  {
    label: "Capablanca vs Tartakower, 1924",
    white: "Capablanca, Jose Raul", black: "Tartakower, Savielly", year: 1924,
    description: "The passed pawn march — New York",
    category: "endgame", tags: ["endgame", "positional"],
    pgn: `[Event "New York"]
[Site "New York USA"]
[Date "1924.03.23"]
[White "Capablanca, Jose Raul"]
[Black "Tartakower, Saviely"]
[Result "1-0"]

1. d4 e6 2. Nf3 f5 3. c4 Nf6 4. Bg5 Be7 5. Nc3 O-O 6. e3 b6 7. Bd3 Bb7 8. O-O Qe8 9. Qe2 Ne4 10. Bxe7 Nxc3 11. bxc3 Qxe7 12. a4 Bxf3 13. Qxf3 Nc6 14. Rfb1 Rae8 15. Qh3 Rf6 16. f3 Na5 17. e4 fxe4 18. fxe4 Qf7 19. e5 Rf5 20. Qe3 Nc6 21. Be4 Rd5 22. Bxd5 exd5 23. Rxb6 cxb6 24. Qxb6 Ra8 25. c5 Qf5 26. c6 Qc2 27. Qd6 Qb3 28. c7 Qc4 29. Qd7 1-0`,
  },

  // ═══════════════════════════════════════════════════════════════
  //  ATTACKING CLASSICS
  // ═══════════════════════════════════════════════════════════════
  {
    label: "Short vs Timman, 1991",
    white: "Short, Nigel D", black: "Timman, Jan H", year: 1991,
    description: "The King Walk — Tilburg",
    category: "attacking", tags: ["attack", "tactics"],
    pgn: `[Event "Tilburg"]
[Site "Tilburg NED"]
[Date "1991.10.??"]
[White "Short, Nigel D"]
[Black "Timman, Jan H"]
[Result "1-0"]

1. e4 Nf6 2. e5 Nd5 3. d4 d6 4. Nf3 g6 5. Bc4 Nb6 6. Bb3 Bg7 7. Qe2 Nc6 8. O-O O-O 9. h3 a5 10. a4 dxe5 11. dxe5 Nd4 12. Nxd4 Qxd4 13. Re1 e6 14. Nd2 Nd5 15. Nf3 Qc5 16. Qe4 Qb4 17. Bc4 Nb6 18. b3 Nxc4 19. bxc4 Re8 20. Rd1 Qc5 21. Qh4 b6 22. Be3 Qc6 23. Bh6 Bh8 24. Rd8 Bb7 25. Rad1 Bg7 26. R8d3 Qc5 27. Bxg7 Kxg7 28. Rd7 Rf8 29. Qf6+ Kg8 30. h4 h5 31. Kh2 Rc8 32. Kg3 Rce8 33. Kf4 Bc8 34. Kg5 1-0`,
  },
  {
    label: "Ivanchuk vs Yusupov, 1991",
    white: "Ivanchuk, Vassily", black: "Yusupov, Artur", year: 1991,
    description: "Ivanchuk's brilliancy — Brussels Candidates",
    category: "attacking", tags: ["attack", "sacrifice", "tactics"],
    pgn: `[Event "Candidates qf"]
[Site "Brussels BEL"]
[Date "1991.06.??"]
[White "Ivanchuk, Vassily"]
[Black "Yusupov, Artur"]
[Result "1-0"]

1. c4 e5 2. g3 d6 3. Bg2 g6 4. d4 Nd7 5. Nc3 Bg7 6. Nf3 Ngf6 7. O-O O-O 8. Qc2 Re8 9. Rd1 c6 10. b3 Qe7 11. Ba3 e4 12. Nd2 e3 13. fxe3 Ng4 14. Nf3 Qxe3+ 15. Kh1 Ndf6 16. Ng5 Nh5 17. d5 cxd5 18. Nd1 Qe7 19. Nf3 Ne3 20. Nxe3 Qxe3 21. Bf4 Qe2 22. Qd2 Qxd2 23. Rxd2 d4 24. Bxd6 Bf5 25. e3 Rad8 26. Bb4 dxe3 27. Rxd8 Rxd8 28. Re1 Bc2 29. Rxe3 Bxb3 30. Re7 Bc4 31. Nd4 Nf6 32. Bf1 Bd5+ 33. Kg1 Rd7 34. Re5 Bc4 35. Nc6 Bxf1 36. Ne7+ Kf8 37. Kxf1 Kxe7 38. Rxe7 1-0`,
  },
  {
    label: "Alekhine vs Reti, 1925",
    white: "Alekhine, Alexander", black: "Reti, Richard", year: 1925,
    description: "Positional crush — Baden-Baden",
    category: "attacking", tags: ["attack", "sacrifice", "positional"],
    pgn: `[Event "Baden-Baden"]
[Site "Baden-Baden GER"]
[Date "1925.04.25"]
[White "Alekhine, Alexander"]
[Black "Reti, Richard"]
[Result "1-0"]

1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6 5. O-O Nxe4 6. d4 b5 7. Bb3 d5 8. dxe5 Be6 9. c3 Bc5 10. Nbd2 O-O 11. Bc2 Nxd2 12. Qxd2 f6 13. exf6 Qxf6 14. Qd3 g6 15. b4 Bb6 16. Bb2 Rae8 17. a4 Bd7 18. a5 Ba7 19. Rae1 Rxe1 20. Rxe1 Qf4 21. Qd1 Bg4 22. Nd4 Nxd4 23. cxd4 Bxd4 24. Bxd4 Qxd4 25. Qxg4 Qxb4 26. Qd7 Qd2 27. Qxc7 Qxe1+ 28. Bf1 h5 29. Qxa5 Qe4 30. Qa8 1-0`,
  },
  {
    label: "Tal vs Larsen, 1965",
    white: "Tal, Mikhail", black: "Larsen, Bent", year: 1965,
    description: "The Magician's best — Candidates",
    category: "attacking", tags: ["sacrifice", "attack", "tactics"],
    pgn: `[Event "Candidates"]
[Site "Bled YUG"]
[Date "1965.10.??"]
[White "Tal, Mikhail"]
[Black "Larsen, Bent"]
[Result "1-0"]

1. e4 c5 2. Nf3 Nc6 3. d4 cxd4 4. Nxd4 e6 5. Nc3 d6 6. Be3 Nf6 7. f4 Be7 8. Qf3 O-O 9. O-O-O Qc7 10. Ndb5 Qb8 11. g4 a6 12. Nd4 Nxd4 13. Bxd4 b5 14. g5 Nd7 15. Bd3 b4 16. Nd5 exd5 17. exd5 f5 18. Rde1 Rf7 19. h4 Bb7 20. Bxf5 Rxf5 21. Rxe7 Qf8 22. Qe4 Nf6 23. Qe6+ Kh8 24. Bxf6 gxf6 25. Re1 Rd8 26. gxf6 Rf7 27. Qe3 Bc8 28. Qg5 Qf8 29. Re8 1-0`,
  },
  {
    label: "Kasparov vs Piket, 2000",
    white: "Kasparov, Garry", black: "Piket, Jeroen", year: 2000,
    description: "Kasparov's final brilliancy — Wijk aan Zee",
    category: "attacking", tags: ["attack", "sacrifice"],
    pgn: `[Event "Corus"]
[Site "Wijk aan Zee NED"]
[Date "2000.01.22"]
[White "Kasparov, Garry"]
[Black "Piket, Jeroen"]
[Result "1-0"]

1. d4 Nf6 2. c4 g6 3. Nc3 d5 4. cxd5 Nxd5 5. e4 Nxc3 6. bxc3 Bg7 7. Nf3 c5 8. Rb1 O-O 9. Be2 Nc6 10. d5 Ne5 11. Nxe5 Bxe5 12. Qd2 e6 13. f4 Bg7 14. O-O exd5 15. exd5 b6 16. f5 Re8 17. f6 Bh8 18. Bg5 Qd6 19. Bf4 Qd8 20. d6 Bf5 21. Rb2 Be4 22. Bd3 Bxd3 23. Qxd3 Qd7 24. Rd2 Rad8 25. Bg5 Re6 26. Rdf2 Re5 27. Bf4 Rde8 28. Bxe5 Rxe5 29. Qf3 b5 30. g4 a5 31. Rf1 Re2 32. Qd3 Rxa2 33. g5 1-0`,
  },
  {
    label: "Keres vs Spassky, 1965",
    white: "Keres, Paul", black: "Spassky, Boris", year: 1965,
    description: "Candidates Semi-Final — Riga",
    category: "attacking", tags: ["attack", "sacrifice"],
    pgn: `[Event "Candidates Semi-Final"]
[Site "Riga URS"]
[Date "1965.05.??"]
[White "Keres, Paul"]
[Black "Spassky, Boris"]
[Result "0-1"]

1. d4 d5 2. c4 dxc4 3. Nf3 Nf6 4. e3 e6 5. Bxc4 c5 6. O-O a6 7. Qe2 b5 8. Bb3 Bb7 9. Rd1 Nbd7 10. Nc3 Bd6 11. e4 cxd4 12. Nxd4 Nc5 13. e5 Bxe5 14. Be3 O-O 15. f4 Bd6 16. Bc2 Qe7 17. f5 Nce4 18. fxe6 fxe6 19. Nxe4 Nxe4 20. Rf1 Qg5 21. Be1 Rxf1+ 22. Qxf1 Be5 23. Bf2 Qe3 24. Nc2 Qd2 25. Nd4 Nxf2 26. Qxf2 Bxd4 27. Qxd2 Bxa1 0-1`,
  },
  {
    label: "Spassky vs Fischer, 1960",
    white: "Spassky, Boris", black: "Fischer, Robert James", year: 1960,
    description: "Spassky's king hunt — Mar del Plata",
    category: "attacking", tags: ["attack", "sacrifice"],
    pgn: `[Event "Mar del Plata"]
[Site "Mar del Plata ARG"]
[Date "1960.03.29"]
[White "Spassky, Boris V"]
[Black "Fischer, Robert James"]
[Result "1-0"]

1. d4 Nf6 2. c4 g6 3. Nc3 Bg7 4. e4 d6 5. f3 O-O 6. Be3 e5 7. d5 Nh5 8. Qd2 Qh4+ 9. g3 Nxg3 10. Qf2 Nxf1 11. Qxh4 Nxe3 12. Ke2 Nxc4 13. Qf2 Nb6 14. Qg2 c6 15. Nge2 cxd5 16. exd5 Na6 17. Ng3 Bd7 18. a4 Nc7 19. a5 Nc8 20. Nd1 Bb5+ 21. Ke1 Na6 22. Nf2 f5 23. h4 Rac8 24. h5 Nc5 25. Rh4 Bf6 26. Rh1 Bg5 27. hxg6 hxg6 28. Nfe4 fxe4 29. Rxh8+ 1-0`,
  },
  {
    label: "Bogoljubov vs Alekhine, 1922",
    white: "Bogoljubov, Efim", black: "Alekhine, Alexander", year: 1922,
    description: "The double bishop sacrifice — Hastings",
    category: "attacking", tags: ["sacrifice", "attack", "tactics"],
    pgn: `[Event "Hastings"]
[Site "Hastings ENG"]
[Date "1922.09.21"]
[White "Bogoljubov, Efim"]
[Black "Alekhine, Alexander"]
[Result "0-1"]

1. d4 f5 2. c4 Nf6 3. g3 e6 4. Bg2 Bb4+ 5. Bd2 Bxd2+ 6. Nxd2 Nc6 7. Ngf3 O-O 8. O-O d6 9. Qb3 Kh8 10. Qc3 e5 11. e3 a5 12. b3 Qe8 13. a3 Qh5 14. h4 Ng4 15. Ng5 Bd7 16. f3 Nf6 17. f4 e4 18. Rfd1 h6 19. Nh3 d5 20. Nf1 Ne7 21. a4 Nc6 22. Rd2 Nb4 23. Bh1 Qe8 24. Bg2 dxc4 25. bxc4 Bxa4 26. Nf2 Nd3 27. Nxd3 exd3 28. Qxd3 Bc6 29. Bxc6 Qxc6 30. Kg2 Rae8 31. Re1 Re4 32. Nd2 Qxc4 33. Qxc4 Rxc4 34. Nb3 Rc3 35. Kf2 Nd5 36. Rb2 b6 37. Na1 Rxe3 38. Rxe3 Nxe3 0-1`,
  },
  {
    label: "Bronstein vs Ljubojevic, 1973",
    white: "Bronstein, David", black: "Ljubojevic, Ljubomir", year: 1973,
    description: "Bronstein's creative attack — Petropolis",
    category: "attacking", tags: ["attack", "sacrifice", "tactics"],
    pgn: `[Event "Interzonal"]
[Site "Petropolis BRA"]
[Date "1973.08.??"]
[White "Bronstein, David"]
[Black "Ljubojevic, Ljubomir"]
[Result "1-0"]

1. e4 c5 2. Nf3 d6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 a6 6. Bg5 e6 7. f4 Be7 8. Qf3 Qc7 9. O-O-O Nbd7 10. g4 b5 11. Bxf6 Nxf6 12. g5 Nd7 13. f5 Bxg5+ 14. Kb1 Ne5 15. Qh5 Qd8 16. Nxe6 Bxe6 17. fxe6 O-O 18. Nd5 fxe6 19. Qh3 Rxf2 20. Nf4 Bxf4 21. Qxe6+ Kh8 22. Bd3 Qe7 23. Bxe5 1-0`,
  },

  // ═══════════════════════════════════════════════════════════════
  //  TACTICAL FIREWORKS
  // ═══════════════════════════════════════════════════════════════
  {
    label: "Petrosian vs Fischer, 1971",
    white: "Petrosian, Tigran", black: "Fischer, Robert James", year: 1971,
    description: "Fischer's exchange sacrifice — Buenos Aires",
    category: "tactical", tags: ["sacrifice", "positional"],
    pgn: `[Event "Candidates Final"]
[Site "Buenos Aires ARG"]
[Date "1971.10.07"]
[White "Petrosian, Tigran V"]
[Black "Fischer, Robert James"]
[Result "0-1"]

1. e4 c5 2. Nf3 e6 3. d4 cxd4 4. Nxd4 a6 5. Bd3 Nf6 6. O-O Qc7 7. Nd2 Nc6 8. Nxc6 dxc6 9. f4 e5 10. Qf3 Bc5+ 11. Kh1 O-O 12. fxe5 Ng4 13. Qe2 f6 14. exf6 Nxf6 15. Nc4 Ng4 16. Bf4 Bd4 17. h3 Rxf4 18. hxg4 Bxg4 19. Qe1 Raf8 20. Rxf4 Rxf4 21. Nd2 Qf7 22. Nf3 Bxf3 23. gxf3 Qh5+ 24. Kg2 Qg5+ 25. Kh3 Rf6 26. f4 Qh6+ 27. Kg4 Qh5+ 28. Kf4 g5# 0-1`,
  },
  {
    label: "Shirov vs Topalov, 1998",
    white: "Shirov, Alexei", black: "Topalov, Veselin", year: 1998,
    description: "Shirov catches fire — Linares",
    category: "tactical", tags: ["sacrifice", "attack", "tactics"],
    pgn: `[Event "Linares"]
[Site "Linares ESP"]
[Date "1998.02.25"]
[White "Shirov, Alexei"]
[Black "Topalov, Veselin"]
[Result "1-0"]

1. d4 f5 2. g3 Nf6 3. Bg2 g6 4. Nf3 Bg7 5. O-O O-O 6. c4 d6 7. Nc3 Nc6 8. d5 Na5 9. Nd4 c5 10. dxc6 bxc6 11. b3 d5 12. cxd5 cxd5 13. Bb2 Bb7 14. e3 Qd6 15. Qe2 Rae8 16. Rad1 e5 17. Nf3 e4 18. Nd4 Nc6 19. Nxc6 Bxc6 20. Nb5 Qe7 21. Nd4 Bd7 22. a4 Rc8 23. h3 Rc4 24. Rc1 Rfc8 25. Rxc4 Rxc4 26. Ra1 Bf8 27. Rc1 Rxc1+ 28. Bxc1 Qc5 29. Bb2 Ng4 30. hxg4 fxg4 31. Nf5 Qe5 32. f4 exf3 33. Bxf3 gxf3 34. Qxf3 gxf5 35. Qxd5+ 1-0`,
  },
  {
    label: "Anand vs Topalov, 2005",
    white: "Anand, Viswanathan", black: "Topalov, Veselin", year: 2005,
    description: "Exchange sac masterpiece — San Luis WCT",
    category: "tactical", tags: ["sacrifice", "tactics", "attack"],
    pgn: `[Event "WCC Tournament"]
[Site "San Luis ARG"]
[Date "2005.09.30"]
[White "Anand, Viswanathan"]
[Black "Topalov, Veselin"]
[Result "1-0"]

1. e4 c5 2. Nf3 d6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 a6 6. Be2 e6 7. O-O Be7 8. a4 Nc6 9. Be3 O-O 10. f4 Qc7 11. Kh1 Re8 12. Bf3 Bd7 13. Nb3 b6 14. g4 Bc8 15. g5 Nd7 16. Bg2 Bb7 17. Rf3 Rac8 18. Rh3 Nf8 19. Qh5 g6 20. Qh4 Bg5 21. fxg5 Nxe4 22. Nd5 Qd8 23. Nf4 Nxg5 24. Rd3 e5 25. Nhg6 hxg6 26. Nxg6 fxg6 27. Bxg5 Qxg5 28. Qxg5 Bxg2+ 29. Kxg2 1-0`,
  },
  {
    label: "Kasparov vs Deep Blue, 1996 G1",
    white: "Kasparov, Garry", black: "Deep Blue", year: 1996,
    description: "Man beats machine — Philadelphia",
    category: "tactical", tags: ["attack", "sacrifice", "tactics"],
    pgn: `[Event "Man vs Machine"]
[Site "Philadelphia USA"]
[Date "1996.02.10"]
[White "Kasparov, Garry"]
[Black "Deep Blue"]
[Result "1-0"]

1. e4 c5 2. c3 d5 3. exd5 Qxd5 4. d4 Nf6 5. Nf3 Bg4 6. Be2 e6 7. h3 Bh5 8. O-O Nc6 9. Be3 cxd4 10. cxd4 Bb4 11. a3 Ba5 12. Nc3 Qd6 13. Nb5 Qe7 14. Ne5 Bxe2 15. Qxe2 O-O 16. Rac1 Rac8 17. Bg5 Bb6 18. Bxf6 gxf6 19. Nc4 Rfd8 20. Nxb6 axb6 21. Rfd1 f5 22. Qe3 Qf6 23. d5 Rxd5 24. Rxd5 exd5 25. b3 Kh8 26. Qxb6 Rg8 27. Qc5 d4 28. Nd6 f4 29. Nxb7 Ne5 30. Qd5 f3 31. g3 Nd3 32. Rc7 Re8 33. Nd6 Re1+ 34. Kh2 Nxf2 35. Nxf7+ Kg7 36. Ng5+ Kh6 37. Rxh7+ 1-0`,
  },
  {
    label: "Ivanchuk vs Kasparov, 1991",
    white: "Ivanchuk, Vassily", black: "Kasparov, Garry", year: 1991,
    description: "The young lion strikes — Linares",
    category: "tactical", tags: ["attack", "tactics"],
    pgn: `[Event "Linares"]
[Site "Linares ESP"]
[Date "1991.03.??"]
[White "Ivanchuk, Vassily"]
[Black "Kasparov, Garry"]
[Result "1-0"]

1. c4 e5 2. g3 Nf6 3. Bg2 d5 4. cxd5 Nxd5 5. Nc3 Nb6 6. Nf3 Nc6 7. O-O Be7 8. d3 O-O 9. Be3 Be6 10. Na4 Nxa4 11. Qxa4 f6 12. Rfc1 Qd7 13. Qc2 Nd4 14. Bxd4 exd4 15. a4 Bd6 16. a5 Rae8 17. Nd2 f5 18. Nc4 Bf7 19. a6 b6 20. Qb3 Kh8 21. Rc2 Qe6 22. Rac1 g5 23. Nxd6 cxd6 24. Rc7 h5 25. Bf3 f4 26. Bxh5 Bxh5 27. Qc4 d5 28. Qc6 fxg3 29. hxg3 g4 30. Qxb6 1-0`,
  },
  {
    label: "Topalov vs Anand, 2005",
    white: "Topalov, Veselin", black: "Anand, Viswanathan", year: 2005,
    description: "Topalov's exchange sac — San Luis WCT",
    category: "tactical", tags: ["sacrifice", "attack"],
    pgn: `[Event "WCC Tournament"]
[Site "San Luis ARG"]
[Date "2005.09.29"]
[White "Topalov, Veselin"]
[Black "Anand, Viswanathan"]
[Result "1-0"]

1. d4 Nf6 2. c4 e6 3. Nf3 d5 4. g3 dxc4 5. Bg2 Nc6 6. Qa4 Bb4+ 7. Bd2 Nd5 8. Bxb4 Nxb4 9. O-O Rb8 10. Nc3 a5 11. Ne5 O-O 12. Nxc4 b5 13. Qb3 bxc4 14. Qxc4 Nd5 15. Nxd5 exd5 16. Qc3 Be6 17. a4 Qd7 18. Rfc1 Rfc8 19. Qe3 Rb4 20. Qe5 c6 21. Bf1 Rcb8 22. Be2 f6 23. Qg3 Bf5 24. e4 dxe4 25. Bc4+ Kf8 26. Qf4 Rxb2 27. Re1 Qd2 28. Rxe4 1-0`,
  },
  {
    label: "Grischuk vs Bacrot, 2002",
    white: "Grischuk, Alexander", black: "Bacrot, Etienne", year: 2002,
    description: "Young Grischuk's tactical storm — Cannes",
    category: "tactical", tags: ["sacrifice", "tactics", "attack"],
    pgn: `[Event "Cannes"]
[Site "Cannes FRA"]
[Date "2002.03.??"]
[White "Grischuk, Alexander"]
[Black "Bacrot, Etienne"]
[Result "1-0"]

1. e4 c5 2. Nf3 d6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 a6 6. Be2 e5 7. Nb3 Be7 8. O-O O-O 9. Be3 Be6 10. Qd2 Nbd7 11. a4 Qc7 12. a5 Rfc8 13. f3 Rab8 14. Kh1 Nc5 15. Nxc5 dxc5 16. Bf2 b5 17. axb6 Rxb6 18. Bg3 Nd7 19. Nd5 Bxd5 20. exd5 Bf6 21. c4 a5 22. Rfe1 Nb8 23. Bf1 Na6 24. Ra4 Nb4 25. Be4 Rd8 26. d6 Qc6 27. Bf5 Rc8 28. Qe2 g6 29. Bd3 a4 30. f4 1-0`,
  },
  {
    label: "Gashimov vs Carlsen, 2010",
    white: "Gashimov, Vugar", black: "Carlsen, Magnus", year: 2010,
    description: "Gashimov's tactical fireworks — Astrakhan",
    category: "tactical", tags: ["attack", "tactics", "sacrifice"],
    pgn: `[Event "Grand Prix"]
[Site "Astrakhan RUS"]
[Date "2010.05.20"]
[White "Gashimov, Vugar"]
[Black "Carlsen, Magnus"]
[Result "1-0"]

1. d4 Nf6 2. c4 e6 3. Nf3 d5 4. Nc3 c6 5. Bg5 h6 6. Bh4 dxc4 7. e4 g5 8. Bg3 b5 9. Be2 Bb7 10. O-O Nbd7 11. Ne5 Bg7 12. Nxd7 Nxd7 13. Bd6 a6 14. a4 e5 15. d5 c5 16. Bg4 Nf6 17. Be6 fxe6 18. dxe6 Qe7 19. Qb3 Rc8 20. axb5 axb5 21. Nxb5 O-O 22. Bxe5 Ng4 23. Bxg7 Qxg7 24. e7 Rfe8 25. Nd6 Rxe7 26. Nxc8 Rxe6 27. Nd6 1-0`,
  },

  // ═══════════════════════════════════════════════════════════════
  //  DEFENSE & COUNTERPLAY
  // ═══════════════════════════════════════════════════════════════
  {
    label: "Karpov vs Spassky, 1974",
    white: "Karpov, Anatoly", black: "Spassky, Boris", year: 1974,
    description: "Karpov grinds out a win — Candidates SF",
    category: "defense", tags: ["defense", "positional"],
    pgn: `[Event "Candidates SF"]
[Site "Leningrad URS"]
[Date "1974.04.??"]
[White "Karpov, Anatoly"]
[Black "Spassky, Boris V"]
[Result "1-0"]

1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6 5. O-O Be7 6. Re1 b5 7. Bb3 d6 8. c3 O-O 9. h3 Nb8 10. d4 Nbd7 11. Nbd2 Bb7 12. Bc2 Re8 13. Nf1 Bf8 14. Ng3 g6 15. a4 c5 16. d5 c4 17. Bg5 h6 18. Be3 Nc5 19. Qd2 h5 20. Bg5 Be7 21. Bxf6 Bxf6 22. Nf1 Bg7 23. N1d2 f5 24. exf5 gxf5 25. b3 bxa4 26. bxc4 e4 27. Nxe4 fxe4 28. Rxe4 Rxe4 29. Bxe4 Bxc3 30. Qd3 Bxa1 31. Qxa6 Kf7 32. Qxa4 Qe8 33. c5 1-0`,
  },
  {
    label: "Anand vs Kramnik, 2008 WC G3",
    white: "Anand, Viswanathan", black: "Kramnik, Vladimir", year: 2008,
    description: "Kramnik's Meran disaster — Bonn WC",
    category: "defense", tags: ["attack", "tactics"],
    pgn: `[Event "World Championship"]
[Site "Bonn GER"]
[Date "2008.10.17"]
[White "Anand, Viswanathan"]
[Black "Kramnik, Vladimir"]
[Result "1-0"]

1. d4 d5 2. c4 c6 3. Nf3 Nf6 4. Nc3 e6 5. e3 Nbd7 6. Bd3 dxc4 7. Bxc4 b5 8. Bd3 a6 9. e4 c5 10. e5 cxd4 11. Nxb5 axb5 12. exf6 gxf6 13. O-O Qb6 14. Qe2 Bb7 15. Bxb5 Bd6 16. Rd1 Rg8 17. g3 Rg4 18. Bf4 Bxf4 19. Nxd4 Rd8 20. Nxe6 Rxg3+ 21. fxg3 Bxg3 22. Nxd8 Qe3+ 23. Qxe3+ Bxe3+ 24. Kh1 1-0`,
  },
  {
    label: "Marshall vs Capablanca, 1909",
    white: "Marshall, Frank James", black: "Capablanca, Jose Raul", year: 1909,
    description: "Capa's defensive genius — New York",
    category: "defense", tags: ["defense", "endgame"],
    pgn: `[Event "New York"]
[Site "New York USA"]
[Date "1909.01.??"]
[White "Marshall, Frank James"]
[Black "Capablanca, Jose Raul"]
[Result "0-1"]

1. d4 d5 2. c4 e6 3. Nc3 Nf6 4. Bg5 Be7 5. e3 Ne4 6. Bxe7 Qxe7 7. Bd3 Nxc3 8. bxc3 Nd7 9. Nf3 O-O 10. Qc2 b6 11. O-O Bb7 12. cxd5 exd5 13. a4 c5 14. Rab1 c4 15. Bf5 Bc6 16. Rb2 a5 17. Rfb1 Rfb8 18. h3 g6 19. Bh3 Ra7 20. Nd2 Nf6 21. e4 dxe4 22. Nxe4 Nxe4 23. Qxe4 Rd7 24. Re1 Qd6 25. Ree2 Rbd8 26. Rbd2 Bxa4 27. Qg4 Bc6 28. Qf4 Qxf4 29. gxf4 Rd5 30. Re3 b5 31. Bg2 R5d7 32. Bf3 a4 33. Red3 a3 34. Bc6 Rb8 35. d5 Bd7 36. Bxd7 Rxd7 37. d6 Kf8 38. Re2 b4 39. Rc2 bxc3 40. Rxc3 Rb1+ 41. Kh2 a2 42. Rxc4 Rb2 43. Ra4 a1=Q 44. Rxa1 Rxf2+ 45. Kg1 Rd2 46. Ra8+ Ke7 0-1`,
  },
  {
    label: "Spassky vs Petrosian, WC 1969 G10",
    white: "Spassky, Boris", black: "Petrosian, Tigran", year: 1969,
    description: "Spassky breaks through — Moscow WC",
    category: "defense", tags: ["attack", "sacrifice"],
    pgn: `[Event "World Championship"]
[Site "Moscow URS"]
[Date "1969.05.??"]
[White "Spassky, Boris V"]
[Black "Petrosian, Tigran V"]
[Result "1-0"]

1. e4 c5 2. Nf3 d6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 a6 6. Bg5 Nbd7 7. Bc4 Qa5 8. Qd2 e6 9. O-O-O Be7 10. Rhe1 O-O 11. f4 b5 12. Bb3 Bb7 13. Kb1 Nc5 14. e5 dxe5 15. fxe5 Nfe4 16. Qe3 Nxg5 17. Nxe6 fxe6 18. Qxg5 Qc7 19. Rd3 Nxb3 20. axb3 Bf6 21. Qg4 Bxe5 22. Rg3 Bf6 23. Rxe6 Rae8 24. Rxe8 Rxe8 25. Nd5 Bxd5 26. Qd7 1-0`,
  },
  {
    label: "Kramnik vs Topalov, 2006 WC G2",
    white: "Kramnik, Vladimir", black: "Topalov, Veselin", year: 2006,
    description: "Kramnik's Catalan domination — Elista WC",
    category: "defense", tags: ["defense", "positional"],
    pgn: `[Event "World Championship"]
[Site "Elista RUS"]
[Date "2006.09.24"]
[White "Kramnik, Vladimir"]
[Black "Topalov, Veselin"]
[Result "1-0"]

1. d4 d5 2. c4 c6 3. Nf3 Nf6 4. Nc3 e6 5. e3 Nbd7 6. Bd3 dxc4 7. Bxc4 b5 8. Bd3 Bd6 9. O-O O-O 10. Qc2 Bb7 11. a3 Rc8 12. Ng5 c5 13. Nxh7 Ng4 14. f4 cxd4 15. exd4 Bc5 16. Be2 Nde5 17. Bxg4 Bxd4+ 18. Kh1 Nxg4 19. Nxf8 f5 20. Ng6 Qf6 21. h3 Nf2+ 22. Kh2 Qxg6 23. Qe2 Nd3 24. Nd1 Bc5 25. Bd2 Nc1 26. Rxc1 Bxg2 27. Kxg2 Rxc1 28. b4 Bd6 29. Qd3 Rc2 30. Rf2 1-0`,
  },

  // ═══════════════════════════════════════════════════════════════
  //  MINIATURES (≤ 25 moves)
  // ═══════════════════════════════════════════════════════════════
  {
    label: "Fischer vs Reshevsky, 1958",
    white: "Fischer, Robert James", black: "Reshevsky, Samuel", year: 1958,
    description: "15-year-old Fischer's gem — New York",
    category: "miniature", tags: ["attack", "tactics"],
    pgn: `[Event "USA Championship"]
[Site "New York USA"]
[Date "1958.12.??"]
[White "Fischer, Robert James"]
[Black "Reshevsky, Samuel"]
[Result "1-0"]

1. e4 c5 2. Nf3 Nc6 3. d4 cxd4 4. Nxd4 g6 5. Nc3 Bg7 6. Be3 Nf6 7. Bc4 O-O 8. Bb3 Na5 9. e5 Ne8 10. Bxf7+ Kxf7 11. Ne6 dxe6 12. Qxd8 Nc6 13. Qd2 Nxe5 14. O-O Nf6 15. Bf4 Nc6 16. Qe2 Nd5 17. Nxd5 exd5 18. Rad1 Be6 19. Rfe1 d4 20. Qc4+ Kf8 21. Bh6 Nd8 22. Rxe6 1-0`,
  },
  {
    label: "Carlsen vs Ernst, 2004",
    white: "Carlsen, Magnus", black: "Ernst, Sipke", year: 2004,
    description: "13-year-old Carlsen's brilliancy — Wijk aan Zee",
    category: "miniature", tags: ["sacrifice", "attack"],
    pgn: `[Event "Corus"]
[Site "Wijk aan Zee NED"]
[Date "2004.01.20"]
[White "Carlsen, Magnus"]
[Black "Ernst, Sipke"]
[Result "1-0"]

1. d4 d5 2. c4 c6 3. Nc3 Nf6 4. e3 e6 5. Nf3 Nbd7 6. Qc2 Bd6 7. g4 Nxg4 8. Rg1 Nxh2 9. Rxg7 Ng4 10. Rxf7 Qe7 11. Nxd5 cxd5 12. Qg6+ Kd8 13. Rxe7 Bxe7 14. Qxe6 Ndf6 15. Bb5 Bd7 16. Qg6 Kc7 17. Bxd7 Nxd7 18. Qxg4 Rhg8 19. Qh4 dxc4 20. d5 Nf6 21. Bd2 Nxd5 22. Rc1 Kb8 23. Qxe7 Rge8 24. O-O Rxe7 25. Rxc4 Re2 26. Bc1 1-0`,
  },
  {
    label: "Karpov vs Csom, 1978",
    white: "Karpov, Anatoly", black: "Csom, Istvan", year: 1978,
    description: "Swift destruction — Buenos Aires",
    category: "miniature", tags: ["attack", "tactics"],
    pgn: `[Event "Buenos Aires"]
[Site "Buenos Aires ARG"]
[Date "1978.??.??"]
[White "Karpov, Anatoly"]
[Black "Csom, Istvan"]
[Result "1-0"]

1. e4 e6 2. d4 d5 3. Nd2 c5 4. Ngf3 cxd4 5. exd5 Qxd5 6. Bc4 Qd6 7. O-O Nf6 8. Nb3 Nc6 9. Nbxd4 Nxd4 10. Nxd4 a6 11. Be3 Qc7 12. Bb3 Bd6 13. Qe2 O-O 14. f4 b5 15. f5 e5 16. Nf3 Bg4 17. Rad1 e4 18. Bc5 exf3 19. Bxd6 Qc6 20. Bxf8 fxe2 21. Bxg7 exd1=Q 22. Bxf6 1-0`,
  },
  {
    label: "Reti vs Tartakower, 1910",
    white: "Reti, Richard", black: "Tartakower, Savielly", year: 1910,
    description: "The shortest brilliancy — Vienna",
    category: "miniature", tags: ["attack", "sacrifice"],
    pgn: `[Event "Vienna"]
[Site "Vienna AUT"]
[Date "1910.??.??"]
[White "Reti, Richard"]
[Black "Tartakower, Savielly"]
[Result "1-0"]

1. e4 c5 2. d4 cxd4 3. Nf3 e5 4. Nxe5 Qa5+ 5. Nd2 Qxe5 6. Nc4 Qc7 7. Nd6# 1-0`,
  },
  {
    label: "Fischer vs Fine, 1963",
    white: "Fischer, Robert James", black: "Fine, Reuben", year: 1963,
    description: "Fischer's skittles game — New York",
    category: "miniature", tags: ["opening-trap", "tactics"],
    pgn: `[Event "Skittles"]
[Site "New York USA"]
[Date "1963.??.??"]
[White "Fischer, Robert James"]
[Black "Fine, Reuben"]
[Result "1-0"]

1. d4 Nf6 2. c4 e5 3. dxe5 Ng4 4. Bf4 Nc6 5. Nf3 Bb4+ 6. Nbd2 Qe7 7. a3 Ngxe5 8. Nxe5 Nxe5 9. e3 Bxd2+ 10. Qxd2 d6 11. Be2 O-O 12. O-O f5 13. f3 Be6 14. b4 Bf7 15. Rfc1 a5 16. c5 Rad8 17. Qc3 axb4 18. axb4 d5 19. b5 f4 20. e4 d4 21. Qc2 Nd3 22. Bxd3 Bh5 23. c6 Qg5 24. Bf1 bxc6 25. Bxc7 1-0`,
  },
  {
    label: "Nezhmetdinov vs Chernikov, 1962",
    white: "Nezhmetdinov, Rashid", black: "Chernikov, Oleg", year: 1962,
    description: "Queen sacrifice miniature — Rostov",
    category: "miniature", tags: ["sacrifice", "attack", "tactics"],
    pgn: `[Event "Rostov"]
[Site "Rostov URS"]
[Date "1962.??.??"]
[White "Nezhmetdinov, Rashid"]
[Black "Chernikov, Oleg L"]
[Result "1-0"]

1. e4 c5 2. Nf3 Nc6 3. d4 cxd4 4. Nxd4 g6 5. Nc3 Bg7 6. Be3 Nf6 7. Bc4 O-O 8. Bb3 d6 9. f3 Bd7 10. Qd2 Qa5 11. O-O-O Rfc8 12. g4 Ne5 13. h4 Nc4 14. Bxc4 Rxc4 15. h5 Nxh5 16. g5 e5 17. Nf5 Bxf5 18. exf5 d5 19. Rdg1 d4 20. gxh6 Bxh6 21. Ne4 dxe3 22. Qxe3 Qe5 23. Nf6+ Nxf6 24. Qxe5 Rxc2+ 25. Kb1 Rxb2+ 26. Kxb2 Rb8+ 27. Bb3 1-0`,
  },
  {
    label: "Kholmov vs Bronstein, 1964",
    white: "Kholmov, Ratmir", black: "Bronstein, David", year: 1964,
    description: "A sparkling miniature — Moscow",
    category: "miniature", tags: ["sacrifice", "tactics"],
    pgn: `[Event "Moscow"]
[Site "Moscow URS"]
[Date "1964.??.??"]
[White "Kholmov, Ratmir"]
[Black "Bronstein, David"]
[Result "1-0"]

1. e4 e6 2. d4 d5 3. Nc3 Bb4 4. e5 c5 5. a3 Bxc3+ 6. bxc3 Qc7 7. Nf3 Nc6 8. a4 f6 9. Bb5 Bd7 10. Bd3 O-O-O 11. O-O f5 12. Ba3 Nge7 13. Ng5 Nf6 14. c4 h6 15. Nf3 Ng4 16. h3 Nh2 17. cxd5 Nxf3+ 18. Qxf3 exd5 19. dxc5 d4 20. e6 1-0`,
  },
  {
    label: "Alekhine vs Podgorny, 1943",
    white: "Alekhine, Alexander", black: "Podgorny, Jiri", year: 1943,
    description: "Alekhine's miniature — Prague",
    category: "miniature", tags: ["attack", "sacrifice"],
    pgn: `[Event "Prague"]
[Site "Prague"]
[Date "1943.??.??"]
[White "Alekhine, Alexander"]
[Black "Podgorny, Jiri"]
[Result "1-0"]

1. e4 d6 2. d4 Nf6 3. Nc3 g6 4. f4 Bg7 5. Nf3 O-O 6. Be2 c5 7. dxc5 Qa5 8. O-O Qxc5+ 9. Kh1 Nc6 10. Nd5 Nxd5 11. exd5 Nd4 12. Nxd4 Qxd4 13. Qe1 Qxb2 14. f5 Bd7 15. Bf3 Bc8 16. fxg6 hxg6 17. Bh6 Qf6 18. Bxg7 Kxg7 19. Qe3 Rh8 20. Qg5 Qd4 21. Rad1 Qe5 22. Qd2 Bf5 23. c4 Qb2 24. Qe3 1-0`,
  },
  {
    label: "Kasparov vs Palatnik, 1978",
    white: "Kasparov, Garry", black: "Palatnik, Semon", year: 1978,
    description: "15-year-old Kasparov's attacking miniature — Daugavpils",
    category: "miniature", tags: ["attack", "sacrifice", "tactics"],
    pgn: `[Event "Daugavpils"]
[Site "Daugavpils URS"]
[Date "1978.??.??"]
[White "Kasparov, Garry"]
[Black "Palatnik, Semon"]
[Result "1-0"]

1. d4 d6 2. e4 Nf6 3. Nc3 g6 4. f4 Bg7 5. Nf3 c5 6. dxc5 Qa5 7. Bd3 Qxc5 8. Qe2 O-O 9. Be3 Qa5 10. O-O Bg4 11. h3 Bxf3 12. Rxf3 Nc6 13. Nd5 Nd7 14. Rb3 Nc5 15. Rxb7 Nxd3 16. cxd3 Rab8 17. Rc7 Na5 18. Qb5 Qc3 19. Qxa5 Qxd3 20. Rc1 Qxe4 21. Bc5 1-0`,
  },
  {
    label: "Tal vs Flesch, 1981",
    white: "Tal, Mikhail", black: "Flesch, Janos", year: 1981,
    description: "Tal's dazzling queen sacrifice — Moscow",
    category: "miniature", tags: ["sacrifice", "attack", "tactics"],
    pgn: `[Event "Moscow"]
[Site "Moscow URS"]
[Date "1981.??.??"]
[White "Tal, Mikhail"]
[Black "Flesch, Janos"]
[Result "1-0"]

1. e4 c6 2. d4 d5 3. Nd2 dxe4 4. Nxe4 Nd7 5. Nf3 Ngf6 6. Nxf6+ Nxf6 7. Bc4 Bf5 8. Qe2 e6 9. Bg5 Bg4 10. O-O-O Be7 11. h3 Bh5 12. g4 Bg6 13. Ne5 Nd5 14. Bxe7 Qxe7 15. Bxd5 cxd5 16. Qb5+ Qd7 17. Qxb7 Rc8 18. Qa6 1-0`,
  },

  // ═══════════════════════════════════════════════════════════════
  //  ADDITIONAL GAMES (to reach 100+)
  // ═══════════════════════════════════════════════════════════════
  {
    label: "Morphy vs Consultants, 1858",
    white: "Morphy, Paul", black: "Consultants", year: 1858,
    description: "Morphy against two — Paris",
    category: "immortal", tags: ["attack", "sacrifice"],
    pgn: `[Event "Consultation"]
[Site "Paris FRA"]
[Date "1858.??.??"]
[White "Morphy, Paul"]
[Black "Consultants"]
[Result "1-0"]

1. e4 e5 2. Nf3 Nc6 3. Bc4 Nf6 4. d4 exd4 5. O-O Nxe4 6. Re1 d5 7. Bxd5 Qxd5 8. Nc3 Qh5 9. Nxe4 Be6 10. Neg5 Bb4 11. Rxe6+ fxe6 12. Nxe6 Qf7 13. Nfg5 Qe7 14. Qe2 Bd6 15. Nxc7+ Kd8 16. Nxa8 b5 17. Qd1 Qe1+ 18. Qxe1+ 1-0`,
  },
  {
    label: "Euwe vs Alekhine, WC 1935 G26",
    white: "Euwe, Max", black: "Alekhine, Alexander", year: 1935,
    description: "Euwe wins the crown — Netherlands WC",
    category: "world-championship", tags: ["attack", "positional"],
    pgn: `[Event "World Championship"]
[Site "Netherlands"]
[Date "1935.12.15"]
[White "Euwe, Max"]
[Black "Alekhine, Alexander"]
[Result "1-0"]

1. d4 d5 2. c4 e6 3. Nc3 Nf6 4. Bg5 Be7 5. e3 O-O 6. Nf3 Nbd7 7. Rc1 c6 8. a3 a6 9. Qc2 Re8 10. Bd3 dxc4 11. Bxc4 b5 12. Ba2 Bb7 13. O-O c5 14. dxc5 Nxc5 15. b4 Nce4 16. Nxe4 Nxe4 17. Bxe7 Qxe7 18. Nd4 Rac8 19. Qb1 Nf6 20. f3 e5 21. Nf5 Qe6 22. Rxc8 Rxc8 23. Nd6 Rc2 24. Nxb7 Rxa2 25. Nd6 Qd7 26. Nf5 g6 27. Nh6+ Kg7 28. Ng4 Nxg4 29. fxg4 Qd3 30. Qxd3 1-0`,
  },
  {
    label: "Mamedyarov vs Carlsen, 2018",
    white: "Mamedyarov, Shakhriyar", black: "Carlsen, Magnus", year: 2018,
    description: "Mamedyarov's stunning win — Biel",
    category: "modern", tags: ["attack", "tactics"],
    pgn: `[Event "Biel"]
[Site "Biel SUI"]
[Date "2018.07.30"]
[White "Mamedyarov, Shakhriyar"]
[Black "Carlsen, Magnus"]
[Result "1-0"]

1. d4 d5 2. c4 e6 3. Nf3 Nf6 4. Nc3 Be7 5. Bf4 O-O 6. e3 Nbd7 7. c5 Nh5 8. Bd3 Nxf4 9. exf4 b6 10. b4 a5 11. a3 Ba6 12. Bxa6 Rxa6 13. Qb3 c6 14. O-O Qa8 15. Nd2 axb4 16. axb4 Ra3 17. Qc2 bxc5 18. bxc5 Qa5 19. Rfb1 Nf6 20. Nb3 Qa2 21. Qxa2 Rxa2 22. Nc1 Ra5 23. Nd3 Ne4 24. Nxe4 dxe4 25. Ne5 Bxc5 26. dxc5 Rxc5 27. Nxc6 1-0`,
  },
  {
    label: "Nimzowitsch vs Tarrasch, 1914",
    white: "Nimzowitsch, Aron", black: "Tarrasch, Siegbert", year: 1914,
    description: "Classical rivalry — St. Petersburg",
    category: "romantic", tags: ["positional", "attack"],
    pgn: `[Event "St Petersburg"]
[Site "St Petersburg RUS"]
[Date "1914.05.??"]
[White "Nimzowitsch, Aron"]
[Black "Tarrasch, Siegbert"]
[Result "0-1"]

1. d4 d5 2. Nf3 c5 3. c4 e6 4. e3 Nf6 5. Bd3 Nc6 6. O-O Bd6 7. b3 O-O 8. Bb2 b6 9. Nbd2 Bb7 10. Rc1 Qe7 11. cxd5 exd5 12. Nh4 g6 13. Nhf3 Rad8 14. dxc5 bxc5 15. Bb5 Ne4 16. Bxc6 Bxc6 17. Qc2 Nxd2 18. Nxd2 d4 19. exd4 Bxh2+ 20. Kxh2 Qh4+ 21. Kg1 Bxg2 22. f3 Rfe8 23. Ne4 Qh1+ 24. Kf2 Bxf1 25. d5 f5 26. Qc3 Qg2+ 27. Ke3 Rxe4+ 28. fxe4 f4+ 29. Kxf4 Rf8+ 30. Ke5 Qh2+ 31. Ke6 Re8+ 32. Kd7 Bb5# 0-1`,
  },
  {
    label: "Botvinnik vs Capablanca, 1938",
    white: "Botvinnik, Mikhail", black: "Capablanca, Jose Raul", year: 1938,
    description: "Botvinnik's strategic masterpiece — AVRO",
    category: "positional", tags: ["positional", "attack"],
    pgn: `[Event "AVRO"]
[Site "Netherlands"]
[Date "1938.11.22"]
[White "Botvinnik, Mikhail"]
[Black "Capablanca, Jose Raul"]
[Result "1-0"]

1. d4 Nf6 2. c4 e6 3. Nc3 Bb4 4. e3 d5 5. a3 Bxc3+ 6. bxc3 c5 7. cxd5 exd5 8. Bd3 O-O 9. Ne2 b6 10. O-O Ba6 11. Bxa6 Nxa6 12. Bb2 Qd7 13. a4 Rfe8 14. Qd3 c4 15. Qc2 Nb8 16. Rae1 Nc6 17. Ng3 Na5 18. f3 Nb3 19. e4 Qxa4 20. e5 Nd7 21. Qf2 g6 22. f4 f5 23. exf6 Nxf6 24. f5 Rxe1 25. Rxe1 Re8 26. Re6 Rxe6 27. fxe6 Kg7 28. Qf4 Qe8 29. Qe5 Qe7 30. Ba3 Qxa3 31. Nh5+ gxh5 32. Qg5+ Kf8 33. Qxf6+ Kg8 34. e7 Qc1+ 35. Kf2 Qc2+ 36. Kg3 Qd3+ 37. Kh4 Qe4+ 38. Kxh5 Qe2+ 39. Kh4 Qe4+ 40. g4 Qe1+ 41. Kh5 1-0`,
  },
  {
    label: "Fischer vs Larsen, 1971",
    white: "Fischer, Robert James", black: "Larsen, Bent", year: 1971,
    description: "Fischer's 6-0 crush — Candidates SF",
    category: "endgame", tags: ["endgame", "positional"],
    pgn: `[Event "Candidates SF"]
[Site "Denver USA"]
[Date "1971.07.??"]
[White "Fischer, Robert James"]
[Black "Larsen, Bent"]
[Result "1-0"]

1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6 5. O-O Be7 6. Re1 b5 7. Bb3 d6 8. c3 O-O 9. h3 Na5 10. Bc2 c5 11. d4 Qc7 12. Nbd2 cxd4 13. cxd4 Nc6 14. Nb3 a5 15. Be3 a4 16. Nbd2 Bd7 17. Rc1 Qb8 18. Bb1 Nb4 19. a3 Na6 20. Nh2 Nc5 21. Ng4 Nxg4 22. hxg4 Ra5 23. dxe5 dxe5 24. Nf3 Bc6 25. Bc2 Nxe4 26. Bxe4 Bxe4 27. Rxe4 Qb7 28. Re2 Bd8 29. Nxe5 Bb6 30. Bxb6 Qxb6 31. Nd3 Rd8 32. Nc5 Rxc5 33. Rxc5 Rd1+ 34. Kh2 Qf6 35. b4 axb3 36. Qxb3 h6 37. Qf3 Qd8 38. Rb2 Rd4 39. Rc1 g6 40. Kg1 Kg7 41. a4 1-0`,
  },
  {
    label: "Kasparov vs Short, 1993",
    white: "Kasparov, Garry", black: "Short, Nigel", year: 1993,
    description: "Kasparov's attacking brilliancy — PCA WC London",
    category: "attacking", tags: ["attack", "sacrifice", "tactics"],
    pgn: `[Event "PCA World Championship"]
[Site "London ENG"]
[Date "1993.09.??"]
[White "Kasparov, Garry"]
[Black "Short, Nigel"]
[Result "1-0"]

1. e4 c5 2. Nf3 e6 3. d4 cxd4 4. Nxd4 a6 5. Bd3 Nf6 6. O-O Qc7 7. Qe2 d6 8. c4 g6 9. Nc3 Bg7 10. Nf3 Nc6 11. Bf4 e5 12. Bg5 Nd4 13. Nxd4 exd4 14. Nd5 Nxd5 15. cxd5 Bd7 16. Rac1 Qb8 17. Rc7 O-O 18. f4 Bf6 19. f5 Bxg5 20. f6 Kh8 21. Qg4 Bh6 22. Rf3 Bg5 23. Rh3 h5 24. Qg3 Qe8 25. Rxh5+ gxh5 26. Qg3 Be6 27. dxe6 Qxe6 28. Bf5 1-0`,
  },
  {
    label: "Anand vs Carlsen, 2014",
    white: "Anand, Viswanathan", black: "Carlsen, Magnus", year: 2014,
    description: "Anand's stunning novelty — Zurich Challenge",
    category: "tactical", tags: ["sacrifice", "attack", "tactics"],
    pgn: `[Event "Zurich Chess Challenge"]
[Site "Zurich SUI"]
[Date "2014.02.01"]
[White "Anand, Viswanathan"]
[Black "Carlsen, Magnus"]
[Result "1-0"]

1. e4 e5 2. Nf3 Nc6 3. Bb5 Nf6 4. d3 Bc5 5. Bxc6 dxc6 6. Nbd2 Be6 7. O-O Bd6 8. b3 O-O 9. Bb2 Re8 10. Nc4 Bf8 11. Nce5 Nd7 12. d4 Nxe5 13. Nxe5 c5 14. c4 f6 15. Nd3 cxd4 16. Bxd4 c5 17. Bc3 Qd7 18. f4 Bd6 19. Qf3 Rad8 20. Rad1 Qa4 21. Bb2 exf4 22. Nxf4 Bxc4 23. bxc4 Bxf4 24. Qxf4 Rxd1 25. Rxd1 Qxc4 26. e5 Rf8 27. Rd7 fxe5 28. Qg5 Rf7 29. Rd8+ Rf8 30. Qe7 Qc1+ 31. Kf2 Qd2+ 32. Kg3 Qe3+ 33. Kh4 g5+ 34. Qxg5+ 1-0`,
  },
  {
    label: "Korchnoi vs Karpov, 1978 WC G17",
    white: "Korchnoi, Viktor", black: "Karpov, Anatoly", year: 1978,
    description: "Korchnoi fights back — Baguio WC",
    category: "defense", tags: ["defense", "attack"],
    pgn: `[Event "World Championship"]
[Site "Baguio City PHI"]
[Date "1978.09.??"]
[White "Korchnoi, Viktor"]
[Black "Karpov, Anatoly"]
[Result "1-0"]

1. c4 e6 2. Nc3 d5 3. d4 Be7 4. Nf3 Nf6 5. Bg5 h6 6. Bh4 O-O 7. e3 b6 8. Be2 Bb7 9. Bxf6 Bxf6 10. cxd5 exd5 11. b4 c5 12. bxc5 bxc5 13. Rb1 Bc8 14. O-O cxd4 15. exd4 Nc6 16. Bb5 Bd7 17. Qa4 Rb8 18. Bxc6 Bxc6 19. Qxa7 Ra8 20. Qe3 Bd7 21. Rb7 Re8 22. Qd2 Ra1 23. Rxa1 Bxa1 24. Nb5 Be6 25. Qb4 Be5 26. Nxe5 Rxe5 27. Nd6 Rg5 28. Qd2 Qg8 29. g3 1-0`,
  },
  {
    label: "Morphy vs Anderssen, 1858",
    white: "Morphy, Paul", black: "Anderssen, Adolf", year: 1858,
    description: "Clash of legends — Paris casual",
    category: "romantic", tags: ["attack", "sacrifice"],
    pgn: `[Event "Casual"]
[Site "Paris FRA"]
[Date "1858.12.??"]
[White "Morphy, Paul"]
[Black "Anderssen, Adolf"]
[Result "1-0"]

1. e4 e5 2. Nf3 d6 3. d4 Bg4 4. dxe5 Bxf3 5. Qxf3 dxe5 6. Bc4 Nf6 7. Qb3 Qe7 8. Nc3 c6 9. Bg5 b5 10. Nxb5 cxb5 11. Bxb5+ Nbd7 12. O-O-O Rd8 13. Rxd7 Rxd7 14. Rd1 Qe6 15. Bxd7+ Nxd7 16. Qb8+ Nxb8 17. Rd8# 1-0`,
  },
  {
    label: "Adams vs Torre, 1920",
    white: "Adams, Edward", black: "Torre, Carlos", year: 1920,
    description: "Torre's famous windmill — New Orleans",
    category: "tactical", tags: ["tactics", "sacrifice"],
    pgn: `[Event "New Orleans"]
[Site "New Orleans USA"]
[Date "1920.??.??"]
[White "Adams, Edward"]
[Black "Torre, Carlos"]
[Result "0-1"]

1. e4 e5 2. Nf3 d6 3. d4 exd4 4. Qxd4 Nc6 5. Bb5 Bd7 6. Bxc6 Bxc6 7. Nc3 Nf6 8. O-O Be7 9. Nd5 Bxd5 10. exd5 O-O 11. Bg5 c6 12. c4 cxd5 13. cxd5 Re8 14. Rfe1 a5 15. Re2 Rc8 16. Rae1 Qd7 17. Bxf6 Bxf6 18. Qg4 Qb5 19. Qc4 Qd7 20. Qc7 Qb5 21. a4 Qxa4 22. Re4 Qb5 23. Qxb7 1-0`,
  },
  {
    label: "Euwe vs Najdorf, 1953",
    white: "Euwe, Max", black: "Najdorf, Miguel", year: 1953,
    description: "Former WC's crisp technique — Zurich Candidates",
    category: "positional", tags: ["positional", "endgame"],
    pgn: `[Event "Candidates"]
[Site "Zurich SUI"]
[Date "1953.09.??"]
[White "Euwe, Max"]
[Black "Najdorf, Miguel"]
[Result "1-0"]

1. d4 Nf6 2. c4 d6 3. Nc3 e5 4. Nf3 Nbd7 5. e4 Be7 6. Be2 O-O 7. O-O c6 8. Qc2 a5 9. d5 Nc5 10. Be3 Qc7 11. Nd2 Bd7 12. dxc6 bxc6 13. b3 Be6 14. f3 d5 15. cxd5 cxd5 16. exd5 Nfxd5 17. Nxd5 Nxd5 18. Bxd5 Bxd5 19. Nc4 Bf6 20. Rac1 Qb7 21. Nxa5 Qb5 22. Nc4 Bxc4 23. bxc4 Qxc4 24. Qxc4 Rxc4 25. Rxf6 1-0`,
  },
  {
    label: "Kramnik vs Aronian, 2018",
    white: "Kramnik, Vladimir", black: "Aronian, Levon", year: 2018,
    description: "Kramnik's last brilliancy — Candidates",
    category: "modern", tags: ["sacrifice", "attack"],
    pgn: `[Event "Candidates"]
[Site "Berlin GER"]
[Date "2018.03.20"]
[White "Kramnik, Vladimir"]
[Black "Aronian, Levon"]
[Result "1-0"]

1. Nf3 d5 2. g3 c5 3. Bg2 Nc6 4. d4 e6 5. O-O Nf6 6. c4 dxc4 7. dxc5 Qxd1 8. Rxd1 Bxc5 9. Nbd2 c3 10. bxc3 O-O 11. Nb3 Be7 12. c4 Bd7 13. Bb2 Rfc8 14. Nfd4 Nxd4 15. Nxd4 a5 16. Rac1 Bc5 17. Nb3 Bb4 18. Be5 Nd7 19. Bd4 e5 20. Be3 f5 21. Nd2 e4 22. c5 Bc3 23. c6 bxc6 24. Rxc3 Nf8 25. Rdc1 Ne6 26. Rxc6 Rxc6 27. Rxc6 f4 28. Bd4 Nd8 29. Rc7 fxg3 30. hxg3 1-0`,
  },
  {
    label: "Gukesh vs Nakamura, 2024",
    white: "Gukesh, Dommaraju", black: "Nakamura, Hikaru", year: 2024,
    description: "The young Indian prodigy strikes — Candidates",
    category: "modern", tags: ["attack", "positional"],
    pgn: `[Event "Candidates"]
[Site "Toronto CAN"]
[Date "2024.04.??"]
[White "Gukesh, Dommaraju"]
[Black "Nakamura, Hikaru"]
[Result "1-0"]

1. d4 Nf6 2. c4 e6 3. Nc3 Bb4 4. e3 O-O 5. Bd3 d5 6. Nf3 c5 7. O-O dxc4 8. Bxc4 cxd4 9. exd4 b6 10. Bg5 Bb7 11. Qe2 Be7 12. Rad1 Nbd7 13. d5 exd5 14. Nxd5 Bxd5 15. Bxd5 Nxd5 16. Rxd5 Nf6 17. Rd3 Re8 18. Qc4 h6 19. Bxf6 Bxf6 20. Ne5 Bxe5 21. Rg3 Qf6 22. Qg4 Bf4 23. Rh3 Re6 24. Qf5 Rae8 25. Qxf6 Rxf6 26. Rb3 Rd6 27. a4 a5 28. Rb5 Rd2 29. Rxa5 Rxb2 30. Ra7 Bg5 31. Rb1 1-0`,
  },
  {
    label: "Larsen vs Spassky, 1970",
    white: "Larsen, Bent", black: "Spassky, Boris", year: 1970,
    description: "Spassky's legendary 1.b3 — USSR vs World",
    category: "miniature", tags: ["sacrifice", "attack", "tactics"],
    pgn: `[Event "USSR vs Rest of the World"]
[Site "Belgrade YUG"]
[Date "1970.03.31"]
[White "Larsen, Bent"]
[Black "Spassky, Boris V"]
[Result "0-1"]

1. b3 e5 2. Bb2 Nc6 3. c4 Nf6 4. Nf3 e4 5. Nd4 Bc5 6. Nxc6 dxc6 7. e3 Bf5 8. Qc2 Qe7 9. Be2 O-O-O 10. f4 Ng4 11. g3 h5 12. h3 h4 13. hxg4 hxg3 14. Rg1 Rh1 15. Rxh1 g2 16. Rf1 Qh4+ 17. Kd1 gxf1=Q+ 0-1`,
  },
];
