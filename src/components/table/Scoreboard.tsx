import React from 'react';
import type { TeamScore, Suit } from '../../types/game';
import { SUIT_SYMBOLS } from '../../game-engine/utils/deck';

interface ScoreboardProps {
  dealScores: [TeamScore, TeamScore];
  matchScores: [number, number];
  matchTarget: number;
  currentDeal: number;
  trumpSuit: Suit | null;
}

export const Scoreboard: React.FC<ScoreboardProps> = ({
  dealScores,
  matchScores,
  trumpSuit,
}) => {
  const trumpSymbol = trumpSuit ? SUIT_SYMBOLS[trumpSuit] : null;
  const isRedTrump = trumpSuit === 'hearts' || trumpSuit === 'diamonds';

  return (
    <div className="flex items-center gap-3 sm:gap-5 bg-neutral-900/80 border border-white/10 rounded-full px-4 sm:px-5 py-2 backdrop-blur-2xl shadow-xl text-xs">
      {/* Team 1 */}
      <div className="flex items-center gap-2">
        <span className="text-[11px] font-medium text-white/50">T1</span>
        <span className="font-semibold text-sm text-white">
          {dealScores[0].tricksWon}
        </span>
        <span className="text-[10px] text-white/30">
          ({matchScores[0]})
        </span>
      </div>

      <div className="h-3 w-px bg-white/10" />

      {/* Trump & Deal */}
      <div className="flex items-center gap-1.5">
        {trumpSymbol ? (
          <span className={`text-base font-bold leading-none ${isRedTrump ? 'text-rose-500' : 'text-white'}`}>
            {trumpSymbol}
          </span>
        ) : (
          <span className="text-[11px] text-white/40">No Trump</span>
        )}
      </div>

      <div className="h-3 w-px bg-white/10" />

      {/* Team 2 */}
      <div className="flex items-center gap-2">
        <span className="text-[10px] text-white/30">
          ({matchScores[1]})
        </span>
        <span className="font-semibold text-sm text-white">
          {dealScores[1].tricksWon}
        </span>
        <span className="text-[11px] font-medium text-white/50">T2</span>
      </div>
    </div>
  );
};
