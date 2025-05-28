export enum Suit {
  Clubs = '♣',
  Diamonds = '♦',
  Hearts = '♥',
  Spades = '♠',
}

export enum Rank {
  Two = '2', Three = '3', Four = '4', Five = '5', Six = '6', Seven = '7', Eight = '8', Nine = '9', Ten = '10',
  Jack = 'J', Queen = 'Q', King = 'K', Ace = 'A', Joker = 'X'
}

export interface Card {
  id: string;
  suit: Suit;
  rank: Rank;
  isWild?: boolean; // For Joker
  declaredSuit?: Suit; // What suit Joker represents
  declaredRank?: Rank; // What rank Joker represents
}

export interface Player {
  id: string;
  name: string;
  hand: Card[];
}

export interface AceMutationState {
  isActive: boolean;
  forcedSuit: Suit; // The suit of the Ace that was played (must be non-null if active)
  cardsToPlay: number;
  pathwaySuitAfterMutation: Suit; // Suit to expect after mutation completes (suit after Ace's suit, or Clubs if Ace of Spades)
}

export interface JokerSelectionState {
  isSelecting: boolean;
  cardId: string | null; // ID of the Joker being configured
  requiredSuit: Suit; // The suit the Joker MUST be declared as (never null)
}

export const SUIT_ORDER: Suit[] = [Suit.Clubs, Suit.Diamonds, Suit.Hearts, Suit.Spades];
export const RANK_ORDER: Rank[] = [Rank.Two, Rank.Three, Rank.Four, Rank.Five, Rank.Six, Rank.Seven, Rank.Eight, Rank.Nine, Rank.Ten, Rank.Jack, Rank.Queen, Rank.King, Rank.Ace];

export const SUIT_NAMES: Record<Suit, string> = {
  [Suit.Clubs]: "Ligands (Clubs ♣)",
  [Suit.Diamonds]: "Receptors (Diamonds ♦)",
  [Suit.Hearts]: "Transducers (Hearts ♥)",
  [Suit.Spades]: "Responses (Spades ♠)",
};

export const SPECIAL_CARD_EFFECTS: Record<Rank, string> = {
  [Rank.Jack]: "Jack (Reverse): Reverses play direction. The next player continues the pathway by playing the normally expected next suit.",
  [Rank.Queen]: "Queen (Scaffold): Play this Queen, then play multiple additional cards of the Queen's suit.",
  [Rank.King]: "King (Inhibit): Skips the next player's turn.",
  [Rank.Ace]: "Ace (Mutate): Forces the next 3 cards played to be of the SAME SUIT AS THE ACE. After these 3 cards, the pathway continues from the suit following the Ace's suit (or starts a new pathway with Clubs if Ace of Spades was played).",
  [Rank.Joker]: "Joker (Wild): Can be played as any rank. Its suit is determined by the current game state (expected suit, Ace mutation, or Clubs for new pathway).",
  [Rank.Two]: "", [Rank.Three]: "", [Rank.Four]: "", [Rank.Five]: "", [Rank.Six]: "", [Rank.Seven]: "", [Rank.Eight]: "", [Rank.Nine]: "", [Rank.Ten]: "", 
};

export const JOKER_COUNT = 2;
// NUM_PLAYERS is now managed in App.tsx state.
// 54 cards (52 + 2 Jokers) can be distributed among 2, 3, 6 players evenly.
// For 4 players: 2 players get 14 cards, 2 players get 13 cards.
// For 5 players: 4 players get 11 cards, 1 player gets 10 cards.
// The dealing logic (index % numPlayers) handles uneven distribution automatically.