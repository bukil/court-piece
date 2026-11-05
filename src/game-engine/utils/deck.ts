import type { Card, Suit, Rank } from '../../types/game';

// One display order for suit choices, trump previews, and every player's hand.
export const SUITS: Suit[] = ['spades', 'hearts', 'clubs', 'diamonds'];
export const RANKS: Rank[] = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];

export const RANK_VALUES: Record<Rank, number> = {
  '2': 2,
  '3': 3,
  '4': 4,
  '5': 5,
  '6': 6,
  '7': 7,
  '8': 8,
  '9': 9,
  '10': 10,
  'J': 11,
  'Q': 12,
  'K': 13,
  'A': 14,
};

export const SUIT_SYMBOLS: Record<Suit, string> = {
  spades: '♠', // taste-skill-ignore
  hearts: '♥', // taste-skill-ignore
  diamonds: '♦', // taste-skill-ignore
  clubs: '♣', // taste-skill-ignore
};

export const SUIT_COLORS: Record<Suit, string> = {
  spades: '#1e293b',
  hearts: '#e11d48',
  diamonds: '#ea580c',
  clubs: '#0f172a',
};

export function createStandardDeck(): Card[] {
  const deck: Card[] = [];
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      deck.push({
        id: `${suit[0].toUpperCase()}-${rank}`,
        suit,
        rank,
        value: RANK_VALUES[rank],
      });
    }
  }
  return deck;
}

export function sortHand(cards: Card[]): Card[] {
  return [...cards].sort((a, b) => {
    if (a.suit !== b.suit) {
      return SUITS.indexOf(a.suit) - SUITS.indexOf(b.suit);
    }
    return a.value - b.value;
  });
}

