/**
 * Move-hint decals: static SVG data URIs that keep destinations readable without moving the board
 * squares. Shared by the game board and the watch/replay board so a spectator sees the same shapes
 * the players do — a check for a quiet move, a bracket for a capture, a bolt for a power.
 */
export function chaosMoveDecal(chaos: boolean, capture: boolean, enemy = false): string {
  const color = capture ? "#ff986e" : enemy ? "#ffba84" : chaos ? "#cab0ff" : "#a6eeff";
  const shape = capture
    ? '<path d="M12 32V16Q12 12 16 12H32M68 12H84Q88 12 88 16V32M88 68V84Q88 88 84 88H68M32 88H16Q12 88 12 84V68"/><path d="M44 12L50 19L56 12M88 44L81 50L88 56M56 88L50 81L44 88M12 56L19 50L12 44"/>'
    : chaos
      ? '<path d="M50 28L72 50L50 72L28 50Z"/><path d="M52 37L43 51H51L47 63L60 47H51Z" fill="' +
        color +
        '" stroke="none"/>'
      : '<circle cx="50" cy="50" r="18"/><path d="M41 50L48 57L61 43"/>';
  return `url("data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><g fill="${capture ? "none" : "#172737cc"}" stroke="#172737" stroke-width="8" stroke-linecap="round" stroke-linejoin="round">${shape}</g><g fill="${capture ? "none" : "#172737cc"}" stroke="${color}" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round">${shape}</g></svg>`)}")`;
}
