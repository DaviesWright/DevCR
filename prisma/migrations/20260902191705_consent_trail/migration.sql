-- AlterTable
ALTER TABLE "customer_preferences" ADD COLUMN     "marketing_consent_at" TIMESTAMP(3),
ADD COLUMN     "marketing_consent_source" TEXT;
