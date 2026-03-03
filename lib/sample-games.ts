/**
 * Famous chess games for the PGN Game Analyzer sample loader.
 */

export type SampleGame = {
  label: string;
  year: number;
  description: string;
  pgn: string;
};

export const SAMPLE_GAMES: SampleGame[] = [
  {
    label: "Kasparov vs Topalov, 1999",
    year: 1999,
    description: "Kasparov's Immortal — Wijk aan Zee",
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
    year: 1858,
    description: "The Opera Game — Paris",
    pgn: `[Event "Opera Game"]
[Site "Paris FRA"]
[Date "1858.??.??"]
[White "Morphy, Paul"]
[Black "Duke of Brunswick and Count Isouard"]
[Result "1-0"]

1. e4 e5 2. Nf3 d6 3. d4 Bg4 4. dxe5 Bxf3 5. Qxf3 dxe5 6. Bc4 Nf6 7. Qb3 Qe7 8. Nc3 c6 9. Bg5 b5 10. Nxb5 cxb5 11. Bxb5+ Nbd7 12. O-O-O Rd8 13. Rxd7 Rxd7 14. Rd1 Qe6 15. Bxd7+ Nxd7 16. Qb8+ Nxb8 17. Rd8# 1-0`,
  },
  {
    label: "Byrne vs Fischer (Game of the Century), 1956",
    year: 1956,
    description: "13-year-old Fischer's masterpiece — New York",
    pgn: `[Event "Third Rosenwald Trophy"]
[Site "New York USA"]
[Date "1956.10.17"]
[White "Byrne, Donald"]
[Black "Fischer, Robert James"]
[Result "0-1"]

1. Nf3 Nf6 2. c4 g6 3. Nc3 Bg7 4. d4 O-O 5. Bf4 d5 6. Qb3 dxc4 7. Qxc4 c6 8. e4 Nbd7 9. Rd1 Nb6 10. Qc5 Bg4 11. Bg5 Na4 12. Qa3 Nxc3 13. bxc3 Nxe4 14. Bxe7 Qb6 15. Bc4 Nxc3 16. Bc5 Rfe8+ 17. Kf1 Be6 18. Bxb6 Bxc4+ 19. Kg1 Ne2+ 20. Kf1 Nxd4+ 21. Kg1 Ne2+ 22. Kf1 Nc3+ 23. Kg1 axb6 24. Qb4 Ra4 25. Qxb6 Nxd1 26. h3 Rxa2 27. Kh2 Nxf2 28. Re1 Rxe1 29. Qd8+ Bf8 30. Nxe1 Bd5 31. Nf3 Ne4 32. Qb8 b5 33. h4 h5 34. Ne5 Kg7 35. Kg1 Bc5+ 36. Kf1 Ng3+ 37. Ke1 Bb4+ 38. Kd1 Bb3+ 39. Kc1 Ne2+ 40. Kb1 Nc3+ 41. Kc1 Rc2# 0-1`,
  },
  {
    label: "Anderssen vs Kieseritzky (Immortal Game), 1851",
    year: 1851,
    description: "The Immortal Game — London",
    pgn: `[Event "London"]
[Site "London ENG"]
[Date "1851.06.21"]
[White "Anderssen, Adolf"]
[Black "Kieseritzky, Lionel"]
[Result "1-0"]

1. e4 e5 2. f4 exf4 3. Bc4 Qh4+ 4. Kf1 b5 5. Bxb5 Nf6 6. Nf3 Qh6 7. d3 Nh5 8. Nh4 Qg5 9. Nf5 c6 10. g4 Nf6 11. Rg1 cxb5 12. h4 Qg6 13. h5 Qg5 14. Qf3 Ng8 15. Bxf4 Qf6 16. Nc3 Bc5 17. Nd5 Qxb2 18. Bd6 Bxg1 19. e5 Qxa1+ 20. Ke2 Na6 21. Nxg7+ Kd8 22. Qf6+ Nxf6 23. Be7# 1-0`,
  },
  {
    label: "Anderssen vs Dufresne (Evergreen Game), 1852",
    year: 1852,
    description: "The Evergreen Game — Berlin",
    pgn: `[Event "Casual Game"]
[Site "Berlin GER"]
[Date "1852.??.??"]
[White "Anderssen, Adolf"]
[Black "Dufresne, Jean"]
[Result "1-0"]

1. e4 e5 2. Nf3 Nc6 3. Bc4 Bc5 4. b4 Bxb4 5. c3 Ba5 6. d4 exd4 7. O-O d3 8. Qb3 Qf6 9. e5 Qg6 10. Re1 Nge7 11. Ba3 b5 12. Qxb5 Rb8 13. Qa4 Bb6 14. Nbd2 Bb7 15. Ne4 Qf5 16. Bxd3 Qh5 17. Nf6+ gxf6 18. exf6 Rg8 19. Rad1 Qxf3 20. Rxe7+ Nxe7 21. Qxd7+ Kxd7 22. Bf5+ Ke8 23. Bd7+ Kf8 24. Bxe7# 1-0`,
  },
  {
    label: "Karpov vs Kasparov, WC 1985 Game 16",
    year: 1985,
    description: "World Championship — Moscow",
    pgn: `[Event "World Championship 32th-KK2"]
[Site "Moscow URS"]
[Date "1985.10.15"]
[White "Karpov, Anatoly"]
[Black "Kasparov, Garry"]
[Result "0-1"]

1. e4 c5 2. Nf3 e6 3. d4 cxd4 4. Nxd4 Nc6 5. Nb5 d6 6. c4 Nf6 7. N1c3 a6 8. Na3 d5 9. cxd5 exd5 10. exd5 Nb4 11. Be2 Bc5 12. O-O O-O 13. Bf3 Bf5 14. Bg5 Re8 15. Qd2 b5 16. Rad1 Nd3 17. Nab1 h6 18. Bh4 b4 19. Na4 Bd6 20. Bg3 Rc8 21. b3 g5 22. Bxd6 Qxd6 23. g3 Nd7 24. Bg2 Qf6 25. a3 a5 26. axb4 axb4 27. Qa2 Bg6 28. d6 g4 29. Qd2 Kg7 30. f3 Qxd6 31. fxg4 Qd4+ 32. Kh1 Nf6 33. Rf4 Ne4 34. Qxd3 Nf2+ 35. Rxf2 Bxd3 36. Rfd2 Qe3 37. Rxd3 Rc1 38. Nb2 Qf2 39. Nd2 Rxd1+ 40. Nxd1 Re1+ 0-1`,
  },
  {
    label: "Short vs Timman (King Walk), 1991",
    year: 1991,
    description: "The King Walk — Tilburg",
    pgn: `[Event "Tilburg"]
[Site "Tilburg NED"]
[Date "1991.10.??"]
[White "Short, Nigel D"]
[Black "Timman, Jan H"]
[Result "1-0"]

1. e4 Nf6 2. e5 Nd5 3. d4 d6 4. Nf3 g6 5. Bc4 Nb6 6. Bb3 Bg7 7. Qe2 Nc6 8. O-O O-O 9. h3 a5 10. a4 dxe5 11. dxe5 Nd4 12. Nxd4 Qxd4 13. Re1 e6 14. Nd2 Nd5 15. Nf3 Qc5 16. Qe4 Qb4 17. Bc4 Nb6 18. b3 Nxc4 19. bxc4 Re8 20. Rd1 Qc5 21. Qh4 b6 22. Be3 Qc6 23. Bh6 Bh8 24. Rd8 Bb7 25. Rad1 Bg7 26. R8d3 Qc5 27. Bxg7 Kxg7 28. Rd7 Rf8 29. Qf6+ Kg8 30. h4 h5 31. Kh2 Rc8 32. Kg3 Rce8 33. Kf4 Bc8 34. Kg5 1-0`,
  },
  {
    label: "Rotlewi vs Rubinstein, 1907",
    year: 1907,
    description: "Rubinstein's Immortal — Lodz",
    pgn: `[Event "Lodz"]
[Site "Lodz POL"]
[Date "1907.12.26"]
[White "Rotlewi, Georg A"]
[Black "Rubinstein, Akiba"]
[Result "0-1"]

1. d4 d5 2. Nf3 e6 3. e3 c5 4. c4 Nc6 5. Nc3 Nf6 6. dxc5 Bxc5 7. a3 a6 8. b4 Bd6 9. Bb2 O-O 10. Qd2 Qe7 11. Bd3 dxc4 12. Bxc4 b5 13. Bd3 Rd8 14. Qe2 Bb7 15. O-O Ne5 16. Nxe5 Bxe5 17. f4 Bc7 18. e4 Rac8 19. e5 Bb6+ 20. Kh1 Ng4 21. Be4 Qh4 22. g3 Rxc3 23. gxh4 Rd2 24. Qxd2 Bxe4+ 25. Qg2 Rh3 0-1`,
  },
  {
    label: "Wei Yi vs Bruzon, 2015",
    year: 2015,
    description: "The Chinese Immortal — Danzhou",
    pgn: `[Event "Danzhou"]
[Site "Danzhou CHN"]
[Date "2015.07.05"]
[White "Wei Yi"]
[Black "Bruzon Batista, Lazaro"]
[Result "1-0"]

1. e4 e5 2. Nf3 Nc6 3. Bb5 Nf6 4. d3 Bc5 5. c3 O-O 6. O-O Re8 7. Re1 a6 8. Ba4 b5 9. Bb3 d6 10. Bg5 Be6 11. Nbd2 h6 12. Bh4 Bxb3 13. axb3 Nb8 14. h3 Nbd7 15. Nh2 Qe7 16. Ndf1 Bb6 17. Ne3 d5 18. Nhf1 Qe6 19. Bg3 d4 20. Nc2 c5 21. f4 a5 22. fxe5 Nxe5 23. Nf3 Nxf3+ 24. Qxf3 e4 25. dxe4 dxc3 26. bxc3 Rad8 27. Rad1 Rd3 28. Rxd3 Nxe4 29. Rd5 Nxg3 30. Rxb5 Bc7 31. Qf4 Bxf4 32. Rxe6 fxe6 33. Ne3 Bxe3+ 34. Kf1 Nf5 35. Rxc5 Nd4 36. b4 Bb6 37. Rc4 Nf3 38. bxa5 Bxa5 39. gxf3 Bxc3 40. Rxc3 Rxe2 1-0`,
  },
  {
    label: "Polugaevsky vs Nezhmetdinov, 1958",
    year: 1958,
    description: "Nezhmetdinov's Sacrifice — Sochi",
    pgn: `[Event "Russian Championship"]
[Site "Sochi URS"]
[Date "1958.??.??"]
[White "Polugaevsky, Lev"]
[Black "Nezhmetdinov, Rashid"]
[Result "0-1"]

1. d4 Nf6 2. c4 d6 3. Nc3 e5 4. e4 exd4 5. Qxd4 Nc6 6. Qd2 g6 7. b3 Bg7 8. Bb2 O-O 9. Bd3 Ng4 10. Nge2 Qh4 11. Ng3 Nge5 12. O-O f5 13. f3 Bh6 14. Qd1 f4 15. Nge2 g5 16. Nd5 g4 17. g3 fxg3 18. hxg3 Qh3 19. f4 Be3+ 20. Kh1 Rxf4 21. Bxe5 Nxe5 22. Rxf4 Nxd3 23. Rf3 gxf3 24. Nef4 Bxf4 25. Nxf4 Qg4 26. Qd2 Nxf4 27. gxf4 Qh4+ 28. Kg1 Qg3+ 29. Kh1 Bf5 30. Rf1 Bxe4 31. Qf2 Qh3+ 32. Qh2 Bxf1 33. Qxh3 Bxh3 0-1`,
  },
  {
    label: "Aronian vs Anand, 2013",
    year: 2013,
    description: "Anand's counterattack — Wijk aan Zee",
    pgn: `[Event "75th Tata Steel GpA"]
[Site "Wijk aan Zee NED"]
[Date "2013.01.15"]
[White "Aronian, Levon"]
[Black "Anand, Viswanathan"]
[Result "0-1"]

1. d4 d5 2. c4 c6 3. Nf3 Nf6 4. Nc3 e6 5. e3 Nbd7 6. Bd3 dxc4 7. Bxc4 b5 8. Bd3 Bd6 9. O-O O-O 10. Qc2 Bb7 11. a3 Rc8 12. Ng5 c5 13. Nxh7 Ng4 14. f4 cxd4 15. exd4 Bc5 16. Be2 Nde5 17. Bxg4 Bxd4+ 18. Kh1 Nxg4 19. Nxf8 f5 20. Ng6 Qf6 21. h3 Qxg6 22. Qe2 Qh5 23. Qd3 Be3 0-1`,
  },
  {
    label: "Lasker vs Thomas (King Hunt), 1912",
    year: 1912,
    description: "The Great King Hunt — London",
    pgn: `[Event "London"]
[Site "London ENG"]
[Date "1912.??.??"]
[White "Lasker, Emanuel"]
[Black "Thomas, George Alan"]
[Result "1-0"]

1. d4 e6 2. Nf3 f5 3. Nc3 Nf6 4. Bg5 Be7 5. Bxf6 Bxf6 6. e4 fxe4 7. Nxe4 b6 8. Ne5 O-O 9. Bd3 Bb7 10. Qh5 Qe7 11. Qxh7+ Kxh7 12. Nxf6+ Kh6 13. Neg4+ Kg5 14. h4+ Kf4 15. g3+ Kf3 16. Be2+ Kg2 17. Rh2+ Kg1 18. Kd2# 1-0`,
  },
];
