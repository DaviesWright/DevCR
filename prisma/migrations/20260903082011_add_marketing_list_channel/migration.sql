-- CreateEnum
CREATE TYPE "MarketingListChannel" AS ENUM ('EMAIL', 'SMS', 'WHATSAPP', 'CALL');

-- AlterTable
ALTER TABLE "marketing_segments" ADD COLUMN     "channel" "MarketingListChannel";

