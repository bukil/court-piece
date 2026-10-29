import React from 'react';
import type { TeamScore, Suit } from '../../types/game';
import { SUIT_SYMBOLS } from '../../game-engine/utils/deck';

interface ScoreboardProps {
  dealScores: [TeamScore, TeamScore];
  matchScores: [number, number];
  matchTarget: number;
  currentDeal: number;
  trumpSuit: Suit | null;
  onClick?: () => void;
}

export const Scoreboard: React.FC<ScoreboardProps> = ({
  dealScores,
  matchScores,
  trumpSuit,
  onClick,
}) => {
  const trumpSymbol = trumpSuit ? SUIT_SYMBOLS[trumpSuit] : null;
  const isRedTrump = trumpSuit === 'hearts' || trumpSuit === 'diamonds';

  return (
    <button
      type="button"
      onClick={onClick}
      title="Click to view full hand & score record"
      className="flex items-center gap-3 sm:gap-4 bg-neutral-900/80 hover:bg-neutral-900 border border-white/10 hover:border-white/20 rounded-full px-4 sm:px-5 py-1.5 backdrop-blur-2xl shadow-xl text-xs cursor-pointer transition-all active:scale-95"
    >
      {/* Team 1 */}
      <div className="flex items-center gap-1.5">
        <span className="text-[11px] font-medium text-emerald-400/80">T1</span>
        <span className="font-semibold text-sm text-white">
          {dealScores[0].tricksWon}
        </span>
        <span className="text-[10px] text-white/40">
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
      <div className="flex items-center gap-1.5">
        <span className="text-[10px] text-white/40">
          ({matchScores[1]})
        </span>
        <span className="font-semibold text-sm text-white">
          {dealScores[1].tricksWon}
        </span>
        <span className="text-[11px] font-medium text-indigo-400/80">T2</span>
      </div>
    </button>
  );
};
