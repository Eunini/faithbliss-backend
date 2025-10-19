import { Controller, Get, Post, Param, UseGuards, Req, Query, Body } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery, ApiResponse, ApiBody } from '@nestjs/swagger';
import { MatchesService } from './matches.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

class FilterMatchesDto {
  preferredGender?: 'MALE' | 'FEMALE';
  preferredDenominations?: string[];
  minAge?: number;
  maxAge?: number;
  maxDistance?: number;
  preferredFaithJourney?: string[];
  preferredChurchAttendance?: string[];
  preferredRelationshipGoals?: string[];
}

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
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiResponse({ 
    status: 200, 
    description: 'Potential matches retrieved successfully',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string', example: 'user-uuid' },
          name: { type: 'string', example: 'John Doe' },
          age: { type: 'number', example: 28 },
          gender: { type: 'string', enum: ['MALE', 'FEMALE'] },
          denomination: { type: 'string', enum: ['BAPTIST', 'METHODIST', 'CATHOLIC', 'OTHER'] },
          location: { type: 'string', example: 'Lagos, Nigeria' },
          bio: { type: 'string', example: 'Passionate about faith and technology' },
          profilePhoto1: { type: 'string', example: 'data:image/jpeg;base64,...' },
          profilePhoto2: { type: 'string', example: 'data:image/jpeg;base64,...', nullable: true },
          profilePhoto3: { type: 'string', example: 'data:image/jpeg;base64,...', nullable: true },
          isVerified: { type: 'boolean', example: false },
          faithJourney: { type: 'string', example: 'GROWING' },
          sundayActivity: { type: 'string', example: 'WEEKLY' },
          lookingFor: { type: 'string', example: 'RELATIONSHIP' },
          values: { type: 'array', items: { type: 'string' }, example: ['Faith', 'Honesty'] },
          fieldOfStudy: { type: 'string', example: 'Computer Science' },
          profession: { type: 'string', example: 'Software Engineer' },
        }
      }
    }
  })
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

  @Post('filter')
  @ApiOperation({ summary: 'Get filtered potential matches with custom criteria (temporary filters)' })
  @ApiBody({ 
    type: FilterMatchesDto,
    description: 'Filter criteria for finding matches'
  })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiResponse({ 
    status: 200, 
    description: 'Filtered potential matches retrieved successfully',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string', example: 'user-uuid' },
          name: { type: 'string', example: 'John Doe' },
          age: { type: 'number', example: 28 },
          gender: { type: 'string', enum: ['MALE', 'FEMALE'] },
          denomination: { type: 'string', enum: ['BAPTIST', 'METHODIST', 'CATHOLIC', 'OTHER'] },
          location: { type: 'string', example: 'Lagos, Nigeria' },
          bio: { type: 'string', example: 'Passionate about faith and technology' },
          profilePhoto1: { type: 'string', example: 'data:image/jpeg;base64,...' },
          profilePhoto2: { type: 'string', example: 'data:image/jpeg;base64,...', nullable: true },
          profilePhoto3: { type: 'string', example: 'data:image/jpeg;base64,...', nullable: true },
          isVerified: { type: 'boolean', example: false },
          faithJourney: { type: 'string', example: 'GROWING' },
          sundayActivity: { type: 'string', example: 'WEEKLY' },
          lookingFor: { type: 'string', example: 'RELATIONSHIP' },
          values: { type: 'array', items: { type: 'string' }, example: ['Faith', 'Honesty'] },
          fieldOfStudy: { type: 'string', example: 'Computer Science' },
          profession: { type: 'string', example: 'Software Engineer' },
        }
      }
    }
  })
  async getFilteredMatches(
    @Req() req: any,
    @Body() filterDto: FilterMatchesDto,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.matchesService.getFilteredMatches(
      req.user.id,
      filterDto,
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