import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { DiscoverFiltersDto } from './dto/discover.dto';

@Injectable()
export class DiscoverService {
  constructor(private prisma: PrismaService) {}

  async getNearbyUsers(userId: string, filters: DiscoverFiltersDto) {
    const where: any = {
      id: { not: userId },
      isActive: true,
    };

    if (filters.minAge || filters.maxAge) {
      where.age = {
        ...(filters.minAge && { gte: filters.minAge }),
        ...(filters.maxAge && { lte: filters.maxAge }),
      };
    }

    if (filters.denominations?.length) {
      where.denomination = { in: filters.denominations };
    }

    if (filters.onlineOnly) {
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      where.lastSeen = { gte: fiveMinutesAgo };
    }

    return this.prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        age: true,
        location: true,
        profilePhoto1: true,
        denomination: true,
        bio: true,
        lastSeen: true,
        isVerified: true,
        interests: true,
        favoriteVerses: true,
      },
      take: 20,
    });
  }

  async getUsersBySharedVerse(userId: string, verse: string) {
    return this.prisma.user.findMany({
      where: {
        id: { not: userId },
        isActive: true,
        favoriteVerses: {
          some: {
            reference: { contains: verse, mode: 'insensitive' }
          }
        }
      },
      select: {
        id: true,
        name: true,
        age: true,
        location: true,
        profilePhoto1: true,
        denomination: true,
        bio: true,
        isVerified: true,
        favoriteVerses: {
          where: {
            reference: { contains: verse, mode: 'insensitive' }
          }
        }
      },
      take: 20,
    });
  }

  async getUsersByInterest(userId: string, interest: string) {
    return this.prisma.user.findMany({
      where: {
        id: { not: userId },
        isActive: true,
        interests: {
          some: {
            interest: { contains: interest, mode: 'insensitive' }
          }
        }
      },
      select: {
        id: true,
        name: true,
        age: true,
        location: true,
        profilePhoto1: true,
        denomination: true,
        bio: true,
        isVerified: true,
        interests: {
          where: {
            interest: { contains: interest, mode: 'insensitive' }
          }
        }
      },
      take: 20,
    });
  }

  async getActiveUsers(userId: string) {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    
    return this.prisma.user.findMany({
      where: {
        id: { not: userId },
        isActive: true,
        lastSeen: { gte: oneHourAgo },
      },
      select: {
        id: true,
        name: true,
        age: true,
        location: true,
        profilePhoto1: true,
        denomination: true,
        bio: true,
        lastSeen: true,
        isVerified: true,
      },
      orderBy: { lastSeen: 'desc' },
      take: 20,
    });
  }

  async getMostActiveToday(userId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return this.prisma.user.findMany({
      where: {
        id: { not: userId },
        isActive: true,
        OR: [
          {
            posts: {
              some: {
                createdAt: { gte: today }
              }
            }
          },
          {
            postLikes: {
              some: {
                createdAt: { gte: today }
              }
            }
          },
          {
            postComments: {
              some: {
                createdAt: { gte: today }
              }
            }
          }
        ]
      },
      select: {
        id: true,
        name: true,
        age: true,
        location: true,
        profilePhoto1: true,
        denomination: true,
        bio: true,
        isVerified: true,
        _count: {
          select: {
            posts: {
              where: { createdAt: { gte: today } }
            },
            postLikes: {
              where: { createdAt: { gte: today } }
            },
            postComments: {
              where: { createdAt: { gte: today } }
            }
          }
        }
      },
      take: 20,
    });
  }

  async getDiscoverStats(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { location: true, denomination: true }
    });

    if (!user) throw new Error('User not found');

    // Get counts for different categories
    const [nearbyCount, activeCount, sameVerseCount, worshipLoversCount, onlineCount] = await Promise.all([
      // Nearby Christians (simplified - in real app you'd use geolocation)
      this.prisma.user.count({
        where: {
          id: { not: userId },
          isActive: true,
          location: { contains: user.location.split(',')[0], mode: 'insensitive' }
        }
      }),

      // Active today
      this.prisma.user.count({
        where: {
          id: { not: userId },
          isActive: true,
          lastSeen: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
        }
      }),

      // Users who love Jeremiah 29:11 (example)
      this.prisma.user.count({
        where: {
          id: { not: userId },
          isActive: true,
          favoriteVerses: {
            some: {
              reference: { contains: 'Jeremiah 29:11', mode: 'insensitive' }
            }
          }
        }
      }),

      // Worship music lovers
      this.prisma.user.count({
        where: {
          id: { not: userId },
          isActive: true,
          interests: {
            some: {
              interest: { contains: 'worship', mode: 'insensitive' }
            }
          }
        }
      }),

      // Currently online (last 5 minutes)
      this.prisma.user.count({
        where: {
          id: { not: userId },
          isActive: true,
          lastSeen: { gte: new Date(Date.now() - 5 * 60 * 1000) }
        }
      })
    ]);

    return {
      nearbyChristians: nearbyCount,
      activeToday: activeCount,
      sharedVerses: sameVerseCount,
      worshipLovers: worshipLoversCount,
      onlineNow: onlineCount,
      sundayAdventures: Math.floor(nearbyCount * 0.3), // Mock data
      justJoined: Math.floor(onlineCount * 0.5) // Mock data
    };
  }

  async getDailyChallenge(userId: string) {
    // Get user's current challenges
    const userChallenges = await this.prisma.challengeParticipant.findMany({
      where: {
        userId,
        challenge: { isActive: true }
      },
      include: {
        challenge: true
      }
    });

    // Return active challenge or create a default one
    if (userChallenges.length > 0) {
      const challenge = userChallenges[0];
      return {
        title: challenge.challenge.title,
        description: challenge.challenge.description,
        progress: `${challenge.progress}/${challenge.challenge.duration}`,
        reward: challenge.challenge.reward,
        isCompleted: challenge.isCompleted
      };
    }

    // Default challenge if no active challenges
    return {
      title: "Today's Challenge",
      description: "Send your favorite verse to 3 new people",
      progress: "0/3 completed",
      reward: "Unlock 'Verse Champion' badge",
      isCompleted: false
    };
  }
}
