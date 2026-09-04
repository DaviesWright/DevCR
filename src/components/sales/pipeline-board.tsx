"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { FileText, Loader2, CheckCircle2, ExternalLink } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn, formatCurrency, relativeTime } from "@/lib/utils";
import { moveOpportunityStage, generateReservationForm } from "@/lib/actions/sales";
import { type PipelineCard } from "@/lib/queries/sales";
import { type StageDTO } from "@/lib/pipeline/stages";

// Fixed, bounded set of Badge variants (see src/components/ui/badge.tsx) mapped to column
// accent colors — not an open-ended map of stage keys, so this stays hardcoded even though
// the stages themselves are now dynamic.
const STAGE_ACCENT: Record<string, string> = {
  default: "border-t-primary",
  secondary: "border-t-muted-foreground/40",
  highlight: "border-t-highlight",
  success: "border-t-success",
  warning: "border-t-warning",
  info: "border-t-info",
  destructive: "border-t-destructive",
  outline: "border-t-border",
};

export function PipelineBoard({
  opportunities,
  currentUserId,
  stages,
}: {
  opportunities: PipelineCard[];
  currentUserId: string;
  stages: StageDTO[];
}) {
  const router = useRouter();
  const [cards, setCards] = React.useState(opportunities);
  const [draggingId, setDraggingId] = React.useState<string | null>(null);
  const [dragOverStageId, setDragOverStageId] = React.useState<string | null>(null);
  const [generatingId, setGeneratingId] = React.useState<string | null>(null);

  React.useEffect(() => setCards(opportunities), [opportunities]);

  const stageMap = React.useMemo(() => new Map(stages.map((s) => [s.id, s])), [stages]);

  async function handleGenerateReservation(opportunityId: string) {
    setGeneratingId(opportunityId);
    try {
      await generateReservationForm(opportunityId, currentUserId);
      router.refresh();
    } finally {
      setGeneratingId(null);
    }
  }

  const byStage = React.useMemo(() => {
    const map = new Map<string, PipelineCard[]>();
    for (const stage of stages) map.set(stage.id, []);
    for (const card of cards) {
      if (card.stageId) map.get(card.stageId)?.push(card);
    }
    return map;
  }, [cards, stages]);

  async function handleDrop(targetStage: StageDTO) {
    setDragOverStageId(null);
    const id = draggingId;
    setDraggingId(null);
    if (!id) return;

    const current = cards.find((c) => c.id === id);
    if (!current || current.stageId === targetStage.id) return;

    // Optimistic move, then persist; refresh reconciles with the server.
    setCards((prev) =>
      prev.map((c) => (c.id === id ? { ...c, stage: targetStage.key as never, stageId: targetStage.id } : c))
    );
    await moveOpportunityStage(id, targetStage.id, currentUserId);
    router.refresh();
  }

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {stages.map((stage) => {
        const stageCards = byStage.get(stage.id) ?? [];
        const stageValue = stageCards.reduce((sum, c) => sum + c.expectedValue, 0);

        return (
          <div
            key={stage.id}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOverStageId(stage.id);
            }}
            onDragLeave={() => setDragOverStageId((s) => (s === stage.id ? null : s))}
            onDrop={(e) => {
              e.preventDefault();
              handleDrop(stage);
            }}
            className={cn(
              "flex w-72 shrink-0 flex-col gap-2 rounded-lg border border-border bg-muted/40 p-2 transition-colors",
              dragOverStageId === stage.id && "border-primary bg-accent"
            )}
          >
            <div className="flex items-center justify-between px-1.5 py-1">
              <span className="text-sm font-semibold text-foreground">{stage.label}</span>
              <span className="text-xs text-muted-foreground">{stageCards.length}</span>
            </div>
            <p className="px-1.5 text-xs text-muted-foreground">{formatCurrency(stageValue)}</p>

            <div className="flex min-h-16 flex-col gap-2">
              {stageCards.map((card) => {
                const cardStage = card.stageId ? stageMap.get(card.stageId) : undefined;
                const isClosed = cardStage ? cardStage.isWonStage || cardStage.isLostStage : false;

                return (
                  <Card
                    key={card.id}
                    draggable
                    onDragStart={() => setDraggingId(card.id)}
                    onDragEnd={() => setDraggingId(null)}
                    className={cn(
                      "cursor-grab border-t-2 shadow-sm active:cursor-grabbing",
                      STAGE_ACCENT[stage.badgeVariant] ?? STAGE_ACCENT.default,
                      draggingId === card.id && "opacity-40"
                    )}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-start justify-between gap-1">
                        <p className="text-sm font-medium text-foreground">{card.customerName}</p>
                        <Link
                          href={`/sales/opportunities/${card.id}`}
                          className="shrink-0 text-muted-foreground hover:text-foreground"
                          title="View opportunity"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <ExternalLink className="size-3.5" />
                        </Link>
                      </div>
                      <p className="text-xs text-muted-foreground">{card.unitNumber ?? "No unit yet"}</p>
                      <div className="mt-2 flex items-center justify-between">
                        <span className="text-sm font-semibold tabular-nums">
                          {formatCurrency(card.expectedValue, card.currency)}
                        </span>
                        <span className="text-xs text-muted-foreground">{card.probability}%</span>
                      </div>
                      <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                        <span>{card.ownerName}</span>
                        <span>{relativeTime(card.updatedAt)}</span>
                      </div>
                      {card.unitId && !isClosed && (
                        <div className="mt-2 border-t border-border pt-2">
                          {card.reservation ? (
                            <span
                              className={cn(
                                "flex items-center gap-1 text-xs",
                                card.reservation.expired ? "text-destructive" : "text-success"
                              )}
                            >
                              <CheckCircle2 className="size-3" />
                              {card.reservation.expired ? "Hold expired" : `Held · ${relativeTime(card.reservation.expiryDate)}`}
                            </span>
                          ) : (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 px-1.5 text-xs"
                              disabled={generatingId === card.id}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleGenerateReservation(card.id);
                              }}
                            >
                              {generatingId === card.id ? (
                                <Loader2 className="size-3 animate-spin" />
                              ) : (
                                <FileText className="size-3" />
                              )}{" "}
                              Generate Reservation Form
                            </Button>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
