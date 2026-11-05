import { describe, expect, it } from 'vitest';
import { normalizeReaction, reactionDuration } from '../../src/game-engine/reactions';
describe('shared reactions', () => {
  it('shares only a GIF identity and bounded title, never a media URL', () => {
    expect(normalizeReaction({ type: 'gif', id: 'ABC123', title: 'Cheers' })).toEqual({ emoji: '🎞', gif: { type: 'gif', id: 'ABC123', title: 'Cheers' } });
    expect(() => normalizeReaction({ type: 'gif', id: 'https://example.com/a.gif', title: '' })).toThrow();
  });
  it('keeps GIFs visible briefly and preserves emoji behavior', () => {
    expect(reactionDuration(normalizeReaction('😂'))).toBe(3200);
    expect(reactionDuration(normalizeReaction({type:'gif',id:'abc',title:''}))).toBe(5000);
  });
});
