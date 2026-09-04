-- CreateEnum
CREATE TYPE "BuyerSegment" AS ENUM ('LOCAL_RESIDENTIAL', 'DIASPORA', 'CORPORATE', 'INVESTOR');

-- AlterEnum
ALTER TYPE "LeadLostReason" ADD VALUE 'COULD_NOT_SECURE_FINANCE';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "LeadStatus" ADD VALUE 'NURTURING';
ALTER TYPE "LeadStatus" ADD VALUE 'NO_RESPONSE';

-- AlterTable
ALTER TABLE "bant_scores" ADD COLUMN     "fit_score" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "customers" ADD COLUMN     "segment" "BuyerSegment";
