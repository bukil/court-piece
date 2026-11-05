import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { ChatMessage } from '../../types/game';
import { soundService } from '../../services/soundService';
interface CommonChatDrawerProps {
  isOpen: boolean; onClose: () => void; messages: ChatMessage[];
  localPlayerId: string; onSendMessage: (text: string) => Promise<void>;
}
const PRESETS = ['Well played!', 'Nice trick', 'Good game'];

/** A parallel chat region: no dialog, backdrop, focus trap, or page scrolling. */
export const CommonChatDrawer: React.FC<CommonChatDrawerProps> = ({ isOpen, onClose, messages, localPlayerId, onSendMessage }) => {
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const list = useRef<HTMLDivElement>(null);
  const followLatest = useRef(true);
  const prevCount = useRef(messages.length);
  useEffect(() => {
    if (messages.length > prevCount.current && messages.at(-1)?.playerId !== localPlayerId) soundService.playChatChime();
    prevCount.current = messages.length;
  }, [messages, localPlayerId]);
  useLayoutEffect(() => {
    if (isOpen && list.current && (followLatest.current || messages.at(-1)?.playerId === localPlayerId)) list.current.scrollTop = list.current.scrollHeight;
  }, [messages, localPlayerId, isOpen]);
  if (!isOpen) return null;
  const send = async (text: string) => {
    if (!text.trim() || isSending) return;
    setIsSending(true); setError(null);
    try { await onSendMessage(text.trim()); setInputText(''); followLatest.current = true; }
    catch { setError('Message not sent. Try again.'); }
    finally { setIsSending(false); }
  };
  return <aside id="table-chat" className="table-chat" aria-label="Table chat">
    <header className="chat-header"><div><h2>Table talk</h2><span>Everyone at the table</span></div><button type="button" className="chat-close" onClick={onClose} aria-label="Hide chat">×</button></header>
    <div className="chat-messages" ref={list} role="log" aria-label="Table messages" aria-live="polite" aria-relevant="additions" tabIndex={0}
      onScroll={() => { if (list.current) followLatest.current = list.current.scrollHeight - list.current.scrollTop - list.current.clientHeight < 48; }}>
      {!messages.length ? <div className="chat-empty"><span aria-hidden="true">☏</span><p>A little table talk?</p><span>Say hello. The cards stay in play.</span></div>
      : messages.map(message => <div key={message.id} className={`chat-message${message.playerId === localPlayerId ? ' chat-message-mine' : ''}`}>
          <div className="chat-message-meta"><strong className={`chat-team-${message.teamId}`}>{message.playerId === localPlayerId ? 'You' : message.nickname}</strong><time dateTime={new Date(message.timestamp).toISOString()}>{new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</time></div>
          <p>{message.text}</p>
        </div>)}
    </div>
    <div className="chat-presets" aria-label="Quick messages">{PRESETS.map(text => <button key={text} disabled={isSending} onClick={() => void send(text)}>{text}</button>)}</div>
    {error && <p className="chat-error" role="alert">{error}</p>}
    <form className="chat-composer" onSubmit={event => { event.preventDefault(); void send(inputText); }}>
      <input aria-label="Message everyone at the table" placeholder="Say something…" autoComplete="off" maxLength={100} value={inputText} onChange={event => setInputText(event.target.value)} />
      <button aria-label="Send message" disabled={!inputText.trim() || isSending} type="submit">{isSending ? '…' : '↑'}</button>
    </form>
  </aside>;
};
