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

  async createMatch(otherUserId: string, currentUserId: string) {
    // Check if match already exists
    let matchRecord = await this.prisma.match.findFirst({
      where: {
        OR: [
          { user1Id: currentUserId, user2Id: otherUserId },
          { user1Id: otherUserId, user2Id: currentUserId },
        ],
      },
    });

    if (!matchRecord) {
      // Ensure the other user exists
      const otherUser = await this.prisma.user.findUnique({
        where: { id: otherUserId },
      });

      if (!otherUser) {
        throw new Error('The other user does not exist');
      }

      // Create the match
      matchRecord = await this.prisma.match.create({
        data: {
          user1Id: currentUserId,
          user2Id: otherUserId,
        },
      });

      const [user1, user2] = await Promise.all([
        this.prisma.user.findUnique({ where: { id: currentUserId } }),
        this.prisma.user.findUnique({ where: { id: otherUserId } }),
      ]);

      const transformedMatch = {
        id: matchRecord.id,
        userId: user1?.id || currentUserId,
        matchedUserId: user2?.id || otherUserId,
        createdAt: matchRecord.createdAt.toISOString(),
        user: user1 || undefined,
        matchedUser: user2 || undefined,
      };

      return { match: transformedMatch, created: true };
    } else {
      // If match already exists, transform it to Match interface
      const [user1, user2] = await Promise.all([
        this.prisma.user.findUnique({ where: { id: matchRecord.user1Id } }),
        this.prisma.user.findUnique({ where: { id: matchRecord.user2Id } }),
      ]);

      const transformedMatch = {
        id: matchRecord.id,
        userId: user1?.id === currentUserId ? user1.id : user2?.id!,
        matchedUserId: user1?.id === currentUserId ? user2?.id! : user1?.id!,
        createdAt: matchRecord.createdAt.toISOString(),
        user: user1?.id === currentUserId ? user1 : user2,
        matchedUser: user1?.id === currentUserId ? user2 : user1,
      };

      return { match: transformedMatch, created: false };
    }
  }


  async getMatchMessages(
    matchId: string, 
    userId: string, 
    page: number = 1, 
    limit: number = 50, 
    otherUserId?: string
  ) {
    // Check if match exists and if the user is part of it
    let match = await this.prisma.match.findFirst({
      where: {
        id: matchId,
        OR: [{ user1Id: userId }, { user2Id: userId }],
      },
    });

    // If no match exists, try to find an existing match between the two users
    if (!match && otherUserId) {
      match = await this.prisma.match.findFirst({
        where: {
          OR: [
            { user1Id: userId, user2Id: otherUserId },
            { user1Id: otherUserId, user2Id: userId },
          ],
        },
      });

      // If still not found, create a new match
      if (!match) {
        const otherUser = await this.prisma.user.findUnique({
          where: { id: otherUserId },
        });

        if (!otherUser) {
          throw new Error('The other user does not exist');
        }

        match = await this.prisma.match.create({
          data: {
            user1Id: userId,
            user2Id: otherUserId,
          },
        });
      }
    }

    // Fetch messages for this match
    const messages = await this.prisma.message.findMany({
      where: { matchId: match.id },
      orderBy: { createdAt: 'asc' },
      skip: (page - 1) * limit,
      take: limit,
    });

    // Fetch user objects for transformation
    const [user1, user2] = await Promise.all([
      this.prisma.user.findUnique({ where: { id: match.user1Id } }),
      this.prisma.user.findUnique({ where: { id: match.user2Id } }),
    ]);

    const transformedMatch = {
      id: match.id,
      userId: user1?.id === userId ? user1.id : user2?.id!,
      matchedUserId: user1?.id === userId ? user2?.id! : user1?.id!,
      createdAt: match.createdAt.toISOString(),
      user: user1?.id === userId ? user1 : user2,
      matchedUser: user1?.id === userId ? user2 : user1,
    };

    return { match: transformedMatch, messages };
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
            profilePhoto1: true,
          },
        },
        user2: {
          select: {
            id: true,
            name: true,
            profilePhoto1: true,
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

    return matches.map(match => {
      const otherUser = match.user1Id === userId ? match.user2 : match.user1;
      return {
        id: match.id,
        otherUser: {
          id: otherUser.id,
          name: otherUser.name,
          profilePhoto1: otherUser.profilePhoto1,
        },
        lastMessage: match.messages?.[0] || null,
        unreadCount: match._count?.messages || 0,
        updatedAt: match.updatedAt,
      };
    });
  }
}
