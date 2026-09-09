export const navigationGroups = [
  { label: "Analyze", href: "/", links: [
    ["Scan your games", "/"], ["Sample report", "/report/8c8d499e-1f04-4121-aabc-71a818b98ce6"], ["PGN analyzer", "/analyze"], ["Analysis board", "/analysis"], ["Game review", "/review"], ["My openings", "/my-openings"], ["Opening explorer", "/openings"],
  ] },
  { label: "Train", href: "/newtraining", links: [
    ["Training hub", "/newtraining"], ["Practice from your games", "/train"], ["Daily challenge", "/daily"], ["Puzzles", "/puzzles"], ["Sparring", "/sparring"],
  ] },
  { label: "Play", href: "/play", links: [
    ["All game modes", "/play"], ["Guess the Move", "/guess"], ["Puzzle Dungeon", "/dungeon"], ["Chaos Chess", "/chaos"], ["Roast the Elo", "/roast"],
  ] },
  { label: "More", href: null, links: [
    ["Tactics guide", "/tactics"], ["Endgames", "/endgames"], ["Positions", "/positions"], ["Time controls", "/time-controls"], ["Common mistakes", "/mistakes"], ["Improvement guide", "/improve"], ["Famous games", "/games"], ["Grandmasters", "/players"], ["Chess glossary", "/glossary"], ["Leaderboard", "/leaderboard"], ["Coin shop", "/shop"], ["Coaches", "/coaches"], ["Creators", "/youtubers"], ["Blog", "/blog"], ["About", "/about"], ["Changelog", "/changelog"], ["Support", "/support"], ["Feedback", "/feedback"],
  ] },
] as const;
