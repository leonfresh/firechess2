/**
 * Replay link builders for the Game of the Week.
 *
 * Every working Chaos replay surface keys on the ROOM id: the website uses
 * /chaos/replay/<roomId> (app/chaos/week, lib/chaos-week-post) and the Discord
 * Activity uses /watch?match=<roomId> (whose API matches m.room_id or m.id).
 * The landing strip used the archive match id first, so it pointed at a
 * different id than every other surface. Keep both hosts on the room id.
 */
export function chaosReplayHref(
  roomId: string,
  opts: { activityHost: boolean; replayBase?: string },
): string {
  const base =
    opts.replayBase ?? (opts.activityHost ? "/watch?match=" : "/chaos/replay/");
  return `${base}${encodeURIComponent(roomId)}`;
}

export function chaosWeekHref(opts: {
  activityHost: boolean;
  weekHref?: string;
}): string {
  return (
    opts.weekHref ?? (opts.activityHost ? "/watch?tab=archive" : "/chaos/week")
  );
}
