import {
  Controller,
  Get,
  Put,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
  UseInterceptors,
  UploadedFiles,
  BadRequestException,
  Delete
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { Request } from 'express';
import { Express } from 'express';
import { UsersService } from './users.service';
import { UpdateProfileDto, UpdatePreferencesDto } from './dto/user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';

@ApiTags('Users')
@Controller('users')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('debug')
  @ApiOperation({ summary: 'Debug JWT token validation' })
  @ApiResponse({ status: 200, description: 'Debug info retrieved successfully' })
  async debugToken(@Req() request: Request & { user: any }) {
    console.log('Debug endpoint hit');
    console.log('User from request:', request.user);
    console.log('Headers:', request.headers);
    return {
      message: 'Token is valid',
      user: request.user,
      timestamp: new Date().toISOString(),
    };
  }

  @Get('me')
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ 
    status: 200, 
    description: 'User profile retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', example: 'user-uuid' },
        email: { type: 'string', example: 'user@example.com' },
        name: { type: 'string', example: 'John Doe' },
        gender: { type: 'string', enum: ['MALE', 'FEMALE'] },
        age: { type: 'number', example: 28 },
        denomination: { type: 'string', enum: ['BAPTIST', 'METHODIST', 'CATHOLIC', 'OTHER'] },
        bio: { type: 'string', example: 'Passionate about faith and technology' },
        location: { type: 'string', example: 'Lagos, Nigeria' },
        latitude: { type: 'number', example: 6.5244 },
        longitude: { type: 'number', example: 3.3792 },
        phoneNumber: { type: 'string', example: '+2348012345678' },
        countryCode: { type: 'string', example: '+234' },
        birthday: { type: 'string', example: '1995-06-15' },
        fieldOfStudy: { type: 'string', example: 'Computer Science' },
        profession: { type: 'string', example: 'Software Engineer' },
        faithJourney: { type: 'string', example: 'GROWING' },
        sundayActivity: { type: 'string', example: 'WEEKLY' },
        lookingFor: { type: 'array', items: { type: 'string' }, example: ['RELATIONSHIP'] },
        hobbies: { type: 'array', items: { type: 'string' }, example: ['Reading', 'Music'] },
        values: { type: 'array', items: { type: 'string' }, example: ['Faith', 'Honesty'] },
        favoriteVerse: { type: 'string', example: 'John 3:16' },
        profilePhoto1: { type: 'string', example: 'data:image/jpeg;base64,...' },
        profilePhoto2: { type: 'string', example: 'data:image/jpeg;base64,...', nullable: true },
        profilePhoto3: { type: 'string', example: 'data:image/jpeg;base64,...', nullable: true },
        isVerified: { type: 'boolean', example: false },
        onboardingCompleted: { type: 'boolean', example: true },
        createdAt: { type: 'string', format: 'date-time' },
        updatedAt: { type: 'string', format: 'date-time' },
        preferences: {
          type: 'object',
          properties: {
            preferredGender: { type: 'string', enum: ['MALE', 'FEMALE'], nullable: true },
            preferredDenomination: { type: 'array', items: { type: 'string' }, nullable: true },
            minAge: { type: 'number', nullable: true },
            maxAge: { type: 'number', nullable: true },
            maxDistance: { type: 'number', nullable: true },
            preferredFaithJourney: { type: 'array', items: { type: 'string' }, nullable: true },
            preferredChurchAttendance: { type: 'array', items: { type: 'string' }, nullable: true },
            preferredRelationshipGoals: { type: 'array', items: { type: 'string' }, nullable: true },
          }
        }
      }
    }
  })
  @ApiResponse({ status: 404, description: 'User not found' })
  async getMyProfile(@Req() request: Request & { user: any }) {
    return this.usersService.getUserProfile(request.user.id);
  }

  @Put('me')
  @ApiOperation({ summary: 'Update current user profile' })
  @ApiResponse({ status: 200, description: 'Profile updated successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async updateMyProfile(
    @Req() request: Request & { user: any },
    @Body() updateProfileDto: UpdateProfileDto,
  ) {
    return this.usersService.updateProfile(request.user.id, updateProfileDto);
  }

  @Get('me/preferences')
  @ApiOperation({ summary: 'Get current user preferences' })
  @ApiResponse({ status: 200, description: 'User preferences retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Preferences not found' })
  async getMyPreferences(@Req() request: Request & { user: any }) {
    return this.usersService.getUserPreferences(request.user.id);
  }

  @Put('me/preferences')
  @ApiOperation({ summary: 'Update current user preferences' })
  @ApiResponse({ status: 200, description: 'Preferences updated successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async updateMyPreferences(
    @Req() request: Request & { user: any },
    @Body() updatePreferencesDto: UpdatePreferencesDto,
  ) {
    return this.usersService.updatePreferences(request.user.id, updatePreferencesDto);
  }

  @Post('me/deactivate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Deactivate current user account' })
  @ApiResponse({ status: 200, description: 'Account deactivated successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async deactivateAccount(@Req() request: Request & { user: any }) {
    return this.usersService.deactivateAccount(request.user.id);
  }

  @Post('me/reactivate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reactivate current user account' })
  @ApiResponse({ status: 200, description: 'Account reactivated successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async reactivateAccount(@Req() request: Request & { user: any }) {
    return this.usersService.reactivateAccount(request.user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get user profile by ID' })
  @ApiResponse({ status: 200, description: 'User profile retrieved successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async getUserProfile(@Param('id') id: string) {
    return this.usersService.getUserById(id);
  }

  @Get('search/advanced')
  @ApiOperation({ summary: 'Advanced user search with filters' })
  @ApiResponse({ status: 200, description: 'Search results retrieved successfully' })
  @ApiQuery({ name: 'search', required: false, type: String, description: 'Search term' })
  @ApiQuery({ name: 'gender', required: false, enum: ['MALE', 'FEMALE'], description: 'Filter by gender' })
  @ApiQuery({ name: 'denomination', required: false, type: [String], description: 'Filter by denominations' })
  @ApiQuery({ name: 'minAge', required: false, type: Number, description: 'Minimum age' })
  @ApiQuery({ name: 'maxAge', required: false, type: Number, description: 'Maximum age' })
  @ApiQuery({ name: 'location', required: false, type: String, description: 'Filter by location' })
  @ApiQuery({ name: 'isVerified', required: false, type: Boolean, description: 'Filter by verification status' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Results per page' })
  async searchUsers(
    @Req() request: Request & { user: any },
    @Query('search') search?: string,
    @Query('gender') gender?: string,
    @Query('denomination') denomination?: string | string[],
    @Query('minAge') minAge?: string,
    @Query('maxAge') maxAge?: string,
    @Query('location') location?: string,
    @Query('isVerified') isVerified?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const filters = {
      search,
      gender,
      denomination: Array.isArray(denomination) ? denomination : denomination ? [denomination] : undefined,
      minAge: minAge ? parseInt(minAge, 10) : undefined,
      maxAge: maxAge ? parseInt(maxAge, 10) : undefined,
      location,
      isVerified: isVerified ? isVerified === 'true' : undefined,
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 20,
    };

    return this.usersService.searchUsers(request.user.id, filters);
  }

  @Get()
  @ApiOperation({ summary: 'Get all users (admin/search functionality)' })
  @ApiResponse({ status: 200, description: 'Users retrieved successfully' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  async getAllUsers(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 10;
    
    return this.usersService.getAllUsers(pageNum, limitNum, search);
  }

  @Post('me/photos')
  @UseInterceptors(FilesInterceptor('photos', 3, {
    limits: { fileSize: 15 * 1024 * 1024 }, // 15MB limit
    fileFilter: (req, file, callback) => {
      if (file.mimetype.startsWith('image/')) {
        callback(null, true);
      } else {
        callback(new Error('Only image files are allowed'), false);
      }
    },
  }))
  @ApiOperation({ summary: 'Upload profile photos (up to 3)' })
  @ApiResponse({ status: 200, description: 'Photos uploaded successfully' })
  @ApiResponse({ status: 400, description: 'Invalid file format or size' })
  async uploadPhotos(
    @Req() request: Request & { user: any },
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    return this.usersService.uploadProfilePhotos(request.user.id, files);
  }

  @Post('me/photo/:photoNumber')
  @UseInterceptors(FilesInterceptor('photo', 1, {
    limits: { fileSize: 15 * 1024 * 1024 }, // 15MB limit
    fileFilter: (req, file, callback) => {
      const photoNumber = parseInt(req.params.photoNumber);
      // Photo 3 has stricter validation
      if (photoNumber === 3) {
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        if (allowedTypes.includes(file.mimetype)) {
          callback(null, true);
        } else {
          callback(new Error('Photo 3 only accepts JPG, PNG, GIF, or WebP formats'), false);
        }
      } else {
        if (file.mimetype.startsWith('image/')) {
          callback(null, true);
        } else {
          callback(new Error('Only image files are allowed'), false);
        }
      }
    },
  }))
  @ApiOperation({ summary: 'Upload single profile photo by number (1-3)' })
  @ApiResponse({ status: 200, description: 'Photo uploaded successfully' })
  @ApiResponse({ status: 400, description: 'Invalid file format, size, or photo number' })
  async uploadSinglePhoto(
    @Req() request: Request & { user: any },
    @Param('photoNumber') photoNumber: string,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    const photoNum = parseInt(photoNumber);
    if (photoNum < 1 || photoNum > 3) {
      throw new BadRequestException('Photo number must be between 1 and 3');
    }
    
    return this.usersService.uploadSingleProfilePhoto(request.user.id, photoNum, files[0]);
  }

  @Delete('me/photo/:photoNumber')
  @ApiOperation({ summary: 'Remove a profile photo by number (1-3)' })
  @ApiResponse({ status: 200, description: 'Photo removed successfully' })
  @ApiResponse({ status: 400, description: 'Invalid photo number' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async removeProfilePhoto(
    @Req() request: Request & { user: any },
    @Param('photoNumber') photoNumber: string,
  ) {
    const photoNum = parseInt(photoNumber);
    if (photoNum < 1 || photoNum > 3) {
      throw new BadRequestException('Photo number must be between 1 and 3');
    }
    return this.usersService.removeProfilePhoto(request.user.id, photoNum);
  }
}