import { POWER_ART_SPRITES, POWER_ILLUSTRATIONS } from './power-art-catalog';

/** Codes for the fairy-piece vector fallbacks, keyed by the modifier that grants them. */
export const FAIRY_PIECE_CODES: Record<string, string> = {'vaulting-knight':'VK','bank-shot':'BS',conscription:'CS','hostile-takeover':'HT',camel:'Ca','dragon-rook':'Dr',knook:'C',archbishop:'A',amazon:'Am','night-rider':'NR','rook-cannon':'RC','pawn-capture-forward':'PB',railgun:'RG'};

/** Shared power artwork: atlas sprite, illustration, or the fairy-piece vector fallback. */
export function PowerArt({ id, piece = 'p' }: { id: string; piece?: string }) {
  const position = POWER_ART_SPRITES[id];
  const illustration = POWER_ILLUSTRATIONS[id];
  return <div aria-hidden="true" className={`power-art ${position || illustration ? '' : 'power-art-fallback'}`}>
    {position ? <div className="power-art-image" style={{backgroundImage:'url(/activity/toy-sheet.webp)',backgroundPosition:position}} />
      : <img className={illustration ? 'power-art-camel' : 'power-art-vector'} src={illustration ? `/activity/${illustration}.webp` : `/activity/pieces/w${FAIRY_PIECE_CODES[id] || piece.toUpperCase()}.svg`} alt="" draggable={false} loading="lazy" decoding="async" />}
  </div>;
}
