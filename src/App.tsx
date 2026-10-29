import { useEffect, useState } from 'react';
import type { RoomDocument } from './types/game';
import { authService, type PlayerIdentity } from './services/authService';
import { roomService } from './services/roomService';
import { WelcomeScreen } from './components/lobby/WelcomeScreen';
import { WaitingLobby } from './components/lobby/WaitingLobby';
import { GameTable } from './components/table/GameTable';
import { GameResultsModal } from './components/results/GameResultsModal';
import { RulesNoticeModal } from './components/common/RulesNoticeModal';
import './App.css';

const SESSION_ROOM_KEY = 'codebase_active_room_id';

export function App() {
  const [identity, setIdentity] = useState<PlayerIdentity>(authService.getIdentity());
  const [currentRoom, setCurrentRoom] = useState<RoomDocument | null>(null);
  const [isRulesModalOpen, setIsRulesModalOpen] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);

  // Subscribe to auth identity
  useEffect(() => {
    const unsub = authService.subscribe((id) => setIdentity(id));
    return () => unsub();
  }, []);

  // Reconnection / Session recovery
  useEffect(() => {
    let activeRoomId = sessionStorage.getItem(SESSION_ROOM_KEY);

    // Hard safety timeout: NEVER remain stuck in loading under any network or auth condition
    const fallbackTimer = setTimeout(() => {
      setIsInitializing(false);
    }, 1200);

    // Support joining via URL e.g. ?room=CB7842
    if (!activeRoomId && typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const urlCode = params.get('room');
      if (urlCode) {
        roomService
          .joinRoom(urlCode, { id: identity.id, nickname: identity.nickname })
          .then(({ room }) => {
            setCurrentRoom(room);
            sessionStorage.setItem(SESSION_ROOM_KEY, room.id);
          })
          .catch((err) => {
            console.warn('[App] Auto-join from URL failed:', err);
          })
          .finally(() => {
            clearTimeout(fallbackTimer);
            setIsInitializing(false);
          });
        return () => clearTimeout(fallbackTimer);
      }
    }

    if (activeRoomId) {
      const unsub = roomService.subscribeRoom(activeRoomId, (room) => {
        clearTimeout(fallbackTimer);
        if (room) {
          setCurrentRoom(room);
        } else {
          sessionStorage.removeItem(SESSION_ROOM_KEY);
          setCurrentRoom(null);
        }
        setIsInitializing(false);
      });
      return () => {
        clearTimeout(fallbackTimer);
        unsub();
      };
    } else {
      clearTimeout(fallbackTimer);
      setIsInitializing(false);
    }
  }, [identity.id, identity.nickname]);

  // Subscribe to room updates when active
  useEffect(() => {
    if (!currentRoom?.id) return;
    const unsub = roomService.subscribeRoom(currentRoom.id, (freshRoom) => {
      if (freshRoom) {
        setCurrentRoom(freshRoom);
      }
    });
    return () => unsub();
  }, [currentRoom?.id]);

  const handleUpdateNickname = (newName: string) => {
    authService.setNickname(newName);
  };

  const handleCreateGame = async () => {
    const room = await roomService.createRoom({
      id: identity.id,
      nickname: identity.nickname,
    });
    setCurrentRoom(room);
    sessionStorage.setItem(SESSION_ROOM_KEY, room.id);
  };

  const handleJoinGame = async (roomCode: string) => {
    const { room } = await roomService.joinRoom(roomCode, {
      id: identity.id,
      nickname: identity.nickname,
    });
    setCurrentRoom(room);
    sessionStorage.setItem(SESSION_ROOM_KEY, room.id);
  };

  const handleStartGame = async () => {
    if (!currentRoom) return;
    await roomService.startGame(currentRoom.id, identity.id);
  };

  const handleNextDeal = async () => {
    if (!currentRoom) return;
    await roomService.startNextDeal(currentRoom.id, identity.id);
  };

  const handleRematch = async () => {
    if (!currentRoom) return;
    await roomService.requestRematch(currentRoom.id, identity.id);
  };

  const handleLeaveRoom = async () => {
    if (currentRoom) {
      try {
        await roomService.leaveRoom(currentRoom.id, identity.id);
      } catch (err) {
        console.warn('Error leaving room:', err);
      }
    }
    sessionStorage.removeItem(SESSION_ROOM_KEY);
    setCurrentRoom(null);
  };

  if (isInitializing) {
    return (
      <div className="min-h-screen bg-[#0d151c] flex flex-col items-center justify-center text-slate-400 font-mono text-sm p-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          <span>Loading Codebase Court Piece...</span>
        </div>
        <button
          type="button"
          onClick={() => {
            sessionStorage.clear();
            setIsInitializing(false);
          }}
          className="text-xs text-emerald-400 hover:text-emerald-300 underline underline-offset-4 cursor-pointer"
        >
          Skip to Welcome Screen
        </button>
      </div>
    );
  }

  // Active game or lobby
  const isPlaying =
    currentRoom &&
    (currentRoom.status === 'trump_selection' ||
      currentRoom.status === 'playing' ||
      currentRoom.status === 'deal_complete' ||
      currentRoom.status === 'match_complete');

  const isModalOpen =
    currentRoom?.status === 'deal_complete' || currentRoom?.status === 'match_complete';

  return (
    <div className="min-h-screen w-full bg-[#0d151c] flex flex-col font-sans selection:bg-emerald-500/30 selection:text-emerald-200">
      {!currentRoom && (
        <WelcomeScreen
          currentNickname={identity.nickname}
          onUpdateNickname={handleUpdateNickname}
          onCreateGame={handleCreateGame}
          onJoinGame={handleJoinGame}
          onOpenRulesModal={() => setIsRulesModalOpen(true)}
        />
      )}

      {currentRoom && currentRoom.status === 'waiting' && (
        <WaitingLobby
          room={currentRoom}
          localPlayerId={identity.id}
          onStartGame={handleStartGame}
          onLeaveRoom={handleLeaveRoom}
          onOpenRulesModal={() => setIsRulesModalOpen(true)}
        />
      )}

      {isPlaying && (
        <>
          <GameTable
            room={currentRoom}
            localPlayerId={identity.id}
            onLeaveRoom={handleLeaveRoom}
            onOpenRulesModal={() => setIsRulesModalOpen(true)}
          />

          <GameResultsModal
            isOpen={Boolean(isModalOpen)}
            gameState={currentRoom.gameState}
            seats={currentRoom.seats}
            localPlayerId={identity.id}
            isHost={currentRoom.hostPlayerId === identity.id}
            onNextDeal={handleNextDeal}
            onRematch={handleRematch}
            onLeaveRoom={handleLeaveRoom}
          />
        </>
      )}

      <RulesNoticeModal
        isOpen={isRulesModalOpen}
        onClose={() => setIsRulesModalOpen(false)}
      />
    </div>
  );
}

export default App;
