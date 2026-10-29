import React from 'react';
import type { Player, RelativePosition } from '../../types/game';
import { CardBack } from './CardBack';

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
}) => {
  const getRelationBadge = () => {
    if (isLocalPlayer) {
      return (
        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
          YOU
        </span>
      );
    }
    if (isTeammate) {
      return (
        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/40">
          PARTNER
        </span>
      );
    }
    return (
      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40">
        OPPONENT
      </span>
    );
  };

  const getTeamName = (teamId: number) => {
    return teamId === 0 ? 'Team Alpha' : 'Team Beta';
  };

  if (!player) {
    return (
      <div className="flex flex-col items-center justify-center p-3 rounded-xl border border-dashed border-slate-700/60 bg-slate-900/40 text-slate-500 min-w-[120px]">
        <div className="w-8 h-8 rounded-full border border-dashed border-slate-600 flex items-center justify-center text-xs mb-1">
          {seatIndex + 1}
        </div>
        <span className="text-xs">Waiting...</span>
      </div>
    );
  }

  const turnRingClass = isTurn
    ? 'ring-2 ring-amber-400 ring-offset-2 ring-offset-slate-950 shadow-lg shadow-amber-500/20 animate-pulse'
    : '';

  return (
    <div
      className={`relative flex flex-col items-center p-2 sm:p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 backdrop-blur-md shadow-md min-w-[110px] sm:min-w-[135px] transition-all ${turnRingClass}`}
    >
      {/* Active turn badge */}
      {isTurn && (
        <div className="absolute -top-2.5 bg-amber-500 text-slate-950 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full shadow-sm">
          Active Turn
        </div>
      )}

      {/* Header: Host Crown & Relation */}
      <div className="flex items-center gap-1.5 w-full justify-between mb-1">
        <div className="flex items-center gap-1">
          {player.isHost && (
            <span title="Room Host" className="text-amber-400 text-xs font-bold">
              👑
            </span>
          )}
          {isCaller && (
            <span
              title="Trump Caller (Sayed)"
              className="px-1 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[9px] font-mono font-bold"
            >
              CALLER
            </span>
          )}
          {isDealer && (
            <span
              title="Dealer"
              className="px-1 rounded bg-slate-800 text-slate-300 border border-slate-700 text-[9px] font-mono font-bold"
            >
              DEALER
            </span>
          )}
          <span
            className={`w-2 h-2 rounded-full ${
              player.isConnected ? 'bg-emerald-400' : 'bg-amber-400 animate-ping'
            }`}
            title={player.isConnected ? 'Connected' : 'Reconnecting...'}
          />
        </div>
        {getRelationBadge()}
      </div>

      {/* Player name */}
      <div className="text-xs sm:text-sm font-bold text-slate-100 truncate max-w-[110px] sm:max-w-[130px]">
        {player.nickname}
      </div>

      {/* Team & Seat index */}
      <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5 font-mono">
        <span>{getTeamName(player.teamId)}</span>
        <span>•</span>
        <span>Seat {player.seatIndex + 1}</span>
      </div>

      {/* Card back indicator for opponents / partner */}
      {!isLocalPlayer && cardCount > 0 && (
        <div className="mt-2">
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
