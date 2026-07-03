import { api } from '../api';

export interface ChatRoom {
  id: string;
  contractId?: string;
  jobId?: string;
  createdAt: string;
  updatedAt: string;
  participants: Array<{
    id: string;
    userId: string;
    roomId: string;
    joinedAt: string;
    lastReadAt?: string;
    user: {
      id: string;
      firstName: string;
      lastName: string;
      avatarUrl?: string;
      role: string;
    };
  }>;
}

export interface ChatMessage {
  id: string;
  roomId: string;
  senderId: string;
  content: string;
  isSystem: boolean;
  createdAt: string;
  sender: {
    id: string;
    firstName: string;
    lastName: string;
    avatarUrl?: string;
    role: string;
  };
}

export const chatApiSlice = api.injectEndpoints({
  endpoints: (builder) => ({
    createOrGetChatRoom: builder.mutation<ChatRoom, { otherUserId: string; contractId?: string }>({
      query: (body) => ({
        url: '/chat/rooms',
        method: 'POST',
        body,
      }),
    }),
    getRoomMessages: builder.query<ChatMessage[], string>({
      query: (roomId) => `/chat/rooms/${roomId}/messages`,
    }),
  }),
});

export const {
  useCreateOrGetChatRoomMutation,
  useGetRoomMessagesQuery,
} = chatApiSlice;
