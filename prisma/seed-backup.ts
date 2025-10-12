import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

enum Gender {
  MALE = 'MALE',
  FEMALE = 'FEMALE',
}

enum Denomination {
  BAPTIST = 'BAPTIST',
  METHODIST = 'METHODIST',
  PRESBYTERIAN = 'PRESBYTERIAN',
  PENTECOSTAL = 'PENTECOSTAL',
  CATHOLIC = 'CATHOLIC',
  ORTHODOX = 'ORTHODOX',
  ANGLICAN = 'ANGLICAN',
  LUTHERAN = 'LUTHERAN',
  ASSEMBLIES_OF_GOD = 'ASSEMBLIES_OF_GOD',
  SEVENTH_DAY_ADVENTIST = 'SEVENTH_DAY_ADVENTIST',
  OTHER = 'OTHER',
}

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Clear existing data (only models that exist in schema)
  await prisma.message.deleteMany();
  await prisma.match.deleteMany();
  await prisma.userLike.deleteMany();
  await prisma.userPreferences.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.user.deleteMany();

  // Hash password for test users
  const hashedPassword = await bcrypt.hash('password123', 10);

  // Create test users
  const users = await Promise.all([
    prisma.user.create({
      data: {
        email: 'john@faithbliss.com',
        passwordHash: hashedPassword,
        name: 'John Emmanuel',
        gender: Gender.MALE,
        denomination: Denomination.BAPTIST,
        age: 28,
        location: 'Lagos, Nigeria',
        bio: 'Passionate about serving God and looking for a faithful partner to share life\'s journey.',
        profilePhotoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400',
        isVerified: true,
        preferences: {
          create: {
            preferredGender: Gender.FEMALE,
            preferredDenomination: [Denomination.BAPTIST, Denomination.PENTECOSTAL],
            minAge: 22,
            maxAge: 35,
            maxDistance: 100,
          },
        },
      },
    }),
    prisma.user.create({
      data: {
        email: 'sarah@faithbliss.com',
        passwordHash: hashedPassword,
        name: 'Sarah Grace',
        gender: Gender.FEMALE,
        denomination: Denomination.PENTECOSTAL,
        age: 25,
        location: 'Abuja, Nigeria',
        bio: 'Christ-centered woman seeking a godly man for marriage and ministry together.',
        profilePhotoUrl: 'https://images.unsplash.com/photo-1494790108755-2616b612b647?w=400',
        isVerified: true,
        preferences: {
          create: {
            preferredGender: Gender.MALE,
            preferredDenomination: [Denomination.BAPTIST, Denomination.PENTECOSTAL, Denomination.METHODIST],
            minAge: 25,
            maxAge: 40,
            maxDistance: 150,
          },
        },
      },
    }),
    prisma.user.create({
      data: {
        email: 'david@faithbliss.com',
        passwordHash: hashedPassword,
        name: 'David Michael',
        gender: Gender.MALE,
        denomination: Denomination.METHODIST,
        age: 32,
        location: 'Port Harcourt, Nigeria',
        bio: 'Youth pastor and engineer. Believing God for a wife who shares my passion for ministry.',
        profilePhotoUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400',
        isVerified: true,
        preferences: {
          create: {
            preferredGender: Gender.FEMALE,
            preferredDenomination: [Denomination.METHODIST, Denomination.PRESBYTERIAN, Denomination.BAPTIST],
            minAge: 23,
            maxAge: 30,
            maxDistance: 200,
          },
        },
      },
    }),
    prisma.user.create({
      data: {
        email: 'grace@faithbliss.com',
        passwordHash: hashedPassword,
        name: 'Grace Adebayo',
        gender: Gender.FEMALE,
        denomination: Denomination.BAPTIST,
        age: 27,
        location: 'Ibadan, Nigeria',
        bio: 'Teacher and worship leader. Looking for a man after God\'s own heart.',
        profilePhotoUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400',
        isVerified: true,
        preferences: {
          create: {
            preferredGender: Gender.MALE,
            preferredDenomination: [Denomination.BAPTIST, Denomination.PENTECOSTAL],
            minAge: 26,
            maxAge: 38,
            maxDistance: 100,
          },
        },
      },
    }),
    prisma.user.create({
      data: {
        email: 'daniel@faithbliss.com',
        passwordHash: hashedPassword,
        name: 'Daniel Okonkwo',
        gender: Gender.MALE,
        denomination: Denomination.ASSEMBLIES_OF_GOD,
        age: 29,
        location: 'Lagos, Nigeria',
        bio: 'Business owner and church elder. Seeking a virtuous woman to build a Christ-centered home.',
        profilePhotoUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400',
        isVerified: true,
        preferences: {
          create: {
            preferredGender: Gender.FEMALE,
            preferredDenomination: [Denomination.ASSEMBLIES_OF_GOD, Denomination.PENTECOSTAL],
            minAge: 22,
            maxAge: 32,
            maxDistance: 50,
          },
        },
      },
    }),
    prisma.user.create({
      data: {
        email: 'mary@faithbliss.com',
        passwordHash: hashedPassword,
        name: 'Mary Blessing',
        gender: Gender.FEMALE,
        denomination: Denomination.PRESBYTERIAN,
        age: 24,
        location: 'Enugu, Nigeria',
        bio: 'Medical student and choir member. Trusting God for His perfect timing in love.',
        profilePhotoUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400',
        isVerified: true,
        preferences: {
          create: {
            preferredGender: Gender.MALE,
            preferredDenomination: [Denomination.PRESBYTERIAN, Denomination.METHODIST, Denomination.BAPTIST],
            minAge: 25,
            maxAge: 35,
            maxDistance: 120,
          },
        },
      },
    }),
  ]);

  console.log('👥 Created users:', users.map(u => u.name).join(', '));

  // Create some likes
  await prisma.userLike.create({
    data: {
      userId: users[0].id, // John likes Sarah
      likedUserId: users[1].id,
    },
  });

  await prisma.userLike.create({
    data: {
      userId: users[1].id, // Sarah likes John (creates a match)
      likedUserId: users[0].id,
    },
  });

  await prisma.userLike.create({
    data: {
      userId: users[2].id, // David likes Grace
      likedUserId: users[3].id,
    },
  });

  // Create matches (when both users like each other)
  const match1 = await prisma.match.create({
    data: {
      user1Id: users[0].id, // John and Sarah
      user2Id: users[1].id,
    },
  });

  console.log('💕 Created matches');

  // Create sample messages
  await Promise.all([
    prisma.message.create({
      data: {
        matchId: match1.id,
        senderId: users[0].id,
        receiverId: users[1].id,
        content: 'Hi Sarah! I noticed we have a lot in common. How are you doing?',
      },
    }),
    prisma.message.create({
      data: {
        matchId: match1.id,
        senderId: users[1].id,
        receiverId: users[0].id,
        content: 'Hello John! I\'m doing well, thank you. I love your profile - it\'s wonderful to meet a fellow believer!',
        isRead: true,
      },
    }),
    prisma.message.create({
      data: {
        matchId: match1.id,
        senderId: users[0].id,
        receiverId: users[1].id,
        content: 'Thank you! I\'d love to get to know you better. What\'s your favorite Bible verse?',
      },
    }),
  ]);

  console.log('💬 Created sample messages');

  console.log('✨ Basic user data created');
  
  // Create some test likes and matches
  await prisma.userLike.create({
    data: {
      userId: users[0].id,
      likedUserId: users[1].id,
    },
  });

  await prisma.userLike.create({
    data: {
      userId: users[1].id,
      likedUserId: users[0].id,
    },
  });

  // Create a match (mutual like)
  await prisma.match.create({
    data: {
      user1Id: users[0].id,
      user2Id: users[1].id,
      status: 'MATCHED',
    },
  });

  // Create test messages
  await prisma.message.create({
    data: {
      senderId: users[0].id,
      receiverId: users[1].id,
      content: 'Hey Grace! Great to match with you. How are you doing?',
      matchId: (await prisma.match.findFirst())?.id || '',
    },
  });

  console.log('💕 Created test matches and messages');

  console.log('� Database seeding completed successfully!');
  console.log(`✅ Created ${users.length} users`);
  console.log('✅ Created test matches and messages');
  console.log('✅ Ready for development and testing');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
    }),
    prisma.postLike.create({
      data: { userId: users[0].id, postId: posts[1].id },
    }),
  ]);

  console.log('❤️ Created post likes');

  // Create events
  const events = await Promise.all([
    prisma.event.create({
      data: {
        title: 'Virtual Bible Study: Romans',
        description: 'Deep dive into Paul\'s letter to the Romans. Join us for an enriching study of one of the most foundational books in the New Testament.',
        type: 'BIBLE_STUDY',
        hostId: users[0].id,
        date: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
        time: '7:00 PM',
        location: 'Online',
        isVirtual: true,
      },
    }),
    prisma.event.create({
      data: {
        title: 'Morning Prayer Circle',
        description: 'Start your day with prayer and fellowship. All are welcome to join this peaceful morning gathering.',
        type: 'PRAYER_MEETING',
        hostId: users[1].id,
        date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // Day after tomorrow
        time: '6:00 AM',
        location: 'Faith Community Center, Victoria Island',
        isVirtual: false,
      },
    }),
    prisma.event.create({
      data: {
        title: 'Youth Fellowship & Games Night',
        description: 'Fun fellowship evening with board games, worship, and great food. Perfect for building community!',
        type: 'FELLOWSHIP',
        hostId: users[2].id,
        date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
        time: '6:30 PM',
        location: 'Grace Church Youth Center, Lekki',
        isVirtual: false,
      },
    }),
  ]);

  console.log('📅 Created community events');

  // Create event attendees
  await Promise.all([
    prisma.eventAttendee.create({
      data: { eventId: events[0].id, userId: users[1].id },
    }),
    prisma.eventAttendee.create({
      data: { eventId: events[0].id, userId: users[2].id },
    }),
    prisma.eventAttendee.create({
      data: { eventId: events[1].id, userId: users[0].id },
    }),
    prisma.eventAttendee.create({
      data: { eventId: events[1].id, userId: users[3].id },
    }),
    prisma.eventAttendee.create({
      data: { eventId: events[2].id, userId: users[0].id },
    }),
  ]);

  console.log('🎫 Created event attendees');

  // Create prayer requests
  const prayerRequests = await Promise.all([
    prisma.prayerRequest.create({
      data: {
        userId: null, // Anonymous
        content: 'Please pray for my job interview next week. I really need God\'s favor and peace during this time. Thank you for your prayers.',
        isAnonymous: true,
      },
    }),
    prisma.prayerRequest.create({
      data: {
        userId: users[3].id,
        content: 'My grandmother is in the hospital recovering from surgery. Praying for healing and comfort for our family during this difficult time.',
        isAnonymous: false,
      },
    }),
    prisma.prayerRequest.create({
      data: {
        userId: users[1].id,
        content: 'Asking for wisdom and guidance as I consider a mission trip opportunity. Praying for clarity on God\'s will.',
        isAnonymous: false,
      },
    }),
  ]);

  console.log('🙏 Created prayer requests');

  // Create prayers for requests
  await Promise.all([
    prisma.prayer.create({
      data: { userId: users[0].id, prayerRequestId: prayerRequests[0].id },
    }),
    prisma.prayer.create({
      data: { userId: users[1].id, prayerRequestId: prayerRequests[0].id },
    }),
    prisma.prayer.create({
      data: { userId: users[2].id, prayerRequestId: prayerRequests[1].id },
    }),
    prisma.prayer.create({
      data: { userId: users[0].id, prayerRequestId: prayerRequests[2].id },
    }),
  ]);

  console.log('🤲 Created prayers');

  // Create challenges
  const challenges = await Promise.all([
    prisma.challenge.create({
      data: {
        title: 'Daily Verse Challenge',
        description: 'Share a meaningful Bible verse for 7 days straight and reflect on its impact in your life.',
        type: 'DAILY_VERSE',
        duration: 7,
        reward: 'Scripture Scholar Badge',
      },
    }),
    prisma.challenge.create({
      data: {
        title: 'Acts of Kindness Week',
        description: 'Perform 5 acts of kindness this week and share your experiences with the community.',
        type: 'ACTS_OF_KINDNESS',
        duration: 7,
        reward: 'Servant Heart Badge',
      },
    }),
    prisma.challenge.create({
      data: {
        title: '21-Day Prayer Journey',
        description: 'Commit to daily prayer for 21 days and track your spiritual growth.',
        type: 'PRAYER_CHALLENGE',
        duration: 21,
        reward: 'Prayer Warrior Badge',
      },
    }),
  ]);

  console.log('🏆 Created challenges');

  // Create challenge participants
  await Promise.all([
    prisma.challengeParticipant.create({
      data: {
        challengeId: challenges[0].id,
        userId: users[0].id,
        progress: 4,
      },
    }),
    prisma.challengeParticipant.create({
      data: {
        challengeId: challenges[1].id,
        userId: users[1].id,
        progress: 2,
      },
    }),
    prisma.challengeParticipant.create({
      data: {
        challengeId: challenges[2].id,
        userId: users[2].id,
        progress: 8,
      },
    }),
  ]);

  console.log('🎯 Created challenge participants');

  // Create bless wall entries
  await Promise.all([
    prisma.blessWallEntry.create({
      data: {
        fromUserId: users[0].id,
        toUserId: users[1].id,
        message: 'God has amazing plans for your life! Keep trusting in His timing. 🌟',
        verse: 'Jeremiah 29:11',
      },
    }),
    prisma.blessWallEntry.create({
      data: {
        fromUserId: users[2].id,
        toUserId: users[3].id,
        message: 'Praying for your family during this time. God is with you and will never leave you! 🙏',
        verse: 'Psalm 23:4',
      },
    }),
    prisma.blessWallEntry.create({
      data: {
        fromUserId: users[1].id,
        toUserId: users[0].id,
        message: 'Your worship posts always bless my heart! Thank you for sharing your gift with the community. 💝',
        verse: 'Psalm 100:2',
      },
    }),
  ]);

  console.log('💝 Created bless wall entries');

  console.log('✅ Seeding completed successfully!');
  console.log('\n📝 Test accounts created:');
  console.log('Email: john@faithbliss.com | Password: password123');
  console.log('Email: sarah@faithbliss.com | Password: password123');
  console.log('Email: david@faithbliss.com | Password: password123');
  console.log('Email: grace@faithbliss.com | Password: password123');
  console.log('Email: daniel@faithbliss.com | Password: password123');
  console.log('Email: mary@faithbliss.com | Password: password123');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });