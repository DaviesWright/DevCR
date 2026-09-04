import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PaymentScheduleView } from "@/components/payments/payment-schedule-view";
import { getPaymentScheduleForSale } from "@/lib/queries/payments";
import { getCurrentUser } from "@/lib/queries/reference";
import { formatCurrency } from "@/lib/utils";

export default async function SalePaymentSchedulePage({ params }: { params: { saleId: string } }) {
  const [detail, currentUser] = await Promise.all([getPaymentScheduleForSale(params.saleId), getCurrentUser()]);
  if (!detail) notFound();

  return (
    <div className="flex flex-col gap-6">
      <Link href="/payments" className="flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> Back to Payments
      </Link>

      <div>
        <h1 className="font-heading text-2xl font-semibold">
          Unit {detail.unitNumber} — {detail.customerName}
        </h1>
        <p className="text-sm text-muted-foreground">
          {detail.developmentName} · Sale value {formatCurrency(detail.totalAmount, detail.currency)} · Sales agent:{" "}
          {detail.agentName ?? "Unassigned"}
        </p>
      </div>

      <PaymentScheduleView detail={detail} currentUserId={currentUser.id} />
    </div>
  );
}
