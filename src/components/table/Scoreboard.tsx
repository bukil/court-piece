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
  matchTarget,
  currentDeal,
  trumpSuit,
}) => {
  const trumpSymbol = trumpSuit ? SUIT_SYMBOLS[trumpSuit] : '?';
  const isRedTrump = trumpSuit === 'hearts' || trumpSuit === 'diamonds';

  return (
    <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-4 bg-slate-900/90 border border-slate-800 rounded-2xl px-3 py-1.5 sm:px-5 sm:py-2 backdrop-blur-md shadow-lg text-xs">
      {/* Team Alpha Score */}
      <div className="flex items-center gap-2">
        <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
        <div className="flex flex-col">
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
            Team Alpha (Seats 1 & 3)
          </span>
          <div className="flex items-baseline gap-1.5">
            <span className="font-mono font-black text-sm sm:text-base text-emerald-400">
              {dealScores[0].tricksWon} <span className="text-[10px] font-normal text-slate-400">tricks</span>
            </span>
            <span className="text-[10px] font-mono font-bold text-slate-400">
              ({matchScores[0]} pts)
            </span>
          </div>
        </div>
      </div>

      <div className="hidden sm:block h-7 w-px bg-slate-700/80 mx-1"></div>

      {/* Center Deal & Trump indicator */}
      <div className="flex items-center gap-3 bg-slate-950/80 px-3 py-1 rounded-xl border border-slate-800">
        <div className="flex flex-col items-center">
          <span className="text-[9px] text-slate-400 uppercase font-mono font-bold">
            Deal #{currentDeal}
          </span>
          <span className="text-[10px] font-mono text-slate-300">
            First to 7
          </span>
        </div>

        {trumpSuit && (
          <div className="flex items-center gap-1.5 pl-2 border-l border-slate-800">
            <span className="text-[9px] uppercase font-mono text-amber-400 font-bold">
              TRUMP
            </span>
            <span className={`text-base font-black ${isRedTrump ? 'text-rose-500' : 'text-slate-100'}`}>
              {trumpSymbol}
            </span>
          </div>
        )}
      </div>

      <div className="hidden sm:block h-7 w-px bg-slate-700/80 mx-1"></div>

      {/* Team Beta Score */}
      <div className="flex items-center gap-2">
        <div className="flex flex-col text-right">
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
            Team Beta (Seats 2 & 4)
          </span>
          <div className="flex items-baseline justify-end gap-1.5">
            <span className="text-[10px] font-mono font-bold text-slate-400">
              ({matchScores[1]} pts)
            </span>
            <span className="font-mono font-black text-sm sm:text-base text-indigo-400">
              {dealScores[1].tricksWon} <span className="text-[10px] font-normal text-slate-400">tricks</span>
            </span>
          </div>
        </div>
        <span className="w-2.5 h-2.5 rounded-full bg-indigo-400"></span>
      </div>

      {/* Target indicator */}
      <div className="hidden lg:flex items-center text-[10px] font-mono text-slate-500 pl-2 border-l border-slate-800">
        Match Target: {matchTarget} pts
      </div>
    </div>
  );
};
