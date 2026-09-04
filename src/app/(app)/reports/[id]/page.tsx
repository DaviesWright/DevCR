import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ReportDetailView } from "@/components/reports/report-detail";
import { getReportDetail } from "@/lib/queries/reports";
import { getReportableEntities } from "@/lib/reports/schema";
import { getCurrentUser } from "@/lib/queries/reference";

export default async function ReportDetailPage({ params }: { params: { id: string } }) {
  const currentUser = await getCurrentUser();
  const report = await getReportDetail(params.id, currentUser.id);
  if (!report) notFound();
  const entities = getReportableEntities();

  return (
    <div className="flex flex-col gap-6">
      <Link href="/reports" className="flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> Back to Reports
      </Link>
      <h1 className="font-heading text-2xl font-semibold">{report.name}</h1>
      <ReportDetailView report={report} entities={entities} currentUserId={currentUser.id} />
    </div>
  );
}
