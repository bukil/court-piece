import React from 'react';
import { Modal } from './Modal';
import { courtPieceEngine } from '../../game-engine/court-piece/CourtPieceEngine';

interface RulesNoticeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RulesNoticeModal: React.FC<RulesNoticeModalProps> = ({ isOpen, onClose }) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Court Piece (Single Sir) Rules">
      <div className="space-y-4 text-xs text-neutral-300">
        <div className="p-3 rounded-xl bg-neutral-800 text-neutral-200">
          <div className="font-medium text-white mb-1">
            Rules: {courtPieceEngine.name}
          </div>
          <p className="text-neutral-400 leading-relaxed">
            All moves, dealing sequences, and hand privacy are enforced authoritatively.
          </p>
        </div>

        <div>
          <h4 className="font-medium text-white mb-1 text-xs">
            Game Setup & Dealing (5-4-4)
          </h4>
          <ul className="list-disc list-inside space-y-1 text-neutral-400">
            <li><strong>Players:</strong> 4 players in 2 fixed teams of 2. Partners sit opposite.</li>
            <li><strong>Deck:</strong> Standard 52 cards, Ace high to 2 low.</li>
            <li><strong>Stage 1:</strong> Each player receives 5 cards.</li>
            <li><strong>Trump Selection:</strong> The Trump Caller selects the trump suit.</li>
            <li><strong>Stage 2:</strong> Remaining cards are distributed (4 each, then 4 each) to 13 cards.</li>
          </ul>
        </div>

        <div>
          <h4 className="font-medium text-white mb-1 text-xs">
            Trick Play (Single Sir)
          </h4>
          <ul className="list-disc list-inside space-y-1 text-neutral-400">
            <li><strong>First Lead:</strong> The Trump Caller leads trick 1.</li>
            <li><strong>Follow Suit:</strong> Players must follow suit if they hold that suit.</li>
            <li><strong>Ruffing:</strong> If void in led suit, any card can be played.</li>
            <li><strong>Trick Winner:</strong> Highest trump wins, otherwise highest card of led suit.</li>
            <li><strong>Collection:</strong> The winner collects the 4 cards and leads next.</li>
          </ul>
        </div>

        <div>
          <h4 className="font-medium text-white mb-1 text-xs">
            Scoring & Target
          </h4>
          <ul className="list-disc list-inside space-y-1 text-neutral-400">
            <li><strong>Deal:</strong> First team to 7 tricks wins the deal and 1 match point.</li>
            <li><strong>Match:</strong> First team to 7 match points wins the game.</li>
            <li><strong>Dealer Rotation:</strong> Dealer stays on win, rotates clockwise on loss.</li>
          </ul>
        </div>

        <div className="pt-2 text-right">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-100 rounded-full text-xs font-medium cursor-pointer transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </Modal>
  );
};
