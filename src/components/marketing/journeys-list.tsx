"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, Plus, Route, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
import { createMarketingJourney } from "@/lib/actions/marketing";
import { orEmpty } from "@/lib/utils";
import type { getMarketingJourneys, getMarketingSegments } from "@/lib/queries/marketing";

type Journey = Awaited<ReturnType<typeof getMarketingJourneys>>[number];
type SegmentOption = Pick<Awaited<ReturnType<typeof getMarketingSegments>>[number], "id" | "name" | "memberCount">;

const NONE = "__none__";
const ACTION_TYPES = ["SEND_EMAIL", "SEND_SMS", "SEND_WHATSAPP", "WAIT", "CREATE_TASK"];
const STATUS_VARIANT: Record<string, "secondary" | "success" | "warning" | "highlight"> = {
  DRAFT: "secondary",
  ACTIVE: "highlight",
  PAUSED: "warning",
  ARCHIVED: "secondary",
};

type StepDraft = { name: string; actionType: string; body: string; waitHours: string };

function newStep(): StepDraft {
  return { name: "", actionType: "SEND_EMAIL", body: "", waitHours: "" };
}

export function JourneysList({ journeys, segments, currentUserId }: { journeys: Journey[]; segments: SegmentOption[]; currentUserId: string }) {
  const [open, setOpen] = React.useState(false);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex justify-end">
        <Button size="sm" onClick={() => setOpen(true)}>
          <Plus className="size-3.5" /> New journey
        </Button>
      </div>

      {journeys.length === 0 ? (
        <p className="py-10 text-center text-sm text-muted-foreground">
          No journeys yet. There's no background scheduler in this app — journeys run when you enroll a segment or
          manually advance a customer, not on a live clock.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {journeys.map((j) => (
            <Link key={j.id} href={`/marketing/journeys/${j.id}`}>
              <Card className="h-full transition-colors hover:bg-accent/40">
                <CardContent className="flex flex-col gap-2 p-4">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Route className="size-4 text-muted-foreground" />
                      <p className="font-heading text-base font-semibold text-foreground">{j.name}</p>
                    </div>
                    <Badge variant={STATUS_VARIANT[j.status]}>{j.status}</Badge>
                  </div>
                  {j.description && <p className="text-sm text-muted-foreground">{j.description}</p>}
                  <p className="text-xs text-muted-foreground">
                    {j.stepCount} step{j.stepCount === 1 ? "" : "s"} · {j.enrolledCount} enrolled · Segment: {orEmpty(j.segment?.name)}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      <NewJourneySheet open={open} onOpenChange={setOpen} segments={segments} currentUserId={currentUserId} />
    </div>
  );
}

function NewJourneySheet({
  open,
  onOpenChange,
  segments,
  currentUserId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  segments: SegmentOption[];
  currentUserId: string;
}) {
  const router = useRouter();
  const [name, setName] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [segmentId, setSegmentId] = React.useState(NONE);
  const [steps, setSteps] = React.useState<StepDraft[]>([newStep()]);
  const [pending, setPending] = React.useState(false);

  function updateStep(index: number, patch: Partial<StepDraft>) {
    setSteps((prev) => prev.map((s, i) => (i === index ? { ...s, ...patch } : s)));
  }

  function reset() {
    setName("");
    setDescription("");
    setSegmentId(NONE);
    setSteps([newStep()]);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || steps.some((s) => !s.name.trim())) return;
    setPending(true);
    const { journeyId } = await createMarketingJourney({
      name,
      description,
      segmentId: segmentId === NONE ? undefined : segmentId,
      createdById: currentUserId,
      steps: steps.map((s) => ({
        name: s.name,
        actionType: s.actionType,
        actionConfig: s.actionType === "CREATE_TASK" ? { title: s.body } : { body: s.body },
        waitHours: s.actionType === "WAIT" && s.waitHours ? Number(s.waitHours) : undefined,
      })),
    });
    reset();
    setPending(false);
    onOpenChange(false);
    router.push(`/marketing/journeys/${journeyId}`);
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>New journey</SheetTitle>
          <SheetDescription>
            An ordered sequence of steps. Enrolling a segment runs step 1 immediately for each member; advancing a
            customer runs the next step — there's no live scheduler enforcing wait times yet.
          </SheetDescription>
        </SheetHeader>
        <form onSubmit={submit} className="mt-6 flex flex-col gap-4">
          <div>
            <Label htmlFor="journeyName">Name *</Label>
            <Input id="journeyName" className="mt-1.5" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div>
            <Label htmlFor="journeyDescription">Description</Label>
            <Textarea id="journeyDescription" className="mt-1.5" value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <div>
            <Label>Target segment</Label>
            <Select value={segmentId} onValueChange={setSegmentId}>
              <SelectTrigger className="mt-1.5">
                <SelectValue placeholder="Assign later" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE}>None</SelectItem>
                {segments.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name} ({s.memberCount})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-3">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Steps</p>
            {steps.map((step, i) => (
              <div key={i} className="rounded-md border border-border p-3">
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-sm font-medium text-foreground">Step {i + 1}</p>
                  {steps.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      onClick={() => setSteps((prev) => prev.filter((_, idx) => idx !== i))}
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  )}
                </div>
                <div className="flex flex-col gap-3">
                  <Input placeholder="Step name *" value={step.name} onChange={(e) => updateStep(i, { name: e.target.value })} required />
                  <Select value={step.actionType} onValueChange={(v) => updateStep(i, { actionType: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ACTION_TYPES.map((a) => (
                        <SelectItem key={a} value={a}>
                          {a.replace(/_/g, " ")}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {step.actionType === "WAIT" ? (
                    <Input
                      type="number"
                      min="1"
                      placeholder="Wait hours (display only)"
                      value={step.waitHours}
                      onChange={(e) => updateStep(i, { waitHours: e.target.value })}
                    />
                  ) : (
                    <Textarea
                      placeholder={step.actionType === "CREATE_TASK" ? "Task title" : "Message body"}
                      value={step.body}
                      onChange={(e) => updateStep(i, { body: e.target.value })}
                    />
                  )}
                </div>
              </div>
            ))}
            <Button type="button" variant="outline" size="sm" onClick={() => setSteps((prev) => [...prev, newStep()])}>
              <Plus className="size-3.5" /> Add step
            </Button>
          </div>

          <Button type="submit" disabled={pending || !name.trim() || steps.some((s) => !s.name.trim())}>
            {pending && <Loader2 className="size-3.5 animate-spin" />} Create journey
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}
