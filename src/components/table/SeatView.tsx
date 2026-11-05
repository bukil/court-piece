import React from 'react';
import type { Player, RelativePosition } from '../../types/game';
import { Avatar } from '../common/Avatar';
interface SeatViewProps {
  player: Player | null; seatIndex: number; position: RelativePosition;
  isTurn?: boolean; isDealer?: boolean; isCaller?: boolean; isLocalPlayer?: boolean;
  isTeammate?: boolean; cardCount?: number; activeReaction?: string | null; reactionId?: string;
}
export const SeatView: React.FC<SeatViewProps> = ({ player, seatIndex, position, isTurn, isDealer, isCaller, isLocalPlayer, isTeammate, cardCount = 0, activeReaction, reactionId }) => {
  if (!player) return <div className="player-seat empty-seat">Seat {seatIndex + 1}</div>;
  return <div className={`player-seat seat-${position}${isTurn ? ' seat-active' : ''}${activeReaction ? ' seat-reacting' : ''}`} aria-label={`${player.nickname}, ${isTeammate ? 'partner' : 'opponent'}${isTurn ? ', playing now' : ''}`}>
    {activeReaction && <div key={`reaction-${reactionId ?? activeReaction}`} className="seat-reaction" role="status">{activeReaction}</div>}
    <div key={`avatar-${reactionId ?? 'idle'}`} className="seat-avatar"><Avatar seed={player.id} teamId={player.teamId} size="lg" />{isTurn && <span className="turn-dot" />}</div>
    <strong className="seat-name">{player.nickname}</strong>
    <span className="seat-relation">{isLocalPlayer ? 'You' : isTeammate ? 'Your partner' : 'Opponent'}</span>
    <span className="seat-detail">{isTurn ? 'Playing…' : `${cardCount} cards`}{isCaller ? ' · Caller' : isDealer ? ' · Dealer' : ''}</span>
    <div className="seat-mini-hand" aria-hidden="true">{Array.from({ length: Math.min(cardCount, 5) }, (_, i) => <i key={i} style={{ rotate: `${(i - 2) * 9}deg`, translate: `0 ${Math.abs(i - 2) * 2}px` }} />)}</div>
  </div>;
};
