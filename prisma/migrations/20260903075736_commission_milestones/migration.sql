-- CreateEnum
CREATE TYPE "CommissionTranche" AS ENUM ('T1', 'T2', 'T3');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "CommissionStatus" ADD VALUE 'AWAITING_APPROVAL';
ALTER TYPE "CommissionStatus" ADD VALUE 'HOLD';
ALTER TYPE "CommissionStatus" ADD VALUE 'FROZEN';

-- AlterTable
ALTER TABLE "commissions" ADD COLUMN     "hold_reason" TEXT,
ADD COLUMN     "instalment_confirmed_at" TIMESTAMP(3),
ADD COLUMN     "percentage" INTEGER NOT NULL DEFAULT 80,
ADD COLUMN     "tranche" "CommissionTranche" NOT NULL DEFAULT 'T1';

-- CreateTable
CREATE TABLE "sale_milestone_checklists" (
    "id" TEXT NOT NULL,
    "sale_id" TEXT NOT NULL,
    "deposit_confirmed_at" TIMESTAMP(3),
    "spa_signed_by_client_at" TIMESTAMP(3),
    "spa_signed_by_devtraco_at" TIMESTAMP(3),
    "unit_allocated_at" TIMESTAMP(3),
    "management_approved_at" TIMESTAMP(3),
    "management_approved_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sale_milestone_checklists_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "sale_milestone_checklists_sale_id_key" ON "sale_milestone_checklists"("sale_id");

-- CreateIndex
CREATE UNIQUE INDEX "commissions_sale_id_tranche_key" ON "commissions"("sale_id", "tranche");

-- AddForeignKey
ALTER TABLE "sale_milestone_checklists" ADD CONSTRAINT "sale_milestone_checklists_sale_id_fkey" FOREIGN KEY ("sale_id") REFERENCES "sales"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sale_milestone_checklists" ADD CONSTRAINT "sale_milestone_checklists_management_approved_by_fkey" FOREIGN KEY ("management_approved_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

