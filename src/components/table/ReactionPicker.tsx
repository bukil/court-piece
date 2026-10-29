import React, { useState } from 'react';

interface ReactionPickerProps {
  onSendReaction: (emoji: string) => void;
}

const REACTIONS = ['👏', '🔥', '👑', '😮', '😂', '🎯'];

export const ReactionPicker: React.FC<ReactionPickerProps> = ({ onSendReaction }) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleSelect = (emoji: string) => {
    onSendReaction(emoji);
    setIsOpen(false);
  };

  return (
    <div className="relative inline-flex items-center">
      {isOpen && (
        <div className="absolute bottom-full mb-2 right-0 flex items-center gap-1 p-1 rounded-full bg-neutral-900/90 border border-white/10 shadow-2xl backdrop-blur-2xl animate-fade-in z-40">
          {REACTIONS.map((emoji) => (
            <button
              key={emoji}
              type="button"
              onClick={() => handleSelect(emoji)}
              className="w-8 h-8 flex items-center justify-center text-base rounded-full hover:bg-white/10 hover:scale-125 active:scale-95 transition-all cursor-pointer"
            >
              {emoji}
            </button>
          ))}
        </div>
      )}

      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="px-3 py-1 rounded-full bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] text-xs text-white/50 hover:text-white transition-all cursor-pointer active:scale-95"
      >
        React
      </button>
    </div>
  );
};
