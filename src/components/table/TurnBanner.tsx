import React from 'react';
interface TurnBannerProps { currentTurnPlayerName: string; isLocalPlayerTurn: boolean; lastMoveNotice?: string; }
export const TurnBanner: React.FC<TurnBannerProps> = ({ currentTurnPlayerName, isLocalPlayerTurn, lastMoveNotice }) => (
  <div className={`turn-banner${isLocalPlayerTurn ? ' your-turn' : ''}`} aria-live="polite">
    <span className="status-dot" /><strong>{isLocalPlayerTurn ? 'Your turn to play' : `${currentTurnPlayerName} is playing`}</strong>
    {lastMoveNotice && <span className="last-move">{lastMoveNotice}</span>}
  </div>
);
