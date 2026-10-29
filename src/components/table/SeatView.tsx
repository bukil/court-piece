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
  const getRelationBadge = () => {
    if (isLocalPlayer) {
      return (
        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-mono">
          YOU
        </span>
      );
    }
    if (isTeammate) {
      return (
        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/40 font-mono">
          PARTNER
        </span>
      );
    }
    return (
      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40 font-mono">
        OPPONENT
      </span>
    );
  };

  const getTeamName = (teamId: number) => {
    return teamId === 0 ? 'Team Alpha' : 'Team Beta';
  };

  if (!player) {
    return (
      <div className="flex flex-col items-center justify-center p-3 rounded-2xl border border-dashed border-slate-800 bg-slate-900/40 text-slate-500 min-w-[120px] select-none">
        <div className="w-9 h-9 rounded-full border border-dashed border-slate-700 flex items-center justify-center text-xs font-mono mb-1">
          {seatIndex + 1}
        </div>
        <span className="text-[11px] font-mono">Waiting...</span>
      </div>
    );
  }

  const turnRingClass = isTurn
    ? 'ring-2 ring-amber-400 ring-offset-2 ring-offset-[#0d151c] shadow-lg shadow-amber-500/20'
    : '';

  return (
    <div
      className={`relative flex flex-col items-center p-2.5 rounded-2xl bg-slate-900/90 border border-slate-800/80 backdrop-blur-md shadow-md min-w-[115px] sm:min-w-[140px] transition-all select-none ${turnRingClass}`}
    >
      {/* Floating Reaction Bubble Animation */}
      {activeReaction && (
        <div
          key={activeReaction}
          className="absolute -top-12 z-30 flex items-center justify-center pointer-events-none animate-reaction-float"
        >
          <div className="px-2.5 py-1 rounded-full bg-slate-800 border border-slate-600 shadow-xl text-2xl sm:text-3xl backdrop-blur-sm">
            {activeReaction}
          </div>
        </div>
      )}

      {/* Active turn badge */}
      {isTurn && (
        <div className="absolute -top-2.5 bg-amber-400 text-slate-950 text-[9px] font-mono font-black uppercase tracking-wider px-2 py-0.5 rounded-full shadow-sm animate-pulse">
          Turn
        </div>
      )}

      {/* Top row: Status dot & Relation */}
      <div className="flex items-center gap-1.5 w-full justify-between mb-1.5">
        <div className="flex items-center gap-1">
          {player.isHost && (
            <span title="Room Host" className="text-amber-400 text-xs">
              👑
            </span>
          )}
          {isCaller && (
            <span
              title="Trump Caller"
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
            className={`w-1.5 h-1.5 rounded-full ${
              player.isConnected ? 'bg-emerald-400' : 'bg-amber-400 animate-ping'
            }`}
            title={player.isConnected ? 'Connected' : 'Reconnecting...'}
          />
        </div>
        {getRelationBadge()}
      </div>

      {/* Avatar & Player name */}
      <div className="flex items-center gap-2 w-full">
        <Avatar seed={player.id} teamId={player.teamId} size="sm" />
        <div className="flex flex-col min-w-0 flex-1">
          <span className="text-xs font-bold text-slate-100 truncate">
            {player.nickname}
          </span>
          <span className="text-[10px] text-slate-400 font-mono truncate">
            {getTeamName(player.teamId)}
          </span>
        </div>
      </div>

      {/* Card back indicator for opponents / partner */}
      {!isLocalPlayer && cardCount > 0 && (
        <div className="mt-2 pt-1 border-t border-slate-800/80 w-full flex justify-center">
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
