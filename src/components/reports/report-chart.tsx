"use client";

import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { ReportResult, ReportChartType } from "@/lib/reports/engine";

const PALETTE = [
  "var(--highlight)",
  "var(--info)",
  "var(--success)",
  "var(--warning)",
  "var(--destructive)",
  "var(--primary)",
];

export function ReportChart({ chartType, result }: { chartType: ReportChartType; result: ReportResult }) {
  if (result.kind === "number" || chartType === "NUMBER") {
    const value = result.kind === "number" ? result.value : result.data.reduce((s, d) => s + d.value, 0);
    return (
      <div className="flex flex-col items-center justify-center py-10">
        <p className="font-heading text-5xl font-semibold tabular-nums text-foreground">{value.toLocaleString()}</p>
        <p className="mt-1 text-sm text-muted-foreground">{result.rowCount} record{result.rowCount === 1 ? "" : "s"}</p>
      </div>
    );
  }

  if (result.data.length === 0) {
    return <p className="py-10 text-center text-sm text-muted-foreground">No data matches this report's filters.</p>;
  }

  // Forces a full remount (not just a re-render) whenever the chart type or underlying data
  // changes — chart geometry can otherwise get stuck if recharts computed it while the
  // container was still mid-layout (e.g. right after a Sheet's slide-in animation).
  const chartKey = `${chartType}-${result.data.map((d) => `${d.name}:${d.value}`).join("|")}`;

  if (chartType === "TABLE") {
    return (
      <div className="rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Group</TableHead>
              <TableHead className="text-right">Value</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {result.data.map((d) => (
              <TableRow key={d.name}>
                <TableCell className="text-sm">{d.name}</TableCell>
                <TableCell className="text-right text-sm font-medium tabular-nums">{d.value.toLocaleString()}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  if (chartType === "LINE") {
    return (
      <ResponsiveContainer key={chartKey} width="100%" height={320} debounce={200}>
        <LineChart data={result.data}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis dataKey="name" tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip />
          <Line type="monotone" dataKey="value" stroke="var(--highlight)" strokeWidth={2} dot={{ r: 3 }} isAnimationActive={false} />
        </LineChart>
      </ResponsiveContainer>
    );
  }

  // BAR (default)
  return (
    <ResponsiveContainer key={chartKey} width="100%" height={320} debounce={200}>
      <BarChart data={result.data}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
        <XAxis dataKey="name" tick={{ fontSize: 12 }} interval={0} angle={-20} textAnchor="end" height={60} />
        <YAxis tick={{ fontSize: 12 }} />
        <Tooltip />
        <Bar dataKey="value" fill={PALETTE[0]} radius={[4, 4, 0, 0]} isAnimationActive={false} />
      </BarChart>
    </ResponsiveContainer>
  );
}
