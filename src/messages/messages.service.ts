import { Injectable, OnModuleInit, forwardRef, Inject } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MessagesGateway } from './messages.gateway';
import { NotificationsGateway } from '../notifications/notifications.gateway';

export interface SendMessageDto {
  matchId: string;
  content: string;
}

@Injectable()
export class MessagesService {
  constructor(
    private prisma: PrismaService,
    @Inject(forwardRef(() => MessagesGateway))
    private messagesGateway: MessagesGateway,
    private notificationsGateway: NotificationsGateway,
  ) {}

  async sendMessage(senderId: string, sendMessageDto: SendMessageDto) {
    const { matchId, content } = sendMessageDto;

    // Verify user is part of the match
    const match = await this.prisma.match.findFirst({
      where: {
        id: matchId,
        OR: [
          { user1Id: senderId },
          { user2Id: senderId },
        ],
      },
    });

    if (!match) {
      throw new Error('Match not found or user not authorized');
    }

    const receiverId = match.user1Id === senderId ? match.user2Id : match.user1Id;

    const message = await this.prisma.message.create({
      data: {
        matchId,
        senderId,
        receiverId,
        content,
      },
    });

    // Emit to all users in the match room
    this.messagesGateway.server.to(`match_${matchId}`).emit('newMessage', message);

    // Update unread count for the receiver
    const unreadCount = await this.getUnreadMessageCount(receiverId);
    this.messagesGateway.server.to(`user_${receiverId}`).emit('unreadCount', { count: unreadCount });

    // Send real-time notification to the receiver
    this.notificationsGateway.sendNotificationToUser(receiverId, {
      type: 'NEW_MESSAGE',
      message: `New message from ${senderId}: ${content.substring(0, 50)}...`,
      senderId: senderId,
      matchId: matchId,
    });

    return message;
  }

  sendNotification(userId: string, notification: any) {
    this.messagesGateway.sendNotificationToUser(userId, notification);
  }

  async getMatchMessages(matchId: string, userId: string, page: number = 1, limit: number = 50) {
    // Verify user is part of the match
    const match = await this.prisma.match.findFirst({
      where: {
        id: matchId,
        OR: [
          { user1Id: userId },
          { user2Id: userId },
        ],
      },
    });

    if (!match) {
      throw new Error('Match not found or user not authorized');
    }

    const skip = (page - 1) * limit;

    return this.prisma.message.findMany({
      where: { matchId },
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  }

  async markMessageAsRead(messageId: string, userId: string) {
    const message = await this.prisma.message.findFirst({
      where: {
        id: messageId,
        receiverId: userId,
      },
    });

    if (!message) {
      throw new Error('Message not found or not authorized');
    }

    return this.prisma.message.update({
      where: { id: messageId },
      data: { isRead: true },
    });
  }

  async getUnreadMessageCount(userId: string) {
    return this.prisma.message.count({
      where: {
        receiverId: userId,
        isRead: false,
      },
    });
  }

  async getMatchConversations(userId: string) {
    const matches = await this.prisma.match.findMany({
      where: {
        OR: [
          { user1Id: userId },
          { user2Id: userId },
        ],
        status: 'MATCHED',
      },
      include: {
        user1: {
          select: {
            id: true,
            name: true,
          },
        },
        user2: {
          select: {
            id: true,
            name: true,
          },
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: {
            sender: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        _count: {
          select: {
            messages: {
              where: {
                receiverId: userId,
                isRead: false,
              },
            },
          },
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });

    return matches.map(match => ({
      id: match.id,
      otherUser: match.user1Id === userId ? (match as any).user2 : (match as any).user1,
      lastMessage: (match as any).messages?.[0] || null,
      unreadCount: (match as any)._count?.messages || 0,
      updatedAt: match.updatedAt,
    }));
  }
}
