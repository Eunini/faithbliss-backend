import { Injectable, UnauthorizedException, ConflictException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto, LoginDto } from './dto/auth.dto';
import { OnboardingDto } from './dto/auth-enhanced.dto';
import * as bcrypt from 'bcrypt';

export interface JwtPayload {
  sub: string;
  email: string;
  name: string;
  iat?: number;
  exp?: number;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async register(registerDto: RegisterDto): Promise<AuthTokens> {
    const { email, password, ...userData } = registerDto;

    // Check if user already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('User already exists with this email');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user
    const user = await this.prisma.user.create({
      data: {
        email,
        passwordHash,
        ...userData,
        preferences: {
          create: {
            preferredGender: userData.gender === 'MALE' ? 'FEMALE' : 'MALE',
            preferredDenomination: [userData.denomination],
            minAge: Math.max(18, userData.age - 5),
            maxAge: userData.age + 10,
            maxDistance: 50,
          },
        },
      },
    });

    return this.generateTokens(user);
  }

  async login(loginDto: LoginDto): Promise<AuthTokens> {
    try {
      const { email, password } = loginDto;
      console.log('Login attempt - Step 1: Finding user for email:', email);

      // Find user
      const user = await this.prisma.user.findUnique({
        where: { email },
      });

      if (!user) {
        console.log('Login attempt - Step 2: User not found for email:', email);
        throw new UnauthorizedException('Invalid credentials');
      }

      console.log('Login attempt - Step 2: User found, verifying password');

      // Verify password
      const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
      if (!isPasswordValid) {
        console.log('Login attempt - Step 3: Password verification failed');
        throw new UnauthorizedException('Invalid credentials');
      }

      console.log('Login attempt - Step 3: Password verified, updating last seen');

      // Update last seen
      await this.prisma.user.update({
        where: { id: user.id },
        data: { lastSeen: new Date() },
      });

      console.log('Login attempt - Step 4: Last seen updated, generating tokens');

      return this.generateTokens(user);
    } catch (error) {
      // Log the error for debugging
      console.error('Login error:', error.message || error);
      
      // If it's already an UnauthorizedException, rethrow it
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      
      // For any other error, throw a generic unauthorized error
      throw new UnauthorizedException('Login failed');
    }
  }

  async refreshTokens(refreshToken: string): Promise<AuthTokens> {
    try {
      // Find refresh token in database
      const tokenRecord = await this.prisma.refreshToken.findUnique({
        where: { token: refreshToken },
        include: { user: true },
      });

      if (!tokenRecord || tokenRecord.expiresAt < new Date()) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      // Delete old refresh token
      await this.prisma.refreshToken.delete({
        where: { token: refreshToken },
      });

      return this.generateTokens(tokenRecord.user);
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async logout(userId: string, refreshToken?: string): Promise<void> {
    if (refreshToken) {
      await this.prisma.refreshToken.deleteMany({
        where: {
          OR: [
            { token: refreshToken },
            { userId },
          ],
        },
      });
    } else {
      // Delete all refresh tokens for user
      await this.prisma.refreshToken.deleteMany({
        where: { userId },
      });
    }
  }

  async generateTokens(user: any): Promise<AuthTokens> {
    try {
      const payload: JwtPayload = {
        sub: user.id,
        email: user.email,
        name: user.name,
      };

      const jwtSecret = this.configService.get('JWT_SECRET');
      const jwtRefreshSecret = this.configService.get('JWT_REFRESH_SECRET');

      if (!jwtSecret || !jwtRefreshSecret) {
        console.error('Missing JWT secrets in configuration');
        throw new Error('JWT configuration error');
      }

      const [accessToken, refreshToken] = await Promise.all([
        this.jwtService.signAsync(payload, {
          secret: jwtSecret,
          expiresIn: this.configService.get('JWT_EXPIRES_IN') || '15m',
        }),
        this.jwtService.signAsync(payload, {
          secret: jwtRefreshSecret,
          expiresIn: this.configService.get('JWT_REFRESH_EXPIRES_IN') || '7d',
        }),
      ]);

      // Store refresh token in database
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

      await this.prisma.refreshToken.create({
        data: {
          token: refreshToken,
          userId: user.id,
          expiresAt,
        },
      });

      return {
        accessToken,
        refreshToken,
      };
    } catch (error) {
      console.error('Token generation error:', error);
      throw new Error('Failed to generate authentication tokens');
    }
  }

  async debugCheckUser(email: string): Promise<any> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { email },
        select: {
          id: true,
          email: true,
          name: true,
          passwordHash: true,
          createdAt: true,
        },
      });

      return {
        userExists: !!user,
        userEmail: user?.email,
        userName: user?.name,
        passwordHashExists: !!user?.passwordHash,
        passwordHashLength: user?.passwordHash?.length,
        createdAt: user?.createdAt,
      };
    } catch (error) {
      return {
        error: error.message,
      };
    }
  }

  async validateUser(payload: JwtPayload): Promise<any> {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        email: true,
        name: true,
        gender: true,
        denomination: true,
        age: true,
        location: true,
        bio: true,
        profilePhoto1: true,
        isActive: true,
        isVerified: true,
        createdAt: true,
      },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('User not found or inactive');
    }

    return user;
  }

  async completeOnboarding(userId: string, onboardingDto: OnboardingDto, files?: Express.Multer.File[]): Promise<any> {
    // Validate profile photos - first 2 are required, 3rd is optional
    if (!files || files.length < 2) {
      throw new BadRequestException('At least 2 profile photos are required for onboarding');
    }

    if (files.length > 3) {
      throw new BadRequestException('Maximum 3 profile photos allowed');
    }

    // Validate file types and sizes
    const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    const maxFileSize = 5 * 1024 * 1024; // 5MB

    for (const file of files) {
      if (!allowedMimeTypes.includes(file.mimetype)) {
        throw new BadRequestException('Only JPEG, PNG, and WebP images are allowed');
      }
      if (file.size > maxFileSize) {
        throw new BadRequestException('File size must be less than 5MB');
      }
    }

    // Extract preferences from DTO to handle separately
    const {
      preferredGender,
      preferredDenominations,
      minAge,
      maxAge,
      maxDistance,
      preferredFaithJourney,
      preferredChurchAttendance,
      preferredRelationshipGoals,
      interests,
      spiritualGifts,
      education,
      occupation,
      relationshipGoals, // User's own relationship goals
      lifestyle,
      churchAttendance, // User's own church attendance
      baptismStatus,
      faithJourney, // User's own faith journey
      phoneNumber,
      countryCode,
      birthday,
      ...otherData
    } = onboardingDto;

    // Map DTO fields to User model fields
    const userUpdateData = {
      ...otherData,
      // Basic contact information
      ...(phoneNumber && { phoneNumber }),
      ...(countryCode && { countryCode }),
      ...(birthday && { birthday }),
      // Map education enum to string field
      ...(education && { fieldOfStudy: education.toString() }),
      // Map occupation to profession
      ...(occupation && { profession: occupation }),
      // Map user's own relationship goals to lookingFor
      ...(relationshipGoals && { lookingFor: { set: relationshipGoals.map(goal => goal.toString()) } }),
      // Map lifestyle to personality
      ...(lifestyle && { personality: lifestyle }),
      // Map user's own church attendance to sundayActivity
      ...(churchAttendance && { sundayActivity: churchAttendance.toString() }),
      // Map baptism status to faithJourney (keeping existing logic)
      ...(baptismStatus && { faithJourney: baptismStatus.toString() }),
      // Override with user's own faith journey if provided
      ...(faithJourney && { faithJourney: faithJourney.toString() }),
    };

    // Convert uploaded photos to base64
    const photoData: Record<string, string> = {};
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const base64 = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;
      photoData[`profilePhoto${i + 1}`] = base64;
    }

    // Update user with comprehensive onboarding data
    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: {
        ...userUpdateData,
        ...photoData,
        onboardingCompleted: true,
        updatedAt: new Date(),
        // Handle interests relation if provided
        ...(interests && {
          interests: {
            deleteMany: { userId }, // Remove existing interests
            create: interests.map(interest => ({ interest }))
          }
        }),
        // Handle spiritual gifts as values if provided
        ...(spiritualGifts && { values: spiritualGifts }),
        // Update user preferences based on onboarding selections
        preferences: {
          update: {
            ...(preferredGender && { preferredGender }),
            ...(preferredDenominations && { preferredDenomination: preferredDenominations }),
            ...(minAge && { minAge }),
            ...(maxAge && { maxAge }),
            ...(maxDistance && { maxDistance }),
            ...(preferredFaithJourney && { preferredFaithJourney }),
            ...(preferredChurchAttendance && { preferredChurchAttendance }),
            ...(preferredRelationshipGoals && { preferredRelationshipGoals }),
          }
        },
      },
      select: {
        id: true,
        email: true,
        name: true,
        onboardingCompleted: true,
        profilePhoto1: true,
        profilePhoto2: true,
        profilePhoto3: true,
        location: true,
        denomination: true,
        fieldOfStudy: true,
        profession: true,
        hobbies: true,
        values: true,
        favoriteVerse: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return updatedUser;
  }

  async verifyToken(token: string): Promise<JwtPayload> {
    try {
      const payload = await this.jwtService.verifyAsync(token, {
        secret: this.configService.get('JWT_SECRET'),
      });
      return payload;
    } catch (error) {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }

  async googleAuth(googleDto: {
    email: string;
    name: string;
    picture: string;
    googleId: string;
  }): Promise<{ user: any; isNewUser: boolean }> {
    const { email, name, picture, googleId } = googleDto;

    if (!email || !name || !googleId) {
      throw new BadRequestException('Invalid Google profile data');
    }

    // Check if user already exists (using email as primary identifier)
    let user = await this.prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        profilePhoto1: true,
        profilePhoto2: true,
        profilePhoto3: true,
        onboardingCompleted: true,
        isActive: true,
        isVerified: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    let isNewUser = false;

    if (!user) {
      // Create new user with email as ID
      user = await this.prisma.user.create({
        data: {
          id: email, // Use email as the user ID
          email,
          name,
          profilePhoto1: picture, // Use Google profile picture as first photo
          passwordHash: '', // No password needed for Google OAuth
          gender: 'MALE', // Default values - will be updated during onboarding
          age: 25,
          denomination: 'OTHER',
          location: '',
          bio: '',
          isVerified: true, // Google accounts are considered verified
          onboardingCompleted: false,
          googleId,
          preferences: {
            create: {
              preferredGender: 'FEMALE', // Default preference for male users
              preferredDenomination: ['BAPTIST', 'METHODIST', 'PENTECOSTAL'], // Common denominations
              minAge: 18,
              maxAge: 35,
              maxDistance: 50,
            },
          },
        },
        select: {
          id: true,
          email: true,
          name: true,
          profilePhoto1: true,
          profilePhoto2: true,
          profilePhoto3: true,
          onboardingCompleted: true,
          isActive: true,
          isVerified: true,
          createdAt: true,
          updatedAt: true,
        },
      });
      isNewUser = true;
    } else {
      // Update existing user with Google info if needed
      user = await this.prisma.user.update({
        where: { email },
        data: {
          googleId,
          isVerified: true,
          // Update profile photo if they don't have one
          ...((!user.profilePhoto1 && picture) && { profilePhoto1: picture }),
          updatedAt: new Date(),
        },
        select: {
          id: true,
          email: true,
          name: true,
          profilePhoto1: true,
          profilePhoto2: true,
          profilePhoto3: true,
          onboardingCompleted: true,
          isActive: true,
          isVerified: true,
          createdAt: true,
          updatedAt: true,
        },
      });
    }

    return { user, isNewUser };
  }
}
