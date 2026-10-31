import React from 'react';
import type { Player, RelativePosition } from '../../types/game';
import { CardBack } from './CardBack';
import { Avatar } from '../common/Avatar';

interface SeatViewProps {
  player: Player | null;
  seatIndex: number;
  position: RelativePosition;
  isTurn?: boolean;
  isDealer?: boolean;
  isCaller?: boolean;
  isLocalPlayer?: boolean;
  isTeammate?: boolean;
  cardCount?: number;
  activeReaction?: string | null;
}

export const SeatView: React.FC<SeatViewProps> = ({
  player,
  seatIndex,
  position,
  isTurn = false,
  isDealer = false,
  isCaller = false,
  isLocalPlayer = false,
  isTeammate = false,
  cardCount = 0,
  activeReaction = null,
}) => {
  const getRelationText = () => {
    if (isLocalPlayer) return 'You';
    if (isTeammate) return 'Partner';
    return 'Opponent';
  };

  if (!player) {
    return (
      <div className="flex flex-col items-center justify-center p-2.5 rounded-xl border border-dashed border-neutral-800 bg-neutral-900/30 text-neutral-500 min-w-[105px] select-none">
        <span className="text-xs">Seat {seatIndex + 1}</span>
      </div>
    );
  }

  const turnClass = isTurn
    ? 'border-amber-400/90 bg-neutral-900 ring-1 ring-amber-400/40'
    : 'border-neutral-800 bg-neutral-900/70';

  return (
    <div
      className={`relative flex flex-col items-center p-2.5 rounded-xl border transition-colors select-none min-w-[110px] sm:min-w-[125px] ${turnClass}`}
    >
      {/* Floating Reaction Pill */}
      {activeReaction && (
        <div
          key={activeReaction}
          className="absolute -top-9 z-30 flex items-center justify-center pointer-events-none animate-reaction-float"
        >
          <div className="px-2.5 py-1 rounded-full bg-neutral-800 border border-neutral-700 text-lg">
            {activeReaction}
          </div>
        </div>
      )}

      {/* Top info */}
      <div className="flex items-center justify-between w-full mb-1 text-[10px] text-neutral-400">
        <div className="flex items-center gap-1">
          {player.isHost && <span className="text-amber-400 font-medium">H</span>}
          {isCaller && <span className="text-amber-300 font-medium">T</span>}
          {isDealer && <span className="text-neutral-500 font-medium">D</span>}
        </div>
        <span>{getRelationText()}</span>
      </div>

      {/* Avatar & Name */}
      <div className="flex items-center gap-2 w-full">
        <Avatar seed={player.id} teamId={player.teamId} size="sm" />
        <div className="flex flex-col min-w-0 flex-1">
          <span className="text-xs font-medium text-white truncate">
            {player.nickname}
          </span>
          <span className="text-[10px] text-neutral-400 truncate">
            {player.teamId === 0 ? 'Team 1' : 'Team 2'}
          </span>
        </div>
      </div>

      {/* Card count for other players */}
      {!isLocalPlayer && cardCount > 0 && (
        <div className="mt-2 w-full flex justify-center">
          <CardBack
            count={cardCount}
            size="sm"
            orientation={position === 'left' || position === 'right' ? 'horizontal' : 'vertical'}
          />
        </div>
      )}
    </div>
  );
};
