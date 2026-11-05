import type { Card, Player, RoomDocument, SeatIndex } from '../../types/game';
import { courtPieceEngine } from './CourtPieceEngine';
import { isTurnExpired, lowestLegalCard } from '../turnClock';

/** Shared manual/timeout transition. Callers persist room and private hand atomically. */
export function applyCard(room: RoomDocument, player: Player, requestedCard: Card, hand: Card[], now = Date.now()): Card[] {
  const state = room.gameState;
  if (!state || state.status !== 'playing') throw new Error('Game is not currently active.');
  const timedOut = isTurnExpired(state, now);
  const chosen = timedOut ? lowestLegalCard(state, hand) : hand.find(card => card.id === requestedCard.id);
  const validation = courtPieceEngine.validateMove(state, hand, player.seatIndex, chosen ?? requestedCard);
  if (!validation.isValid || !chosen) throw new Error(validation.reason ?? 'Card is not in your hand.');
  const nextHand = hand.filter(card => card.id !== chosen.id);
  state.remainingCardCounts[player.seatIndex] = nextHand.length;
  state.currentTrick.leadSuit ??= chosen.suit;
  state.currentTrick.cards.push({ playerId: player.id, seatIndex: player.seatIndex, card: chosen, playedAt: now });
  if (state.currentTrick.cards.length === 4) {
    const result = courtPieceEngine.resolveTrick(state);
    state.teamDealScores[result.winnerTeamId].tricksWon++;
    state.completedTricks.push(result.completedTrick);
    if (result.isDealComplete && result.dealWinnerTeamId !== undefined) {
      state.matchScores[result.dealWinnerTeamId]++;
      state.dealWinnerTeamId = result.dealWinnerTeamId;
      room.status = state.status = result.isMatchComplete ? 'match_complete' : 'deal_complete';
      if (result.isMatchComplete) state.matchWinnerTeamId = result.matchWinnerTeamId;
      state.lastMoveNotice = `Team ${result.dealWinnerTeamId + 1} won the ${result.isMatchComplete ? 'match' : 'deal'}.`;
    } else {
      state.currentTrick = { cards: [] };
      state.currentTurnSeatIndex = result.nextLeadSeatIndex;
      state.lastMoveNotice = `${room.seats[result.winnerSeatIndex]?.nickname ?? 'Player'} won the trick and leads next.`;
    }
  } else {
    state.currentTurnSeatIndex = ((player.seatIndex + 1) % 4) as SeatIndex;
    state.lastMoveNotice = timedOut ? `${player.nickname}'s time ran out. Lowest legal card played.` : `${player.nickname} played ${chosen.rank} of ${chosen.suit}.`;
  }
  state.turnStartedAt = now;
  state.version++;
  return nextHand;
}
