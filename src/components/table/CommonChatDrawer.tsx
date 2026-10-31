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
  'Well played!',
  'Nice trick',
  'Good game',
  'Trump power',
  'Oops',
  'Let’s go',
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
    return teamId === 0 ? 'text-emerald-400' : 'text-amber-400';
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-end sm:p-4 bg-black/75 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="w-full sm:max-w-xs h-[75vh] sm:h-[520px] bg-neutral-900 sm:border border-neutral-800 rounded-t-2xl sm:rounded-2xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 bg-neutral-900">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold tracking-tight text-white">Chat</span>
            <span className="text-xs text-neutral-500">({messages.length})</span>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="text-neutral-400 hover:text-white p-1 rounded-lg hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Quick preset chips */}
        <div className="flex gap-1.5 px-3 py-2 overflow-x-auto no-scrollbar bg-neutral-950/40">
          {PRESET_CHIPS.map((chip) => (
            <button
              key={chip}
              type="button"
              onClick={() => handleSend(chip)}
              className="px-2.5 py-1 rounded-full bg-neutral-800 hover:bg-neutral-700 text-xs text-neutral-300 whitespace-nowrap active:scale-95 transition-transform transition-colors cursor-pointer"
            >
              {chip}
            </button>
          ))}
        </div>

        {/* Messages List */}
        <div className="flex-1 p-4 overflow-y-auto space-y-3 no-scrollbar">
          {messages.length === 0 ? (
            <div className="text-center text-xs text-neutral-500 pt-16">
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
                  <div className="flex items-center gap-1.5 mb-0.5 text-[10px] text-neutral-400">
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
                    className={`max-w-[85%] px-3 py-1.5 rounded-xl text-xs ${
                      isMe
                        ? 'bg-white text-black font-medium'
                        : 'bg-neutral-800 text-neutral-100'
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
          className="p-3 bg-neutral-950 flex items-center gap-2"
        >
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Message..."
            maxLength={100}
            className="flex-1 px-3.5 py-2 rounded-xl bg-neutral-900 border border-neutral-800 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-neutral-600"
          />
          <button
            type="submit"
            disabled={!inputText.trim() || isSending}
            className="px-4 py-2 rounded-xl bg-white text-black text-xs font-semibold hover:bg-neutral-200 active:scale-95 transition-transform transition-colors cursor-pointer disabled:opacity-40"
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
};

