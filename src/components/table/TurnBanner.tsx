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
      className="inline-flex items-center gap-2 bg-neutral-900 border border-neutral-800 rounded-full px-3 py-1 text-xs select-none"
    >
      <span
        className={`w-1.5 h-1.5 rounded-full ${
          isLocalPlayerTurn ? 'bg-amber-400' : 'bg-neutral-600'
        }`}
      />
      <span className={isLocalPlayerTurn ? 'text-amber-300 font-medium' : 'text-neutral-400'}>
        {isLocalPlayerTurn ? 'Your Turn' : `${currentTurnPlayerName}'s Turn`}
      </span>
    </div>
  );
};
