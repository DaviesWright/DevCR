-- AlterEnum
ALTER TYPE "LeadStatus" ADD VALUE 'REAL_OPPORTUNITY';

-- AlterTable
ALTER TABLE "leads" ADD COLUMN     "real_opportunity_at" TIMESTAMP(3),
ADD COLUMN     "suspected_persona" TEXT,
ADD COLUMN     "suspected_persona_note" TEXT;
