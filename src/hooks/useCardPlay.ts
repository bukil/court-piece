import { useCallback, useEffect, useRef, useState } from 'react';
import type { Card, PlayedCard, RoomDocument } from '../types/game';
import { turnKey, isTurnExpired } from '../game-engine/turnClock';
import { courtPieceEngine } from '../game-engine/court-piece/CourtPieceEngine';
import { roomService } from '../services/roomService';
import { soundService } from '../services/soundService';
export interface CardPlayOrigin { x: number; y: number; width: number; }
export interface PendingCardPlay {
  roomId: string; deal: number; stateVersion: number; turn: string; handCount: number;
  play: PlayedCard; origin?: CardPlayOrigin; settled: boolean;
}
export function pendingCardView(room: RoomDocument, hand: Card[], pending: PendingCardPlay | null) {
  const state = room.gameState;
  if (!pending || !state || pending.roomId !== room.id || pending.deal !== state.currentDeal) return { hand, trick: state?.currentTrick, finished: !!pending };
  const progressed = state.version > pending.stateVersion;
  const optimistic = !progressed && turnKey(state) === pending.turn;
  const trick = optimistic ? { ...state.currentTrick, leadSuit: state.currentTrick.leadSuit ?? pending.play.card.suit, cards: [...state.currentTrick.cards, pending.play] } : state.currentTrick;
  return {
    hand: progressed && hand.length < pending.handCount ? hand : hand.filter(card => card.id !== pending.play.card.id),
    trick,
    // Public state and private hand arrive independently. Keep the submit lock until both agree.
    finished: pending.settled && progressed && hand.length < pending.handCount,
  };
}
export function useCardPlay(room: RoomDocument, hand: Card[], playerId: string, onError: (message: string) => void) {
  const [pending, setPending] = useState<PendingCardPlay | null>(null);
  const submission = useRef<PendingCardPlay | null>(null);
  const view = pendingCardView(room,hand,pending);
  useEffect(() => () => { submission.current = null; }, [room.id, playerId]);
  useEffect(() => {
    if (pending && view.finished) { submission.current = null; setPending(null); }
  }, [pending, view.finished]);
  const play = useCallback((card: Card, origin?: CardPlayOrigin) => {
    const state = room.gameState;
    const player = room.seats.find(seat => seat?.id === playerId);
    if (submission.current || !state || !player) return;
    const valid = courtPieceEngine.validateMove(state, hand, player.seatIndex, card);
    if (!valid.isValid || isTurnExpired(state)) { onError(valid.reason ?? 'Your turn has ended.'); return; }
    const next: PendingCardPlay = { roomId: room.id, deal: state.currentDeal, stateVersion: state.version, turn: turnKey(state), handCount: hand.length, play: { card, playerId, seatIndex: player.seatIndex, playedAt: Date.now() }, origin, settled: false };
    submission.current = next; setPending(next); soundService.playCardPlay();
    void roomService.playCard(room.id, playerId, card).then(() => {
      if (submission.current !== next) return;
      const confirmed = { ...next, settled: true }; submission.current = confirmed; setPending(confirmed);
    }).catch(error => {
      if (submission.current !== next) return;
      submission.current = null; setPending(null); onError(error instanceof Error ? error.message : 'Couldn’t play. Try again.');
    });
  }, [room,hand,playerId,onError]);
  return { play, hand: view.hand, trick: view.trick, pending, isPending: !!pending && !view.finished };
}
