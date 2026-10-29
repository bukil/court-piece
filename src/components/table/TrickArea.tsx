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
  // Map played cards by their relative table position: 'bottom' | 'left' | 'top' | 'right'
  const playedByPosition: Partial<Record<RelativePosition, { card: Card; seatIndex: number; playerId: string }>> = {};

  trick.cards.forEach((p) => {
    const pos = getRelativePosition(p.seatIndex);
    playedByPosition[pos] = p;
  });

  const leadSymbol = trick.leadSuit ? SUIT_SYMBOLS[trick.leadSuit] : null;

  return (
    <div className="relative w-64 h-64 sm:w-76 sm:h-76 md:w-84 md:h-84 rounded-full bg-emerald-950/40 border border-emerald-800/40 shadow-inner flex items-center justify-center">
      {/* Central Felt Watermark / Lead Suit Indicator */}
      <div className="absolute flex flex-col items-center justify-center pointer-events-none text-emerald-800/40">
        {leadSymbol ? (
          <div className="flex flex-col items-center">
            <span className="text-3xl sm:text-4xl">{leadSymbol}</span>
            <span className="text-[10px] font-mono tracking-widest uppercase text-emerald-400/70 mt-1">
              Lead: {trick.leadSuit}
            </span>
          </div>
        ) : (
          <span className="text-xs font-mono tracking-wider uppercase text-emerald-700/50">
            Waiting for lead
          </span>
        )}
      </div>

      {/* Top played card (Partner) */}
      <div className="absolute top-2 sm:top-4 flex flex-col items-center">
        {playedByPosition.top ? (
          <CardView card={playedByPosition.top.card} size="sm" />
        ) : (
          <div className="w-12 h-18 rounded-md border border-dashed border-emerald-900/40 flex items-center justify-center text-[10px] text-emerald-800/30">
            Top
          </div>
        )}
      </div>

      {/* Left played card (Opponent 1) */}
      <div className="absolute left-2 sm:left-4 flex flex-col items-center">
        {playedByPosition.left ? (
          <CardView card={playedByPosition.left.card} size="sm" />
        ) : (
          <div className="w-12 h-18 rounded-md border border-dashed border-emerald-900/40 flex items-center justify-center text-[10px] text-emerald-800/30">
            Left
          </div>
        )}
      </div>

      {/* Right played card (Opponent 2) */}
      <div className="absolute right-2 sm:right-4 flex flex-col items-center">
        {playedByPosition.right ? (
          <CardView card={playedByPosition.right.card} size="sm" />
        ) : (
          <div className="w-12 h-18 rounded-md border border-dashed border-emerald-900/40 flex items-center justify-center text-[10px] text-emerald-800/30">
            Right
          </div>
        )}
      </div>

      {/* Bottom played card (Local Player) */}
      <div className="absolute bottom-2 sm:bottom-4 flex flex-col items-center">
        {playedByPosition.bottom ? (
          <CardView card={playedByPosition.bottom.card} size="sm" />
        ) : (
          <div className="w-12 h-18 rounded-md border border-dashed border-emerald-900/40 flex items-center justify-center text-[10px] text-emerald-800/30">
            You
          </div>
        )}
      </div>
    </div>
  );
};

