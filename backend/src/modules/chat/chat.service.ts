import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);

  constructor(private readonly prisma: PrismaService) {}

  /** Create or fetch a chat room between two users (e.g. for a freelance contract) */
  async createOrGetRoom(userId1: string, userId2: string, contractId?: string) {
    this.logger.log(`Creating/getting room for users: ${userId1} and ${userId2}`);
    
    // Try to find existing room between these two users
    if (!contractId) {
      const existingRoom = await this.prisma.chatRoom.findFirst({
        where: {
          participants: {
            every: {
              OR: [
                { userId: userId1 },
                { userId: userId2 }
              ]
            }
          },
          contractId: null
        },
        include: { 
          participants: {
            include: {
              user: { select: { id: true, firstName: true, lastName: true, avatarUrl: true, role: true } }
            }
          }, 
          messages: { 
            take: 1, 
            orderBy: { createdAt: 'desc' },
            include: {
              sender: { select: { id: true, firstName: true, lastName: true, avatarUrl: true, role: true } }
            }
          } 
        }
      });
      
      if (existingRoom && existingRoom.participants.length === 2) {
        const participantIds = existingRoom.participants.map(p => p.userId).sort();
        const requestedIds = [userId1, userId2].sort();
        if (JSON.stringify(participantIds) === JSON.stringify(requestedIds)) {
          this.logger.log(`Found existing room: ${existingRoom.id}`);
          return existingRoom;
        }
      }
    }
    
    if (contractId) {
      const existing = await this.prisma.chatRoom.findUnique({
        where: { contractId },
        include: { 
          participants: {
            include: {
              user: { select: { id: true, firstName: true, lastName: true, avatarUrl: true, role: true } }
            }
          }, 
          messages: { 
            take: 1, 
            orderBy: { createdAt: 'desc' },
            include: {
              sender: { select: { id: true, firstName: true, lastName: true, avatarUrl: true, role: true } }
            }
          } 
        }
      });
      if (existing) {
        this.logger.log(`Found existing contract room: ${existing.id}`);
        return existing;
      }
    }
    
    // Create new room
    const room = await this.prisma.chatRoom.create({
      data: {
        contractId,
        participants: {
          create: [{ userId: userId1 }, { userId: userId2 }]
        }
      },
      include: { 
        participants: {
          include: {
            user: { select: { id: true, firstName: true, lastName: true, avatarUrl: true, role: true } }
          }
        }, 
        messages: {
          include: {
            sender: { select: { id: true, firstName: true, lastName: true, avatarUrl: true, role: true } }
          }
        }
      }
    });
    
    this.logger.log(`Created new ChatRoom ${room.id} for users ${userId1} and ${userId2}`);
    return room;
  }

  /** Save a message to DB and return it populated */
  async saveMessage(roomId: string, senderId: string, content: string) {
    // Verify user is in room
    const participant = await this.prisma.chatParticipant.findUnique({
      where: { roomId_userId: { roomId, userId: senderId } }
    });
    if (!participant) throw new NotFoundException('User is not a participant of this chat room');

    return this.prisma.message.create({
      data: {
        roomId,
        senderId,
        content
      },
      include: { 
        sender: { select: { id: true, firstName: true, lastName: true, avatarUrl: true, role: true } } 
      }
    });
  }

  /** Fetch message history */
  async getRoomMessages(roomId: string, userId: string, take = 50) {
    const participant = await this.prisma.chatParticipant.findUnique({
      where: { roomId_userId: { roomId, userId } }
    });
    if (!participant) throw new NotFoundException('Unauthorized');

    return this.prisma.message.findMany({
      where: { roomId },
      orderBy: { createdAt: 'asc' }, // usually UI wants asc, but depends on frontend
      take,
      include: { 
        sender: { select: { id: true, firstName: true, lastName: true, avatarUrl: true, role: true } } 
      }
    });
  }
}
