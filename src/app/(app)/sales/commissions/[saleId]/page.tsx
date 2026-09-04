import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { MilestoneChecklistView } from "@/components/sales/milestone-checklist";
import { getSaleMilestoneDetail } from "@/lib/queries/commissions";
import { getCurrentUser } from "@/lib/queries/reference";
import { getPermissionProfile } from "@/lib/permissions";
import { formatCurrency } from "@/lib/utils";

export default async function SaleMilestonePage({ params }: { params: { saleId: string } }) {
  const currentUser = await getCurrentUser();
  const profile = await getPermissionProfile(currentUser.id);
  const sale = await getSaleMilestoneDetail(params.saleId, profile);
  if (!sale) notFound();

  return (
    <div className="flex flex-col gap-6">
      <Link
        href="/sales/commissions"
        className="flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Back to Commissions
      </Link>

      <div>
        <h1 className="font-heading text-2xl font-semibold">
          Unit {sale.unitNumber} — {sale.customerName}
        </h1>
        <p className="text-sm text-muted-foreground">
          Sale value {formatCurrency(sale.salePrice, sale.currency)} · complete the milestone checklist to release T1,
          then confirm each instalment to release T2/T3.
        </p>
      </div>

      <MilestoneChecklistView sale={sale} currentUserId={currentUser.id} />
    </div>
  );
}
