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

    return this.prisma.user.findMany({
      where: {
        id: { notIn: likedIds },
        isActive: true,
        gender: preferences.preferredGender || undefined,
        denomination: preferences.preferredDenomination.length > 0 
          ? { in: preferences.preferredDenomination } 
          : undefined,
        age: {
          gte: preferences.minAge,
          lte: preferences.maxAge,
        },
      },
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
      },
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    });
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
