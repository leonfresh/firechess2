const { Chess } = require("../node_modules/chess.js");

const allTraps = [
  {
    id: "italian-legal",
    fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
    moves: "e4,e5,Nf3,Nc6,Bc4,d6,Nc3,Bg4,h3,Bh5,Nxe5,Bxd1,Bxf7+,Ke7,Nd5#",
  },
  {
    id: "italian-fried-liver",
    fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
    moves:
      "e4,e5,Nf3,Nc6,Bc4,Nf6,Ng5,d5,exd5,Nxd5,Nxf7,Kxf7,Qf3+,Ke6,Nc3,Nce7,d4,c6,Bg5,Qd6,O-O-O",
  },
  {
    id: "italian-evans",
    fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
    moves:
      "e4,e5,Nf3,Nc6,Bc4,Bc5,b4,Bxb4,c3,Ba5,d4,exd4,O-O,dxc3,Qb3,Qf6,e5,Qg6,Nxc3,Nge7,Ba3,O-O,Rad1",
  },
  {
    id: "italian-traxler",
    fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
    moves: "e4,e5,Nf3,Nc6,Bc4,Nf6,Ng5,Bc5,Nxf7,Bxf2+,Kxf2,Nxe4+,Ke3,Qh4",
  },
  {
    id: "ruy-noahs-ark",
    fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
    moves: "e4,e5,Nf3,Nc6,Bb5,a6,Ba4,d6,d4,b5,Bb3,Nxd4,Nxd4,exd4,Qxd4,c5",
  },
  {
    id: "ruy-marshall",
    fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
    moves:
      "e4,e5,Nf3,Nc6,Bb5,a6,Ba4,Nf6,O-O,Be7,Re1,b5,Bb3,O-O,c3,d5,exd5,Nxd5,Nxe5,Nxe5,Rxe5,c6,d4,Bd6,Re1,Qh4,g3,Qh3,Be3,Bg4,Qd3",
  },
  {
    id: "ruy-berlin",
    fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
    moves:
      "e4,e5,Nf3,Nc6,Bb5,Nf6,O-O,Nxe4,d4,Nd6,Bxc6,dxc6,dxe5,Nf5,Qxd8+,Kxd8",
  },
  {
    id: "ruy-dilworth",
    fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
    moves:
      "e4,e5,Nf3,Nc6,Bb5,a6,Ba4,Nf6,O-O,Nxe4,Re1,Nc5,Nxe5,Nxe5,Rxe5+,Be7,Ba3,Nxa4,Rxe7+,Kxe7,Qe1+,Ne5,Qxe5+,Kd7,Bxf8,Rxf8,Qe7#",
  },
  {
    id: "kg-kieseritzky",
    fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
    moves:
      "e4,e5,f4,exf4,Nf3,g5,h4,g4,Ne5,Nf6,Bc4,d5,exd5,Bd6,d4,Nc6,Bxf4,Qe7,Qe2,Bxf4,Ng3+,Kg1,Qh1#",
  },
  {
    id: "kg-falkbeer",
    fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
    moves: "e4,e5,f4,d5,exd5,e4,d3,Nf6,dxe4,Nxe4,Nf3,Bc5,Qe2,Bf2+,Kd1,Nbd2",
  },
  {
    id: "kg-muzio",
    fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
    moves:
      "e4,e5,f4,exf4,Nf3,g5,Bc4,g4,O-O,gxf3,Qxf3,Nc6,d3,Nd4,Qe4,Ne7,Nc3,c6,Be3,d5,Bxd5,Nd7,Qe7",
  },
  {
    id: "kg-bishops",
    fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
    moves:
      "e4,e5,f4,exf4,Bc4,Nc6,Nf3,d6,Nc3,Be7,d4,Bh4+,Kf1,Bg4,Bxf7+,Kxf7,Ne5+,Nxe5,dxe5,Qh4,Ke2,f3+,Kd3,Qe4#",
  },
  {
    id: "najdorf-poisoned",
    fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
    moves:
      "e4,c5,Nf3,d6,d4,cxd4,Nxd4,Nf6,Nc3,a6,Bg5,e6,f4,Qb6,a3,Qxb2,Na4,Qxa3,Bc3,Nc6",
  },
  {
    id: "najdorf-english",
    fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
    moves:
      "e4,c5,Nf3,d6,d4,cxd4,Nxd4,Nf6,Nc3,a6,Be2,e5,Nb3,Be6,f4,exf4,Bxf4,Nc6,Qd2,d5,exd5",
  },
  {
    id: "najdorf-fischer-sozin",
    fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
    moves:
      "e4,c5,Nf3,d6,d4,cxd4,Nxd4,Nf6,Nc3,a6,Bc4,e6,Bb3,Nbd7,f4,Nc5,f5,Nxb3,axb3,exf5,e5,dxe5,Nxf5,Be7,Qg4,O-O,Nd5",
  },
  {
    id: "najdorf-scheveningen",
    fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
    moves:
      "e4,c5,Nf3,d6,d4,cxd4,Nxd4,Nf6,Nc3,e6,Be2,a6,O-O,Be7,f4,O-O,Kh1,Qc7,a4,Nc6,Nxc6,Qb6,Nxb6",
  },
  {
    id: "dragon-yugoslav",
    fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
    moves:
      "e4,c5,Nf3,d6,d4,cxd4,Nxd4,Nf6,Nc3,g6,Be3,Bg7,f3,Nc6,Qd2,O-O,O-O-O,d5,exd5,Nxd5,Nxc6,bxc6,Bxc4",
  },
  {
    id: "dragon-exchange-sac",
    fen: "r1bq1rk1/pp2ppbp/2np1np1/8/3NP3/2N1BP2/PPPQ2PP/R3KB1R w KQkq - 0 9",
    moves:
      "O-O-O,Nxd4,Bxd4,Be6,Nd5,Bxd5,exd5,Nb8,Bxg7,Kxg7,Qd4+,Kg8,h4,Nd7,h5,gxh5,Rxh5",
  },
  {
    id: "dragon-soltis",
    fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
    moves:
      "e4,c5,Nf3,d6,d4,cxd4,Nxd4,Nf6,Nc3,g6,Be3,Bg7,f3,O-O,Qd2,Nc6,Bc4,Bd7,O-O-O,Rc8,Bb3,Ne5,h4,h5,Bh6,Bxh6,Qxh6,Rxc3,bxc3,Nxf3,gxf3,Qa5,Kb1,Qxc3",
  },
  {
    id: "dragon-early-bc4",
    fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
    moves:
      "e4,c5,Nf3,d6,d4,cxd4,Nxd4,Nf6,Nc3,g6,Bc4,Bg7,e5,dxe5,Bxf7+,Kxf7,Nd5",
  },
  {
    id: "french-winawer",
    fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
    moves:
      "e4,e6,d4,d5,Nc3,Bb4,e5,c5,a3,Bxc3+,bxc3,Ne7,Qg4,O-O,Bd3,f5,exf6,Rxf6,Bg5,Rf7,Qxd4,cxd4",
  },
  {
    id: "french-alekhine",
    fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
    moves:
      "e4,e6,d4,d5,Nc3,Nf6,Bg5,dxe4,Nxe4,Be7,Bxf6,gxf6,Nf3,b6,Bc4,Bb7,Qe2,Nd7,O-O-O,Qe7,Rhe1,O-O-O",
  },
  {
    id: "french-milner-barry",
    fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
    moves:
      "e4,e6,d4,d5,e5,c5,c3,Nc6,Nf3,Qb6,Bd3,Bd7,O-O,cxd4,cxd4,Nxd4,Nxd4,Qxd4,Nc3,Qxe5,Re1,Qb8,Rxe6,fxe6,Bxh7",
  },
  {
    id: "french-tarrasch",
    fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
    moves:
      "e4,e6,d4,d5,Nd2,Nf6,e5,Nfd7,c3,c5,Bd3,Nc6,Ne2,cxd4,cxd4,f6,exf6,Nxf6,O-O,Bd6,Nf4,O-O,Nxe6,Qb6,Nxf8,Rxf8,Nf3",
  },
  {
    id: "qg-albin",
    fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
    moves:
      "d4,d5,c4,e5,dxe5,d4,e3,Bb4+,Bd2,dxe3,Bxb4,exf2+,Ke2,fxg1=N+,Rxg1,Qxd1+,Kxd1,Bg4+,Ke1,Nc6,Bxc6+,bxc6,Na3,O-O-O,Qd4,Rd2",
  },
  {
    id: "qg-pawn-grab",
    fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
    moves: "d4,d5,c4,dxc4,Nf3,a6,e3,b5,axb5,e6,bxa6,Qxb7,Ra7,Qxa7",
  },
  {
    id: "qg-elephant",
    fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
    moves:
      "d4,d5,c4,e5,dxe5,d4,Nf3,Nc6,Nbd2,Bg4,Ne4,Nge7,Ng3,Qd7,Be2,Nf5,Nxf5,Bxf5,O-O,O-O-O,b4,g5,b5,g4,bxc6,gxf3,cxb7+,Kxb7,Bxf3",
  },
  {
    id: "qg-cambridge",
    fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
    moves:
      "d4,d5,c4,e6,Nc3,Nf6,Bg5,Nbd7,e3,c6,Nf3,Qa5,cxd5,Nxd5,Bd8,Bb4,Rc1,Nxc3",
  },
  {
    id: "kid-averbakh",
    fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
    moves:
      "d4,Nf6,c4,g6,Nc3,Bg7,e4,d6,Be2,O-O,Bg5,c5,d5,Qa5,Bd2,Qxc3,Bxc3,Nxe4,Bd2,Nxd2,Qxd2,Bxb2,Rb1,Bc3,Qxc3,e6,dxe6,fxe6,Qxc5",
  },
  {
    id: "kid-mar-del-plata",
    fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
    moves:
      "d4,Nf6,c4,g6,Nc3,Bg7,e4,d6,Nf3,O-O,Be2,e5,O-O,Nc6,d5,Ne7,Ne1,Nd7,Nd3,f5,Bd2,Nf6,f3,f4,c5,g5,cxd6,cxd6,Nb5,Rf7,Rc1,h5",
  },
  {
    id: "kid-samisch",
    fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
    moves:
      "d4,Nf6,c4,g6,Nc3,Bg7,e4,d6,f3,O-O,Be3,e5,d5,Nh5,Qd2,Qh4+,g3,Nxg3,Qf2,Nxf1,Qxh4,Nxe3,f4,Nxc4,fxe5,Nxe5,Qf4,f6,Nf3,Nxf3+,Qxf3,Be6",
  },
  {
    id: "kid-four-pawns",
    fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
    moves:
      "d4,Nf6,c4,g6,Nc3,Bg7,e4,d6,f4,O-O,Nf3,c5,d5,e6,dxe6,fxe6,Ng5,d5,e5,Ng4,Be2,Bxe5,fxe5,Nxe5,cxd5,exd5,Nxd5,Nxd5,Qxd5+,Qxd5,Nxd5",
  },
];

let passed = 0;
let failed = 0;
for (const trap of allTraps) {
  const chess = new Chess(trap.fen);
  const moves = trap.moves.split(",");
  let ok = true;
  for (let i = 0; i < moves.length; i++) {
    try {
      const result = chess.move(moves[i]);
      if (!result) {
        console.log(
          `\nFAIL [${trap.id}] move ${i + 1} "${moves[i]}" returned null`,
        );
        console.log("  FEN:", chess.fen());
        console.log("  Legal moves:", chess.moves().join(", "));
        ok = false;
        break;
      }
    } catch (e) {
      console.log(
        `\nFAIL [${trap.id}] move ${i + 1} "${moves[i]}": ${e.message}`,
      );
      console.log("  FEN:", chess.fen());
      console.log("  Legal moves:", chess.moves().join(", "));
      ok = false;
      break;
    }
  }
  if (ok) passed++;
  else failed++;
}
console.log(`\nResult: ${passed} passed, ${failed} failed`);
