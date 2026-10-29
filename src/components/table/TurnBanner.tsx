import React from 'react';

interface TurnBannerProps {
  currentTurnPlayerName: string;
  isLocalPlayerTurn: boolean;
  lastMoveNotice?: string;
}

export const TurnBanner: React.FC<TurnBannerProps> = ({
  currentTurnPlayerName,
  isLocalPlayerTurn,
  lastMoveNotice,
}) => {
  return (
    <div
      aria-live="polite"
      className="flex flex-col sm:flex-row items-center gap-2 justify-between bg-slate-900/60 border border-slate-800/80 rounded-lg px-3 py-1.5 text-xs backdrop-blur-sm max-w-xl w-full mx-auto"
    >
      {/* Current Turn indicator */}
      <div className="flex items-center gap-2">
        <span
          className={`w-2 h-2 rounded-full ${
            isLocalPlayerTurn ? 'bg-amber-400 animate-ping' : 'bg-slate-500'
          }`}
        />
        <span className="text-slate-300">
          Turn:{' '}
          <strong className={isLocalPlayerTurn ? 'text-amber-300 font-black' : 'text-slate-100'}>
            {isLocalPlayerTurn ? 'Your Turn' : currentTurnPlayerName}
          </strong>
        </span>
      </div>

      {/* Recent event notice */}
      {lastMoveNotice && (
        <div className="text-slate-400 text-[11px] truncate max-w-xs sm:max-w-md font-mono">
          {lastMoveNotice}
        </div>
      )}
    </div>
  );
};

