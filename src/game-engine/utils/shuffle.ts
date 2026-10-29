import type { Card } from '../../types/game';

/**
 * Performs a cryptographically strong Fisher-Yates in-place shuffle.
 * Uses crypto.getRandomValues in modern browser or Node runtime.
 */
export function secureShuffle<T>(items: readonly T[]): T[] {
  const array = [...items];
  const n = array.length;
  if (n <= 1) return array;

  // Use crypto for un-biasable random selection
  const randomBuffer = new Uint32Array(n);
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(randomBuffer);
  } else {
    // Fallback for environments where crypto is unavailable
    for (let i = 0; i < n; i++) {
      randomBuffer[i] = Math.floor(Math.random() * 0xffffffff);
    }
  }

  for (let i = n - 1; i > 0; i--) {
    // Pick an integer j in [0, i] uniformly
    const j = Math.floor((randomBuffer[i] / (0xffffffff + 1)) * (i + 1));
    const temp = array[i];
    array[i] = array[j];
    array[j] = temp;
  }

  return array;
}

/**
 * Validates dealing invariants:
 * - Exactly 52 cards (for standard deck)
 * - All unique card IDs
 * - Exactly 13 cards per player
 */
export function validateDealInvariants(hands: Record<number, Card[]>, expectedPerHand = 13): boolean {
  const seenIds = new Set<string>();
  let totalCards = 0;

  for (let s = 0; s < 4; s++) {
    const hand = hands[s];
    if (!hand || hand.length !== expectedPerHand) {
      return false;
    }
    for (const card of hand) {
      if (seenIds.has(card.id)) {
        return false; // Duplicate card detected!
      }
      seenIds.add(card.id);
      totalCards++;
    }
  }

  return totalCards === expectedPerHand * 4;
}

