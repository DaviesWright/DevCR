import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { DepartmentInteractionSummary } from "@/lib/queries/checklists";

export function DepartmentInteractionsList({ departments }: { departments: DepartmentInteractionSummary[] }) {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      {departments.map((d) => (
        <Card key={d.department}>
          <CardHeader>
            <CardTitle className="text-base">{d.department}</CardTitle>
            <p className="text-xs text-muted-foreground">Key contact: {d.keyContact}</p>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Interaction</TableHead>
                  <TableHead>Frequency</TableHead>
                  <TableHead>Key Activities</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {d.rows.map((r, i) => (
                  <TableRow key={i}>
                    <TableCell className="text-sm font-medium">{r.interactionType}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{r.frequency}</TableCell>
                    <TableCell className="text-sm">{r.keyActivities}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
