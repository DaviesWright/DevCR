import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { MilestoneScheduleTable } from "@/components/payments/milestone-schedule-table";
import { getMilestoneTypeSchedules, MILESTONE_TYPE_LABEL } from "@/lib/queries/payments";
import { formatCurrency } from "@/lib/utils";

export default async function MilestoneTypePage({ params }: { params: { type: string } }) {
  const label = MILESTONE_TYPE_LABEL[params.type];
  if (!label) notFound();

  const rows = await getMilestoneTypeSchedules(params.type);
  const totalDue = rows.reduce((sum, r) => sum + r.amountDue, 0);
  const totalCollected = rows.reduce((sum, r) => sum + r.amountPaid, 0);

  return (
    <div className="flex flex-col gap-6">
      <Link href="/payments" className="flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> Back to Payments
      </Link>

      <div>
        <h1 className="font-heading text-2xl font-semibold">{label}</h1>
        <p className="text-sm text-muted-foreground">
          {rows.length} unit{rows.length === 1 ? "" : "s"} across every project · {formatCurrency(totalCollected)} of{" "}
          {formatCurrency(totalDue)} collected
        </p>
      </div>

      <MilestoneScheduleTable rows={rows} />
    </div>
  );
}
