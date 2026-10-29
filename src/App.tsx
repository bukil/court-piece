import { useEffect, useState } from 'react';
import type { RoomDocument } from './types/game';
import { authService, type PlayerIdentity } from './services/authService';
import { roomService } from './services/roomService';
import { WelcomeScreen } from './components/lobby/WelcomeScreen';
import { WaitingLobby } from './components/lobby/WaitingLobby';
import { GameTable } from './components/table/GameTable';
import { GameResultsModal } from './components/results/GameResultsModal';
import './App.css';

const SESSION_ROOM_KEY = 'codebase_active_room_id';

export function App() {
  const [identity, setIdentity] = useState<PlayerIdentity>(authService.getIdentity());
  const [currentRoom, setCurrentRoom] = useState<RoomDocument | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);

  // Subscribe to auth identity
  useEffect(() => {
    const unsub = authService.subscribe((id) => setIdentity(id));
    return () => unsub();
  }, []);

  // Reconnection / Session recovery
  useEffect(() => {
    const activeRoomId = sessionStorage.getItem(SESSION_ROOM_KEY);

    // Hard safety timeout
    const fallbackTimer = setTimeout(() => {
      setIsInitializing(false);
    }, 1000);

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
      <div className="min-h-screen bg-[#07090e] flex flex-col items-center justify-center text-white/50 text-xs p-4">
        <div className="w-5 h-5 border-2 border-white/60 border-t-transparent rounded-full animate-spin mb-3" />
        <button
          type="button"
          onClick={() => {
            sessionStorage.clear();
            setIsInitializing(false);
          }}
          className="text-white/30 hover:text-white/60 transition-colors cursor-pointer"
        >
          Skip
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
    <div className="min-h-screen w-full bg-[#07090e] flex flex-col font-sans selection:bg-white/20 selection:text-white">
      {!currentRoom && (
        <WelcomeScreen
          currentNickname={identity.nickname}
          onUpdateNickname={handleUpdateNickname}
          onCreateGame={handleCreateGame}
          onJoinGame={handleJoinGame}
        />
      )}

      {currentRoom && currentRoom.status === 'waiting' && (
        <WaitingLobby
          room={currentRoom}
          localPlayerId={identity.id}
          onStartGame={handleStartGame}
          onLeaveRoom={handleLeaveRoom}
        />
      )}

      {isPlaying && (
        <>
          <GameTable
            room={currentRoom}
            localPlayerId={identity.id}
            onLeaveRoom={handleLeaveRoom}
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
    </div>
  );
}

export default App;
