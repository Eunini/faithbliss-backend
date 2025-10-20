/*
  Warnings:

  - The `preferredRelationshipGoals` column on the `user_preferences` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `lookingFor` column on the `users` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Changed the type of `preferredDenomination` on the `user_preferences` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "user_preferences" DROP COLUMN "preferredDenomination",
ADD COLUMN     "preferredDenomination" TEXT NOT NULL,
ALTER COLUMN "preferredFaithJourney" DROP NOT NULL,
ALTER COLUMN "preferredFaithJourney" DROP DEFAULT,
ALTER COLUMN "preferredFaithJourney" SET DATA TYPE TEXT,
ALTER COLUMN "preferredChurchAttendance" DROP NOT NULL,
ALTER COLUMN "preferredChurchAttendance" DROP DEFAULT,
ALTER COLUMN "preferredChurchAttendance" SET DATA TYPE TEXT,
DROP COLUMN "preferredRelationshipGoals",
ADD COLUMN     "preferredRelationshipGoals" JSONB DEFAULT '[]';

-- AlterTable
ALTER TABLE "users" DROP COLUMN "lookingFor",
ADD COLUMN     "lookingFor" TEXT[] DEFAULT ARRAY[]::TEXT[];
