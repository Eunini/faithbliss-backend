-- Migration script to add missing user preferences for existing users
-- Run this directly on your production database

-- First, let's see how many users don't have preferences
SELECT COUNT(*) as users_without_preferences
FROM users u
LEFT JOIN user_preferences up ON u.id = up."userId"
WHERE up."userId" IS NULL;

-- Insert default preferences for users who don't have them
INSERT INTO user_preferences ("id", "userId", "preferredGender", "preferredDenomination", "minAge", "maxAge", "maxDistance", "createdAt", "updatedAt")
SELECT
    gen_random_uuid(),
    u.id,
    CASE WHEN u.gender = 'MALE' THEN 'FEMALE' ELSE 'MALE' END,
    CASE
        WHEN u.denomination = 'BAPTIST' THEN '{BAPTIST,METHODIST,PENTECOSTAL}'
        WHEN u.denomination = 'METHODIST' THEN '{BAPTIST,METHODIST,PRESBYTERIAN}'
        WHEN u.denomination = 'PENTECOSTAL' THEN '{PENTECOSTAL,ASSEMBLIES_OF_GOD,BAPTIST}'
        WHEN u.denomination = 'CATHOLIC' THEN '{CATHOLIC,ORTHODOX}'
        ELSE '{BAPTIST,METHODIST,PENTECOSTAL}'
    END,
    GREATEST(18, COALESCE(u.age, 25) - 7),
    COALESCE(u.age, 25) + 10,
    50,
    NOW(),
    NOW()
FROM users u
LEFT JOIN user_preferences up ON u.id = up."userId"
WHERE up."userId" IS NULL;

-- Verify the migration worked
SELECT COUNT(*) as total_users from users;
SELECT COUNT(*) as users_with_preferences from user_preferences;
SELECT COUNT(*) as users_without_preferences
FROM users u
LEFT JOIN user_preferences up ON u.id = up."userId"
WHERE up."userId" IS NULL;