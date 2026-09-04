-- CreateEnum
CREATE TYPE "ChecklistStepKind" AS ENUM ('PROCESS', 'QUALITY_CHECK');

-- AlterEnum
ALTER TYPE "RelatedEntityType" ADD VALUE 'SITE_VISIT';
ALTER TYPE "RelatedEntityType" ADD VALUE 'SNAGGING_INSPECTION';

-- CreateTable
CREATE TABLE "checklist_templates" (
    "id" TEXT NOT NULL,
    "stage_number" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "goal" TEXT NOT NULL,
    "trigger" TEXT NOT NULL,
    "owner" TEXT NOT NULL,
    "sla" TEXT NOT NULL,
    "is_open_design_item" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "checklist_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "checklist_steps" (
    "id" TEXT NOT NULL,
    "template_id" TEXT NOT NULL,
    "group_label" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "kind" "ChecklistStepKind" NOT NULL,
    "label" TEXT NOT NULL,
    "notification_recipient" TEXT,
    "notification_action" TEXT,

    CONSTRAINT "checklist_steps_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "checklist_runs" (
    "id" TEXT NOT NULL,
    "template_id" TEXT NOT NULL,
    "customer_id" TEXT,
    "related_entity_type" "RelatedEntityType",
    "related_entity_id" TEXT,
    "label" TEXT,
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "started_by" TEXT,
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "checklist_runs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "checklist_step_completions" (
    "id" TEXT NOT NULL,
    "run_id" TEXT NOT NULL,
    "step_id" TEXT NOT NULL,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "completed_at" TIMESTAMP(3),
    "completed_by" TEXT,
    "note" TEXT,

    CONSTRAINT "checklist_step_completions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "checklist_templates_stage_number_key" ON "checklist_templates"("stage_number");

-- CreateIndex
CREATE INDEX "checklist_steps_template_id_idx" ON "checklist_steps"("template_id");

-- CreateIndex
CREATE INDEX "checklist_runs_template_id_idx" ON "checklist_runs"("template_id");

-- CreateIndex
CREATE INDEX "checklist_runs_customer_id_idx" ON "checklist_runs"("customer_id");

-- CreateIndex
CREATE INDEX "checklist_step_completions_run_id_idx" ON "checklist_step_completions"("run_id");

-- CreateIndex
CREATE UNIQUE INDEX "checklist_step_completions_run_id_step_id_key" ON "checklist_step_completions"("run_id", "step_id");

-- AddForeignKey
ALTER TABLE "checklist_steps" ADD CONSTRAINT "checklist_steps_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "checklist_templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "checklist_runs" ADD CONSTRAINT "checklist_runs_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "checklist_templates"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "checklist_runs" ADD CONSTRAINT "checklist_runs_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "checklist_runs" ADD CONSTRAINT "checklist_runs_started_by_fkey" FOREIGN KEY ("started_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "checklist_step_completions" ADD CONSTRAINT "checklist_step_completions_run_id_fkey" FOREIGN KEY ("run_id") REFERENCES "checklist_runs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "checklist_step_completions" ADD CONSTRAINT "checklist_step_completions_step_id_fkey" FOREIGN KEY ("step_id") REFERENCES "checklist_steps"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "checklist_step_completions" ADD CONSTRAINT "checklist_step_completions_completed_by_fkey" FOREIGN KEY ("completed_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
