import { useEffect, useRef } from 'react';

/** Follow the visible viewport, including mobile browser bars and the on-screen keyboard. */
export function useGameViewport() {
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const viewport = window.visualViewport;
    const update = () => {
      if (!root.current) return;
      const height = viewport?.height ?? window.innerHeight;
      root.current.style.setProperty('--game-height', `${height}px`);
      root.current.style.setProperty('--game-top', `${viewport?.offsetTop ?? 0}px`);
      root.current.dataset.keyboardOpen = String(height < window.innerHeight * .78);
    };
    update();
    viewport?.addEventListener('resize', update);
    viewport?.addEventListener('scroll', update);
    window.addEventListener('resize', update);
    return () => {
      viewport?.removeEventListener('resize', update);
      viewport?.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  }, []);
  return root;
}
