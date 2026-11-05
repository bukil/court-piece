import React, { useEffect, useRef, useState } from 'react';
interface ReactionPickerProps { onSendReaction: (emoji: string) => void; }
const REACTIONS = [ ['👏', 'Well played'], ['🔥', 'On fire'], ['👑', 'Royal move'], ['😮', 'Surprised'], ['😂', 'Laugh'], ['🎯', 'Perfect play'] ];
export const ReactionPicker: React.FC<ReactionPickerProps> = ({ onSendReaction }) => {
  const [isOpen, setIsOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!isOpen) return;
    const close = (e: PointerEvent) => { if (!root.current?.contains(e.target as Node)) setIsOpen(false); };
    const escape = (e: KeyboardEvent) => { if (e.key === 'Escape') { setIsOpen(false); root.current?.querySelector<HTMLButtonElement>('.reaction-toggle')?.focus(); } };
    document.addEventListener('pointerdown', close);
    document.addEventListener('keydown', escape);
    return () => { document.removeEventListener('pointerdown', close); document.removeEventListener('keydown', escape); };
  }, [isOpen]);
  return <div ref={root} className="reaction-picker">
    <button type="button" className="tool-button reaction-toggle" onClick={() => setIsOpen(!isOpen)} aria-expanded={isOpen} aria-controls="table-reactions">React <span aria-hidden="true">☺</span></button>
    {isOpen && <div id="table-reactions" className="reaction-menu" role="group" aria-label="Send a reaction">{REACTIONS.map(([emoji, label]) => <button key={emoji} type="button" aria-label={label} title={label} onClick={() => { onSendReaction(emoji); setIsOpen(false); }}>{emoji}</button>)}</div>}
  </div>;
};
