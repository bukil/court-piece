import type {
  RoomDocument,
  Card,
  SeatIndex,
  Player,
  PublicGameState,
  TeamId,
  PlayedCard,
  Suit,
  ChatMessage,
} from '../types/game';
import { courtPieceEngine } from '../game-engine/court-piece/CourtPieceEngine';
import { getStorage } from './storageAdapter';

const BROADCAST_CHANNEL_NAME = 'codebase_simulator_sync_v2';
const STORAGE_PREFIX_ROOM = 'codebase_sim_room_';
const STORAGE_PREFIX_HANDS = 'codebase_sim_hands_';

interface BroadcastMessage {
  type: 'ROOM_UPDATED' | 'HAND_UPDATED';
  roomId: string;
  playerId?: string;
  timestamp: number;
}

export class LocalSimulatorService {
  private channel: BroadcastChannel | null = null;
  private storage = getStorage();
  private roomListeners: Map<string, Set<(room: RoomDocument) => void>> = new Map();
  private handListeners: Map<string, Set<(cards: Card[], initialCards?: Card[]) => void>> = new Map();

  constructor() {
    if (typeof BroadcastChannel !== 'undefined') {
      try {
        this.channel = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
        this.channel.onmessage = (event: MessageEvent<BroadcastMessage>) => {
          this.handleBroadcastMessage(event.data);
        };
      } catch (e) {
        console.warn('[LocalSimulator] BroadcastChannel not supported in this environment', e);
      }
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('storage', (event: StorageEvent) => {
        if (!event.key) return;
        if (event.key.startsWith(STORAGE_PREFIX_ROOM)) {
          const roomId = event.key.replace(STORAGE_PREFIX_ROOM, '');
          this.notifyRoomSubscribers(roomId);
        } else if (event.key.startsWith(STORAGE_PREFIX_HANDS)) {
          const parts = event.key.replace(STORAGE_PREFIX_HANDS, '').split('_');
          if (parts.length === 2) {
            const [roomId, playerId] = parts;
            this.notifyHandSubscribers(roomId, playerId);
          }
        }
      });
    }
  }

  private handleBroadcastMessage(msg: BroadcastMessage): void {
    if (msg.type === 'ROOM_UPDATED') {
      this.notifyRoomSubscribers(msg.roomId);
    } else if (msg.type === 'HAND_UPDATED' && msg.playerId) {
      this.notifyHandSubscribers(msg.roomId, msg.playerId);
    }
  }

  private getRoomFromStorage(roomId: string): RoomDocument | null {
    const raw = this.storage.getItem(STORAGE_PREFIX_ROOM + roomId);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as RoomDocument;
    } catch {
      return null;
    }
  }

  private saveRoomToStorage(room: RoomDocument): void {
    room.updatedAt = Date.now();
    room.version += 1;
    this.storage.setItem(STORAGE_PREFIX_ROOM + room.id, JSON.stringify(room));
    this.broadcast({
      type: 'ROOM_UPDATED',
      roomId: room.id,
      timestamp: Date.now(),
    });
    this.notifyRoomSubscribers(room.id);
  }

  private getHandFromStorage(roomId: string, playerId: string): Card[] {
    const key = `${STORAGE_PREFIX_HANDS}${roomId}_${playerId}`;
    const raw = this.storage.getItem(key);
    if (!raw) return [];
    try {
      return JSON.parse(raw) as Card[];
    } catch {
      return [];
    }
  }

  private getInitialHandFromStorage(roomId: string, playerId: string): Card[] {
    const key = `${STORAGE_PREFIX_HANDS}${roomId}_${playerId}_init`;
    const raw = this.storage.getItem(key);
    if (!raw) return [];
    try {
      return JSON.parse(raw) as Card[];
    } catch {
      return [];
    }
  }

  private saveHandToStorage(roomId: string, playerId: string, cards: Card[], initialCards?: Card[]): void {
    const key = `${STORAGE_PREFIX_HANDS}${roomId}_${playerId}`;
    this.storage.setItem(key, JSON.stringify(cards));
    if (initialCards) {
      this.storage.setItem(`${key}_init`, JSON.stringify(initialCards));
    }
    this.broadcast({
      type: 'HAND_UPDATED',
      roomId,
      playerId,
      timestamp: Date.now(),
    });
    this.notifyHandSubscribers(roomId, playerId);
  }

  private broadcast(msg: BroadcastMessage): void {
    try {
      this.channel?.postMessage(msg);
    } catch (e) {
      console.warn('[LocalSimulator] Error posting broadcast message', e);
    }
  }

  private notifyRoomSubscribers(roomId: string): void {
    const listeners = this.roomListeners.get(roomId);
    if (!listeners || listeners.size === 0) return;
    const room = this.getRoomFromStorage(roomId);
    if (room) {
      listeners.forEach((cb) => cb(room));
    }
  }

  private notifyHandSubscribers(roomId: string, playerId: string): void {
    const key = `${roomId}_${playerId}`;
    const listeners = this.handListeners.get(key);
    if (!listeners || listeners.size === 0) return;
    const room = this.getRoomFromStorage(roomId);
    const hand = this.getHandFromStorage(roomId, playerId);
    const initHand = this.getInitialHandFromStorage(roomId, playerId);
    const cardsToEmit = (room?.status === 'trump_selection' && initHand.length > 0) ? initHand : hand;
    listeners.forEach((cb) => cb(cardsToEmit, initHand));
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
    const roomId = 'rm_' + Math.random().toString(36).substring(2, 9);
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

    const newRoom: RoomDocument = {
      id: roomId,
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

    this.saveRoomToStorage(newRoom);
    return newRoom;
  }

  public async findRoomByCode(roomCode: string): Promise<RoomDocument | null> {
    const upper = roomCode.trim().toUpperCase();
    for (let i = 0; i < this.storage.length; i++) {
      const key = this.storage.key(i);
      if (key && key.startsWith(STORAGE_PREFIX_ROOM)) {
        try {
          const room = JSON.parse(this.storage.getItem(key)!) as RoomDocument;
          if (room.code === upper) {
            return room;
          }
        } catch {
          // continue
        }
      }
    }
    return null;
  }

  public async joinRoom(
    roomCode: string,
    player: { id: string; nickname: string }
  ): Promise<{ room: RoomDocument; seatIndex: SeatIndex }> {
    const room = await this.findRoomByCode(roomCode);
    if (!room) {
      throw new Error(`Room with code "${roomCode}" was not found.`);
    }

    const existingIndex = room.seats.findIndex((s) => s?.id === player.id);
    if (existingIndex !== -1) {
      const currentSeat = room.seats[existingIndex]!;
      currentSeat.nickname = player.nickname;
      currentSeat.isConnected = true;
      currentSeat.lastSeen = Date.now();
      this.saveRoomToStorage(room);
      return { room, seatIndex: existingIndex as SeatIndex };
    }

    if (room.status !== 'waiting') {
      throw new Error(`Cannot join room: game is already in status "${room.status}".`);
    }

    const freeSeatIndex = room.seats.findIndex((s) => s === null);
    if (freeSeatIndex === -1) {
      throw new Error('Room is full (4/4 players already seated).');
    }

    const seatIdx = freeSeatIndex as SeatIndex;
    const teamId: TeamId = (seatIdx % 2) as TeamId;

    const newPlayer: Player = {
      id: player.id,
      nickname: player.nickname,
      seatIndex: seatIdx,
      teamId,
      isHost: room.hostPlayerId === player.id,
      isConnected: true,
      lastSeen: Date.now(),
    };

    room.seats[seatIdx] = newPlayer;
    this.saveRoomToStorage(room);

    return { room, seatIndex: seatIdx };
  }

  /**
   * Starts a Court Piece game:
   * - Phase 1 dealing: 5 cards to each player.
   * - Remaining 32 cards saved to server reserve.
   * - Status transitions to 'trump_selection'.
   * - Trump caller (clockwise from dealer) is designated.
   */
  public async startGame(roomId: string, callerId: string): Promise<void> {
    const room = this.getRoomFromStorage(roomId);
    if (!room) throw new Error('Room not found.');

    if (room.hostPlayerId !== callerId) {
      throw new Error('Only the room host can start the game.');
    }

    if (room.status !== 'waiting') {
      throw new Error(`Game cannot be started from status "${room.status}".`);
    }

    const occupiedSeats = room.seats.filter((s): s is Player => s !== null);
    if (occupiedSeats.length !== 4) {
      throw new Error(`Exactly 4 players are required to start the game. Currently: ${occupiedSeats.length}/4.`);
    }

    // Dealer assignment: Seat 0 for deal 1, Trump Caller is Seat 1
    const dealerSeatIndex: SeatIndex = 0;
    const trumpCallerSeatIndex = courtPieceEngine.getTrumpCaller(dealerSeatIndex);

    // Staged dealing
    const deck = courtPieceEngine.createDeck();
    const staged = courtPieceEngine.dealInitialFiveCards(deck);
    const completedDeal = courtPieceEngine.completeRemainingDeal(staged.phase1Hands, staged.remainingDeck);

    // Store private hands for all 4 players (initial 5 cards + full 13 cards)
    for (let s = 0; s < 4; s++) {
      const seatedPlayer = room.seats[s]!;
      this.saveHandToStorage(roomId, seatedPlayer.id, completedDeal.fullHands[s as SeatIndex], staged.phase1Hands[s as SeatIndex]);
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
      lastMoveNotice: `Deal 1: Trump selection phase. ${callerPlayer.nickname} is choosing trump from their first 5 cards.`,
      status: 'trump_selection',
      version: 1,
    };

    room.status = 'trump_selection';
    room.gameState = initialGameState;
    this.saveRoomToStorage(room);
    for (let s = 0; s < 4; s++) {
      const p = room.seats[s];
      if (p) this.notifyHandSubscribers(roomId, p.id);
    }
  }

  /**
   * Trump selection action:
   * - Validates caller is the trump caller
   * - Records chosen trump suit
   * - Transitions status to 'playing'
   * - Trump caller leads first trick
   */
  public async selectTrump(roomId: string, callerId: string, suit: Suit): Promise<void> {
    const room = this.getRoomFromStorage(roomId);
    if (!room || !room.gameState) throw new Error('Game not found.');

    if (room.status !== 'trump_selection' || room.gameState.status !== 'trump_selection') {
      throw new Error('Game is not in trump selection phase.');
    }

    const callerSeat = room.seats.find((s) => s?.id === callerId);
    if (!callerSeat || callerSeat.seatIndex !== room.gameState.trumpCallerSeatIndex) {
      throw new Error('Only the designated trump caller can choose the trump suit.');
    }

    // Update game state
    room.gameState.trumpSuit = suit;
    room.gameState.status = 'playing';
    room.status = 'playing';
    room.gameState.remainingCardCounts = [13, 13, 13, 13];
    room.gameState.currentTurnSeatIndex = room.gameState.trumpCallerSeatIndex;
    room.gameState.lastMoveNotice = `${callerSeat.nickname} selected ${suit.toUpperCase()} as Trump.`;

    this.saveRoomToStorage(room);
    for (let s = 0; s < 4; s++) {
      const p = room.seats[s];
      if (p) this.notifyHandSubscribers(roomId, p.id);
    }
  }

  /**
   * Authoritative card play and Single Sir trick collection
   */
  public async playCard(roomId: string, callerId: string, card: Card): Promise<void> {
    const room = this.getRoomFromStorage(roomId);
    if (!room) throw new Error('Room not found.');

    if (room.status !== 'playing' || !room.gameState) {
      throw new Error('Game is not currently active.');
    }

    const player = room.seats.find((s) => s?.id === callerId);
    if (!player) {
      throw new Error('Player is not seated at this table.');
    }

    const hand = this.getHandFromStorage(roomId, callerId);

    // Authoritative move validation
    const validation = courtPieceEngine.validateMove(
      room.gameState,
      hand,
      player.seatIndex,
      card
    );

    if (!validation.isValid) {
      throw new Error(validation.reason || 'Illegal move.');
    }

    // Remove card from player's private hand
    const newHand = hand.filter((c) => c.id !== card.id);
    this.saveHandToStorage(roomId, callerId, newHand);

    room.gameState.remainingCardCounts[player.seatIndex] = newHand.length;

    // Add card to current trick
    const playedCard: PlayedCard = {
      playerId: callerId,
      seatIndex: player.seatIndex,
      card,
      playedAt: Date.now(),
    };

    const currentTrick = room.gameState.currentTrick;
    if (!currentTrick.leadSuit) {
      currentTrick.leadSuit = card.suit;
    }
    currentTrick.cards.push(playedCard);

    // Check if 4 cards have been played in this trick
    if (currentTrick.cards.length === 4) {
      const resolution = courtPieceEngine.resolveTrick(room.gameState);

      // Single Sir: trick collected immediately, team trick score updated
      room.gameState.teamDealScores[resolution.winnerTeamId].tricksWon += 1;
      room.gameState.completedTricks.push(resolution.completedTrick);

      if (resolution.isDealComplete && resolution.dealWinnerTeamId !== undefined) {
        // Award 1 match point to winning team
        room.gameState.matchScores[resolution.dealWinnerTeamId] += 1;
        room.gameState.dealWinnerTeamId = resolution.dealWinnerTeamId;

        if (resolution.isMatchComplete) {
          room.status = 'match_complete';
          room.gameState.status = 'match_complete';
          room.gameState.matchWinnerTeamId = resolution.matchWinnerTeamId;
          const winningTeamName = resolution.matchWinnerTeamId === 0 ? 'Team Alpha' : 'Team Beta';
          room.gameState.lastMoveNotice = `MATCH COMPLETE! ${winningTeamName} reached ${room.gameState.matchTarget} match points and wins the championship!`;
        } else {
          room.status = 'deal_complete';
          room.gameState.status = 'deal_complete';
          const winningTeamName = resolution.dealWinnerTeamId === 0 ? 'Team Alpha' : 'Team Beta';
          room.gameState.lastMoveNotice = `DEAL WON! ${winningTeamName} reached 7 tricks and earns 1 match point!`;
        }
      } else {
        // Prepare next trick
        const winnerPlayer = room.seats[resolution.winnerSeatIndex];
        room.gameState.currentTrick = { cards: [] };
        room.gameState.currentTurnSeatIndex = resolution.nextLeadSeatIndex;
        room.gameState.lastMoveNotice = `${winnerPlayer?.nickname || 'Player'} won the trick and leads next.`;
      }
    } else {
      // Advance turn clockwise
      room.gameState.currentTurnSeatIndex = ((player.seatIndex + 1) % 4) as SeatIndex;
      const nextPlayer = room.seats[room.gameState.currentTurnSeatIndex];
      room.gameState.lastMoveNotice = `${player.nickname} played ${card.rank} of ${card.suit}. Turn: ${nextPlayer?.nickname}.`;
    }

    this.saveRoomToStorage(room);
    for (let s = 0; s < 4; s++) {
      const p = room.seats[s];
      if (p) this.notifyHandSubscribers(roomId, p.id);
    }
  }

  /**
   * Starts next deal after a deal is complete.
   * Rotates dealer according to documented standard policy:
   * - If dealer's team won, dealer stays.
   * - If dealer's team lost, dealer rotates clockwise.
   */
  public async startNextDeal(roomId: string, callerId: string): Promise<void> {
    const room = this.getRoomFromStorage(roomId);
    if (!room || !room.gameState) throw new Error('Game not found.');

    const isSeated = room.seats.some((s) => s?.id === callerId);
    if (!isSeated) {
      throw new Error('Caller is not a player seated at this table.');
    }

    if (room.status !== 'deal_complete' || room.gameState.dealWinnerTeamId === undefined) {
      throw new Error('Current deal is not complete.');
    }

    const currentDealer = room.gameState.dealerSeatIndex;
    const nextDealer = courtPieceEngine.getNextDealer(currentDealer, room.gameState.dealWinnerTeamId);
    const nextTrumpCaller = courtPieceEngine.getTrumpCaller(nextDealer);

    // Staged deal
    const deck = courtPieceEngine.createDeck();
    const staged = courtPieceEngine.dealInitialFiveCards(deck);
    const completedDeal = courtPieceEngine.completeRemainingDeal(staged.phase1Hands, staged.remainingDeck);

    for (let s = 0; s < 4; s++) {
      const seatedPlayer = room.seats[s]!;
      this.saveHandToStorage(roomId, seatedPlayer.id, completedDeal.fullHands[s as SeatIndex], staged.phase1Hands[s as SeatIndex]);
    }

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

    room.status = 'trump_selection';
    this.saveRoomToStorage(room);
    for (let s = 0; s < 4; s++) {
      const p = room.seats[s];
      if (p) this.notifyHandSubscribers(roomId, p.id);
    }
  }

  /**
   * Resets match scores and returns to lobby / new match
   */
  public async requestRematch(roomId: string, callerId: string): Promise<void> {
    const room = this.getRoomFromStorage(roomId);
    if (!room) throw new Error('Room not found.');

    if (room.hostPlayerId !== callerId) {
      throw new Error('Only the room host can request a rematch.');
    }

    room.status = 'waiting';
    room.gameState = null;
    this.saveRoomToStorage(room);
    for (let s = 0; s < 4; s++) {
      const p = room.seats[s];
      if (p) this.notifyHandSubscribers(roomId, p.id);
    }
  }

  public async sendReaction(roomId: string, callerId: string, emoji: string): Promise<void> {
    const room = this.getRoomFromStorage(roomId);
    if (!room || !room.gameState) return;
    const player = room.seats.find((s) => s?.id === callerId);
    if (!player) return;

    room.gameState.lastReaction = {
      id: 'rx_' + Math.random().toString(36).substring(2, 8) + Date.now().toString(36),
      playerId: callerId,
      seatIndex: player.seatIndex,
      emoji,
      timestamp: Date.now(),
    };
    this.saveRoomToStorage(room);
    for (let s = 0; s < 4; s++) {
      const p = room.seats[s];
      if (p) this.notifyHandSubscribers(roomId, p.id);
    }
  }

  public async sendChatMessage(
    roomId: string,
    message: Omit<ChatMessage, 'id' | 'timestamp'>
  ): Promise<void> {
    const room = this.getRoomFromStorage(roomId);
    if (!room) return;
    const newMsg: ChatMessage = {
      ...message,
      id: `msg_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      timestamp: Date.now(),
    };
    if (!room.messages) room.messages = [];
    room.messages.push(newMsg);
    if (room.messages.length > 50) {
      room.messages = room.messages.slice(-50);
    }
    this.saveRoomToStorage(room);
  }

  public async leaveRoom(roomId: string, callerId: string): Promise<void> {
    const room = this.getRoomFromStorage(roomId);
    if (!room) return;

    const seatIdx = room.seats.findIndex((s) => s?.id === callerId);
    if (seatIdx === -1) return;

    if (room.status === 'waiting') {
      room.seats[seatIdx] = null;
      if (room.hostPlayerId === callerId) {
        const remaining = room.seats.find((s): s is Player => s !== null);
        if (remaining) {
          room.hostPlayerId = remaining.id;
          remaining.isHost = true;
        } else {
          this.storage.removeItem(STORAGE_PREFIX_ROOM + roomId);
          this.broadcast({ type: 'ROOM_UPDATED', roomId, timestamp: Date.now() });
          return;
        }
      }
    } else {
      const player = room.seats[seatIdx];
      if (player) {
        player.isConnected = false;
      }
    }

    this.saveRoomToStorage(room);
    for (let s = 0; s < 4; s++) {
      const p = room.seats[s];
      if (p) this.notifyHandSubscribers(roomId, p.id);
    }
  }

  public subscribeRoom(roomId: string, callback: (room: RoomDocument | null) => void): () => void {
    if (!this.roomListeners.has(roomId)) {
      this.roomListeners.set(roomId, new Set());
    }
    const set = this.roomListeners.get(roomId)!;
    set.add(callback as any);

    const room = this.getRoomFromStorage(roomId);
    callback(room);

    return () => {
      set.delete(callback as any);
      if (set.size === 0) {
        this.roomListeners.delete(roomId);
      }
    };
  }

  public subscribePrivateHand(
    roomId: string,
    playerId: string,
    callback: (cards: Card[], initialCards?: Card[]) => void
  ): () => void {
    const key = `${roomId}_${playerId}`;
    if (!this.handListeners.has(key)) {
      this.handListeners.set(key, new Set());
    }
    const set = this.handListeners.get(key)!;
    set.add(callback as any);

    const room = this.getRoomFromStorage(roomId);
    const hand = this.getHandFromStorage(roomId, playerId);
    const initHand = this.getInitialHandFromStorage(roomId, playerId);
    const cardsToEmit = (room?.status === 'trump_selection' && initHand.length > 0) ? initHand : hand;
    callback(cardsToEmit, initHand);

    return () => {
      set.delete(callback as any);
      if (set.size === 0) {
        this.handListeners.delete(key);
      }
    };
  }

  public clearAll(): void {
    this.storage.clear();
  }
}

export const localSimulator = new LocalSimulatorService();
