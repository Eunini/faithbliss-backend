import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function migrateUserPreferences() {
  console.log('🔄 Starting user preferences migration...');

  try {
    // Find all users who don't have preferences
    const usersWithoutPreferences = await prisma.user.findMany({
      where: {
        preferences: null,
      },
      select: {
        id: true,
        email: true,
        name: true,
        gender: true,
        age: true,
        denomination: true,
        googleId: true,
      },
    });

    console.log(`📊 Found ${usersWithoutPreferences.length} users without preferences`);

    if (usersWithoutPreferences.length === 0) {
      console.log('✅ No users need preferences migration');
      return;
    }

    // Create preferences for each user
    const migrationPromises = usersWithoutPreferences.map(async (user) => {
      console.log(`🔧 Creating preferences for user: ${user.email} (${user.name})`);

      // Determine default preferred gender based on user's gender
      const preferredGender = user.gender === 'MALE' ? 'FEMALE' : 'MALE';

      // Set default denomination preferences based on user's denomination
      let preferredDenominations: string[] = [];
      if (user.denomination) {
        // Include the user's own denomination and some common ones
        preferredDenominations = [user.denomination];
        if (user.denomination === 'BAPTIST') {
          preferredDenominations.push('METHODIST', 'PENTECOSTAL');
        } else if (user.denomination === 'METHODIST') {
          preferredDenominations.push('BAPTIST', 'PRESBYTERIAN');
        } else if (user.denomination === 'PENTECOSTAL') {
          preferredDenominations.push('ASSEMBLIES_OF_GOD', 'BAPTIST');
        } else if (user.denomination === 'CATHOLIC') {
          preferredDenominations.push('ORTHODOX');
        } else {
          // For other denominations, include common ones
          preferredDenominations.push('BAPTIST', 'METHODIST', 'PENTECOSTAL');
        }
      } else {
        // Default denominations if user has no denomination set
        preferredDenominations = ['BAPTIST', 'METHODIST', 'PENTECOSTAL'];
      }

      // Calculate age range based on user's age
      const minAge = Math.max(18, (user.age || 25) - 7);
      const maxAge = (user.age || 25) + 10;

      return prisma.userPreferences.create({
        data: {
          userId: user.id,
          preferredGender,
          preferredDenomination: preferredDenominations as any, // Cast to match Prisma enum type
          minAge,
          maxAge,
          maxDistance: 50, // Default 50km radius
        },
      });
    });

    // Execute all preference creations
    await Promise.all(migrationPromises);

    console.log(`✅ Successfully created preferences for ${usersWithoutPreferences.length} users`);

    // Log summary
    const googleUsers = usersWithoutPreferences.filter(u => u.googleId);
    const regularUsers = usersWithoutPreferences.filter(u => !u.googleId);

    console.log(`📈 Migration Summary:`);
    console.log(`   - Google OAuth users: ${googleUsers.length}`);
    console.log(`   - Regular users: ${regularUsers.length}`);
    console.log(`   - Total users updated: ${usersWithoutPreferences.length}`);

  } catch (error) {
    console.error('❌ Error during preferences migration:', error);
    throw error;
  }
}

// Run the migration
migrateUserPreferences()
  .catch((e) => {
    console.error('❌ Migration failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    console.log('🔚 Migration script completed');
  });