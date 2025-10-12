import { Test, TestingModule } from '@nestjs/testing';
import { DiscoverService } from './discover.service';
import { PrismaService } from '../prisma/prisma.service';

const mockPrismaService = {
  user: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    count: jest.fn(),
  },
  challengeParticipant: {
    findMany: jest.fn(),
  },
};

describe('DiscoverService', () => {
  let service: DiscoverService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DiscoverService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<DiscoverService>(DiscoverService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getNearbyUsers', () => {
    it('should get nearby users with filters', async () => {
      const userId = 'user-id';
      const filters = {
        maxDistance: 50,
        minAge: 25,
        maxAge: 35,
        denominations: ['BAPTIST', 'PENTECOSTAL'],
        onlineOnly: false,
      };

      const mockUsers = [
        {
          id: 'user-1',
          name: 'User 1',
          age: 30,
          location: 'Lagos, Nigeria',
          denomination: 'BAPTIST',
        },
        {
          id: 'user-2',
          name: 'User 2',
          age: 28,
          location: 'Abuja, Nigeria',
          denomination: 'PENTECOSTAL',
        },
      ];

      mockPrismaService.user.findMany.mockResolvedValue(mockUsers);

      const result = await service.getNearbyUsers(userId, filters);

      expect(prisma.user.findMany).toHaveBeenCalledWith({
        where: {
          id: { not: userId },
          isActive: true,
          age: { gte: 25, lte: 35 },
          denomination: { in: ['BAPTIST', 'PENTECOSTAL'] },
        },
        select: expect.objectContaining({
          id: true,
          name: true,
          age: true,
          location: true,
        }),
        take: 20,
      });
      expect(result).toEqual(mockUsers);
    });

    it('should filter online users only', async () => {
      const userId = 'user-id';
      const filters = { onlineOnly: true };

      mockPrismaService.user.findMany.mockResolvedValue([]);

      await service.getNearbyUsers(userId, filters);

      const expectedWhere = expect.objectContaining({
        id: { not: userId },
        isActive: true,
        lastSeen: { gte: expect.any(Date) },
      });

      expect(prisma.user.findMany).toHaveBeenCalledWith({
        where: expectedWhere,
        select: expect.any(Object),
        take: 20,
      });
    });
  });

  describe('getUsersBySharedVerse', () => {
    it('should get users who share the same verse', async () => {
      const userId = 'user-id';
      const verse = 'Jeremiah 29:11';

      const mockUsers = [
        {
          id: 'user-1',
          name: 'User 1',
          favoriteVerses: [{ reference: 'Jeremiah 29:11' }],
        },
      ];

      mockPrismaService.user.findMany.mockResolvedValue(mockUsers);

      const result = await service.getUsersBySharedVerse(userId, verse);

      expect(prisma.user.findMany).toHaveBeenCalledWith({
        where: {
          id: { not: userId },
          isActive: true,
          favoriteVerses: {
            some: {
              reference: { contains: verse, mode: 'insensitive' }
            }
          }
        },
        select: expect.objectContaining({
          favoriteVerses: {
            where: {
              reference: { contains: verse, mode: 'insensitive' }
            }
          }
        }),
        take: 20,
      });
      expect(result).toEqual(mockUsers);
    });
  });

  describe('getDiscoverStats', () => {
    it('should return discover statistics', async () => {
      const userId = 'user-id';
      const mockUser = {
        location: 'Lagos, Nigeria',
        denomination: 'BAPTIST',
      };

      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockPrismaService.user.count
        .mockResolvedValueOnce(12) // nearby
        .mockResolvedValueOnce(8)  // active
        .mockResolvedValueOnce(5)  // same verse
        .mockResolvedValueOnce(15) // worship lovers
        .mockResolvedValueOnce(3); // online

      const result = await service.getDiscoverStats(userId);

      expect(result).toEqual({
        nearbyChristians: 12,
        activeToday: 8,
        sharedVerses: 5,
        worshipLovers: 15,
        onlineNow: 3,
        sundayAdventures: expect.any(Number),
        justJoined: expect.any(Number),
      });
    });

    it('should throw error if user not found', async () => {
      const userId = 'invalid-user-id';

      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.getDiscoverStats(userId)).rejects.toThrow('User not found');
    });
  });

  describe('getDailyChallenge', () => {
    it('should return active user challenge', async () => {
      const userId = 'user-id';
      const mockChallenges = [
        {
          progress: 2,
          isCompleted: false,
          challenge: {
            title: 'Daily Verse Challenge',
            description: 'Share a verse daily',
            duration: 7,
            reward: 'Scripture Scholar Badge',
          },
        },
      ];

      mockPrismaService.challengeParticipant.findMany.mockResolvedValue(mockChallenges);

      const result = await service.getDailyChallenge(userId);

      expect(result).toEqual({
        title: 'Daily Verse Challenge',
        description: 'Share a verse daily',
        progress: '2/7',
        reward: 'Scripture Scholar Badge',
        isCompleted: false,
      });
    });

    it('should return default challenge when no active challenges', async () => {
      const userId = 'user-id';

      mockPrismaService.challengeParticipant.findMany.mockResolvedValue([]);

      const result = await service.getDailyChallenge(userId);

      expect(result).toEqual({
        title: "Today's Challenge",
        description: "Send your favorite verse to 3 new people",
        progress: "0/3 completed",
        reward: "Unlock 'Verse Champion' badge",
        isCompleted: false,
      });
    });
  });
});