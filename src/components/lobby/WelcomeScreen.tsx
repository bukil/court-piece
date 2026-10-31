import React, { useState } from 'react';
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
    <div className="relative min-h-dvh bg-[#0b0d11] text-neutral-100 flex flex-col justify-between p-6 sm:p-8">
      {/* Header bar */}
      <header className="relative z-10 flex items-center justify-between max-w-sm w-full mx-auto">
        <span className="text-xs text-neutral-400 font-medium">Court Piece</span>
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
            {backendMode === 'firebase' ? 'Cloud' : 'Simulator'}
          </button>
        </div>
      </header>

      {/* Main card */}
      <main className="relative z-10 max-w-sm w-full mx-auto my-auto flex flex-col items-center">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-semibold tracking-tight text-white">
            Court Piece
          </h1>
          <p className="text-xs text-neutral-400 mt-1">Single Sir &bull; 4 Players &bull; 2 Teams</p>
        </div>

        <div className="w-full bg-[#13161c] border border-neutral-800 rounded-2xl p-6">
          {errorMessage && (
            <div className="mb-4 text-xs text-rose-400 text-center font-medium">
              {errorMessage}
            </div>
          )}

          {/* Nickname input */}
          <div className="mb-4">
            <label htmlFor="nickname" className="block text-xs text-neutral-400 mb-1.5 font-medium">
              Player Name
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
            {isCreating ? 'Creating room...' : 'Create Room'}
          </button>

          <div className="my-5 text-center text-xs text-neutral-500 font-medium">
            or join an existing table
          </div>

          {/* Join Form */}
          <form onSubmit={handleJoin} className="flex gap-2">
            <input
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

      <footer className="relative z-10 text-center text-xs text-neutral-500">
        4-player trick-taking card game
      </footer>
    </div>
  );
};
