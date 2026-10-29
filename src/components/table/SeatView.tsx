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
      <div className="flex flex-col items-center justify-center p-3 rounded-2xl border border-dashed border-white/10 bg-white/[0.02] text-white/30 min-w-[110px] select-none">
        <span className="text-[11px]">Seat {seatIndex + 1}</span>
      </div>
    );
  }

  const turnClass = isTurn
    ? 'ring-1 ring-amber-400/80 shadow-lg shadow-amber-500/10 bg-white/[0.08]'
    : 'bg-white/[0.03] border-white/[0.08]';

  return (
    <div
      className={`relative flex flex-col items-center p-2.5 rounded-2xl border backdrop-blur-xl transition-all select-none min-w-[110px] sm:min-w-[130px] ${turnClass}`}
    >
      {/* Floating Reaction */}
      {activeReaction && (
        <div
          key={activeReaction}
          className="absolute -top-10 z-30 flex items-center justify-center pointer-events-none animate-reaction-float"
        >
          <div className="px-2.5 py-1 rounded-full bg-neutral-900 border border-white/20 shadow-xl text-2xl backdrop-blur-md">
            {activeReaction}
          </div>
        </div>
      )}

      {/* Top info */}
      <div className="flex items-center justify-between w-full mb-1 text-[10px] text-white/40">
        <div className="flex items-center gap-1">
          {player.isHost && <span className="text-amber-400">★</span>}
          {isCaller && <span className="text-amber-300 font-medium">T</span>}
          {isDealer && <span className="text-white/40 font-medium">D</span>}
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
          <span className="text-[10px] text-white/40 truncate">
            {player.teamId === 0 ? 'Team 1' : 'Team 2'}
          </span>
        </div>
      </div>

      {/* Card count for other players */}
      {!isLocalPlayer && cardCount > 0 && (
        <div className="mt-2 pt-1 border-t border-white/[0.06] w-full flex justify-center">
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
