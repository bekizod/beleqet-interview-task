'use client';

import { useState, useRef, useEffect } from 'react';
import { X, Send, Wifi, WifiOff, MessageSquare } from 'lucide-react';
import { useChat } from '@/lib/hooks/useChat';
import { useAuth } from '@/lib/hooks/useAuth';
import { useCreateOrGetChatRoomMutation } from '@/lib/store/slices/chatApiSlice';

interface Props {
  /** The other participant's user id */
  otherUserId: string;
  /** Display name shown in the chat header */
  otherUserName: string;
  onClose: () => void;
}

export default function ChatWindow({ otherUserId, otherUserName, onClose }: Props) {
  const { accessToken, user } = useAuth();
  const [roomId, setRoomId] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  const [createOrGetRoom, { isLoading: loadingRoom, error: roomError }] = useCreateOrGetChatRoomMutation();

  // Fetch or create the chat room via REST first
  useEffect(() => {
    if (!accessToken || !otherUserId) return;

    createOrGetRoom({ otherUserId })
      .unwrap()
      .then((room) => setRoomId(room.id))
      .catch((err) => {
        console.error('Failed to create/get room:', err);
      });
  }, [accessToken, otherUserId, createOrGetRoom]);

  const { messages, connected, error: wsError, sendMessage } = useChat(roomId, accessToken);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    sendMessage(input);
    setInput('');
  };

  const formatTime = (iso: string) =>
    new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="fixed bottom-4 right-4 z-50 w-80 sm:w-96 flex flex-col rounded-2xl shadow-2xl border border-border bg-white overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-brandGreen text-white">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4" />
          <span className="font-semibold text-sm truncate">{otherUserName}</span>
        </div>
        <div className="flex items-center gap-2">
          {connected ? (
            <Wifi className="h-3.5 w-3.5 text-green-200" aria-label="Connected" />
          ) : (
            <WifiOff className="h-3.5 w-3.5 text-red-200" aria-label="Disconnected" />
          )}
          <button onClick={onClose} className="hover:opacity-70 transition-opacity">
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Messages area */}
      <div className="flex-1 h-72 overflow-y-auto px-3 py-3 space-y-2 bg-gray-50">
        {loadingRoom && (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin h-6 w-6 border-2 border-brandGreen border-t-transparent rounded-full" />
          </div>
        )}

        {(roomError || wsError) && !loadingRoom && (
          <div className="flex items-center justify-center h-full text-center text-sm text-red-500 px-4">
            {roomError ? 'Failed to open chat room' : wsError}
          </div>
        )}

        {!loadingRoom && !roomError && messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center gap-2">
            <MessageSquare className="h-8 w-8 text-muted/40" />
            <p className="text-xs text-muted">No messages yet. Say hello!</p>
          </div>
        )}

        {messages.map((msg) => {
          const isMine = msg.senderId === user?.id;
          return (
            <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[75%] space-y-0.5`}>
                {!isMine && (
                  <p className="text-[10px] text-muted ml-1">
                    {msg.sender.firstName} {msg.sender.lastName}
                  </p>
                )}
                <div
                  className={`px-3 py-2 rounded-2xl text-sm leading-snug ${
                    isMine
                      ? 'bg-brandGreen text-white rounded-br-sm'
                      : 'bg-white border border-border text-ink rounded-bl-sm'
                  }`}
                >
                  {msg.content}
                </div>
                <p className={`text-[10px] text-muted/60 ${isMine ? 'text-right' : 'text-left'} px-1`}>
                  {formatTime(msg.createdAt)}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="flex items-center gap-2 px-3 py-2 border-t border-border bg-white">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={connected ? 'Type a message…' : 'Connecting…'}
          disabled={!connected || loadingRoom}
          className="flex-1 text-sm px-3 py-2 rounded-full border border-border outline-none focus:border-brandGreen bg-pageBg disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={!connected || !input.trim() || loadingRoom}
          className="flex-shrink-0 h-8 w-8 flex items-center justify-center rounded-full bg-brandGreen text-white hover:bg-darkGreen transition-colors disabled:opacity-50"
        >
          <Send className="h-3.5 w-3.5" />
        </button>
      </form>
    </div>
  );
}
