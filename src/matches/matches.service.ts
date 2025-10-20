import { Injectable, InternalServerErrorException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { User } from '@prisma/client';
import { MessagesService } from '../messages/messages.service';
import { NotificationsGateway } from '../notifications/notifications.gateway';

@Injectable()
export class MatchesService {
  constructor(
    private prisma: PrismaService,
    private messagesService: MessagesService,
    private notificationsGateway: NotificationsGateway,
  ) {}

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
        onboardingCompleted: true,
      };

      // Basic preferences
      if (preferences.preferredGender) {
        whereConditions.gender = preferences.preferredGender;
      }

      // FIX: Handle denomination filter properly
      if (preferences.preferredDenomination && preferences.preferredDenomination.length > 0) {
        // Ensure it's always treated as an array
        const denominations = Array.isArray(preferences.preferredDenomination) 
          ? preferences.preferredDenomination 
          : [preferences.preferredDenomination];
        whereConditions.denomination = { in: denominations };
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
          lookingFor: { has: goal }
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
          profilePhoto2: true,
          profilePhoto3: true,
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
            profilePhoto2: true,
            profilePhoto3: true,
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

  async getFilteredMatches(userId: string, filters: any, page: number = 1, limit: number = 10) {
    try {
      const skip = (page - 1) * limit;

      // Get users that have already been liked or matched
      const likedUserIds = await this.prisma.userLike.findMany({
        where: { userId },
        select: { likedUserId: true },
      });

      const likedIds = likedUserIds.map(like => like.likedUserId);
      likedIds.push(userId); // Exclude self

      // Build where conditions based on provided filters
      const whereConditions: any = {
        id: { notIn: likedIds },
        isActive: true,
        onboardingCompleted: true,
      };

      // Apply filters from the request
      if (filters.preferredGender) {
        whereConditions.gender = filters.preferredGender;
      }

      if (filters.preferredDenominations && filters.preferredDenominations.length > 0) {
        // Ensure it's always treated as an array
        const denominations = Array.isArray(filters.preferredDenominations) 
          ? filters.preferredDenominations 
          : [filters.preferredDenominations];
        whereConditions.denomination = { in: denominations };
      }

      if (filters.minAge || filters.maxAge) {
        whereConditions.age = {};
        if (filters.minAge) whereConditions.age.gte = filters.minAge;
        if (filters.maxAge) whereConditions.age.lte = filters.maxAge;
      }

      // Advanced filters
      if (filters.preferredFaithJourney && Array.isArray(filters.preferredFaithJourney) && filters.preferredFaithJourney.length > 0) {
        whereConditions.faithJourney = { in: filters.preferredFaithJourney };
      }

      if (filters.preferredChurchAttendance && Array.isArray(filters.preferredChurchAttendance) && filters.preferredChurchAttendance.length > 0) {
        const churchAttendanceMap: { [key: string]: string } = {
          'WEEKLY': 'WEEKLY',
          'BIWEEKLY': 'BIWEEKLY',
          'MONTHLY': 'MONTHLY',
          'OCCASIONALLY': 'OCCASIONALLY',
          'RARELY': 'RARELY',
        };

        const mappedAttendance = filters.preferredChurchAttendance
          .map(attendance => churchAttendanceMap[attendance])
          .filter(Boolean);

        if (mappedAttendance.length > 0) {
          whereConditions.sundayActivity = { in: mappedAttendance };
        }
      }

      if (filters.preferredRelationshipGoals && Array.isArray(filters.preferredRelationshipGoals) && filters.preferredRelationshipGoals.length > 0) {
        const relationshipGoalsConditions = filters.preferredRelationshipGoals.map(goal => ({
          lookingFor: { has: goal }
        }));

        if (relationshipGoalsConditions.length > 0) {
          whereConditions.OR = whereConditions.OR
            ? [...whereConditions.OR, ...relationshipGoalsConditions]
            : relationshipGoalsConditions;
        }
      }

      return await this.prisma.user.findMany({
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
          profilePhoto2: true,
          profilePhoto3: true,
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
    } catch (error) {
      console.error('Error in getFilteredMatches:', error);
      throw new Error(`Failed to get filtered matches: ${error.message}`);
    }
  }

  async likeUser(userId: string, likedUserId: string) {
    try {
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
        throw new ConflictException('User already liked');
      }

      if (userId === likedUserId) {
        throw new BadRequestException('Cannot like your own profile');
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
            user1: { connect: { id: userId } },
            user2: { connect: { id: likedUserId } },
            status: 'MATCHED',
          },
        });

        // Notify both users about the new match
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        const likedUser = await this.prisma.user.findUnique({ where: { id: likedUserId } });

        if (user && likedUser) {
          this.notificationsGateway.sendNotificationToUser(userId, {
            type: 'NEW_MATCH',
            message: `You have a new match with ${likedUser.name}!`, 
            matchId: match.id,
            otherUser: { id: likedUser.id, name: likedUser.name },
          });
          this.notificationsGateway.sendNotificationToUser(likedUserId, {
            type: 'NEW_MATCH',
            message: `You have a new match with ${user.name}!`, 
            matchId: match.id,
            otherUser: { id: user.id, name: user.name },
          });
        }

        return { isMatch: true, match };
      }

      // If not a mutual like, send a 'profile_liked' notification to the liked user
      const likerUser = await this.prisma.user.findUnique({ where: { id: userId } });
      if (likerUser) {
        this.notificationsGateway.sendNotificationToUser(likedUserId, {
          type: 'PROFILE_LIKED',
          message: `${likerUser.name} liked your profile!`,
          senderId: userId,
          senderName: likerUser.name,
        });
      }

      return { isMatch: false, match: null };
    } catch (error) {
      console.error('Error in likeUser:', error);
      throw new InternalServerErrorException('Failed to process like request');
    }
  }

  async passUser(userId: string, passedUserId: string) {
    // Just record that user was seen (optional for analytics)
    // You could create a UserPass model similar to UserLike if needed
    return { message: 'User passed' };
  }
}