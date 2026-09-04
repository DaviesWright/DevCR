import Link from "next/link";
import {
  Trophy,
  Award,
  Target,
  Clock,
  AlertTriangle,
  Gauge,
  ArrowLeft,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn, formatCurrency } from "@/lib/utils";
import { getCurrentUser } from "@/lib/queries/reference";
import {
  getLeaderboard,
  getUserGamificationProfile,
  getUserTargetProgress,
  getDealAgingAlerts,
  getTimeToCloseAnalytics,
  getDataQualityScore,
  getPriorityActions,
} from "@/lib/queries/sales-performance";

const PERIODS = [
  { value: "monthly", label: "This Month" },
  { value: "quarterly", label: "This Quarter" },
  { value: "yearly", label: "Year to Date" },
] as const;

function ProgressBar({ pct, className }: { pct: number; className?: string }) {
  return (
    <div className={cn("h-2 w-full overflow-hidden rounded-full bg-muted", className)}>
      <div
        className={cn("h-full rounded-full", pct >= 100 ? "bg-success" : pct >= 60 ? "bg-highlight" : "bg-warning")}
        style={{ width: `${Math.min(pct, 100)}%` }}
      />
    </div>
  );
}

export default async function SalesPerformancePage() {
  const currentUser = await getCurrentUser();

  const [leaderboards, profile, targets, agingAlerts, timeToClose, dataQuality, priorityActions] = await Promise.all([
    Promise.all(PERIODS.map((p) => getLeaderboard(p.value))),
    getUserGamificationProfile(currentUser.id),
    getUserTargetProgress(currentUser.id),
    getDealAgingAlerts(),
    getTimeToCloseAnalytics(),
    getDataQualityScore(),
    getPriorityActions(currentUser.id),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="font-heading text-2xl font-semibold">Sales Performance</h1>
          <p className="text-sm text-muted-foreground">
            Leagues, targets, and analytics — signed in as {currentUser.name}.
          </p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/sales">
            <ArrowLeft className="size-4" /> Pipeline
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-3 p-5">
            <span className="text-3xl">{profile.tier.icon}</span>
            <div>
              <p className="text-sm text-muted-foreground">Current tier</p>
              <p className="font-heading text-lg font-semibold">{profile.tier.name}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground">Total points</p>
            <p className="mt-1 font-heading text-2xl font-semibold tabular-nums">{profile.totalPoints.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground">This month</p>
            <p className="mt-1 font-heading text-2xl font-semibold tabular-nums">{profile.monthPoints.toLocaleString()} pts</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground">Badges earned</p>
            <p className="mt-1 font-heading text-2xl font-semibold tabular-nums">
              {profile.earnedCount}/{profile.totalBadgeCount}
            </p>
            {profile.nextBadge && (
              <p className="mt-1 text-xs text-muted-foreground">
                Next: {profile.nextBadge.icon} {profile.nextBadge.name} — {profile.nextBadge.description}
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="size-5 text-highlight" /> Sales League Leaderboard
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="monthly">
              <TabsList>
                {PERIODS.map((p) => (
                  <TabsTrigger key={p.value} value={p.value}>
                    {p.label}
                  </TabsTrigger>
                ))}
              </TabsList>
              {PERIODS.map((p, i) => (
                <TabsContent key={p.value} value={p.value}>
                  {leaderboards[i].length === 0 ? (
                    <p className="py-6 text-center text-sm text-muted-foreground">No points logged yet this period.</p>
                  ) : (
                    <div className="flex flex-col gap-1.5">
                      {leaderboards[i].map((rep, rank) => (
                        <div
                          key={rep.userId}
                          className={cn(
                            "flex items-center gap-3 rounded-lg p-2.5",
                            rank === 0 && "bg-highlight/10",
                            rep.userId === currentUser.id && "ring-1 ring-primary/40"
                          )}
                        >
                          <span className="w-6 text-center text-sm font-bold text-muted-foreground">#{rank + 1}</span>
                          <div className="flex-1">
                            <p className="text-sm font-medium">{rep.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {rep.tier.icon} {rep.tier.name}
                              {rep.roleName ? ` · ${rep.roleName}` : ""}
                            </p>
                          </div>
                          <span className="text-sm font-semibold tabular-nums">{rep.points.toLocaleString()} pts</span>
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>
              ))}
            </Tabs>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="size-5 text-highlight" /> My Badges
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 gap-2">
              {profile.badges.map((b) => (
                <div
                  key={b.code}
                  title={b.description}
                  className={cn(
                    "flex flex-col items-center gap-1 rounded-lg p-2 text-center",
                    b.earned ? "bg-primary/10" : "opacity-35 grayscale"
                  )}
                >
                  <span className="text-2xl">{b.icon}</span>
                  <span className="text-[10px] font-medium">{b.name}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="size-5" /> My Targets
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {targets.length === 0 ? (
              <p className="text-sm text-muted-foreground">No targets set for the current period.</p>
            ) : (
              targets.map((t) => (
                <div key={t.id}>
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium capitalize">{t.periodType.toLowerCase()}</span>
                    <span className="text-muted-foreground">
                      {t.achievedDeals} / {t.targetDeals} deals
                    </span>
                  </div>
                  <ProgressBar pct={t.progressPct} className="mt-1.5" />
                  <div className="mt-1.5 flex items-center justify-between text-xs text-muted-foreground">
                    <span>{t.daysRemaining}d remaining</span>
                    <Badge variant={t.pace === "ahead" ? "success" : t.pace === "behind" ? "destructive" : "warning"}>
                      {t.pace === "ahead" ? "Ahead" : t.pace === "behind" ? "Behind" : "On track"}
                    </Badge>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {formatCurrency(t.achievedValue, t.currency)} of {formatCurrency(t.targetValue, t.currency)} · projected{" "}
                    {t.projectedDeals} deals
                  </p>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="size-5" /> Time-to-Close
            </CardTitle>
          </CardHeader>
          <CardContent>
            {timeToClose.count === 0 ? (
              <p className="text-sm text-muted-foreground">No closed-won deals yet.</p>
            ) : (
              <>
                <div className="text-center">
                  <p className="font-heading text-3xl font-semibold tabular-nums">{timeToClose.avgDays}</p>
                  <p className="text-sm text-muted-foreground">Average days to close ({timeToClose.count} deals)</p>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                  <div className="rounded-lg bg-success/10 p-2 text-center">
                    <p className="font-bold text-success">{timeToClose.bestDays}</p>
                    <p className="text-xs text-muted-foreground">Best</p>
                  </div>
                  <div className="rounded-lg bg-destructive/10 p-2 text-center">
                    <p className="font-bold text-destructive">{timeToClose.worstDays}</p>
                    <p className="text-xs text-muted-foreground">Worst</p>
                  </div>
                </div>
                {timeToClose.withSiteVisitAvgDays !== null && timeToClose.withoutSiteVisitAvgDays !== null && (
                  <p className="mt-3 text-xs text-muted-foreground">
                    Deals with a site visit close in {timeToClose.withSiteVisitAvgDays}d on average vs.{" "}
                    {timeToClose.withoutSiteVisitAvgDays}d without one.
                  </p>
                )}
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Gauge className="size-5" /> Data Quality
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <p className="font-heading text-3xl font-semibold tabular-nums">{dataQuality.overall}/100</p>
              <p className="text-sm text-muted-foreground">Overall score</p>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
              <div className="rounded-lg bg-muted p-2 text-center">
                <p className="font-bold">{dataQuality.contactsScore}%</p>
                <p className="text-xs text-muted-foreground">Contacts</p>
              </div>
              <div className="rounded-lg bg-muted p-2 text-center">
                <p className="font-bold">{dataQuality.pipelineScore}%</p>
                <p className="text-xs text-muted-foreground">Pipeline</p>
              </div>
            </div>
            {dataQuality.criticalMissing.length > 0 && (
              <ul className="mt-3 space-y-1 text-xs text-muted-foreground">
                {dataQuality.criticalMissing.map((f) => (
                  <li key={f.field}>
                    • {f.field} missing for {f.count} record{f.count === 1 ? "" : "s"} ({f.percentage}%)
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="size-5 text-warning" /> Deal Aging Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            {agingAlerts.length === 0 ? (
              <p className="text-sm text-muted-foreground">No deals stalled 14+ days. Pipeline is moving.</p>
            ) : (
              <div className="flex flex-col gap-2">
                {agingAlerts.slice(0, 8).map((a) => (
                  <div key={a.id} className="flex items-center justify-between rounded-lg border border-border p-2.5 text-sm">
                    <div>
                      <p className="font-medium">{a.customerName}</p>
                      <p className="text-xs text-muted-foreground">
                        {a.stage.replace(/_/g, " ")} · {a.ownerName}
                      </p>
                    </div>
                    <Badge variant={a.severity === "CRITICAL" ? "destructive" : "warning"}>{a.daysInStage}d</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Priority Actions</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div>
              <p className="mb-1.5 text-xs font-semibold uppercase text-destructive">Urgent</p>
              {priorityActions.urgent.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nothing urgent right now.</p>
              ) : (
                <ul className="flex flex-col gap-1.5">
                  {priorityActions.urgent.map((a) => (
                    <li key={a.id}>
                      <Link href={a.href} className="text-sm text-foreground hover:underline">
                        {a.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div>
              <p className="mb-1.5 text-xs font-semibold uppercase text-warning">Important</p>
              {priorityActions.important.length === 0 ? (
                <p className="text-sm text-muted-foreground">No stalled deals in your book.</p>
              ) : (
                <ul className="flex flex-col gap-1.5">
                  {priorityActions.important.map((a) => (
                    <li key={a.id}>
                      <Link href={a.href} className="text-sm text-foreground hover:underline">
                        {a.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
