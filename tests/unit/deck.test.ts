import { describe, it, expect } from 'vitest';
import { createStandardDeck, sortHand, SUITS, RANKS } from '../../src/game-engine/utils/deck';
import { secureShuffle, validateDealInvariants } from '../../src/game-engine/utils/shuffle';

describe('Deck and Shuffle utilities', () => {
  it('creates a standard 52-card deck with correct suits and ranks', () => {
    const deck = createStandardDeck();
    expect(deck).toHaveLength(52);

    const suitCounts: Record<string, number> = {};
    const rankCounts: Record<string, number> = {};

    for (const card of deck) {
      suitCounts[card.suit] = (suitCounts[card.suit] || 0) + 1;
      rankCounts[card.rank] = (rankCounts[card.rank] || 0) + 1;
    }

    for (const suit of SUITS) {
      expect(suitCounts[suit]).toBe(13);
    }
    for (const rank of RANKS) {
      expect(rankCounts[rank]).toBe(4);
    }
  });

  it('secureShuffle produces a permutation containing all 52 unique cards', () => {
    const original = createStandardDeck();
    const shuffled = secureShuffle(original);

    expect(shuffled).toHaveLength(52);
    const originalIds = new Set(original.map((c) => c.id));
    const shuffledIds = new Set(shuffled.map((c) => c.id));

    expect(shuffledIds.size).toBe(52);
    expect([...shuffledIds].sort()).toEqual([...originalIds].sort());
  });

  it('validateDealInvariants passes for fair 4-hand deal of 13 cards', () => {
    const deck = secureShuffle(createStandardDeck());
    const hands = {
      0: deck.slice(0, 13),
      1: deck.slice(13, 26),
      2: deck.slice(26, 39),
      3: deck.slice(39, 52),
    };

    expect(validateDealInvariants(hands, 13)).toBe(true);
  });

  it('validateDealInvariants catches duplicate card or wrong hand size', () => {
    const deck = secureShuffle(createStandardDeck());
    const badHands = {
      0: deck.slice(0, 13),
      1: deck.slice(13, 26),
      2: deck.slice(26, 39),
      3: [...deck.slice(39, 51), deck[0]], // Duplicate card from hand 0!
    };

    expect(validateDealInvariants(badHands, 13)).toBe(false);
  });

  it('sorts hands by suit and rank cleanly', () => {
    const cards = [
      { id: 'H-A', suit: 'hearts' as const, rank: 'A' as const, value: 14 },
      { id: 'S-2', suit: 'spades' as const, rank: '2' as const, value: 2 },
      { id: 'H-10', suit: 'hearts' as const, rank: '10' as const, value: 10 },
      { id: 'S-K', suit: 'spades' as const, rank: 'K' as const, value: 13 },
    ];
    const sorted = sortHand(cards);
    expect(sorted.map((c) => c.id)).toEqual(['S-2', 'S-K', 'H-10', 'H-A']);
  });
});

