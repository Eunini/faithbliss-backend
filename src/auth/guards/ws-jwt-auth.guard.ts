import { CanActivate, ExecutionContext, Injectable, Logger } from '@nestjs/common';
import { WsException } from '@nestjs/websockets';
import { AuthService } from '../auth.service'; // Adjust path as needed

@Injectable()
export class WsJwtAuthGuard implements CanActivate {
  private readonly logger = new Logger(WsJwtAuthGuard.name);

  constructor(private readonly authService: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const client: any = context.switchToWs().getClient();
    const authToken = client.handshake.query.token as string;

    if (!authToken) {
      this.logger.warn('No auth token provided for WebSocket connection');
      throw new WsException('Unauthorized: No token provided');
    }

    try {
      const user = await this.authService.verifyToken(authToken);
      if (!user) {
        throw new WsException('Unauthorized: Invalid token');
      }
      // Attach user to the client for later use in the gateway
      client.userId = user.sub;
      return true;
    } catch (error) {
      this.logger.error(`WebSocket authentication error: ${error.message}`);
      throw new WsException(`Unauthorized: ${error.message}`);
    }
  }
}
