import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import type { PipelineStage } from "@/lib/queries/dashboard";

export function PipelineFunnel({ stages }: { stages: PipelineStage[] }) {
  const maxCount = Math.max(1, ...stages.map((s) => s.count));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sales pipeline</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {stages.every((s) => s.count === 0) ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No open opportunities yet.
          </p>
        ) : (
          stages.map((s) => (
            <div key={s.label} className="flex items-center gap-3">
              <span className="w-24 shrink-0 text-xs font-medium text-muted-foreground">{s.label}</span>
              <div className="h-6 flex-1 overflow-hidden rounded bg-muted">
                <div
                  className="h-full rounded bg-primary"
                  style={{ width: `${Math.max(4, (s.count / maxCount) * 100)}%` }}
                />
              </div>
              <span className="w-8 shrink-0 text-right text-xs font-semibold tabular-nums">{s.count}</span>
              <span className="w-24 shrink-0 text-right text-xs text-muted-foreground tabular-nums">
                {formatCurrency(s.value)}
              </span>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
