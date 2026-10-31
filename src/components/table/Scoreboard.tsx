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
      title="View full hand and score ledger"
      className="flex items-center gap-3 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 hover:border-neutral-700 rounded-full px-3.5 py-1.5 text-xs cursor-pointer transition-colors"
    >
      {/* Team 1 */}
      <div className="flex items-center gap-1.5">
        <span className="text-xs font-medium text-emerald-400">T1</span>
        <span className="font-semibold text-white">
          {dealScores[0].tricksWon}
        </span>
        <span className="text-[10px] text-neutral-400">
          ({matchScores[0]})
        </span>
      </div>

      <span className="text-neutral-600">&bull;</span>

      {/* Trump suit */}
      <div className="flex items-center gap-1">
        {trumpSymbol ? (
          <span className={`text-sm font-semibold leading-none ${isRedTrump ? 'text-[#c22026]' : 'text-white'}`}>
            {trumpSymbol}
          </span>
        ) : (
          <span className="text-[11px] text-neutral-500">No Trump</span>
        )}
      </div>

      <span className="text-neutral-600">&bull;</span>

      {/* Team 2 */}
      <div className="flex items-center gap-1.5">
        <span className="text-[10px] text-neutral-400">
          ({matchScores[1]})
        </span>
        <span className="font-semibold text-white">
          {dealScores[1].tricksWon}
        </span>
        <span className="text-xs font-medium text-amber-400">T2</span>
      </div>
    </button>
  );
};
