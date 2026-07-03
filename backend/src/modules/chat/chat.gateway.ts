import { 
  WebSocketGateway, 
  SubscribeMessage, 
  MessageBody, 
  ConnectedSocket, 
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ChatService } from './chat.service';
import { JwtService } from '@nestjs/jwt';
import { Logger } from '@nestjs/common';

@WebSocketGateway({
  cors: { origin: true, credentials: true },
  namespace: '/chat'
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;
  
  private readonly logger = new Logger(ChatGateway.name);

  constructor(
    private readonly chatService: ChatService,
    private readonly jwtService: JwtService
  ) {}

  async handleConnection(client: Socket) {
    try {
      // Expect token in handshake auth: { token: "Bearer eyJ..." }
      const tokenString = client.handshake.auth?.token || client.handshake.headers?.authorization;
      if (!tokenString) throw new Error('No token provided');
      
      const token = tokenString.replace('Bearer ', '').trim();
      const payload = this.jwtService.verify(token);
      
      // JWT payload uses 'sub' for user ID
      client.data.user = { userId: payload.sub, email: payload.email, role: payload.role };
      this.logger.log(`[ChatGateway] Client connected: ${client.id} (User: ${payload.sub}, Email: ${payload.email})`);
    } catch (err) {
      this.logger.warn(`[ChatGateway] Unauthorized connection attempt: ${client.id}. Error: ${(err as Error).message}`);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`[ChatGateway] Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('join_room')
  async handleJoinRoom(
    @MessageBody() data: { roomId: string },
    @ConnectedSocket() client: Socket
  ) {
    const userId = client.data.user?.userId;
    this.logger.log(`[join_room] Request from user ${userId} for room ${data.roomId}`);
    
    if (!userId || !data.roomId) {
      this.logger.warn(`[join_room] Missing required data: userId=${userId}, roomId=${data.roomId}`);
      return;
    }

    try {
      client.join(data.roomId);
      this.logger.log(`[join_room] User ${userId} joined room ${data.roomId}, socket ${client.id}`);
      
      // Log which rooms this socket is in
      const rooms = Array.from(client.rooms);
      this.logger.log(`[join_room] Socket ${client.id} is now in rooms: ${JSON.stringify(rooms)}`);
      
      // Fetch history and send only to the connecting user
      const history = await this.chatService.getRoomMessages(data.roomId, userId);
      this.logger.log(`[join_room] Sending ${history.length} messages as history`);
      client.emit('room_history', history);
    } catch (err) {
      this.logger.error(`[join_room] Error: ${(err as Error).message}`, (err as Error).stack);
      client.emit('error', { message: 'Failed to join room' });
    }
  }

  @SubscribeMessage('send_message')
  async handleMessage(
    @MessageBody() data: { roomId: string; content: string },
    @ConnectedSocket() client: Socket
  ) {
    const userId = client.data.user?.userId;
    this.logger.log(`[send_message] Received from user ${userId}: ${JSON.stringify(data)}`);
    
    if (!userId || !data.roomId || !data.content) {
      this.logger.warn(`[send_message] Missing required data: userId=${userId}, roomId=${data.roomId}, content=${!!data.content}`);
      return;
    }

    try {
      this.logger.log(`[send_message] Saving message to room ${data.roomId}`);
      const savedMsg = await this.chatService.saveMessage(data.roomId, userId, data.content);
      this.logger.log(`[send_message] Message saved with ID: ${savedMsg.id}`);
      
      // Get all sockets in the room
      const socketsInRoom = await this.server.in(data.roomId).fetchSockets();
      this.logger.log(`[send_message] Room ${data.roomId} has ${socketsInRoom.length} connected sockets`);
      
      // Broadcast to everyone in the room (including sender)
      this.server.to(data.roomId).emit('new_message', savedMsg);
      this.logger.log(`[send_message] Broadcast 'new_message' to room ${data.roomId}. Message:`, JSON.stringify(savedMsg));
    } catch (err) {
      this.logger.error(`[send_message] Error: ${(err as Error).message}`, (err as Error).stack);
      client.emit('error', { message: 'Failed to send message' });
    }
  }
}
