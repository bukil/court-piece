import React from 'react';
import type { PublicGameState, Player, TeamId } from '../../types/game';
import { Modal } from '../common/Modal';

interface GameResultsModalProps {
  isOpen: boolean;
  gameState: PublicGameState | null;
  seats: (Player | null)[];
  localPlayerId: string;
  isHost: boolean;
  onNextDeal: () => Promise<void>;
  onRematch: () => Promise<void>;
  onLeaveRoom: () => void;
}

export const GameResultsModal: React.FC<GameResultsModalProps> = ({
  isOpen,
  gameState,
  seats,
  localPlayerId,
  onNextDeal,
  onRematch,
  onLeaveRoom,
}) => {
  if (!gameState || !isOpen) return null;

  const localPlayer = seats.find((s) => s?.id === localPlayerId);
  const localTeamId = localPlayer ? localPlayer.teamId : 0;

  const isMatchComplete = gameState.status === 'match_complete';
  const winningTeamId: TeamId = (isMatchComplete
    ? gameState.matchWinnerTeamId ?? 0
    : gameState.dealWinnerTeamId ?? 0) as TeamId;

  const didWin = winningTeamId === localTeamId;
  const team0Score = gameState.teamDealScores[0];
  const team1Score = gameState.teamDealScores[1];

  return (
    <Modal isOpen={isOpen} onClose={() => {}} title="">
      <div className="flex flex-col items-center text-center py-2">
        <h3 className="text-xl font-semibold tracking-tight text-white mb-1">
          {isMatchComplete
            ? didWin ? 'Match Won' : 'Match Lost'
            : didWin ? 'Deal Won' : 'Deal Lost'}
        </h3>

        {/* Score comparison */}
        <div className="w-full flex items-center justify-around my-6 p-4 rounded-xl bg-neutral-950">
          <div className="flex flex-col items-center">
            <span className="text-xs text-neutral-400 mb-1">Team 1</span>
            <span className="text-3xl font-bold text-white tabular-nums">
              {team0Score.tricksWon}
            </span>
            <span className="text-[11px] text-neutral-500 mt-1">
              {gameState.matchScores[0]} pts
            </span>
          </div>

          <span className="text-neutral-600 text-sm">—</span>

          <div className="flex flex-col items-center">
            <span className="text-xs text-neutral-400 mb-1">Team 2</span>
            <span className="text-3xl font-bold text-white tabular-nums">
              {team1Score.tricksWon}
            </span>
            <span className="text-[11px] text-neutral-500 mt-1">
              {gameState.matchScores[1]} pts
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="w-full flex flex-col gap-2">
          {!isMatchComplete ? (
            <button
              type="button"
              onClick={onNextDeal}
              className="w-full py-3 rounded-xl bg-white text-black font-medium text-sm hover:bg-neutral-200 active:scale-[0.98] transition-transform transition-colors cursor-pointer"
            >
              Next Deal
            </button>
          ) : (
            <button
              type="button"
              onClick={onRematch}
              className="w-full py-3 rounded-xl bg-white text-black font-medium text-sm hover:bg-neutral-200 active:scale-[0.98] transition-transform transition-colors cursor-pointer"
            >
              Play Again
            </button>
          )}

          <button
            type="button"
            onClick={onLeaveRoom}
            className="w-full py-2.5 rounded-2xl text-xs text-white/40 hover:text-white/80 transition-colors cursor-pointer"
          >
            Leave
          </button>
        </div>
      </div>
    </Modal>
  );
};
