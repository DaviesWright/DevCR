-- AlterTable
ALTER TABLE "checklist_steps" ADD COLUMN     "cross_departmental" JSONB;

-- CreateTable
CREATE TABLE "department_interactions" (
    "id" TEXT NOT NULL,
    "department" TEXT NOT NULL,
    "key_contact" TEXT NOT NULL,
    "interaction_type" TEXT NOT NULL,
    "frequency" TEXT NOT NULL,
    "key_activities" TEXT NOT NULL,
    "order" INTEGER NOT NULL,

    CONSTRAINT "department_interactions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "department_interactions_department_idx" ON "department_interactions"("department");
