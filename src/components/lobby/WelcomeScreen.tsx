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
      setErrorMessage('Enter your name');
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
      setErrorMessage('Enter room code');
      return;
    }
    if (!nickname.trim()) {
      setErrorMessage('Enter your name');
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
    <div className="relative min-h-screen bg-[#07090e] text-white flex flex-col justify-between p-6 sm:p-8">
      {/* Background Ambience */}
      <div className="absolute inset-0 bg-radial from-white/[0.03] via-transparent to-transparent pointer-events-none" />

      {/* Top bar with subtle mode indicator */}
      <header className="relative z-10 flex items-center justify-end max-w-sm w-full mx-auto">
        <button
          type="button"
          onClick={() => roomService.setForceSimulator(backendMode === 'firebase')}
          className="text-[11px] text-white/40 hover:text-white/80 transition-colors cursor-pointer px-2.5 py-1 rounded-full bg-white/[0.04] border border-white/[0.06]"
        >
          {backendMode === 'firebase' ? 'Cloud' : 'Simulator'}
        </button>
      </header>

      {/* Center Card */}
      <main className="relative z-10 max-w-sm w-full mx-auto my-auto flex flex-col items-center">
        <div className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-white">
            CODEBASE
          </h1>
          <p className="text-xs text-white/40 mt-1">Court Piece</p>
        </div>

        <div className="w-full bg-neutral-900/60 border border-white/[0.08] rounded-3xl p-6 shadow-2xl backdrop-blur-2xl">
          {errorMessage && (
            <div className="mb-4 text-xs text-rose-400 text-center font-medium">
              {errorMessage}
            </div>
          )}

          {/* Nickname Input */}
          <div className="mb-5">
            <input
              id="nickname"
              type="text"
              value={nickname}
              onChange={handleNicknameChange}
              placeholder="Your Name"
              maxLength={16}
              className="w-full px-4 py-3 rounded-2xl bg-white/[0.05] border border-white/[0.08] text-white placeholder-white/30 text-sm focus:outline-none focus:border-white/30 focus:bg-white/[0.08] transition-all"
            />
          </div>

          {/* Create Button */}
          <button
            type="button"
            disabled={isCreating || isJoining}
            onClick={handleCreate}
            className="w-full py-3 rounded-2xl bg-white text-black font-medium text-sm hover:bg-white/90 active:scale-[0.98] transition-all cursor-pointer shadow-sm disabled:opacity-50"
          >
            {isCreating ? 'Creating...' : 'New Game'}
          </button>

          {/* Divider */}
          <div className="relative my-5 flex items-center justify-center">
            <div className="w-full border-t border-white/[0.06]" />
            <span className="absolute bg-neutral-900 px-2 text-[11px] text-white/30">
              or
            </span>
          </div>

          {/* Join Form */}
          <form onSubmit={handleJoin} className="flex gap-2">
            <input
              id="roomCode"
              type="text"
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
              placeholder="ROOM CODE"
              maxLength={6}
              className="flex-1 px-4 py-2.5 rounded-2xl bg-white/[0.05] border border-white/[0.08] text-white text-center font-mono tracking-widest text-sm placeholder-white/30 focus:outline-none focus:border-white/30 focus:bg-white/[0.08] transition-all uppercase"
            />
            <button
              type="submit"
              disabled={isJoining || isCreating || !roomCode.trim()}
              className="px-5 py-2.5 rounded-2xl bg-white/10 text-white font-medium text-sm hover:bg-white/20 active:scale-[0.98] transition-all cursor-pointer disabled:opacity-40"
            >
              {isJoining ? '...' : 'Join'}
            </button>
          </form>
        </div>
      </main>

      <footer className="relative z-10" />
    </div>
  );
};
