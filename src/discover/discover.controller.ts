import {
  Controller,
  Get,
  Query,
  UseGuards,
  Request,
  Param,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { DiscoverService } from './discover.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { DiscoverFiltersDto } from './dto/discover.dto';

@ApiTags('discover')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('discover')
export class DiscoverController {
  constructor(private readonly discoverService: DiscoverService) {}

  @Get('nearby')
  @ApiOperation({ summary: 'Get nearby users' })
  @ApiResponse({ status: 200, description: 'Nearby users retrieved successfully' })
  async getNearbyUsers(@Request() req, @Query() filters: DiscoverFiltersDto) {
    return this.discoverService.getNearbyUsers(req.user.id, filters);
  }

  @Get('verse/:verse')
  @ApiOperation({ summary: 'Get users who share the same favorite verse' })
  @ApiResponse({ status: 200, description: 'Users with shared verse retrieved successfully' })
  async getUsersBySharedVerse(@Request() req, @Param('verse') verse: string) {
    return this.discoverService.getUsersBySharedVerse(req.user.id, verse);
  }

  @Get('interest/:interest')
  @ApiOperation({ summary: 'Get users with shared interests' })
  @ApiResponse({ status: 200, description: 'Users with shared interests retrieved successfully' })
  async getUsersByInterest(@Request() req, @Param('interest') interest: string) {
    return this.discoverService.getUsersByInterest(req.user.id, interest);
  }

  @Get('active')
  @ApiOperation({ summary: 'Get currently active users' })
  @ApiResponse({ status: 200, description: 'Active users retrieved successfully' })
  async getActiveUsers(@Request() req) {
    return this.discoverService.getActiveUsers(req.user.id);
  }

  @Get('active-today')
  @ApiOperation({ summary: 'Get most active users today' })
  @ApiResponse({ status: 200, description: 'Most active users today retrieved successfully' })
  async getMostActiveToday(@Request() req) {
    return this.discoverService.getMostActiveToday(req.user.id);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get discovery statistics' })
  @ApiResponse({ status: 200, description: 'Discovery stats retrieved successfully' })
  async getDiscoverStats(@Request() req) {
    return this.discoverService.getDiscoverStats(req.user.id);
  }

  @Get('challenge')
  @ApiOperation({ summary: 'Get daily challenge' })
  @ApiResponse({ status: 200, description: 'Daily challenge retrieved successfully' })
  async getDailyChallenge(@Request() req) {
    return this.discoverService.getDailyChallenge(req.user.id);
  }
}