import { describe, it, expect } from 'vitest';
import { CourtPieceEngine } from '../../src/game-engine/court-piece/CourtPieceEngine';
import type { PublicGameState, Card, Trick } from '../../src/types/game';

describe('CourtPieceEngine (Single Sir)', () => {
  const engine = new CourtPieceEngine();

  it('correctly declares itself as official Court Piece rules', () => {
    expect(engine.isOfficialRules).toBe(true);
    expect(engine.id).toBe('court-piece-single-sir-v1');
    expect(engine.name).toBe('Court Piece (Single Sir)');
  });

  it('staged dealing distributes 5 cards per player in Phase 1 and 32 cards remaining', () => {
    const deck = engine.createDeck();
    expect(deck).toHaveLength(52);

    const staged = engine.dealInitialFiveCards(deck);
    expect(Object.keys(staged.phase1Hands)).toHaveLength(4);
    for (let s = 0; s < 4; s++) {
      expect(staged.phase1Hands[s as 0 | 1 | 2 | 3]).toHaveLength(5);
    }
    expect(staged.remainingDeck).toHaveLength(32);

    // Phase 2 completes to 13 cards per player
    const completed = engine.completeRemainingDeal(staged.phase1Hands, staged.remainingDeck);
    for (let s = 0; s < 4; s++) {
      expect(completed.fullHands[s as 0 | 1 | 2 | 3]).toHaveLength(13);
    }

    // Invariant: exactly 52 unique cards
    const allCards = Object.values(completed.fullHands).flat();
    expect(allCards).toHaveLength(52);
    const uniqueIds = new Set(allCards.map((c) => c.id));
    expect(uniqueIds.size).toBe(52);
  });

  it('enforces mandatory follow-suit when player holds cards in led suit', () => {
    const gameState: PublicGameState = {
      currentDeal: 1,
      dealerSeatIndex: 0,
      trumpCallerSeatIndex: 1,
      trumpSuit: 'spades',
      currentTurnSeatIndex: 2,
      currentTrick: {
        leadSuit: 'hearts',
        cards: [
          {
            playerId: 'p1',
            seatIndex: 1,
            card: { id: 'H-K', suit: 'hearts', rank: 'K', value: 13 },
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
      version: 1,
    };

    const handWithHearts: Card[] = [
      { id: 'H-5', suit: 'hearts', rank: '5', value: 5 },
      { id: 'S-A', suit: 'spades', rank: 'A', value: 14 }, // Trump!
    ];

    // Cannot play trump when holding hearts (led suit)
    const illegalTrumpPlay = engine.validateMove(gameState, handWithHearts, 2, handWithHearts[1]);
    expect(illegalTrumpPlay.isValid).toBe(false);
    expect(illegalTrumpPlay.reason).toContain('Must follow led suit: hearts');

    // Playing hearts is legal
    const legalFollowSuit = engine.validateMove(gameState, handWithHearts, 2, handWithHearts[0]);
    expect(legalFollowSuit.isValid).toBe(true);
  });

  it('allows playing any card (including trump) when void in led suit', () => {
    const gameState: PublicGameState = {
      currentDeal: 1,
      dealerSeatIndex: 0,
      trumpCallerSeatIndex: 1,
      trumpSuit: 'spades',
      currentTurnSeatIndex: 2,
      currentTrick: {
        leadSuit: 'hearts',
        cards: [
          {
            playerId: 'p1',
            seatIndex: 1,
            card: { id: 'H-A', suit: 'hearts', rank: 'A', value: 14 },
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
      version: 1,
    };

    const handVoidInHearts: Card[] = [
      { id: 'S-2', suit: 'spades', rank: '2', value: 2 }, // Low trump!
      { id: 'C-K', suit: 'clubs', rank: 'K', value: 13 },
    ];

    const legalRuff = engine.validateMove(gameState, handVoidInHearts, 2, handVoidInHearts[0]);
    expect(legalRuff.isValid).toBe(true);
  });

  it('a low trump card beats the highest card of the led suit', () => {
    const trick: Trick = {
      leadSuit: 'hearts',
      cards: [
        {
          playerId: 'p1',
          seatIndex: 1,
          card: { id: 'H-A', suit: 'hearts', rank: 'A', value: 14 }, // Ace of Hearts!
          playedAt: 1,
        },
        {
          playerId: 'p2',
          seatIndex: 2,
          card: { id: 'S-2', suit: 'spades', rank: '2', value: 2 }, // 2 of Spades (Trump)!
          playedAt: 2,
        },
        {
          playerId: 'p3',
          seatIndex: 3,
          card: { id: 'H-K', suit: 'hearts', rank: 'K', value: 13 },
          playedAt: 3,
        },
        {
          playerId: 'p0',
          seatIndex: 0,
          card: { id: 'H-10', suit: 'hearts', rank: '10', value: 10 },
          playedAt: 4,
        },
      ],
    };

    const gameState: PublicGameState = {
      currentDeal: 1,
      dealerSeatIndex: 0,
      trumpCallerSeatIndex: 1,
      trumpSuit: 'spades',
      currentTurnSeatIndex: 0,
      currentTrick: trick,
      completedTricks: [],
      teamDealScores: [{ tricksWon: 0 }, { tricksWon: 0 }],
      matchScores: [0, 0],
      matchTarget: 7,
      remainingCardCounts: [12, 12, 12, 12],
      status: 'playing',
      version: 5,
    };

    const resolution = engine.resolveTrick(gameState);
    expect(resolution.winnerSeatIndex).toBe(2);
    expect(resolution.winnerPlayerId).toBe('p2');
    expect(resolution.winnerTeamId).toBe(0); // Seat 2 is Team 0
  });

  it('higher trump beats lower trump', () => {
    const trick: Trick = {
      leadSuit: 'clubs',
      cards: [
        {
          playerId: 'p1',
          seatIndex: 1,
          card: { id: 'C-A', suit: 'clubs', rank: 'A', value: 14 },
          playedAt: 1,
        },
        {
          playerId: 'p2',
          seatIndex: 2,
          card: { id: 'D-5', suit: 'diamonds', rank: '5', value: 5 }, // Trump 5
          playedAt: 2,
        },
        {
          playerId: 'p3',
          seatIndex: 3,
          card: { id: 'D-K', suit: 'diamonds', rank: 'K', value: 13 }, // Trump King!
          playedAt: 3,
        },
        {
          playerId: 'p0',
          seatIndex: 0,
          card: { id: 'C-2', suit: 'clubs', rank: '2', value: 2 },
          playedAt: 4,
        },
      ],
    };

    const gameState: PublicGameState = {
      currentDeal: 1,
      dealerSeatIndex: 0,
      trumpCallerSeatIndex: 1,
      trumpSuit: 'diamonds',
      currentTurnSeatIndex: 0,
      currentTrick: trick,
      completedTricks: [],
      teamDealScores: [{ tricksWon: 0 }, { tricksWon: 0 }],
      matchScores: [0, 0],
      matchTarget: 7,
      remainingCardCounts: [12, 12, 12, 12],
      status: 'playing',
      version: 5,
    };

    const resolution = engine.resolveTrick(gameState);
    expect(resolution.winnerSeatIndex).toBe(3);
    expect(resolution.winnerPlayerId).toBe('p3');
    expect(resolution.winnerTeamId).toBe(1); // Seat 3 is Team 1
  });

  it('completes deal immediately when a team reaches 7 tricks and awards 1 match point', () => {
    const trick: Trick = {
      leadSuit: 'hearts',
      cards: [
        { playerId: 'p0', seatIndex: 0, card: { id: 'H-A', suit: 'hearts', rank: 'A', value: 14 }, playedAt: 1 },
        { playerId: 'p1', seatIndex: 1, card: { id: 'H-2', suit: 'hearts', rank: '2', value: 2 }, playedAt: 2 },
        { playerId: 'p2', seatIndex: 2, card: { id: 'H-3', suit: 'hearts', rank: '3', value: 3 }, playedAt: 3 },
        { playerId: 'p3', seatIndex: 3, card: { id: 'H-4', suit: 'hearts', rank: '4', value: 4 }, playedAt: 4 },
      ],
    };

    const gameState: PublicGameState = {
      currentDeal: 1,
      dealerSeatIndex: 0,
      trumpCallerSeatIndex: 1,
      trumpSuit: 'spades',
      currentTurnSeatIndex: 3,
      currentTrick: trick,
      completedTricks: Array(9).fill({} as Trick), // 9 tricks played so far
      teamDealScores: [{ tricksWon: 6 }, { tricksWon: 3 }], // Team 0 had 6 tricks
      matchScores: [2, 1],
      matchTarget: 7,
      remainingCardCounts: [3, 3, 3, 3],
      status: 'playing',
      version: 40,
    };

    const resolution = engine.resolveTrick(gameState);
    expect(resolution.winnerSeatIndex).toBe(0); // Team 0 won their 7th trick!
    expect(resolution.isDealComplete).toBe(true);
    expect(resolution.dealWinnerTeamId).toBe(0);
    expect(resolution.isMatchComplete).toBe(false); // 2 + 1 = 3 < 7
  });

  it('completes match when a team reaches the configured match target (e.g. 7 points)', () => {
    const trick: Trick = {
      leadSuit: 'clubs',
      cards: [
        { playerId: 'p0', seatIndex: 0, card: { id: 'C-A', suit: 'clubs', rank: 'A', value: 14 }, playedAt: 1 },
        { playerId: 'p1', seatIndex: 1, card: { id: 'C-2', suit: 'clubs', rank: '2', value: 2 }, playedAt: 2 },
        { playerId: 'p2', seatIndex: 2, card: { id: 'C-3', suit: 'clubs', rank: '3', value: 3 }, playedAt: 3 },
        { playerId: 'p3', seatIndex: 3, card: { id: 'C-4', suit: 'clubs', rank: '4', value: 4 }, playedAt: 4 },
      ],
    };

    const gameState: PublicGameState = {
      currentDeal: 8,
      dealerSeatIndex: 0,
      trumpCallerSeatIndex: 1,
      trumpSuit: 'diamonds',
      currentTurnSeatIndex: 3,
      currentTrick: trick,
      completedTricks: Array(6).fill({} as Trick),
      teamDealScores: [{ tricksWon: 6 }, { tricksWon: 0 }],
      matchScores: [6, 4], // Team 0 has 6 match points, target is 7
      matchTarget: 7,
      remainingCardCounts: [6, 6, 6, 6],
      status: 'playing',
      version: 70,
    };

    const resolution = engine.resolveTrick(gameState);
    expect(resolution.isDealComplete).toBe(true);
    expect(resolution.dealWinnerTeamId).toBe(0);
    expect(resolution.isMatchComplete).toBe(true);
    expect(resolution.matchWinnerTeamId).toBe(0);
  });
});

