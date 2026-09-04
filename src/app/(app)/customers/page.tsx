import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CustomersTable } from "@/components/customers/customers-table";
import { TopPurchasers } from "@/components/customers/top-purchasers";
import { getCustomersList, getTopPurchasers } from "@/lib/queries/customers";
import { getSavedViews } from "@/lib/queries/saved-views";
import { getCurrentUser } from "@/lib/queries/reference";
import { getPermissionProfile } from "@/lib/permissions";

export default async function CustomersPage() {
  const currentUser = await getCurrentUser();
  const profile = await getPermissionProfile(currentUser.id);
  const [customers, topPurchasers, savedViews] = await Promise.all([
    getCustomersList(profile),
    getTopPurchasers(),
    getSavedViews("CUSTOMER", currentUser.id),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-semibold">Customers</h1>
          <p className="text-sm text-muted-foreground">{customers.length} customers — unified profile across leads, sales, and support.</p>
        </div>
        <Button variant="outline" asChild>
          <a href="/api/customers/export">
            <Download className="size-4" /> Export CSV
          </a>
        </Button>
      </div>

      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">All Customers ({customers.length})</TabsTrigger>
          <TabsTrigger value="top">Top Purchasers ({topPurchasers.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="all">
          <CustomersTable customers={customers} savedViews={savedViews} currentUserId={currentUser.id} />
        </TabsContent>
        <TabsContent value="top">
          <p className="mb-3 text-sm text-muted-foreground">
            Ranked by lifetime confirmed-sale value across all developments. Platinum &gt;$1M · Prestige
            $500K–$1M · Executive $200K–$499,999 · Premium &lt;$200K.
          </p>
          <TopPurchasers purchasers={topPurchasers} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
