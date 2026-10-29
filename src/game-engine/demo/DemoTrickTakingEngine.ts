import type { Card, SeatIndex, TeamId, PublicGameState, Trick } from '../../types/game';
import type {
  GameEngine,
  DeckConfig,
  DealResult,
  MoveValidationResult,
  TrickResolutionResult,
  GameOverResult,
} from '../types';
import { createStandardDeck, sortHand } from '../utils/deck';
import { secureShuffle } from '../utils/shuffle';

export class DemoTrickTakingEngine implements GameEngine {
  public readonly id = 'demo-trick-taking-v1';
  public readonly name = 'Demo Trick-Taking Engine';
  public readonly version = '1.0.0-demo';
  public readonly isOfficialRules = false;
  public readonly description =
    'Configurable demo trick-taking engine used while awaiting official Codebase card rules confirmation. All moves and hand privacy are enforced server-authoritatively.';

  public getDeckConfig(): DeckConfig {
    return {
      suits: ['spades', 'hearts', 'diamonds', 'clubs'],
      ranks: ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'],
      totalCards: 52,
      cardsPerPlayer: 13,
    };
  }

  public createDeck(): Card[] {
    return createStandardDeck();
  }

  public dealCards(deck: Card[]): DealResult {
    const shuffled = secureShuffle(deck);
    const hands: Record<SeatIndex, Card[]> = {
      0: sortHand(shuffled.slice(0, 13)),
      1: sortHand(shuffled.slice(13, 26)),
      2: sortHand(shuffled.slice(26, 39)),
      3: sortHand(shuffled.slice(39, 52)),
    };
    return { hands };
  }

  public determineStartingPlayer(dealerSeatIndex: SeatIndex): SeatIndex {
    // Clockwise from dealer
    return ((dealerSeatIndex + 1) % 4) as SeatIndex;
  }

  public validateMove(
    gameState: PublicGameState,
    privateHand: Card[],
    playerSeatIndex: SeatIndex,
    card: Card
  ): MoveValidationResult {
    if (gameState.status !== 'playing') {
      return { isValid: false, reason: `Game is in state '${gameState.status}', not 'playing'.` };
    }

    if (gameState.currentTurnSeatIndex !== playerSeatIndex) {
      return {
        isValid: false,
        reason: `It is not your turn! Current turn is Seat ${gameState.currentTurnSeatIndex}.`,
      };
    }

    const hasCard = privateHand.some((c) => c.id === card.id);
    if (!hasCard) {
      return { isValid: false, reason: 'You do not hold this card in your private hand.' };
    }

    // Lead card in trick
    const trick = gameState.currentTrick;
    if (!trick.leadSuit || trick.cards.length === 0) {
      return { isValid: true };
    }

    // Must follow lead suit if the player has any card in that suit
    if (card.suit !== trick.leadSuit) {
      const hasLeadSuit = privateHand.some((c) => c.suit === trick.leadSuit);
      if (hasLeadSuit) {
        return {
          isValid: false,
          reason: `Must follow lead suit: ${trick.leadSuit}. You still hold cards in that suit.`,
        };
      }
    }

    return { isValid: true };
  }

  public resolveTrick(currentTrick: Trick): TrickResolutionResult {
    if (currentTrick.cards.length !== 4) {
      throw new Error(`Cannot resolve trick with ${currentTrick.cards.length} cards (expected 4).`);
    }

    const leadSuit = currentTrick.leadSuit || currentTrick.cards[0].card.suit;

    // Highest card of the lead suit wins
    let winningCard = currentTrick.cards[0];
    for (let i = 1; i < currentTrick.cards.length; i++) {
      const candidate = currentTrick.cards[i];
      if (candidate.card.suit === leadSuit && candidate.card.value > winningCard.card.value) {
        winningCard = candidate;
      }
    }

    const winnerSeatIndex = winningCard.seatIndex;
    const winnerPlayerId = winningCard.playerId;
    // Team 0: Seats 0 & 2; Team 1: Seats 1 & 3
    const winnerTeamId: TeamId = (winnerSeatIndex % 2) as TeamId;

    const completedTrick: Trick = {
      ...currentTrick,
      leadSuit,
      winnerPlayerId,
      winnerSeatIndex,
    };

    return {
      winnerSeatIndex,
      winnerPlayerId,
      winnerTeamId,
      pointsEarned: 1, // 1 trick won
      completedTrick,
      isRoundComplete: false, // will be evaluated based on total completed tricks (13)
      nextLeadSeatIndex: winnerSeatIndex,
    };
  }

  public checkGameOver(gameState: PublicGameState): GameOverResult {
    // 13 tricks in a standard 52-card deal
    const totalTricks = gameState.completedTricks.length;
    if (totalTricks >= 13) {
      const team0 = gameState.teamDealScores[0].tricksWon;
      const team1 = gameState.teamDealScores[1].tricksWon;
      let winnerTeamId: TeamId | undefined;
      if (team0 > team1) {
        winnerTeamId = 0;
      } else if (team1 > team0) {
        winnerTeamId = 1;
      }
      return {
        isGameOver: true,
        winnerTeamId,
        reason: `All 13 tricks completed. Team 0: ${team0} tricks, Team 1: ${team1} tricks.`,
      };
    }

    return { isGameOver: false };
  }
}

export const defaultEngine = new DemoTrickTakingEngine();

