"""
Validate chess trap lines using python-chess.
Install: pip install chess
Usage:   python scripts/validate_traps.py
"""
import chess

trap_lines = [
    # Italian Game
    {"id": "italian-legal",       "fen": chess.STARTING_FEN, "moves": "e4,e5,Nf3,Nc6,Bc4,d6,Nc3,Bg4,Nxe5,Bxd1,Bxf7+,Ke7,Nd5#"},
    {"id": "italian-fried-liver", "fen": chess.STARTING_FEN, "moves": "e4,e5,Nf3,Nc6,Bc4,Nf6,Ng5,d5,exd5,Nxd5,Nxf7,Kxf7,Qf3+,Ke6,Nc3,Nb4,Bb3,c6,a3,Na6,d4,Nc7"},
    {"id": "italian-evans",       "fen": chess.STARTING_FEN, "moves": "e4,e5,Nf3,Nc6,Bc4,Bc5,b4,Bxb4,c3,Ba5,d4,exd4,O-O,Nge7,cxd4,d5,exd5,Nxd5,Ba3,Be6,Bb5,Bb6,Nc3,Nf4,Be7,Qxe7,Nd5,Bxd5"},
    {"id": "italian-traxler",     "fen": chess.STARTING_FEN, "moves": "e4,e5,Nf3,Nc6,Bc4,Nf6,Ng5,Bc5,Nxf7,Bxf2+,Kf1,Qe7,Nxh8,d5,exd5,Nd4,d6,Bg4"},
    # Ruy Lopez
    {"id": "ruy-noahs-ark",  "fen": chess.STARTING_FEN, "moves": "e4,e5,Nf3,Nc6,Bb5,a6,Ba4,d6,d4,b5,Bb3,Nxd4,Nxd4,exd4,Qxd4,c5,Qd5,Be6,Qc6+,Bd7,Qd5,c4"},
    {"id": "ruy-marshall",   "fen": chess.STARTING_FEN, "moves": "e4,e5,Nf3,Nc6,Bb5,a6,Ba4,Nf6,O-O,Be7,Re1,b5,Bb3,O-O,c3,d5,exd5,Nxd5,Nxe5,Nxe5,Rxe5,c6,d4,Bd6,Re1,Qh4,g3,Qh3,Be3,Bg4"},
    {"id": "ruy-berlin",     "fen": chess.STARTING_FEN, "moves": "e4,e5,Nf3,Nc6,Bb5,Nf6,O-O,Nxe4,d4,Nd6,Bxc6,dxc6,dxe5,Nf5,Qxd8+,Kxd8,Nc3,Ke8,h3,h6,Rd1"},
    {"id": "ruy-dilworth",   "fen": chess.STARTING_FEN, "moves": "e4,e5,Nf3,Nc6,Bb5,a6,Ba4,Nf6,O-O,Nxe4,d4,b5,Bb3,d5,dxe5,Be6,c3,Bc5,Nbd2,O-O,Bc2,Nxf2,Rxf2,f6,exf6,Rxf6+,Kh1,Rxf3"},
    # King's Gambit
    {"id": "kg-kieseritzky", "fen": chess.STARTING_FEN, "moves": "e4,e5,f4,exf4,Nf3,g5,h4,g4,Ne5,Nf6,Bc4,d5,exd5,Bd6,d4,Nh5,Nd3,Qxh4+,Kf1,Ng3+,Kg1,Qh1#"},
    {"id": "kg-falkbeer",    "fen": chess.STARTING_FEN, "moves": "e4,e5,f4,d5,exd5,e4,d3,Nf6,dxe4,Nxe4,Nf3,Bc5,Qe2,Bf2+,Kd1,Qxd5+,Nbd2"},
    {"id": "kg-muzio",       "fen": chess.STARTING_FEN, "moves": "e4,e5,f4,exf4,Nf3,g5,Bc4,g4,O-O,gxf3,Qxf3,Qf6,e5,Qxe5,Bxf7+,Kxf7,d4,Qxd4+,Be3,Qb4,Nc3,c6,Nd5,Qe7"},
    {"id": "kg-bishops",     "fen": chess.STARTING_FEN, "moves": "e4,e5,f4,exf4,Bc4,Qh4+,Kf1,d6,Nc3,Nc6,Nf3,Qh5,d4,g5,h4,g4,Ng5,Nh6,Nxf7,Nxf7,Bxf7+,Kd8,Qxg4"},
    # Sicilian Najdorf
    {"id": "najdorf-poisoned",      "fen": chess.STARTING_FEN, "moves": "e4,c5,Nf3,d6,d4,cxd4,Nxd4,Nf6,Nc3,a6,Bg5,e6,f4,Qb6,Qd2,Qxb2,Rb1,Qa3,e5,dxe5,fxe5,Nfd7,Ne4,h6,Bh4,Qxa2"},
    {"id": "najdorf-english",       "fen": chess.STARTING_FEN, "moves": "e4,c5,Nf3,d6,d4,cxd4,Nxd4,Nf6,Nc3,a6,Be3,e5,Nb3,Be6,f3,Be7,Qd2,O-O,O-O-O,Nbd7,g4,b5,g5,b4,Ne2,Ne8,f4,a5"},
    {"id": "najdorf-fischer-sozin", "fen": chess.STARTING_FEN, "moves": "e4,c5,Nf3,d6,d4,cxd4,Nxd4,Nf6,Nc3,a6,Bc4,e6,Bb3,b5,O-O,Be7,Qf3,Qb6,Be3,Qb7,Qg3,O-O,f4,b4,Na4,Nxe4"},
    {"id": "najdorf-scheveningen",  "fen": chess.STARTING_FEN, "moves": "e4,c5,Nf3,d6,d4,cxd4,Nxd4,Nf6,Nc3,a6,Bg5,e6,f4,b5,Bxf6,gxf6,Nd5,Qb6,Nxb6"},
    # Sicilian Dragon
    {"id": "dragon-yugoslav",     "fen": chess.STARTING_FEN, "moves": "e4,c5,Nf3,d6,d4,cxd4,Nxd4,Nf6,Nc3,g6,Be3,Bg7,f3,O-O,Qd2,Nc6,Bc4,Bd7,O-O-O,Rb8,h4,h5,Bg5,Re8,Kb1,Ne5,Bb3,Nc4,Bxc4"},
    {"id": "dragon-exchange-sac", "fen": chess.STARTING_FEN, "moves": "e4,c5,Nf3,d6,d4,cxd4,Nxd4,Nf6,Nc3,g6,Be3,Bg7,f3,Nc6,Qd2,O-O,Bc4,Bd7,O-O-O,Rc8,Bb3,Ne5,h4,h5,Kb1,Nc4,Bxc4,Rxc4"},
    {"id": "dragon-soltis",       "fen": chess.STARTING_FEN, "moves": "e4,c5,Nf3,d6,d4,cxd4,Nxd4,Nf6,Nc3,g6,Be3,Bg7,f3,Nc6,Qd2,O-O,Bc4,Bd7,O-O-O,Qa5,Bb3,Rfe8,h4,h5,Kb1,Ne5"},
    {"id": "dragon-early-bc4",    "fen": chess.STARTING_FEN, "moves": "e4,c5,Nf3,d6,d4,cxd4,Nxd4,Nf6,Nc3,g6,Bc4,Bg7,e5,dxe5,Bxf7+,Kxf7,Nd5"},
    # French Defense
    {"id": "french-winawer",     "fen": chess.STARTING_FEN, "moves": "e4,e6,d4,d5,Nc3,Bb4,e5,c5,a3,Bxc3+,bxc3,Ne7,Qg4,Qc7,Qxg7,Rg8,Qxh7,cxd4,Ne2,Nbc6,f4,dxc3,Qd3,d4,Nxd4,Nxd4,Qxd4,Bd7"},
    {"id": "french-alekhine",    "fen": chess.STARTING_FEN, "moves": "e4,e6,d4,d5,Nc3,Nf6,Bg5,Be7,e5,Nfd7,h4,Bxg5,hxg5,Qxg5,Nh3,Qe7,Qg4,g6,O-O-O,c5,f4,Nc6,Nf2,cxd4,Nb5,Nb6"},
    {"id": "french-milner-barry","fen": chess.STARTING_FEN, "moves": "e4,e6,d4,d5,e5,c5,c3,Nc6,Nf3,Qb6,Bd3,cxd4,cxd4,Bd7,O-O,Nxd4,Nxd4,Qxd4,Nc3,Qb4,Qe2,Bb5,Nxb5,Qxb5,Bd2,Qa5,a4"},
    {"id": "french-tarrasch",    "fen": chess.STARTING_FEN, "moves": "e4,e6,d4,d5,Nd2,c5,exd5,exd5,Ngf3,Nc6,Bb5,Bd6,O-O,Ne7,dxc5,Bxc5,Nb3,Bd6,Re1,O-O,Nbd4,Bc7,c3,Bg4,Qd3,Re8"},
    # Queen's Gambit
    {"id": "qg-albin",     "fen": chess.STARTING_FEN, "moves": "d4,d5,c4,e5,dxe5,d4,e3,Bb4+,Bd2,dxe3,Bxb4+,exf2+,Ke2,fxg1=N+,Rxg1,Bg4+,Ke3,Nc6,a3,Qd4+"},
    {"id": "qg-pawn-grab", "fen": chess.STARTING_FEN, "moves": "d4,d5,c4,dxc4,e3,b5,a4,a6,axb5,axb5,Qf3,e6,Qb7,Ra7"},
    {"id": "qg-elephant",  "fen": chess.STARTING_FEN, "moves": "d4,d5,c4,e6,Nc3,Nf6,Bg5,Nbd7,cxd5,exd5,Nxd5,Nxd5,Bxd8,Bb4+,Qd2,Bxd2+,Kxd2,Kxd8"},
    {"id": "qg-cambridge", "fen": chess.STARTING_FEN, "moves": "d4,d5,c4,e6,Nc3,Nf6,Bg5,Nbd7,e3,c6,Nf3,Qa5,cxd5,Nxd5,Bd8,Bb4,Rc1,Nxc3"},
    # King's Indian
    {"id": "kid-averbakh",      "fen": chess.STARTING_FEN, "moves": "d4,Nf6,c4,g6,Nc3,Bg7,e4,d6,Be2,O-O,Bg5,e5,dxe5,dxe5,Qxd8,Rxd8,Nd5,Nxd5,cxd5,f6,Bh4,b5,Nf3,Nbd7"},
    {"id": "kid-mar-del-plata", "fen": chess.STARTING_FEN, "moves": "d4,Nf6,c4,g6,Nc3,Bg7,e4,d6,Nf3,O-O,Be2,e5,O-O,Nc6,d5,Ne7,Ne1,Nd7,Nd3,f5,Bd2,Nf6,f3,f4,c5,g5,cxd6,cxd6,Nb5,Rf7"},
    {"id": "kid-samisch",       "fen": chess.STARTING_FEN, "moves": "d4,Nf6,c4,g6,Nc3,Bg7,e4,d6,f3,O-O,Be3,e5,Nge2,c6,Qd2,Nbd7,O-O-O,a6,Kb1,b5,g4,b4,Na4,Qa5,b3,c5"},
    {"id": "kid-four-pawns",    "fen": chess.STARTING_FEN, "moves": "d4,Nf6,c4,g6,Nc3,Bg7,e4,d6,f4,O-O,Nf3,c5,d5,b5,cxb5,a6,bxa6,Bxa6,e5,dxe5,fxe5,Nfd7,e6,Nde5,Nxe5,Bxe5,exf7+,Rxf7"},
]


def parse_move(board: chess.Board, san: str) -> chess.Move | None:
    """Try to parse a SAN move, stripping trailing # or + if needed."""
    san_clean = san.rstrip("#").rstrip("+")
    for attempt in (san, san_clean):
        try:
            return board.parse_san(attempt)
        except (chess.InvalidMoveError, chess.IllegalMoveError, chess.AmbiguousMoveError, ValueError):
            pass
    return None


errors = []
valid = []

for line in trap_lines:
    try:
        board = chess.Board(line["fen"])
    except ValueError as e:
        errors.append({"id": line["id"], "issue": "BAD_FEN", "detail": str(e)})
        continue

    moves = [m.strip() for m in line["moves"].split(",") if m.strip()]
    failed = False
    for i, m in enumerate(moves):
        move = parse_move(board, m)
        if move is None:
            errors.append({
                "id": line["id"],
                "issue": "ILLEGAL_MOVE",
                "move_index": i + 1,
                "move": m,
                "fen": board.fen(),
            })
            failed = True
            break
        board.push(move)

    if not failed:
        valid.append(line["id"])

print(f"\n{'='*60}")
print(f"RESULTS: {len(valid)} valid, {len(errors)} errors")
print(f"{'='*60}\n")

if errors:
    for e in errors:
        print(f"FAIL [{e['id']}]")
        if e["issue"] == "BAD_FEN":
            print(f"  Bad FEN: {e['detail']}")
        else:
            print(f"  Move #{e['move_index']}: \"{e['move']}\" is illegal")
            print(f"  FEN at that point: {e['fen']}")
        print()
else:
    print("ALL LINES VALID!")
