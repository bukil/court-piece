import type { ReactionInput } from '../types/game';
import type { PlayerProfile } from '../types/game';
// Online-only transport; the cloud module is loaded once and reused.
const loadCloudService = async () => {
  const module = await import('./firestoreService');
  if (typeof window !== 'undefined') await (await import('./authService')).authService.getOnlineIdentity();
  return module.firestoreService;
};
let cloudService: ReturnType<typeof loadCloudService> | undefined;
const getCloudService = () => cloudService ??= loadCloudService().catch(error => { cloudService = undefined; throw error; });
import type { RoomDocument, Card, SeatIndex, Suit, ChatMessage } from '../types/game';

class RoomService {
  public async createRoom(host: PlayerProfile): Promise<RoomDocument> {
    return (await getCloudService()).createRoom(host);
  }

  public async joinRoom(roomCode: string, player: PlayerProfile): Promise<{ room: RoomDocument; seatIndex: SeatIndex }> {
    return (await getCloudService()).joinRoom(roomCode, player);
  }

  public async startGame(roomId: string, callerId: string): Promise<void> {
    return await (await getCloudService()).startGame(roomId, callerId);
  }

  public async selectTrump(roomId: string, callerId: string, suit: Suit): Promise<void> {
    return await (await getCloudService()).selectTrump(roomId, callerId, suit);
  }

  public async playCard(roomId: string, callerId: string, card: Card): Promise<void> {
    return await (await getCloudService()).playCard(roomId, callerId, card);
  }

  public async updatePresence(roomId: string, playerId: string, connectionId: string, online: boolean): Promise<void> {
    return (await getCloudService()).updatePresence(roomId, playerId, connectionId, online);
  }

  public async expireTurn(roomId: string, requesterId: string, expectedTurn: string): Promise<boolean> {
    return (await getCloudService()).expireTurn(roomId, requesterId, expectedTurn);
  }

  public async startNextDeal(roomId: string, callerId: string): Promise<void> {
    return await (await getCloudService()).startNextDeal(roomId, callerId);
  }

  public async requestRematch(roomId: string, callerId: string): Promise<void> {
    return await (await getCloudService()).requestRematch(roomId, callerId);
  }

  public async sendReaction(roomId: string, callerId: string, reaction: ReactionInput): Promise<void> {
    return (await getCloudService()).sendReaction(roomId, callerId, reaction);
  }

  public async sendChatMessage(
    roomId: string,
    message: Omit<ChatMessage, 'id' | 'timestamp'>
  ): Promise<void> {
    return (await getCloudService()).sendChatMessage(roomId, message);
  }

  public async leaveRoom(roomId: string, callerId: string): Promise<void> {
    return await (await getCloudService()).leaveRoom(roomId, callerId);
  }

  public subscribeRoom(roomId: string, callback: (room: RoomDocument | null) => void): () => void {
    let cancelled = false;
    let unsubscribe: (() => void) | undefined;
    getCloudService().then(service => {
      if (cancelled) return;
      unsubscribe = service.subscribeRoom(roomId, room => {
        if (cancelled) return;
        callback(room);
      });
    }).catch(error => {
      console.warn('[RoomService] Could not load room connection:', error);
      if (!cancelled) callback(null);
    });
    return () => { cancelled = true; unsubscribe?.(); };
  }

  public subscribePrivateHand(
    roomId: string,
    playerId: string,
    callback: (cards: Card[], initialCards?: Card[]) => void
  ): () => void {
    let cancelled = false;
    let unsubscribe: (() => void) | undefined;
    getCloudService().then(service => {
      if (!cancelled) unsubscribe = service.subscribePrivateHand(roomId, playerId, callback);
    }).catch(error => console.warn('[RoomService] Could not load private hand connection:', error));
    return () => { cancelled = true; unsubscribe?.(); };
  }
}

export const roomService = new RoomService();
