import { Badge, type BadgeProps } from "@/components/ui/badge";

// Status label/variant now come from the admin-configurable PipelineStage row (see
// src/lib/pipeline/stages.ts) instead of a hardcoded map — callers resolve the lead's stage and
// pass its label/badgeVariant through. `status` (the stage key) is accepted for callers that want
// it on the DOM for testing/debugging but isn't looked up against a static map anymore.
export function LeadStatusBadge({
  status,
  label,
  badgeVariant,
}: {
  status: string;
  label: string;
  badgeVariant: string;
}) {
  return (
    <Badge variant={badgeVariant as BadgeProps["variant"]} dot data-status={status}>
      {label}
    </Badge>
  );
}

const QUALIFICATION_VARIANT = {
  QUALIFIED: "success",
  REVIEW: "warning",
  UNQUALIFIED: "outline",
} as const;

const QUALIFICATION_LABEL: Record<string, string> = {
  QUALIFIED: "Qualified",
  REVIEW: "Needs review",
  UNQUALIFIED: "Unqualified",
};

export function QualificationBadge({ status }: { status: keyof typeof QUALIFICATION_VARIANT }) {
  return <Badge variant={QUALIFICATION_VARIANT[status]}>{QUALIFICATION_LABEL[status]}</Badge>;
}

const SEGMENT_LABEL: Record<string, string> = {
  LOCAL_RESIDENTIAL: "Local Residential",
  DIASPORA: "Diaspora",
  CORPORATE: "Corporate",
  INVESTOR: "Investor",
};

export function SegmentBadge({ segment }: { segment: string }) {
  return <Badge variant="outline">{SEGMENT_LABEL[segment] ?? segment}</Badge>;
}
