"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRightCircle,
  CheckCircle2,
  XCircle,
  UserPlus,
  ListPlus,
  Loader2,
  Gauge,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
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
import {
  qualifyLead,
  disqualifyLead,
  assignLead,
  createLeadTask,
  convertLead,
  scoreLead,
  markRealOpportunity,
} from "@/lib/actions/leads";
import { InteractionActionBar } from "@/components/shared/interaction-panel";
import { logInteraction, type InteractionEntityType } from "@/lib/actions/interactions";

type Person = { id: string; name: string };
type UnitOption = { id: string; unitNumber: string; currentPrice: number; currency: string; status: string };

const LOST_REASONS = [
  ["NO_BUDGET", "No budget"],
  ["WRONG_TIMING", "Wrong timing"],
  ["NOT_INTERESTED", "Not interested"],
  ["UNRESPONSIVE", "Unresponsive"],
  ["CHOSE_COMPETITOR", "Chose a competitor"],
  ["WRONG_FIT", "Wrong fit"],
  ["DUPLICATE", "Duplicate lead"],
  ["OTHER", "Other"],
] as const;

function useActionRunner() {
  const router = useRouter();
  const [pending, setPending] = React.useState(false);

  async function run(fn: () => Promise<void>, onDone?: () => void) {
    setPending(true);
    try {
      await fn();
      router.refresh();
      onDone?.();
    } finally {
      setPending(false);
    }
  }

  return { pending, run };
}

export function LeadActionBar({
  leadId,
  status,
  leadCurrency,
  currentUser,
  assignableUsers,
  availableUnits,
}: {
  leadId: string;
  status: string;
  leadCurrency: string;
  currentUser: Person;
  assignableUsers: Person[];
  availableUnits: UnitOption[];
}) {
  const [openDialog, setOpenDialog] = React.useState<
    "task" | "assign" | "disqualify" | "convert" | "score" | "realopp" | null
  >(null);
  const { pending, run } = useActionRunner();
  const router = useRouter();

  const isConverted = status === "CONVERTED";
  const isUnqualified = status === "UNQUALIFIED";
  const entityType: InteractionEntityType = "LEAD";

  async function handleInteractionSubmit(type: string, input: { subject?: string; notes?: string; occurredAt?: string }) {
    await logInteraction(entityType, leadId, { ...input, type, userId: currentUser.id });
    router.refresh();
  }

  return (
    <>
      <div className="flex flex-wrap gap-2">
        <InteractionActionBar onSubmit={handleInteractionSubmit} loggedBy={currentUser.name} />
        <Button variant="outline" size="sm" onClick={() => setOpenDialog("task")}>
          <ListPlus className="size-3.5" /> Create Task
        </Button>
        <Button variant="outline" size="sm" onClick={() => setOpenDialog("assign")}>
          <UserPlus className="size-3.5" /> Assign
        </Button>
        <Button variant="outline" size="sm" onClick={() => setOpenDialog("score")}>
          <Gauge className="size-3.5" /> Score Lead
        </Button>
        {!isConverted && !isUnqualified && (
          <Button
            variant="outline"
            size="sm"
            disabled={pending}
            onClick={() => run(() => qualifyLead(leadId, currentUser.id))}
          >
            {pending ? <Loader2 className="size-3.5 animate-spin" /> : <CheckCircle2 className="size-3.5" />}
            Qualify
          </Button>
        )}
        {!isConverted && !isUnqualified && (
          <Button variant="outline" size="sm" onClick={() => setOpenDialog("disqualify")}>
            <XCircle className="size-3.5" /> Disqualify
          </Button>
        )}
        {status === "QUALIFIED" && (
          <Button variant="outline" size="sm" onClick={() => setOpenDialog("realopp")}>
            <Sparkles className="size-3.5" /> Mark Real Opportunity
          </Button>
        )}
        {!isConverted && (
          <Button variant="highlight" size="sm" onClick={() => setOpenDialog("convert")}>
            <ArrowRightCircle className="size-3.5" /> Convert Lead
          </Button>
        )}
      </div>

      <TaskSheet
        open={openDialog === "task"}
        onOpenChange={(o) => setOpenDialog(o ? "task" : null)}
        leadId={leadId}
        currentUser={currentUser}
        assignableUsers={assignableUsers}
        run={run}
      />
      <AssignSheet
        open={openDialog === "assign"}
        onOpenChange={(o) => setOpenDialog(o ? "assign" : null)}
        assignableUsers={assignableUsers}
        run={run}
        onAssign={(userId) => assignLead(leadId, userId, currentUser.id)}
      />
      <DisqualifySheet
        open={openDialog === "disqualify"}
        onOpenChange={(o) => setOpenDialog(o ? "disqualify" : null)}
        leadId={leadId}
        currentUser={currentUser}
        run={run}
      />
      <ConvertSheet
        open={openDialog === "convert"}
        onOpenChange={(o) => setOpenDialog(o ? "convert" : null)}
        leadId={leadId}
        leadCurrency={leadCurrency}
        currentUser={currentUser}
        availableUnits={availableUnits}
        run={run}
      />
      <ScoreLeadSheet
        open={openDialog === "score"}
        onOpenChange={(o) => setOpenDialog(o ? "score" : null)}
        leadId={leadId}
        currentUser={currentUser}
        run={run}
      />
      <MarkRealOpportunitySheet
        open={openDialog === "realopp"}
        onOpenChange={(o) => setOpenDialog(o ? "realopp" : null)}
        leadId={leadId}
        currentUser={currentUser}
      />
    </>
  );
}

function TaskSheet({
  open,
  onOpenChange,
  leadId,
  currentUser,
  assignableUsers,
  run,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  leadId: string;
  currentUser: Person;
  assignableUsers: Person[];
  run: (fn: () => Promise<void>, onDone?: () => void) => Promise<void>;
}) {
  const [titleVal, setTitleVal] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [dueDate, setDueDate] = React.useState("");
  const [priority, setPriority] = React.useState("MEDIUM");
  const [assignedToId, setAssignedToId] = React.useState(currentUser.id);
  const [pending, setPending] = React.useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!titleVal.trim()) return;
    setPending(true);
    await run(
      () =>
        createLeadTask(leadId, {
          title: titleVal,
          description,
          dueDate: dueDate || undefined,
          priority,
          assignedToId,
          actorId: currentUser.id,
        }),
      () => {
        setTitleVal("");
        setDescription("");
        setDueDate("");
        setPriority("MEDIUM");
        onOpenChange(false);
      }
    );
    setPending(false);
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Create task</SheetTitle>
          <SheetDescription>Add a follow-up task for this lead.</SheetDescription>
        </SheetHeader>
        <form onSubmit={submit} className="mt-6 flex flex-col gap-4">
          <div>
            <Label htmlFor="taskTitle">Title *</Label>
            <Input id="taskTitle" className="mt-1.5" value={titleVal} onChange={(e) => setTitleVal(e.target.value)} required />
          </div>
          <div>
            <Label htmlFor="taskDescription">Description</Label>
            <Textarea id="taskDescription" className="mt-1.5" value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="taskDue">Due date</Label>
              <Input id="taskDue" type="datetime-local" className="mt-1.5" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            </div>
            <div>
              <Label>Priority</Label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger className="mt-1.5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="LOW">Low</SelectItem>
                  <SelectItem value="MEDIUM">Medium</SelectItem>
                  <SelectItem value="HIGH">High</SelectItem>
                  <SelectItem value="CRITICAL">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label>Assign to</Label>
            <Select value={assignedToId} onValueChange={setAssignedToId}>
              <SelectTrigger className="mt-1.5">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {assignableUsers.map((u) => (
                  <SelectItem key={u.id} value={u.id}>
                    {u.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button type="submit" disabled={pending}>
            {pending && <Loader2 className="size-3.5 animate-spin" />} Create task
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}

export function AssignSheet({
  open,
  onOpenChange,
  assignableUsers,
  run,
  onAssign,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  assignableUsers: Person[];
  run: (fn: () => Promise<void>, onDone?: () => void) => Promise<void>;
  onAssign: (userId: string) => Promise<void>;
}) {
  const [userId, setUserId] = React.useState("");
  const [pending, setPending] = React.useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!userId) return;
    setPending(true);
    await run(() => onAssign(userId), () => onOpenChange(false));
    setPending(false);
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Assign</SheetTitle>
          <SheetDescription>Choose who owns this from here on.</SheetDescription>
        </SheetHeader>
        <form onSubmit={submit} className="mt-6 flex flex-col gap-4">
          <div>
            <Label>Sales rep</Label>
            <Select value={userId} onValueChange={setUserId}>
              <SelectTrigger className="mt-1.5">
                <SelectValue placeholder="Select a rep" />
              </SelectTrigger>
              <SelectContent>
                {assignableUsers.map((u) => (
                  <SelectItem key={u.id} value={u.id}>
                    {u.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button type="submit" disabled={pending || !userId}>
            {pending && <Loader2 className="size-3.5 animate-spin" />} Assign
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}

function DisqualifySheet({
  open,
  onOpenChange,
  leadId,
  currentUser,
  run,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  leadId: string;
  currentUser: Person;
  run: (fn: () => Promise<void>, onDone?: () => void) => Promise<void>;
}) {
  const [reason, setReason] = React.useState("");
  const [note, setNote] = React.useState("");
  const [pending, setPending] = React.useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!reason) return;
    setPending(true);
    await run(
      () => disqualifyLead(leadId, { reason, note, actorId: currentUser.id }),
      () => {
        setReason("");
        setNote("");
        onOpenChange(false);
      }
    );
    setPending(false);
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Disqualify lead</SheetTitle>
          <SheetDescription>Capture why — this feeds the lost-reasons report.</SheetDescription>
        </SheetHeader>
        <form onSubmit={submit} className="mt-6 flex flex-col gap-4">
          <div>
            <Label>Reason *</Label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger className="mt-1.5">
                <SelectValue placeholder="Select a reason" />
              </SelectTrigger>
              <SelectContent>
                {LOST_REASONS.map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="disqualifyNote">Additional detail</Label>
            <Textarea id="disqualifyNote" className="mt-1.5" value={note} onChange={(e) => setNote(e.target.value)} />
          </div>
          <Button type="submit" variant="destructive" disabled={pending || !reason}>
            {pending && <Loader2 className="size-3.5 animate-spin" />} Disqualify
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}

function ConvertSheet({
  open,
  onOpenChange,
  leadId,
  leadCurrency,
  currentUser,
  availableUnits,
  run,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  leadId: string;
  leadCurrency: string;
  currentUser: Person;
  availableUnits: UnitOption[];
  run: (fn: () => Promise<void>, onDone?: () => void) => Promise<void>;
}) {
  const [unitId, setUnitId] = React.useState("");
  const [expectedValue, setExpectedValue] = React.useState("");
  const [pending, setPending] = React.useState(false);

  React.useEffect(() => {
    const unit = availableUnits.find((u) => u.id === unitId);
    if (unit) setExpectedValue(String(unit.currentPrice));
  }, [unitId, availableUnits]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const value = parseFloat(expectedValue);
    if (!value || value <= 0) return;
    setPending(true);
    await run(
      () =>
        convertLead(leadId, {
          unitId: unitId || undefined,
          expectedValue: value,
          currency: leadCurrency,
          ownerId: currentUser.id,
        }),
      () => {
        setUnitId("");
        setExpectedValue("");
        onOpenChange(false);
      }
    );
    setPending(false);
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Convert lead</SheetTitle>
          <SheetDescription>Creates an opportunity and marks this lead as converted.</SheetDescription>
        </SheetHeader>
        <form onSubmit={submit} className="mt-6 flex flex-col gap-4">
          <div>
            <Label>Unit (optional)</Label>
            <Select value={unitId} onValueChange={setUnitId}>
              <SelectTrigger className="mt-1.5">
                <SelectValue placeholder="No unit yet" />
              </SelectTrigger>
              <SelectContent>
                {availableUnits.map((u) => (
                  <SelectItem key={u.id} value={u.id}>
                    {u.unitNumber} — {u.currentPrice.toLocaleString()} {u.currency}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="expectedValue">Expected deal value ({leadCurrency}) *</Label>
            <Input
              id="expectedValue"
              type="number"
              min="0"
              step="1000"
              className="mt-1.5"
              value={expectedValue}
              onChange={(e) => setExpectedValue(e.target.value)}
              required
            />
          </div>
          <Button type="submit" variant="highlight" disabled={pending}>
            {pending && <Loader2 className="size-3.5 animate-spin" />} Convert
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}

const BANT_FIELDS = [
  ["budgetScore", "Budget"],
  ["authorityScore", "Authority"],
  ["needScore", "Need"],
  ["timelineScore", "Timeline"],
] as const;

const FIT_ADJUSTMENT_REASONS = [
  "Existing buyer/customer",
  "Referral",
  "Personal knowledge of buyer",
  "Persona-based factor",
  "Other",
] as const;

function ScoreLeadSheet({
  open,
  onOpenChange,
  leadId,
  currentUser,
  run,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  leadId: string;
  currentUser: Person;
  run: (fn: () => Promise<void>, onDone?: () => void) => Promise<void>;
}) {
  const [scores, setScores] = React.useState<Record<(typeof BANT_FIELDS)[number][0], string>>({
    budgetScore: "",
    authorityScore: "",
    needScore: "",
    timelineScore: "",
  });
  const [adjustFit, setAdjustFit] = React.useState(false);
  const [fitValue, setFitValue] = React.useState("");
  const [fitReason, setFitReason] = React.useState<string>(FIT_ADJUSTMENT_REASONS[0]);
  const [notes, setNotes] = React.useState("");
  const [pending, setPending] = React.useState(false);

  const autoFit = Math.round(
    (["budgetScore", "authorityScore", "needScore", "timelineScore"] as const)
      .map((k) => Number(scores[k]) || 0)
      .reduce((a, b) => a + b, 0) / 4
  );

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    await run(
      () =>
        scoreLead(leadId, {
          budgetScore: Number(scores.budgetScore) || 0,
          authorityScore: Number(scores.authorityScore) || 0,
          needScore: Number(scores.needScore) || 0,
          timelineScore: Number(scores.timelineScore) || 0,
          fitOverride: adjustFit ? Number(fitValue) || 0 : undefined,
          fitAdjustmentReason: adjustFit ? fitReason : undefined,
          notes: notes || undefined,
          userId: currentUser.id,
        }),
      () => {
        setScores({ budgetScore: "", authorityScore: "", needScore: "", timelineScore: "" });
        setAdjustFit(false);
        setFitValue("");
        setNotes("");
        onOpenChange(false);
      }
    );
    setPending(false);
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Score lead (BANT+)</SheetTitle>
          <SheetDescription>Rate each pillar 0–10. The total drives qualification status.</SheetDescription>
        </SheetHeader>
        <form onSubmit={submit} className="mt-6 flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            {BANT_FIELDS.map(([key, label]) => (
              <div key={key}>
                <Label htmlFor={key}>{label}</Label>
                <Input
                  id={key}
                  type="number"
                  min="0"
                  max="10"
                  className="mt-1.5"
                  value={scores[key]}
                  onChange={(e) => setScores((prev) => ({ ...prev, [key]: e.target.value }))}
                />
              </div>
            ))}
          </div>

          <div className="rounded-md border border-border p-3">
            <div className="flex items-center justify-between">
              <div>
                <Label>Fit</Label>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Auto-calculated as the average of the four pillars above.
                </p>
              </div>
              <p className="font-heading text-2xl font-semibold tabular-nums">{adjustFit ? Number(fitValue) || 0 : autoFit}</p>
            </div>
            <label className="mt-3 flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={adjustFit}
                onChange={(e) => {
                  setAdjustFit(e.target.checked);
                  if (e.target.checked) setFitValue(String(autoFit));
                }}
              />
              Adjust Fit (existing buyer, referral, persona, etc.)
            </label>
            {adjustFit && (
              <div className="mt-3 grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="fitValue">Adjusted Fit (0–10)</Label>
                  <Input
                    id="fitValue"
                    type="number"
                    min="0"
                    max="10"
                    className="mt-1.5"
                    value={fitValue}
                    onChange={(e) => setFitValue(e.target.value)}
                  />
                </div>
                <div>
                  <Label>Reason</Label>
                  <Select value={fitReason} onValueChange={setFitReason}>
                    <SelectTrigger className="mt-1.5">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {FIT_ADJUSTMENT_REASONS.map((r) => (
                        <SelectItem key={r} value={r}>
                          {r}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </div>

          <div>
            <Label htmlFor="scoreNotes">Notes</Label>
            <Textarea id="scoreNotes" className="mt-1.5" value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
          <Button type="submit" disabled={pending}>
            {pending && <Loader2 className="size-3.5 animate-spin" />} Save score
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}

function MarkRealOpportunitySheet({
  open,
  onOpenChange,
  leadId,
  currentUser,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  leadId: string;
  currentUser: Person;
}) {
  const router = useRouter();
  const [suspectedPersona, setSuspectedPersona] = React.useState("");
  const [suspectedPersonaNote, setSuspectedPersonaNote] = React.useState("");
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  function reset() {
    setSuspectedPersona("");
    setSuspectedPersonaNote("");
    setError(null);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);
    try {
      await markRealOpportunity(leadId, {
        suspectedPersona: suspectedPersona || undefined,
        suspectedPersonaNote: suspectedPersonaNote || undefined,
        actorId: currentUser.id,
      });
      router.refresh();
      reset();
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not mark this lead a Real Opportunity.");
    } finally {
      setPending(false);
    }
  }

  return (
    <Sheet open={open} onOpenChange={(o) => { onOpenChange(o); if (!o) setError(null); }}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Mark Real Opportunity</SheetTitle>
          <SheetDescription>
            Confirms this Qualified lead has shown sustained, real engagement — not just a good score on paper.
          </SheetDescription>
        </SheetHeader>
        <form onSubmit={submit} className="mt-6 flex flex-col gap-4">
          {error && (
            <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          )}
          <div>
            <Label htmlFor="suspectedPersona">Suspected persona</Label>
            <Input
              id="suspectedPersona"
              className="mt-1.5"
              value={suspectedPersona}
              onChange={(e) => setSuspectedPersona(e.target.value)}
              placeholder="e.g. Diaspora investor, first-time buyer..."
            />
          </div>
          <div>
            <Label htmlFor="suspectedPersonaNote">Persona notes</Label>
            <Textarea
              id="suspectedPersonaNote"
              className="mt-1.5"
              value={suspectedPersonaNote}
              onChange={(e) => setSuspectedPersonaNote(e.target.value)}
              placeholder="Signals that led to this read — for Marketing to refine later."
            />
          </div>
          <Button type="submit" variant="highlight" disabled={pending}>
            {pending && <Loader2 className="size-3.5 animate-spin" />} Mark Real Opportunity
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}

