import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { LeadDetail } from "@/lib/queries/leads";

function ScoreRing({ score }: { score: number }) {
  const pct = Math.max(0, Math.min(100, score));
  return (
    <div
      className="relative flex size-20 shrink-0 items-center justify-center rounded-full"
      style={{
        background: `conic-gradient(var(--highlight) ${pct * 3.6}deg, var(--muted) 0deg)`,
      }}
    >
      <div className="flex size-16 items-center justify-center rounded-full bg-card">
        <span className="font-heading text-xl font-semibold tabular-nums">{score}</span>
      </div>
    </div>
  );
}

export function EngagementScore({ lead }: { lead: LeadDetail }) {
  const { bantBreakdown, engagement } = lead;

  return (
    <Card>
      <CardContent className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center">
        <div className="flex items-center gap-4">
          <ScoreRing score={lead.bantScore} />
          <div>
            <p className="text-sm font-medium text-muted-foreground">BANT Score</p>
            <p className="text-xs text-muted-foreground">
              {engagement ? `${engagement.level.toLowerCase()} engagement` : "No behavioral data yet"}
            </p>
          </div>
        </div>

        <div className="grid flex-1 grid-cols-2 gap-3 sm:grid-cols-5">
          {(
            [
              ["Budget", bantBreakdown?.budget],
              ["Authority", bantBreakdown?.authority],
              ["Need", bantBreakdown?.need],
              ["Timeline", bantBreakdown?.timeline],
              ["Fit", bantBreakdown?.fit],
            ] as const
          ).map(([label, value]) => (
            <div key={label} className="rounded-md bg-muted px-3 py-2">
              <p className="text-xs font-medium text-muted-foreground">{label}</p>
              <p className={cn("font-heading text-lg font-semibold tabular-nums", value === undefined && "text-muted-foreground")}>
                {value ?? "--"}
              </p>
            </div>
          ))}
        </div>

        {engagement && (
          <div className="grid shrink-0 grid-cols-3 gap-4 text-center sm:border-l sm:border-border sm:pl-5">
            <div>
              <p className="font-heading text-lg font-semibold tabular-nums">{engagement.emailOpens}</p>
              <p className="text-xs text-muted-foreground">Email opens</p>
            </div>
            <div>
              <p className="font-heading text-lg font-semibold tabular-nums">{engagement.siteVisits}</p>
              <p className="text-xs text-muted-foreground">Site visits</p>
            </div>
            <div>
              <p className="font-heading text-lg font-semibold tabular-nums">{engagement.callsCompleted}</p>
              <p className="text-xs text-muted-foreground">Calls</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
