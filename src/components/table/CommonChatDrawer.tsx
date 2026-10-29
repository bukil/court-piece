import React, { useState, useEffect, useRef } from 'react';
import type { ChatMessage, TeamId } from '../../types/game';
import { soundService } from '../../services/soundService';

interface CommonChatDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  messages: ChatMessage[];
  localPlayerId: string;
  onSendMessage: (text: string) => Promise<void>;
}

const PRESET_CHIPS = [
  'Well played! 👏',
  'Nice trick! 🎯',
  'Good game! 🤝',
  'Trump power! 👑',
  'Oops! 😅',
  'Let’s go! 🔥',
];

export const CommonChatDrawer: React.FC<CommonChatDrawerProps> = ({
  isOpen,
  onClose,
  messages,
  localPlayerId,
  onSendMessage,
}) => {
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const prevCountRef = useRef(messages.length);

  useEffect(() => {
    if (messages.length > prevCountRef.current) {
      const latest = messages[messages.length - 1];
      if (latest && latest.playerId !== localPlayerId) {
        soundService.playChatChime();
      }
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
    prevCountRef.current = messages.length;
  }, [messages, localPlayerId]);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSend = async (textToSend: string) => {
    const trimmed = textToSend.trim();
    if (!trimmed || isSending) return;
    setIsSending(true);
    setInputText('');
    try {
      await onSendMessage(trimmed);
    } catch {
      // ignore
    } finally {
      setIsSending(false);
    }
  };

  const getTeamBadge = (teamId: TeamId) => {
    return teamId === 0 ? 'text-emerald-400' : 'text-indigo-400';
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-end sm:p-4 bg-black/60 backdrop-blur-xl animate-fade-in"
      onClick={onClose}
    >
      <div
        className="w-full sm:max-w-xs h-[75vh] sm:h-[520px] bg-neutral-900/95 border-t sm:border border-white/10 rounded-t-3xl sm:rounded-3xl flex flex-col shadow-2xl backdrop-blur-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/[0.08]">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold tracking-tight text-white">Chat</span>
            <span className="text-[10px] text-white/40">({messages.length})</span>
          </div>
          <button
            onClick={onClose}
            className="text-white/40 hover:text-white p-1 rounded-full hover:bg-white/10 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Quick preset chips */}
        <div className="flex gap-1.5 p-2.5 overflow-x-auto no-scrollbar border-b border-white/[0.04]">
          {PRESET_CHIPS.map((chip) => (
            <button
              key={chip}
              type="button"
              onClick={() => handleSend(chip)}
              className="px-2.5 py-1 rounded-full bg-white/[0.04] hover:bg-white/[0.1] border border-white/[0.06] text-[11px] text-white/70 whitespace-nowrap active:scale-95 transition-all cursor-pointer"
            >
              {chip}
            </button>
          ))}
        </div>

        {/* Messages List */}
        <div className="flex-1 p-4 overflow-y-auto space-y-3 no-scrollbar">
          {messages.length === 0 ? (
            <div className="text-center text-xs text-white/30 pt-16">
              No messages yet.<br />Tap a preset or say hello!
            </div>
          ) : (
            messages.map((msg) => {
              const isMe = msg.playerId === localPlayerId;
              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                >
                  <div className="flex items-center gap-1.5 mb-0.5 text-[10px] text-white/40">
                    <span className={`font-medium ${getTeamBadge(msg.teamId)}`}>
                      {msg.nickname}
                    </span>
                    <span>•</span>
                    <span>
                      {new Date(msg.timestamp).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                  <div
                    className={`max-w-[85%] px-3 py-1.5 rounded-2xl text-xs ${
                      isMe
                        ? 'bg-white text-black font-medium'
                        : 'bg-white/[0.08] text-white border border-white/[0.06]'
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend(inputText);
          }}
          className="p-3 border-t border-white/[0.08] flex items-center gap-2"
        >
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Message..."
            maxLength={100}
            className="flex-1 px-3.5 py-2 rounded-full bg-white/[0.05] border border-white/[0.08] text-xs text-white placeholder-white/30 focus:outline-none focus:border-white/30"
          />
          <button
            type="submit"
            disabled={!inputText.trim() || isSending}
            className="px-4 py-2 rounded-full bg-white text-black text-xs font-semibold hover:bg-white/90 active:scale-95 transition-all cursor-pointer disabled:opacity-40"
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
};
