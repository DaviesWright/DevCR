-- CreateEnum
CREATE TYPE "LeadLostReason" AS ENUM ('NO_BUDGET', 'WRONG_TIMING', 'NOT_INTERESTED', 'UNRESPONSIVE', 'CHOSE_COMPETITOR', 'WRONG_FIT', 'DUPLICATE', 'OTHER');

-- AlterTable
ALTER TABLE "leads" ADD COLUMN     "disqualified_at" TIMESTAMP(3),
ADD COLUMN     "lost_reason" "LeadLostReason",
ADD COLUMN     "lost_reason_note" TEXT;
