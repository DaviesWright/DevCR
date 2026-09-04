-- CreateEnum
CREATE TYPE "ClientHandoverStatus" AS ENUM ('PENDING_ACK', 'ACKNOWLEDGED', 'INTRODUCED', 'WELCOMED', 'COMPLETE');

-- CreateTable
CREATE TABLE "client_handovers" (
    "id" TEXT NOT NULL,
    "sale_id" TEXT NOT NULL,
    "customer_id" TEXT NOT NULL,
    "consultant_id" TEXT NOT NULL,
    "cx_lead_id" TEXT,
    "status" "ClientHandoverStatus" NOT NULL DEFAULT 'PENDING_ACK',
    "dossier_complete" BOOLEAN NOT NULL DEFAULT false,
    "dossier_note" TEXT,
    "notified_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "acknowledged_at" TIMESTAMP(3),
    "introduction_logged_at" TIMESTAMP(3),
    "welcome_sent_at" TIMESTAMP(3),
    "quality_score" INTEGER,
    "quality_note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "client_handovers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "client_handovers_sale_id_key" ON "client_handovers"("sale_id");

-- CreateIndex
CREATE INDEX "client_handovers_status_idx" ON "client_handovers"("status");

-- CreateIndex
CREATE INDEX "client_handovers_cx_lead_id_idx" ON "client_handovers"("cx_lead_id");

-- AddForeignKey
ALTER TABLE "client_handovers" ADD CONSTRAINT "client_handovers_sale_id_fkey" FOREIGN KEY ("sale_id") REFERENCES "sales"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_handovers" ADD CONSTRAINT "client_handovers_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_handovers" ADD CONSTRAINT "client_handovers_consultant_id_fkey" FOREIGN KEY ("consultant_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_handovers" ADD CONSTRAINT "client_handovers_cx_lead_id_fkey" FOREIGN KEY ("cx_lead_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
