import { POWER_ART_SPRITES, POWER_ILLUSTRATIONS } from './power-art-catalog';

/** Codes for the fairy-piece vector fallbacks, keyed by the modifier that grants them. */
import { FAIRY_PIECE_CODES } from "@/lib/chaos-piece-art";
export { FAIRY_PIECE_CODES } from "@/lib/chaos-piece-art";

/** Shared power artwork: atlas sprite, illustration, or the fairy-piece vector fallback. */
export function PowerArt({ id, piece = 'p' }: { id: string; piece?: string }) {
  const position = POWER_ART_SPRITES[id];
  const illustration = POWER_ILLUSTRATIONS[id];
  return <div aria-hidden="true" className={`power-art ${position || illustration ? '' : 'power-art-fallback'}`}>
    {position ? <div className="power-art-image" style={{backgroundImage:'url(/activity/toy-sheet.webp)',backgroundPosition:position}} />
      : <img className={illustration ? 'power-art-camel' : 'power-art-vector'} src={illustration ? `/activity/${illustration}.webp` : `/activity/pieces/w${FAIRY_PIECE_CODES[id] || piece.toUpperCase()}.svg`} alt="" draggable={false} loading="lazy" decoding="async" />}
  </div>;
}
