import React, { useState } from 'react';
import { CardView } from '../table/CardView';
import { roomService } from '../../services/roomService';

interface WelcomeScreenProps {
  currentNickname: string;
  onUpdateNickname: (name: string) => void;
  onCreateGame: () => Promise<void>;
  onJoinGame: (roomCode: string) => Promise<void>;
  onOpenRulesModal?: () => void;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({
  currentNickname,
  onUpdateNickname,
  onCreateGame,
  onJoinGame,
  onOpenRulesModal,
}) => {
  const [nickname, setNickname] = useState(currentNickname);
  const [roomCode, setRoomCode] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const backendMode = roomService.getBackendMode();

  const handleNicknameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.slice(0, 16);
    setNickname(val);
    onUpdateNickname(val);
  };

  const handleCreate = async () => {
    setErrorMessage(null);
    if (!nickname.trim()) {
      setErrorMessage('Enter your name to play');
      return;
    }
    setIsCreating(true);
    try {
      await onCreateGame();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error creating room';
      setErrorMessage(msg);
      setIsCreating(false);
    }
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    const code = roomCode.trim().toUpperCase();
    if (!code) {
      setErrorMessage('Enter the 6-character room code');
      return;
    }
    if (!nickname.trim()) {
      setErrorMessage('Enter your name to play');
      return;
    }

    setIsJoining(true);
    try {
      await onJoinGame(code);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error joining room';
      setErrorMessage(msg);
      setIsJoining(false);
    }
  };

  return (
    <div className="welcome-screen">
      {/* Header bar */}
      <header className="welcome-header">
        <span className="welcome-wordmark"><span aria-hidden="true">♧</span> Court Piece</span>
        <div className="flex items-center gap-3">
          {onOpenRulesModal && (
            <button
              type="button"
              onClick={onOpenRulesModal}
              className="text-xs text-neutral-400 hover:text-white transition-colors cursor-pointer"
            >
              Rules
            </button>
          )}
          <button
            type="button"
            onClick={() => roomService.setForceSimulator(backendMode === 'firebase')}
            className="text-xs text-neutral-400 hover:text-white transition-colors cursor-pointer px-2.5 py-1 rounded-full bg-neutral-900 border border-neutral-800"
          >
            {backendMode === 'firebase' ? 'Online tables' : 'Local tables'}
          </button>
        </div>
      </header>

      {/* Main card */}
      <main className="welcome-main">
        <div className="welcome-story">
          <div className="welcome-deck" aria-hidden="true">
            <div><CardView card={{ id: 'welcome-k', rank: 'K', value: 13, suit: 'spades' }} size="lg" /></div>
            <div><CardView card={{ id: 'welcome-q', rank: 'Q', value: 12, suit: 'hearts' }} size="lg" /></div>
            <div><CardView card={{ id: 'welcome-a', rank: 'A', value: 14, suit: 'clubs' }} size="lg" /></div>
          </div>
          <h1>Good company.<br />Great hands.</h1>
          <p>A round of Court Piece, a familiar rivalry.<br />Bring your people. We’ll deal the cards.</p>
          <div className="welcome-facts"><span>4 players</span><span>2 teams</span><span>First to 7</span></div>
        </div>
        <div className="welcome-form"><h2>Take your seat</h2><p>Create a private table or join your friends.</p>
          {errorMessage && (
            <div className="mb-4 text-xs text-rose-400 text-center font-medium">
              {errorMessage}
            </div>
          )}

          {/* Nickname input */}
          <div className="mb-4">
            <label htmlFor="nickname" className="block text-xs text-neutral-400 mb-1.5 font-medium">
              Your name
            </label>
            <input
              id="nickname"
              type="text"
              value={nickname}
              onChange={handleNicknameChange}
              placeholder="e.g. Maya"
              maxLength={16}
              className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-white placeholder-neutral-500 text-sm focus:outline-none focus:border-neutral-600 transition-colors"
            />
          </div>

          {/* Create Button */}
          <button
            type="button"
            disabled={isCreating || isJoining}
            onClick={handleCreate}
            className="w-full py-2.5 rounded-xl bg-white text-black font-medium text-xs sm:text-sm hover:bg-neutral-200 active:scale-98 transition-transform transition-colors cursor-pointer disabled:opacity-40"
          >
            {isCreating ? 'Creating room...' : 'Create a table'}
          </button>

          <div className="my-5 text-center text-xs text-neutral-500 font-medium">
            Have an invite? Join their table.
          </div>

          {/* Join Form */}
          <form onSubmit={handleJoin} className="flex gap-2">
            <input
              aria-label="6-character room code"
              id="roomCode"
              type="text"
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
              placeholder="Room code"
              maxLength={6}
              className="flex-1 px-3.5 py-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-white text-center font-medium text-sm placeholder-neutral-500 focus:outline-none focus:border-neutral-600 transition-colors uppercase"
            />
            <button
              type="submit"
              disabled={isJoining || isCreating || !roomCode.trim()}
              className="px-4 py-2.5 rounded-xl bg-neutral-800 text-white font-medium text-xs sm:text-sm hover:bg-neutral-700 active:scale-98 transition-transform transition-colors cursor-pointer disabled:opacity-40"
            >
              {isJoining ? 'Joining...' : 'Join'}
            </button>
          </form>
        </div>
      </main>

      <footer className="welcome-footer">
        Made for a little friendly competition.
      </footer>
    </div>
  );
};
