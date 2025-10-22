import { Controller, Get, Post, Body, Param, UseGuards, Req, Query, Patch } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery, ApiBody } from '@nestjs/swagger';
import { MessagesService, SendMessageDto } from './messages.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Messages')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('messages')
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Get('conversations')
  @ApiOperation({ summary: 'Get all conversations with last messages' })
  async getConversations(@Req() req: any) {
    return this.messagesService.getMatchConversations(req.user.id);
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Get unread message count' })
  async getUnreadCount(@Req() req: any) {
    const count = await this.messagesService.getUnreadMessageCount(req.user.id);
    return { unreadCount: count };
  }

  @Post()
  @ApiOperation({ summary: 'Send a message' })
  async sendMessage(@Req() req: any, @Body() sendMessageDto: SendMessageDto) {
    return this.messagesService.sendMessage(req.user.id, sendMessageDto);
  }

  @Post('match/create')
  @ApiOperation({ summary: 'Create a new match or return existing one' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        otherUserId: { type: 'string', example: 'uuid-of-other-user' },
      },
      required: ['otherUserId'],
    },
  })
  async createMatch(@Req() req: any, @Body('matchedUserId') matchedUserId: string) {
    const currentUserId = req.user.id;
    return this.messagesService.createMatch(matchedUserId, currentUserId);
  }

  @Get('match/:matchId')
  @ApiOperation({ summary: 'Get messages for a specific match, will create match if match does not exist and otherUserId is provided' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getMatchMessages(
    @Req() req: any, 
    @Param('matchId') matchId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('otherUserId') otherUserId?: string, // will create match if match does not exist and otherUserId is provided
  ) {
    return this.messagesService.getMatchMessages(
      matchId, 
      req.user.id,
      page ? parseInt(page.toString()) : 1,
      limit ? parseInt(limit.toString()) : 50,
      otherUserId
    );
  }

  @Patch(':messageId/read')
  @ApiOperation({ summary: 'Mark message as read' })
  async markAsRead(@Req() req: any, @Param('messageId') messageId: string) {
    return this.messagesService.markMessageAsRead(messageId, req.user.id);
  }
}