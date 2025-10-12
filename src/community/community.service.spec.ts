import { Test, TestingModule } from '@nestjs/testing';
import { CommunityService } from './community.service';
import { PrismaService } from '../prisma/prisma.service';

const mockPrismaService = {
  communityPost: {
    create: jest.fn(),
    findMany: jest.fn(),
  },
  postLike: {
    create: jest.fn(),
    delete: jest.fn(),
  },
  postComment: {
    create: jest.fn(),
  },
  event: {
    create: jest.fn(),
    findMany: jest.fn(),
  },
  eventAttendee: {
    create: jest.fn(),
    delete: jest.fn(),
  },
  prayerRequest: {
    create: jest.fn(),
    findMany: jest.fn(),
  },
  prayer: {
    create: jest.fn(),
  },
  blessWallEntry: {
    create: jest.fn(),
    findMany: jest.fn(),
  },
  user: {
    findMany: jest.fn(),
  },
};

describe('CommunityService', () => {
  let service: CommunityService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CommunityService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<CommunityService>(CommunityService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createPost', () => {
    it('should create a community post', async () => {
      const userId = 'user-id';
      const createPostDto = {
        content: 'Test post content',
        type: 'POST' as any,
        verse: 'John 3:16',
      };

      const mockPost = {
        id: 'post-id',
        userId,
        content: createPostDto.content,
        type: createPostDto.type,
        verse: createPostDto.verse,
        user: { id: userId, name: 'Test User', profilePhotoUrl: null, isVerified: false },
        likes: [],
        comments: [],
        _count: { likes: 0, comments: 0 },
      };

      mockPrismaService.communityPost.create.mockResolvedValue(mockPost);

      const result = await service.createPost(userId, createPostDto);

      expect(prisma.communityPost.create).toHaveBeenCalledWith({
        data: {
          userId,
          content: createPostDto.content,
          type: createPostDto.type,
          verse: createPostDto.verse,
        },
        include: expect.objectContaining({
          user: expect.any(Object),
          likes: expect.any(Object),
          comments: expect.any(Object),
          _count: expect.any(Object),
        }),
      });
      expect(result).toEqual(mockPost);
    });
  });

  describe('likePost', () => {
    it('should like a post', async () => {
      const userId = 'user-id';
      const postId = 'post-id';
      const mockLike = { id: 'like-id', userId, postId };

      mockPrismaService.postLike.create.mockResolvedValue(mockLike);

      const result = await service.likePost(userId, postId);

      expect(prisma.postLike.create).toHaveBeenCalledWith({
        data: { userId, postId },
      });
      expect(result).toEqual(mockLike);
    });

    it('should throw error when post already liked', async () => {
      const userId = 'user-id';
      const postId = 'post-id';

      mockPrismaService.postLike.create.mockRejectedValue(new Error('Unique constraint failed'));

      await expect(service.likePost(userId, postId)).rejects.toThrow('Post already liked');
    });
  });

  describe('createEvent', () => {
    it('should create an event', async () => {
      const hostId = 'host-id';
      const createEventDto = {
        title: 'Bible Study',
        description: 'Weekly Bible study',
        type: 'BIBLE_STUDY',
        date: '2024-01-15',
        time: '7:00 PM',
        location: 'Church Hall',
        isVirtual: false,
        maxAttendees: 20,
      };

      const mockEvent = {
        id: 'event-id',
        ...createEventDto,
        hostId,
        date: new Date(createEventDto.date),
        host: { id: hostId, name: 'Host User', profilePhotoUrl: null },
        attendees: [],
        _count: { attendees: 0 },
      };

      mockPrismaService.event.create.mockResolvedValue(mockEvent);

      const result = await service.createEvent(hostId, createEventDto);

      expect(prisma.event.create).toHaveBeenCalledWith({
        data: {
          title: createEventDto.title,
          description: createEventDto.description,
          type: createEventDto.type,
          hostId,
          date: new Date(createEventDto.date),
          time: createEventDto.time,
          location: createEventDto.location,
          isVirtual: createEventDto.isVirtual,
          maxAttendees: createEventDto.maxAttendees,
        },
        include: expect.objectContaining({
          host: expect.any(Object),
          attendees: expect.any(Object),
          _count: expect.any(Object),
        }),
      });
      expect(result).toEqual(mockEvent);
    });
  });

  describe('createPrayerRequest', () => {
    it('should create a prayer request', async () => {
      const userId = 'user-id';
      const createPrayerRequestDto = {
        content: 'Please pray for my job interview',
        isAnonymous: false,
      };

      const mockPrayerRequest = {
        id: 'prayer-id',
        userId,
        content: createPrayerRequestDto.content,
        isAnonymous: false,
        user: { id: userId, name: 'Test User', profilePhotoUrl: null },
        prayers: [],
        _count: { prayers: 0 },
      };

      mockPrismaService.prayerRequest.create.mockResolvedValue(mockPrayerRequest);

      const result = await service.createPrayerRequest(userId, createPrayerRequestDto);

      expect(prisma.prayerRequest.create).toHaveBeenCalledWith({
        data: {
          userId,
          content: createPrayerRequestDto.content,
          isAnonymous: false,
        },
        include: expect.objectContaining({
          user: expect.any(Object),
          prayers: expect.any(Object),
          _count: expect.any(Object),
        }),
      });
      expect(result).toEqual(mockPrayerRequest);
    });

    it('should create anonymous prayer request', async () => {
      const userId = 'user-id';
      const createPrayerRequestDto = {
        content: 'Anonymous prayer request',
        isAnonymous: true,
      };

      const mockPrayerRequest = {
        id: 'prayer-id',
        userId: null,
        content: createPrayerRequestDto.content,
        isAnonymous: true,
        prayers: [],
        _count: { prayers: 0 },
      };

      mockPrismaService.prayerRequest.create.mockResolvedValue(mockPrayerRequest);

      const result = await service.createPrayerRequest(userId, createPrayerRequestDto);

      expect(prisma.prayerRequest.create).toHaveBeenCalledWith({
        data: {
          userId: null,
          content: createPrayerRequestDto.content,
          isAnonymous: true,
        },
        include: expect.objectContaining({
          user: false,
          prayers: expect.any(Object),
          _count: expect.any(Object),
        }),
      });
      expect(result).toEqual(mockPrayerRequest);
    });
  });

  describe('getCommunityHighlights', () => {
    it('should return community highlights', async () => {
      const mockUsers = [
        {
          id: 'user-1',
          name: 'User 1',
          profilePhotoUrl: null,
          _count: { prayers: 5 },
        },
        {
          id: 'user-2',
          name: 'User 2',
          profilePhotoUrl: null,
          _count: { posts: 3 },
        },
      ];

      mockPrismaService.user.findMany
        .mockResolvedValueOnce(mockUsers) // prayerChampions
        .mockResolvedValueOnce(mockUsers) // verseSharers
        .mockResolvedValueOnce(mockUsers); // mostEncouraging

      const result = await service.getCommunityHighlights();

      expect(result).toHaveProperty('prayerChampions');
      expect(result).toHaveProperty('verseSharers');
      expect(result).toHaveProperty('mostEncouraging');
      expect(result.prayerChampions).toHaveLength(2);
    });
  });
});