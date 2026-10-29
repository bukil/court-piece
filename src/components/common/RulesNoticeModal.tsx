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
      <div className="space-y-4 text-xs sm:text-sm text-slate-300">
        <div className="p-3.5 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-200">
          <div className="font-bold mb-1 flex items-center gap-1.5 text-emerald-300">
            <span>✓</span> Official Game Rules: {courtPieceEngine.name} ({courtPieceEngine.version})
          </div>
          <p className="text-xs text-emerald-200/90 leading-relaxed">
            All moves, dealing sequences, and hand privacy are enforced authoritatively.
          </p>
        </div>

        <div>
          <h4 className="font-bold text-white mb-1.5 uppercase text-xs tracking-wider">
            Game Setup & Staged Dealing (5-4-4)
          </h4>
          <ul className="list-disc list-inside space-y-1 text-slate-400 text-xs">
            <li><strong>Players:</strong> Exactly 4 players in 2 fixed teams of 2 (Team Alpha: Seats 1 & 3; Team Beta: Seats 2 & 4). Partners sit opposite each other.</li>
            <li><strong>Deck:</strong> Standard 52-card deck, no jokers. Card ranks from Ace (high) to 2 (low).</li>
            <li><strong>Stage 1 Deal:</strong> Every player receives their initial 5 cards. The remaining 32 cards are held in server reserve.</li>
            <li><strong>Trump Selection:</strong> The Trump Caller (player clockwise to dealer) evaluates their 5 cards and selects hearts, diamonds, clubs, or spades.</li>
            <li><strong>Stage 2 Deal:</strong> Remaining 32 cards are distributed (4 each, then 4 each) bringing every player to exactly 13 cards.</li>
          </ul>
        </div>

        <div>
          <h4 className="font-bold text-white mb-1.5 uppercase text-xs tracking-wider">
            Trick Play (Single Sir)
          </h4>
          <ul className="list-disc list-inside space-y-1 text-slate-400 text-xs">
            <li><strong>First Trick Lead:</strong> The Trump Caller leads the first card of the first trick.</li>
            <li><strong>Follow Suit:</strong> If a player holds one or more cards in the led suit, they <strong>must follow suit</strong>.</li>
            <li><strong>Ruffing / Off-suit:</strong> If a player has no cards in the led suit, they may play any card (including trump).</li>
            <li><strong>Trick Winner:</strong> If one or more trumps are played, the highest trump wins. Otherwise, the highest card of the led suit wins.</li>
            <li><strong>Immediate Collection:</strong> Under Single Sir rules, the winning player collects the 4 cards immediately and leads the next trick.</li>
          </ul>
        </div>

        <div>
          <h4 className="font-bold text-white mb-1.5 uppercase text-xs tracking-wider">
            Scoring & Winning Conditions
          </h4>
          <ul className="list-disc list-inside space-y-1 text-slate-400 text-xs">
            <li><strong>Deal Win:</strong> The first team to win <strong>7 tricks</strong> wins the deal immediately.</li>
            <li><strong>Match Point:</strong> The winning team earns <strong>1 match point</strong> (losing team earns 0).</li>
            <li><strong>Match Championship:</strong> A match is a series of deals. The first team to reach the match target (default <strong>7 match points</strong>) wins the championship.</li>
            <li><strong>Dealer Rotation:</strong> If the dealer's team wins the deal, the dealer stays. If the dealer's team loses, the deal rotates clockwise.</li>
          </ul>
        </div>

        <div className="pt-2 text-right">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-100 rounded-lg text-xs font-semibold cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </Modal>
  );
};
