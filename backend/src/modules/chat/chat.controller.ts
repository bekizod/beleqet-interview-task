import { Controller, Post, Get, Body, UseGuards, Request, Param } from '@nestjs/common';
import { ChatService } from './chat.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CreateRoomDto } from './dto/create-room.dto';

@Controller('chat')
@UseGuards(JwtAuthGuard)
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post('rooms')
  async createOrGetRoom(@Request() req: any, @Body() body: CreateRoomDto) {
    const { userId } = req.user;
    const { otherUserId, contractId } = body;
    
    const room = await this.chatService.createOrGetRoom(userId, otherUserId, contractId);
    return room;
  }

  @Get('rooms/:roomId/messages')
  async getRoomMessages(@Request() req: any, @Param('roomId') roomId: string) {
    const { userId } = req.user;
    return this.chatService.getRoomMessages(roomId, userId);
  }
}
