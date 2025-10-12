import { Controller, Get, Post, Param, UseGuards, Req, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { MatchesService } from './matches.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Matches')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('matches')
export class MatchesController {
  constructor(private readonly matchesService: MatchesService) {}

  @Get()
  @ApiOperation({ summary: 'Get user matches' })
  async getMatches(@Req() req: any) {
    return this.matchesService.getUserMatches(req.user.id);
  }

  @Get('potential')
  @ApiOperation({ summary: 'Get potential matches based on preferences' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getPotentialMatches(
    @Req() req: any,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.matchesService.getPotentialMatches(
      req.user.id,
      page ? parseInt(page.toString()) : 1,
      limit ? parseInt(limit.toString()) : 10,
    );
  }

  @Post('like/:userId')
  @ApiOperation({ summary: 'Like a user' })
  async likeUser(@Req() req: any, @Param('userId') userId: string) {
    return this.matchesService.likeUser(req.user.id, userId);
  }

  @Post('pass/:userId')
  @ApiOperation({ summary: 'Pass on a user' })
  async passUser(@Req() req: any, @Param('userId') userId: string) {
    return this.matchesService.passUser(req.user.id, userId);
  }
}