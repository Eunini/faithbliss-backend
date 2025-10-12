import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  Delete,
  UseGuards,
  Request,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { CommunityService } from './community.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  CreateCommunityPostDto,
  CreatePostCommentDto,
  CreateEventDto,
  CreatePrayerRequestDto,
  CreateBlessWallEntryDto,
} from './dto/community.dto';

@ApiTags('community')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('community')
export class CommunityController {
  constructor(private readonly communityService: CommunityService) {}

  // Community Posts
  @Post('posts')
  @ApiOperation({ summary: 'Create a community post' })
  @ApiResponse({ status: 201, description: 'Post created successfully' })
  async createPost(@Request() req, @Body() createPostDto: CreateCommunityPostDto) {
    return this.communityService.createPost(req.user.id, createPostDto);
  }

  @Get('posts')
  @ApiOperation({ summary: 'Get all community posts' })
  @ApiResponse({ status: 200, description: 'Posts retrieved successfully' })
  async getPosts(
    @Query('page', ParseIntPipe) page: number = 1,
    @Query('limit', ParseIntPipe) limit: number = 10,
  ) {
    return this.communityService.getAllPosts(page, limit);
  }

  @Post('posts/:postId/like')
  @ApiOperation({ summary: 'Like a post' })
  async likePost(@Request() req, @Param('postId') postId: string) {
    return this.communityService.likePost(req.user.id, postId);
  }

  @Delete('posts/:postId/like')
  @ApiOperation({ summary: 'Unlike a post' })
  async unlikePost(@Request() req, @Param('postId') postId: string) {
    return this.communityService.unlikePost(req.user.id, postId);
  }

  @Post('posts/:postId/comments')
  @ApiOperation({ summary: 'Add comment to a post' })
  async addComment(
    @Request() req,
    @Param('postId') postId: string,
    @Body() createCommentDto: CreatePostCommentDto,
  ) {
    return this.communityService.addComment(req.user.id, postId, createCommentDto);
  }

  // Events
  @Post('events')
  @ApiOperation({ summary: 'Create an event' })
  @ApiResponse({ status: 201, description: 'Event created successfully' })
  async createEvent(@Request() req, @Body() createEventDto: CreateEventDto) {
    return this.communityService.createEvent(req.user.id, createEventDto);
  }

  @Get('events')
  @ApiOperation({ summary: 'Get upcoming events' })
  @ApiResponse({ status: 200, description: 'Events retrieved successfully' })
  async getEvents(
    @Query('page', ParseIntPipe) page: number = 1,
    @Query('limit', ParseIntPipe) limit: number = 10,
  ) {
    return this.communityService.getEvents(page, limit);
  }

  @Post('events/:eventId/join')
  @ApiOperation({ summary: 'Join an event' })
  async joinEvent(@Request() req, @Param('eventId') eventId: string) {
    return this.communityService.joinEvent(req.user.id, eventId);
  }

  @Delete('events/:eventId/join')
  @ApiOperation({ summary: 'Leave an event' })
  async leaveEvent(@Request() req, @Param('eventId') eventId: string) {
    return this.communityService.leaveEvent(req.user.id, eventId);
  }

  // Prayer Requests
  @Post('prayers')
  @ApiOperation({ summary: 'Create a prayer request' })
  @ApiResponse({ status: 201, description: 'Prayer request created successfully' })
  async createPrayerRequest(
    @Request() req,
    @Body() createPrayerRequestDto: CreatePrayerRequestDto,
  ) {
    return this.communityService.createPrayerRequest(req.user.id, createPrayerRequestDto);
  }

  @Get('prayers')
  @ApiOperation({ summary: 'Get prayer requests' })
  @ApiResponse({ status: 200, description: 'Prayer requests retrieved successfully' })
  async getPrayerRequests(
    @Query('page', ParseIntPipe) page: number = 1,
    @Query('limit', ParseIntPipe) limit: number = 10,
  ) {
    return this.communityService.getPrayerRequests(page, limit);
  }

  @Post('prayers/:prayerRequestId/pray')
  @ApiOperation({ summary: 'Pray for a request' })
  async prayForRequest(@Request() req, @Param('prayerRequestId') prayerRequestId: string) {
    return this.communityService.prayForRequest(req.user.id, prayerRequestId);
  }

  // Bless Wall
  @Post('bless')
  @ApiOperation({ summary: 'Create a blessing entry' })
  @ApiResponse({ status: 201, description: 'Blessing created successfully' })
  async createBlessing(@Request() req, @Body() createBlessWallEntryDto: CreateBlessWallEntryDto) {
    return this.communityService.createBlessWallEntry(req.user.id, createBlessWallEntryDto);
  }

  @Get('bless')
  @ApiOperation({ summary: 'Get bless wall entries' })
  @ApiResponse({ status: 200, description: 'Bless wall entries retrieved successfully' })
  async getBlessWallEntries(
    @Query('page', ParseIntPipe) page: number = 1,
    @Query('limit', ParseIntPipe) limit: number = 10,
  ) {
    return this.communityService.getBlessWallEntries(page, limit);
  }

  // Community Highlights
  @Get('highlights')
  @ApiOperation({ summary: 'Get community highlights' })
  @ApiResponse({ status: 200, description: 'Community highlights retrieved successfully' })
  async getCommunityHighlights() {
    return this.communityService.getCommunityHighlights();
  }
}