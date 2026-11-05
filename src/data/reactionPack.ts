// Original Noto Emoji assets by Google. See public/packs/noto-emoji/ATTRIBUTION.md.
export const REACTION_PACK = [
  { emoji: '😂', code: '1f602', label: 'I’m crying', group: 'Funny' },
  { emoji: '💀', code: '1f480', label: 'I’m dead', group: 'Funny' },
  { emoji: '🤯', code: '1f92f', label: 'Mind blown', group: 'Funny' },
  { emoji: '🫠', code: '1fae0', label: 'Melting', group: 'Funny' },
  { emoji: '🤡', code: '1f921', label: 'Clown moment', group: 'Funny' },
  { emoji: '😎', code: '1f60e', label: 'Too cool', group: 'Funny' },
  { emoji: '👏', code: '1f44f', label: 'Well played', group: 'Cheers' },
  { emoji: '🔥', code: '1f525', label: 'On fire', group: 'Cheers' },
  { emoji: '👑', code: '1f451', label: 'Royal move', group: 'Cheers' },
  { emoji: '🎯', code: '1f3af', label: 'Perfect play', group: 'Cheers' },
  { emoji: '🥳', code: '1f973', label: 'Let’s celebrate', group: 'Cheers' },
  { emoji: '😮', code: '1f62e', label: 'Surprised', group: 'Cheers' },
  { emoji: '🤖', code: '1f916', label: 'Robot', group: 'Characters' },
  { emoji: '👽', code: '1f47d', label: 'Alien', group: 'Characters' },
  { emoji: '👻', code: '1f47b', label: 'Ghost', group: 'Characters' },
  { emoji: '😻', code: '1f63b', label: 'Heart eyes cat', group: 'Characters' },
] as const;
export const AVATAR_PACK = REACTION_PACK.filter(item => item.group === 'Characters' || item.emoji === '😎' || item.emoji === '🤡');
export const emojiAsset = (code: string, format: 'webp' | 'svg') => `${import.meta.env.BASE_URL}packs/noto-emoji/${code}.${format}`;
