import React from 'react';

interface AvatarProps {
  seed: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  teamId?: number;
}

// Minimalist open-source duotone geometric avatars (inspired by Boring Avatars & DiceBear)
export const Avatar: React.FC<AvatarProps> = ({
  seed,
  size = 'md',
  className = '',
  teamId,
}) => {
  // Simple hash for deterministic generative features
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }
  const posHash = Math.abs(hash);

  const sizeClasses = {
    sm: 'w-7 h-7 sm:w-8 sm:h-8',
    md: 'w-10 h-10 sm:w-11 sm:h-11',
    lg: 'w-14 h-14 sm:w-16 sm:h-16',
  }[size];

  // Palette selection based on team or seed
  const palettes = [
    { bg: '#064e3b', face: '#34d399', accent: '#10b981', eye: '#ecfdf5' }, // Emerald (Team Alpha)
    { bg: '#312e81', face: '#818cf8', accent: '#6366f1', eye: '#eef2ff' }, // Indigo (Team Beta)
    { bg: '#701a75', face: '#f472b6', accent: '#ec4899', eye: '#fdf2f8' }, // Fuchsia
    { bg: '#78350f', face: '#fbbf24', accent: '#f59e0b', eye: '#fffbeb' }, // Amber
    { bg: '#0f766e', face: '#2dd4bf', accent: '#14b8a6', eye: '#f0fdfa' }, // Teal
    { bg: '#831843', face: '#fb7185', accent: '#f43f5e', eye: '#fff1f2' }, // Rose
  ];

  const palette =
    teamId !== undefined
      ? teamId === 0
        ? palettes[0]
        : palettes[1]
      : palettes[posHash % palettes.length];

  // Variations in facial features
  const eyeType = posHash % 4; // 0: dots, 1: curved happy, 2: glasses, 3: winking
  const mouthType = Math.floor(posHash / 4) % 3; // 0: smile, 1: wide smile, 2: neutral chill
  const hairStyle = Math.floor(posHash / 12) % 3; // 0: beanie/round, 1: spiky, 2: flat

  return (
    <div
      className={`relative inline-flex items-center justify-center rounded-full overflow-hidden border border-white/10 shadow-sm shrink-0 select-none ${sizeClasses} ${className}`}
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
          <circle cx="20" cy="18" r="16" fill={palette.accent} opacity="0.4" />
        )}
        {hairStyle === 1 && (
          <path d="M8 14L20 4L32 14H8Z" fill={palette.accent} opacity="0.4" />
        )}
        {hairStyle === 2 && (
          <rect x="10" y="6" width="20" height="8" rx="4" fill={palette.accent} opacity="0.4" />
        )}

        {/* Face Base */}
        <circle cx="20" cy="22" r="13" fill={palette.face} />

        {/* Eyes */}
        {eyeType === 0 && (
          <>
            <circle cx="15.5" cy="20" r="1.8" fill={palette.eye} />
            <circle cx="24.5" cy="20" r="1.8" fill={palette.eye} />
          </>
        )}
        {eyeType === 1 && (
          <>
            <path
              d="M13.5 21C14.2 19.5 16.8 19.5 17.5 21"
              stroke={palette.eye}
              strokeWidth="1.8"
              strokeLinecap="round"
            />
            <path
              d="M22.5 21C23.2 19.5 25.8 19.5 26.5 21"
              stroke={palette.eye}
              strokeWidth="1.8"
              strokeLinecap="round"
            />
          </>
        )}
        {eyeType === 2 && (
          <>
            {/* Minimalist Glasses */}
            <circle cx="15" cy="20" r="3.2" stroke={palette.eye} strokeWidth="1.4" />
            <circle cx="25" cy="20" r="3.2" stroke={palette.eye} strokeWidth="1.4" />
            <line x1="18.2" y1="20" x2="21.8" y2="20" stroke={palette.eye} strokeWidth="1.4" />
          </>
        )}
        {eyeType === 3 && (
          <>
            <circle cx="15.5" cy="20" r="1.8" fill={palette.eye} />
            <path
              d="M23 20.5L26 20.5"
              stroke={palette.eye}
              strokeWidth="1.8"
              strokeLinecap="round"
            />
          </>
        )}

        {/* Mouth */}
        {mouthType === 0 && (
          <path
            d="M16 26C17.5 28 22.5 28 24 26"
            stroke={palette.eye}
            strokeWidth="1.6"
            strokeLinecap="round"
          />
        )}
        {mouthType === 1 && (
          <path
            d="M15 25C15 29 25 29 25 25Z"
            fill={palette.eye}
          />
        )}
        {mouthType === 2 && (
          <line
            x1="17"
            y1="26.5"
            x2="23"
            y2="26.5"
            stroke={palette.eye}
            strokeWidth="1.6"
            strokeLinecap="round"
          />
        )}
      </svg>
    </div>
  );
};

