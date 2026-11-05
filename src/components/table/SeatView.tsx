import React from 'react';
import type { Player, RelativePosition, ReactionEvent } from '../../types/game';
import { Avatar } from '../common/Avatar';
import { GifReaction } from '../common/GifReaction';
import { AnimatedEmoji } from '../common/AnimatedEmoji';
interface SeatViewProps {
  player: Player | null; seatIndex: number; position: RelativePosition;
  isTurn?: boolean; isOnline?: boolean; seconds?: number; warning?: boolean;
  isDealer?: boolean; isCaller?: boolean; isLocalPlayer?: boolean; isTeammate?: boolean;
  cardCount?: number; activeReaction?: ReactionEvent | null;
}
const CIRCUMFERENCE = 182.21;
export const SeatView: React.FC<SeatViewProps> = ({ player, seatIndex, position, isTurn, isOnline = false, seconds = 20, warning, isLocalPlayer, activeReaction }) => {
  if (!player) return <div className="player-seat empty-seat" aria-label={`Empty seat ${seatIndex + 1}`} />;
  const description = `${player.nickname}${isLocalPlayer ? ' (you)' : ''}, ${isOnline ? 'online' : 'offline'}${isTurn ? `, their turn, ${seconds} seconds remaining` : ''}`;
  return <div className={`player-seat seat-${position}${isTurn ? ' seat-active' : ''}${warning && isTurn ? ' seat-warning' : ''}${!isOnline ? ' seat-offline' : ''}`} role="group" aria-label={description} tabIndex={0}>
    {activeReaction && <div key={activeReaction.id} className={`seat-reaction${activeReaction.gif ? ' seat-gif-reaction' : ''}`} role="status"><>{activeReaction.gif ? <GifReaction reaction={activeReaction.gif} /> : <AnimatedEmoji emoji={activeReaction.emoji} label={`${player.nickname} reacts`} />}</></div>}
    <div className="seat-avatar">
      <Avatar seed={player.id} avatarId={player.avatarId} teamId={player.teamId} size="lg" animate={!!isTurn} />
      {isTurn && <><svg className="seat-clock-ring" viewBox="0 0 64 64" aria-hidden="true"><circle className="clock-track" cx="32" cy="32" r="29" /><circle className="clock-progress" cx="32" cy="32" r="29" strokeDasharray={CIRCUMFERENCE} strokeDashoffset={CIRCUMFERENCE * (1 - seconds / 20)} /></svg><span className="seat-turn-marker" aria-hidden="true">▼</span><span className="seat-seconds" aria-hidden="true">{seconds}</span></>}
      <span className={`connection-dot ${isOnline ? 'connection-online' : 'connection-offline'}`} title={isOnline ? 'Online' : 'Offline'} aria-hidden="true">{isOnline ? '' : '×'}</span>
    </div>
    <span className="seat-tooltip">{player.nickname} · {isOnline ? 'Online' : 'Offline'}</span>
  </div>;
};
