import * as admin from 'firebase-admin';
import { onCall, HttpsError } from 'firebase-functions/v2/https';

admin.initializeApp();
const db = admin.firestore();

type Suit = 'spades' | 'hearts' | 'diamonds' | 'clubs';
type Rank = '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K' | 'A';

interface Card {
  id: string;
  suit: Suit;
  rank: Rank;
  value: number;
}

function createShuffledDeck(): Card[] {
  const suits: Suit[] = ['spades', 'hearts', 'diamonds', 'clubs'];
  const ranks: Rank[] = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
  const rankValues: Record<Rank, number> = {
    '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, '10': 10,
    'J': 11, 'Q': 12, 'K': 13, 'A': 14
  };

  const deck: Card[] = [];
  for (const suit of suits) {
    for (const rank of ranks) {
      deck.push({
        id: `${suit[0].toUpperCase()}-${rank}`,
        suit,
        rank,
        value: rankValues[rank],
      });
    }
  }

  // Fisher-Yates
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const temp = deck[i];
    deck[i] = deck[j];
    deck[j] = temp;
  }
  return deck;
}

/**
 * Authoritative Start Game (Stage 1 Deal: 5 cards each)
 */
export const startGame = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'User must be authenticated.');
  }

  const { roomId } = request.data;
  if (!roomId) {
    throw new HttpsError('invalid-argument', 'Room ID is required.');
  }

  const roomRef = db.collection('rooms').doc(roomId);

  return await db.runTransaction(async (transaction) => {
    const snap = await transaction.get(roomRef);
    if (!snap.exists) throw new HttpsError('not-found', 'Room not found.');

    const room = snap.data()!;
    if (room.hostPlayerId !== request.auth!.uid) {
      throw new HttpsError('permission-denied', 'Only room host can start the game.');
    }
    if (room.status !== 'waiting') {
      throw new HttpsError('failed-precondition', `Cannot start from status ${room.status}`);
    }

    const occupied = room.seats.filter((s: any) => s !== null);
    if (occupied.length !== 4) {
      throw new HttpsError('failed-precondition', 'Exactly 4 players required.');
    }

    const dealerSeatIndex = 0;
    const trumpCallerSeatIndex = 1; // Clockwise from dealer

    const deck = createShuffledDeck();
    const phase1Hands = [
      deck.slice(0, 5),
      deck.slice(5, 10),
      deck.slice(10, 15),
      deck.slice(15, 20),
    ];
    const remainingDeck = deck.slice(20, 52); // 32 cards

    // Save initial 5 cards
    for (let s = 0; s < 4; s++) {
      const p = room.seats[s];
      const handRef = roomRef.collection('privateHands').doc(p.id);
      transaction.set(handRef, {
        playerId: p.id,
        cards: phase1Hands[s],
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }

    // Save reserve 32 cards
    const reserveRef = roomRef.collection('serverData').doc('reserve');
    transaction.set(reserveRef, {
      cards: remainingDeck,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    transaction.update(roomRef, {
      status: 'trump_selection',
      gameState: {
        currentDeal: 1,
        dealerSeatIndex,
        trumpCallerSeatIndex,
        trumpSuit: null,
        currentTurnSeatIndex: trumpCallerSeatIndex,
        currentTrick: { cards: [] },
        completedTricks: [],
        teamDealScores: [{ tricksWon: 0 }, { tricksWon: 0 }],
        matchScores: [0, 0],
        matchTarget: 7,
        remainingCardCounts: [5, 5, 5, 5],
        lastMoveNotice: 'Stage 1 dealt (5 cards each). Trump caller is choosing trump.',
        status: 'trump_selection',
        version: 1,
      },
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      version: (room.version || 1) + 1,
    });

    return { success: true };
  });
});

/**
 * Authoritative Trump Selection (Stage 2 Deal: 4 + 4 cards each)
 */
export const selectTrump = onCall(async (request) => {
  if (!request.auth) throw new HttpsError('unauthenticated', 'User must be authenticated.');

  const { roomId, suit } = request.data;
  if (!roomId || !suit) throw new HttpsError('invalid-argument', 'Missing roomId or suit.');

  const roomRef = db.collection('rooms').doc(roomId);
  const reserveRef = roomRef.collection('serverData').doc('reserve');

  return await db.runTransaction(async (transaction) => {
    const roomSnap = await transaction.get(roomRef);
    const reserveSnap = await transaction.get(reserveRef);

    if (!roomSnap.exists || !reserveSnap.exists) {
      throw new HttpsError('not-found', 'Room or reserve not found.');
    }

    const room = roomSnap.data()!;
    if (room.status !== 'trump_selection' || !room.gameState) {
      throw new HttpsError('failed-precondition', 'Game is not in trump selection.');
    }

    const callerSeat = room.seats.find((s: any) => s?.id === request.auth!.uid);
    if (!callerSeat || callerSeat.seatIndex !== room.gameState.trumpCallerSeatIndex) {
      throw new HttpsError('permission-denied', 'Only trump caller can select trump.');
    }

    const remainingDeck = reserveSnap.data()!.cards as Card[];

    // Complete remaining deal
    for (let s = 0; s < 4; s++) {
      const p = room.seats[s];
      const handRef = roomRef.collection('privateHands').doc(p.id);
      const hSnap = await transaction.get(handRef);
      const initialCards = hSnap.data()?.cards || [];

      // 4 cards + 4 cards
      const newCards = [
        ...initialCards,
        ...remainingDeck.slice(s * 4, s * 4 + 4),
        ...remainingDeck.slice(16 + s * 4, 16 + s * 4 + 4),
      ];

      transaction.update(handRef, {
        cards: newCards,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }

    transaction.delete(reserveRef);

    room.gameState.trumpSuit = suit;
    room.gameState.status = 'playing';
    room.gameState.remainingCardCounts = [13, 13, 13, 13];
    room.gameState.currentTurnSeatIndex = room.gameState.trumpCallerSeatIndex;
    room.gameState.lastMoveNotice = `${callerSeat.nickname} selected ${suit.toUpperCase()} as Trump! Leading trick 1.`;

    transaction.update(roomRef, {
      status: 'playing',
      gameState: room.gameState,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      version: (room.version || 1) + 1,
    });

    return { success: true };
  });
});
