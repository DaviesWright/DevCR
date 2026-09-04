-- AlterEnum
ALTER TYPE "WorkflowActionType" ADD VALUE 'SEND_EMAIL';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "WorkflowTriggerEvent" ADD VALUE 'RESERVATION_CREATED';
ALTER TYPE "WorkflowTriggerEvent" ADD VALUE 'MILESTONE_DEPOSIT_CONFIRMED';
ALTER TYPE "WorkflowTriggerEvent" ADD VALUE 'MILESTONE_SPA_SIGNED_CLIENT';
ALTER TYPE "WorkflowTriggerEvent" ADD VALUE 'MILESTONE_SPA_SIGNED_DEVTRACO';
ALTER TYPE "WorkflowTriggerEvent" ADD VALUE 'MILESTONE_UNIT_ALLOCATED';
ALTER TYPE "WorkflowTriggerEvent" ADD VALUE 'HANDOVER_SCHEDULED';
ALTER TYPE "WorkflowTriggerEvent" ADD VALUE 'HANDOVER_COMPLETED';
ALTER TYPE "WorkflowTriggerEvent" ADD VALUE 'COMPLAINT_RESOLVED';
ALTER TYPE "WorkflowTriggerEvent" ADD VALUE 'PAYMENT_RECORDED';
ALTER TYPE "WorkflowTriggerEvent" ADD VALUE 'PAYMENT_OVERDUE';
ALTER TYPE "WorkflowTriggerEvent" ADD VALUE 'LEAD_ASSIGNED';

