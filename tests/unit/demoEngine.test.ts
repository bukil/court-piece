import { describe, it, expect } from 'vitest';
import { DemoTrickTakingEngine } from '../../src/game-engine/demo/DemoTrickTakingEngine';
import type { PublicGameState, Card, Trick } from '../../src/types/game';

describe('DemoTrickTakingEngine', () => {
  const engine = new DemoTrickTakingEngine();

  it('correctly declares itself as demo engine and not official rules', () => {
    expect(engine.isOfficialRules).toBe(false);
    expect(engine.id).toBe('demo-trick-taking-v1');
  });

  it('deals 13 cards to all four seats with no duplicates', () => {
    const deck = engine.createDeck();
    const deal = engine.dealCards(deck);

    expect(Object.keys(deal.hands)).toHaveLength(4);
    const allCards = [
      ...deal.hands[0],
      ...deal.hands[1],
      ...deal.hands[2],
      ...deal.hands[3],
    ];
    expect(allCards).toHaveLength(52);
    const uniqueIds = new Set(allCards.map((c) => c.id));
    expect(uniqueIds.size).toBe(52);
  });

  it('validates lead move allows any card held in hand', () => {
    const gameState: PublicGameState = {
      currentDeal: 1,
      dealerSeatIndex: 0,
      trumpCallerSeatIndex: 1,
      trumpSuit: null,
      currentTurnSeatIndex: 1,
      currentTrick: { cards: [] },
      completedTricks: [],
      teamDealScores: [{ tricksWon: 0 }, { tricksWon: 0 }],
      matchScores: [0, 0],
      matchTarget: 7,
      remainingCardCounts: [13, 13, 13, 13],
      status: 'playing',
      version: 1,
    };

    const hand: Card[] = [
      { id: 'S-10', suit: 'spades', rank: '10', value: 10 },
      { id: 'H-A', suit: 'hearts', rank: 'A', value: 14 },
    ];

    // Card in hand
    const result1 = engine.validateMove(gameState, hand, 1, hand[0]);
    expect(result1.isValid).toBe(true);

    // Card not in hand
    const fakeCard: Card = { id: 'D-K', suit: 'diamonds', rank: 'K', value: 13 };
    const result2 = engine.validateMove(gameState, hand, 1, fakeCard);
    expect(result2.isValid).toBe(false);
    expect(result2.reason).toContain('not hold this card');

    // Not player's turn
    const result3 = engine.validateMove(gameState, hand, 0, hand[0]);
    expect(result3.isValid).toBe(false);
    expect(result3.reason).toContain('not your turn');
  });

  it('enforces following lead suit when player holds cards in that suit', () => {
    const gameState: PublicGameState = {
      currentDeal: 1,
      dealerSeatIndex: 0,
      trumpCallerSeatIndex: 1,
      trumpSuit: null,
      currentTurnSeatIndex: 2,
      currentTrick: {
        leadSuit: 'hearts',
        cards: [
          {
            playerId: 'p1',
            seatIndex: 1,
            card: { id: 'H-5', suit: 'hearts', rank: '5', value: 5 },
            playedAt: 100,
          },
        ],
      },
      completedTricks: [],
      teamDealScores: [{ tricksWon: 0 }, { tricksWon: 0 }],
      matchScores: [0, 0],
      matchTarget: 7,
      remainingCardCounts: [13, 12, 13, 13],
      status: 'playing',
      version: 2,
    };

    const handWithHearts: Card[] = [
      { id: 'H-K', suit: 'hearts', rank: 'K', value: 13 },
      { id: 'S-A', suit: 'spades', rank: 'A', value: 14 },
    ];

    // Trying to play spades when holding hearts should be rejected
    const illegalMove = engine.validateMove(gameState, handWithHearts, 2, handWithHearts[1]);
    expect(illegalMove.isValid).toBe(false);
    expect(illegalMove.reason).toContain('Must follow lead suit: hearts');

    // Playing hearts should succeed
    const legalMove = engine.validateMove(gameState, handWithHearts, 2, handWithHearts[0]);
    expect(legalMove.isValid).toBe(true);

    // If player is void in hearts, they can play spades
    const handVoidInHearts: Card[] = [
      { id: 'S-A', suit: 'spades', rank: 'A', value: 14 },
      { id: 'C-2', suit: 'clubs', rank: '2', value: 2 },
    ];
    const offSuitMove = engine.validateMove(gameState, handVoidInHearts, 2, handVoidInHearts[0]);
    expect(offSuitMove.isValid).toBe(true);
  });

  it('resolves trick correctly: highest card of lead suit wins trick', () => {
    const trick: Trick = {
      leadSuit: 'clubs',
      cards: [
        {
          playerId: 'p0',
          seatIndex: 0,
          card: { id: 'C-7', suit: 'clubs', rank: '7', value: 7 },
          playedAt: 1,
        },
        {
          playerId: 'p1',
          seatIndex: 1,
          card: { id: 'C-A', suit: 'clubs', rank: 'A', value: 14 },
          playedAt: 2,
        },
        {
          playerId: 'p2',
          seatIndex: 2,
          card: { id: 'C-K', suit: 'clubs', rank: 'K', value: 13 },
          playedAt: 3,
        },
        {
          playerId: 'p3',
          seatIndex: 3,
          card: { id: 'H-A', suit: 'hearts', rank: 'A', value: 14 },
          playedAt: 4,
        },
      ],
    };

    const resolution = engine.resolveTrick(trick);
    expect(resolution.winnerSeatIndex).toBe(1);
    expect(resolution.winnerPlayerId).toBe('p1');
    expect(resolution.winnerTeamId).toBe(1);
    expect(resolution.pointsEarned).toBe(1);
    expect(resolution.nextLeadSeatIndex).toBe(1);
  });
});
