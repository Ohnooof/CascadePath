import React from 'react';
import { Card, Suit, Rank } from '../types';

interface CardViewProps {
  card: Card | null;
  onClick?: () => void;
  isSelected?: boolean;
  className?: string;
  isPlaceholder?: boolean;
  compact?: boolean; // For displaying opponent cards etc.
}

const CardView: React.FC<CardViewProps> = ({ card, onClick, isSelected, className, isPlaceholder, compact }) => {
  if (isPlaceholder || !card) {
    return (
      <div className={`w-24 h-36 sm:w-28 sm:h-40 md:w-32 md:h-44 rounded-lg border-2 border-dashed border-cyan-700/50 bg-slate-700/30 flex items-center justify-center text-cyan-400/70 ${className}`}>
        <span className="text-sm">Empty Slot</span>
      </div>
    );
  }

  const { suit, rank, isWild, declaredSuit, declaredRank } = card;
  const displayRank = isWild && declaredRank ? declaredRank : rank;
  const displaySuit = isWild && declaredSuit ? declaredSuit : suit;

  const suitColorClass = (s: Suit): string => {
    switch (s) {
      case Suit.Hearts: return 'text-pink-400'; // Transducers - more vibrant
      case Suit.Diamonds: return 'text-sky-400';   // Receptors - cool blue
      case Suit.Clubs: return 'text-green-400'; // Ligands - biological green
      case Suit.Spades: return 'text-amber-400';  // Responses - distinct
      default: return 'text-slate-300';
    }
  };
  
  const suitBgClass = (s: Suit): string => {
    switch (s) {
      case Suit.Clubs: return 'suit-clubs-bg';
      case Suit.Diamonds: return 'suit-diamonds-bg';
      case Suit.Hearts: return 'suit-hearts-bg';
      case Suit.Spades: return 'suit-spades-bg';
      default: return '';
    }
  };

  let cardContentRank = displayRank === Rank.Ten ? "10" : displayRank;
  if (isWild && rank === Rank.Joker) {
    cardContentRank = declaredRank ? (declaredRank === Rank.Ten ? "10" : declaredRank) : "X";
  }

  if (compact) {
    return (
       <div className={`w-10 h-14 sm:w-12 sm:h-16 card-base ${suitBgClass(displaySuit)} ${isSelected ? 'card-selected' : ''} ${className} flex flex-col items-center justify-center p-1 shadow-md`}>
        <div className={`text-xl font-bold ${suitColorClass(displaySuit)}`}>{cardContentRank === Rank.Joker ? 'Jk' : cardContentRank[0]}</div>
        <div className={`text-2xl ${suitColorClass(displaySuit)}`}>{displaySuit}</div>
      </div>
    );
  }

  return (
    <div
      className={`card-base w-24 h-36 sm:w-28 sm:h-40 md:w-32 md:h-44 p-2 flex flex-col justify-between items-center cursor-pointer ${suitBgClass(displaySuit)} ${isSelected ? 'card-selected' : ''} ${className}`}
      onClick={onClick}
      role="button"
      aria-pressed={isSelected}
      aria-label={`Card ${displayRank} of ${displaySuit}`}
    >
      <div className={`self-start text-2xl sm:text-3xl font-bold ${suitColorClass(displaySuit)}`}>{cardContentRank}</div>
      <div className={`text-5xl sm:text-6xl ${suitColorClass(displaySuit)}`}>
        {isWild && rank === Rank.Joker && !declaredSuit ? '🧬' : displaySuit} {/* DNA Helix for undeclared Joker */}
      </div>
      <div className={`self-end text-2xl sm:text-3xl font-bold transform rotate-180 ${suitColorClass(displaySuit)}`}>{cardContentRank}</div>
    </div>
  );
};

export default CardView;