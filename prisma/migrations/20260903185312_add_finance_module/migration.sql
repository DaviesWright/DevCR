-- CreateEnum
CREATE TYPE "PaymentMilestoneType" AS ENUM ('RESERVATION', 'SPA_EXECUTION', 'CONSTRUCTION', 'HANDOVER');

-- CreateEnum
CREATE TYPE "BcSyncStatus" AS ENUM ('PENDING', 'SYNCED', 'FAILED');

-- AlterTable
ALTER TABLE "payment_schedules" ADD COLUMN     "construction_stage_id" TEXT,
ADD COLUMN     "milestone_label" TEXT,
ADD COLUMN     "milestone_type" "PaymentMilestoneType";

-- AlterTable
ALTER TABLE "payments" ADD COLUMN     "notes" TEXT;

-- CreateTable
CREATE TABLE "bc_mirror_transactions" (
    "id" TEXT NOT NULL,
    "payment_id" TEXT NOT NULL,
    "customer_id" TEXT NOT NULL,
    "sale_id" TEXT,
    "transaction_type" TEXT NOT NULL,
    "amount" DECIMAL(14,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "transaction_date" TIMESTAMP(3) NOT NULL,
    "bc_journal_id" TEXT,
    "bc_posted_at" TIMESTAMP(3),
    "status" "BcSyncStatus" NOT NULL DEFAULT 'PENDING',
    "sync_error" TEXT,
    "retry_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bc_mirror_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bc_mirror_customers" (
    "id" TEXT NOT NULL,
    "customer_id" TEXT NOT NULL,
    "bc_customer_no" TEXT,
    "status" "BcSyncStatus" NOT NULL DEFAULT 'PENDING',
    "last_synced_at" TIMESTAMP(3),
    "sync_error" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bc_mirror_customers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bc_mirror_receipts" (
    "id" TEXT NOT NULL,
    "receipt_id" TEXT NOT NULL,
    "bc_receipt_id" TEXT,
    "status" "BcSyncStatus" NOT NULL DEFAULT 'PENDING',
    "synced_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bc_mirror_receipts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "bc_mirror_transactions_payment_id_key" ON "bc_mirror_transactions"("payment_id");

-- CreateIndex
CREATE INDEX "bc_mirror_transactions_status_idx" ON "bc_mirror_transactions"("status");

-- CreateIndex
CREATE INDEX "bc_mirror_transactions_customer_id_idx" ON "bc_mirror_transactions"("customer_id");

-- CreateIndex
CREATE INDEX "bc_mirror_transactions_sale_id_idx" ON "bc_mirror_transactions"("sale_id");

-- CreateIndex
CREATE UNIQUE INDEX "bc_mirror_customers_customer_id_key" ON "bc_mirror_customers"("customer_id");

-- CreateIndex
CREATE INDEX "bc_mirror_customers_status_idx" ON "bc_mirror_customers"("status");

-- CreateIndex
CREATE UNIQUE INDEX "bc_mirror_receipts_receipt_id_key" ON "bc_mirror_receipts"("receipt_id");

-- CreateIndex
CREATE INDEX "bc_mirror_receipts_status_idx" ON "bc_mirror_receipts"("status");

-- CreateIndex
CREATE INDEX "payment_schedules_construction_stage_id_idx" ON "payment_schedules"("construction_stage_id");

-- AddForeignKey
ALTER TABLE "payment_schedules" ADD CONSTRAINT "payment_schedules_construction_stage_id_fkey" FOREIGN KEY ("construction_stage_id") REFERENCES "construction_stages"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bc_mirror_transactions" ADD CONSTRAINT "bc_mirror_transactions_payment_id_fkey" FOREIGN KEY ("payment_id") REFERENCES "payments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bc_mirror_transactions" ADD CONSTRAINT "bc_mirror_transactions_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bc_mirror_transactions" ADD CONSTRAINT "bc_mirror_transactions_sale_id_fkey" FOREIGN KEY ("sale_id") REFERENCES "sales"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bc_mirror_customers" ADD CONSTRAINT "bc_mirror_customers_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bc_mirror_receipts" ADD CONSTRAINT "bc_mirror_receipts_receipt_id_fkey" FOREIGN KEY ("receipt_id") REFERENCES "receipts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

