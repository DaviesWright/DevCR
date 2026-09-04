import Link from "next/link";
import { ArrowLeft, Clock, TrendingUp, Users2, Wallet, ListChecks, AlertTriangle } from "lucide-react";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency } from "@/lib/utils";
import {
  getAvgTimeToFirstContact,
  getTaskStats,
  getConversionStats,
  getSalespersonActivity,
  getLeadAgeing,
  getLostReasonBreakdown,
  getConversionBySource,
  getBantAverages,
} from "@/lib/queries/lead-analytics";
import { Badge } from "@/components/ui/badge";
import { getRepBookSizes, REP_BOOK_SIZE_CAP } from "@/lib/queries/nurture";

function formatHours(hours: number | null) {
  if (hours === null) return "--";
  if (hours < 1) return `${Math.round(hours * 60)}m`;
  if (hours < 48) return `${hours.toFixed(1)}h`;
  return `${(hours / 24).toFixed(1)}d`;
}

function ageBucketHref(min: number, max: number) {
  const params = new URLSearchParams({ group: "open", ageMin: String(min) });
  if (Number.isFinite(max)) params.set("ageMax", String(max));
  return `/leads?${params.toString()}`;
}

export default async function LeadAnalyticsPage() {
  const [firstContact, tasks, conversion, salespeople, ageing, lostReasons, bySource, bookSizes, bant] = await Promise.all([
    getAvgTimeToFirstContact(),
    getTaskStats(),
    getConversionStats(),
    getSalespersonActivity(),
    getLeadAgeing(),
    getLostReasonBreakdown(),
    getConversionBySource(),
    getRepBookSizes(),
    getBantAverages(),
  ]);

  const maxAgeBucket = Math.max(1, ...ageing.buckets.map((b) => b.count));
  const maxLostReason = Math.max(1, ...lostReasons.map((r) => r.count));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href="/leads" className="flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" /> Back to Leads
        </Link>
        <h1 className="mt-2 font-heading text-2xl font-semibold">Lead Analytics</h1>
        <p className="text-sm text-muted-foreground">Pipeline health and team performance across the leads pipeline.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          title="Avg. time to first contact"
          value={formatHours(firstContact.avgHours)}
          icon={Clock}
        />
        <KpiCard
          title="Conversion rate"
          value={`${conversion.conversionRate.toFixed(1)}%`}
          icon={TrendingUp}
          href="/leads?status=CONVERTED"
        />
        <KpiCard
          title="Leads converted"
          value={`${conversion.convertedLeads} / ${conversion.totalLeads}`}
          icon={Users2}
          href="/leads?status=CONVERTED"
        />
        <KpiCard
          title="Opportunity value from leads"
          value={formatCurrency(conversion.opportunityValueFromLeads)}
          icon={Wallet}
          href="/leads?status=CONVERTED"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard title="Leads → Opportunities" value={String(conversion.leadsConvertedToOpportunities)} icon={ListChecks} tone="success" href="/leads?status=CONVERTED" />
        <KpiCard title="Tasks completed" value={String(tasks.completed)} icon={ListChecks} tone="success" />
        <KpiCard title="Tasks overdue" value={String(tasks.overdue)} icon={AlertTriangle} tone="destructive" />
        <KpiCard title="Leads contacted" value={`${firstContact.contactedCount} / ${firstContact.totalLeads}`} icon={Users2} tone="info" />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Lead ageing (open leads)</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {ageing.totalOpen === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">No open leads right now.</p>
            ) : (
              ageing.buckets.map((b) => (
                <Link
                  key={b.label}
                  href={ageBucketHref(b.min, b.max)}
                  className="flex items-center gap-3 rounded transition-colors hover:bg-accent/40"
                  aria-label={`View ${b.count} open lead${b.count === 1 ? "" : "s"} aged ${b.label}`}
                >
                  <span className="w-24 shrink-0 text-xs font-medium text-muted-foreground">{b.label}</span>
                  <div className="h-6 flex-1 overflow-hidden rounded bg-muted">
                    <div
                      className="h-full rounded bg-primary"
                      style={{ width: `${Math.max(4, (b.count / maxAgeBucket) * 100)}%` }}
                    />
                  </div>
                  <span className="w-8 shrink-0 text-right text-xs font-semibold tabular-nums">{b.count}</span>
                </Link>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Lost / disqualified reasons</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {lostReasons.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">No disqualified leads yet.</p>
            ) : (
              lostReasons.map((r) => (
                <Link
                  key={r.reason}
                  href={`/leads?status=UNQUALIFIED&lostReason=${encodeURIComponent(r.reasonKey)}`}
                  className="flex items-center gap-3 rounded transition-colors hover:bg-accent/40"
                  aria-label={`View ${r.count} lead${r.count === 1 ? "" : "s"} lost to "${r.reason}"`}
                >
                  <span className="w-32 shrink-0 truncate text-xs font-medium text-muted-foreground">{r.reason}</span>
                  <div className="h-6 flex-1 overflow-hidden rounded bg-muted">
                    <div
                      className="h-full rounded bg-destructive"
                      style={{ width: `${Math.max(4, (r.count / maxLostReason) * 100)}%` }}
                    />
                  </div>
                  <span className="w-8 shrink-0 text-right text-xs font-semibold tabular-nums">{r.count}</span>
                </Link>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle>Average BANT+ score (out of 10)</CardTitle>
          {bant.scoredLeadCount > 0 && (
            <Link href="/leads?sort=bantScore&dir=desc" className="text-xs font-medium text-primary hover:underline">
              View scored leads →
            </Link>
          )}
        </CardHeader>
        <CardContent>
          {bant.scoredLeadCount === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">No leads have been BANT-scored yet.</p>
          ) : (
            <>
              <p className="mb-3 text-xs text-muted-foreground">Across the latest assessment for {bant.scoredLeadCount} scored lead{bant.scoredLeadCount === 1 ? "" : "s"}.</p>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-6">
                {(
                  [
                    ["Budget", bant.budget],
                    ["Authority", bant.authority],
                    ["Need", bant.need],
                    ["Timeline", bant.timeline],
                    ["Fit", bant.fit],
                    ["Total", bant.total],
                  ] as const
                ).map(([label, value]) => (
                  <div key={label} className="rounded-md bg-muted px-3 py-2 text-center">
                    <p className="text-lg font-semibold tabular-nums">{value}</p>
                    <p className="text-xs text-muted-foreground">{label}</p>
                  </div>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Conversion by lead source</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Source</TableHead>
                <TableHead className="text-right">Total leads</TableHead>
                <TableHead className="text-right">Converted</TableHead>
                <TableHead className="text-right">Conversion rate</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bySource.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="py-8 text-center text-sm text-muted-foreground">
                    No leads yet.
                  </TableCell>
                </TableRow>
              ) : (
                bySource.map((s) => (
                  <TableRow key={s.source}>
                    <TableCell className="font-medium">
                      <Link href={`/leads?q=${encodeURIComponent(s.source)}`} className="text-primary hover:underline">
                        {s.source}
                      </Link>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{s.total}</TableCell>
                    <TableCell className="text-right tabular-nums">{s.converted}</TableCell>
                    <TableCell className="text-right tabular-nums">{s.rate.toFixed(1)}%</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Salesperson activity</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Salesperson</TableHead>
                <TableHead className="text-right">Leads assigned</TableHead>
                <TableHead className="text-right">Activities logged</TableHead>
                <TableHead className="text-right">Tasks completed</TableHead>
                <TableHead className="text-right">Leads converted</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {salespeople.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-8 text-center text-sm text-muted-foreground">
                    No activity logged yet.
                  </TableCell>
                </TableRow>
              ) : (
                salespeople.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium">
                      <Link href={`/leads?assignedTo=${s.id}`} className="text-primary hover:underline">
                        {s.name}
                      </Link>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{s.leadsAssigned}</TableCell>
                    <TableCell className="text-right tabular-nums">{s.activitiesLogged}</TableCell>
                    <TableCell className="text-right tabular-nums">{s.tasksCompleted}</TableCell>
                    <TableCell className="text-right tabular-nums">{s.leadsConverted}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Rep active book size</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Salesperson</TableHead>
                <TableHead className="text-right">Active leads</TableHead>
                <TableHead className="text-right">Capacity</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bookSizes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="py-8 text-center text-sm text-muted-foreground">
                    No active leads assigned yet.
                  </TableCell>
                </TableRow>
              ) : (
                bookSizes.map((b) => (
                  <TableRow key={b.userId}>
                    <TableCell className="font-medium">
                      <Link href={`/leads?assignedTo=${b.userId}&group=active`} className="text-primary hover:underline">
                        {b.name}
                      </Link>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{b.activeLeads}</TableCell>
                    <TableCell className="text-right">
                      {b.overCapacity ? (
                        <Badge variant="warning">Over {REP_BOOK_SIZE_CAP}-lead cap</Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">of {REP_BOOK_SIZE_CAP}</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
