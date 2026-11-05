import React, { useEffect, useRef, useState } from 'react';
import { AnimatedEmoji } from '../common/AnimatedEmoji';
import { GiphyPicker } from './GiphyPicker';
import type { ReactionInput } from '../../types/game';
import { REACTION_PACK } from '../../data/reactionPack';
interface ReactionPickerProps { placement?: 'header' | 'hand'; onSendReaction: (reaction: ReactionInput) => void | Promise<void>; }
export const ReactionPicker: React.FC<ReactionPickerProps> = ({ onSendReaction, placement = 'header' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [tab, setTab] = useState<'emoji' | 'gif'>('emoji');
  const [error, setError] = useState('');
  async function send(reaction: ReactionInput) { await onSendReaction(reaction); setIsOpen(false); }
  const [category, setCategory] = useState('Funny');
  const [preview, setPreview] = useState<string | null>(null);
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!isOpen) return;
    const close = (event: PointerEvent) => { if (!root.current?.contains(event.target as Node)) setIsOpen(false); };
    const escape = (event: KeyboardEvent) => { if (event.key === 'Escape') { setIsOpen(false); root.current?.querySelector<HTMLButtonElement>('.reaction-toggle')?.focus(); } };
    document.addEventListener('pointerdown', close); document.addEventListener('keydown', escape);
    return () => { document.removeEventListener('pointerdown', close); document.removeEventListener('keydown', escape); };
  }, [isOpen]);
  return <div ref={root} className={`reaction-picker${placement === 'hand' ? ' hand-reactions' : ''}`}>
    <button type="button" className="tool-button reaction-toggle" onClick={() => setIsOpen(!isOpen)} aria-expanded={isOpen} aria-controls="table-reactions" aria-label={placement === 'hand' ? 'Send a reaction' : 'React'} title="React">{placement === 'header' ? 'React ' : ''}<span aria-hidden="true">☺</span></button>
    {isOpen && <div id="table-reactions" className="reaction-catalog" role="group" aria-label="Animated reactions">
      <div className="reaction-catalog-header"><strong>React</strong><button aria-label="Close reactions" onClick={() => setIsOpen(false)}>×</button></div>
      <div className="reaction-categories"><button aria-pressed={tab === 'emoji'} onClick={() => setTab('emoji')}>Emoji</button><button aria-pressed={tab === 'gif'} onClick={() => setTab('gif')}>GIFs</button></div>
      {error && <p role="alert">{error}</p>}
      {tab === 'gif' ? <GiphyPicker onSend={send} /> : <><div className="reaction-categories" aria-label="Reaction categories">{['Funny', 'Cheers', 'Characters'].map(group => <button key={group} aria-pressed={category === group} onClick={() => setCategory(group)}>{group}</button>)}</div>
      <div className="reaction-grid">{REACTION_PACK.filter(item => item.group === category).map(item => <button key={item.code} aria-label={item.label} title={item.label}
        onMouseEnter={() => setPreview(item.code)} onMouseLeave={() => setPreview(null)} onFocus={() => setPreview(item.code)} onBlur={() => setPreview(null)}
        onClick={() => { void send(item.emoji).catch(() => setError('Couldn’t send. Try again.')); }}>
          <AnimatedEmoji emoji={item.emoji} active={preview === item.code} /><span>{item.label}</span>
        </button>)}</div>
      <a className="pack-credit" href="https://googlefonts.github.io/noto-emoji-files/?view=docs" target="_blank" rel="noreferrer">Noto Emoji by Google · CC BY 4.0 ↗</a></>}
    </div>}
  </div>;
};
