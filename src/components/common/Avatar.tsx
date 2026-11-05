import React from 'react';
import { AnimatedEmoji } from './AnimatedEmoji';
import { resolveAvatar } from '../../data/avatarCatalog';
interface AvatarProps { seed: string; avatarId?: string; size?: 'sm' | 'md' | 'lg'; className?: string; teamId?: number; animate?: boolean; }
export const Avatar: React.FC<AvatarProps> = ({ seed, avatarId, size = 'md', className = '', teamId, animate = true }) => {
  const avatar = resolveAvatar(avatarId, seed);
  return <div className={`pack-avatar avatar-${size} avatar-team-${teamId ?? 'neutral'} ${'src' in avatar ? 'avatar-photo' : ''} ${className}`}>
    {'src' in avatar ? <img src={`${import.meta.env.BASE_URL}${avatar.src}`} alt="" width="72" height="72" decoding="async" /> : <AnimatedEmoji emoji={avatar.emoji} active={animate} />}
  </div>;
};
