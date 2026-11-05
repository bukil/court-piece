import React, { useEffect, useRef, useState } from 'react';
import { soundService } from '../../services/soundService';
import type { Trick, RelativePosition } from '../../types/game';
import { CardView } from './CardView';
import { SUIT_SYMBOLS } from '../../game-engine/utils/deck';

interface TrickAreaProps {
  trick: Trick;
  lastCompletedTrick?: Trick;
  getRelativePosition: (seatIndex: number) => RelativePosition;
  seats: { nickname: string; seatIndex: number }[];
}
export const TrickArea: React.FC<TrickAreaProps> = ({ trick, lastCompletedTrick, getRelativePosition, seats }) => {
  const completedKey = lastCompletedTrick?.cards.map(c => c.card.id).join(',');
  const previousKey = useRef(completedKey);
  const completedRef = useRef(lastCompletedTrick);
  useEffect(() => { completedRef.current = lastCompletedTrick; }, [lastCompletedTrick]);
  const [collecting, setCollecting] = useState<Trick | null>(null);
  useEffect(() => {
    if (completedKey === previousKey.current) return;
    previousKey.current = completedKey;
    if (!completedRef.current) return;
    setCollecting(completedRef.current);
    soundService.playTrickWin();
    const timer = setTimeout(() => setCollecting(null), 1250);
    return () => clearTimeout(timer);
  }, [completedKey]);
  const displayed = collecting && trick.cards.length === 0 ? collecting : trick;
  const winner = collecting?.winnerSeatIndex;
  const winnerPosition = winner === undefined ? 'top' : getRelativePosition(winner);
  return (
  <div className={`trick-area${collecting && !trick.cards.length ? ` collecting collect-${winnerPosition}` : ''}`}  aria-label="Cards on the table">
    <div className="table-monogram" aria-hidden="true"><span>♧</span><span>Court Piece</span></div>
    {(['top', 'left', 'right', 'bottom'] as RelativePosition[]).map(position => {
      const play = displayed.cards.find(p => getRelativePosition(p.seatIndex) === position);
      return <div key={position} className={`trick-slot trick-${position}`}>
        {play ? <div key={play.card.id} className={`card-throw throw-${position}`} title={`${seats.find(s => s.seatIndex === play.seatIndex)?.nickname ?? 'Player'} played ${play.card.rank} of ${play.card.suit}`}><CardView card={play.card} size="sm" /></div>
        : <div className="empty-card-slot" aria-hidden="true" />}
      </div>;
    })}
    <div className="trick-caption" aria-live="polite">{collecting && !trick.cards.length ? `${seats.find(s => s.seatIndex === winner)?.nickname ?? 'Player'} takes the trick` : trick.cards.length ? <>{trick.cards.length} of 4 played <span>· Lead {trick.leadSuit && SUIT_SYMBOLS[trick.leadSuit]}</span></> : 'A little strategy. A little luck.'}</div>
  </div>
);
};
