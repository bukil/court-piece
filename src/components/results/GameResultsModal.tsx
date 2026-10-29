import React from 'react';
import type { PublicGameState, Player, TeamId } from '../../types/game';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';

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
  isHost,
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

  const team0Players = [seats[0]?.nickname, seats[2]?.nickname].filter(Boolean).join(' & ');
  const team1Players = [seats[1]?.nickname, seats[3]?.nickname].filter(Boolean).join(' & ');

  const title = isMatchComplete ? 'Match Complete — Championship!' : `Deal ${gameState.currentDeal} Complete`;

  return (
    <Modal isOpen={isOpen} onClose={() => {}} title={title}>
      <div className="flex flex-col items-center text-center py-2">
        <div className="text-4xl sm:text-5xl mb-2">
          {isMatchComplete ? '👑' : didWin ? '🏆' : '👏'}
        </div>

        <h3 className="text-2xl font-black font-mono text-white tracking-wide mb-1">
          {isMatchComplete
            ? didWin
              ? 'MATCH CHAMPIONS!'
              : 'MATCH OVER'
            : didWin
            ? 'DEAL WON!'
            : 'DEAL LOST'}
        </h3>

        <p className="text-xs text-slate-400 mb-6">
          {isMatchComplete
            ? `${winningTeamId === 0 ? 'Team Alpha' : 'Team Beta'} reached ${gameState.matchTarget} match points and wins the match!`
            : `${winningTeamId === 0 ? 'Team Alpha' : 'Team Beta'} took 7 tricks first and scores 1 match point.`}
        </p>

        {/* Score comparison card */}
        <div className="w-full grid grid-cols-2 gap-3 mb-6">
          {/* Team Alpha */}
          <div
            className={`p-4 rounded-xl border flex flex-col items-center ${
              winningTeamId === 0
                ? 'bg-emerald-950/60 border-emerald-500/60 shadow-lg shadow-emerald-500/10'
                : 'bg-slate-950/60 border-slate-800'
            }`}
          >
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-400">
              Team Alpha
            </span>
            <span className="text-xs text-slate-400 truncate max-w-[120px] mb-2 font-mono">
              {team0Players}
            </span>
            <span className="text-3xl font-black font-mono text-white">
              {team0Score.tricksWon} <span className="text-xs font-normal text-slate-400">tricks</span>
            </span>
            <span className="text-xs font-mono font-bold text-emerald-300 mt-1">
              Match: {gameState.matchScores[0]} / {gameState.matchTarget} pts
            </span>
          </div>

          {/* Team Beta */}
          <div
            className={`p-4 rounded-xl border flex flex-col items-center ${
              winningTeamId === 1
                ? 'bg-indigo-950/60 border-indigo-500/60 shadow-lg shadow-indigo-500/10'
                : 'bg-slate-950/60 border-slate-800'
            }`}
          >
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-indigo-400">
              Team Beta
            </span>
            <span className="text-xs text-slate-400 truncate max-w-[120px] mb-2 font-mono">
              {team1Players}
            </span>
            <span className="text-3xl font-black font-mono text-white">
              {team1Score.tricksWon} <span className="text-xs font-normal text-slate-400">tricks</span>
            </span>
            <span className="text-xs font-mono font-bold text-indigo-300 mt-1">
              Match: {gameState.matchScores[1]} / {gameState.matchTarget} pts
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="w-full flex flex-col sm:flex-row gap-3 justify-center">
          {!isMatchComplete && (
            <Button variant="accent" size="md" onClick={onNextDeal}>
              🃏 Start Deal #{gameState.currentDeal + 1}
            </Button>
          )}

          {isMatchComplete && isHost && (
            <Button variant="accent" size="md" onClick={onRematch}>
              🔄 Play Again (New Match)
            </Button>
          )}

          <Button variant="secondary" size="md" onClick={onLeaveRoom}>
            Exit to Lobby
          </Button>
        </div>
      </div>
    </Modal>
  );
};
