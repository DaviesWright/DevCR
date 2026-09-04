import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { NewComplaintForm } from "@/components/cx/new-complaint-form";
import { getComplaintCategories, getCustomerUnitOptions } from "@/lib/queries/cx";
import { getAssignableUsers } from "@/lib/queries/reference";

export default async function NewComplaintPage() {
  const [customerUnits, categories, assignableUsers] = await Promise.all([
    getCustomerUnitOptions(),
    getComplaintCategories(),
    getAssignableUsers(),
  ]);

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <Link href="/cx" className="flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> Back to Customer Experience
      </Link>
      <div>
        <h1 className="font-heading text-2xl font-semibold">Log Complaint</h1>
        <p className="text-sm text-muted-foreground">Capture a client issue and route it for resolution.</p>
      </div>

      <NewComplaintForm customerUnits={customerUnits} categories={categories} assignableUsers={assignableUsers} />
    </div>
  );
}
