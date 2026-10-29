import {
  doc,
  collection,
  setDoc,
  getDocs,
  query,
  where,
  onSnapshot,
  runTransaction,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from './firebaseConfig';
import type {
  RoomDocument,
  Card,
  SeatIndex,
  Player,
  PublicGameState,
  TeamId,
  PlayedCard,
  Suit,
} from '../types/game';
import { courtPieceEngine } from '../game-engine/court-piece/CourtPieceEngine';

export class FirestoreRoomService {
  private getDb() {
    if (!db) {
      throw new Error('Firestore is not initialized.');
    }
    return db;
  }

  public generateRoomCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  public async createRoom(host: { id: string; nickname: string }): Promise<RoomDocument> {
    const firestore = this.getDb();
    const roomsRef = collection(firestore, 'rooms');
    const roomDocRef = doc(roomsRef);
    const code = this.generateRoomCode();

    const hostPlayer: Player = {
      id: host.id,
      nickname: host.nickname,
      seatIndex: 0,
      teamId: 0,
      isHost: true,
      isConnected: true,
      lastSeen: Date.now(),
    };

    const room: RoomDocument = {
      id: roomDocRef.id,
      code,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      status: 'waiting',
      hostPlayerId: host.id,
      seats: [hostPlayer, null, null, null],
      gameState: null,
      ruleEngineId: courtPieceEngine.id,
      isOfficialRules: true,
      version: 1,
    };

    await setDoc(roomDocRef, {
      ...room,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    return room;
  }

  public async findRoomByCode(code: string): Promise<RoomDocument | null> {
    const firestore = this.getDb();
    const upper = code.trim().toUpperCase();
    const q = query(collection(firestore, 'rooms'), where('code', '==', upper));
    const snap = await getDocs(q);
    if (snap.empty) return null;
    const docSnap = snap.docs[0];
    return { ...docSnap.data(), id: docSnap.id } as RoomDocument;
  }

  public async joinRoom(
    roomCode: string,
    player: { id: string; nickname: string }
  ): Promise<{ room: RoomDocument; seatIndex: SeatIndex }> {
    const firestore = this.getDb();
    const room = await this.findRoomByCode(roomCode);
    if (!room) {
      throw new Error(`Room with code "${roomCode}" was not found.`);
    }

    const roomRef = doc(firestore, 'rooms', room.id);

    return await runTransaction(firestore, async (transaction) => {
      const freshSnap = await transaction.get(roomRef);
      if (!freshSnap.exists()) {
        throw new Error('Room does not exist.');
      }

      const freshRoom = { ...freshSnap.data(), id: freshSnap.id } as RoomDocument;

      const existingSeat = freshRoom.seats.findIndex((s) => s?.id === player.id);
      if (existingSeat !== -1) {
        freshRoom.seats[existingSeat]!.nickname = player.nickname;
        freshRoom.seats[existingSeat]!.isConnected = true;
        freshRoom.seats[existingSeat]!.lastSeen = Date.now();
        transaction.update(roomRef, {
          seats: freshRoom.seats,
          updatedAt: serverTimestamp(),
        });
        return { room: freshRoom, seatIndex: existingSeat as SeatIndex };
      }

      if (freshRoom.status !== 'waiting') {
        throw new Error(`Cannot join room: game is already in status "${freshRoom.status}".`);
      }

      const freeIndex = freshRoom.seats.findIndex((s) => s === null);
      if (freeIndex === -1) {
        throw new Error('Room is full (4/4 players already seated).');
      }

      const seatIndex = freeIndex as SeatIndex;
      const teamId: TeamId = (seatIndex % 2) as TeamId;

      const newPlayer: Player = {
        id: player.id,
        nickname: player.nickname,
        seatIndex,
        teamId,
        isHost: freshRoom.hostPlayerId === player.id,
        isConnected: true,
        lastSeen: Date.now(),
      };

      freshRoom.seats[seatIndex] = newPlayer;
      transaction.update(roomRef, {
        seats: freshRoom.seats,
        version: freshRoom.version + 1,
        updatedAt: serverTimestamp(),
      });

      return { room: freshRoom, seatIndex };
    });
  }

  public async startGame(roomId: string, callerId: string): Promise<void> {
    const firestore = this.getDb();
    const roomRef = doc(firestore, 'rooms', roomId);

    const dealerSeatIndex: SeatIndex = 0;
    const trumpCallerSeatIndex = courtPieceEngine.getTrumpCaller(dealerSeatIndex);

    const deck = courtPieceEngine.createDeck();
    const staged = courtPieceEngine.dealInitialFiveCards(deck);

    await runTransaction(firestore, async (transaction) => {
      const freshSnap = await transaction.get(roomRef);
      if (!freshSnap.exists()) throw new Error('Room not found.');

      const room = freshSnap.data() as RoomDocument;
      if (room.hostPlayerId !== callerId) {
        throw new Error('Only the room host can start the game.');
      }
      if (room.status !== 'waiting') {
        throw new Error(`Cannot start game from status "${room.status}".`);
      }

      const occupied = room.seats.filter((s): s is Player => s !== null);
      if (occupied.length !== 4) {
        throw new Error(`Exactly 4 players required to start. Currently: ${occupied.length}/4.`);
      }

      const callerPlayer = room.seats[trumpCallerSeatIndex]!;

      const initialGameState: PublicGameState = {
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
        lastMoveNotice: `Deal 1: Trump selection. ${callerPlayer.nickname} is choosing trump.`,
        status: 'trump_selection',
        version: 1,
      };

      // Store private hands (first 5 cards)
      for (let s = 0; s < 4; s++) {
        const player = room.seats[s]!;
        const handRef = doc(firestore, 'rooms', roomId, 'privateHands', player.id);
        transaction.set(handRef, {
          playerId: player.id,
          cards: staged.phase1Hands[s as SeatIndex],
          updatedAt: serverTimestamp(),
        });
      }

      // Store reserve 32 cards in server-only collection
      const reserveRef = doc(firestore, 'rooms', roomId, 'serverData', 'reserve');
      transaction.set(reserveRef, {
        cards: staged.remainingDeck,
        updatedAt: serverTimestamp(),
      });

      transaction.update(roomRef, {
        status: 'trump_selection',
        gameState: initialGameState,
        version: room.version + 1,
        updatedAt: serverTimestamp(),
      });
    });
  }

  public async selectTrump(roomId: string, callerId: string, suit: Suit): Promise<void> {
    const firestore = this.getDb();
    const roomRef = doc(firestore, 'rooms', roomId);
    const reserveRef = doc(firestore, 'rooms', roomId, 'serverData', 'reserve');

    await runTransaction(firestore, async (transaction) => {
      const roomSnap = await transaction.get(roomRef);
      const reserveSnap = await transaction.get(reserveRef);

      if (!roomSnap.exists()) throw new Error('Room not found.');
      if (!reserveSnap.exists()) throw new Error('Reserve deck not found.');

      const room = roomSnap.data() as RoomDocument;
      if (room.status !== 'trump_selection' || !room.gameState) {
        throw new Error('Game is not in trump selection phase.');
      }

      const callerSeat = room.seats.find((s) => s?.id === callerId);
      if (!callerSeat || callerSeat.seatIndex !== room.gameState.trumpCallerSeatIndex) {
        throw new Error('Only the designated trump caller can select trump.');
      }

      const remainingDeck = reserveSnap.data().cards as Card[];

      // Retrieve initial hands
      const initialHands: Record<SeatIndex, Card[]> = {} as any;
      for (let s = 0; s < 4; s++) {
        const p = room.seats[s]!;
        const handRef = doc(firestore, 'rooms', roomId, 'privateHands', p.id);
        const hSnap = await transaction.get(handRef);
        initialHands[s as SeatIndex] = hSnap.data()?.cards || [];
      }

      const completed = courtPieceEngine.completeRemainingDeal(initialHands, remainingDeck);

      // Save full 13-card hands
      for (let s = 0; s < 4; s++) {
        const p = room.seats[s]!;
        const handRef = doc(firestore, 'rooms', roomId, 'privateHands', p.id);
        transaction.update(handRef, {
          cards: completed.fullHands[s as SeatIndex],
          updatedAt: serverTimestamp(),
        });
      }

      transaction.delete(reserveRef);

      room.gameState.trumpSuit = suit;
      room.gameState.status = 'playing';
      room.status = 'playing';
      room.gameState.remainingCardCounts = [13, 13, 13, 13];
      room.gameState.currentTurnSeatIndex = room.gameState.trumpCallerSeatIndex;
      room.gameState.lastMoveNotice = `${callerSeat.nickname} selected ${suit.toUpperCase()} as Trump! Leading trick 1.`;

      transaction.update(roomRef, {
        status: 'playing',
        gameState: room.gameState,
        version: room.version + 1,
        updatedAt: serverTimestamp(),
      });
    });
  }

  public async playCard(roomId: string, callerId: string, card: Card): Promise<void> {
    const firestore = this.getDb();
    const roomRef = doc(firestore, 'rooms', roomId);
    const handRef = doc(firestore, 'rooms', roomId, 'privateHands', callerId);

    await runTransaction(firestore, async (transaction) => {
      const roomSnap = await transaction.get(roomRef);
      const handSnap = await transaction.get(handRef);

      if (!roomSnap.exists()) throw new Error('Room not found.');
      if (!handSnap.exists()) throw new Error('Private hand not found.');

      const room = roomSnap.data() as RoomDocument;
      if (room.status !== 'playing' || !room.gameState) {
        throw new Error('Game is not playing.');
      }

      const player = room.seats.find((s) => s?.id === callerId);
      if (!player) throw new Error('Player not in this room.');

      const privateCards = (handSnap.data()?.cards || []) as Card[];

      const validation = courtPieceEngine.validateMove(
        room.gameState,
        privateCards,
        player.seatIndex,
        card
      );

      if (!validation.isValid) {
        throw new Error(validation.reason || 'Illegal move.');
      }

      const newHand = privateCards.filter((c) => c.id !== card.id);
      transaction.update(handRef, {
        cards: newHand,
        updatedAt: serverTimestamp(),
      });

      const playedCard: PlayedCard = {
        playerId: callerId,
        seatIndex: player.seatIndex,
        card,
        playedAt: Date.now(),
      };

      const trick = room.gameState.currentTrick;
      if (!trick.leadSuit) {
        trick.leadSuit = card.suit;
      }
      trick.cards.push(playedCard);
      room.gameState.remainingCardCounts[player.seatIndex] = newHand.length;

      if (trick.cards.length === 4) {
        const resolution = courtPieceEngine.resolveTrick(room.gameState);
        room.gameState.teamDealScores[resolution.winnerTeamId].tricksWon += 1;
        room.gameState.completedTricks.push(resolution.completedTrick);

        if (resolution.isDealComplete && resolution.dealWinnerTeamId !== undefined) {
          room.gameState.matchScores[resolution.dealWinnerTeamId] += 1;
          room.gameState.dealWinnerTeamId = resolution.dealWinnerTeamId;

          if (resolution.isMatchComplete) {
            room.status = 'match_complete';
            room.gameState.status = 'match_complete';
            room.gameState.matchWinnerTeamId = resolution.matchWinnerTeamId;
            room.gameState.lastMoveNotice = `MATCH COMPLETE! Team ${
              resolution.matchWinnerTeamId === 0 ? 'Alpha' : 'Beta'
            } wins the match!`;
          } else {
            room.status = 'deal_complete';
            room.gameState.status = 'deal_complete';
            room.gameState.lastMoveNotice = `DEAL WON! Team ${
              resolution.dealWinnerTeamId === 0 ? 'Alpha' : 'Beta'
            } won 7 tricks and earns 1 match point!`;
          }
        } else {
          const winnerPlayer = room.seats[resolution.winnerSeatIndex];
          room.gameState.currentTrick = { cards: [] };
          room.gameState.currentTurnSeatIndex = resolution.nextLeadSeatIndex;
          room.gameState.lastMoveNotice = `${winnerPlayer?.nickname || 'Player'} won the trick and leads next.`;
        }
      } else {
        room.gameState.currentTurnSeatIndex = ((player.seatIndex + 1) % 4) as SeatIndex;
        const nextPlayer = room.seats[room.gameState.currentTurnSeatIndex];
        room.gameState.lastMoveNotice = `${player.nickname} played ${card.rank} of ${card.suit}. Turn: ${nextPlayer?.nickname}.`;
      }

      transaction.update(roomRef, {
        status: room.status,
        gameState: room.gameState,
        version: room.version + 1,
        updatedAt: serverTimestamp(),
      });
    });
  }

  public async startNextDeal(roomId: string, callerId: string): Promise<void> {
    const firestore = this.getDb();
    const roomRef = doc(firestore, 'rooms', roomId);

    await runTransaction(firestore, async (transaction) => {
      const snap = await transaction.get(roomRef);
      if (!snap.exists()) throw new Error('Room not found.');
      const room = snap.data() as RoomDocument;

      const isSeated = room.seats.some((s) => s?.id === callerId);
      if (!isSeated) {
        throw new Error('Caller is not a player seated at this table.');
      }

      if (room.status !== 'deal_complete' || !room.gameState || room.gameState.dealWinnerTeamId === undefined) {
        throw new Error('Current deal is not complete.');
      }

      const currentDealer = room.gameState.dealerSeatIndex;
      const nextDealer = courtPieceEngine.getNextDealer(currentDealer, room.gameState.dealWinnerTeamId);
      const nextTrumpCaller = courtPieceEngine.getTrumpCaller(nextDealer);

      const deck = courtPieceEngine.createDeck();
      const staged = courtPieceEngine.dealInitialFiveCards(deck);

      for (let s = 0; s < 4; s++) {
        const player = room.seats[s]!;
        const handRef = doc(firestore, 'rooms', roomId, 'privateHands', player.id);
        transaction.set(handRef, {
          playerId: player.id,
          cards: staged.phase1Hands[s as SeatIndex],
          updatedAt: serverTimestamp(),
        });
      }

      const reserveRef = doc(firestore, 'rooms', roomId, 'serverData', 'reserve');
      transaction.set(reserveRef, {
        cards: staged.remainingDeck,
        updatedAt: serverTimestamp(),
      });

      const callerPlayer = room.seats[nextTrumpCaller]!;

      room.gameState.currentDeal += 1;
      room.gameState.dealerSeatIndex = nextDealer;
      room.gameState.trumpCallerSeatIndex = nextTrumpCaller;
      room.gameState.trumpSuit = null;
      room.gameState.currentTurnSeatIndex = nextTrumpCaller;
      room.gameState.currentTrick = { cards: [] };
      room.gameState.completedTricks = [];
      room.gameState.teamDealScores = [{ tricksWon: 0 }, { tricksWon: 0 }];
      room.gameState.remainingCardCounts = [5, 5, 5, 5];
      room.gameState.status = 'trump_selection';
      room.gameState.dealWinnerTeamId = undefined;
      room.gameState.lastMoveNotice = `Deal ${room.gameState.currentDeal}: Trump selection phase. ${callerPlayer.nickname} is choosing trump.`;

      transaction.update(roomRef, {
        status: 'trump_selection',
        gameState: room.gameState,
        version: room.version + 1,
        updatedAt: serverTimestamp(),
      });
    });
  }

  public async requestRematch(roomId: string, callerId: string): Promise<void> {
    const firestore = this.getDb();
    const roomRef = doc(firestore, 'rooms', roomId);

    await runTransaction(firestore, async (transaction) => {
      const snap = await transaction.get(roomRef);
      if (!snap.exists()) throw new Error('Room not found.');
      const room = snap.data() as RoomDocument;

      if (room.hostPlayerId !== callerId) {
        throw new Error('Only the room host can request a rematch.');
      }

      transaction.update(roomRef, {
        status: 'waiting',
        gameState: null,
        version: room.version + 1,
        updatedAt: serverTimestamp(),
      });
    });
  }

  public async sendReaction(roomId: string, callerId: string, emoji: string): Promise<void> {
    const firestore = this.getDb();
    const roomRef = doc(firestore, 'rooms', roomId);

    try {
      await runTransaction(firestore, async (transaction) => {
        const snap = await transaction.get(roomRef);
        if (!snap.exists()) return;
        const room = snap.data() as RoomDocument;
        if (!room.gameState) return;

        const player = room.seats.find((s) => s?.id === callerId);
        if (!player) return;

        const rx = {
          id: 'rx_' + Math.random().toString(36).substring(2, 8) + Date.now().toString(36),
          playerId: callerId,
          seatIndex: player.seatIndex,
          emoji,
          timestamp: Date.now(),
        };

        transaction.update(roomRef, {
          'gameState.lastReaction': rx,
          updatedAt: serverTimestamp(),
        });
      });
    } catch (e) {
      console.warn('[FirestoreRoomService] Failed to send reaction:', e);
    }
  }

  public async leaveRoom(roomId: string, callerId: string): Promise<void> {
    const firestore = this.getDb();
    const roomRef = doc(firestore, 'rooms', roomId);

    await runTransaction(firestore, async (transaction) => {
      const snap = await transaction.get(roomRef);
      if (!snap.exists()) return;
      const room = snap.data() as RoomDocument;

      const seatIdx = room.seats.findIndex((s) => s?.id === callerId);
      if (seatIdx === -1) return;

      if (room.status === 'waiting') {
        room.seats[seatIdx] = null;
        if (room.hostPlayerId === callerId) {
          const remaining = room.seats.find((s): s is Player => s !== null);
          if (remaining) {
            room.hostPlayerId = remaining.id;
            remaining.isHost = true;
          }
        }
      } else {
        const player = room.seats[seatIdx];
        if (player) {
          player.isConnected = false;
        }
      }

      transaction.update(roomRef, {
        seats: room.seats,
        hostPlayerId: room.hostPlayerId,
        version: room.version + 1,
        updatedAt: serverTimestamp(),
      });
    });
  }

  public subscribeRoom(roomId: string, callback: (room: RoomDocument | null) => void): () => void {
    const firestore = this.getDb();
    const roomRef = doc(firestore, 'rooms', roomId);
    return onSnapshot(
      roomRef,
      (snap) => {
        if (snap.exists()) {
          callback({ ...snap.data(), id: snap.id } as RoomDocument);
        } else {
          callback(null);
        }
      },
      (err) => {
        console.warn('[FirestoreRoomService] Room subscription error:', err);
        callback(null);
      }
    );
  }

  public subscribePrivateHand(
    roomId: string,
    playerId: string,
    callback: (cards: Card[]) => void
  ): () => void {
    const firestore = this.getDb();
    const handRef = doc(firestore, 'rooms', roomId, 'privateHands', playerId);
    return onSnapshot(
      handRef,
      (snap) => {
        if (snap.exists()) {
          callback((snap.data()?.cards || []) as Card[]);
        } else {
          callback([]);
        }
      },
      (err) => {
        console.error('[FirestoreRoomService] Private hand subscription error:', err);
      }
    );
  }
}

export const firestoreService = new FirestoreRoomService();
