import React from 'react';

interface TurnBannerProps {
  currentTurnPlayerName: string;
  isLocalPlayerTurn: boolean;
  lastMoveNotice?: string;
}

export const TurnBanner: React.FC<TurnBannerProps> = ({
  currentTurnPlayerName,
  isLocalPlayerTurn,
}) => {
  return (
    <div
      aria-live="polite"
      className="inline-flex items-center gap-2 bg-neutral-900/60 border border-white/[0.08] rounded-full px-3.5 py-1 text-xs backdrop-blur-xl"
    >
      <span
        className={`w-1.5 h-1.5 rounded-full ${
          isLocalPlayerTurn ? 'bg-amber-400 animate-pulse' : 'bg-white/30'
        }`}
      />
      <span className={isLocalPlayerTurn ? 'text-amber-300 font-medium' : 'text-white/60'}>
        {isLocalPlayerTurn ? 'Your Turn' : `${currentTurnPlayerName}'s Turn`}
      </span>
    </div>
  );
};
