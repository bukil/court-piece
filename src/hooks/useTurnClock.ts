import { useEffect, useRef, useState } from 'react';
import type { PublicGameState } from '../types/game';
import { remainingSeconds, turnDeadline, turnKey, WARNING_SECONDS } from '../game-engine/turnClock';
import { roomService } from '../services/roomService';
import { soundService } from '../services/soundService';
export function useTurnClock(state: PublicGameState | null, roomId: string, localPlayerId: string, isLocalTurn: boolean) {
  const deadline = state ? turnDeadline(state) : null;
  const key = state ? turnKey(state) : '';
  const [reading, setReading] = useState(() => ({ key, seconds: remainingSeconds(deadline) }));
  const seconds = reading.key === key ? reading.seconds : remainingSeconds(deadline);
  const [error, setError] = useState<string | null>(null);
  const ticked = useRef('');
  useEffect(() => {
    const update = () => { const next = remainingSeconds(deadline); setReading(previous => previous.key === key && previous.seconds === next ? previous : { key, seconds: next }); };
    update();
    if (deadline === null) return;
    const timer = setInterval(update, 200);
    return () => clearInterval(timer);
  }, [deadline, key]);
  useEffect(() => {
    setError(null);
    if (deadline === null || !key) return;
    let cancelled = false;
    let retry: ReturnType<typeof setTimeout>;
    const expire = async () => {
      try {
        const played = await roomService.expireTurn(roomId, localPlayerId, key);
        if (!cancelled) { setError(null); if (!played) retry = setTimeout(expire, 1000); }
      } catch {
        if (!cancelled) { setError('Auto-play is reconnecting…'); retry = setTimeout(expire, 3000); }
      }
    };
    const timer = setTimeout(expire, Math.max(0, deadline - Date.now()) + (isLocalTurn ? 0 : 900));
    return () => { cancelled = true; clearTimeout(timer); clearTimeout(retry); };
  }, [deadline, key, roomId, localPlayerId, isLocalTurn]);
  useEffect(() => {
    const token = `${key}:${seconds}`;
    if (deadline !== null && isLocalTurn && seconds > 0 && seconds <= WARNING_SECONDS && ticked.current !== token) {
      ticked.current = token; soundService.playCountdownTick();
    }
  }, [deadline, isLocalTurn, key, seconds]);
  return { seconds: deadline === null ? 20 : seconds, error, warning: deadline !== null && seconds <= WARNING_SECONDS };
}
