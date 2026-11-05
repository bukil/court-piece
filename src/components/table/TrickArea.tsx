import React, { useLayoutEffect, useRef, useState } from 'react';
import type { CardPlayOrigin } from '../../hooks/useCardPlay';
import type { Card } from '../../types/game';
import { soundService } from '../../services/soundService';
import type { Trick, RelativePosition, Suit } from '../../types/game';
import { CardView } from './CardView';
import { SUIT_SYMBOLS } from '../../game-engine/utils/deck';

interface TrickAreaProps {
  trick: Trick;
  trumpSuit?: Suit | null;
  lastCompletedTrick?: Trick;
  getRelativePosition: (seatIndex: number) => RelativePosition;
  seats: { nickname: string; seatIndex: number }[];
  localOrigin?: CardPlayOrigin;
  localCardId?: string;
}
function ThrownCard({ card, position, trump, origin, title }: { card: Card; position: RelativePosition; trump: boolean; origin?: CardPlayOrigin; title: string }) {
  const node = useRef<HTMLDivElement>(null);
  const [firstOrigin] = useState(() => origin);
  useLayoutEffect(() => {
    if (!firstOrigin || !node.current || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const target = node.current.getBoundingClientRect();
    const from = firstOrigin;
    // The table shrinks on phones, and each slot is slightly rotated. Convert the
    // release point into that coordinate system so the flight starts at the finger.
    const table = node.current.closest('.table-center');
    const matrix = new DOMMatrix(table ? getComputedStyle(table).transform : undefined);
    const tableScale = Math.hypot(matrix.a, matrix.b) || 1;
    const rotation = parseFloat(getComputedStyle(node.current.parentElement!).rotate) || 0;
    const delta = new DOMPoint((from.x - target.x - target.width / 2) / tableScale, (from.y - target.y - target.height / 2) / tableScale)
      .matrixTransform(new DOMMatrix().rotate(-rotation));
    const animation = node.current.animate([
      { transform: `translate(${delta.x}px, ${delta.y}px) rotate(${-rotation}deg) scale(${from.width / (node.current.offsetWidth * tableScale)})`, opacity: 1 },
      { transform: 'translate(0,0) scale(1)', opacity: 1 },
    ], { duration: 280, easing: 'cubic-bezier(.2,.75,.25,1)' });
    return () => animation.cancel();
  }, [firstOrigin]);
  return <div ref={node} className={`card-throw throw-${position}${firstOrigin ? ' local-card-throw' : ''}`} title={title}><CardView card={card} isTrump={trump} size="sm" /></div>;
}
export const TrickArea: React.FC<TrickAreaProps> = ({ trick, lastCompletedTrick, getRelativePosition, seats, trumpSuit, localOrigin, localCardId }) => {
  const completedKey = lastCompletedTrick?.cards.map(c => c.card.id).join(',');
  const previousKey = useRef(completedKey);
  const completedRef = useRef(lastCompletedTrick);
  useLayoutEffect(() => { completedRef.current = lastCompletedTrick; }, [lastCompletedTrick]);
  const [collecting, setCollecting] = useState<Trick | null>(null);
  useLayoutEffect(() => {
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
        {play ? <ThrownCard key={play.card.id} card={play.card} position={position} trump={play.card.suit === trumpSuit} origin={play.card.id === localCardId ? localOrigin : undefined} title={`${seats.find(s => s.seatIndex === play.seatIndex)?.nickname ?? 'Player'} played ${play.card.rank} of ${play.card.suit}`} />
        : <div className="empty-card-slot" aria-hidden="true" />}
      </div>;
    })}
    <div className="trick-caption" aria-live="polite">{collecting && !trick.cards.length ? `${seats.find(s => s.seatIndex === winner)?.nickname ?? 'Player'} takes the trick` : trick.cards.length ? <>{trick.cards.length} of 4 played <span>· Lead {trick.leadSuit && SUIT_SYMBOLS[trick.leadSuit]}</span></> : 'A little strategy. A little luck.'}</div>
  </div>
);
};
