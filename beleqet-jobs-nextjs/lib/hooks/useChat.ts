'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

export interface ChatMessage {
  id: string;
  roomId: string;
  senderId: string;
  content: string;
  createdAt: string;
  sender: {
    id: string;
    firstName: string;
    lastName: string;
    avatarUrl?: string;
    role: string;
  };
}

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:4000';

export function useChat(roomId: string | null, accessToken: string | null) {
  const socketRef = useRef<Socket | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!roomId || !accessToken) return;

    const socket = io(`${WS_URL}/chat`, {
      auth: { token: `Bearer ${accessToken}` },
      transports: ['websocket'],
      reconnectionAttempts: 5,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('[useChat] WebSocket connected');
      setConnected(true);
      setError(null);
      console.log('[useChat] Joining room:', roomId);
      socket.emit('join_room', { roomId });
    });

    socket.on('disconnect', () => {
      console.log('[useChat] WebSocket disconnected');
      setConnected(false);
    });

    socket.on('connect_error', (err) => {
      console.error('[useChat] Connection error:', err);
      setError('Could not connect to chat. Please try again.');
      setConnected(false);
    });

    socket.on('room_history', (history: ChatMessage[]) => {
      console.log('[useChat] Received room history:', history.length, 'messages');
      setMessages(history);
    });

    socket.on('new_message', (msg: ChatMessage) => {
      console.log('[useChat] New message received:', msg);
      setMessages((prev) => {
        // avoid duplicates
        if (prev.some((m) => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
    });

    socket.on('error', (err: { message: string }) => {
      console.error('[useChat] Socket error:', err);
      setError(err.message);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
      setMessages([]);
      setConnected(false);
    };
  }, [roomId, accessToken]);

  const sendMessage = useCallback(
    (content: string) => {
      if (!socketRef.current || !roomId || !content.trim()) {
        console.log('[useChat] Cannot send message:', {
          hasSocket: !!socketRef.current,
          roomId,
          content,
          connected
        });
        return;
      }
      console.log('[useChat] Sending message:', { roomId, content });
      socketRef.current.emit('send_message', { roomId, content: content.trim() });
    },
    [roomId, connected],
  );

  return { messages, connected, error, sendMessage };
}
