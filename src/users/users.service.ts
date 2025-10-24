import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateProfileDto, UpdatePreferencesDto } from './dto/user.dto';
import { Prisma, Gender, Denomination } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async getUserProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        gender: true,
        age: true,
        denomination: true,
        bio: true,
        location: true,
        latitude: true,
        longitude: true,
        phoneNumber: true,
        countryCode: true,
        birthday: true,
        fieldOfStudy: true,
        profession: true,
        faithJourney: true,
        sundayActivity: true,
        lookingFor: true,
        hobbies: true,
        values: true,
        favoriteVerse: true,
        profilePhoto1: true,
        profilePhoto2: true,
        profilePhoto3: true,
        isVerified: true,
        onboardingCompleted: true,
        createdAt: true,
        updatedAt: true,
        preferences: {
          select: {
            preferredGender: true,
            preferredDenomination: true,
            minAge: true,
            maxAge: true,
            maxDistance: true,
            preferredFaithJourney: true,
            preferredChurchAttendance: true,
            preferredRelationshipGoals: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async updateProfile(userId: string, updateProfileDto: UpdateProfileDto) {
    const existingUser = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!existingUser) throw new NotFoundException('User not found');

    // Define allowed fields for update
    const allowedFields: Array<keyof UpdateProfileDto> = [
      'name', 'age', 'bio', 'location', 'latitude', 'longitude',
      'denomination', 'faithJourney', 'favoriteVerse', 'fieldOfStudy',
      'profession', 'hobbies', 'values', 'lookingFor',
      'profilePhoto1', 'profilePhoto2', 'profilePhoto3',
    ];

    // Filter only the fields provided in the request
    const dataToUpdate: Partial<UpdateProfileDto> = {};
    for (const key of allowedFields) {
      if (updateProfileDto[key] !== undefined) {
        dataToUpdate[key as string] = updateProfileDto[key];
      }
    }

    try {
      const updatedUser = await this.prisma.user.update({
        where: { id: userId },
        data: {
          ...dataToUpdate,
          updatedAt: new Date(),
        },
        select: {
          id: true,
          email: true,
          name: true,
          gender: true,
          age: true,
          denomination: true,
          bio: true,
          location: true,
          latitude: true,
          longitude: true,
          fieldOfStudy: true,
          profession: true,
          hobbies: true,
          values: true,
          lookingFor: true,
          faithJourney: true,
          favoriteVerse: true,
          profilePhoto1: true,
          profilePhoto2: true,
          profilePhoto3: true,
          isVerified: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      return updatedUser;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('Email already exists');
      }
      throw error;
    }
  }

  async updatePreferences(userId: string, updatePreferencesDto: UpdatePreferencesDto) {
    const existingUser = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { preferences: true },
    });

    if (!existingUser) {
      throw new NotFoundException('User not found');
    }

    try {
      if (!existingUser.preferences) {
        // Create preferences if they don't exist
        const preferencesData: any = { ...updatePreferencesDto };

        if (preferencesData.preferredDenomination) {
          preferencesData.preferredDenomination = JSON.stringify(preferencesData.preferredDenomination);
        }
        if (preferencesData.preferredFaithJourney) {
          preferencesData.preferredFaithJourney = JSON.stringify(preferencesData.preferredFaithJourney);
        }
        if (preferencesData.preferredChurchAttendance) {
          preferencesData.preferredChurchAttendance = JSON.stringify(preferencesData.preferredChurchAttendance);
        }

        const preferences = await this.prisma.userPreferences.create({
          data: {
            userId,
            ...preferencesData,
          },
        });
        return preferences;
      }

        const preferencesData: any = { ...updatePreferencesDto };

        if (preferencesData.preferredDenomination) {
          preferencesData.preferredDenomination = JSON.stringify(preferencesData.preferredDenomination);
        }
        if (preferencesData.preferredFaithJourney) {
          preferencesData.preferredFaithJourney = JSON.stringify(preferencesData.preferredFaithJourney);
        }
        if (preferencesData.preferredChurchAttendance) {
          preferencesData.preferredChurchAttendance = JSON.stringify(preferencesData.preferredChurchAttendance);
        }

      // Update existing preferences
      const updatedPreferences = await this.prisma.userPreferences.update({
        where: { userId },
        data: preferencesData,
      });

      return updatedPreferences;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        throw new ConflictException('Failed to update preferences');
      }
      throw error;
    }
  }

  async getUserPreferences(userId: string) {
    const preferences = await this.prisma.userPreferences.findUnique({
      where: { userId },
    });

    if (!preferences) {
      // Return default preferences instead of throwing error
      return {
        userId,
        preferredGender: null,
        preferredDenomination: null,
        minAge: 18,
        maxAge: 60,
        maxDistance: 50,
      };
    }

    return preferences;
  }

  async deactivateAccount(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    try {
      await this.prisma.$transaction(async (tx) => {
        // Update user status
        await tx.user.update({
          where: { id: userId },
          data: {
            isActive: false,
            updatedAt: new Date(),
          },
        });

        // Delete all refresh tokens
        await tx.refreshToken.deleteMany({
          where: { userId },
        });
      });

      return { message: 'Account deactivated successfully' };
    } catch (error) {
      throw new ConflictException('Failed to deactivate account');
    }
  }

  async reactivateAccount(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    try {
      await this.prisma.user.update({
        where: { id: userId },
        data: {
          isActive: true,
          updatedAt: new Date(),
        },
      });

      return { message: 'Account reactivated successfully' };
    } catch (error) {
      throw new ConflictException('Failed to reactivate account');
    }
  }

  async searchUsers(
    currentUserId: string,
    filters: {
      search?: string;
      gender?: string;
      denomination?: string[];
      minAge?: number;
      maxAge?: number;
      location?: string;
      isVerified?: boolean;
      page?: number;
      limit?: number;
    }
  ) {
    const {
      search,
      gender,
      denomination,
      minAge,
      maxAge,
      location,
      isVerified,
      page = 1,
      limit = 20
    } = filters;

    // Validate pagination parameters
    const validatedPage = Math.max(1, page);
    const validatedLimit = Math.min(Math.max(1, limit), 100); // Max 100 per page
    const skip = (validatedPage - 1) * validatedLimit;
    
    // Build dynamic where clause with proper typing
    const where: Prisma.UserWhereInput = {
      id: { not: currentUserId }, // Exclude current user
      isActive: true,
    };

    if (search && search.trim()) {
      where.OR = [
        { name: { contains: search.trim(), mode: 'insensitive' } },
        { bio: { contains: search.trim(), mode: 'insensitive' } },
        { location: { contains: search.trim(), mode: 'insensitive' } },
      ];
    }

    if (gender) {
      where.gender = gender as Gender;
    }

    if (denomination && denomination.length > 0) {
      where.denomination = { in: denomination as Denomination[] };
    }

    if (minAge !== undefined || maxAge !== undefined) {
      where.age = {};
      if (minAge !== undefined && minAge > 0) where.age.gte = minAge;
      if (maxAge !== undefined && maxAge > 0) where.age.lte = maxAge;
    }

    if (location && location.trim()) {
      where.location = { contains: location.trim(), mode: 'insensitive' };
    }

    if (isVerified !== undefined) {
      where.isVerified = isVerified;
    }

    try {
      const [users, total] = await Promise.all([
        this.prisma.user.findMany({
          where,
          skip,
          take: validatedLimit,
          select: {
            id: true,
            name: true,
            gender: true,
            age: true,
            denomination: true,
            location: true,
            bio: true,
            profilePhoto1: true,
            isVerified: true,
            createdAt: true,
          },
          orderBy: [
            { isVerified: 'desc' },
            { createdAt: 'desc' },
          ],
        }),
        this.prisma.user.count({ where }),
      ]);

      return {
        users,
        pagination: {
          page: validatedPage,
          limit: validatedLimit,
          total,
          totalPages: Math.ceil(total / validatedLimit),
        },
      };
    } catch (error) {
      throw new ConflictException('Failed to search users');
    }
  }

  async getAllUsers(page: number = 1, limit: number = 10, search?: string) {
    // Validate pagination parameters
    const validatedPage = Math.max(1, page);
    const validatedLimit = Math.min(Math.max(1, limit), 100);
    const skip = (validatedPage - 1) * validatedLimit;
    
    const where: Prisma.UserWhereInput = search && search.trim()
      ? {
          OR: [
            { name: { contains: search.trim(), mode: 'insensitive' } },
            { email: { contains: search.trim(), mode: 'insensitive' } },
            { location: { contains: search.trim(), mode: 'insensitive' } },
          ],
        }
      : {};

    try {
      const [users, total] = await Promise.all([
        this.prisma.user.findMany({
          where,
          skip,
          take: validatedLimit,
          select: {
            id: true,
            email: true,
            name: true,
            gender: true,
            age: true,
            denomination: true,
            location: true,
            profilePhoto1: true,
            isActive: true,
            isVerified: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
        }),
        this.prisma.user.count({ where }),
      ]);

      return {
        users,
        total,
        page: validatedPage,
        limit: validatedLimit,
        totalPages: Math.ceil(total / validatedLimit),
      };
    } catch (error) {
      throw new ConflictException('Failed to fetch users');
    }
  }

  async getUserById(id: string) {
    if (!id || !id.trim()) {
      throw new ConflictException('Invalid user ID');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: id.trim() },
      select: {
        id: true,
        email: true,
        name: true,
        gender: true,
        age: true,
        denomination: true,
        bio: true,
        location: true,
        profilePhoto1: true,
        isVerified: true,
        isActive: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async uploadProfilePhotos(userId: string, files: Express.Multer.File[]) {
    if (!files || files.length === 0) {
      throw new ConflictException('No files provided');
    }

    if (files.length > 3) {
      throw new ConflictException('Maximum 3 photos allowed');
    }

    // Validate file types
    const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    const maxFileSize = 5 * 1024 * 1024; // 5MB

    for (const file of files) {
      if (!allowedMimeTypes.includes(file.mimetype)) {
        throw new ConflictException('Only JPEG, PNG, and WebP images are allowed');
      }
      if (file.size > maxFileSize) {
        throw new ConflictException('File size must be less than 5MB');
      }
    }

    try {
      // Convert files to base64 strings for storage
      const photoData: Record<string, string> = {};
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const base64 = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;
        photoData[`profilePhoto${i + 1}`] = base64;
      }

      const updatedUser = await this.prisma.user.update({
        where: { id: userId },
        data: {
          ...photoData,
          updatedAt: new Date(),
        },
        select: {
          id: true,
          profilePhoto1: true,
          profilePhoto2: true,
          profilePhoto3: true,
          updatedAt: true,
        },
      });

      return {
        message: `${files.length} photo(s) uploaded successfully`,
        photos: {
          profilePhoto1: updatedUser.profilePhoto1,
          profilePhoto2: updatedUser.profilePhoto2,
          profilePhoto3: updatedUser.profilePhoto3,
        },
      };
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        throw new ConflictException('Failed to upload photos');
      }
      throw error;
    }
  }

  async uploadSingleProfilePhoto(userId: string, photoNumber: number, file: Express.Multer.File) {
    if (!file) {
      throw new ConflictException('No file provided');
    }

    if (photoNumber < 1 || photoNumber > 3) {
      throw new ConflictException('Photo number must be between 1 and 3');
    }

    // Validate file type and size
    const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    const maxFileSize = 5 * 1024 * 1024; // 5MB

    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new ConflictException('Only JPEG, PNG, and WebP images are allowed');
    }
    if (file.size > maxFileSize) {
      throw new ConflictException('File size must be less than 5MB');
    }

    try {
      // Convert file to base64 string for storage
      const base64 = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;

      const updateData: Record<string, any> = {
        [`profilePhoto${photoNumber}`]: base64,
        updatedAt: new Date(),
      };

      const updatedUser = await this.prisma.user.update({
        where: { id: userId },
        data: updateData,
        select: {
          id: true,
          profilePhoto1: true,
          profilePhoto2: true,
          profilePhoto3: true,
          updatedAt: true,
        },
      });

      return {
        message: `Photo ${photoNumber} uploaded successfully`,
        photoNumber,
        photoUrl: updatedUser[`profilePhoto${photoNumber}` as keyof typeof updatedUser],
      };
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        throw new ConflictException('Failed to upload photo');
      }
      throw error;
    }
  }

  async removeProfilePhoto(userId: string, photoNumber: number) {
    if (photoNumber < 1 || photoNumber > 3) {
      throw new ConflictException('Photo number must be between 1 and 3');
    }

    const photoField = `profilePhoto${photoNumber}`;

    const updateData: Record<string, any> = {
      [photoField]: null,
      updatedAt: new Date(),
    };

    try {
      const updatedUser = await this.prisma.user.update({
        where: { id: userId },
        data: updateData,
        select: {
          id: true,
          profilePhoto1: true,
          profilePhoto2: true,
          profilePhoto3: true,
          updatedAt: true,
        },
      });

      return {
        message: `Photo ${photoNumber} removed successfully`,
        photoNumber,
        photos: {
          profilePhoto1: updatedUser.profilePhoto1,
          profilePhoto2: updatedUser.profilePhoto2,
          profilePhoto3: updatedUser.profilePhoto3,
        },
      };
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        throw new ConflictException('Failed to remove photo');
      }
      throw error;
    }
  }
}
