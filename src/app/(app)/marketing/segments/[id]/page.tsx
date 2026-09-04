import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { SegmentDetailView } from "@/components/marketing/segment-detail";
import { getMarketingSegmentDetail, getCustomersForListPicker } from "@/lib/queries/marketing";

export default async function SegmentDetailPage({ params }: { params: { id: string } }) {
  const segment = await getMarketingSegmentDetail(params.id);
  if (!segment) notFound();
  const customerOptions = await getCustomersForListPicker(params.id);

  return (
    <div className="flex flex-col gap-6">
      <Link href="/marketing" className="flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> Back to Marketing
      </Link>
      <div>
        <h1 className="font-heading text-2xl font-semibold">{segment.name}</h1>
        {segment.description && <p className="mt-1 text-sm text-muted-foreground">{segment.description}</p>}
      </div>
      <SegmentDetailView segment={segment} customerOptions={customerOptions} />
    </div>
  );
}
