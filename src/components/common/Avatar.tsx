import React from 'react';

interface AvatarProps {
  seed: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  teamId?: number;
}

export const Avatar: React.FC<AvatarProps> = ({
  seed,
  size = 'md',
  className = '',
  teamId,
}) => {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }
  const posHash = Math.abs(hash);

  const sizeClasses = {
    sm: 'w-7 h-7 sm:w-8 sm:h-8',
    md: 'w-9 h-9 sm:w-10 sm:h-10',
    lg: 'w-12 h-12 sm:w-14 sm:h-14',
  }[size];

  // Refined organic duotone palettes (No AI violet/indigo)
  const palettes = [
    { bg: '#064e3b', face: '#34d399', accent: '#10b981', eye: '#ecfdf5' }, // Forest (Team 1)
    { bg: '#78350f', face: '#fbbf24', accent: '#f59e0b', eye: '#fffbeb' }, // Amber (Team 2)
    { bg: '#1e293b', face: '#94a3b8', accent: '#64748b', eye: '#f8fafc' }, // Slate
    { bg: '#14532d', face: '#86efac', accent: '#22c55e', eye: '#f0fdf4' }, // Pine
    { bg: '#831843', face: '#fb7185', accent: '#f43f5e', eye: '#fff1f2' }, // Terracotta
    { bg: '#134e4a', face: '#5eead4', accent: '#14b8a6', eye: '#f0fdfa' }, // Deep Teal
  ];

  const palette =
    teamId !== undefined
      ? teamId === 0
        ? palettes[0]
        : palettes[1]
      : palettes[posHash % palettes.length];

  const eyeType = posHash % 4;
  const mouthType = Math.floor(posHash / 4) % 3;
  const hairStyle = Math.floor(posHash / 12) % 3;

  return (
    <div
      className={`relative inline-flex items-center justify-center rounded-full overflow-hidden border border-white/10 shrink-0 select-none ${sizeClasses} ${className}`}
      style={{ backgroundColor: palette.bg }}
    >
      <svg
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full"
      >
        {/* Hair / Head Accent */}
        {hairStyle === 0 && (
          <circle cx="20" cy="18" r="16" fill={palette.accent} opacity="0.3" />
        )}
        {hairStyle === 1 && (
          <path d="M8 14L20 4L32 14H8Z" fill={palette.accent} opacity="0.3" />
        )}
        {hairStyle === 2 && (
          <rect x="6" y="8" width="28" height="8" rx="4" fill={palette.accent} opacity="0.3" />
        )}

        {/* Head Surface */}
        <circle cx="20" cy="22" r="13" fill={palette.face} />

        {/* Eyes */}
        {eyeType === 0 && (
          <>
            <circle cx="15" cy="20" r="1.5" fill={palette.eye} />
            <circle cx="25" cy="20" r="1.5" fill={palette.eye} />
          </>
        )}
        {eyeType === 1 && (
          <>
            <path d="M13 21C13 19.5 16.5 19.5 16.5 21" stroke={palette.eye} strokeWidth="1.75" strokeLinecap="round" />
            <path d="M23.5 21C23.5 19.5 27 19.5 27 21" stroke={palette.eye} strokeWidth="1.75" strokeLinecap="round" />
          </>
        )}
        {eyeType === 2 && (
          <>
            <rect x="12" y="18" width="6" height="5" rx="1.5" stroke={palette.eye} strokeWidth="1.5" />
            <rect x="22" y="18" width="6" height="5" rx="1.5" stroke={palette.eye} strokeWidth="1.5" />
            <line x1="18" y1="20" x2="22" y2="20" stroke={palette.eye} strokeWidth="1.5" />
          </>
        )}
        {eyeType === 3 && (
          <>
            <circle cx="15" cy="20" r="1.5" fill={palette.eye} />
            <line x1="23" y1="20" x2="27" y2="20" stroke={palette.eye} strokeWidth="2" strokeLinecap="round" />
          </>
        )}

        {/* Mouth */}
        {mouthType === 0 && (
          <path d="M16 26C17.5 28 22.5 28 24 26" stroke={palette.eye} strokeWidth="1.75" strokeLinecap="round" />
        )}
        {mouthType === 1 && (
          <path d="M15 25C15 28 25 28 25 25H15Z" fill={palette.eye} />
        )}
        {mouthType === 2 && (
          <line x1="17" y1="27" x2="23" y2="27" stroke={palette.eye} strokeWidth="1.75" strokeLinecap="round" />
        )}
      </svg>
    </div>
  );
};
