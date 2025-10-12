import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateCommunityPostDto,
  CreatePostCommentDto,
  CreateEventDto,
  CreatePrayerRequestDto,
  CreateBlessWallEntryDto,
  PostType
} from './dto/community.dto';

@Injectable()
export class CommunityService {
  constructor(private prisma: PrismaService) {}

  // Community Posts
  async createPost(userId: string, createPostDto: CreateCommunityPostDto) {
    return this.prisma.communityPost.create({
      data: {
        userId,
        content: createPostDto.content,
        type: createPostDto.type || PostType.POST,
        verse: createPostDto.verse,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            profilePhoto1: true,
            isVerified: true,
          },
        },
        likes: {
          include: {
            user: {
              select: { id: true, name: true }
            }
          }
        },
        comments: {
          include: {
            user: {
              select: { id: true, name: true, profilePhoto1: true }
            }
          }
        },
        _count: {
          select: { likes: true, comments: true }
        }
      },
    });
  }

  async getAllPosts(page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;
    
    return this.prisma.communityPost.findMany({
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            profilePhoto1: true,
            isVerified: true,
          },
        },
        likes: {
          include: {
            user: {
              select: { id: true, name: true }
            }
          }
        },
        comments: {
          include: {
            user: {
              select: { id: true, name: true, profilePhoto1: true }
            }
          }
        },
        _count: {
          select: { likes: true, comments: true }
        }
      },
    });
  }

  async likePost(userId: string, postId: string) {
    try {
      return await this.prisma.postLike.create({
        data: { userId, postId },
      });
    } catch (error) {
      // Handle duplicate like (user already liked this post)
      throw new Error('Post already liked');
    }
  }

  async unlikePost(userId: string, postId: string) {
    return this.prisma.postLike.delete({
      where: {
        userId_postId: { userId, postId },
      },
    });
  }

  async addComment(userId: string, postId: string, createCommentDto: CreatePostCommentDto) {
    return this.prisma.postComment.create({
      data: {
        userId,
        postId,
        content: createCommentDto.content,
      },
      include: {
        user: {
          select: { id: true, name: true, profilePhoto1: true }
        }
      },
    });
  }

  // Events
  async createEvent(hostId: string, createEventDto: CreateEventDto) {
    return this.prisma.event.create({
      data: {
        title: createEventDto.title,
        description: createEventDto.description,
        type: createEventDto.type as any,
        hostId,
        date: new Date(createEventDto.date),
        time: createEventDto.time,
        location: createEventDto.location,
        isVirtual: createEventDto.isVirtual ?? true,
        maxAttendees: createEventDto.maxAttendees,
      },
      include: {
        host: {
          select: { id: true, name: true, profilePhoto1: true }
        },
        attendees: {
          include: {
            user: {
              select: { id: true, name: true, profilePhoto1: true }
            }
          }
        },
        _count: { select: { attendees: true } }
      },
    });
  }

  async getEvents(page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;
    
    return this.prisma.event.findMany({
      skip,
      take: limit,
      where: { date: { gte: new Date() } }, // Only future events
      orderBy: { date: 'asc' },
      include: {
        host: {
          select: { id: true, name: true, profilePhoto1: true }
        },
        attendees: {
          include: {
            user: {
              select: { id: true, name: true, profilePhoto1: true }
            }
          }
        },
        _count: { select: { attendees: true } }
      },
    });
  }

  async joinEvent(userId: string, eventId: string) {
    try {
      return await this.prisma.eventAttendee.create({
        data: { userId, eventId },
        include: {
          user: {
            select: { id: true, name: true, profilePhoto1: true }
          }
        },
      });
    } catch (error) {
      throw new Error('Already joined this event');
    }
  }

  async leaveEvent(userId: string, eventId: string) {
    return this.prisma.eventAttendee.delete({
      where: {
        eventId_userId: { eventId, userId },
      },
    });
  }

  // Prayer Requests
  async createPrayerRequest(userId: string, createPrayerRequestDto: CreatePrayerRequestDto) {
    return this.prisma.prayerRequest.create({
      data: {
        userId: createPrayerRequestDto.isAnonymous ? null : userId,
        content: createPrayerRequestDto.content,
        isAnonymous: createPrayerRequestDto.isAnonymous ?? false,
      },
      include: {
        user: createPrayerRequestDto.isAnonymous ? false : {
          select: { id: true, name: true, profilePhoto1: true }
        },
        prayers: {
          include: {
            user: {
              select: { id: true, name: true }
            }
          }
        },
        _count: { select: { prayers: true } }
      },
    });
  }

  async getPrayerRequests(page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;
    
    return this.prisma.prayerRequest.findMany({
      skip,
      take: limit,
      where: { status: 'ACTIVE' },
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: { id: true, name: true, profilePhoto1: true }
        },
        prayers: {
          include: {
            user: {
              select: { id: true, name: true }
            }
          }
        },
        _count: { select: { prayers: true } }
      },
    });
  }

  async prayForRequest(userId: string, prayerRequestId: string) {
    try {
      return await this.prisma.prayer.create({
        data: { userId, prayerRequestId },
      });
    } catch (error) {
      throw new Error('Already prayed for this request');
    }
  }

  // Bless Wall
  async createBlessWallEntry(fromUserId: string, createBlessWallEntryDto: CreateBlessWallEntryDto) {
    return this.prisma.blessWallEntry.create({
      data: {
        fromUserId,
        toUserId: createBlessWallEntryDto.toUserId,
        message: createBlessWallEntryDto.message,
        verse: createBlessWallEntryDto.verse,
        isPublic: createBlessWallEntryDto.isPublic ?? true,
      },
      include: {
        fromUser: {
          select: { id: true, name: true, profilePhoto1: true }
        },
        toUser: {
          select: { id: true, name: true, profilePhoto1: true }
        }
      },
    });
  }

  async getBlessWallEntries(page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;
    
    return this.prisma.blessWallEntry.findMany({
      skip,
      take: limit,
      where: { isPublic: true },
      orderBy: { createdAt: 'desc' },
      include: {
        fromUser: {
          select: { id: true, name: true, profilePhoto1: true }
        },
        toUser: {
          select: { id: true, name: true, profilePhoto1: true }
        }
      },
    });
  }

  // Community Highlights
  async getCommunityHighlights() {
    // Most active users today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const prayerChampions = await this.prisma.user.findMany({
      where: {
        prayers: {
          some: {
            createdAt: { gte: today }
          }
        }
      },
      include: {
        _count: {
          select: { prayers: true }
        }
      },
      orderBy: {
        prayers: {
          _count: 'desc'
        }
      },
      take: 5,
    });

    const verseSharers = await this.prisma.user.findMany({
      where: {
        posts: {
          some: {
            type: 'VERSE',
            createdAt: { gte: today }
          }
        }
      },
      include: {
        _count: {
          select: { posts: true }
        }
      },
      orderBy: {
        posts: {
          _count: 'desc'
        }
      },
      take: 5,
    });

    const mostEncouraging = await this.prisma.user.findMany({
      where: {
        postLikes: {
          some: {
            createdAt: { gte: today }
          }
        }
      },
      include: {
        _count: {
          select: { postLikes: true }
        }
      },
      orderBy: {
        postLikes: {
          _count: 'desc'
        }
      },
      take: 5,
    });

    return {
      prayerChampions: prayerChampions.map(user => ({
        id: user.id,
        name: user.name,
        profilePhoto1: user.profilePhoto1,
        prayerCount: user._count.prayers
      })),
      verseSharers: verseSharers.map(user => ({
        id: user.id,
        name: user.name,
        profilePhoto1: user.profilePhoto1,
        postCount: user._count.posts
      })),
      mostEncouraging: mostEncouraging.map(user => ({
        id: user.id,
        name: user.name,
        profilePhoto1: user.profilePhoto1,
        likeCount: user._count.postLikes
      }))
    };
  }
}
