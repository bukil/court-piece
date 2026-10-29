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
    return firestoreService.createRoom(host);
  }

  public async joinRoom(
    roomCode: string,
    player: { id: string; nickname: string }
  ): Promise<{ room: RoomDocument; seatIndex: SeatIndex }> {
    if (this.useSimulator()) {
      return localSimulator.joinRoom(roomCode, player);
    }
    return firestoreService.joinRoom(roomCode, player);
  }

  public async startGame(roomId: string, callerId: string): Promise<void> {
    if (this.useSimulator()) {
      return localSimulator.startGame(roomId, callerId);
    }
    return firestoreService.startGame(roomId, callerId);
  }

  public async selectTrump(roomId: string, callerId: string, suit: Suit): Promise<void> {
    if (this.useSimulator()) {
      return localSimulator.selectTrump(roomId, callerId, suit);
    }
    return firestoreService.selectTrump(roomId, callerId, suit);
  }

  public async playCard(roomId: string, callerId: string, card: Card): Promise<void> {
    if (this.useSimulator()) {
      return localSimulator.playCard(roomId, callerId, card);
    }
    return firestoreService.playCard(roomId, callerId, card);
  }

  public async startNextDeal(roomId: string, callerId: string): Promise<void> {
    if (this.useSimulator()) {
      return localSimulator.startNextDeal(roomId, callerId);
    }
    return firestoreService.startNextDeal(roomId, callerId);
  }

  public async requestRematch(roomId: string, callerId: string): Promise<void> {
    if (this.useSimulator()) {
      return localSimulator.requestRematch(roomId, callerId);
    }
    return firestoreService.requestRematch(roomId, callerId);
  }

  public async leaveRoom(roomId: string, callerId: string): Promise<void> {
    if (this.useSimulator()) {
      return localSimulator.leaveRoom(roomId, callerId);
    }
    return firestoreService.leaveRoom(roomId, callerId);
  }

  public subscribeRoom(roomId: string, callback: (room: RoomDocument) => void): () => void {
    if (this.useSimulator()) {
      return localSimulator.subscribeRoom(roomId, callback);
    }
    return firestoreService.subscribeRoom(roomId, callback);
  }

  public subscribePrivateHand(
    roomId: string,
    playerId: string,
    callback: (cards: Card[]) => void
  ): () => void {
    if (this.useSimulator()) {
      return localSimulator.subscribePrivateHand(roomId, playerId, callback);
    }
    return firestoreService.subscribePrivateHand(roomId, playerId, callback);
  }
}

export const roomService = new RoomService();
