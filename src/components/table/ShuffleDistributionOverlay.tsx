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
    }, 500);

    const finishTimer = setTimeout(() => {
      setPhase('done');
      onAnimationComplete();
    }, 1100);

    return () => {
      clearTimeout(dealTimer);
      clearTimeout(finishTimer);
    };
  }, [dealNumber]);

  if (phase === 'done') return null;

  return (
    <div
      onClick={onAnimationComplete}
      className="absolute inset-0 z-40 flex items-center justify-center pointer-events-auto cursor-pointer animate-fade-in select-none"
    >
      <div className="flex flex-col items-center">
        {phase === 'shuffling' ? (
          <div className="relative w-16 h-24 flex items-center justify-center">
            {/* Split deck animation */}
            <div className="absolute w-12 h-18 rounded-lg bg-[#18202f] border border-neutral-600 transform -translate-x-3 -rotate-6 transition-transform" />
            <div className="absolute w-12 h-18 rounded-lg bg-[#18202f] border border-neutral-600 transform translate-x-3 rotate-6 transition-transform" />
            <div className="absolute w-12 h-18 rounded-lg bg-[#18202f] border border-neutral-500" />
          </div>
        ) : (
          <div className="relative w-28 h-28 flex items-center justify-center">
            {/* 4 Cards sliding to the 4 seats */}
            <div className="absolute w-10 h-14 rounded-md bg-[#18202f] border border-neutral-600 transform -translate-y-12 opacity-80 transition-transform duration-300" />
            <div className="absolute w-10 h-14 rounded-md bg-[#18202f] border border-neutral-600 transform translate-y-12 opacity-80 transition-transform duration-300" />
            <div className="absolute w-10 h-14 rounded-md bg-[#18202f] border border-neutral-600 transform -translate-x-12 opacity-80 transition-transform duration-300" />
            <div className="absolute w-10 h-14 rounded-md bg-[#18202f] border border-neutral-600 transform translate-x-12 opacity-80 transition-transform duration-300" />
          </div>
        )}

        <div className="mt-3 px-3 py-1 rounded-full bg-neutral-900 border border-neutral-800 text-xs text-neutral-300">
          {phase === 'shuffling' ? 'Shuffling deck' : 'Dealing cards'}
        </div>
      </div>
    </div>
  );
};
