import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { UpdateUserDto, CreateCompanyDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: { 
        id: true, email: true, firstName: true, lastName: true, role: true, 
        avatarUrl: true, phone: true, telegramId: true, createdAt: true, 
        company: true, headline: true, bio: true, location: true, 
        defaultResumeUrl: true, portfolioUrl: true, githubUrl: true, 
        linkedinUrl: true, skills: true 
      },
    });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async update(id: string, dto: UpdateUserDto) {
    try {
      return await this.prisma.user.update({ 
        where: { id }, 
        data: dto,
        select: { 
          id: true, email: true, firstName: true, lastName: true, role: true, 
          avatarUrl: true, phone: true, telegramId: true, createdAt: true, 
          company: true, headline: true, bio: true, location: true, 
          defaultResumeUrl: true, portfolioUrl: true, githubUrl: true, 
          linkedinUrl: true, skills: true 
        },
      });
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        const fields = (err.meta?.target as string[]) ?? [];
        if (fields.includes('telegramId')) {
          throw new ConflictException(
            'This Telegram ID is already linked to another account. ' +
            'Please send /start to the bot again to confirm your correct ID.',
          );
        }
        throw new ConflictException(`Unique constraint violation on: ${fields.join(', ')}`);
      }
      throw err;
    }
  }

  async createCompany(userId: string, dto: CreateCompanyDto) {
    return this.prisma.company.create({ data: { ...dto, userId } });
  }

  async getCompany(userId: string) {
    return this.prisma.company.findUnique({ where: { userId }, include: { jobs: { take: 5, orderBy: { createdAt: 'desc' } } } });
  }

  async getNotifications(userId: string) {
    return this.prisma.notification.findMany({ where: { userId }, orderBy: { createdAt: 'desc' }, take: 50 });
  }

  async markNotificationRead(notificationId: string, userId: string) {
    return this.prisma.notification.updateMany({ where: { id: notificationId, userId }, data: { read: true } });
  }
}
