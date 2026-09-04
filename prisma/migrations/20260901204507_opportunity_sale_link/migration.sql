-- AlterTable
ALTER TABLE "sales" ADD COLUMN     "opportunity_id" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "sales_opportunity_id_key" ON "sales"("opportunity_id");

-- AddForeignKey
ALTER TABLE "sales" ADD CONSTRAINT "sales_opportunity_id_fkey" FOREIGN KEY ("opportunity_id") REFERENCES "opportunities"("id") ON DELETE SET NULL ON UPDATE CASCADE;
