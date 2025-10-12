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
        bio: 'Passionate about worship music and community service. Looking for a godly woman to share life\'s journey with.',
        isVerified: true,
        preferences: {
          create: {
            preferredGender: Gender.FEMALE,
            preferredDenomination: [Denomination.BAPTIST, Denomination.METHODIST],
            minAge: 23,
            maxAge: 32,
            maxDistance: 50,
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
        denomination: Denomination.METHODIST,
        age: 25,
        location: 'Abuja, Nigeria',
        bio: 'Teacher and youth ministry volunteer. Seeking a man who puts God first in everything.',
        isVerified: true,
        preferences: {
          create: {
            preferredGender: Gender.MALE,
            preferredDenomination: [Denomination.BAPTIST, Denomination.METHODIST, Denomination.PENTECOSTAL],
            minAge: 25,
            maxAge: 35,
            maxDistance: 100,
          },
        },
      },
    }),
    prisma.user.create({
      data: {
        email: 'david@faithbliss.com',
        passwordHash: hashedPassword,
        name: 'David Okafor',
        gender: Gender.MALE,
        denomination: Denomination.PENTECOSTAL,
        age: 30,
        location: 'Port Harcourt, Nigeria',
        bio: 'Software engineer and church pianist. Love hiking and Bible study.',
        isVerified: false,
        preferences: {
          create: {
            preferredGender: Gender.FEMALE,
            preferredDenomination: [Denomination.PENTECOSTAL, Denomination.ASSEMBLIES_OF_GOD],
            minAge: 22,
            maxAge: 28,
            maxDistance: 75,
          },
        },
      },
    }),
    prisma.user.create({
      data: {
        email: 'sarah@faithbliss.com',
        passwordHash: hashedPassword,
        name: 'Sarah Nwankwo',
        gender: Gender.FEMALE,
        denomination: Denomination.CATHOLIC,
        age: 27,
        location: 'Enugu, Nigeria',
        bio: 'Nurse and prayer warrior. Looking for a man with a heart for missions.',
        isVerified: true,
        preferences: {
          create: {
            preferredGender: Gender.MALE,
            preferredDenomination: [Denomination.CATHOLIC, Denomination.ORTHODOX],
            minAge: 28,
            maxAge: 40,
            maxDistance: 200,
          },
        },
      },
    }),
    prisma.user.create({
      data: {
        email: 'samuel@faithbliss.com',
        passwordHash: hashedPassword,
        name: 'Samuel Tunde',
        gender: Gender.MALE,
        denomination: Denomination.ASSEMBLIES_OF_GOD,
        age: 32,
        location: 'Ibadan, Nigeria',
        bio: 'Business owner and small group leader. Seeking a partner in ministry.',
        isVerified: true,
        preferences: {
          create: {
            preferredGender: Gender.FEMALE,
            preferredDenomination: [Denomination.ASSEMBLIES_OF_GOD, Denomination.PENTECOSTAL],
            minAge: 24,
            maxAge: 30,
            maxDistance: 60,
          },
        },
      },
    }),
  ]);

  console.log(`✅ Created ${users.length} test users`);

  // Create some test likes
  await prisma.userLike.create({
    data: {
      userId: users[0].id, // John likes Grace
      likedUserId: users[1].id,
    },
  });

  await prisma.userLike.create({
    data: {
      userId: users[1].id, // Grace likes John (mutual like)
      likedUserId: users[0].id,
    },
  });

  await prisma.userLike.create({
    data: {
      userId: users[2].id, // David likes Sarah
      likedUserId: users[3].id,
    },
  });

  console.log('💕 Created test likes');

  // Create matches (mutual likes)
  const match = await prisma.match.create({
    data: {
      user1Id: users[0].id, // John and Grace match
      user2Id: users[1].id,
      status: 'MATCHED',
    },
  });

  console.log('🎯 Created test match');

  // Create test messages
  await Promise.all([
    prisma.message.create({
      data: {
        matchId: match.id,
        senderId: users[0].id,
        receiverId: users[1].id,
        content: 'Hey Grace! Great to match with you. How are you doing today?',
      },
    }),
    prisma.message.create({
      data: {
        matchId: match.id,
        senderId: users[1].id,
        receiverId: users[0].id,
        content: 'Hi John! I\'m doing well, thanks for asking. I loved your profile - we have so much in common! 😊',
      },
    }),
    prisma.message.create({
      data: {
        matchId: match.id,
        senderId: users[0].id,
        receiverId: users[1].id,
        content: 'That\'s wonderful! I noticed you work in youth ministry. That\'s so inspiring. What\'s your favorite part about it?',
      },
    }),
  ]);

  console.log('💬 Created test messages');
  console.log('🌱 Database seeding completed successfully!');
  console.log(`✅ Created ${users.length} users with preferences`);
  console.log('✅ Created test matches and messages');
  console.log('✅ Ready for development and testing!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });