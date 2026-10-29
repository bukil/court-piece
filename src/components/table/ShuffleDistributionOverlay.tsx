import React, { useEffect, useState } from 'react';
import { soundService } from '../../services/soundService';

interface ShuffleDistributionOverlayProps {
  dealNumber: number;
  onAnimationComplete: () => void;
}

export const ShuffleDistributionOverlay: React.FC<ShuffleDistributionOverlayProps> = ({
  dealNumber,
  onAnimationComplete,
}) => {
  const [phase, setPhase] = useState<'shuffling' | 'dealing' | 'done'>('shuffling');

  useEffect(() => {
    soundService.playShuffle();

    const dealTimer = setTimeout(() => {
      setPhase('dealing');
      soundService.playCardDeal();
    }, 600);

    const finishTimer = setTimeout(() => {
      setPhase('done');
      onAnimationComplete();
    }, 1300);

    return () => {
      clearTimeout(dealTimer);
      clearTimeout(finishTimer);
    };
  }, [dealNumber]);

  if (phase === 'done') return null;

  return (
    <div
      onClick={onAnimationComplete}
      className="absolute inset-0 z-40 flex items-center justify-center pointer-events-auto cursor-pointer animate-fade-in"
    >
      <div className="flex flex-col items-center">
        {phase === 'shuffling' ? (
          <div className="relative w-20 h-28 flex items-center justify-center">
            {/* Shuffling Deck Riffle Animation */}
            <div className="absolute w-16 h-24 rounded-xl bg-slate-100 border border-slate-300 shadow-2xl animate-shuffle-1 flex items-center justify-center text-slate-800 font-bold text-xs">
              ♠
            </div>
            <div className="absolute w-16 h-24 rounded-xl bg-slate-100 border border-slate-300 shadow-2xl animate-shuffle-2 flex items-center justify-center text-rose-600 font-bold text-xs">
              ♥
            </div>
            <div className="absolute w-16 h-24 rounded-xl bg-blue-700 border-2 border-white/20 shadow-xl flex items-center justify-center text-white/50 text-xs">
              CODE
            </div>
          </div>
        ) : (
          <div className="relative w-36 h-36 flex items-center justify-center">
            {/* Cards Flying Outwards to 4 Seats */}
            <div className="absolute w-12 h-18 rounded-lg bg-blue-700 border border-white/30 shadow-xl transition-all duration-500 transform -translate-y-16 opacity-80" />
            <div className="absolute w-12 h-18 rounded-lg bg-blue-700 border border-white/30 shadow-xl transition-all duration-500 transform translate-y-16 opacity-80" />
            <div className="absolute w-12 h-18 rounded-lg bg-blue-700 border border-white/30 shadow-xl transition-all duration-500 transform -translate-x-16 opacity-80" />
            <div className="absolute w-12 h-18 rounded-lg bg-blue-700 border border-white/30 shadow-xl transition-all duration-500 transform translate-x-16 opacity-80" />
          </div>
        )}

        <div className="mt-3 px-3 py-1 rounded-full bg-neutral-900/80 border border-white/10 text-[11px] text-white/70 font-medium backdrop-blur-xl">
          {phase === 'shuffling' ? 'Shuffling...' : 'Dealing...'}
        </div>
      </div>
    </div>
  );
};
