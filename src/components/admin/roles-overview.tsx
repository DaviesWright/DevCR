import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { getRolesOverview } from "@/lib/queries/roles";

const SCOPE_VARIANT: Record<string, "secondary" | "info" | "warning" | "success" | "highlight"> = {
  OWN: "secondary",
  TEAM: "info",
  DEPARTMENT: "warning",
  ALL: "success",
  SYSTEM: "highlight",
};

export function RolesOverview({ roles }: { roles: Awaited<ReturnType<typeof getRolesOverview>> }) {
  return (
    <div className="rounded-lg border border-border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Role</TableHead>
            <TableHead>Data scope</TableHead>
            <TableHead>Report scope</TableHead>
            <TableHead>Access</TableHead>
            <TableHead>Users</TableHead>
            <TableHead>Field restrictions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {roles.map((r) => (
            <TableRow key={r.id}>
              <TableCell>
                <p className="text-sm font-medium text-foreground">{r.name}</p>
                {r.description && <p className="text-xs text-muted-foreground">{r.description}</p>}
              </TableCell>
              <TableCell>
                <Badge variant={SCOPE_VARIANT[r.dataScope]}>{r.dataScope}</Badge>
              </TableCell>
              <TableCell>
                <Badge variant={SCOPE_VARIANT[r.reportScope]}>{r.reportScope}</Badge>
              </TableCell>
              <TableCell className="text-sm">{r.isReadOnly ? "Read-only" : "Read/write"}</TableCell>
              <TableCell className="text-sm tabular-nums">{r.userCount}</TableCell>
              <TableCell className="text-sm tabular-nums">{r.fieldRestrictionCount || "--"}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
