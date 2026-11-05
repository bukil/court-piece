import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';
const PHONE_QUERY = '(max-width: 600px) and (orientation: portrait), (max-width: 1100px) and (max-height: 600px) and (orientation: landscape)';
const LANDSCAPE_QUERY = '(max-width: 1100px) and (max-height: 600px) and (orientation: landscape)';
function useMedia(query: string) {
  const subscribe = useCallback((callback: () => void) => { const media = matchMedia(query); media.addEventListener('change',callback); return () => media.removeEventListener('change',callback); }, [query]);
  return useSyncExternalStore(subscribe, () => matchMedia(query).matches, () => false);
}
interface DeviceHints { deviceMemory?: number; hardwareConcurrency?: number; connection?: {saveData?: boolean}; }
export function lowResourceDevice(device: DeviceHints = navigator as Navigator & DeviceHints) {
  return !!device.connection?.saveData || (device.deviceMemory !== undefined && device.deviceMemory <= 2) || (device.hardwareConcurrency !== undefined && device.hardwareConcurrency <= 4);
}
type LockableOrientation = ScreenOrientation & { lock?: (orientation: 'landscape') => Promise<void> };
export function usePhoneTable() {
  const isPhone = useMedia(PHONE_QUERY), landscape = useMedia(LANDSCAPE_QUERY);
  const [fullscreen,setFullscreen] = useState(() => !!document.fullscreenElement);
  const [hintDismissed,setHintDismissed] = useState(false);
  const [message,setMessage] = useState('');
  const locked = useRef(false);
  const enteredFullscreen = useRef(false);
  useEffect(() => {
    const release = () => { if (locked.current) { try { screen.orientation?.unlock?.(); } catch { /* The page may already be hidden. */ } locked.current = false; } };
    const changed = () => { setFullscreen(!!document.fullscreenElement); if (!document.fullscreenElement) { enteredFullscreen.current = false; release(); } };
    document.addEventListener('fullscreenchange',changed);
    return () => { document.removeEventListener('fullscreenchange',changed); release(); if (enteredFullscreen.current && document.fullscreenElement) void document.exitFullscreen().catch(() => {}); };
  }, []);
  const toggleFullscreen = async () => {
    setMessage('');
    if (document.fullscreenElement) { try { await document.exitFullscreen(); } catch { /* The browser may already have exited. */ } return; }
    try {
      await document.documentElement.requestFullscreen();
      enteredFullscreen.current = true;
      const orientation = screen.orientation as LockableOrientation | undefined;
      if (orientation?.lock) {
        try { await orientation.lock('landscape'); locked.current = true; }
        catch { if (!landscape) setMessage('Rotate your phone to landscape.'); }
      }
    } catch { setMessage('Rotate your phone to landscape.'); }
  };
  return { isPhone, landscape, lite: isPhone && lowResourceDevice(), fullscreen, canFullscreen: !!document.fullscreenEnabled && typeof document.documentElement.requestFullscreen === 'function', toggleFullscreen, rotateHint: isPhone && !landscape && !hintDismissed, dismissHint: () => setHintDismissed(true), message };
}
