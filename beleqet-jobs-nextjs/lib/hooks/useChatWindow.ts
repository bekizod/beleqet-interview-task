'use client';

import { useState } from 'react';

export interface ChatWindowState {
  isOpen: boolean;
  otherUserId: string | null;
  otherUserName: string | null;
}

export function useChatWindow() {
  const [chatState, setChatState] = useState<ChatWindowState>({
    isOpen: false,
    otherUserId: null,
    otherUserName: null,
  });

  const openChat = (userId: string, userName: string) => {
    setChatState({
      isOpen: true,
      otherUserId: userId,
      otherUserName: userName,
    });
  };

  const closeChat = () => {
    setChatState({
      isOpen: false,
      otherUserId: null,
      otherUserName: null,
    });
  };

  return {
    chatState,
    openChat,
    closeChat,
  };
}
