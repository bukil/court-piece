import type {
  Card,
  SeatIndex,
  TeamId,
  PublicGameState,
  Trick,
} from '../../types/game';
import { createStandardDeck, sortHand } from '../utils/deck';
import { secureShuffle } from '../utils/shuffle';

export interface StagedDealResult {
  phase1Hands: Record<SeatIndex, Card[]>; // 5 cards each
  remainingDeck: Card[];                  // 32 cards reserved for phase 2
}

export interface CompleteDealResult {
  fullHands: Record<SeatIndex, Card[]>;   // 13 cards each
}

export interface MoveValidationResult {
  isValid: boolean;
  reason?: string;
}

export interface TrickResolutionResult {
  winnerSeatIndex: SeatIndex;
  winnerPlayerId: string;
  winnerTeamId: TeamId;
  completedTrick: Trick;
  isDealComplete: boolean;
  dealWinnerTeamId?: TeamId;
  isMatchComplete: boolean;
  matchWinnerTeamId?: TeamId;
  nextLeadSeatIndex: SeatIndex;
}

export class CourtPieceEngine {
  public readonly id = 'court-piece-single-sir-v1';
  public readonly name = 'Court Piece (Single Sir)';
  public readonly version = '1.0.0-official';
  public readonly isOfficialRules = true;
  public readonly description =
    'Official Single Sir Court Piece for 4 players in 2 teams of 2. Features staged 5-4-4 dealing, trump caller selection from first 5 cards, strict follow-suit enforcement, trump priority, immediate trick collection, and first to 7 tricks deal win.';

  public createDeck(): Card[] {
    return createStandardDeck();
  }

  /**
   * Selects initial dealer randomly or defaults to Seat 0.
   */
  public selectInitialDealer(): SeatIndex {
    return Math.floor(Math.random() * 4) as SeatIndex;
  }

  /**
   * In Court Piece, the Trump Caller (Sayed) is traditionally the player clockwise to the dealer.
   */
  public getTrumpCaller(dealerSeatIndex: SeatIndex): SeatIndex {
    return ((dealerSeatIndex + 1) % 4) as SeatIndex;
  }

  /**
   * Computes the next dealer after a deal completes.
   * Standard Court Piece rule:
   * - If the dealer's team wins the deal, the dealer retains the deal.
   * - If the dealer's team loses the deal, the deal passes clockwise to the next player.
   */
  public getNextDealer(currentDealer: SeatIndex, winningTeamId: TeamId): SeatIndex {
    const dealerTeamId: TeamId = (currentDealer % 2) as TeamId;
    if (dealerTeamId === winningTeamId) {
      return currentDealer;
    }
    return ((currentDealer + 1) % 4) as SeatIndex;
  }

  /**
   * Deals Stage 1: Exactly 5 cards to each of the 4 players (20 cards total).
   * The remaining 32 cards are kept securely in server reserve.
   */
  public dealInitialFiveCards(deck: Card[]): StagedDealResult {
    const shuffled = secureShuffle(deck);

    // Staged dealing sequence: 5 cards per player
    const phase1Hands: Record<SeatIndex, Card[]> = {
      0: sortHand(shuffled.slice(0, 5)),
      1: sortHand(shuffled.slice(5, 10)),
      2: sortHand(shuffled.slice(10, 15)),
      3: sortHand(shuffled.slice(15, 20)),
    };

    const remainingDeck = shuffled.slice(20, 52); // Exactly 32 cards left
    return { phase1Hands, remainingDeck };
  }

  /**
   * Deals Stage 2: Distributes the remaining 32 cards (4 cards each, then 4 cards each = 8 more each).
   * Brings every player's hand to exactly 13 cards.
   */
  public completeRemainingDeal(
    initialHands: Record<SeatIndex, Card[]>,
    remainingDeck: Card[]
  ): CompleteDealResult {
    if (remainingDeck.length !== 32) {
      throw new Error(`Expected exactly 32 remaining cards for Stage 2 deal, got ${remainingDeck.length}.`);
    }

    // Batch 1: 4 cards each (indices 0..15)
    // Batch 2: 4 cards each (indices 16..31)
    const fullHands: Record<SeatIndex, Card[]> = {
      0: sortHand([...initialHands[0], ...remainingDeck.slice(0, 4), ...remainingDeck.slice(16, 20)]),
      1: sortHand([...initialHands[1], ...remainingDeck.slice(4, 8), ...remainingDeck.slice(20, 24)]),
      2: sortHand([...initialHands[2], ...remainingDeck.slice(8, 12), ...remainingDeck.slice(24, 28)]),
      3: sortHand([...initialHands[3], ...remainingDeck.slice(12, 16), ...remainingDeck.slice(28, 32)]),
    };

    return { fullHands };
  }

  /**
   * Validates legal card play according to Court Piece rules:
   * - Must be player's turn
   * - Player must hold card
   * - If player holds any card in led suit, they MUST follow led suit
   * - If void in led suit, player may play any card (trump or discard)
   */
  public validateMove(
    gameState: PublicGameState,
    privateHand: Card[],
    playerSeatIndex: SeatIndex,
    card: Card
  ): MoveValidationResult {
    if (gameState.status !== 'playing') {
      return { isValid: false, reason: `Game is in status '${gameState.status}', not 'playing'.` };
    }

    if (gameState.currentTurnSeatIndex !== playerSeatIndex) {
      return {
        isValid: false,
        reason: `It is not your turn! Current turn: Seat ${playerSeatIndex + 1}.`,
      };
    }

    const hasCard = privateHand.some((c) => c.id === card.id);
    if (!hasCard) {
      return { isValid: false, reason: 'You do not hold this card in your private hand.' };
    }

    const trick = gameState.currentTrick;
    // Lead card in trick
    if (!trick.leadSuit || trick.cards.length === 0) {
      return { isValid: true };
    }

    // Must follow led suit if player has at least one card in that suit
    if (card.suit !== trick.leadSuit) {
      const hasLedSuit = privateHand.some((c) => c.suit === trick.leadSuit);
      if (hasLedSuit) {
        return {
          isValid: false,
          reason: `Must follow led suit: ${trick.leadSuit}. You still hold cards in that suit.`,
        };
      }
    }

    return { isValid: true };
  }

  /**
   * Resolves a completed 4-card trick according to Single Sir rules:
   * 1. If any trump cards were played, the highest-ranking trump wins.
   * 2. Otherwise, the highest-ranking card of the led suit wins.
   * 3. Non-trump off-suit cards cannot win.
   * 4. Trick is collected immediately by the winner's team.
   * 5. If a team reaches 7 tricks, the deal ends immediately.
   */
  public resolveTrick(gameState: PublicGameState): TrickResolutionResult {
    const currentTrick = gameState.currentTrick;
    if (currentTrick.cards.length !== 4) {
      throw new Error(`Cannot resolve trick with ${currentTrick.cards.length} cards (expected 4).`);
    }

    const leadSuit = currentTrick.leadSuit || currentTrick.cards[0].card.suit;
    const trumpSuit = gameState.trumpSuit;

    // Filter trump cards played
    const trumpPlays = trumpSuit
      ? currentTrick.cards.filter((p) => p.card.suit === trumpSuit)
      : [];

    let winningPlay = currentTrick.cards[0];

    if (trumpPlays.length > 0) {
      // Highest trump wins
      winningPlay = trumpPlays.reduce((highest, current) =>
        current.card.value > highest.card.value ? current : highest
      );
    } else {
      // Highest card of the led suit wins
      const ledSuitPlays = currentTrick.cards.filter((p) => p.card.suit === leadSuit);
      winningPlay = ledSuitPlays.reduce((highest, current) =>
        current.card.value > highest.card.value ? current : highest
      );
    }

    const winnerSeatIndex = winningPlay.seatIndex;
    const winnerPlayerId = winningPlay.playerId;
    const winnerTeamId: TeamId = (winnerSeatIndex % 2) as TeamId;

    const completedTrick: Trick = {
      ...currentTrick,
      leadSuit,
      winnerPlayerId,
      winnerSeatIndex,
    };

    // Calculate new trick counts for deal
    const team0Tricks = gameState.teamDealScores[0].tricksWon + (winnerTeamId === 0 ? 1 : 0);
    const team1Tricks = gameState.teamDealScores[1].tricksWon + (winnerTeamId === 1 ? 1 : 0);

    // In Single Sir Court Piece, first team to reach 7 tricks wins the deal immediately!
    let isDealComplete = false;
    let dealWinnerTeamId: TeamId | undefined;
    let isMatchComplete = false;
    let matchWinnerTeamId: TeamId | undefined;

    if (team0Tricks >= 7) {
      isDealComplete = true;
      dealWinnerTeamId = 0;
    } else if (team1Tricks >= 7) {
      isDealComplete = true;
      dealWinnerTeamId = 1;
    } else if (gameState.completedTricks.length + 1 >= 13) {
      // Safety check: All 13 tricks played without either team reaching 7 is impossible (since 7+6=13)
      throw new Error(
        `Invariant violation: 13 tricks completed without a team reaching 7. Scores: Team 0=${team0Tricks}, Team 1=${team1Tricks}.`
      );
    }

    if (isDealComplete && dealWinnerTeamId !== undefined) {
      const newMatchScore = gameState.matchScores[dealWinnerTeamId] + 1;
      if (newMatchScore >= gameState.matchTarget) {
        isMatchComplete = true;
        matchWinnerTeamId = dealWinnerTeamId;
      }
    }

    return {
      winnerSeatIndex,
      winnerPlayerId,
      winnerTeamId,
      completedTrick,
      isDealComplete,
      dealWinnerTeamId,
      isMatchComplete,
      matchWinnerTeamId,
      nextLeadSeatIndex: winnerSeatIndex,
    };
  }
}

export const courtPieceEngine = new CourtPieceEngine();
