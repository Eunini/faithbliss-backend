import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MatchesService {
  constructor(private prisma: PrismaService) {}

  async getUserMatches(userId: string) {
    return this.prisma.match.findMany({
      where: {
        OR: [
          { user1Id: userId },
          { user2Id: userId },
        ],
        status: 'MATCHED',
      },
      include: {
        user1: {
          select: {
            id: true,
            name: true,
            age: true,
            profilePhoto1: true,
          },
        },
        user2: {
          select: {
            id: true,
            name: true,
            age: true,
            profilePhoto1: true,
          },
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });
  }

  async getPotentialMatches(userId: string, page: number = 1, limit: number = 10) {
    try {
      const currentUser = await this.prisma.user.findUnique({
        where: { id: userId },
        include: { preferences: true },
      });

      if (!currentUser || !currentUser.preferences) {
        throw new Error('User or preferences not found');
      }

      const { preferences } = currentUser;
      const skip = (page - 1) * limit;

      // Get users that have already been liked or matched
      const likedUserIds = await this.prisma.userLike.findMany({
        where: { userId },
        select: { likedUserId: true },
      });

      const likedIds = likedUserIds.map(like => like.likedUserId);
      likedIds.push(userId); // Exclude self

      // Build where conditions based on preferences
      const whereConditions: any = {
        id: { notIn: likedIds },
        isActive: true,
        onboardingCompleted: true, // Only show users who completed onboarding
      };

      // Basic preferences
      if (preferences.preferredGender) {
        whereConditions.gender = preferences.preferredGender;
      }

      if (preferences.preferredDenomination && preferences.preferredDenomination.length > 0) {
        whereConditions.denomination = { in: preferences.preferredDenomination };
      }

      if (preferences.minAge || preferences.maxAge) {
        whereConditions.age = {};
        if (preferences.minAge) whereConditions.age.gte = preferences.minAge;
        if (preferences.maxAge) whereConditions.age.lte = preferences.maxAge;
      }

      // Advanced preferences based on user profile data
      // Faith journey compatibility - match preferences against user's faithJourney field
      if ((preferences as any).preferredFaithJourney && Array.isArray((preferences as any).preferredFaithJourney) && (preferences as any).preferredFaithJourney.length > 0) {
        whereConditions.faithJourney = { in: (preferences as any).preferredFaithJourney };
      }

      // Church attendance compatibility - match preferences against user's sundayActivity field
      if ((preferences as any).preferredChurchAttendance && Array.isArray((preferences as any).preferredChurchAttendance) && (preferences as any).preferredChurchAttendance.length > 0) {
        const churchAttendanceMap: { [key: string]: string } = {
          'WEEKLY': 'WEEKLY',
          'BIWEEKLY': 'BIWEEKLY',
          'MONTHLY': 'MONTHLY',
          'OCCASIONALLY': 'OCCASIONALLY',
          'RARELY': 'RARELY',
        };

        const mappedAttendance = (preferences as any).preferredChurchAttendance
          .map(attendance => churchAttendanceMap[attendance])
          .filter(Boolean);

        if (mappedAttendance.length > 0) {
          whereConditions.sundayActivity = { in: mappedAttendance };
        }
      }

      // Relationship goals compatibility - match preferences against user's lookingFor field
      if ((preferences as any).preferredRelationshipGoals && Array.isArray((preferences as any).preferredRelationshipGoals) && (preferences as any).preferredRelationshipGoals.length > 0) {
        const relationshipGoalsConditions = (preferences as any).preferredRelationshipGoals.map(goal => ({
          lookingFor: { equals: goal }
        }));

        if (relationshipGoalsConditions.length > 0) {
          whereConditions.OR = whereConditions.OR
            ? [...whereConditions.OR, ...relationshipGoalsConditions]
            : relationshipGoalsConditions;
        }
      }

      // First, try to find matches with preferences
      let potentialMatches = await this.prisma.user.findMany({
        where: whereConditions,
        select: {
          id: true,
          name: true,
          age: true,
          gender: true,
          denomination: true,
          location: true,
          bio: true,
          profilePhoto1: true,
          isVerified: true,
          faithJourney: true,
          sundayActivity: true,
          lookingFor: true,
          values: true,
          fieldOfStudy: true,
          profession: true,
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      });

      // If no matches found with preferences, fall back to showing all users
      if (potentialMatches.length === 0) {
        console.log('No potential matches found with preferences, falling back to all users');
        
        // Fallback: show all active, onboarded users (excluding self and liked users)
        const fallbackWhereConditions = {
          id: { notIn: likedIds },
          isActive: true,
          onboardingCompleted: true,
        };

        potentialMatches = await this.prisma.user.findMany({
          where: fallbackWhereConditions,
          select: {
            id: true,
            name: true,
            age: true,
            gender: true,
            denomination: true,
            location: true,
            bio: true,
            profilePhoto1: true,
            isVerified: true,
            faithJourney: true,
            sundayActivity: true,
            lookingFor: true,
            values: true,
            fieldOfStudy: true,
            profession: true,
          },
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
        });
      }

      return potentialMatches;
    } catch (error) {
      console.error('Error in getPotentialMatches:', error);
      throw new Error(`Failed to get potential matches: ${error.message}`);
    }
  }

  async likeUser(userId: string, likedUserId: string) {
    // Prevent liking the same user twice
    const existingLike = await this.prisma.userLike.findUnique({
      where: {
        userId_likedUserId: {
          userId,
          likedUserId,
        },
      },
    });

    if (existingLike) {
      throw new Error('User already liked');
    }

    // Create like record
    await this.prisma.userLike.create({
      data: {
        userId,
        likedUserId,
      },
    });

    // Check if it's a mutual like
    const mutualLike = await this.prisma.userLike.findUnique({
      where: {
        userId_likedUserId: {
          userId: likedUserId,
          likedUserId: userId,
        },
      },
    });

    if (mutualLike) {
      // Create match
      const match = await this.prisma.match.create({
        data: {
          user1Id: userId,
          user2Id: likedUserId,
          status: 'MATCHED',
        },
        include: {
          user1: {
            select: {
              id: true,
              name: true,
              profilePhoto1: true,
            },
          },
          user2: {
            select: {
              id: true,
              name: true,
              profilePhoto1: true,
            },
          },
        },
      });
      
      return { isMatch: true, match };
    }

    return { isMatch: false, match: null };
  }

  async passUser(userId: string, passedUserId: string) {
    // Just record that user was seen (optional for analytics)
    // You could create a UserPass model similar to UserLike if needed
    return { message: 'User passed' };
  }
}
