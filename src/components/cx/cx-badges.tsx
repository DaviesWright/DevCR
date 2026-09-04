import { Badge } from "@/components/ui/badge";

const COMPLAINT_STATUS_VARIANT = {
  OPEN: "info",
  ASSIGNED: "secondary",
  IN_PROGRESS: "warning",
  RESOLVED: "success",
  CLOSED: "outline",
  REOPENED: "destructive",
} as const;

const COMPLAINT_STATUS_LABEL: Record<string, string> = {
  OPEN: "Open",
  ASSIGNED: "Assigned",
  IN_PROGRESS: "In progress",
  RESOLVED: "Resolved",
  CLOSED: "Closed",
  REOPENED: "Reopened",
};

export function ComplaintStatusBadge({ status }: { status: keyof typeof COMPLAINT_STATUS_VARIANT }) {
  return (
    <Badge variant={COMPLAINT_STATUS_VARIANT[status]} dot>
      {COMPLAINT_STATUS_LABEL[status]}
    </Badge>
  );
}

const PRIORITY_VARIANT = {
  LOW: "outline",
  MEDIUM: "secondary",
  HIGH: "warning",
  CRITICAL: "destructive",
} as const;

const PRIORITY_LABEL: Record<string, string> = {
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
  CRITICAL: "Critical",
};

export function PriorityBadge({ priority }: { priority: keyof typeof PRIORITY_VARIANT }) {
  return <Badge variant={PRIORITY_VARIANT[priority]}>{PRIORITY_LABEL[priority] ?? priority}</Badge>;
}

const HANDOVER_STATUS_VARIANT = {
  SCHEDULED: "info",
  INSPECTION_PENDING: "warning",
  COMPLETED: "success",
  CANCELLED: "outline",
} as const;

const HANDOVER_STATUS_LABEL: Record<string, string> = {
  SCHEDULED: "Scheduled",
  INSPECTION_PENDING: "Inspection pending",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

export function HandoverStatusBadge({ status }: { status: keyof typeof HANDOVER_STATUS_VARIANT }) {
  return (
    <Badge variant={HANDOVER_STATUS_VARIANT[status]} dot>
      {HANDOVER_STATUS_LABEL[status]}
    </Badge>
  );
}

export function SlaBadge({ breached }: { breached: boolean }) {
  return breached ? <Badge variant="destructive">SLA breached</Badge> : <Badge variant="success">On track</Badge>;
}
