import React, { useState } from 'react';

interface ReactionPickerProps {
  onSendReaction: (emoji: string) => void;
}

// User-sent gameplay reactions (chat / table reactions)
const REACTIONS = ['👏', '🔥', '👑', '😮', '😂', '🎯']; // taste-skill-ignore

export const ReactionPicker: React.FC<ReactionPickerProps> = ({ onSendReaction }) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleSelect = (emoji: string) => {
    onSendReaction(emoji);
    setIsOpen(false);
  };

  return (
    <div className="relative inline-flex items-center">
      {isOpen && (
        <div className="absolute bottom-full mb-2 right-0 flex items-center gap-1 p-1 rounded-full bg-neutral-900 border border-neutral-800 animate-fade-in z-40">
          {REACTIONS.map((emoji) => (
            <button
              key={emoji}
              type="button"
              onClick={() => handleSelect(emoji)}
              className="w-8 h-8 flex items-center justify-center text-base rounded-full hover:bg-neutral-800 active:scale-95 transition-transform transition-colors cursor-pointer"
            >
              {emoji}
            </button>
          ))}
        </div>
      )}

      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="px-2.5 py-1 rounded-full bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-xs text-neutral-400 hover:text-white transition-colors cursor-pointer"
      >
        React
      </button>
    </div>
  );
};
