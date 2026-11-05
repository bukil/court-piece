import { useEffect, useState } from 'react';
import { emojiAsset, REACTION_PACK } from '../../data/reactionPack';

interface AnimatedEmojiProps { emoji: string; active?: boolean; className?: string; label?: string; }
/** Imported WebP animation with a still SVG for reduced motion, idle state, and long sessions. */
export function AnimatedEmoji({ emoji, active = true, className = '', label }: AnimatedEmojiProps) {
  const [playing, setPlaying] = useState(active);
  const [failed, setFailed] = useState(false);
  const asset = REACTION_PACK.find(item => item.emoji === emoji);
  useEffect(() => {
    setPlaying(active);
    if (!active) return;
    const timer = setTimeout(() => setPlaying(false), 4000);
    return () => clearTimeout(timer);
  }, [active, emoji]);
  if (!asset || failed) return <span className={`pack-emoji ${className}`} role={label ? 'img' : undefined} aria-label={label} aria-hidden={!label}>{emoji}</span>;
  return <picture className={`pack-emoji ${className}`}>
    <source media="(prefers-reduced-motion: reduce)" srcSet={emojiAsset(asset.code, 'svg')} />
    <img src={emojiAsset(asset.code, playing ? 'webp' : 'svg')} alt={label ?? ''} width="72" height="72" decoding="async" onError={() => setFailed(true)} />
  </picture>;
}
