import type { Card, PublicGameState } from '../types/game';
export const TURN_SECONDS = 20;
export const WARNING_SECONDS = 7;
export const PRESENCE_STALE_MS = 25_000;
export function timestampMillis(value: PublicGameState['turnStartedAt'] | null | undefined): number | null {
  if (typeof value === 'number') return value;
  if (value && typeof value.toMillis === 'function') return value.toMillis();
  return null;
}
export function turnKey(state: PublicGameState): string {
  return `${state.currentDeal}:${state.completedTricks.length}:${state.currentTrick.cards.map(play => play.card.id).join(',')}:${state.currentTurnSeatIndex}`;
}
export function turnDeadline(state: PublicGameState): number | null {
  const started = timestampMillis(state.turnStartedAt);
  return state.status === 'playing' && started !== null ? started + TURN_SECONDS * 1000 : null;
}
export function remainingSeconds(deadline: number | null, now = Date.now()): number {
  return deadline === null ? TURN_SECONDS : Math.max(0, Math.min(TURN_SECONDS, Math.ceil((deadline - now) / 1000)));
}
export function isTurnExpired(state: PublicGameState, now = Date.now()): boolean {
  const deadline = turnDeadline(state);
  return deadline !== null && now >= deadline;
}
export function lowestLegalCard(state: PublicGameState, hand: Card[]): Card | undefined {
  const lead = state.currentTrick.cards.length ? state.currentTrick.leadSuit : undefined;
  const following = lead ? hand.filter(card => card.suit === lead) : [];
  return [...(following.length ? following : hand)].sort((a,b) => a.value - b.value || a.id.localeCompare(b.id))[0];
}
