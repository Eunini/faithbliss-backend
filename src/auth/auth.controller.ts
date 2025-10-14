import { Controller, Post, Body, Res, Req, HttpCode, HttpStatus, UseGuards, Put, Get, UseInterceptors, UploadedFiles } from '@nestjs/common';
import { Response, Request } from 'express';
import { FilesInterceptor } from '@nestjs/platform-express';
import { AuthService } from './auth.service';
import { RegisterDto, LoginDto, RefreshTokenDto } from './dto/auth.dto';
import { OnboardingDto } from './dto/auth-enhanced.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { GoogleAuthGuard } from './guards/google-auth.guard';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({
    status: 201,
    description: 'User successfully registered',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Registration successful' },
        user: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            email: { type: 'string' },
            name: { type: 'string' },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Validation failed' })
  @ApiResponse({ status: 409, description: 'User already exists' })
  async register(
    @Body() registerDto: RegisterDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const tokens = await this.authService.register(registerDto);

    // Set refresh token as httpOnly cookie
    response.cookie('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    return {
      message: 'Registration successful',
      accessToken: tokens.accessToken,
      user: {
        email: registerDto.email,
        name: registerDto.name,
      },
    };
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login user' })
  @ApiResponse({
    status: 200,
    description: 'Login successful',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Login successful' },
        accessToken: { type: 'string' },
        user: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            email: { type: 'string' },
            name: { type: 'string' },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    try {
      console.log('Login attempt for email:', loginDto.email);
      const tokens = await this.authService.login(loginDto);

      // Set refresh token as httpOnly cookie
      response.cookie('refreshToken', tokens.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      console.log('Login successful for:', loginDto.email);
      return {
        message: 'Login successful',
        accessToken: tokens.accessToken,
      };
    } catch (error) {
      console.error('Login controller error:', error);
      throw error;
    }
  }

  @Get('debug/user/:email')
  @ApiOperation({ summary: 'Debug: Check if user exists (for testing only)' })
  async debugCheckUser(@Req() request: Request) {
    const email = request.params.email;
    return await this.authService.debugCheckUser(email);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token' })
  @ApiResponse({
    status: 200,
    description: 'Token refreshed successfully',
    schema: {
      type: 'object',
      properties: {
        accessToken: { type: 'string' },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Invalid refresh token' })
  async refresh(
    @Req() request: Request,
    @Body() refreshTokenDto: RefreshTokenDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    // Get refresh token from cookie or body
    const refreshToken = request.cookies?.refreshToken || refreshTokenDto.refreshToken;

    if (!refreshToken) {
      throw new Error('Refresh token not provided');
    }

    const tokens = await this.authService.refreshTokens(refreshToken);

    // Set new refresh token as httpOnly cookie
    response.cookie('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    return {
      accessToken: tokens.accessToken,
    };
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Logout user' })
  @ApiResponse({ status: 200, description: 'Logout successful' })
  async logout(
    @Req() request: Request & { user: any },
    @Res({ passthrough: true }) response: Response,
  ) {
    const refreshToken = request.cookies?.refreshToken;
    
    await this.authService.logout(request.user.id, refreshToken);

    // Clear refresh token cookie
    response.clearCookie('refreshToken');

    return {
      message: 'Logout successful',
    };
  }

  @Post('logout-all')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Logout from all devices' })
  @ApiResponse({ status: 200, description: 'Logged out from all devices' })
  async logoutAll(
    @Req() request: Request & { user: any },
    @Res({ passthrough: true }) response: Response,
  ) {
    await this.authService.logout(request.user.id);

    // Clear refresh token cookie
    response.clearCookie('refreshToken');

    return {
      message: 'Logged out from all devices',
    };
  }

  @Put('complete-onboarding')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(FilesInterceptor('photos', 3, {
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit per file
    fileFilter: (req, file, callback) => {
      const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (allowedMimeTypes.includes(file.mimetype)) {
        callback(null, true);
      } else {
        callback(new Error('Only JPEG, PNG, and WebP images are allowed'), false);
      }
    },
  }))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Complete user onboarding with comprehensive profile data and photos' })
  @ApiResponse({ 
    status: 200, 
    description: 'Onboarding completed successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Onboarding completed successfully' },
        user: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            favoriteVerse: { type: 'string' },
            onboardingCompleted: { type: 'boolean', example: true },
            profilePhoto1: { type: 'string' },
            profilePhoto2: { type: 'string' },
            profilePhoto3: { type: 'string', nullable: true },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Validation failed or invalid file format' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async completeOnboarding(
    @Req() request: Request & { user: any },
    @UploadedFiles() files?: Express.Multer.File[],
  ) {
    // Extract onboarding data from FormData fields
    const onboardingData = {
      // Basic Information
      phoneNumber: request.body.phone_number,
      countryCode: request.body.country_code,
      birthday: request.body.birthday,

      // Educational Background
      education: request.body.education,
      occupation: request.body.occupation,

      // Location
      location: request.body.location,
      latitude: request.body.latitude ? parseFloat(request.body.latitude) : undefined,
      longitude: request.body.longitude ? parseFloat(request.body.longitude) : undefined,

      // Faith Journey
      denomination: request.body.denomination,
      churchAttendance: request.body.church_attendance,
      baptismStatus: request.body.baptism_status,
      faithJourney: request.body.faith_journey,
      spiritualGifts: request.body.spiritual_gifts ? JSON.parse(request.body.spiritual_gifts) : undefined,

      // Personal Preferences
      interests: request.body.interests ? JSON.parse(request.body.interests) : undefined,
      relationshipGoals: request.body.relationship_goals,
      lifestyle: request.body.personality, // Map personality to lifestyle
      bio: request.body.bio,
      favoriteVerse: request.body.favorite_verse,

      // Matching Preferences
      preferredGender: request.body.preferred_gender === 'MAN' ? 'MALE' : 
                      request.body.preferred_gender === 'WOMAN' ? 'FEMALE' : 
                      request.body.preferred_gender,
      preferredDenominations: request.body.preferred_denominations ? JSON.parse(request.body.preferred_denominations) : undefined,
      minAge: request.body.min_age ? parseInt(request.body.min_age) : undefined,
      maxAge: request.body.max_age ? parseInt(request.body.max_age) : undefined,
      maxDistance: request.body.max_distance ? parseInt(request.body.max_distance) : undefined,
      preferredFaithJourney: request.body.preferred_faith_journey ? JSON.parse(request.body.preferred_faith_journey) : undefined,
      preferredChurchAttendance: request.body.preferred_church_attendance ? JSON.parse(request.body.preferred_church_attendance) : undefined,
      preferredRelationshipGoals: request.body.preferred_relationship_goals ? JSON.parse(request.body.preferred_relationship_goals) : undefined,
    };

    // Add hobbies and values if provided
    if (request.body.hobbies) {
      onboardingData.interests = JSON.parse(request.body.hobbies);
    }
    if (request.body.values) {
      onboardingData.spiritualGifts = JSON.parse(request.body.values);
    }

    const result = await this.authService.completeOnboarding(request.user.id, onboardingData, files);

    return {
      message: 'Onboarding completed successfully',
      user: result,
    };
  }

  @Get('google')
  @UseGuards(GoogleAuthGuard)
  @ApiOperation({ summary: 'Initiate Google OAuth login' })
  @ApiResponse({ status: 302, description: 'Redirects to Google OAuth' })
  async googleLogin() {
    // This will trigger the GoogleAuthGuard and redirect to Google
  }

  @Get('google/callback')
  @UseGuards(GoogleAuthGuard)
  @ApiOperation({ summary: 'Google OAuth callback' })
  @ApiResponse({ 
    status: 200, 
    description: 'Google OAuth successful, redirects with tokens' 
  })
  async googleCallback(
    @Req() req: any,
    @Res() res: Response,
  ) {
    const user = req.user;
    const tokens = await this.authService.generateTokens(user);

    // Set refresh token as httpOnly cookie
    res.cookie('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    // For web applications, redirect to frontend with access token
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const redirectUrl = user.isNewUser 
      ? `${frontendUrl}/onboarding?token=${tokens.accessToken}&newUser=true`
      : `${frontendUrl}/dashboard?token=${tokens.accessToken}`;

    return res.redirect(redirectUrl);
  }

  @Post('google')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Google OAuth authentication' })
  @ApiResponse({
    status: 200,
    description: 'User successfully authenticated with Google',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Google authentication successful' },
        user: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            email: { type: 'string' },
            name: { type: 'string' },
            onboardingCompleted: { type: 'boolean' },
          },
        },
        isNewUser: { type: 'boolean' },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Invalid Google profile data' })
  async googleAuth(
    @Body() googleDto: {
      email: string;
      name: string;
      picture: string;
      googleId: string;
    },
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.authService.googleAuth(googleDto);
    const tokens = await this.authService.generateTokens(result.user);

    // Set refresh token as httpOnly cookie
    response.cookie('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    return {
      message: 'Google authentication successful',
      accessToken: tokens.accessToken,
      user: result.user,
      isNewUser: result.isNewUser,
    };
  }
}