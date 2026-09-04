"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, PlayCircle, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { startChecklistRun } from "@/lib/actions/checklists";
import type { ChecklistTemplateList } from "@/lib/queries/checklists";

type CustomerUnitOption = { customerId: string; unitId: string; label: string };

export function ChecklistTemplatesList({
  templates,
  customerUnits,
  currentUserId,
}: {
  templates: ChecklistTemplateList;
  customerUnits: CustomerUnitOption[];
  currentUserId: string;
}) {
  const [startingTemplateId, setStartingTemplateId] = React.useState<string | null>(null);
  const starting = templates.find((t) => t.id === startingTemplateId) ?? null;

  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
      {templates.map((t) => (
        <Card key={t.id}>
          <CardContent className="flex flex-col gap-2 p-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Tab {t.stageNumber}</p>
                <p className="font-heading text-base font-semibold text-foreground">{t.title}</p>
              </div>
              {t.isOpenDesignItem && (
                <Badge variant="warning">
                  <AlertTriangle className="size-3" /> Open design item
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground">{t.goal}</p>
            <div className="mt-1 flex flex-col gap-0.5 text-xs text-muted-foreground">
              <span>
                <span className="font-medium text-foreground">Owner:</span> {t.owner}
              </span>
              <span>
                <span className="font-medium text-foreground">SLA:</span> {t.sla}
              </span>
              <span>
                {t.stepCount} steps · {t.runCount} run{t.runCount === 1 ? "" : "s"} started
              </span>
            </div>
            <Button variant="outline" size="sm" className="mt-2 w-fit" onClick={() => setStartingTemplateId(t.id)}>
              <PlayCircle className="size-3.5" /> Start Checklist
            </Button>
          </CardContent>
        </Card>
      ))}

      <StartRunSheet
        template={starting}
        customerUnits={customerUnits}
        currentUserId={currentUserId}
        onClose={() => setStartingTemplateId(null)}
      />
    </div>
  );
}

function StartRunSheet({
  template,
  customerUnits,
  currentUserId,
  onClose,
}: {
  template: ChecklistTemplateList[number] | null;
  customerUnits: CustomerUnitOption[];
  currentUserId: string;
  onClose: () => void;
}) {
  const router = useRouter();
  const [customerUnitKey, setCustomerUnitKey] = React.useState("");
  const [label, setLabel] = React.useState("");
  const [pending, setPending] = React.useState(false);

  React.useEffect(() => {
    setCustomerUnitKey("");
    setLabel("");
  }, [template?.id]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!template) return;
    const customerId = customerUnitKey ? customerUnitKey.split(":")[0] : undefined;
    if (!customerId && !label.trim()) return;
    setPending(true);
    const { runId } = await startChecklistRun(template.id, {
      customerId,
      label: label || undefined,
      startedById: currentUserId,
    });
    router.push(`/cx/playbook/runs/${runId}`);
  }

  return (
    <Sheet open={!!template} onOpenChange={(o) => !o && onClose()}>
      <SheetContent>
        {template && (
          <>
            <SheetHeader>
              <SheetTitle>Start: {template.title}</SheetTitle>
              <SheetDescription>Tab {template.stageNumber} · {template.stepCount} steps</SheetDescription>
            </SheetHeader>
            <form onSubmit={submit} className="mt-6 flex flex-col gap-4">
              <div>
                <Label>Customer</Label>
                <Select value={customerUnitKey} onValueChange={setCustomerUnitKey}>
                  <SelectTrigger className="mt-1.5">
                    <SelectValue placeholder="Select a customer (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    {customerUnits.map((cu) => (
                      <SelectItem key={`${cu.customerId}:${cu.unitId}`} value={`${cu.customerId}:${cu.unitId}`}>
                        {cu.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="runLabel">Label (for runs with no single client, e.g. Stage 09 reports)</Label>
                <Input id="runLabel" className="mt-1.5" value={label} onChange={(e) => setLabel(e.target.value)} placeholder="e.g. September 2026 weekly ops report" />
              </div>
              <Button type="submit" disabled={pending || (!customerUnitKey && !label.trim())}>
                {pending && <Loader2 className="size-3.5 animate-spin" />} Start checklist
              </Button>
            </form>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
