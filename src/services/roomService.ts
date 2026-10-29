import { isFirebaseConfigured } from './firebaseConfig';
import { localSimulator } from './localSimulator';
import { firestoreService } from './firestoreService';
import type { RoomDocument, Card, SeatIndex, Suit } from '../types/game';

class RoomService {
  private useSimulator(): boolean {
    if (typeof window !== 'undefined') {
      const forceSim = localStorage.getItem('codebase_force_simulator');
      if (forceSim === 'true') return true;
      if (forceSim === 'false') return false;
    }
    return !isFirebaseConfigured();
  }

  public getBackendMode(): 'firebase' | 'simulator' {
    return this.useSimulator() ? 'simulator' : 'firebase';
  }

  public setForceSimulator(enabled: boolean | null): void {
    if (enabled === null) {
      localStorage.removeItem('codebase_force_simulator');
    } else {
      localStorage.setItem('codebase_force_simulator', enabled ? 'true' : 'false');
    }
    window.location.reload();
  }

  public async createRoom(host: { id: string; nickname: string }): Promise<RoomDocument> {
    if (this.useSimulator()) {
      return localSimulator.createRoom(host);
    }
    try {
      return await firestoreService.createRoom(host);
    } catch (err) {
      console.warn('[RoomService] Firebase createRoom failed, falling back to local simulator:', err);
      return localSimulator.createRoom(host);
    }
  }

  public async joinRoom(
    roomCode: string,
    player: { id: string; nickname: string }
  ): Promise<{ room: RoomDocument; seatIndex: SeatIndex }> {
    if (this.useSimulator()) {
      return localSimulator.joinRoom(roomCode, player);
    }
    try {
      return await firestoreService.joinRoom(roomCode, player);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '';
      if (
        msg.includes('permission') ||
        msg.includes('insufficient') ||
        msg.includes('not found') ||
        msg.includes('offline')
      ) {
        console.warn('[RoomService] Firebase joinRoom error, checking local simulator:', err);
        return await localSimulator.joinRoom(roomCode, player);
      }
      throw err;
    }
  }

  public async startGame(roomId: string, callerId: string): Promise<void> {
    if (this.useSimulator()) {
      return localSimulator.startGame(roomId, callerId);
    }
    return await firestoreService.startGame(roomId, callerId);
  }

  public async selectTrump(roomId: string, callerId: string, suit: Suit): Promise<void> {
    if (this.useSimulator()) {
      return localSimulator.selectTrump(roomId, callerId, suit);
    }
    return await firestoreService.selectTrump(roomId, callerId, suit);
  }

  public async playCard(roomId: string, callerId: string, card: Card): Promise<void> {
    if (this.useSimulator()) {
      return localSimulator.playCard(roomId, callerId, card);
    }
    return await firestoreService.playCard(roomId, callerId, card);
  }

  public async startNextDeal(roomId: string, callerId: string): Promise<void> {
    if (this.useSimulator()) {
      return localSimulator.startNextDeal(roomId, callerId);
    }
    return await firestoreService.startNextDeal(roomId, callerId);
  }

  public async requestRematch(roomId: string, callerId: string): Promise<void> {
    if (this.useSimulator()) {
      return localSimulator.requestRematch(roomId, callerId);
    }
    return await firestoreService.requestRematch(roomId, callerId);
  }

  public async sendReaction(roomId: string, callerId: string, emoji: string): Promise<void> {
    if (this.useSimulator()) {
      return localSimulator.sendReaction(roomId, callerId, emoji);
    }
    return firestoreService.sendReaction(roomId, callerId, emoji);
  }

  public async leaveRoom(roomId: string, callerId: string): Promise<void> {
    if (this.useSimulator()) {
      return localSimulator.leaveRoom(roomId, callerId);
    }
    return await firestoreService.leaveRoom(roomId, callerId);
  }

  public subscribeRoom(roomId: string, callback: (room: RoomDocument | null) => void): () => void {
    if (this.useSimulator()) {
      return localSimulator.subscribeRoom(roomId, callback);
    }
    return firestoreService.subscribeRoom(roomId, (room) => {
      if (room) {
        callback(room);
      } else {
        // Check simulator as well
        localSimulator.subscribeRoom(roomId, callback);
      }
    });
  }

  public subscribePrivateHand(
    roomId: string,
    playerId: string,
    callback: (cards: Card[], initialCards?: Card[]) => void
  ): () => void {
    if (this.useSimulator()) {
      return localSimulator.subscribePrivateHand(roomId, playerId, callback);
    }
    return firestoreService.subscribePrivateHand(roomId, playerId, callback);
  }
}

export const roomService = new RoomService();
