
import React, { useState, useEffect } from 'react';
import { Suit, Rank, SUIT_ORDER, RANK_ORDER, SUIT_NAMES } from '../types';

interface JokerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (suit: Suit, rank: Rank) => void;
  requiredSuit: Suit;
}

const JokerModal: React.FC<JokerModalProps> = ({ isOpen, onClose, onSelect, requiredSuit }) => {
  const [selectedSuit, setSelectedSuit] = useState<Suit>(requiredSuit);
  // Initialize with the first non-Joker rank
  const initialRank = RANK_ORDER.filter(r => r !== Rank.Joker)[0] || Rank.Two;
  const [selectedRank, setSelectedRank] = useState<Rank>(initialRank);

  useEffect(() => {
    setSelectedSuit(requiredSuit);
    if (isOpen) {
      const availableRanks = RANK_ORDER.filter(r => r !== Rank.Joker);
      if (availableRanks.length > 0 && !availableRanks.includes(selectedRank)) {
        setSelectedRank(availableRanks[0]);
      } else if (availableRanks.length === 0) {
        console.error("No available ranks for Joker selection");
      }
    }
  }, [requiredSuit, isOpen, selectedRank]); // added selectedRank to dependencies to avoid stale closure issues if rank initialization logic changes

  if (!isOpen) return null;

  const handleSubmit = () => {
    onSelect(selectedSuit, selectedRank);
    onClose();
  };

  const availableRanks = RANK_ORDER.filter(r => r !== Rank.Joker);

  return (
    <div className="fixed inset-0 modal-backdrop flex items-center justify-center z-50 p-4 transition-opacity duration-300 ease-in-out" onClick={onClose}>
      <div 
        className="modal-content p-6 sm:p-8 rounded-xl shadow-2xl w-full max-w-md transform transition-all duration-300 ease-in-out scale-95 opacity-0 animate-modalPopIn"
        onClick={(e) => e.stopPropagation()} // Prevent click inside modal from closing it
        role="dialog"
        aria-modal="true"
        aria-labelledby="joker-modal-title"
      >
        {/*FIX: Removed 'jsx' prop from style tag. The CSS content is standard and will be applied correctly.*/}
        <style>{`
          @keyframes modalPopIn {
            to {
              opacity: 1;
              transform: scale(1);
            }
          }
          .animate-modalPopIn {
            animation: modalPopIn 0.3s forwards;
          }
        `}</style>
        <h2 id="joker-modal-title" className="text-2xl sm:text-3xl font-bold mb-6 text-center text-cyan-400 font-orbitron text-shadow-cyan">Declare Joker Mutation</h2>
        
        <div className="mb-6">
          <label htmlFor="suit-select" className="block text-sm font-medium text-cyan-200 mb-1">Target Suit (Pathway Defined):</label>
          <div
            id="suit-select"
            className="w-full p-3 border border-cyan-600/50 rounded-lg shadow-sm text-lg bg-slate-700 text-cyan-300 cursor-not-allowed"
          >
            {SUIT_NAMES[selectedSuit]} ({selectedSuit})
          </div>
           <p className="text-xs text-slate-400 mt-1">Suit is determined by current pathway requirements.</p>
        </div>

        <div className="mb-8">
          <label htmlFor="rank-select" className="block text-sm font-medium text-cyan-200 mb-1">Select Encoded Rank:</label>
          <select
            id="rank-select"
            value={selectedRank}
            onChange={(e) => setSelectedRank(e.target.value as Rank)}
            className="w-full p-3 border border-cyan-600/50 rounded-lg shadow-sm focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 text-lg bg-slate-700 text-cyan-100 appearance-none"
            style={{backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 20 20\'%3E%3Cpath stroke=\'%234dd0e1\' stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'1.5\' d=\'M6 8l4 4 4-4\'/%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.75rem center', backgroundSize: '1.25em'}}
          >
            {availableRanks.map(r => <option key={r} value={r}>{r === Rank.Ten ? "10" : r}</option>)}
          </select>
        </div>

        <div className="flex flex-col sm:flex-row sm:justify-end space-y-3 sm:space-y-0 sm:space-x-3">
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-6 py-3 bg-slate-600 text-slate-100 rounded-lg hover:bg-slate-500 transition-colors font-medium text-lg interactive-glow-button"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="w-full sm:w-auto px-6 py-3 bg-cyan-600 text-white rounded-lg hover:bg-cyan-500 transition-colors font-medium text-lg interactive-glow-button"
          >
            Confirm Mutation
          </button>
        </div>
      </div>
    </div>
  );
};

export default JokerModal;