import type { Card, SeatIndex, TeamId, PublicGameState, Trick } from '../types/game';

export interface DeckConfig {
  suits: Card['suit'][];
  ranks: Card['rank'][];
  totalCards: number;
  cardsPerPlayer: number;
}

export interface MoveValidationResult {
  isValid: boolean;
  reason?: string;
}

export interface TrickResolutionResult {
  winnerSeatIndex: SeatIndex;
  winnerPlayerId: string;
  winnerTeamId: TeamId;
  pointsEarned: number;
  completedTrick: Trick;
  isRoundComplete: boolean;
  nextLeadSeatIndex: SeatIndex;
}

export interface GameOverResult {
  isGameOver: boolean;
  winnerTeamId?: TeamId;
  reason?: string;
}

export interface DealResult {
  hands: Record<SeatIndex, Card[]>;
  drawPile?: Card[];
}

export interface GameEngine {
  readonly id: string;
  readonly name: string;
  readonly version: string;
  readonly isOfficialRules: boolean;
  readonly description: string;

  getDeckConfig(): DeckConfig;
  createDeck(): Card[];
  dealCards(deck: Card[]): DealResult;
  determineStartingPlayer(dealerSeatIndex: SeatIndex): SeatIndex;
  validateMove(
    gameState: PublicGameState,
    privateHand: Card[],
    playerSeatIndex: SeatIndex,
    card: Card
  ): MoveValidationResult;
  resolveTrick(currentTrick: Trick): TrickResolutionResult;
  checkGameOver(gameState: PublicGameState): GameOverResult;
}

