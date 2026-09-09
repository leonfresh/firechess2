import {visualState, type WatchFrame} from "./chaos-watch";
import { Chess } from "chess.js";
import { ALL_MODIFIERS, createChaosState, updateTrackedPieces, NUCLEAR_QUEEN_COOLDOWN_TURNS, type ChaosState } from "./chaos-chess";
import { getChaosMoves, executeChaosMove, applyPostMoveEffects } from "./chaos-moves";
import { ALL_ANOMALIES, rollAnomalyChoices } from "./chaos-anomalies";
import { blockedMove, chaosOutcome } from "./chaos-outcome";
import { projectClock, type MatchClock } from "./chaos-clock";
import { DRAFT_DURATION_MS, draftChoices, applyServerDraft, type ServerDraft } from "./chaos-server-draft";

export type SyncEvent = { revision: number; actor: "host" | "guest" | "system"; message: Record<string, any> };
export type RoomChat = { id: string; actor: "host" | "guest"; text: string; ts: number };
export type OpeningMove = {side: "w" | "b"; deadline: number};
export const OPENING_MOVE_MS = 30_000;
export type SyncMeta = { replayFrames?: WatchFrame[]; openingMoveRule?: boolean; firstMoves?: ("w" | "b")[]; openingMove?: OpeningMove; chat?: RoomChat[]; ratedQueue?: boolean; gameNumber?: number; revision: number; stateRevision: number; events: SyncEvent[]; receipts: string[]; picks: Partial<Record<"host" | "guest", string | null>>; rematch: string[]; drawOffer?: string; frozenBy?: string; draftPicks?: Record<string, boolean>; result?: {winner: string; reason: string}; games?: Record<string, unknown>[]; clock?: MatchClock; draftProtocol?: 2; draft?: ServerDraft; opening?: {deadline: number; offers: {host: string[]; guest: string[]}} };
export type SyncRoom = { id: string; hostId: string; guestId: string | null; hostColor: string; fen: string; chaosState: unknown; status: string; moveHistory: unknown; [key: string]: any };
export class SyncError extends Error { constructor(public status: number, message: string) { super(message); } }
export function metadata(room: SyncRoom): SyncMeta {
  return (room.chaosState as any)?._sync ?? { revision: 0, stateRevision: 0, events: [], receipts: [], picks: {}, rematch: [] };
}
export function cleanState(value: unknown): ChaosState {
  const { _sync, ...state } = (value ?? createChaosState()) as any;
  return state;
}
export function createSyncState(serverDrafts = false) {
  return {...createChaosState(), ...(serverDrafts ? {_sync: {revision: 0, stateRevision: 0, events: [], receipts: [], picks: {}, rematch: [], draftProtocol: 2, openingMoveRule: true, firstMoves: []}} : {})};
}
export function startServerOpening(room: SyncRoom, now = Date.now()) {
  const meta = metadata(room);
  if (meta.draftProtocol !== 2) return room.chaosState;
  return {...cleanState(room.chaosState), _sync: {...meta, ratedQueue: room.isMatchmaking === true, opening: {deadline: now + DRAFT_DURATION_MS,
    offers: {host: rollAnomalyChoices(3).map(a => a.id), guest: rollAnomalyChoices(3).map(a => a.id)}}}};
}
export function nextDeadline(room: SyncRoom) {
  if (room.status !== "playing") return null;
  const meta = metadata(room);
  if (meta.opening && (!("host" in meta.picks) || !("guest" in meta.picks))) return meta.opening.deadline;
  if (meta.draft) return meta.draft.deadline;
  const clockDeadline = meta.clock?.active ? meta.clock.since + meta.clock[meta.clock.active] : Infinity;
  const deadline = Math.min(meta.openingMove?.deadline ?? Infinity, clockDeadline);
  return Number.isFinite(deadline) ? deadline : null;
}
/** Automatic choices run through the same reducer and CAS as manual choices. */
export function settleRoom(room: SyncRoom, now = Date.now()): Record<string, any> | null {
  const meta = metadata(room);
  if (room.status === "playing" && meta.opening && now >= meta.opening.deadline && (!("host" in meta.picks) || !("guest" in meta.picks))) {
    let current = room, combined: Record<string, any> = {};
    for (const actor of ["host", "guest"] as const) if (!(actor in metadata(current).picks)) {
      const patch = reduceCommand(current, actor === "host" ? room.hostId : room.guestId!, {id: "automatic-opening-" + actor + "-" + meta.opening.deadline,
        message: {type: "anomaly_pick", anomalyId: meta.opening.offers[actor][0]}}, meta.opening.deadline, true)!;
      combined = {...combined, ...patch}; current = {...current, ...patch};
    }
    return {...combined, ...(expireOpeningMove(current, now) ?? expireClock(current, now))};
  }
  const draft = meta.draft;
  if (room.status === "playing" && draft && now >= draft.deadline) {
    const user = draft.color === room.hostColor ? room.hostId : room.guestId!;
    const patch = reduceCommand(room, user, {id: `automatic-${draft.id}`, message: {type: "power_pick", draftId: draft.id, modifierId: draft.choices[0]}}, draft.deadline, true)!;
    // Resume at the actual deadline, not when a late reconnect happens to read it.
    const flag = expireClock({...room, ...patch}, now);
    return {...patch, ...flag};
  }
  return expireOpeningMove(room, now) ?? expireClock(room, now);
}
export function expireOpeningMove(room: SyncRoom, now = Date.now()) {
  const old = metadata(room), opening = old.openingMove;
  if (room.status !== "playing" || !opening || now < opening.deadline) return null;
  const meta = structuredClone(old);
  delete meta.openingMove;
  if (meta.clock) meta.clock = {...projectClock(meta.clock, opening.deadline), active: null};
  meta.result = {winner: "aborted", reason: `${opening.side === "w" ? "White" : "Black"} did not make their first move within 30 seconds.`};
  meta.revision++; meta.stateRevision++;
  meta.events = [...meta.events, {revision: meta.revision, actor: "system" as const, message: {type: "game_over", ...meta.result}}].slice(-64);
  return {status: "aborted", chaosState: {...cleanState(room.chaosState), _sync: meta},
    ...(meta.clock ? {timerWhiteMs: meta.clock.w, timerBlackMs: meta.clock.b} : {}), updatedAt: new Date(now)};
}

export function snapshot(room: SyncRoom, now = Date.now()) {
  const clock = metadata(room).clock;
  return { openingMove: metadata(room).openingMove ?? null, chat: metadata(room).chat ?? [], roomCode: room.roomCode, fen: room.fen, chaosState: cleanState(room.chaosState), status: room.status, hostColor: room.hostColor,
    capturedPawnsWhite: room.capturedPawnsWhite ?? 0, capturedPawnsBlack: room.capturedPawnsBlack ?? 0,
    timerWhiteMs: room.timerWhiteMs, timerBlackMs: room.timerBlackMs, result: metadata(room).result,
    opening: metadata(room).opening ?? null, openingPicks: metadata(room).picks,
    draftProtocol: metadata(room).draftProtocol, draft: metadata(room).draft ?? null, serverNow: now, nextDeadline: nextDeadline(room),
    lastMoveFrom: room.lastMoveFrom, lastMoveTo: room.lastMoveTo,
    history: metadata(room).draftProtocol === 2 && Array.isArray(room.moveHistory) ? room.moveHistory.map((m: any, i: number) => ({
      from: m.from, to: m.to, color: m.color ?? (i % 2 ? "b" : "w"), moveNumber: m.moveNumber ?? Math.floor(i / 2) + 1,
    })) : undefined,
    clock: clock ? projectClock(clock, now) : null, timeControlSeconds: room.timeControlSeconds, incrementSeconds: room.incrementSeconds };
}
/** Persist timeouts on reads too, including after a disconnected player's flag falls. */
export function expireClock(room: SyncRoom, now = Date.now()) {
  const old = metadata(room);
  if (room.status !== "playing" || !old.clock?.active) return null;
  const clock = projectClock(old.clock, now);
  if (clock[old.clock.active] > 0) return null;
  const winner = old.clock.active === "w" ? "black" : "white";
  const meta = structuredClone(old);
  meta.clock = { ...clock, active: null };
  meta.result = { winner, reason: "Time expired" };
  meta.revision++; meta.stateRevision++;
  // A system event must reach both players, including the actor of the last move.
  meta.events = [...meta.events, { revision: meta.revision, actor: "system" as const, message: {type: "game_over", ...meta.result} }].slice(-64);
  return { status: "finished", timerWhiteMs: clock.w, timerBlackMs: clock.b,
    chaosState: {...cleanState(room.chaosState), _sync: meta}, updatedAt: new Date(now) };
}
const stateTypes = new Set(["move", "chaos_move", "draft"]);
const allowed = new Set([...stateTypes, "power_pick", "power_reroll", "ability", "join", "king_capture", "anomaly_pick", "draft_freeze", "resign", "draw-offer", "draw-accept", "draw-decline", "rematch", "chat"]);
const ids = (mods: any[]) => mods.map(m => m.id).sort().join(",");


function matchesDraftSpawns(candidate: Chess, after: Chess, draftedId: string, side: "w" | "b") {
          const pieceType = draftedId === "knight-horde" ? "n" : "p";
          let spawned = 0, empties = 0;
          const allowedRanks = draftedId === "knight-horde" ? (side === "w" ? "1234" : "5678") : (side === "w" ? "23" : "67");
          for (let rank=1;rank<=8;rank++) for (let i=0;i<8;i++) {
            const square = `${"abcdefgh"[i]}${rank}` as any;
            const original = candidate.get(square), actual = after.get(square);
            if (!original && allowedRanks.includes(square[1])) empties++;
            if (JSON.stringify(original) === JSON.stringify(actual)) continue;
            if (original || actual?.color !== side || actual?.type !== pieceType || !allowedRanks.includes(square[1])) return false;
            spawned++;
          }
          const missing = 8-candidate.board().flat().filter(p=>p?.color===side&&p.type==='p').length;
          return spawned === Math.min(empties, draftedId === "knight-horde" ? 2 : Math.max(0,missing)) && candidate.turn() === after.turn();
}

/** Pure command validation and reduction; persistence uses a revision compare-and-swap. */
export function reduceCommand(room: SyncRoom, userId: string, command: any, now = Date.now(), settling = false): Record<string, any> | null {
  const actor: "host" | "guest" | null = userId === room.hostId ? "host" : userId === room.guestId ? "guest" : null;
  if (!actor) throw new SyncError(403, "Not in this room");
  if (!command || typeof command.id !== "string" || !/^[\w-]{16,80}$/.test(command.id)) throw new SyncError(400, "Invalid action ID");
  const old = metadata(room);
  if (old.receipts.includes(command.id)) return null;
  const expired = settling ? null : settleRoom(room, now);
  if (expired) return expired;
  const message = command.message;
  if (!message || !allowed.has(message.type)) throw new SyncError(400, "Unsupported action");
  const type = message.type as string;
  const color: "white" | "black" = (actor === "host") === (room.hostColor === "white") ? "white" : "black";
  const side = color === "white" ? "w" : "b";
  const meta: SyncMeta = structuredClone(old);
  if (meta.clock) meta.clock = projectClock(meta.clock, now);
  const state = cleanState(room.chaosState);
  const patch: Record<string, any> = {};
  let outgoing: Record<string, any> = { type };
  let nextState = state;
  if (meta.draftProtocol === 2 && meta.draft && ["move", "chaos_move", "draft", "ability", "king_capture"].includes(type)) throw new SyncError(409, "Waiting for the power pick");
  if (stateTypes.has(type)) {
    if (command.baseRevision !== old.stateRevision) throw new SyncError(409, "The board changed before this action was saved");
    if (room.status !== "playing") throw new SyncError(409, "This game is not playing");
    if (!("host" in meta.picks) || !("guest" in meta.picks)) throw new SyncError(409, "Both opening choices must be saved first");
    const fen = type === "chaos_move" ? message.newFen : message.fen;
    let before: Chess, after: Chess;
    try { before = new Chess(room.fen); after = new Chess(fen); } catch { throw new SyncError(400, "Invalid board position"); }
    if (typeof fen !== "string") throw new SyncError(400, "Missing board position");
    const from = message.lastMoveFrom ?? "", to = message.lastMoveTo ?? "";
    const moving = from !== "" || to !== "";
    if (moving && (before.turn() !== side || !/^[a-h][1-8]$/.test(from) || !/^[a-h][1-8]$/.test(to))) throw new SyncError(409, "It is not your turn");
    if (moving && before.get(from)?.color !== side) throw new SyncError(400, "The source piece is not yours");
    if (moving) {
      const restriction = blockedMove(before, state, side, from, to);
      if (restriction) throw new SyncError(400, restriction);
    }
    if (meta.frozenBy && (meta.frozenBy !== actor || type !== "draft")) throw new SyncError(409, "Waiting for the other player to finish drafting");
    const proposed = cleanState(message.chaosState);
    let addedPower = false;
    let draftedId: string | undefined;
    for (const key of ["playerModifiers", "aiModifiers"] as const) {
      if (!Array.isArray(proposed[key]) || proposed[key].length > 20) throw new SyncError(400, "Invalid powers");
      const canonical = proposed[key].map(m => ALL_MODIFIERS.find(x => x.id === m?.id));
      if (canonical.some(m => !m) || new Set(canonical.map(m => m!.id)).size !== canonical.length) throw new SyncError(400, "Unknown or duplicate power");
      proposed[key] = canonical as typeof proposed[typeof key];
      const previous = state[key];
      const anomaly = color === "white" ? state.playerAnomaly : state.aiAnomaly;
      const added = proposed[key].filter(m => !previous.some(p => p.id === m.id) && !(m.id === "amazon" && anomaly === "magician" && after.moveNumber() >= 10));
      const own = key === (color === "white" ? "playerModifiers" : "aiModifiers");
      if (added.length) { addedPower = true; draftedId = added[0].id; }
      if (added.length && (type !== "draft" || !own || added.length !== 1)) throw new SyncError(400, "Powers may only be added by their owner's draft");
      if (!own && ids(previous) !== ids(proposed[key])) throw new SyncError(400, "Cannot change the opponent's powers");
    }
    if (!Number.isInteger(proposed.currentPhase) || proposed.currentPhase < state.currentPhase || proposed.currentPhase > state.currentPhase + 1) throw new SyncError(400, "Invalid draft phase");
    proposed.phaseTriggers = state.phaseTriggers;
    if (meta.draftProtocol === 2) { proposed.currentPhase = state.currentPhase; proposed.draftStep = state.draftStep; proposed.isDrafting = false; proposed.draftChoices = []; }
    if (meta.draftProtocol === 2 && addedPower) throw new SyncError(400, "Use the server power picker");
    if (addedPower) {
      const phase = color === "white" ? state.currentPhase + 1 : proposed.currentPhase;
      const key = `${phase}:${color}`;
      if (!state.phaseTriggers[phase - 1] || before.moveNumber() < state.phaseTriggers[phase - 1] || meta.draftPicks?.[key]) throw new SyncError(409, "This draft is not available");
      if (color === "black" && !meta.draftPicks?.[`${phase}:white`] && state.draftStep !== 1) throw new SyncError(409, "White must draft first");
      meta.draftPicks = { ...meta.draftPicks, [key]: true };
    } else if (proposed.currentPhase !== state.currentPhase) throw new SyncError(400, "Phase changed without a draft");
    proposed.draftStep = addedPower ? (color === "white" ? 1 : 2) : state.draftStep === 2 ? 0 : state.draftStep ?? 0;
    if (after.moveNumber() < before.moveNumber() || after.moveNumber() > before.moveNumber() + 1) throw new SyncError(400, "Invalid move counter");
    if (moving) {
      const ownMods = color === "white" ? state.playerModifiers : state.aiModifiers;
      const enemyMods = color === "white" ? state.aiModifiers : state.playerModifiers;
      const anomaly = color === "white" ? state.playerAnomaly : state.aiAnomaly;
      const used = color === "white" ? state.playerAnomalyUsed : state.aiAnomalyUsed;
      const legal = before.moves({ verbose: true }).some(m => m.from === from && m.to === to);
      const chaosOptions = getChaosMoves(before, ownMods, side, state.assignedSquares, enemyMods, {
        playerAnomaly: anomaly, moonUnlocked: before.moveNumber() >= 10, strengthMode: anomaly === "strength" && !used,
      }).filter(m => m.from === from && m.to === to);
      const chaosLegal = chaosOptions.length > 0;
      // These explicit activated abilities have their own UI target selection.
      const activated = !used && anomaly === "lovers" && before.get(to)?.color === side;
      if (!legal && !chaosLegal && !activated) throw new SyncError(400, "Move is not enabled by this piece's powers");
      const candidates: Chess[] = [];
      for (const option of chaosOptions) {
        const promoted = after.get(to);
        const chosen: typeof option = option.promotionChoice && promoted?.color === side && ["q", "r", "b", "n"].includes(promoted.type)
          ? { ...option, spawnPiece: { type: promoted.type, color: side } } : option;
        const executed = executeChaosMove(before, chosen, ownMods, enemyMods, side === "w" ? state.playerNuclearCooldownUntil : state.aiNuclearCooldownUntil);
        if (executed) candidates.push(executed);
      }
      if (legal) {
        const normal = new Chess(before.fen());
        const result = normal.move({ from, to, promotion: after.get(to)?.type });
        const cooldown = color === "white" ? state.playerNuclearCooldownUntil : state.aiNuclearCooldownUntil;
        const effective = before.moveNumber() >= (cooldown ?? 0) ? ownMods : ownMods.filter(m => m.id !== "nuclear-queen");
        const post = result.captured ? applyPostMoveEffects(normal, from, to, true, result.piece, side, effective, enemyMods, result.captured) ?? normal : normal;
        if (anomaly === "death" && result.captured && result.captured !== "p" && !post.get(from)) post.put({type:"p", color:side},from);
        candidates.push(post);
      }
      if (activated) {
        const special = new Chess(before.fen());
        const piece = special.get(from)!;
        const target = special.get(to);
        special.remove(from); special.remove(to); special.put({type:piece.type,color:side},to);
        if (anomaly === "lovers" && target) special.put({type:target.type,color:side},from);
        const fields = special.fen().split(" "); fields[1] = side === "w" ? "b" : "w"; fields[3] = "-";
        if(side === "b") fields[5] = String(Number(fields[5])+1);
        candidates.push(new Chess(fields.join(" ")));
      }
      const boardMatches = candidates.some(candidate => {
        // Random draft spawns may choose different valid squares. Existing pieces
        // must stay exactly where the validated move left them.
        if (draftedId === "knight-horde" || draftedId === "undead-army") {
          return matchesDraftSpawns(candidate, after, draftedId, side);
        }
        return candidate.fen().split(" ").slice(0,4).join(" ") === after.fen().split(" ").slice(0,4).join(" ");
      });
      if (!boardMatches) throw new SyncError(400, "Board changes do not match the selected move and powers");
      // Derive existing upgrade locations from the validated board, never a client guess.
      const source = before.get(from), sourceAfter = after.get(from), target = before.get(to);
      const samePiece = (a: typeof source, b: typeof source) => !!a && !!b && a.type === b.type && a.color === b.color;
      const tracked = updateTrackedPieces(state, from, to, !!target && target.color !== side, {
        pieceStays: samePiece(source, sourceAfter),
        swap: target?.color === side && samePiece(target, sourceAfter) && samePiece(source, after.get(to)),
        board: after,
      });
      proposed.assignedSquares = { ...proposed.assignedSquares, ...tracked.assignedSquares };
    }
    // The chosen anomalies are immutable and come from authenticated opening picks.
    proposed.playerAnomaly = state.playerAnomaly;
    proposed.aiAnomaly = state.aiAnomaly;
    // Enforce the same cooldown for ordinary captures and Amazon/Cannon captures.
    proposed.playerNuclearCooldownUntil = state.playerNuclearCooldownUntil ?? 0;
    proposed.aiNuclearCooldownUntil = state.aiNuclearCooldownUntil ?? 0;
    const nuclearKey = side === "w" ? "playerNuclearCooldownUntil" : "aiNuclearCooldownUntil";
    const nuclearMods = side === "w" ? state.playerModifiers : state.aiModifiers;
    if (moving && before.get(from)?.type === "q" && before.get(to)?.color === (side === "w" ? "b" : "w") && nuclearMods.some(m=>m.id==="nuclear-queen") && before.moveNumber() >= (state[nuclearKey] ?? 0)) {
      proposed[nuclearKey] = before.moveNumber() + NUCLEAR_QUEEN_COOLDOWN_TURNS;
    }
    // Status effects come from the saved ability command, never a stale client copy.
    for (const owner of ["player", "ai"] as const) {
      for (const effect of ["Frozen", "Immune"] as const) {
        const turnsKey = `${owner}${effect}TurnsLeft` as const;
        const squareKey = `${owner}${effect}Square` as const;
        const expiresOnWhiteMove = effect === "Immune" ? owner === "player" : owner === "ai";
        const turns = Math.max(0, (state[turnsKey] ?? 0) - (moving && expiresOnWhiteMove === (side === "w") ? 1 : 0));
        proposed[turnsKey] = turns;
        proposed[squareKey] = turns ? (state[squareKey] === from ? to : state[squareKey]) : null;
      }
    }
    if (!moving && type !== "draft") throw new SyncError(400, "Missing move");
    if (!moving && fen !== room.fen && !(addedPower && (draftedId === "knight-horde" || draftedId === "undead-army") && matchesDraftSpawns(before, after, draftedId, side))) {
      const anomaly = color === "white" ? state.playerAnomaly : state.aiAnomaly;
      const used = color === "white" ? state.playerAnomalyUsed : state.aiAnomalyUsed;
      if (used || before.turn() !== side) throw new SyncError(409, "Ability is unavailable");
      const expected = new Chess(room.fen);
      if (anomaly === "sun") {
        const pawns = expected.board().flat().filter(p => p?.color === side && p.type === "p");
        const targets = pawns.map(p => ({ from: p!.square, to: `${p!.square[0]}${Number(p!.square[1])+(side==='w'?1:-1)}` as any }))
          .filter(p => /^[a-h][2-7]$/.test(p.to) && !expected.get(p.to));
        for(const p of targets) { expected.remove(p.from); expected.put({type:"p",color:side},p.to); }
        if(expected.fen() !== fen) throw new SyncError(400, "Invalid pawn surge");
      } else if (anomaly === "judgement") {
        const captured = color === "white" ? state.playerCapturedForJudgement : state.aiCapturedForJudgement;
        let added = 0;
        for(let rank=1;rank<=8;rank++) for(const file of "abcdefgh") {
          const sq = `${file}${rank}` as any, oldPiece=before.get(sq), piece=after.get(sq);
          if(JSON.stringify(oldPiece) === JSON.stringify(piece)) continue;
          if(oldPiece || !piece || piece.color !== side || !captured?.includes(`${side}${piece.type.toUpperCase()}`)) throw new SyncError(400, "Invalid resurrection");
          added++;
        }
        if(added !== 1 || before.turn() !== after.turn()) throw new SyncError(400, "Invalid resurrection");
      } else throw new SyncError(400, "Board change requires a move");
    }
    if (state.playerAnomalyUsed && !proposed.playerAnomalyUsed || state.aiAnomalyUsed && !proposed.aiAnomalyUsed) throw new SyncError(400, "An ability cannot be restored after use");
    nextState = proposed;
    patch.fen = after.fen();
    patch.lastMoveFrom = from || room.lastMoveFrom;
    patch.lastMoveTo = to || room.lastMoveTo;
    if (moving && !meta.firstMoves?.includes(side)) meta.firstMoves = [...(meta.firstMoves ?? []), side];
    patch.moveHistory = moving ? [...(Array.isArray(room.moveHistory) ? room.moveHistory : []), {
      from, to, color: side, moveNumber: before.moveNumber(), timestamp: now, fen: after.fen(), revision: old.stateRevision + 1,
      powers: { white: proposed.playerModifiers.map(m=>m.id), black: proposed.aiModifiers.map(m=>m.id) },
      frozen: { white: proposed.playerFrozenSquare, black: proposed.aiFrozenSquare },
    }] : room.moveHistory;
    // A standard-chess mate can still have a legal powered escape.
    const outcome = chaosOutcome(after, proposed);
    patch.status = outcome ? "finished" : "playing";
    if (outcome) meta.result = outcome;
    if (moving && !outcome && meta.draftProtocol === 2) {
      const phase = state.currentPhase + 1;
      const ready = state.phaseTriggers[phase - 1] && before.moveNumber() >= state.phaseTriggers[phase - 1] &&
        !meta.draftPicks?.[phase + ":" + color] && (side === "w" || meta.draftPicks?.[phase + ":white"]);
      if (ready) meta.draft = {id: "draft-" + phase + "-" + color + "-" + (old.stateRevision + 1), color, phase,
        choices: draftChoices(after.fen(), proposed, color, phase), deadline: now + DRAFT_DURATION_MS};
    }
    if (moving && meta.clock) meta.clock[side] += (room.incrementSeconds ?? 0) * 1000;
    for (const key of ["capturedPawnsWhite", "capturedPawnsBlack"]) {
      if (message[key] !== undefined) {
        if (!Number.isFinite(message[key]) || message[key] < 0 || message[key] > 86_400_000) throw new SyncError(400, "Invalid counter");
        patch[key] = Math.round(message[key]);
      }
    }
    if (type === "draft") {
      delete meta.frozenBy;
    }
    meta.stateRevision++;
    outgoing = { ...message, type: type === "chaos_move" ? "move" : type, ...snapshot({ ...room, ...patch, chaosState: { ...nextState, _sync: meta } }) };
  } else if (type === "power_pick" || type === "power_reroll") {
    const draft = meta.draft;
    if (meta.draftProtocol !== 2 || room.status !== "playing" || !draft || draft.color !== color || message.draftId !== draft.id) throw new SyncError(409, "This power pick has ended");
    if (!draft.choices.includes(message.modifierId)) throw new SyncError(400, "Choose one of the offered powers");
    if (type === "power_reroll") {
      if (draft.rerolled || state[side === "w" ? "playerAnomaly" : "aiAnomaly"] !== "temperance") throw new SyncError(400, "Reroll unavailable");
      const replacements = draftChoices(room.fen, state, color, draft.phase, draft.choices).slice(0, 2);
      if (!replacements.length) throw new SyncError(409, "No replacement cards available");
      draft.choices = [...draft.choices.filter(id => id !== message.modifierId), ...replacements];
      draft.rerolled = true;
    } else {
      const applied = applyServerDraft(room.fen, state, draft, message.modifierId);
      nextState = applied.state; patch.fen = applied.fen;
      meta.draftPicks = {...meta.draftPicks, [draft.phase + ":" + color]: true};
      delete meta.draft;
      const outcome = chaosOutcome(new Chess(applied.fen), nextState);
      if (outcome) {patch.status = "finished"; meta.result = outcome;}
      outgoing = {type: "power_picked", modifierId: message.modifierId, color, phase: draft.phase, automatic: settling};
    }
    meta.stateRevision++;
  } else if (type === "ability") {
    if (room.status !== "playing" || command.baseRevision !== old.stateRevision || meta.frozenBy) throw new SyncError(409, "Ability is unavailable");
    const game = new Chess(room.fen);
    const own = side === "w" ? "player" : "ai", enemy = side === "w" ? "ai" : "player";
    const anomaly = state[`${own}Anomaly`];
    if (game.turn() !== side || state[`${own}AnomalyUsed`]) throw new SyncError(409, "Ability is unavailable");
    if (typeof message.square !== "string" || !/^[a-h][1-8]$/.test(message.square)) throw new SyncError(400, "Invalid target");
    const piece = game.get(message.square);
    if (!piece) throw new SyncError(400, "Choose a piece");
    nextState = { ...state, [`${own}AnomalyUsed`]: true };
    if (anomaly === "justice" && piece.color === side) {
      nextState = { ...nextState, [`${own}ImmuneSquare`]: message.square, [`${own}ImmuneTurnsLeft`]: 3 };
    } else throw new SyncError(400, "This ability cannot target that piece");
    meta.stateRevision++;
    outgoing = { type, square: message.square, chaosState: nextState };
  } else if (type === "king_capture") {
    if(room.status !== "playing" || command.baseRevision !== old.stateRevision) throw new SyncError(409,"The board changed");
    const game = new Chess(room.fen);
    const own = color === "white" ? state.playerModifiers : state.aiModifiers;
    const other = color === "white" ? state.aiModifiers : state.playerModifiers;
    const anomaly = color === "white" ? state.playerAnomaly : state.aiAnomaly;
    const legal = getChaosMoves(game,own,side,state.assignedSquares,other,{playerAnomaly:anomaly}).some(m=>m.from===message.from&&m.to===message.to);
    if(meta.frozenBy || game.turn() !== side || game.get(message.to)?.type !== "k" || game.get(message.to)?.color === side || !legal || blockedMove(game,state,side,message.from,message.to)) throw new SyncError(400,"Invalid king capture");
    patch.status = "finished"; meta.stateRevision++;
    meta.result = {winner: color, reason: "King captured"};
    outgoing = {type:"game_over",winner:color,reason:"King Captured"};
  } else if (type === "anomaly_pick") {
    if (room.status !== "playing") throw new SyncError(409, "Room is not ready");
    if (meta.draftProtocol === 2 && message.anomalyId !== null && !meta.opening?.offers[actor].includes(message.anomalyId)) throw new SyncError(400, "Choose one of the offered anomalies");
    if (message.anomalyId !== null && !ALL_ANOMALIES.some(a => a.id === message.anomalyId)) throw new SyncError(400, "Unknown anomaly");
    if (actor in meta.picks && meta.picks[actor] !== message.anomalyId) throw new SyncError(409, "Opening choice already saved");
    if (actor in meta.picks) return null;
    meta.picks[actor] = message.anomalyId;
    if (message.anomalyId === "empress") {
      const board = new Chess(room.fen);
      for (const square of side === "w" ? ["c3", "f3"] : ["c6", "f6"]) {
        board.put({ type: "p", color: side }, square as "c3" | "f3" | "c6" | "f6");
      }
      patch.fen = board.fen();
    }
    nextState = { ...state, [color === "white" ? "playerAnomaly" : "aiAnomaly"]: message.anomalyId };
    const definition = ALL_ANOMALIES.find(a => a.id === message.anomalyId);
    const key = color === "white" ? "playerModifiers" : "aiModifiers";
    for (const id of definition?.injectModifiers ?? []) {
      if (id === "amazon") continue;
      const mod = ALL_MODIFIERS.find(m => m.id === id);
      if (mod && !nextState[key].some(m => m.id === id)) nextState[key] = [...nextState[key], mod];
    }
    outgoing.anomalyId = message.anomalyId;
    if (meta.draftProtocol === 2) meta.stateRevision++;
  } else if (type === "draft_freeze") {
    if (meta.draftProtocol === 2) throw new SyncError(400, "The server starts power picks after moves");
    if (room.status !== "playing" || (meta.frozenBy && meta.frozenBy !== actor)) throw new SyncError(409, "Draft is unavailable");
    const before = new Chess(room.fen);
    const phase = state.currentPhase + 1;
    if (before.turn() !== side || !state.phaseTriggers[phase - 1] || before.moveNumber() < state.phaseTriggers[phase - 1] || meta.draftPicks?.[`${phase}:${color}`]) throw new SyncError(409, "Draft is unavailable");
    meta.frozenBy = actor;
  } else if (type === "resign") {
    if (room.status !== "playing") throw new SyncError(409, "Game already ended");
    patch.status = `resigned-${color}`;
    outgoing.winner = color === "white" ? "black" : "white";
    meta.result = {winner: outgoing.winner, reason: "Resignation"};
    meta.stateRevision++;
  } else if (type === "draw-offer") {
    if (room.status !== "playing") throw new SyncError(409, "Game already ended");
    meta.drawOffer = actor;
  } else if (type === "draw-accept" || type === "draw-decline") {
    if (!meta.drawOffer || meta.drawOffer === actor) throw new SyncError(409, "No opponent draw offer");
    delete meta.drawOffer;
    if (type === "draw-accept") { patch.status = "finished"; meta.stateRevision++; meta.result = {winner: "draw", reason: "Draw agreed"}; }
  } else if (type === "rematch") {
    if (room.status === "playing" || room.status === "waiting") throw new SyncError(409, "Finish this game first");
    if (!meta.rematch.includes(actor)) meta.rematch.push(actor);
    if (meta.rematch.length === 2) {
      // Keep recent games through rematches, separately from the short reconnect event window.
      meta.games = [...(meta.games ?? []), { endedAt: Date.now(), status: room.status, result: meta.result,
        fen: room.fen, state: cleanState(room.chaosState), moves: room.moveHistory }].slice(-10);
      meta.gameNumber = (meta.gameNumber ?? 0) + 1;
      delete meta.result;
      nextState = createChaosState();
      Object.assign(patch, { fen: new Chess().fen(), status: "playing", moveHistory: [], lastMoveFrom: null, lastMoveTo: null,
        capturedPawnsWhite: 0, capturedPawnsBlack: 0, hostColor: room.hostColor === "white" ? "black" : "white",
        timerWhiteMs: room.timeControlSeconds > 0 ? room.timeControlSeconds * 1000 : null,
        timerBlackMs: room.timeControlSeconds > 0 ? room.timeControlSeconds * 1000 : null });
      delete meta.clock; delete meta.draft; delete meta.opening; delete meta.openingMove; meta.firstMoves = [];
      meta.rematch = []; meta.draftPicks = {}; meta.picks = { host: null, guest: null }; delete meta.drawOffer; delete meta.frozenBy;
      meta.stateRevision++;
    }
  } else if (type === "chat") {
    if (typeof message.text !== "string" || !message.text.trim() || message.text.length > 300) throw new SyncError(400, "Invalid chat message");
    const last = [...(meta.chat ?? [])].reverse().find(m => m.actor === actor);
    if (last && now - last.ts < 1000) throw new SyncError(429, "Wait a moment before sending another message");
    outgoing.text = message.text.trim();
    meta.chat = [...(meta.chat ?? []), {id: command.id, actor, text: outgoing.text, ts: now}].slice(-50);
  } else if (type === "join") {
    if (actor !== "guest") throw new SyncError(403, "Only the guest can join");
    outgoing.guestId = "joined";
  }
  const nextStatus = patch.status ?? room.status;
  if (!meta.clock && room.timeControlSeconds > 0 && "host" in meta.picks && "guest" in meta.picks && nextStatus === "playing") {
    meta.clock = { w: room.timeControlSeconds * 1000, b: room.timeControlSeconds * 1000, active: null, since: now };
  }
  if (meta.clock) {
    meta.clock.active = nextStatus === "playing" && !meta.frozenBy && !meta.draft ? new Chess(patch.fen ?? room.fen).turn() : null;
    patch.timerWhiteMs = meta.clock.w; patch.timerBlackMs = meta.clock.b;
  }
  if (meta.openingMoveRule) {
    const turn = new Chess(patch.fen ?? room.fen).turn();
    if (nextStatus !== "playing" || meta.draft || meta.frozenBy || !("host" in meta.picks) || !("guest" in meta.picks) || meta.firstMoves?.includes(turn)) {
      delete meta.openingMove;
    } else if (meta.openingMove?.side !== turn) {
      meta.openingMove = {side: turn, deadline: now + OPENING_MOVE_MS};
    }
  }
  // Record accepted board / power changes, including drafts and non-move abilities.
  // Rematches start a separate timeline; chat and reconnects add no frames.
  if ((meta.gameNumber ?? 0) !== (old.gameNumber ?? 0)) meta.replayFrames = [];
  if (meta.stateRevision !== old.stateRevision) {
    const frames = meta.replayFrames ?? [{fen:room.fen,state:visualState(state),label:'Starting position'}];
    const replayFrom = message.lastMoveFrom ?? message.from, replayTo = message.lastMoveTo ?? message.to;
    const label = type === 'power_pick' ? `${color} picked ${ALL_MODIFIERS.find(m=>m.id===message.modifierId)?.name ?? 'a power'}`
      : type === 'anomaly_pick' ? `${color} chose an anomaly`
      : replayFrom && replayTo ? `${color}: ${replayFrom} → ${replayTo}` : type.replaceAll('_',' ');
    meta.replayFrames = [...frames,{fen:patch.fen ?? room.fen,state:visualState(nextState),label,
      ...(replayFrom && replayTo ? {from:replayFrom,to:replayTo} : {})}];
  }
  meta.revision++;
  meta.events = [...meta.events, { revision: meta.revision, actor: settling ? "system" : actor, message: outgoing } satisfies SyncEvent].slice(-64);
  meta.receipts = [...meta.receipts, command.id].slice(-256);
  return { ...patch, chaosState: { ...nextState, _sync: meta }, updatedAt: new Date() };
}

