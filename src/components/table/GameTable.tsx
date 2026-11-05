import '../../phone-table.css';
import { usePhoneTable } from '../../hooks/usePhoneTable';
import { PhoneTableMenu } from './PhoneTableMenu';
import { useCardPlay } from '../../hooks/useCardPlay';
import { reactionDuration } from '../../game-engine/reactions';
import type { ReactionEvent, ReactionInput } from '../../types/game';
import { useRoomPresence, playerIsOnline } from '../../hooks/useRoomPresence';
import { useTurnClock } from '../../hooks/useTurnClock';
import { SUIT_SYMBOLS } from '../../game-engine/utils/deck';
import { useGameViewport } from '../../hooks/useGameViewport';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import type {
  RoomDocument,
  Card,
  SeatIndex,
  RelativePosition,
  Player,
  Suit,
} from '../../types/game';
import { roomService } from '../../services/roomService';
import { soundService } from '../../services/soundService';
import { SeatView } from './SeatView';
import { TrickArea } from './TrickArea';
import { HandView } from './HandView';
import { Scoreboard } from './Scoreboard';
import { TrumpSelectionModal } from './TrumpSelectionModal';
import { ReactionPicker } from './ReactionPicker';
import { ScoreRecordDrawer } from './ScoreRecordDrawer';
import { CommonChatDrawer } from './CommonChatDrawer';
import { ShuffleDistributionOverlay } from './ShuffleDistributionOverlay';

interface GameTableProps {
  room: RoomDocument;
  localPlayerId: string;
  onLeaveRoom: () => void;
  onOpenRulesModal?: () => void;
}

export const GameTable: React.FC<GameTableProps> = ({
  room,
  localPlayerId,
  onLeaveRoom,
  onOpenRulesModal,
}) => {
  const viewportRef = useGameViewport();
  const phone = usePhoneTable();
  const [hand, setHand] = useState<Card[]>([]);
  const [initialCards, setInitialCards] = useState<Card[]>([]);
  const [copiedCode, setCopiedCode] = useState(false);
  const [isMuted, setIsMuted] = useState(soundService.getIsMuted());
  const [actionError, setActionError] = useState<string | null>(null);
  const [activeReactions, setActiveReactions] = useState<Record<number, ReactionEvent | null>>({});
  const reactionTimers = useRef<Record<number, ReturnType<typeof setTimeout>>>({});
  const seenReaction = useRef<string | null>(null);

  // Modals / Drawers
  const [isScoreDrawerOpen, setIsScoreDrawerOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(() => !phone.isPhone);
  const [lastReadMessageCount, setLastReadMessageCount] = useState(0);
  const [showShuffleAnimation, setShowShuffleAnimation] = useState(
    !phone.lite && room.status === 'trump_selection' && (room.gameState?.completedTricks.length ?? 0) === 0
  );

  const presenceNow = useRoomPresence(room.id, localPlayerId);
  const gameState = room.gameState;
  const localPlayer = room.seats.find((s) => s?.id === localPlayerId);
  const localSeatIndex: SeatIndex = localPlayer ? localPlayer.seatIndex : 0;

  const messages = room.messages || [];
  const unreadCount = isChatOpen ? 0 : Math.max(0, messages.length - lastReadMessageCount);

  // Subscribe to private hand
  useEffect(() => {
    const unsubscribe = roomService.subscribePrivateHand(room.id, localPlayerId, (cards, initCards) => {
      setHand(cards);
      if (initCards && initCards.length > 0) {
        setInitialCards(initCards);
      }
    });
    return () => unsubscribe();
  }, [room.id, localPlayerId]);

  // Audio feedback when turn changes
  useEffect(() => {
    if (gameState?.currentTurnSeatIndex === localSeatIndex && gameState.status === 'playing') {
      soundService.playTurnNotification();
    }
  }, [gameState?.currentTurnSeatIndex, localSeatIndex, gameState?.status]);

  // Each seat owns its expiry timer, so overlapping reactions never leave a bubble behind.
  const lastReaction = gameState?.lastReaction;
  useEffect(() => {
    if (!lastReaction || seenReaction.current === lastReaction.id || Date.now() - lastReaction.timestamp > reactionDuration(lastReaction)) return;
    seenReaction.current = lastReaction.id;
    const { seatIndex } = lastReaction;
    soundService.playReactionSound();
    clearTimeout(reactionTimers.current[seatIndex]);
    setActiveReactions(prev => ({ ...prev, [seatIndex]: lastReaction }));
    reactionTimers.current[seatIndex] = setTimeout(() => {
      setActiveReactions(prev => ({ ...prev, [seatIndex]: null }));
      delete reactionTimers.current[seatIndex];
    }, reactionDuration(lastReaction));
  }, [lastReaction]);
  useEffect(() => () => {
    Object.values(reactionTimers.current).forEach(clearTimeout);
    reactionTimers.current = {};
    seenReaction.current = null;
  }, []);

  // Reset read messages when chat drawer is opened
  useEffect(() => {
    if (isChatOpen) {
      setLastReadMessageCount(messages.length);
    }
  }, [isChatOpen, messages.length]);

  const completedTrickCount = gameState?.completedTricks.length ?? 0;
  // Trigger shuffle animation on new deal
  useEffect(() => {
    if (!phone.lite && gameState?.status === 'trump_selection' && completedTrickCount === 0) {
      setShowShuffleAnimation(true);
    }
  }, [gameState?.currentDeal, gameState?.status, completedTrickCount, phone.lite]);

  // Relative seat position calculation (local player always at bottom)
  const getRelativePosition = (seatIndex: number): RelativePosition => {
    const diff = (seatIndex - localSeatIndex + 4) % 4;
    switch (diff) {
      case 0:
        return 'bottom';
      case 1:
        return 'left';
      case 2:
        return 'top';
      case 3:
        return 'right';
      default:
        return 'bottom';
    }
  };

  const getPlayerAtPosition = (pos: RelativePosition): { player: Player | null; seatIndex: number } => {
    for (let s = 0; s < 4; s++) {
      if (getRelativePosition(s) === pos) {
        return { player: room.seats[s], seatIndex: s };
      }
    }
    return { player: null, seatIndex: 0 };
  };

  const topSeat = getPlayerAtPosition('top');
  const leftSeat = getPlayerAtPosition('left');
  const rightSeat = getPlayerAtPosition('right');
  const bottomSeat = getPlayerAtPosition('bottom');

  const isMyTurn = gameState ? gameState.currentTurnSeatIndex === localSeatIndex : false;

  const clock = useTurnClock(gameState, room.id, localPlayerId, isMyTurn);
  useEffect(() => {
    const unlock = () => soundService.unlock();
    window.addEventListener('pointerdown', unlock, { once: true }); window.addEventListener('keydown', unlock, { once: true });
    return () => { window.removeEventListener('pointerdown', unlock); window.removeEventListener('keydown', unlock); };
  }, []);

  const isTrumpSelection = room.status === 'trump_selection' || gameState?.status === 'trump_selection';
  const isTrumpCaller = gameState ? gameState.trumpCallerSeatIndex === localSeatIndex : false;
  const trumpCallerPlayer = gameState ? room.seats[gameState.trumpCallerSeatIndex] : null;

  const displayHand = isTrumpSelection
    ? initialCards.length > 0
      ? initialCards
      : hand.slice(0, 5)
    : hand;

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(room.code);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    } catch {
      // fallback
    }
  };

  const handleToggleMute = () => {
    const muted = soundService.toggleMute();
    setIsMuted(muted);
  };

  const handleSelectTrump = async (suit: Suit) => {
    soundService.playCardDeal();
    await roomService.selectTrump(room.id, localPlayerId, suit);
  };

  const handleSendReaction = async (reaction: ReactionInput) => {
    try { await roomService.sendReaction(room.id, localPlayerId, reaction); }
    catch (error) { setActionError('Couldn’t send your reaction. Try again.'); throw error; }
  };

  const handleSendChatMessage = async (text: string) => {
    if (!localPlayer) return;
    await roomService.sendChatMessage(room.id, {
      playerId: localPlayerId,
      nickname: localPlayer.nickname,
      teamId: localPlayer.teamId,
      text,
    });
  };

  const reportPlayError = useCallback((message: string) => setActionError(message), []);
  const cardPlay = useCardPlay(room, hand, localPlayerId, reportPlayError);
  const handlePlayCard = (card: Card, origin?: import('../../hooks/useCardPlay').CardPlayOrigin) => {
    setActionError(null); cardPlay.play(card, origin);
  };

  const renderSeat = (seat: { player: Player | null; seatIndex: number }, position: RelativePosition, teammate: boolean, local = false) => (
    <SeatView player={seat.player} seatIndex={seat.seatIndex} position={position} isTeammate={teammate} isLocalPlayer={local} animateAvatar={!phone.lite} isOnline={(seat.player?.id !== localPlayerId || navigator.onLine) && playerIsOnline(seat.player, presenceNow)} seconds={clock.seconds} warning={clock.warning}
      isTurn={gameState?.status === 'playing' && gameState.currentTurnSeatIndex === seat.seatIndex}
      isDealer={gameState?.dealerSeatIndex === seat.seatIndex} isCaller={gameState?.trumpCallerSeatIndex === seat.seatIndex}
      cardCount={gameState?.remainingCardCounts[seat.seatIndex] ?? 0} activeReaction={activeReactions[seat.seatIndex]} />
  );

  const scores = gameState && <Scoreboard dealScores={gameState.teamDealScores} matchScores={gameState.matchScores} matchTarget={gameState.matchTarget} currentDeal={gameState.currentDeal} trumpSuit={gameState.trumpSuit} onClick={() => setIsScoreDrawerOpen(true)} />;
  return (
    <div ref={viewportRef} className="game-shell" data-phone={phone.isPhone} data-phone-landscape={phone.landscape} data-performance={phone.lite ? 'lite' : 'full'} data-rotate-hint={phone.rotateHint}>
      {showShuffleAnimation && !phone.lite && gameState && <ShuffleDistributionOverlay dealNumber={gameState.currentDeal} onAnimationComplete={() => setShowShuffleAnimation(false)} />}
      <header className="game-header">
        {phone.landscape && <><div className="phone-local-player">{renderSeat(bottomSeat, 'bottom', false, true)}</div><div className="phone-scores">{scores}</div></>}
        <div className="game-brand"><span className="brand-mark" aria-hidden="true">♧</span><h1>Court Piece</h1><button className="room-code" onClick={handleCopyCode} aria-label="Copy room code">{copiedCode ? 'Copied!' : room.code} <span aria-hidden="true">⧉</span></button></div>
        <nav className="table-tools" aria-label="Table controls">
          <button className="tool-button chat-toggle" aria-expanded={isChatOpen} aria-controls="table-chat" onClick={() => setIsChatOpen(!isChatOpen)}>Chat {unreadCount > 0 && <b className="unread-count">{unreadCount}</b>}</button>
          {onOpenRulesModal && <button className="tool-button" onClick={onOpenRulesModal}>Rules</button>}
          <button className="tool-button sound-toggle" onClick={handleToggleMute} aria-label={isMuted ? 'Unmute sound' : 'Mute sound'} aria-pressed={!isMuted}>{isMuted ? 'Sound off' : 'Sound on'}</button>
          <button className="tool-button leave-button" onClick={onLeaveRoom}>Leave</button>
          {(phone.isPhone || phone.fullscreen) && phone.canFullscreen && <button className="tool-button fullscreen-toggle" onClick={() => void phone.toggleFullscreen()} aria-label={phone.fullscreen ? 'Exit full screen' : 'Enter full screen landscape'}><span className="fullscreen-label">{phone.fullscreen ? 'Exit full screen' : phone.landscape ? 'Full screen' : 'Landscape'}</span> <span aria-hidden="true">⛶</span></button>}
          {phone.isPhone && <PhoneTableMenu code={room.code} muted={isMuted} onCopy={handleCopyCode} onToggleSound={handleToggleMute} onRules={onOpenRulesModal} onLeave={onLeaveRoom} />}
        </nav>
        {phone.rotateHint && <div className="phone-rotate-hint" role="status"><span aria-hidden="true">↻</span><span>Rotate for a bigger table.</span><button aria-label="Dismiss rotation tip" onClick={phone.dismissHint}>×</button></div>}
        {phone.message && <span className="phone-screen-message" role="status">{phone.message}</span>}
      </header>
      <div className={`game-workspace${isChatOpen ? ' chat-is-open' : ''}`}>
      <div className="game-board">
      <div className="game-info">
        <span className="deal-label">Deal {gameState?.currentDeal ?? 1}<span>Single Sir · First to 7 tricks</span></span>
        {scores}
        <div className="trump-guide" aria-live="polite">{gameState?.trumpSuit
          ? <><span className="trump-guide-symbol" aria-hidden="true">{SUIT_SYMBOLS[gameState.trumpSuit]}</span><span><strong>{gameState.trumpSuit} are trump</strong><span>Beats other suits when you can’t follow.</span></span></>
          : <span><strong>Trump is being chosen</strong><span>The special suit that beats other suits.</span></span>}</div>
      </div>
      {actionError && <div className="game-error" role="alert">{actionError}</div>}
      <main className="table-stage" aria-label="Court Piece table">
        <div className="felt-table" aria-hidden="true" />
        <div className="table-seat table-seat-top">{renderSeat(topSeat, 'top', true)}</div>
        <div className="table-seat table-seat-left">{renderSeat(leftSeat, 'left', false)}</div>
        <div className="table-center">{gameState && <TrickArea trumpSuit={gameState.trumpSuit} lastCompletedTrick={gameState.completedTricks.at(-1)} trick={cardPlay.trick ?? gameState.currentTrick} localOrigin={cardPlay.pending?.origin} localCardId={cardPlay.pending?.play.card.id} getRelativePosition={getRelativePosition} seats={room.seats.filter((s): s is Player => s !== null)} />}</div>
        <div className="table-seat table-seat-right">{renderSeat(rightSeat, 'right', false)}</div>
        {!phone.landscape && <div className="table-seat table-seat-bottom">{renderSeat(bottomSeat, 'bottom', false, true)}</div>}
      </main>
      <section className="hand-dock" aria-label="Your cards">
        <span className="sr-only" role="status">{isMyTurn && gameState?.status === 'playing' ? clock.warning ? 'Your turn. Seven seconds or less remaining.' : 'Your turn.' : ''}</span>
        {clock.error && <span className="clock-connection-error" role="status">{clock.error}</span>}
        <HandView reactionControl={<ReactionPicker placement="hand" onSendReaction={handleSendReaction} />} cards={isTrumpSelection ? displayHand : cardPlay.hand} isMyTurn={isMyTurn && gameState?.status === 'playing'} leadSuit={gameState?.currentTrick.leadSuit} trumpSuit={gameState?.trumpSuit} onPlayCard={handlePlayCard} isLoading={cardPlay.isPending} />
      </section>

      </div>

      {/* Chat remains in the workspace next to the playable board. */}
      <CommonChatDrawer isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} messages={messages} localPlayerId={localPlayerId} onSendMessage={handleSendChatMessage} />
      </div>

      {/* Trump Selection Modal */}
      <TrumpSelectionModal
        key={gameState?.currentDeal}
        isOpen={isTrumpSelection}
        isCaller={isTrumpCaller}
        callerPlayer={trumpCallerPlayer}
        callerCards={displayHand}
        onSelectTrump={handleSelectTrump}
      />

      {/* Score & Hand Record Drawer */}
      <ScoreRecordDrawer
        isOpen={isScoreDrawerOpen}
        onClose={() => setIsScoreDrawerOpen(false)}
        gameState={gameState}
        seats={room.seats}
      />


    </div>
  );
};
