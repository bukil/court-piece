import React from 'react';
import type { Trick, RelativePosition, Card } from '../../types/game';
import { CardView } from './CardView';
import { SUIT_SYMBOLS } from '../../game-engine/utils/deck';

interface TrickAreaProps {
  trick: Trick;
  getRelativePosition: (seatIndex: number) => RelativePosition;
  seats: { nickname: string; seatIndex: number }[];
}

export const TrickArea: React.FC<TrickAreaProps> = ({ trick, getRelativePosition }) => {
  const playedByPosition: Partial<Record<RelativePosition, { card: Card; seatIndex: number; playerId: string }>> = {};

  trick.cards.forEach((p) => {
    const pos = getRelativePosition(p.seatIndex);
    playedByPosition[pos] = p;
  });

  const leadSymbol = trick.leadSuit ? SUIT_SYMBOLS[trick.leadSuit] : null;

  return (
    <div className="relative w-52 h-52 sm:w-60 sm:h-60 rounded-full bg-[#11141b] border border-neutral-800/80 flex items-center justify-center">
      {/* Lead suit indicator in center */}
      {leadSymbol && (
        <div className="absolute flex items-center justify-center pointer-events-none text-neutral-700/60 text-4xl sm:text-5xl font-semibold select-none">
          {leadSymbol}
        </div>
      )}

      {/* Top card (Partner) */}
      <div className="absolute top-2.5">
        {playedByPosition.top ? (
          <div className="animate-fade-in">
            <CardView card={playedByPosition.top.card} size="sm" />
          </div>
        ) : (
          <div className="w-11 h-16 rounded-md border border-dashed border-neutral-800/80" />
        )}
      </div>

      {/* Left card (Opponent 1) */}
      <div className="absolute left-2.5">
        {playedByPosition.left ? (
          <div className="animate-fade-in">
            <CardView card={playedByPosition.left.card} size="sm" />
          </div>
        ) : (
          <div className="w-11 h-16 rounded-md border border-dashed border-neutral-800/80" />
        )}
      </div>

      {/* Right card (Opponent 2) */}
      <div className="absolute right-2.5">
        {playedByPosition.right ? (
          <div className="animate-fade-in">
            <CardView card={playedByPosition.right.card} size="sm" />
          </div>
        ) : (
          <div className="w-11 h-16 rounded-md border border-dashed border-neutral-800/80" />
        )}
      </div>

      {/* Bottom card (Local player) */}
      <div className="absolute bottom-2.5">
        {playedByPosition.bottom ? (
          <div className="animate-fade-in">
            <CardView card={playedByPosition.bottom.card} size="sm" />
          </div>
        ) : (
          <div className="w-11 h-16 rounded-md border border-dashed border-neutral-800/80" />
        )}
      </div>
    </div>
  );
};
