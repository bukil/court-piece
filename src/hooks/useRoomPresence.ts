import { useEffect, useState } from 'react';
import { roomService } from '../services/roomService';
import { PRESENCE_STALE_MS } from '../game-engine/turnClock';
import type { Player } from '../types/game';
export function playerIsOnline(player: Player | null | undefined, now = Date.now()) {
  if (!player || !player.isConnected) return false;
  if (player.connections) return Object.values(player.connections).some(seen => now - seen < PRESENCE_STALE_MS);
  return now - player.lastSeen < PRESENCE_STALE_MS;
}
export function useRoomPresence(roomId: string, playerId: string) {
  const [now, setNow] = useState(Date.now);
  useEffect(() => {
    const connectionId = crypto.randomUUID();
    let closing = false;
    const publish = (online: boolean) => { void roomService.updatePresence(roomId, playerId, connectionId, online).catch(error => console.warn('[Presence]', error)); };
    const online = () => { if (!closing) publish(navigator.onLine); };
    const offline = () => { setNow(Date.now()); publish(false); };
    const pageHide = () => { closing = true; publish(false); };
    const pageShow = () => { closing = false; online(); };
    const visibility = () => { if (document.visibilityState === 'visible') online(); };
    online();
    const heartbeat = setInterval(online, 10_000);
    const statusClock = setInterval(() => setNow(Date.now()), 1000);
    window.addEventListener('online', online); window.addEventListener('offline', offline);
    window.addEventListener('pagehide', pageHide); window.addEventListener('pageshow', pageShow);
    document.addEventListener('visibilitychange', visibility);
    return () => {
      closing = true; clearInterval(heartbeat); clearInterval(statusClock); publish(false);
      window.removeEventListener('online', online); window.removeEventListener('offline', offline);
      window.removeEventListener('pagehide', pageHide); window.removeEventListener('pageshow', pageShow);
      document.removeEventListener('visibilitychange', visibility);
    };
  }, [roomId, playerId]);
  return now;
}
