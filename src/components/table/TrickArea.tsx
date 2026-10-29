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
    <div className="relative w-56 h-56 sm:w-64 sm:h-64 rounded-full bg-white/[0.015] border border-white/[0.04] flex items-center justify-center">
      {/* Subtle Lead Suit Glyph in center */}
      {leadSymbol && (
        <div className="absolute flex items-center justify-center pointer-events-none text-white/[0.06] text-4xl sm:text-5xl font-bold select-none">
          {leadSymbol}
        </div>
      )}

      {/* Top played card (Partner) */}
      <div className="absolute top-2 sm:top-3">
        {playedByPosition.top ? (
          <div className="animate-fade-in shadow-xl">
            <CardView card={playedByPosition.top.card} size="sm" />
          </div>
        ) : (
          <div className="w-12 h-18 rounded-lg border border-dashed border-white/[0.04]" />
        )}
      </div>

      {/* Left played card (Opponent 1) */}
      <div className="absolute left-2 sm:left-3">
        {playedByPosition.left ? (
          <div className="animate-fade-in shadow-xl">
            <CardView card={playedByPosition.left.card} size="sm" />
          </div>
        ) : (
          <div className="w-12 h-18 rounded-lg border border-dashed border-white/[0.04]" />
        )}
      </div>

      {/* Right played card (Opponent 2) */}
      <div className="absolute right-2 sm:right-3">
        {playedByPosition.right ? (
          <div className="animate-fade-in shadow-xl">
            <CardView card={playedByPosition.right.card} size="sm" />
          </div>
        ) : (
          <div className="w-12 h-18 rounded-lg border border-dashed border-white/[0.04]" />
        )}
      </div>

      {/* Bottom played card (Local player) */}
      <div className="absolute bottom-2 sm:bottom-3">
        {playedByPosition.bottom ? (
          <div className="animate-fade-in shadow-xl">
            <CardView card={playedByPosition.bottom.card} size="sm" />
          </div>
        ) : (
          <div className="w-12 h-18 rounded-lg border border-dashed border-white/[0.04]" />
        )}
      </div>
    </div>
  );
};
