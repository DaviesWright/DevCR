-- CreateEnum
CREATE TYPE "ReferralRewardStatus" AS ENUM ('NONE', 'PENDING', 'REWARDED');

-- AlterTable
ALTER TABLE "complaints" ADD COLUMN     "pause_reason" TEXT,
ADD COLUMN     "paused_at" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "leads" ADD COLUMN     "referral_reward_status" "ReferralRewardStatus" NOT NULL DEFAULT 'NONE',
ADD COLUMN     "referred_by_customer_id" TEXT;

-- AddForeignKey
ALTER TABLE "leads" ADD CONSTRAINT "leads_referred_by_customer_id_fkey" FOREIGN KEY ("referred_by_customer_id") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

