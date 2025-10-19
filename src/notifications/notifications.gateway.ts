import { WebSocketGateway, WebSocketServer, SubscribeMessage, OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, UseGuards } from '@nestjs/common';
import { WsJwtAuthGuard } from '../auth/guards/ws-jwt-auth.guard'; // Assuming you have a WS JWT guard
import { AuthService } from '../auth/auth.service'; // To validate token

@WebSocketGateway({ namespace: '/notifications', cors: { origin: '*' } }) // Adjust CORS as needed
export class NotificationsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;
  private readonly logger = new Logger(NotificationsGateway.name);

  constructor(private readonly authService: AuthService) {} // Inject AuthService

  async handleConnection(client: Socket, ...args: any[]) {
    this.logger.log(`Client connected: ${client.id}`);
    try {
      const authToken = client.handshake.query.token as string;
      if (!authToken) {
        this.logger.warn('No auth token provided for WebSocket connection');
        client.disconnect(true);
        return;
      }
      const user = await this.authService.verifyToken(authToken); // Implement verifyToken in AuthService
      if (!user) {
        this.logger.warn(`Authentication failed for client ${client.id}`);
        client.disconnect(true);
        return;
      }
      (client as any).userId = user.sub; // Attach userId to the socket for later use
      this.logger.log(`Client ${client.id} authenticated as user ${user.sub}`);
    } catch (error) {
      this.logger.error(`Authentication error for client ${client.id}: ${error.message}`);
      client.disconnect(true);
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  // Method to send a notification to a specific user
  sendNotificationToUser(userId: string, notification: any) {
    this.server.to(userId).emit('notification', notification);
    this.logger.log(`Notification sent to user ${userId}: ${JSON.stringify(notification)}`);
  }

  // Example of how to handle a client subscribing to their own notifications (optional, can be done on connection)
  @SubscribeMessage('subscribeToNotifications')
  handleSubscribeToNotifications(client: Socket, payload: any): void {
    const userId = (client as any).userId;
    if (userId) {
      client.join(userId); // Join a room named after the user's ID
      this.logger.log(`User ${userId} subscribed to their notifications.`);
      client.emit('subscribed', { success: true, userId });
    } else {
      client.emit('error', { message: 'Authentication required to subscribe.' });
    }
  }
}
