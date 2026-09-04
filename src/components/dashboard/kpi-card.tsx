import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const TONE_CLASSES = {
  highlight: "bg-highlight/15 text-highlight",
  primary: "bg-primary/10 text-primary",
  success: "bg-success/15 text-success",
  warning: "bg-warning/15 text-warning",
  info: "bg-info/15 text-info",
  destructive: "bg-destructive/15 text-destructive",
} as const;

export type KpiTone = keyof typeof TONE_CLASSES;

export function KpiCard({
  title,
  value,
  changePct,
  changeLabel = "vs. prior 30 days",
  icon: Icon,
  href,
  tone = "highlight",
}: {
  title: string;
  value: string;
  changePct?: number | null;
  changeLabel?: string;
  icon: LucideIcon;
  /** When set, the whole tile drills down to the underlying record list. */
  href?: string;
  /** Icon chip color — vary this per tile so a row of KPIs isn't monochrome. */
  tone?: KpiTone;
}) {
  const hasChange = changePct !== undefined && changePct !== null;
  const isUp = hasChange && changePct >= 0;

  const card = (
    <Card className={cn(href && "transition-colors hover:border-primary/40 hover:bg-accent/40")}>
      <CardContent className="flex items-start justify-between gap-4 p-5">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="mt-1 font-heading text-2xl font-semibold tabular-nums">{value}</p>
          {hasChange && (
            <p
              className={cn(
                "mt-2 flex items-center gap-1 text-xs font-medium",
                isUp ? "text-success" : "text-destructive"
              )}
            >
              {isUp ? <ArrowUpRight className="size-3.5" /> : <ArrowDownRight className="size-3.5" />}
              <span className="sr-only">{isUp ? "Increased" : "Decreased"} by</span>
              {Math.abs(changePct)}%
              <span className="font-normal text-muted-foreground">{changeLabel}</span>
            </p>
          )}
        </div>
        <span className={cn("flex size-9 shrink-0 items-center justify-center rounded-md", TONE_CLASSES[tone])}>
          <Icon className="size-5" aria-hidden="true" />
        </span>
      </CardContent>
    </Card>
  );

  return href ? (
    <Link href={href} className="block" aria-label={`${title}: ${value}`}>
      {card}
    </Link>
  ) : (
    card
  );
}
