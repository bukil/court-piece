export type Suit = 'spades' | 'hearts' | 'diamonds' | 'clubs';
export type Rank = '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K' | 'A';

export interface Card {
  id: string; // e.g. "S-A" or "H-10"
  suit: Suit;
  rank: Rank;
  value: number; // numeric value for ranking: 2=2 ... A=14
}

export type SeatIndex = 0 | 1 | 2 | 3;
export type TeamId = 0 | 1; // Team 0 = Seats 0 & 2 (Team Alpha); Team 1 = Seats 1 & 3 (Team Beta)

export type RelativePosition = 'bottom' | 'left' | 'top' | 'right';

export interface Player {
  id: string;
  nickname: string;
  seatIndex: SeatIndex;
  teamId: TeamId;
  isHost: boolean;
  isConnected: boolean;
  lastSeen: number;
}

export type RoomStatus =
  | 'waiting'          // Lobby: waiting for 4 players
  | 'starting'         // Transitioning
  | 'trump_selection'  // Caller holds initial 5 cards and selects trump
  | 'playing'          // Active trick-taking gameplay
  | 'deal_complete'    // First team reached 7 tricks; deal won
  | 'match_complete'   // A team reached match target (default 7 deals)
  | 'abandoned';       // Room closed / expired

export interface PlayedCard {
  playerId: string;
  seatIndex: SeatIndex;
  card: Card;
  playedAt: number;
}

export interface Trick {
  leadSuit?: Suit;
  cards: PlayedCard[];
  winnerPlayerId?: string;
  winnerSeatIndex?: SeatIndex;
}

export interface TeamScore {
  tricksWon: number; // in current deal (first to 7 wins deal)
}

export interface PublicGameState {
  currentDeal: number;
  dealerSeatIndex: SeatIndex;
  trumpCallerSeatIndex: SeatIndex;
  trumpSuit: Suit | null;
  currentTurnSeatIndex: SeatIndex;
  currentTrick: Trick;
  completedTricks: Trick[];
  teamDealScores: [TeamScore, TeamScore]; // Team 0 & Team 1 tricks in current deal
  matchScores: [number, number];          // Team 0 & Team 1 cumulative match points
  matchTarget: number;                   // Default 7 match points
  remainingCardCounts: [number, number, number, number]; // Seats 0..3
  lastMoveNotice?: string;
  status: RoomStatus;
  dealWinnerTeamId?: TeamId;
  matchWinnerTeamId?: TeamId;
  version: number;
}

export interface RoomDocument {
  id: string;
  code: string; // 6-char room code
  createdAt: number;
  updatedAt: number;
  status: RoomStatus;
  hostPlayerId: string;
  seats: (Player | null)[]; // Array of 4 seats: 0..3
  gameState: PublicGameState | null;
  ruleEngineId: string;
  isOfficialRules: boolean;
  version: number;
}

export interface PrivateHandDocument {
  playerId: string;
  cards: Card[];
  updatedAt: number;
}
