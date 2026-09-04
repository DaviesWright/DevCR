import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency } from "@/lib/utils";
import type { TopPurchaser } from "@/lib/queries/customers";

const TIER_VARIANT: Record<string, "highlight" | "success" | "info" | "secondary"> = {
  PLATINUM: "highlight",
  PRESTIGE: "success",
  EXECUTIVE: "info",
  PREMIUM: "secondary",
};

export function TopPurchasers({ purchasers }: { purchasers: TopPurchaser[] }) {
  return (
    <div className="rounded-lg border border-border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">Rank</TableHead>
            <TableHead>Customer</TableHead>
            <TableHead>Segment</TableHead>
            <TableHead>Tier</TableHead>
            <TableHead className="text-right">Lifetime value</TableHead>
            <TableHead className="text-right">Sales</TableHead>
            <TableHead className="text-right">Projects</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {purchasers.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="py-10 text-center text-sm text-muted-foreground">
                No confirmed sales yet.
              </TableCell>
            </TableRow>
          ) : (
            purchasers.map((p, i) => (
              <TableRow key={p.id}>
                <TableCell className="font-semibold tabular-nums text-muted-foreground">#{i + 1}</TableCell>
                <TableCell>
                  <Link href={`/customers/${p.id}`} className="font-medium text-foreground hover:underline">
                    {p.name}
                  </Link>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">{p.segment ?? "--"}</TableCell>
                <TableCell>
                  <Badge variant={TIER_VARIANT[p.tier.key]}>
                    {p.tier.icon} {p.tier.label}
                  </Badge>
                </TableCell>
                <TableCell className="text-right font-semibold tabular-nums">{formatCurrency(p.lifetimeValue)}</TableCell>
                <TableCell className="text-right tabular-nums">{p.transactionCount}</TableCell>
                <TableCell className="text-right tabular-nums">{p.developmentCount}</TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
