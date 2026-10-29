import React, { useState } from 'react';

interface ReactionPickerProps {
  onSendReaction: (emoji: string) => void;
}

const REACTIONS = ['👏', '🔥', '👑', '😮', '🤝', '😂', '🎯', '💔'];

export const ReactionPicker: React.FC<ReactionPickerProps> = ({ onSendReaction }) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleSelect = (emoji: string) => {
    onSendReaction(emoji);
    setIsOpen(false);
  };

  return (
    <div className="relative inline-flex items-center">
      {/* Expanded Reaction Buttons */}
      {isOpen && (
        <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 flex items-center gap-1.5 p-1.5 rounded-2xl bg-slate-900/95 border border-slate-700/80 shadow-2xl backdrop-blur-md animate-fade-in z-40">
          {REACTIONS.map((emoji) => (
            <button
              key={emoji}
              type="button"
              onClick={() => handleSelect(emoji)}
              className="w-8 h-8 flex items-center justify-center text-lg rounded-xl hover:bg-slate-800 hover:scale-125 active:scale-95 transition-all cursor-pointer"
            >
              {emoji}
            </button>
          ))}
        </div>
      )}

      {/* Toggle button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        title="Send live reaction"
        className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-700/80 text-xs font-mono text-slate-300 hover:text-white transition-all cursor-pointer shadow-sm active:scale-95"
      >
        <span>💬</span>
        <span className="hidden sm:inline text-[11px]">React</span>
      </button>
    </div>
  );
};

