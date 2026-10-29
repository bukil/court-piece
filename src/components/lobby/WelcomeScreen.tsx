import React, { useState } from 'react';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { roomService } from '../../services/roomService';

interface WelcomeScreenProps {
  currentNickname: string;
  onUpdateNickname: (name: string) => void;
  onCreateGame: () => Promise<void>;
  onJoinGame: (roomCode: string) => Promise<void>;
  onOpenRulesModal: () => void;
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
      setErrorMessage('Please enter a player nickname.');
      return;
    }
    setIsCreating(true);
    try {
      await onCreateGame();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to create game room.';
      setErrorMessage(msg);
      setIsCreating(false);
    }
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    const code = roomCode.trim().toUpperCase();
    if (!code) {
      setErrorMessage('Please enter a 6-character room code.');
      return;
    }
    if (!nickname.trim()) {
      setErrorMessage('Please enter a player nickname.');
      return;
    }

    setIsJoining(true);
    try {
      await onJoinGame(code);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to join game room.';
      setErrorMessage(msg);
      setIsJoining(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-[#0d151c] text-slate-100 flex flex-col justify-between p-4 sm:p-8">
      {/* Background Ambience */}
      <div className="absolute inset-0 bg-radial from-[#122820]/40 via-[#0d151c] to-[#070b0e] pointer-events-none" />

      {/* Top bar with mode indicator */}
      <header className="relative z-10 flex items-center justify-between max-w-4xl w-full mx-auto">
        <div className="flex items-center gap-2">
          <Badge
            variant={backendMode === 'firebase' ? 'emerald' : 'blue'}
            size="sm"
          >
            {backendMode === 'firebase' ? '● Firebase Live' : '● Multi-Tab Simulator'}
          </Badge>
        </div>

        <button
          onClick={onOpenRulesModal}
          className="text-xs text-amber-300 hover:text-amber-200 underline underline-offset-4 font-mono"
        >
          Rules Status: Demo Engine
        </button>
      </header>

      {/* Center Welcome Card */}
      <main className="relative z-10 max-w-md w-full mx-auto my-auto flex flex-col items-center">
        {/* Wordmark and Tagline */}
        <div className="text-center mb-8">
          <div className="inline-block px-3 py-1 rounded-full bg-emerald-950/60 border border-emerald-500/30 text-emerald-400 font-mono text-xs font-semibold uppercase tracking-widest mb-3">
            Multiplayer Card Game
          </div>
          <h1 className="text-4xl sm:text-5xl font-mono font-black tracking-tight text-white drop-shadow-md">
            CODEBASE
          </h1>
          <p className="text-sm text-slate-400 mt-2 font-sans">
            Exactly four players. Two teams of two. Real-time browser play.
          </p>
        </div>

        {/* Card Container */}
        <div className="w-full bg-slate-900/90 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl backdrop-blur-md">
          {/* Error Banner */}
          {errorMessage && (
            <div className="mb-5 p-3 rounded-xl bg-rose-950/80 border border-rose-500/50 text-rose-200 text-xs font-medium flex items-center gap-2">
              <span>⚠️</span>
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Nickname Input */}
          <div className="mb-6">
            <label
              htmlFor="nickname"
              className="block text-xs font-mono font-semibold uppercase tracking-wider text-slate-300 mb-2"
            >
              Player Nickname
            </label>
            <input
              id="nickname"
              type="text"
              value={nickname}
              onChange={handleNicknameChange}
              placeholder="e.g. SwiftAce42"
              maxLength={16}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-500 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-colors"
            />
          </div>

          {/* Create Game Section */}
          <div className="mb-6">
            <Button
              variant="primary"
              size="lg"
              isLoading={isCreating}
              disabled={isJoining}
              onClick={handleCreate}
              className="w-full text-base py-3"
            >
              🃏 Create New Game Room
            </Button>
            <p className="text-[11px] text-slate-400 text-center mt-2">
              Creates a private 4-player table and assigns you as Host.
            </p>
          </div>

          {/* Divider */}
          <div className="relative my-6 flex items-center justify-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-800"></div>
            </div>
            <span className="relative bg-slate-900 px-3 text-xs font-mono text-slate-500 uppercase">
              Or Join Existing Table
            </span>
          </div>

          {/* Join Game Form */}
          <form onSubmit={handleJoin} className="space-y-3">
            <div>
              <label
                htmlFor="roomCode"
                className="block text-xs font-mono font-semibold uppercase tracking-wider text-slate-300 mb-2"
              >
                Room Code
              </label>
              <input
                id="roomCode"
                type="text"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                placeholder="6-DIGIT CODE (e.g. CB7842)"
                maxLength={6}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-amber-400 font-mono text-center tracking-widest text-lg font-black placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition-colors uppercase"
              />
            </div>

            <Button
              type="submit"
              variant="secondary"
              size="md"
              isLoading={isJoining}
              disabled={isCreating || !roomCode.trim()}
              className="w-full py-2.5"
            >
              Join Room
            </Button>
          </form>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 max-w-md w-full mx-auto text-center text-xs text-slate-500 mt-4">
        CODEBASE Multiplayer • 2 Teams of 2 • Server-Authoritative Engine
      </footer>
    </div>
  );
};

