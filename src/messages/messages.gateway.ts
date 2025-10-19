import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { Inject, forwardRef } from '@nestjs/common';
import { MessagesService } from './messages.service';

interface AuthenticatedSocket extends Socket {
  userId?: string;
}

@WebSocketGateway({
  cors: {
    origin: [
      process.env.FRONTEND_URL || 'http://localhost:3000',
      'https://faithbliss.vercel.app',
      'https://*.vercel.app',
    ],
    credentials: true,
  },
})
export class MessagesGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private connectedUsers = new Map<string, string>(); // userId -> socketId

  constructor(
    private jwtService: JwtService,
    @Inject(forwardRef(() => MessagesService))
    private messagesService: MessagesService,
  ) {}

  async handleConnection(client: AuthenticatedSocket) {
    try {
      const token = client.handshake.auth?.token;
      if (!token) {
        client.disconnect();
        return;
      }

      const payload = this.jwtService.verify(token);
      client.userId = payload.sub;
      this.connectedUsers.set(payload.sub, client.id);

      console.log(`User ${payload.sub} connected`);
      
      // Join user to their personal room
      client.join(`user_${payload.sub}`);
      
      // Send unread message count
      const unreadCount = await this.messagesService.getUnreadMessageCount(payload.sub);
      client.emit('unreadCount', { count: unreadCount });
      
    } catch (error) {
      client.disconnect();
    }
  }

  handleDisconnect(client: AuthenticatedSocket) {
    if (client.userId) {
      this.connectedUsers.delete(client.userId);
      console.log(`User ${client.userId} disconnected`);
    }
  }

  @SubscribeMessage('joinMatch')
  handleJoinMatch(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { matchId: string },
  ) {
    client.join(`match_${data.matchId}`);
  }

  @SubscribeMessage('leaveMatch')
  handleLeaveMatch(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { matchId: string },
  ) {
    client.leave(`match_${data.matchId}`);
  }

  @SubscribeMessage('sendMessage')
  async handleMessage(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { matchId: string; content: string },
  ) {
    if (!client.userId) return;

    try {
      const message = await this.messagesService.sendMessage(client.userId, {
        matchId: data.matchId,
        content: data.content,
      });

      // Emit to all users in the match room
      this.server.to(`match_${data.matchId}`).emit('newMessage', message);

      // Update unread count for the receiver
      const match = await this.getMatchDetails(data.matchId);
      if (match) {
        const receiverId = match.user1Id === client.userId ? match.user2Id : match.user1Id;
        const unreadCount = await this.messagesService.getUnreadMessageCount(receiverId);
        this.server.to(`user_${receiverId}`).emit('unreadCount', { count: unreadCount });
      }

    } catch (error) {
      client.emit('error', { message: error.message });
    }
  }

  @SubscribeMessage('typing')
  handleTyping(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { matchId: string; isTyping: boolean },
  ) {
    if (!client.userId) return;

    client.to(`match_${data.matchId}`).emit('userTyping', {
      userId: client.userId,
      isTyping: data.isTyping,
    });
  }

  private async getMatchDetails(matchId: string) {
    // You would implement this method in your service
    // For now, returning null as placeholder
    return null;
  }

  // Method to send real-time notifications
  sendNotificationToUser(userId: string, notification: any) {
    this.server.to(`user_${userId}`).emit('notification', notification);
  }
}